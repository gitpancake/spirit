// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AbrahamFirstWorks
 * @author Eden Platform
 * @notice NFT contract for Abraham First Works collection with controlled minting
 * @dev Implements ERC721 with base URI, max supply, and authorized minter functionality.
 *      All-or-nothing minting: either all requested tokens mint or transaction reverts.
 *
 * SECURITY FEATURES:
 * - All-or-nothing minting prevents duplicate token attacks
 * - Reentrancy protection on minting functions
 * - Owner and authorized minter roles for controlled access
 * - Batch size limits (50) prevent DOS attacks
 * - Immutable max supply prevents supply manipulation
 */
contract AbrahamFirstWorks is ERC721Royalty, Ownable, ReentrancyGuard {
    // ============ Events ============

    event AuthorizedMinterUpdated(address previousMinter, address newMinter);
    event BaseURIUpdated(string previousBaseURI, string newBaseURI);
    event NFTMinted(uint256 indexed tokenId, address indexed recipient);
    event RoyaltyUpdated(address indexed receiver, uint96 indexed feeNumerator);

    // ============ Errors ============

    error MaxSupplyCannotBeZero();
    error EmptyTokenArray();
    error UnauthorizedMinter(address caller, address authorizedMinter);
    error InvalidRecipient();
    error EmptyBaseURI();
    error InvalidRoyaltyFee();
    error InvalidRoyaltyReceiver();
    error ExceedsMaxSupply(uint256 requested, uint256 remaining);
    error BatchSizeTooLarge(uint256 requested, uint256 maximum);
    error TokenAlreadyMinted(uint256 tokenId);
    error InvalidTokenId(uint256 tokenId, uint256 maxSupply);

    // ============ State Variables ============

    /// @notice Maximum number of tokens that can ever be minted (immutable)
    uint256 public immutable maxSupply;

    /// @notice Total number of tokens that have been successfully minted
    uint256 public totalSupply;

    /// @notice Address authorized to mint tokens (e.g., FixedPrice Sale contract)
    address public authorizedMinter;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Maximum royalty fee (10% = 1000 basis points)
    uint96 public constant MAX_ROYALTY_FEE = 1000;

    /// @notice Maximum batch size for minting operations (prevent DOS)
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ============ Constructor ============

    /**
     * @notice Initializes the AbrahamFirstWorks NFT contract
     * @param _name NFT collection name
     * @param _symbol NFT collection symbol
     * @param _owner Address that will own the contract
     * @param _maxSupply Maximum number of tokens that can be minted (immutable)
     * @param _authorizedMinter Initial authorized minter address (can be zero)
     * @param baseTokenURI_ Base URI for token metadata
     * @param _royaltyReceiver Address to receive royalty payments
     * @param _royaltyFeeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner,
        uint256 _maxSupply,
        address _authorizedMinter,
        string memory baseTokenURI_,
        address _royaltyReceiver,
        uint96 _royaltyFeeNumerator
    ) ERC721(_name, _symbol) Ownable(_owner) {
        if (_maxSupply == 0) revert MaxSupplyCannotBeZero();
        if (bytes(baseTokenURI_).length == 0) revert EmptyBaseURI();
        if (_royaltyReceiver == address(0)) revert InvalidRoyaltyReceiver();
        if (_royaltyFeeNumerator > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();

        maxSupply = _maxSupply;
        authorizedMinter = _authorizedMinter;
        _baseTokenURI = baseTokenURI_;
        totalSupply = 0;

        // Set default royalty for all tokens
        _setDefaultRoyalty(_royaltyReceiver, _royaltyFeeNumerator);

        emit AuthorizedMinterUpdated(address(0), _authorizedMinter);
        emit BaseURIUpdated("", baseTokenURI_);
        emit RoyaltyUpdated(_royaltyReceiver, _royaltyFeeNumerator);
    }

    // ============ Modifiers ============

    /**
     * @dev Ensures only owner or authorized minter can call the function
     */
    modifier onlyMinter() {
        if (msg.sender != owner() && msg.sender != authorizedMinter) {
            revert UnauthorizedMinter(msg.sender, authorizedMinter);
        }
        _;
    }

    // ============ External Functions - Minting ============

    /**
     * @notice Mint specific token IDs to a recipient
     * @dev Can only be called by owner or authorized minter. All-or-nothing minting.
     * @param recipient The address to receive the NFTs
     * @param tokenIds Array of specific token IDs to mint
     * @return mintedTokenIds Array of successfully minted token IDs (same as input on success)
     */
    function mintTo(
        address recipient,
        uint256[] calldata tokenIds
    ) external nonReentrant onlyMinter returns (uint256[] memory mintedTokenIds) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (tokenIds.length == 0) revert EmptyTokenArray();
        if (tokenIds.length > MAX_BATCH_SIZE)
            revert BatchSizeTooLarge(tokenIds.length, MAX_BATCH_SIZE);

        // Check if we have enough remaining supply
        if (totalSupply + tokenIds.length > maxSupply) {
            revert ExceedsMaxSupply(tokenIds.length, maxSupply - totalSupply);
        }

        // Validate all tokens are available BEFORE minting any
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            // Check if token ID is valid
            if (tokenId >= maxSupply) {
                revert InvalidTokenId(tokenId, maxSupply);
            }

            // Check if token is already minted
            if (_ownerOf(tokenId) != address(0)) {
                revert TokenAlreadyMinted(tokenId);
            }
        }

        // All validations passed, now mint all tokens
        mintedTokenIds = new uint256[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            _safeMint(recipient, tokenId);
            mintedTokenIds[i] = tokenId;
            emit NFTMinted(tokenId, recipient);
        }

        // Update total supply counter
        totalSupply += tokenIds.length;

        return mintedTokenIds;
    }

    // ============ External Functions - Owner Only ============

    /**
     * @notice Update the authorized minter address
     * @dev Can only be called by owner
     * @param _authorizedMinter New authorized minter address (can be zero to disable)
     */
    function updateAuthorizedMinter(address _authorizedMinter) external onlyOwner {
        address previousMinter = authorizedMinter;
        authorizedMinter = _authorizedMinter;

        emit AuthorizedMinterUpdated(previousMinter, _authorizedMinter);
    }

    /**
     * @notice Update the base URI for token metadata
     * @dev Can only be called by owner
     * @param newBaseURI New base URI for tokens
     */
    function updateBaseURI(string calldata newBaseURI) external onlyOwner {
        if (bytes(newBaseURI).length == 0) revert EmptyBaseURI();
        string memory previousBaseURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;

        emit BaseURIUpdated(previousBaseURI, newBaseURI);
    }

    /**
     * @notice Update the collection royalty information
     * @dev Can only be called by owner
     * @param receiver Address to receive royalty payments
     * @param feeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function updateRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        if (receiver == address(0)) revert InvalidRoyaltyReceiver();
        if (feeNumerator > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();

        _setDefaultRoyalty(receiver, feeNumerator);
        emit RoyaltyUpdated(receiver, feeNumerator);
    }

    /**
     * @notice Remove royalty information for the entire collection
     * @dev Can only be called by owner
     */
    function deleteRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
        emit RoyaltyUpdated(address(0), 0);
    }

    // ============ External View Functions ============

    /**
     * @notice Get remaining tokens that can be minted
     * @return Number of tokens that can still be minted
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply;
    }

    /**
     * @notice Check if the maximum supply has been reached
     * @return True if max supply reached, false otherwise
     */
    function isMaxSupplyReached() external view returns (bool) {
        return totalSupply >= maxSupply;
    }

    /**
     * @notice Check if a specific token ID has been minted
     * @param tokenId The token ID to check
     * @return True if token has been minted, false otherwise
     */
    function isTokenMinted(uint256 tokenId) external view returns (bool) {
        if (tokenId >= maxSupply) return false;
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Check if multiple token IDs are available for minting
     * @param tokenIds Array of token IDs to check
     * @return available Array of booleans indicating availability
     */
    function areTokensAvailable(
        uint256[] calldata tokenIds
    ) external view returns (bool[] memory available) {
        available = new bool[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            available[i] = tokenId < maxSupply && _ownerOf(tokenId) == address(0);
        }
        return available;
    }

    // ============ Public View Functions ============

    /**
     * @notice Get the base URI for tokens
     * @return The base URI string
     */
    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    // ============ Internal Override Functions ============

    /**
     * @dev Override _baseURI to return the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override supportsInterface to include EIP-2981
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override tokenURI to return baseURI/tokenId.json format
     * @param tokenId The token ID to get the URI for
     * @return The complete metadata URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory base = _baseURI();
        return
            bytes(base).length > 0
                ? string.concat(base, "/", Strings.toString(tokenId), ".json")
                : "";
    }
}
