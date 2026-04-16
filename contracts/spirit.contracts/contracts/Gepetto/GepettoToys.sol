// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GepettoToys
 * @notice ERC-721 NFT contract for Brainrot Toys with external metadata
 * @dev Supports EIP-2981 royalty standard, starts at tokenId 0, max supply 10,000
 * @dev Metadata is stored externally at {baseURI}{tokenId}.json
 * @dev Token name and description are stored on-chain for reference
 */
contract GepettoToys is ERC721, ERC2981, Ownable, Pausable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error MaxSupplyReached();
    error UnauthorizedMinter();
    error InvalidMinter();
    error InvalidRoyaltyFee();
    error InvalidRoyaltyReceiver();
    error TokenDoesNotExist();
    error EmptyString();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event RoyaltyInfoUpdated(address indexed receiver, uint96 feeNumerator);
    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event NameUpdated(string oldName, string newName);
    event SymbolUpdated(string oldSymbol, string newSymbol);
    event ToyNameUpdated(string oldToyName, string newToyName);
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);
    event DescriptionUpdated(string oldDescription, string newDescription);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum number of toys that can be minted
    uint256 public constant MAX_SUPPLY = 10_000;

    /// @notice Default royalty percentage (5% = 500 basis points)
    uint96 public constant DEFAULT_ROYALTY_FEE = 500; // 5%

    /// @notice Collection name (configurable by owner)
    string private _collectionName;

    /// @notice Collection symbol (configurable by owner)
    string private _collectionSymbol;

    /// @notice Toy name prefix used in metadata (configurable by owner)
    /// @dev Used in tokenURI as: "{_toyName} #{tokenId}"
    string private _toyName;

    /// @notice Token description (configurable by owner)
    string private _tokenDescription;

    /// @notice Base URI for token metadata (e.g., "https://example.com/metadata/")
    /// @dev TokenURI will be: {baseURI}{tokenId}.json
    string private _baseTokenURI;

    /// @notice Address authorized to mint tokens
    address public authorizedMinter;

    /// @notice Next token ID to be minted (starts at 0)
    uint256 private _nextTokenId;

    /// @notice Total number of tokens minted
    uint256 public totalSupply;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the GepettoToys NFT contract
     * @param _name Collection name
     * @param _symbol Collection symbol
     * @param toyName_ Toy name prefix for reference (e.g., "Brainrot Toy")
     * @param _description Token description for reference
     * @param _owner Address that will own the contract (not msg.sender)
     * @param _minter Address authorized to mint tokens
     * @param _royaltyReceiver Address that will receive royalty payments
     * @param baseURI_ Base URI for metadata (can be empty, set later via setBaseURI)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory toyName_,
        string memory _description,
        address _owner,
        address _minter,
        address _royaltyReceiver,
        string memory baseURI_
    ) ERC721(_name, _symbol) Ownable(_owner) {
        if (bytes(_name).length == 0) revert EmptyString();
        if (bytes(_symbol).length == 0) revert EmptyString();
        if (bytes(toyName_).length == 0) revert EmptyString();
        if (_minter == address(0)) revert InvalidMinter();
        if (_royaltyReceiver == address(0)) revert InvalidRoyaltyReceiver();

        // Set collection name and symbol (can be updated by owner later)
        _collectionName = _name;
        _collectionSymbol = _symbol;
        _toyName = toyName_;
        _tokenDescription = _description;

        // Set base URI (can be empty, set later)
        _baseTokenURI = baseURI_;

        authorizedMinter = _minter;
        _nextTokenId = 0; // Start at tokenId 0

        // Set default royalty to 5% to the royalty receiver
        _setDefaultRoyalty(_royaltyReceiver, DEFAULT_ROYALTY_FEE);

        emit MinterUpdated(address(0), _minter);
        emit RoyaltyInfoUpdated(_royaltyReceiver, DEFAULT_ROYALTY_FEE);

        if (bytes(baseURI_).length > 0) {
            emit BaseURIUpdated("", baseURI_);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a new Brainrot Toy NFT
     * @dev Only callable by authorized minter contract
     * @dev Metadata must be uploaded to {baseURI}{tokenId}.json BEFORE minting
     * @param to Address to receive the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to) external nonReentrant whenNotPaused returns (uint256 tokenId) {
        if (msg.sender != authorizedMinter) revert UnauthorizedMinter();
        if (totalSupply >= MAX_SUPPLY) revert MaxSupplyReached();

        tokenId = _nextTokenId;

        // Mint token
        _safeMint(to, tokenId);

        // Increment counters
        unchecked {
            _nextTokenId++;
            totalSupply++;
        }

        emit TokenMinted(to, tokenId);

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the authorized minter address
     * @param newMinter New minter contract address
     */
    function updateMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert InvalidMinter();

        address oldMinter = authorizedMinter;
        authorizedMinter = newMinter;

        emit MinterUpdated(oldMinter, newMinter);
    }

    /**
     * @notice Update the default royalty configuration
     * @param receiver Address to receive royalty payments
     * @param feeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        if (receiver == address(0)) revert InvalidRoyaltyReceiver();
        if (feeNumerator > 10000) revert InvalidRoyaltyFee(); // Max 100%

        _setDefaultRoyalty(receiver, feeNumerator);

        emit RoyaltyInfoUpdated(receiver, feeNumerator);
    }

    /**
     * @notice Update the base URI for token metadata
     * @dev Token URIs will be located at {newBaseURI}{tokenId}.json
     * @param newBaseURI New base URI for metadata (e.g., "https://example.com/metadata/")
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        string memory oldBaseURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;

        emit BaseURIUpdated(oldBaseURI, newBaseURI);
    }

    /**
     * @notice Update the collection name
     * @param newName New name for the collection
     */
    function setName(string calldata newName) external onlyOwner {
        if (bytes(newName).length == 0) revert EmptyString();

        string memory oldName = _collectionName;
        _collectionName = newName;

        emit NameUpdated(oldName, newName);
    }

    /**
     * @notice Update the collection symbol
     * @param newSymbol New symbol for the collection
     */
    function setSymbol(string calldata newSymbol) external onlyOwner {
        if (bytes(newSymbol).length == 0) revert EmptyString();

        string memory oldSymbol = _collectionSymbol;
        _collectionSymbol = newSymbol;

        emit SymbolUpdated(oldSymbol, newSymbol);
    }

    /**
     * @notice Update the toy name prefix used in metadata
     * @param newToyName New toy name prefix (e.g., "Brainrot Toy")
     */
    function setToyName(string calldata newToyName) external onlyOwner {
        if (bytes(newToyName).length == 0) revert EmptyString();

        string memory oldToyName = _toyName;
        _toyName = newToyName;

        emit ToyNameUpdated(oldToyName, newToyName);
    }

    /**
     * @notice Update the token description
     * @param newDescription New description for tokens
     */
    function setDescription(string calldata newDescription) external onlyOwner {
        if (bytes(newDescription).length == 0) revert EmptyString();

        string memory oldDescription = _tokenDescription;
        _tokenDescription = newDescription;

        emit DescriptionUpdated(oldDescription, newDescription);
    }

    /**
     * @notice Pause all token operations (minting and transfers)
     * @dev When paused, no mints or transfers can occur - full emergency stop
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause all token operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the collection name
     * @return Collection name string
     */
    function name() public view override returns (string memory) {
        return _collectionName;
    }

    /**
     * @notice Get the collection symbol
     * @return Collection symbol string
     */
    function symbol() public view override returns (string memory) {
        return _collectionSymbol;
    }

    /**
     * @notice Get the toy name prefix used in metadata
     * @return Toy name prefix string
     */
    function toyName() external view returns (string memory) {
        return _toyName;
    }

    /**
     * @notice Get the token description
     * @return Token description string
     */
    function description() external view returns (string memory) {
        return _tokenDescription;
    }

    /**
     * @notice Get the base URI for token metadata
     * @return Base URI string
     */
    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Get the token URI for a specific token
     * @dev Returns external metadata URI: {baseURI}{tokenId}.json
     * @param tokenId Token ID to query
     * @return Token URI string pointing to external metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Use OpenZeppelin's _ownerOf to check existence
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();

        // Return external metadata URI
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    /**
     * @notice Get the next token ID that will be minted
     * @return Next token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Check if a token exists
     * @param tokenId Token ID to check
     * @return True if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        // Use OpenZeppelin's _ownerOf to check existence
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Get remaining supply available to mint
     * @return Number of tokens that can still be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Hook that is called before any token transfer
     * @dev Blocks all transfers (including mints and burns) when paused
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERFACE SUPPORT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check interface support for ERC-721 and ERC-2981
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
