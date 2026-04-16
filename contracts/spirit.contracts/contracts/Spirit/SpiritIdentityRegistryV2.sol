// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ISpiritIdentity} from "./interfaces/ISpiritIdentity.sol";

/**
 * @title SpiritIdentityRegistryV2
 * @author Eden Platform
 * @notice ERC-8004 compliant identity registry with Safe multisig support and EIP-712 signatures
 * @dev Enhanced version supporting Safe ownership and agent signature verification
 *
 * ARCHITECTURE:
 * - Each agent is an ERC-721 NFT with a unique ID
 * - NFT owned by Safe multisig (agent EOA + artist as signers)
 * - Agent EOA can sign messages independently for verification
 * - EIP-712 structured data signing for JSON messages
 * - Nonce-based replay protection for signatures
 *
 * SECURITY:
 * - Reentrancy protection on all state-changing functions
 * - Owner controls agent registration and graduation
 * - Agent NFTs are freely transferable (standard ERC-721)
 * - EOA mapping prevents duplicate agent EOAs
 * - Signature replay protection via nonces
 */
contract SpiritIdentityRegistryV2 is
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    EIP712,
    ISpiritIdentity
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice Counter for agent token IDs
    uint256 private _nextAgentId;

    /// @notice Extended identity data with Safe address
    struct AgentIdentityV2 {
        address agentEOA; // Agent's signing wallet
        address artistAddress; // Human trainer/artist
        address safeAddress; // Safe multisig owning the NFT
        string registrationURI; // Metadata URI
        uint256 registeredAt; // Registration timestamp
        uint256 graduatedAt; // Graduation timestamp (0 if not graduated)
        bool isActive; // Active status
        uint256 nonce; // For signature replay protection
    }

    /// @notice Mapping from agent ID to identity data
    mapping(uint256 => AgentIdentityV2) private _identities;

    /// @notice Mapping from agent EOA to agent ID
    mapping(address => uint256) private _eoaToAgentId;

    /// @notice Mapping from artist address to array of agent IDs they train
    mapping(address => uint256[]) private _artistAgents;

    /// @notice Total number of registered agents
    uint256 public totalAgents;

    /// @notice Total number of graduated agents
    uint256 public totalGraduated;

    // ============ EIP-712 Type Hashes ============

    bytes32 public constant AGENT_CLAIM_TYPEHASH =
        keccak256("AgentClaim(uint256 agentId,string statement,uint256 timestamp,uint256 nonce)");

    bytes32 public constant AGENT_VERIFICATION_TYPEHASH =
        keccak256("AgentVerification(uint256 agentId,address agentEOA,uint256 nonce)");

    // ============ Events (Extended) ============

    event AgentRegisteredV2(
        uint256 indexed agentId,
        address indexed agentEOA,
        address indexed artistAddress,
        address safeAddress,
        string registrationURI
    );

    event AgentSignatureVerified(
        uint256 indexed agentId,
        address indexed verifier,
        bytes32 messageHash
    );

    // ============ Constructor ============

    /**
     * @notice Initialize the Spirit Identity Registry V2
     * @param _owner Address that will own the contract (Spirit Council multisig)
     */
    constructor(
        address _owner
    )
        ERC721("Spirit Agent Identity", "SPIRIT")
        Ownable(_owner)
        EIP712("SpiritIdentityRegistry", "2.0.0")
    {
        _nextAgentId = 1; // Start agent IDs from 1
    }

    // ============ External Functions - Registration ============

    /**
     * @notice Register a new agent with Safe multisig support
     * @dev Only owner can register agents. NFT minted to Safe address
     * @param agentEOA The agent's EOA address (for signing transactions)
     * @param artistAddress The human artist/trainer address
     * @param safeAddress The Safe multisig address (will own the NFT)
     * @param registrationURI URI to agent's registration metadata
     * @return agentId The newly minted agent token ID
     */
    function registerAgentWithSafe(
        address agentEOA,
        address artistAddress,
        address safeAddress,
        string calldata registrationURI
    ) public nonReentrant onlyOwner returns (uint256 agentId) {
        if (agentEOA == address(0)) revert InvalidAgentEOA();
        if (artistAddress == address(0)) revert InvalidArtistAddress();
        if (safeAddress == address(0)) revert("InvalidSafeAddress");
        if (bytes(registrationURI).length == 0) revert EmptyRegistrationURI();

        // Check if EOA is already registered
        if (_eoaToAgentId[agentEOA] != 0) {
            revert AgentAlreadyRegistered(_eoaToAgentId[agentEOA]);
        }

        // Mint agent NFT to Safe
        agentId = _nextAgentId++;
        _safeMint(safeAddress, agentId);
        _setTokenURI(agentId, registrationURI);

        // Store extended identity data
        _identities[agentId] = AgentIdentityV2({
            agentEOA: agentEOA,
            artistAddress: artistAddress,
            safeAddress: safeAddress,
            registrationURI: registrationURI,
            registeredAt: block.timestamp,
            graduatedAt: 0,
            isActive: true,
            nonce: 0
        });

        // Update mappings
        _eoaToAgentId[agentEOA] = agentId;
        _artistAgents[artistAddress].push(agentId);
        totalAgents++;

        emit AgentRegisteredV2(agentId, agentEOA, artistAddress, safeAddress, registrationURI);
        emit AgentRegistered(agentId, agentEOA, artistAddress, registrationURI);

        return agentId;
    }

    /**
     * @notice Legacy registration function (ISpiritIdentity compatibility)
     * @dev Mints to artist address (not recommended for Safe setup)
     * @dev This satisfies the ISpiritIdentity interface
     */
    function registerAgent(
        address agentEOA,
        address artistAddress,
        string calldata registrationURI
    ) external nonReentrant onlyOwner returns (uint256 agentId) {
        // Use artist address as Safe address for backwards compatibility
        return this.registerAgentWithSafe(agentEOA, artistAddress, artistAddress, registrationURI);
    }

    // ============ Signature Verification Functions ============

    /**
     * @notice Verify an agent's signature on a message
     * @param agentId The agent's token ID
     * @param messageHash The hash of the message signed
     * @param signature The signature to verify
     * @return valid True if signature is valid
     */
    function verifyAgentSignature(
        uint256 agentId,
        bytes32 messageHash,
        bytes memory signature
    ) external view returns (bool valid) {
        _requireAgentExists(agentId);

        address agentEOA = _identities[agentId].agentEOA;
        address signer = messageHash.toEthSignedMessageHash().recover(signature);

        return signer == agentEOA;
    }

    /**
     * @notice Verify an EIP-712 structured agent claim
     * @param agentId The agent's token ID
     * @param statement The statement being claimed
     * @param timestamp The timestamp of the claim
     * @param signature The signature to verify
     * @return valid True if signature is valid and nonce is correct
     */
    function verifyAgentClaim(
        uint256 agentId,
        string calldata statement,
        uint256 timestamp,
        bytes memory signature
    ) external returns (bool valid) {
        _requireAgentExists(agentId);

        uint256 currentNonce = _identities[agentId].nonce;

        bytes32 structHash = keccak256(
            abi.encode(
                AGENT_CLAIM_TYPEHASH,
                agentId,
                keccak256(bytes(statement)),
                timestamp,
                currentNonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        if (signer == _identities[agentId].agentEOA) {
            _identities[agentId].nonce++;
            emit AgentSignatureVerified(agentId, msg.sender, digest);
            return true;
        }

        return false;
    }

    /**
     * @notice Verify agent control with EIP-712 signature
     * @param agentId The agent's token ID
     * @param signature The signature to verify
     * @return valid True if agent has control of their EOA
     */
    function verifyAgentControl(
        uint256 agentId,
        bytes memory signature
    ) external returns (bool valid) {
        _requireAgentExists(agentId);

        AgentIdentityV2 storage identity = _identities[agentId];

        bytes32 structHash = keccak256(
            abi.encode(AGENT_VERIFICATION_TYPEHASH, agentId, identity.agentEOA, identity.nonce)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        if (signer == identity.agentEOA) {
            identity.nonce++;
            emit AgentSignatureVerified(agentId, msg.sender, digest);
            return true;
        }

        return false;
    }

    /**
     * @notice Get current nonce for an agent (for signature generation)
     * @param agentId The agent's token ID
     * @return nonce Current nonce value
     */
    function getAgentNonce(uint256 agentId) external view returns (uint256 nonce) {
        _requireAgentExists(agentId);
        return _identities[agentId].nonce;
    }

    /**
     * @notice Get the Safe address for an agent
     * @param agentId The agent's token ID
     * @return safeAddress The Safe multisig address
     */
    function getAgentSafeAddress(uint256 agentId) external view returns (address safeAddress) {
        _requireAgentExists(agentId);
        return _identities[agentId].safeAddress;
    }

    // ============ Existing Functions Updated ============

    /**
     * @notice Update agent's metadata URI
     * @dev Only callable by agent's artist or owner
     * @param agentId The agent's token ID
     * @param newURI New metadata URI
     */
    function updateAgentMetadata(uint256 agentId, string calldata newURI) external nonReentrant {
        if (bytes(newURI).length == 0) revert EmptyRegistrationURI();
        _requireAgentExists(agentId);
        _requireAuthorized(agentId);

        _setTokenURI(agentId, newURI);
        _identities[agentId].registrationURI = newURI;

        emit AgentMetadataUpdated(agentId, newURI);
    }

    /**
     * @notice Update agent's EOA address
     * @dev Only callable by owner (for security - EOA is critical)
     * @param agentId The agent's token ID
     * @param newEOA New agent EOA address
     */
    function updateAgentEOA(uint256 agentId, address newEOA) external nonReentrant onlyOwner {
        if (newEOA == address(0)) revert InvalidAgentEOA();
        _requireAgentExists(agentId);

        // Check if new EOA is already registered
        if (_eoaToAgentId[newEOA] != 0 && _eoaToAgentId[newEOA] != agentId) {
            revert AgentAlreadyRegistered(_eoaToAgentId[newEOA]);
        }

        address oldEOA = _identities[agentId].agentEOA;

        // Update mappings
        delete _eoaToAgentId[oldEOA];
        _eoaToAgentId[newEOA] = agentId;
        _identities[agentId].agentEOA = newEOA;

        // Reset nonce for new EOA
        _identities[agentId].nonce = 0;

        emit AgentEOAUpdated(agentId, oldEOA, newEOA);
    }

    /**
     * @notice Mark an agent as graduated (autonomous)
     * @dev Only callable by owner. Graduation is one-way (cannot be undone)
     * @param agentId The agent's token ID
     */
    function graduateAgent(uint256 agentId) external nonReentrant onlyOwner {
        _requireAgentExists(agentId);

        if (_identities[agentId].graduatedAt != 0) {
            revert AgentAlreadyGraduated(agentId);
        }

        _identities[agentId].graduatedAt = block.timestamp;
        totalGraduated++;

        emit AgentGraduated(agentId, block.timestamp);
    }

    /**
     * @notice Deactivate an agent
     * @dev Only callable by owner
     * @param agentId The agent's token ID
     */
    function deactivateAgent(uint256 agentId) external nonReentrant onlyOwner {
        _requireAgentExists(agentId);
        _identities[agentId].isActive = false;
    }

    /**
     * @notice Reactivate a deactivated agent
     * @dev Only callable by owner
     * @param agentId The agent's token ID
     */
    function reactivateAgent(uint256 agentId) external nonReentrant onlyOwner {
        _requireAgentExists(agentId);
        _identities[agentId].isActive = true;
    }

    // ============ External View Functions (Backwards Compatible) ============

    /**
     * @notice Get complete identity information for an agent
     * @param agentId The agent's token ID
     * @return identity The AgentIdentity struct (legacy format)
     */
    function getAgentIdentity(
        uint256 agentId
    ) external view returns (AgentIdentity memory identity) {
        _requireAgentExists(agentId);
        AgentIdentityV2 memory v2Identity = _identities[agentId];

        return
            AgentIdentity({
                agentEOA: v2Identity.agentEOA,
                artistAddress: v2Identity.artistAddress,
                registrationURI: v2Identity.registrationURI,
                registeredAt: v2Identity.registeredAt,
                graduatedAt: v2Identity.graduatedAt,
                isActive: v2Identity.isActive
            });
    }

    /**
     * @notice Get extended identity information for an agent
     * @param agentId The agent's token ID
     * @return identity The complete AgentIdentityV2 struct
     */
    function getAgentIdentityV2(
        uint256 agentId
    ) external view returns (AgentIdentityV2 memory identity) {
        _requireAgentExists(agentId);
        return _identities[agentId];
    }

    /**
     * @notice Get agent's EOA address
     * @param agentId The agent's token ID
     * @return The agent's EOA address
     */
    function getAgentEOA(uint256 agentId) external view returns (address) {
        _requireAgentExists(agentId);
        return _identities[agentId].agentEOA;
    }

    /**
     * @notice Get agent's artist/trainer address
     * @param agentId The agent's token ID
     * @return The artist's address
     */
    function getArtistAddress(uint256 agentId) external view returns (address) {
        _requireAgentExists(agentId);
        return _identities[agentId].artistAddress;
    }

    /**
     * @notice Check if an agent has graduated
     * @param agentId The agent's token ID
     * @return True if agent has graduated
     */
    function hasGraduated(uint256 agentId) external view returns (bool) {
        _requireAgentExists(agentId);
        return _identities[agentId].graduatedAt != 0;
    }

    /**
     * @notice Check if an agent is active
     * @param agentId The agent's token ID
     * @return True if agent is active
     */
    function isAgentActive(uint256 agentId) external view returns (bool) {
        _requireAgentExists(agentId);
        return _identities[agentId].isActive;
    }

    /**
     * @notice Find agent ID by their EOA address
     * @param agentEOA The agent's EOA address
     * @return agentId The agent's token ID (0 if not found)
     */
    function getAgentIdByEOA(address agentEOA) external view returns (uint256 agentId) {
        return _eoaToAgentId[agentEOA];
    }

    /**
     * @notice Get all agents trained by an artist
     * @param artistAddress The artist's address
     * @return agentIds Array of agent token IDs
     */
    function getAgentsByArtist(
        address artistAddress
    ) external view returns (uint256[] memory agentIds) {
        return _artistAgents[artistAddress];
    }

    // ============ Public View Functions ============

    /**
     * @notice Get the next agent ID that will be minted
     * @return The next agent ID
     */
    function nextAgentId() public view returns (uint256) {
        return _nextAgentId;
    }

    /**
     * @notice Check if an agent exists
     * @param agentId The agent's token ID
     * @return True if agent exists
     */
    function agentExists(uint256 agentId) public view returns (bool) {
        return agentId > 0 && agentId < _nextAgentId && _ownerOf(agentId) != address(0);
    }

    // ============ Internal Functions ============

    /**
     * @dev Require that an agent exists
     * @param agentId The agent's token ID
     */
    function _requireAgentExists(uint256 agentId) internal view {
        if (!agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }
    }

    /**
     * @dev Require that caller is authorized (owner or agent's artist)
     * @param agentId The agent's token ID
     */
    function _requireAuthorized(uint256 agentId) internal view {
        address artist = _identities[agentId].artistAddress;
        if (msg.sender != owner() && msg.sender != artist) {
            revert UnauthorizedCaller(msg.sender);
        }
    }

    /**
     * @dev Override supportsInterface to include ERC721URIStorage
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
