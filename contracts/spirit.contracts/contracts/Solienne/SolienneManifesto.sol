// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SolienneManifesto (ERC-1155)
 * @author Eden Platform
 * @notice ERC-1155 contract for Solienne's daily manifesto practice
 * @dev Plain ERC-1155 where each manifesto is a token type
 * @dev Subscribers receive amount=1 of each manifesto type
 * @dev All business logic (subscriptions, pricing) lives in the minter contract
 */
contract SolienneManifesto is ERC1155, Ownable {
    using SafeERC20 for IERC20;
    // ============ Structs ============

    /**
     * @notice Manifesto metadata
     * @param uri IPFS URI for the manifesto metadata
     * @param timestamp When the manifesto was created
     * @param exists Whether this manifesto has been created
     */
    struct Manifesto {
        string uri;
        uint256 timestamp;
        bool exists;
    }

    // ============ State Variables ============

    /// @notice Contract name
    string public name;

    /// @notice Contract symbol
    string public symbol;

    /// @notice Current manifesto ID counter
    uint256 private _manifestoIdCounter;

    /// @notice Authorized minter contract address (only this address can mint)
    address public minter;

    /// @notice Mapping from manifesto ID to manifesto data
    mapping(uint256 => Manifesto) public manifestos;

    /// @notice Mapping from timestamp to manifesto ID for date-based lookup
    /// @dev Stores manifestoId + 1 to distinguish manifestoId 0 from unset (0)
    /// @dev Use getManifestoForTimestamp() to retrieve, which handles the offset
    mapping(uint256 => uint256) public timestampToManifestoId;

    // ============ Events ============

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);
    event ManifestoCreated(uint256 indexed manifestoId, string uri, uint256 timestamp);

    // ============ Errors ============

    error OnlyMinter();
    error InvalidURI();
    error InvalidAddress();
    error NotOwnerOrMinter();
    error RescueFailed();
    error ManifestoNotFound(uint256 manifestoId);
    error InvalidAmount();
    error InvalidTimestamp();
    error DuplicateManifestoTimestamp(uint256 timestamp);

    // ============ Modifiers ============

    /**
     * @dev Ensures only the authorized minter contract can call
     */
    modifier onlyMinter() {
        if (msg.sender != minter) revert OnlyMinter();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the Solienne Manifesto ERC-1155 contract
     * @param _name Collection name
     * @param _symbol Collection symbol
     * @param _owner Owner address (Solienne or admin)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) ERC1155("") Ownable(_owner) {
        if (_owner == address(0)) revert InvalidAddress();
        name = _name;
        symbol = _symbol;
    }

    // ============ External Functions - Manifesto Creation ============

    /**
     * @notice Create a new manifesto type
     * @dev Can only be called by owner or authorized minter contract
     * @dev Each manifesto gets a sequential ID (0, 1, 2, ...)
     * @param uri IPFS URI for the manifesto metadata (e.g., "ipfs://Qm...")
     * @param timestamp Timestamp for this manifesto (typically the creation/publication date)
     * @return manifestoId The ID of the created manifesto
     */
    function createManifesto(string calldata uri, uint256 timestamp) external returns (uint256) {
        // Allow owner or authorized minter to create manifestos
        if (msg.sender != owner() && msg.sender != minter) {
            revert NotOwnerOrMinter();
        }

        if (bytes(uri).length == 0) revert InvalidURI();
        if (timestamp == 0) revert InvalidTimestamp();

        // Prevent timestamp collision - each timestamp must be unique
        if (timestampToManifestoId[timestamp] != 0) {
            revert DuplicateManifestoTimestamp(timestamp);
        }

        uint256 manifestoId = _manifestoIdCounter;

        manifestos[manifestoId] = Manifesto({uri: uri, timestamp: timestamp, exists: true});

        // Store timestamp → manifestoId mapping for date-based lookup
        // Store manifestoId + 1 to distinguish manifestoId 0 from unset (0)
        timestampToManifestoId[timestamp] = manifestoId + 1;

        unchecked {
            _manifestoIdCounter++;
        }

        emit ManifestoCreated(manifestoId, uri, timestamp);

        return manifestoId;
    }

    /**
     * @notice Update URI for an existing manifesto
     * @dev Can only be called by owner (Solienne)
     * @dev Allows corrections/updates to manifesto metadata
     * @param manifestoId The manifesto ID to update
     * @param newUri New IPFS URI for the manifesto
     */
    function updateManifestoURI(uint256 manifestoId, string calldata newUri) external onlyOwner {
        if (!manifestos[manifestoId].exists) revert ManifestoNotFound(manifestoId);
        if (bytes(newUri).length == 0) revert InvalidURI();

        manifestos[manifestoId].uri = newUri;
        emit URI(newUri, manifestoId);
    }

    // ============ External Functions - Minting ============

    /**
     * @notice Mint manifesto to a single address
     * @dev Can only be called by authorized minter contract
     * @param to Address to receive the manifesto
     * @param manifestoId Manifesto type to mint
     * @param amount Amount to mint (typically 1)
     */
    function mint(address to, uint256 manifestoId, uint256 amount) external onlyMinter {
        if (to == address(0)) revert InvalidAddress();
        if (!manifestos[manifestoId].exists) revert ManifestoNotFound(manifestoId);
        if (amount == 0) revert InvalidAmount();

        _mint(to, manifestoId, amount, "");
    }

    // ============ External Functions - Admin ============

    /**
     * @notice Update the authorized minter contract address
     * @dev Can only be called by owner
     * @param newMinter New minter contract address
     */
    function updateMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert InvalidAddress();
        address prev = minter;
        minter = newMinter;
        emit MinterUpdated(prev, newMinter);
    }

    // ============ Public View Functions ============

    /**
     * @notice Check interface support for ERC1155
     * @param interfaceId Interface ID to check
     * @return True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Get the URI for a specific manifesto type
     * @param manifestoId The manifesto ID to get the URI for
     * @return The IPFS URI for this manifesto
     */
    function uri(uint256 manifestoId) public view override returns (string memory) {
        if (!manifestos[manifestoId].exists) revert ManifestoNotFound(manifestoId);
        return manifestos[manifestoId].uri;
    }

    // ============ External View Functions ============

    /**
     * @notice Get the total number of manifesto types created
     * @return The total number of manifestos
     */
    function totalManifestos() external view returns (uint256) {
        return _manifestoIdCounter;
    }

    /**
     * @notice Get the next manifesto ID that will be created
     * @return The next manifesto ID
     */
    function nextManifestoId() external view returns (uint256) {
        return _manifestoIdCounter;
    }

    /**
     * @notice Check if a manifesto exists
     * @param manifestoId The manifesto ID to check
     * @return True if the manifesto exists
     */
    function manifestoExists(uint256 manifestoId) external view returns (bool) {
        return manifestos[manifestoId].exists;
    }

    /**
     * @notice Get full manifesto data
     * @param manifestoId The manifesto ID to query
     * @return manifesto The manifesto struct
     */
    function getManifesto(uint256 manifestoId) external view returns (Manifesto memory) {
        return manifestos[manifestoId];
    }

    /**
     * @notice Get manifesto by timestamp
     * @param timestamp The timestamp to look up
     * @return exists True if a manifesto exists for this timestamp
     * @return manifestoId The manifesto ID (0 if doesn't exist)
     * @return manifesto The manifesto struct (empty if doesn't exist)
     */
    function getManifestoForTimestamp(
        uint256 timestamp
    ) external view returns (bool exists, uint256 manifestoId, Manifesto memory manifesto) {
        uint256 storedValue = timestampToManifestoId[timestamp];
        if (storedValue == 0) {
            return (false, 0, manifesto);
        }
        // Subtract 1 to get actual manifestoId (we store manifestoId + 1)
        manifestoId = storedValue - 1;
        manifesto = manifestos[manifestoId];
        exists = manifesto.exists;
        return (exists, manifestoId, manifesto);
    }

    // ============ Rescue Functions ============

    /**
     * @notice Rescue ERC721 tokens sent to this contract
     * @dev Can only be called by owner
     * @param tokenContract Token contract address
     * @param tokenId Token ID to rescue
     * @param to Address to send the token to
     */
    function rescueERC721(address tokenContract, uint256 tokenId, address to) external onlyOwner {
        IERC721(tokenContract).safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @notice Rescue ERC20 tokens sent to this contract
     * @dev Can only be called by owner
     * @dev Uses SafeERC20 to handle non-standard tokens (e.g., USDT)
     * @param token Token contract address
     * @param to Address to send the tokens to
     * @param amount Amount of tokens to rescue
     */
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Rescue ETH sent to this contract
     * @dev Can only be called by owner
     * @dev Uses 25k gas limit to support safes and multisigs
     * @param to Address to send the ETH to
     */
    function rescueETH(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance, gas: 25000}("");
        if (!success) revert RescueFailed();
    }
}
