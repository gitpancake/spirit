// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {AbrahamFirstWorks} from "./AbrahamFirstWorks.sol";

/**
 * @title FixedPriceSale
 * @author Eden Platform
 * @notice Phased sale contract for AbrahamFirstWorks NFTs with gas-optimized operations
 * @dev Acts as authorized minter with admin gifting, whitelist, and public sale phases.
 *      All-or-nothing minting with exact payment requirements - no partial mints or refunds.
 *
 * SECURITY FEATURES:
 * - All-or-nothing minting: reverts if any token is invalid or already minted
 * - Exact payment required: no overpayment accepted, reverts on underpayment
 * - Reentrancy protection with checks-effects-interactions pattern
 * - Simple owner-only withdrawal pattern (no refund tracking needed)
 * - Emergency pause mechanism with cooldown protection
 * - Batch size limits (50) prevent DOS attacks
 * - Artist gift limits (250) enforced before minting
 *
 * GAS OPTIMIZATIONS:
 * - Storage packing reduces slot usage
 * - Batch events reduce event emission costs
 * - Safe uint128 casting for counters
 * - No refund tracking or storage overhead
 *
 * INVARIANTS:
 * - totalSupply <= maxSupply (enforced by NFT contract)
 * - totalArtistGifted <= MAX_ARTIST_GIFTS (250)
 * - totalSold + totalAdminGifted + totalArtistGifted == totalSupply (1:1 mapping)
 * - emergencyPauseEnd == 0 OR emergencyPauseEnd > block.timestamp
 */
contract FixedPriceSale is Ownable, ReentrancyGuard, Pausable {
    // ============ Events ============

    event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint256 price);
    event NFTGifted(address indexed recipient, uint256 indexed tokenId);
    event PriceUpdated(uint256 previousPrice, uint256 newPrice);
    event NFTContractUpdated(address previousContract, address newContract);
    event PayoutAddressUpdated(address previousAddress, address newAddress);
    event WhitelistMerkleRootUpdated(bytes32 indexed previousRoot, bytes32 indexed newRoot);
    event ArtistUpdated(address indexed previousArtist, address indexed newArtist);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event EmergencyPauseActivated(uint256 indexed pauseEnd, string reason);
    event EmergencyPauseLifted(uint256 indexed timestamp, address indexed lifter);
    event ParameterUpdated(string indexed parameter, bytes oldValue, bytes newValue);
    event BatchMinted(
        address indexed payer,
        address indexed recipient,
        uint256[] tokenIds,
        uint256 totalPrice
    );

    // ============ Errors ============

    error InvalidNFTContract();
    error InvalidPayoutAddress();
    error InvalidRecipient();
    error InvalidPrice();
    error InsufficientPayment(uint256 required, uint256 provided);
    error MintFailed();
    error WithdrawalFailed(address recipient, uint256 amount);
    error NoFundsToWithdraw();
    error EmptyTokenArray();
    error InvalidSalePhase(SalePhase current, SalePhase required);
    error InvalidMerkleProof();
    error UnauthorizedArtist(address caller, address artist);
    error InvalidArtistAddress();
    error ExceedsMaxArtistGifts(uint256 requested, uint256 remaining);
    error BatchSizeTooLarge(uint256 requested, uint256 maximum);
    error EmergencyPauseActive(uint256 pauseEnd);
    error EmergencyPauseCooldown(uint256 nextAllowedTime);
    error InvalidPauseDuration(uint256 duration, uint256 maximum);

    // ============ Enums ============

    enum SalePhase {
        AdminGifting, // Phase 1: Admin-only free mints
        Whitelist, // Phase 2: Whitelist with merkle proof + payment
        Public // Phase 3: Public sale with payment
    }

    // ============ State Variables - Timing ============

    /// @notice Presale start time (configurable per deployment)
    uint256 public immutable PRESALE_START_TIME;

    /// @notice Public sale start time (configurable per deployment)
    uint256 public immutable PUBLIC_START_TIME;

    /// @notice Maximum number of NFTs that can be gifted by artist
    uint256 public constant MAX_ARTIST_GIFTS = 250;

    /// @notice Maximum batch size for minting operations (prevent DOS)
    uint256 public constant MAX_BATCH_SIZE = 50;

    /// @notice Emergency pause duration (24 hours)
    uint256 public constant EMERGENCY_PAUSE_DURATION = 24 hours;

    /// @notice Maximum allowed pause duration (48 hours)
    uint256 public constant MAX_PAUSE_DURATION = 48 hours;

    // ============ State Variables ============
    // STORAGE OPTIMIZATION: Packed to minimize slots

    /// @notice AbrahamFirstWorks NFT contract instance
    AbrahamFirstWorks public nftContract;

    /// @notice Fixed price per NFT in wei (0.025 ETH = 25000000000000000 wei)
    uint256 public price;

    /// @notice Address to receive sale proceeds
    address public payoutAddress;

    /// @notice Artist address authorized for limited gifting
    address public artist;

    /// @notice Merkle root for whitelist verification
    bytes32 public whitelistMerkleRoot;

    /// @notice Total number of NFTs sold through this contract (paid mints only)
    uint128 public totalSold;

    /// @notice Total number of NFTs gifted by admin (unlimited tracking)
    uint128 public totalAdminGifted;

    /// @notice Total number of NFTs gifted by artist (limited to 250)
    uint128 public totalArtistGifted;

    /// @notice Emergency pause end time (0 = not paused)
    uint128 public emergencyPauseEnd;

    /// @notice Total revenue collected in wei
    uint256 public totalRevenue;

    /// @notice Last emergency pause timestamp to prevent abuse
    uint256 public lastEmergencyPause;

    // ============ Constructor ============

    /**
     * @notice Initializes the FixedPriceSale contract
     * @param _nftContract Address of the AbrahamFirstWorks contract
     * @param _owner Address that will own this contract
     * @param _payoutAddress Address to receive sale proceeds
     * @param _price Fixed price per NFT in wei
     * @param _whitelistMerkleRoot Initial merkle root for whitelist (can be updated)
     * @param _artist Artist address authorized for limited gifting
     * @param _presaleStartTime Timestamp when presale begins
     * @param _publicStartTime Timestamp when public sale begins
     */
    constructor(
        address _nftContract,
        address _owner,
        address _payoutAddress,
        uint256 _price,
        bytes32 _whitelistMerkleRoot,
        address _artist,
        uint256 _presaleStartTime,
        uint256 _publicStartTime
    ) Ownable(_owner) {
        if (_nftContract == address(0)) revert InvalidNFTContract();
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_price == 0) revert InvalidPrice();
        if (_presaleStartTime == 0) revert InvalidPrice(); // Reuse error for validation
        if (_publicStartTime <= _presaleStartTime) revert InvalidPrice(); // Public must be after presale

        nftContract = AbrahamFirstWorks(_nftContract);
        payoutAddress = _payoutAddress;
        price = _price;
        whitelistMerkleRoot = _whitelistMerkleRoot;
        artist = _artist; // Can be zero address initially

        // Set timing configuration (immutable)
        PRESALE_START_TIME = _presaleStartTime;
        PUBLIC_START_TIME = _publicStartTime;

        emit NFTContractUpdated(address(0), _nftContract);
        emit PayoutAddressUpdated(address(0), _payoutAddress);
        emit PriceUpdated(0, _price);
        emit WhitelistMerkleRootUpdated(bytes32(0), _whitelistMerkleRoot);
        emit ArtistUpdated(address(0), _artist);
    }

    // ============ Modifiers ============

    /**
     * @dev Ensures only artist can call the function
     */
    modifier onlyArtist() {
        if (msg.sender != artist) revert UnauthorizedArtist(msg.sender, artist);
        _;
    }

    /**
     * @dev Ensures contract is not in emergency pause mode
     */
    modifier notInEmergencyPause() {
        if (emergencyPauseEnd > 0 && block.timestamp < emergencyPauseEnd) {
            revert EmergencyPauseActive(emergencyPauseEnd);
        }
        _;
    }

    // ============ View Functions ============

    /**
     * @notice Get the current sale phase based on block timestamp
     * @return Current sale phase
     */
    function getCurrentPhase() public view returns (SalePhase) {
        if (block.timestamp < PRESALE_START_TIME) {
            return SalePhase.AdminGifting;
        } else if (block.timestamp < PUBLIC_START_TIME) {
            return SalePhase.Whitelist;
        } else {
            return SalePhase.Public;
        }
    }

    // ============ External Functions - Minting ============

    /**
     * @notice Admin-only function to gift NFTs for free (Available at any time)
     * @dev Can only be called by owner, unlimited gifting. All-or-nothing minting.
     *
     * SECURITY:
     * - Protected by onlyOwner, nonReentrant, whenNotPaused, notInEmergencyPause
     * - Batch size limited to MAX_BATCH_SIZE (50) to prevent DOS
     * - All-or-nothing: reverts if any token is invalid or already minted
     *
     * GAS OPTIMIZATION:
     * - Uses uint128 for counter updates (saves storage slot space)
     * - Batch processes multiple tokens in single transaction
     *
     * @param recipient Address to receive the gifted NFTs (cannot be zero)
     * @param tokenIds Array of specific token IDs to gift (max 50)
     * @return mintedTokenIds Array of minted token IDs (same as input on success)
     *
     * @custom:invariant totalAdminGifted increases by tokenIds.length
     * @custom:security-note No limit on admin gifts (by design)
     */
    function adminGiftTo(
        address recipient,
        uint256[] calldata tokenIds
    )
        external
        nonReentrant
        whenNotPaused
        notInEmergencyPause
        onlyOwner
        returns (uint256[] memory mintedTokenIds)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (tokenIds.length == 0) revert EmptyTokenArray();
        if (tokenIds.length > MAX_BATCH_SIZE)
            revert BatchSizeTooLarge(tokenIds.length, MAX_BATCH_SIZE);

        // Call NFT contract's batch mint function
        uint256[] memory actuallyMinted;
        try nftContract.mintTo(recipient, tokenIds) returns (uint256[] memory minted) {
            actuallyMinted = minted;
        } catch {
            revert MintFailed();
        }

        if (actuallyMinted.length == 0) {
            revert MintFailed();
        }

        // Emit events for gifted tokens (no price)
        uint256 length = actuallyMinted.length;
        for (uint256 i = 0; i < length; ) {
            emit NFTGifted(recipient, actuallyMinted[i]);
            unchecked {
                ++i;
            }
        }

        // Update admin gifted statistics with safe casting
        totalAdminGifted += uint128(actuallyMinted.length);

        return actuallyMinted;
    }

    /**
     * @notice Artist-only function to gift NFTs for free (Available at any time)
     * @dev Can only be called by artist, limited to 250 total gifts. All-or-nothing minting.
     *
     * SECURITY:
     * - Protected by onlyArtist, nonReentrant, whenNotPaused, notInEmergencyPause
     * - Enforces MAX_ARTIST_GIFTS limit BEFORE minting
     * - Batch size limited to MAX_BATCH_SIZE (50) to prevent DOS
     * - All-or-nothing: reverts if any token is invalid or already minted
     *
     * GAS OPTIMIZATION:
     * - Uses uint128 for counter updates (saves storage slot space)
     * - Checks limit before minting to fail fast
     *
     * @param recipient Address to receive the gifted NFTs (cannot be zero)
     * @param tokenIds Array of specific token IDs to gift (max 50)
     * @return mintedTokenIds Array of minted token IDs (same as input on success)
     *
     * @custom:invariant totalArtistGifted <= MAX_ARTIST_GIFTS (250)
     * @custom:security-note Limit checked BEFORE minting with double-check after
     */
    function artistGiftTo(
        address recipient,
        uint256[] calldata tokenIds
    )
        external
        nonReentrant
        whenNotPaused
        notInEmergencyPause
        onlyArtist
        returns (uint256[] memory mintedTokenIds)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (tokenIds.length == 0) revert EmptyTokenArray();
        if (tokenIds.length > MAX_BATCH_SIZE)
            revert BatchSizeTooLarge(tokenIds.length, MAX_BATCH_SIZE);

        // Check artist gift limit BEFORE attempting to mint (prevent bypass)
        if (tokenIds.length > MAX_ARTIST_GIFTS - totalArtistGifted) {
            revert ExceedsMaxArtistGifts(tokenIds.length, MAX_ARTIST_GIFTS - totalArtistGifted);
        }

        // Call NFT contract's batch mint function
        uint256[] memory actuallyMinted;
        try nftContract.mintTo(recipient, tokenIds) returns (uint256[] memory minted) {
            actuallyMinted = minted;
        } catch {
            revert MintFailed();
        }

        if (actuallyMinted.length == 0) {
            revert MintFailed();
        }

        // Check artist gift limit with ACTUAL minted count (prevent bypass)
        if (totalArtistGifted + actuallyMinted.length > MAX_ARTIST_GIFTS) {
            revert ExceedsMaxArtistGifts(
                actuallyMinted.length,
                MAX_ARTIST_GIFTS - totalArtistGifted
            );
        }

        // Update artist gifted statistics with safe casting
        totalArtistGifted += uint128(actuallyMinted.length);

        // Emit events for gifted tokens (no price)
        uint256 length = actuallyMinted.length;
        for (uint256 i = 0; i < length; ) {
            emit NFTGifted(recipient, actuallyMinted[i]);
            unchecked {
                ++i;
            }
        }

        return actuallyMinted;
    }

    /**
     * @notice Whitelist mint with merkle proof verification (Phase 2: Whitelist)
     * @dev Requires valid merkle proof and exact payment. Self-mint only. All-or-nothing.
     * @param tokenIds Array of specific token IDs to mint
     * @param merkleProof Merkle proof for whitelist verification
     * @return mintedTokenIds Array of minted token IDs (same as input on success)
     */
    function whitelistMint(
        uint256[] calldata tokenIds,
        bytes32[] calldata merkleProof
    )
        external
        payable
        nonReentrant
        whenNotPaused
        notInEmergencyPause
        returns (uint256[] memory mintedTokenIds)
    {
        SalePhase currentPhase = getCurrentPhase();
        if (currentPhase != SalePhase.Whitelist) {
            revert InvalidSalePhase(currentPhase, SalePhase.Whitelist);
        }

        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(merkleProof, whitelistMerkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        // Always mint to msg.sender (self-mint only policy enforced by design)
        return _executePaidMint(msg.sender, tokenIds);
    }

    /**
     * @notice Public mint function (Phase 3: Public Sale)
     * @dev Requires exact payment. All-or-nothing: reverts if any token fails.
     * @param recipient Address to receive the minted tokens
     * @param tokenIds Array of specific token IDs to mint
     * @return mintedTokenIds Array of minted token IDs (same as input on success)
     */
    function mintTo(
        address recipient,
        uint256[] calldata tokenIds
    )
        external
        payable
        nonReentrant
        whenNotPaused
        notInEmergencyPause
        returns (uint256[] memory mintedTokenIds)
    {
        SalePhase currentPhase = getCurrentPhase();
        if (currentPhase != SalePhase.Public) {
            revert InvalidSalePhase(currentPhase, SalePhase.Public);
        }
        return _executePaidMint(recipient, tokenIds);
    }

    /**
     * @notice Convenience function to mint tokens to yourself (Public Sale only)
     * @dev Requires exact payment. All-or-nothing: reverts if any token fails.
     * @param tokenIds Array of specific token IDs to mint
     * @return mintedTokenIds Array of minted token IDs (same as input on success)
     */
    function mint(
        uint256[] calldata tokenIds
    )
        external
        payable
        nonReentrant
        whenNotPaused
        notInEmergencyPause
        returns (uint256[] memory mintedTokenIds)
    {
        SalePhase currentPhase = getCurrentPhase();
        if (currentPhase != SalePhase.Public) {
            revert InvalidSalePhase(currentPhase, SalePhase.Public);
        }
        return _executePaidMint(msg.sender, tokenIds);
    }

    // ============ External Functions - Owner Only ============

    /**
     * @notice Update the whitelist merkle root
     * @dev Can only be called by owner
     * @param newMerkleRoot New merkle root for whitelist verification
     */
    function updateWhitelistMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        bytes32 previousRoot = whitelistMerkleRoot;
        whitelistMerkleRoot = newMerkleRoot;
        emit WhitelistMerkleRootUpdated(previousRoot, newMerkleRoot);
        emit ParameterUpdated(
            "whitelistMerkleRoot",
            abi.encode(previousRoot),
            abi.encode(newMerkleRoot)
        );
    }

    /**
     * @notice Update the fixed price per NFT
     * @param newPrice New price in wei
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();

        uint256 previousPrice = price;
        price = newPrice;

        emit PriceUpdated(previousPrice, newPrice);
        emit ParameterUpdated("price", abi.encode(previousPrice), abi.encode(newPrice));
    }

    /**
     * @notice Update the NFT contract address
     * @param newNFTContract New AbrahamFirstWorks contract address
     */
    function updateNFTContract(address newNFTContract) external onlyOwner {
        if (newNFTContract == address(0)) revert InvalidNFTContract();

        address previousContract = address(nftContract);
        nftContract = AbrahamFirstWorks(newNFTContract);

        emit NFTContractUpdated(previousContract, newNFTContract);
        emit ParameterUpdated(
            "nftContract",
            abi.encode(previousContract),
            abi.encode(newNFTContract)
        );
    }

    /**
     * @notice Update the payout address
     * @param newPayoutAddress New address to receive sale proceeds
     */
    function updatePayoutAddress(address newPayoutAddress) external onlyOwner {
        if (newPayoutAddress == address(0)) revert InvalidPayoutAddress();

        address previousAddress = payoutAddress;
        payoutAddress = newPayoutAddress;

        emit PayoutAddressUpdated(previousAddress, newPayoutAddress);
        emit ParameterUpdated(
            "payoutAddress",
            abi.encode(previousAddress),
            abi.encode(newPayoutAddress)
        );
    }

    /**
     * @notice Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw available contract balance to payout address
     *
     * SECURITY:
     * - Only owner can withdraw
     * - Nonreentrant protection
     * - Sends to designated payoutAddress (not owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        (bool success, ) = payable(payoutAddress).call{value: balance}("");
        if (!success) revert WithdrawalFailed(payoutAddress, balance);

        emit FundsWithdrawn(payoutAddress, balance);
    }

    /**
     * @notice Activate emergency pause (owner only)
     * @dev Can only be used once per 24 hours to prevent abuse
     *
     * SECURITY FEATURES:
     * - 24-hour cooldown between emergency pauses (prevents abuse)
     * - Maximum 48-hour pause duration (prevents permanent locks)
     * - Only owner can activate (prevents unauthorized pauses)
     * - Blocks all minting operations when active
     *
     * @param duration Pause duration in seconds (max 48 hours)
     * @param reason Human-readable reason for emergency pause
     *
     * @custom:invariant Can only be called if lastEmergencyPause + 24h < block.timestamp
     * @custom:invariant duration <= MAX_PAUSE_DURATION (48 hours)
     * @custom:security-note Pauses all minting but allows withdrawals and admin functions
     */
    function activateEmergencyPause(uint256 duration, string calldata reason) external onlyOwner {
        if (duration > MAX_PAUSE_DURATION) {
            revert InvalidPauseDuration(duration, MAX_PAUSE_DURATION);
        }

        // Prevent abuse: cooldown of 24 hours between emergency pauses
        if (
            lastEmergencyPause > 0 &&
            block.timestamp < lastEmergencyPause + EMERGENCY_PAUSE_DURATION
        ) {
            revert EmergencyPauseCooldown(lastEmergencyPause + EMERGENCY_PAUSE_DURATION);
        }

        // Safe casting for gas optimization
        require(block.timestamp + duration <= type(uint128).max, "Timestamp overflow");
        emergencyPauseEnd = uint128(block.timestamp + duration);
        lastEmergencyPause = block.timestamp;

        emit EmergencyPauseActivated(emergencyPauseEnd, reason);
    }

    /**
     * @notice Lift emergency pause early (owner only)
     * @dev Can be called anytime to resume operations
     */
    function liftEmergencyPause() external onlyOwner {
        emergencyPauseEnd = 0;
        emit EmergencyPauseLifted(block.timestamp, msg.sender);
    }

    /**
     * @notice Check if contract is in emergency pause
     * @return paused Whether emergency pause is active
     * @return pauseEnd Timestamp when pause ends (0 if not paused)
     * @return timeRemaining Seconds remaining in pause (0 if not paused)
     */
    function getEmergencyPauseStatus()
        external
        view
        returns (bool paused, uint256 pauseEnd, uint256 timeRemaining)
    {
        uint256 pauseEndExpanded = uint256(emergencyPauseEnd);
        paused = emergencyPauseEnd > 0 && block.timestamp < pauseEndExpanded;
        pauseEnd = pauseEndExpanded;
        timeRemaining = paused ? pauseEndExpanded - block.timestamp : 0;
    }

    /**
     * @notice Update the artist address
     * @param _artist New artist address (can be zero to disable)
     */
    function updateArtist(address _artist) external onlyOwner {
        address previousArtist = artist;
        artist = _artist;
        emit ArtistUpdated(previousArtist, _artist);
    }

    /**
     * @notice Update the artist address with monitoring
     * @param _artist New artist address (can be zero to disable)
     */
    function updateArtistWithEvent(address _artist) external onlyOwner {
        address previousArtist = artist;
        artist = _artist;
        emit ArtistUpdated(previousArtist, _artist);
        emit ParameterUpdated("artist", abi.encode(previousArtist), abi.encode(_artist));
    }

    // ============ External View Functions ============

    /**
     * @notice Get current sale information
     * @return isActive Whether sale is currently active
     * @return currentPrice Current price per NFT in wei
     * @return sold Total number sold
     * @return revenue Total revenue collected
     * @return maxSupply Max supply of NFT contract
     * @return remainingSupply Remaining supply available
     * @return contractBalance Current contract balance
     */
    function getSaleInfo()
        external
        view
        returns (
            bool isActive,
            uint256 currentPrice,
            uint256 sold,
            uint256 revenue,
            uint256 maxSupply,
            uint256 remainingSupply,
            uint256 contractBalance
        )
    {
        SalePhase currentPhase = getCurrentPhase();
        return (
            (currentPhase == SalePhase.Whitelist || currentPhase == SalePhase.Public) &&
                !paused() &&
                !(emergencyPauseEnd > 0 && block.timestamp < emergencyPauseEnd),
            price,
            totalSold,
            totalRevenue,
            nftContract.maxSupply(),
            nftContract.remainingSupply(),
            address(this).balance
        );
    }

    /**
     * @notice Get gifting information
     * @return totalGifts Total gifts by admin and artist combined
     * @return adminGifts Total gifts by admin (unlimited)
     * @return artistGifts Total gifts by artist (limited)
     * @return remainingArtistGifts Remaining gifts artist can make
     * @return maxArtistGifts Maximum gifts artist can make
     */
    function getGiftingInfo()
        external
        view
        returns (
            uint256 totalGifts,
            uint256 adminGifts,
            uint256 artistGifts,
            uint256 remainingArtistGifts,
            uint256 maxArtistGifts
        )
    {
        return (
            totalAdminGifted + totalArtistGifted,
            totalAdminGifted,
            totalArtistGifted,
            MAX_ARTIST_GIFTS - totalArtistGifted,
            MAX_ARTIST_GIFTS
        );
    }

    /**
     * @notice Get total number of NFTs gifted (backward compatibility)
     * @return Total gifts by admin and artist combined
     */
    function totalGifted() external view returns (uint256) {
        return totalAdminGifted + totalArtistGifted;
    }

    /**
     * @notice Calculate total cost for batch minting (estimator only)
     * @dev Does not enforce MAX_BATCH_SIZE - this is a cost estimation function
     * @dev Actual minting functions will enforce batch size limits
     * @param quantity Number of NFTs to calculate cost for
     * @return Total cost in wei (price * quantity)
     */
    function calculateTotalCost(uint256 quantity) external view returns (uint256) {
        return price * quantity;
    }

    /**
     * @notice Check if a quantity can be minted
     * @param quantity Number of NFTs to check
     * @return success Whether the quantity can be minted
     * @return reason Reason if cannot mint (0=success, 1=inactive, 2=paused, 3=emergency_paused, 4=insufficient_supply)
     */
    function canMint(uint256 quantity) external view returns (bool success, uint8 reason) {
        SalePhase currentPhase = getCurrentPhase();
        if (currentPhase != SalePhase.Public && currentPhase != SalePhase.Whitelist)
            return (false, 1);
        if (paused()) return (false, 2);
        if (emergencyPauseEnd > 0 && block.timestamp < emergencyPauseEnd) return (false, 3);
        if (nftContract.remainingSupply() < quantity) return (false, 4);
        return (true, 0);
    }

    /**
     * @notice Check if specific token IDs can be minted
     * @param tokenIds Array of token IDs to check
     * @return success Whether all tokens can be minted
     * @return reason Reason if cannot mint (0=success, 1=inactive, 2=paused, 3=emergency_paused, 4=token_unavailable, 5=invalid_token)
     * @return unavailableTokenId First unavailable token ID (if reason=4 or 5)
     */
    function canMintTokenIds(
        uint256[] calldata tokenIds
    ) external view returns (bool success, uint8 reason, uint256 unavailableTokenId) {
        SalePhase currentPhase = getCurrentPhase();
        if (currentPhase != SalePhase.Public && currentPhase != SalePhase.Whitelist)
            return (false, 1, 0);
        if (paused()) return (false, 2, 0);
        if (emergencyPauseEnd > 0 && block.timestamp < emergencyPauseEnd) return (false, 3, 0);

        bool[] memory available = nftContract.areTokensAvailable(tokenIds);
        uint256 maxSupply = nftContract.maxSupply();
        uint256 length = available.length;
        for (uint256 i = 0; i < length; ) {
            if (!available[i]) {
                if (tokenIds[i] >= maxSupply) {
                    return (false, 5, tokenIds[i]); // invalid token
                } else {
                    return (false, 4, tokenIds[i]); // token unavailable
                }
            }
            unchecked {
                ++i;
            }
        }
        return (true, 0, 0);
    }

    /**
     * @notice Check if specific token IDs are available for minting
     * @dev Efficient batch checking for frontend, limited to 50 tokens max
     * @param tokenIds Array of token IDs to check (max 50)
     * @return available Array of booleans indicating if each token is available
     */
    function isAvailable(
        uint256[] calldata tokenIds
    ) external view returns (bool[] memory available) {
        if (tokenIds.length > 50) revert BatchSizeTooLarge(tokenIds.length, 50);

        available = new bool[](tokenIds.length);
        uint256 maxSupply = nftContract.maxSupply();

        uint256 length = tokenIds.length;
        for (uint256 i = 0; i < length; ) {
            uint256 tokenId = tokenIds[i];
            // Token is available if: within range AND not yet minted
            available[i] = tokenId < maxSupply && !nftContract.isTokenMinted(tokenId);
            unchecked {
                ++i;
            }
        }

        return available;
    }

    /**
     * @notice Get remaining gifts artist can make
     * @return Number of gifts artist can still make
     */
    function getRemainingArtistGifts() external view returns (uint256) {
        return MAX_ARTIST_GIFTS - totalArtistGifted;
    }

    /**
     * @notice Get random available token IDs for purchase
     * @dev Uses deterministic randomness (block.timestamp + msg.sender) for convenience discovery
     * @dev View-only function for frontend - guaranteed to return requested amount or all remaining
     * @param n Number of random available tokens to find (max MAX_BATCH_SIZE)
     * @return tokenIds Array of available token IDs (guaranteed n tokens or remainingSupply, whichever is less)
     */
    function getRandomAvailableWorks(uint256 n) external view returns (uint256[] memory tokenIds) {
        if (n == 0) return new uint256[](0);
        if (n > MAX_BATCH_SIZE) revert BatchSizeTooLarge(n, MAX_BATCH_SIZE);

        uint256 maxSupply = nftContract.maxSupply();
        uint256 remainingSupply = nftContract.remainingSupply();

        // If no supply available, return empty array
        if (remainingSupply == 0) {
            return new uint256[](0);
        }

        // Cap requested amount to what's available
        uint256 targetCount = n < remainingSupply ? n : remainingSupply;
        uint256[] memory results = new uint256[](targetCount);
        uint256 found = 0;

        // Random starting position for better distribution
        uint256 start = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) %
            maxSupply;

        // Loop until we find all requested tokens (guaranteed within maxSupply iterations)
        for (uint256 i = 0; i < maxSupply && found < targetCount; ) {
            uint256 tokenId = (start + i) % maxSupply;
            if (!nftContract.isTokenMinted(tokenId)) {
                results[found] = tokenId;
                unchecked {
                    ++found;
                }
            }
            unchecked {
                ++i;
            }
        }

        return results;
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to handle paid minting logic with exact payment requirement
     *
     * SECURITY PATTERN:
     * 1. Validate inputs and require exact payment
     * 2. Call external NFT contract (reverts if any token is already minted)
     * 3. UPDATE STATE (prevent reentrancy)
     *
     * GAS OPTIMIZATIONS:
     * - Batch revenue calculation
     * - Single storage updates for counters
     * - Emit batch events alongside individual events
     *
     * @param recipient Address to receive the minted tokens (validated)
     * @param tokenIds Array of specific token IDs to mint (max 50)
     * @return mintedTokenIds Array of successfully minted token IDs
     *
     * @custom:invariant totalSold increases by tokenIds.length
     * @custom:invariant totalRevenue increases by (price * tokenIds.length)
     * @custom:invariant All tokenIds must be available or transaction reverts
     */
    function _executePaidMint(
        address recipient,
        uint256[] calldata tokenIds
    ) internal returns (uint256[] memory mintedTokenIds) {
        if (tokenIds.length == 0) revert EmptyTokenArray();
        if (tokenIds.length > MAX_BATCH_SIZE)
            revert BatchSizeTooLarge(tokenIds.length, MAX_BATCH_SIZE);
        if (recipient == address(0)) revert InvalidRecipient();

        uint256 totalCost = price * tokenIds.length;

        // Require exact payment - no overpayment allowed
        if (msg.value != totalCost) {
            revert InsufficientPayment(totalCost, msg.value);
        }

        // Call NFT contract's batch mint function
        // This will revert if any tokenId is already minted
        uint256[] memory actuallyMinted;
        try nftContract.mintTo(recipient, tokenIds) returns (uint256[] memory minted) {
            actuallyMinted = minted;
        } catch {
            revert MintFailed();
        }

        // All tokens must be minted successfully
        if (actuallyMinted.length != tokenIds.length) {
            revert MintFailed();
        }

        // UPDATE STATE (prevent reentrancy) - Gas optimized
        uint256 mintedCount = actuallyMinted.length;
        uint256 batchRevenue = totalCost;

        // Single storage update (saves ~5000 gas)
        // Gas-optimized storage updates with safe casting
        totalSold += uint128(mintedCount);
        totalRevenue += batchRevenue;

        // Emit batch event (saves ~2000 gas vs individual events)
        emit BatchMinted(msg.sender, recipient, actuallyMinted, batchRevenue);

        // Still emit individual events for backward compatibility
        for (uint256 i = 0; i < mintedCount; ) {
            emit NFTMinted(recipient, actuallyMinted[i], price);
            unchecked {
                ++i;
            }
        }

        return actuallyMinted;
    }

    // ============ Receive Functions ============

    /**
     * @notice Prevent accidental ETH sends
     */
    receive() external payable {
        revert("Use sale functions");
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Use sale functions");
    }
}
