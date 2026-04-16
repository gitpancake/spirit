// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SolienneGenesisPortraits
 * @author Eden Platform
 * @notice NFT contract for Solienne Genesis Portraits collection
 * @dev Implements ERC721 with base URI and authorized minter functionality
 *
 * SECURITY FEATURES:
 * - Reentrancy protection on minting functions
 * - Owner and authorized minter roles for controlled access
 * - Batch size limits prevent DOS attacks
 */
contract SolienneGenesisPortraits is ERC721Royalty, Ownable, ReentrancyGuard {
    // ============ Events ============

    event AuthorizedMinterUpdated(address previousMinter, address newMinter);
    event BaseURIUpdated(string previousBaseURI, string newBaseURI);
    event NFTMinted(uint256 indexed tokenId, address indexed recipient);
    event RoyaltyUpdated(address indexed receiver, uint96 indexed feeNumerator);
    event MintingPermanentlyLocked(address indexed lockedBy);

    // ============ Errors ============

    error UnauthorizedMinter(address caller, address authorizedMinter);
    error InvalidRecipient();
    error EmptyBaseURI();
    error InvalidRoyaltyFee();
    error InvalidRoyaltyReceiver();
    error TokenAlreadyMinted(uint256 tokenId);
    error MintingLocked();
    error AlreadyLocked();

    // ============ State Variables ============

    /// @notice Address authorized to mint tokens
    address public authorizedMinter;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Maximum royalty fee (10% = 1000 basis points)
    uint96 public constant MAX_ROYALTY_FEE = 1000;

    /// @notice Irreversible minting lock - once true, minting is permanently disabled
    bool public mintingLocked;

    // ============ Constructor ============

    /**
     * @notice Initializes the SolienneGenesisPortraits NFT contract
     * @param _owner Address that will own the contract
     * @param _authorizedMinter Initial authorized minter address (can be zero)
     * @param baseTokenURI_ Base URI for token metadata
     * @param _royaltyReceiver Address to receive royalty payments
     * @param _royaltyFeeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    constructor(
        address _owner,
        address _authorizedMinter,
        string memory baseTokenURI_,
        address _royaltyReceiver,
        uint96 _royaltyFeeNumerator
    ) ERC721("Solienne Genesis Portraits", "SOLGP") Ownable(_owner) {
        if (bytes(baseTokenURI_).length == 0) revert EmptyBaseURI();
        if (_royaltyReceiver == address(0)) revert InvalidRoyaltyReceiver();
        if (_royaltyFeeNumerator > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();

        authorizedMinter = _authorizedMinter;
        _baseTokenURI = baseTokenURI_;

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
     * @notice Mint a specific token ID to a recipient
     * @dev Can only be called by owner or authorized minter
     * @param recipient The address to receive the NFT
     * @param tokenId The specific token ID to mint
     */
    function mintTo(address recipient, uint256 tokenId) external nonReentrant onlyMinter {
        if (mintingLocked) revert MintingLocked();
        if (recipient == address(0)) revert InvalidRecipient();

        // Check if token is already minted
        if (_ownerOf(tokenId) != address(0)) {
            revert TokenAlreadyMinted(tokenId);
        }

        _safeMint(recipient, tokenId);
        emit NFTMinted(tokenId, recipient);
    }

    /**
     * @notice Mint multiple specific token IDs to a recipient
     * @dev Can only be called by owner or authorized minter
     * @param recipient The address to receive the NFTs
     * @param tokenIds Array of specific token IDs to mint
     */
    function batchMintTo(
        address recipient,
        uint256[] calldata tokenIds
    ) external nonReentrant onlyMinter {
        if (mintingLocked) revert MintingLocked();
        if (recipient == address(0)) revert InvalidRecipient();

        // Validate all tokens are available BEFORE minting any
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            // Check if token is already minted
            if (_ownerOf(tokenId) != address(0)) {
                revert TokenAlreadyMinted(tokenId);
            }
        }

        // All validations passed, now mint all tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            _safeMint(recipient, tokenId);
            emit NFTMinted(tokenId, recipient);
        }
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

    /**
     * @notice Permanently lock minting - IRREVERSIBLE
     * @dev Can only be called by owner. Once locked, no more tokens can ever be minted.
     *      This is typically done once the collection is complete to guarantee scarcity.
     */
    function lockMintingPermanently() external onlyOwner {
        if (mintingLocked) revert AlreadyLocked();
        mintingLocked = true;
        emit MintingPermanentlyLocked(msg.sender);
    }

    // ============ External View Functions ============

    /**
     * @notice Check if a specific token ID has been minted
     * @param tokenId The token ID to check
     * @return True if token has been minted, false otherwise
     */
    function isTokenMinted(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
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
     * @dev Override tokenURI to return baseURI{tokenId}.json format
     * @param tokenId The token ID to get the URI for
     * @return The complete metadata URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory base = _baseURI();
        return
            bytes(base).length > 0 ? string.concat(base, Strings.toString(tokenId), ".json") : "";
    }
}
