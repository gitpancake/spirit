// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SolienneOriginSeries
 * @author Eden Platform
 * @notice NFT contract for Solienne Origin Series collection
 * @dev Implements ERC721 with specific token ID minting and edition mapping
 *
 * EDITION SYSTEM:
 * - 9 unique pieces (1.json - 9.json metadata files)
 * - 5 editions per piece (45 total tokens: tokenIds 0-44)
 * - Token mapping: 0-4→1.json, 5-9→2.json, ..., 40-44→9.json
 *
 * FEATURES:
 * - Specific token ID minting (owner can mint any tokenId 0-44)
 * - Owner-only minting (no separate minter contract)
 * - Permanent minting lock to guarantee final supply
 * - EIP-2981 royalty support (max 10%)
 * - External metadata on IPFS/Supabase
 * - Helper functions to query edition info
 *
 * SECURITY FEATURES:
 * - Reentrancy protection on minting functions
 * - Owner-only access control for minting
 * - Irreversible minting lock for supply guarantees
 * - Max supply enforcement (45 tokens)
 */
contract SolienneOriginSeries is ERC721Royalty, Ownable, ReentrancyGuard {
    // ============ Events ============

    event BaseURIUpdated(string previousBaseURI, string newBaseURI);
    event NFTMinted(uint256 indexed tokenId, address indexed recipient);
    event RoyaltyUpdated(address indexed receiver, uint96 indexed feeNumerator);
    event MintingPermanentlyLocked(address indexed lockedBy);

    // ============ Errors ============

    error InvalidRecipient();
    error EmptyBaseURI();
    error InvalidRoyaltyFee();
    error InvalidRoyaltyReceiver();
    error TokenAlreadyMinted(uint256 tokenId);
    error MaxSupplyReached();
    error MintingLocked();
    error AlreadyLocked();

    // ============ State Variables ============

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Maximum royalty fee (10% = 1000 basis points)
    uint96 public constant MAX_ROYALTY_FEE = 1000;

    /// @notice Maximum supply: 9 unique pieces × 5 editions each = 45 tokens
    /// @dev TokenIds 0-44: Each piece has 5 editions (0-4→1.json, 5-9→2.json, etc.)
    uint256 public constant MAX_SUPPLY = 45;

    /// @notice Number of editions per unique piece
    uint256 public constant EDITIONS_PER_PIECE = 5;

    /// @notice Total number of unique pieces
    uint256 public constant TOTAL_UNIQUE_PIECES = 9;

    /// @notice Irreversible minting lock - once true, minting is permanently disabled
    bool public mintingLocked;

    // ============ Constructor ============

    /**
     * @notice Initializes the SolienneOriginSeries NFT contract
     * @param _owner Address that will own the contract (also has minting rights)
     * @param baseTokenURI_ Base URI for token metadata
     * @param _royaltyReceiver Address to receive royalty payments
     * @param _royaltyFeeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    constructor(
        address _owner,
        string memory baseTokenURI_,
        address _royaltyReceiver,
        uint96 _royaltyFeeNumerator
    ) ERC721("Solienne Origin Series", "SOLOR") Ownable(_owner) {
        if (bytes(baseTokenURI_).length == 0) revert EmptyBaseURI();
        if (_royaltyReceiver == address(0)) revert InvalidRoyaltyReceiver();
        if (_royaltyFeeNumerator > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();

        _baseTokenURI = baseTokenURI_;

        // Set default royalty for all tokens
        _setDefaultRoyalty(_royaltyReceiver, _royaltyFeeNumerator);

        emit BaseURIUpdated("", baseTokenURI_);
        emit RoyaltyUpdated(_royaltyReceiver, _royaltyFeeNumerator);
    }

    // ============ External Functions - Minting ============

    /**
     * @notice Mint a specific token ID to a recipient
     * @dev Can only be called by owner
     * @param recipient The address to receive the NFT
     * @param tokenId The specific token ID to mint
     */
    function mintTo(address recipient, uint256 tokenId) external nonReentrant onlyOwner {
        if (mintingLocked) revert MintingLocked();
        if (recipient == address(0)) revert InvalidRecipient();
        if (tokenId >= MAX_SUPPLY) revert MaxSupplyReached();

        // Check if token is already minted
        if (_ownerOf(tokenId) != address(0)) {
            revert TokenAlreadyMinted(tokenId);
        }

        _safeMint(recipient, tokenId);
        emit NFTMinted(tokenId, recipient);
    }

    /**
     * @notice Mint multiple specific token IDs to a recipient
     * @dev Can only be called by owner
     * @param recipient The address to receive the NFTs
     * @param tokenIds Array of specific token IDs to mint
     */
    function batchMintTo(
        address recipient,
        uint256[] calldata tokenIds
    ) external nonReentrant onlyOwner {
        if (mintingLocked) revert MintingLocked();
        if (recipient == address(0)) revert InvalidRecipient();

        // Validate all tokens are available BEFORE minting any
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            // Check max supply
            if (tokenId >= MAX_SUPPLY) revert MaxSupplyReached();
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

    /**
     * @notice Get which unique piece (1-9) a token ID represents
     * @dev This determines which metadata file (1.json - 9.json) the token uses
     * @param tokenId Token ID to query (0-44)
     * @return Piece number (1-9)
     */
    function getPieceNumber(uint256 tokenId) public pure returns (uint256) {
        return (tokenId / EDITIONS_PER_PIECE) + 1;
    }

    /**
     * @notice Get which edition (1-5) of a piece a token ID represents
     * @dev Each piece has 5 editions numbered 1-5
     * @param tokenId Token ID to query (0-44)
     * @return Edition number (1-5) for that piece
     */
    function getEditionNumber(uint256 tokenId) public pure returns (uint256) {
        return (tokenId % EDITIONS_PER_PIECE) + 1;
    }

    /**
     * @notice Get the token IDs for a specific piece number
     * @dev Returns all 5 token IDs for a given piece (1-9)
     * @param pieceNumber The piece number (1-9)
     * @return tokenIds Array of 5 token IDs for that piece
     */
    function getTokenIdsForPiece(
        uint256 pieceNumber
    ) public pure returns (uint256[5] memory tokenIds) {
        require(pieceNumber >= 1 && pieceNumber <= TOTAL_UNIQUE_PIECES, "Invalid piece number");
        uint256 startTokenId = (pieceNumber - 1) * EDITIONS_PER_PIECE;
        for (uint256 i = 0; i < EDITIONS_PER_PIECE; i++) {
            tokenIds[i] = startTokenId + i;
        }
        return tokenIds;
    }

    /**
     * @notice Get how many editions of a piece have been minted
     * @dev Useful for tracking which pieces are fully minted
     * @param pieceNumber The piece number to check (1-9)
     * @return count Number of editions minted (0-5)
     */
    function getMintedEditions(uint256 pieceNumber) public view returns (uint256 count) {
        require(pieceNumber >= 1 && pieceNumber <= TOTAL_UNIQUE_PIECES, "Invalid piece number");
        uint256 startTokenId = (pieceNumber - 1) * EDITIONS_PER_PIECE;
        count = 0;
        for (uint256 i = 0; i < EDITIONS_PER_PIECE; i++) {
            if (_ownerOf(startTokenId + i) != address(0)) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Check if all editions of a piece have been minted
     * @param pieceNumber The piece number to check (1-9)
     * @return True if all 5 editions are minted
     */
    function isPieceComplete(uint256 pieceNumber) public view returns (bool) {
        if (pieceNumber < 1 || pieceNumber > TOTAL_UNIQUE_PIECES) return false;
        return getMintedEditions(pieceNumber) == EDITIONS_PER_PIECE;
    }

    /**
     * @notice Get remaining supply
     * @return Number of tokens that can still be minted (0-45)
     */
    function remainingSupply() public view returns (uint256) {
        uint256 minted = 0;
        for (uint256 i = 0; i < MAX_SUPPLY; i++) {
            if (_ownerOf(i) != address(0)) {
                minted++;
            }
        }
        return MAX_SUPPLY - minted;
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
     * @dev Override tokenURI to return custom edition mapping
     * @dev TokenIds 0-44 map to 9 unique metadata files (1.json - 9.json)
     * @dev Each metadata file represents 5 editions:
     * @dev   - TokenIds 0-4 → 1.json
     * @dev   - TokenIds 5-9 → 2.json
     * @dev   - TokenIds 10-14 → 3.json
     * @dev   - ... and so on up to TokenIds 40-44 → 9.json
     * @param tokenId The token ID to get the URI for
     * @return The complete metadata URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        // Calculate metadata ID: 5 editions per metadata file
        // Formula: metadataId = (tokenId / 5) + 1
        // Examples: 0→1, 4→1, 5→2, 9→2, 10→3, etc.
        uint256 metadataId = (tokenId / EDITIONS_PER_PIECE) + 1;

        string memory base = _baseURI();
        return
            bytes(base).length > 0
                ? string.concat(base, Strings.toString(metadataId), ".json")
                : "";
    }
}
