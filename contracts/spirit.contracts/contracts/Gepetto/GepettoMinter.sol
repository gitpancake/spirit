// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IGepettoToys {
    function mint(address to) external returns (uint256);
}

/**
 * @title GepettoMinter
 * @notice Fixed-price minter for Gepetto Toys NFTs at 0.001 ETH per mint
 * @dev Handles both public paid mints and admin batch mints (free)
 */
contract GepettoMinter is Ownable, Pausable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidToyContract();
    error InvalidOwner();
    error InvalidPayoutAddress();
    error InvalidPrice();
    error InvalidRecipient();
    error EmptyArray();
    error MintFailed();
    error WithdrawalFailed();
    error NoFundsToWithdraw();
    error BatchTooLarge();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ToyMinted(address indexed recipient, uint256 indexed tokenId, uint256 price);
    event BatchMinted(uint256 count, uint256 successCount, uint256 failedCount);
    event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event FundsWithdrawn(address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Price to mint one toy (0.001 ETH)
    uint256 public constant MINT_PRICE = 0.001 ether;

    /// @notice Maximum batch size for admin batch mints (gas safety)
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice GepettoToys NFT contract
    IGepettoToys public immutable toyContract;

    /// @notice Address receiving mint revenue
    address public payoutAddress;

    /// @notice Total revenue collected from paid mints
    uint256 public totalRevenue;

    /// @notice Total number of toys minted via this minter
    uint256 public totalMinted;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the GepettoMinter contract
     * @param _toyContract Address of the GepettoToys NFT contract
     * @param _owner Address that will own the contract (not msg.sender)
     * @param _payoutAddress Address to receive mint revenue
     */
    constructor(address _toyContract, address _owner, address _payoutAddress) Ownable(_owner) {
        if (_owner == address(0)) revert InvalidOwner();
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_toyContract == address(0)) revert InvalidToyContract();

        // Verify toy contract is actually a contract (not an EOA)
        uint256 size;
        assembly {
            size := extcodesize(_toyContract)
        }
        if (size == 0) revert InvalidToyContract();

        toyContract = IGepettoToys(_toyContract);
        payoutAddress = _payoutAddress;

        emit PayoutAddressUpdated(address(0), _payoutAddress);
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC MINTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a Gepetto Toy NFT by paying 0.001 ETH
     * @dev Metadata must be uploaded to {baseURI}/{tokenId}.json BEFORE minting
     * @param recipient Address to receive the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(
        address recipient
    ) external payable nonReentrant whenNotPaused returns (uint256 tokenId) {
        // Validate inputs
        if (msg.value != MINT_PRICE) revert InvalidPrice();
        if (recipient == address(0)) revert InvalidRecipient();

        // Update state BEFORE external calls (CEI pattern)
        unchecked {
            totalRevenue += msg.value;
            totalMinted++;
        }

        // Mint token via NFT contract
        tokenId = toyContract.mint(recipient);

        emit ToyMinted(recipient, tokenId, msg.value);

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN BATCH MINTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Admin-only batch mint (free) - useful for airdrops
     * @dev Uses try/catch to prevent single failure from blocking entire batch
     * @dev Metadata must be uploaded to {baseURI}/{tokenId}.json BEFORE minting
     * @param recipients Array of addresses to receive NFTs
     * @return successCount Number of successful mints
     */
    function batchMint(
        address[] calldata recipients
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256 successCount) {
        // Validate inputs
        if (recipients.length == 0) revert EmptyArray();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge();

        uint256 failedCount = 0;
        successCount = 0;

        // Mint to each recipient with try/catch for DOS protection
        for (uint256 i = 0; i < recipients.length; i++) {
            // Skip invalid recipients
            if (recipients[i] == address(0)) {
                unchecked {
                    failedCount++;
                }
                continue;
            }

            // Try to mint
            try toyContract.mint(recipients[i]) returns (uint256 tokenId) {
                unchecked {
                    successCount++;
                    totalMinted++;
                }
                emit ToyMinted(recipients[i], tokenId, 0);
            } catch {
                unchecked {
                    failedCount++;
                }
            }
        }

        emit BatchMinted(recipients.length, successCount, failedCount);

        return successCount;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the payout address
     * @param newPayoutAddress New address to receive mint revenue
     */
    function updatePayoutAddress(address newPayoutAddress) external onlyOwner {
        if (newPayoutAddress == address(0)) revert InvalidPayoutAddress();

        address oldAddress = payoutAddress;
        payoutAddress = newPayoutAddress;

        emit PayoutAddressUpdated(oldAddress, newPayoutAddress);
    }

    /**
     * @notice Withdraw collected ETH to payout address
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFundsToWithdraw();

        (bool success, ) = payoutAddress.call{value: amount}("");
        if (!success) revert WithdrawalFailed();

        emit FundsWithdrawn(payoutAddress, amount);
    }

    /**
     * @notice Pause minting
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get current contract balance
     * @return ETH balance in wei
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get mint price
     * @return Price in wei
     */
    function mintPrice() external pure returns (uint256) {
        return MINT_PRICE;
    }
}
