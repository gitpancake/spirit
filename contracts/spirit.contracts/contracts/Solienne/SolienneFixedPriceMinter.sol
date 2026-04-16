// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IERC721Mintable
 * @notice Interface for ERC721 contracts with mintTo functionality
 */
interface IERC721Mintable {
    function mintTo(address recipient, uint256 tokenId) external;
    function isTokenMinted(uint256 tokenId) external view returns (bool);
}

/**
 * @title SolienneFixedPriceMinter
 * @author Eden Platform
 * @notice Simple fixed-price minter for Solienne NFT collections
 * @dev Allows setting prices for specific token IDs and minting them
 *
 * FEATURES:
 * - Per-token pricing: Each token ID can have its own price
 * - Multi-collection support: Works with multiple NFT contracts
 * - Batch minting: Mint multiple tokens in one transaction
 * - Gift minting: Mint to a different recipient
 *
 * SECURITY FEATURES:
 * - Reentrancy protection on minting functions
 * - Exact payment required (no overpayment accepted)
 * - Pausable for emergency situations
 * - Owner-controlled pricing and payouts
 */
contract SolienneFixedPriceMinter is Ownable, ReentrancyGuard, Pausable {
    // ============ Events ============

    event SaleConfigured(address indexed nftContract, uint256[] tokenIds, uint256 price);
    event TokenPriceSet(address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event TokenPricesSetBatch(address indexed nftContract, uint256[] tokenIds, uint256[] prices);
    event TokenMinted(
        address indexed buyer,
        address indexed recipient,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    event PayoutAddressUpdated(address indexed previousAddress, address indexed newAddress);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event NFTContractEnabled(address indexed nftContract);
    event NFTContractDisabled(address indexed nftContract);

    // ============ Errors ============

    error NFTContractNotEnabled();
    error InvalidNFTContract();
    error InvalidTokenId();
    error InvalidPrice();
    error InvalidRecipient();
    error InvalidPayoutAddress();
    error TokenNotForSale();
    error TokenAlreadySold();
    error IncorrectPayment(uint256 required, uint256 provided);
    error MintFailed();
    error NoFundsToWithdraw();
    error ArrayLengthMismatch();

    // ============ State Variables ============

    /// @notice Address that receives sale proceeds
    address public payoutAddress;

    /// @notice Price for each token ID per NFT contract (0 = not for sale)
    mapping(address => mapping(uint256 => uint256)) public tokenPrices;

    /// @notice NFT contracts enabled for minting
    mapping(address => bool) public enabledNFTContracts;

    /// @notice Total number of tokens sold
    uint256 public totalSold;

    /// @notice Total revenue collected (in wei)
    uint256 public totalRevenue;

    // ============ Constructor ============

    /**
     * @notice Initialize the minter contract
     * @param _owner Contract owner address
     * @param _payoutAddress Address to receive sale proceeds
     * @param _nftContracts Initial NFT contracts to enable (can be empty)
     */
    constructor(
        address _owner,
        address _payoutAddress,
        address[] memory _nftContracts
    ) Ownable(_owner) {
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();

        payoutAddress = _payoutAddress;

        // Enable initial NFT contracts
        for (uint256 i = 0; i < _nftContracts.length; ) {
            if (_nftContracts[i] == address(0)) revert InvalidNFTContract();
            enabledNFTContracts[_nftContracts[i]] = true;
            emit NFTContractEnabled(_nftContracts[i]);

            unchecked {
                ++i;
            }
        }

        emit PayoutAddressUpdated(address(0), _payoutAddress);
    }

    // ============ External Functions - Minting ============

    /**
     * @notice Mint a specific token from an NFT collection
     * @dev Requires exact payment matching the token price
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to mint
     */
    function mint(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused {
        _executeMint(msg.sender, nftContract, tokenId);
    }

    /**
     * @notice Mint a specific token and send to a recipient
     * @dev Requires exact payment matching the token price
     * @param recipient Address to receive the NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to mint
     */
    function mintFor(
        address recipient,
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused {
        if (recipient == address(0)) revert InvalidRecipient();
        _executeMint(recipient, nftContract, tokenId);
    }

    /**
     * @notice Mint multiple tokens from the same NFT collection
     * @dev Requires exact payment matching sum of all token prices
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to mint
     */
    function mintBatch(
        address nftContract,
        uint256[] calldata tokenIds
    ) external payable nonReentrant whenNotPaused {
        _executeBatchMint(msg.sender, nftContract, tokenIds);
    }

    /**
     * @notice Mint multiple tokens and send to a recipient
     * @dev Requires exact payment matching sum of all token prices
     * @param recipient Address to receive the NFTs
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to mint
     */
    function mintBatchFor(
        address recipient,
        address nftContract,
        uint256[] calldata tokenIds
    ) external payable nonReentrant whenNotPaused {
        if (recipient == address(0)) revert InvalidRecipient();
        _executeBatchMint(recipient, nftContract, tokenIds);
    }

    // ============ External Functions - Owner Only - Sale Configuration ============

    /**
     * @notice Configure a sale by setting the same price for multiple tokens
     * @dev Convenience function to set uniform pricing for a batch
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to price
     * @param price Price in wei for all tokens (0 = remove from sale)
     */
    function configureSale(
        address nftContract,
        uint256[] calldata tokenIds,
        uint256 price
    ) external onlyOwner {
        if (!enabledNFTContracts[nftContract]) revert NFTContractNotEnabled();
        if (tokenIds.length == 0) revert InvalidTokenId();

        for (uint256 i = 0; i < tokenIds.length; ) {
            tokenPrices[nftContract][tokenIds[i]] = price;

            unchecked {
                ++i;
            }
        }

        emit SaleConfigured(nftContract, tokenIds, price);
    }

    /**
     * @notice Set price for a specific token
     * @dev Can be used to add individual tokens or adjust prices
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to price
     * @param price Price in wei (0 = remove from sale)
     */
    function setTokenPrice(address nftContract, uint256 tokenId, uint256 price) external onlyOwner {
        if (!enabledNFTContracts[nftContract]) revert NFTContractNotEnabled();

        tokenPrices[nftContract][tokenId] = price;
        emit TokenPriceSet(nftContract, tokenId, price);
    }

    /**
     * @notice Set different prices for multiple tokens
     * @dev More gas efficient than multiple setTokenPrice calls
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to price
     * @param prices Array of prices in wei (must match tokenIds length)
     */
    function setTokenPrices(
        address nftContract,
        uint256[] calldata tokenIds,
        uint256[] calldata prices
    ) external onlyOwner {
        if (!enabledNFTContracts[nftContract]) revert NFTContractNotEnabled();
        if (tokenIds.length != prices.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < tokenIds.length; ) {
            tokenPrices[nftContract][tokenIds[i]] = prices[i];

            unchecked {
                ++i;
            }
        }

        emit TokenPricesSetBatch(nftContract, tokenIds, prices);
    }

    // ============ External Functions - Owner Only - Contract Management ============

    /**
     * @notice Enable an NFT contract for minting
     * @param nftContract Address of the NFT contract to enable
     */
    function enableNFTContract(address nftContract) external onlyOwner {
        if (nftContract == address(0)) revert InvalidNFTContract();
        enabledNFTContracts[nftContract] = true;
        emit NFTContractEnabled(nftContract);
    }

    /**
     * @notice Disable an NFT contract from minting
     * @param nftContract Address of the NFT contract to disable
     */
    function disableNFTContract(address nftContract) external onlyOwner {
        enabledNFTContracts[nftContract] = false;
        emit NFTContractDisabled(nftContract);
    }

    /**
     * @notice Update the payout address
     * @param _payoutAddress New payout address
     */
    function updatePayoutAddress(address _payoutAddress) external onlyOwner {
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        address previousAddress = payoutAddress;
        payoutAddress = _payoutAddress;
        emit PayoutAddressUpdated(previousAddress, _payoutAddress);
    }

    /**
     * @notice Withdraw all collected funds to payout address
     * @dev Can only be called by owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        (bool success, ) = payoutAddress.call{value: balance}("");
        if (!success) revert MintFailed();

        emit FundsWithdrawn(payoutAddress, balance);
    }

    /**
     * @notice Pause all minting operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ External View Functions ============

    /**
     * @notice Get sale information for an NFT contract
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to check
     * @return prices Array of prices (0 = not for sale)
     * @return available Array of availability status
     */
    function getSaleInfo(
        address nftContract,
        uint256[] calldata tokenIds
    ) external view returns (uint256[] memory prices, bool[] memory available) {
        prices = new uint256[](tokenIds.length);
        available = new bool[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; ) {
            uint256 tokenId = tokenIds[i];
            prices[i] = tokenPrices[nftContract][tokenId];

            // Check if token is available (has price and not minted)
            if (prices[i] > 0) {
                try IERC721Mintable(nftContract).isTokenMinted(tokenId) returns (bool minted) {
                    available[i] = !minted;
                } catch {
                    // If check fails, assume available if has price
                    available[i] = true;
                }
            } else {
                available[i] = false;
            }

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Check if a token is available for minting
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to check
     * @return available True if token is for sale and not yet minted
     * @return price Price in wei (0 if not available)
     */
    function isTokenAvailable(
        address nftContract,
        uint256 tokenId
    ) external view returns (bool available, uint256 price) {
        price = tokenPrices[nftContract][tokenId];

        if (price == 0) {
            return (false, 0);
        }

        // Check if token is already minted
        try IERC721Mintable(nftContract).isTokenMinted(tokenId) returns (bool minted) {
            available = !minted;
        } catch {
            // If check fails, assume available if has price
            available = true;
        }
    }

    /**
     * @notice Calculate total cost for multiple tokens
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs
     * @return totalCost Sum of all token prices
     */
    function calculateTotalCost(
        address nftContract,
        uint256[] calldata tokenIds
    ) external view returns (uint256 totalCost) {
        for (uint256 i = 0; i < tokenIds.length; ) {
            totalCost += tokenPrices[nftContract][tokenIds[i]];

            unchecked {
                ++i;
            }
        }
        return totalCost;
    }

    /**
     * @notice Get minter statistics
     * @return totalSoldTokens Total number of tokens sold
     * @return totalRevenueEth Total revenue in wei
     * @return contractBalance Current contract balance
     * @return currentPayoutAddress Address receiving payouts
     */
    function getMinterStats()
        external
        view
        returns (
            uint256 totalSoldTokens,
            uint256 totalRevenueEth,
            uint256 contractBalance,
            address currentPayoutAddress
        )
    {
        return (totalSold, totalRevenue, address(this).balance, payoutAddress);
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to execute a single token mint
     * @param recipient Address to receive the NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to mint
     */
    function _executeMint(address recipient, address nftContract, uint256 tokenId) internal {
        if (!enabledNFTContracts[nftContract]) revert NFTContractNotEnabled();

        uint256 price = tokenPrices[nftContract][tokenId];
        if (price == 0) revert TokenNotForSale();

        // Require exact payment
        if (msg.value != price) {
            revert IncorrectPayment(price, msg.value);
        }

        // Check if token is already minted
        try IERC721Mintable(nftContract).isTokenMinted(tokenId) returns (bool minted) {
            if (minted) revert TokenAlreadySold();
        } catch {
            // Contract doesn't support isTokenMinted, will fail at mint if already exists
        }

        // Mint the token
        try IERC721Mintable(nftContract).mintTo(recipient, tokenId) {
            // Success
        } catch {
            revert MintFailed();
        }

        // Update state
        totalSold += 1;
        totalRevenue += price;

        emit TokenMinted(msg.sender, recipient, nftContract, tokenId, price);
    }

    /**
     * @dev Internal function to execute batch token mint
     * @param recipient Address to receive the NFTs
     * @param nftContract Address of the NFT contract
     * @param tokenIds Array of token IDs to mint
     */
    function _executeBatchMint(
        address recipient,
        address nftContract,
        uint256[] calldata tokenIds
    ) internal {
        if (!enabledNFTContracts[nftContract]) revert NFTContractNotEnabled();
        if (tokenIds.length == 0) revert InvalidTokenId();

        // Calculate total cost and validate all tokens
        uint256 totalCost = 0;

        for (uint256 i = 0; i < tokenIds.length; ) {
            uint256 tokenId = tokenIds[i];
            uint256 price = tokenPrices[nftContract][tokenId];
            if (price == 0) revert TokenNotForSale();
            totalCost += price;

            unchecked {
                ++i;
            }
        }

        // Require exact payment
        if (msg.value != totalCost) {
            revert IncorrectPayment(totalCost, msg.value);
        }

        // Mint all tokens
        for (uint256 i = 0; i < tokenIds.length; ) {
            uint256 tokenId = tokenIds[i];
            uint256 price = tokenPrices[nftContract][tokenId];

            // Check if token is already minted
            try IERC721Mintable(nftContract).isTokenMinted(tokenId) returns (bool minted) {
                if (minted) revert TokenAlreadySold();
            } catch {
                // Contract doesn't support isTokenMinted, will fail at mint if already exists
            }

            // Mint the token
            try IERC721Mintable(nftContract).mintTo(recipient, tokenId) {
                // Success
            } catch {
                revert MintFailed();
            }

            emit TokenMinted(msg.sender, recipient, nftContract, tokenId, price);

            unchecked {
                ++i;
            }
        }

        // Update state
        totalSold += tokenIds.length;
        totalRevenue += totalCost;
    }

    // ============ Receive Functions ============

    /**
     * @dev Reject direct ETH transfers
     */
    receive() external payable {
        revert("Use mint functions");
    }

    /**
     * @dev Reject function calls with data
     */
    fallback() external payable {
        revert("Use mint functions");
    }
}
