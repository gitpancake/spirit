// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISpiritIdentity} from "./interfaces/ISpiritIdentity.sol";

/**
 * @title SpiritIdentityRegistry
 * @author Eden Platform
 * @notice ERC-8004 compliant identity registry for Spirit synthetic artist agents
 * @dev Implements ERC-721 NFTs representing agent identities with EOA linkage
 *
 * ARCHITECTURE:
 * - Each agent is an ERC-721 NFT with a unique ID
 * - Each agent has an EOA (Externally Owned Account) for signing transactions
 * - Each agent is trained by a human artist (artistAddress)
 * - Agents can graduate to autonomy (Phase 4 of Spirit Protocol)
 * - Registration metadata stored onchain + IPFS via tokenURI
 *
 * SECURITY:
 * - Reentrancy protection on all state-changing functions
 * - Owner controls agent registration and graduation
 * - Agent NFTs are freely transferable (standard ERC-721)
 * - EOA mapping prevents duplicate agent EOAs
 */
contract SpiritIdentityRegistry is ERC721URIStorage, Ownable, ReentrancyGuard, ISpiritIdentity {
    // ============ State Variables ============

    /// @notice Counter for agent token IDs
    uint256 private _nextAgentId;

    /// @notice Mapping from agent ID to identity data
    mapping(uint256 => AgentIdentity) private _identities;

    /// @notice Mapping from agent EOA to agent ID
    mapping(address => uint256) private _eoaToAgentId;

    /// @notice Mapping from artist address to array of agent IDs they train
    mapping(address => uint256[]) private _artistAgents;

    /// @notice Total number of registered agents
    uint256 public totalAgents;

    /// @notice Total number of graduated agents
    uint256 public totalGraduated;

    // ============ Constructor ============

    /**
     * @notice Initialize the Spirit Identity Registry
     * @param _owner Address that will own the contract (Spirit Council multisig)
     */
    constructor(address _owner) ERC721("Spirit Agent Identity", "SPIRIT") Ownable(_owner) {
        _nextAgentId = 1; // Start agent IDs from 1
    }

    // ============ External Functions - Registration ============

    /**
     * @notice Register a new agent in the identity registry
     * @dev Only owner (Spirit Council) can register agents during Phase 1 governance
     * @param agentEOA The agent's EOA address (for signing transactions)
     * @param artistAddress The human artist/trainer address
     * @param registrationURI URI to agent's registration metadata
     * @return agentId The newly minted agent token ID
     */
    function registerAgent(
        address agentEOA,
        address artistAddress,
        string calldata registrationURI
    ) external nonReentrant onlyOwner returns (uint256 agentId) {
        if (agentEOA == address(0)) revert InvalidAgentEOA();
        if (artistAddress == address(0)) revert InvalidArtistAddress();
        if (bytes(registrationURI).length == 0) revert EmptyRegistrationURI();

        // Check if EOA is already registered
        if (_eoaToAgentId[agentEOA] != 0) {
            revert AgentAlreadyRegistered(_eoaToAgentId[agentEOA]);
        }

        // Mint agent NFT
        agentId = _nextAgentId++;
        _safeMint(artistAddress, agentId); // Artist initially owns the agent NFT
        _setTokenURI(agentId, registrationURI);

        // Store identity data
        _identities[agentId] = AgentIdentity({
            agentEOA: agentEOA,
            artistAddress: artistAddress,
            registrationURI: registrationURI,
            registeredAt: block.timestamp,
            graduatedAt: 0,
            isActive: true
        });

        // Update mappings
        _eoaToAgentId[agentEOA] = agentId;
        _artistAgents[artistAddress].push(agentId);
        totalAgents++;

        emit AgentRegistered(agentId, agentEOA, artistAddress, registrationURI);

        return agentId;
    }

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

    // ============ External View Functions ============

    /**
     * @notice Get complete identity information for an agent
     * @param agentId The agent's token ID
     * @return identity The complete AgentIdentity struct
     */
    function getAgentIdentity(
        uint256 agentId
    ) external view returns (AgentIdentity memory identity) {
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
