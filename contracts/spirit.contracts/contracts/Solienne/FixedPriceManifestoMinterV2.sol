// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SolienneManifesto} from "./SolienneManifesto.sol";

/**
 * @title FixedPriceManifestoMinterV2 (ERC-1155) - V2 with Crossmint Support
 * @author Eden Platform
 * @notice Subscription and minting logic for Solienne Manifesto NFTs (ERC-1155)
 * @dev All business logic lives here: subscriptions, pricing, batch distribution
 * @dev The NFT contract is pure ERC-1155, this contract is the only authorized minter
 * @dev PAYMENT: Accepts USDC only (ERC-20 stablecoin with 6 decimals)
 *
 * SUBSCRIPTION TIERS (USDC):
 * - Tier 1 (Monthly): $30 USDC (30e6) → 30 days
 * - Tier 2 (Yearly):  $300 USDC (300e6) → 365 days
 *
 * DIRECT MINTING (Non-Subscribers):
 * - One-time purchases via mint() / mintTo() from active sales
 * - Fixed price: $5 USDC per mint (SINGLE_MINT_PRICE constant)
 * - Users must approve USDC spending before calling mint functions
 *
 * PERMISSIONS:
 * - Owner: Create sales, distribute to subscribers, withdraw funds, pause
 * - Anyone: Can call subscribeFor() to gift subscriptions (caller pays, recipient receives)
 *
 * SETUP REQUIRED AFTER DEPLOYMENT:
 * 1. Set this contract as authorized minter on the NFT contract:
 *    nft.updateMinter(address(minter))
 * Without this step, minting and createManifestoAndSale() will fail
 *
 * USDC CONTRACT ADDRESSES:
 * - Base Mainnet: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
 * - Base Sepolia: 0x036cbd53842c5426634e7929541ec2318f3dcf7e
 *
 * V2 FEATURES - GIFT SUBSCRIPTIONS:
 * - subscribeFor() allows anyone to pay for subscriptions on behalf of others
 * - Caller approves USDC → calls subscribeFor(recipient, tier) → recipient gets subscription
 * - Payment collected on-chain (same as subscribe())
 * - Use cases: Crossmint integration, gifting, corporate sponsorships, payment processors
 * - Standard mint() and mintTo() interfaces for NFT purchases
 */
contract FixedPriceManifestoMinterV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    /**
     * @notice Subscription tier and expiration
     * @param tier 1 = monthly ($30), 2 = yearly ($300)
     * @param expiresAt Unix timestamp when subscription expires
     * @param subscribedAt Unix timestamp of first subscription (never changes on renewals)
     */
    struct Subscription {
        uint8 tier;
        uint256 expiresAt;
        uint256 subscribedAt;
    }

    /**
     * @notice Time-windowed sale configuration for non-subscribers
     * @param manifestoId Which manifesto is being sold
     * @param price Price per token in wei (can be 0 for free sales)
     * @param startTime When the sale starts (timestamp)
     * @param endTime When the sale ends (timestamp)
     * @param active Whether this sale is active
     * @param exists Whether this sale has been created
     */
    struct Sale {
        uint256 manifestoId;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool exists;
    }

    // ============ State Variables ============

    /// @notice Solienne Manifesto NFT contract instance
    SolienneManifesto public immutable manifestoContract;

    /// @notice Payment token contract (USDC)
    IERC20 public immutable paymentToken;

    /// @notice Address to receive sale proceeds and subscription payments
    address public payoutAddress;

    /// @notice Fixed pricing in USDC (6 decimals)
    uint256 public constant SINGLE_MINT_PRICE = 5e6; // $5 USDC (one-time purchase)
    uint256 public constant MONTHLY_PRICE = 30e6; // $30 USDC (Tier 1)
    uint256 public constant YEARLY_PRICE = 300e6; // $300 USDC (Tier 2)

    /// @notice Maximum batch size for distribution
    uint256 public constant MAX_BATCH_SIZE = 200;

    /// @notice Maximum tokens that can be minted per transaction (non-subscribers)
    uint256 public constant MAX_MINT_PER_TX = 50;

    /// @notice Maximum subscription duration cap (10 years from now)
    uint256 public constant MAX_SUBSCRIPTION_YEARS = 10;

    /// @notice Mapping from address to subscription data
    mapping(address => Subscription) public subscriptions;

    /// @notice Mapping from sale ID to sale configuration (for non-subscribers)
    mapping(uint256 => Sale) public sales;

    /// @notice Mapping from start date (timestamp) to sale ID for easy lookup
    /// @dev Stores saleId + 1 to distinguish saleId 0 from unset (0)
    /// @dev Use getSaleByDate() to retrieve, which handles the offset
    mapping(uint256 => uint256) public dateToSaleId;

    /// @notice Mapping from manifesto ID to sale ID for direct lookup
    /// @dev Allows multiple sales for same manifesto - latest sale overwrites previous
    /// @dev This is intentional to support: re-sales, price changes, extended windows
    /// @dev Use getSaleByManifestoId() which returns the most recent sale
    mapping(uint256 => uint256) public manifestoIdToSaleId;

    /// @notice Current sale ID counter
    uint256 private _saleIdCounter;

    /// @notice Total revenue collected in USDC (6 decimals)
    uint256 public totalRevenue;

    /// @notice Total number of manifesto copies distributed through this minter
    uint256 public totalMinted;

    /// @notice Total number of unique subscribers ever (for indexing)
    uint256 public subscriberCount;

    /// @notice Mapping from index to subscriber address (for on-chain iteration)
    mapping(uint256 => address) public subscriberByIndex;

    /// @notice Tracking if address has ever subscribed (prevents duplicate indexing)
    mapping(address => bool) public hasEverSubscribed;

    // ============ Events ============

    event Subscribed(
        address indexed user,
        uint8 tier,
        uint256 expiresAt,
        uint256 subscribedAt,
        bool isRenewal
    );
    event SubscribedFor(
        address indexed recipient,
        address indexed sponsor,
        uint8 tier,
        uint256 expiresAt,
        uint256 subscribedAt,
        bool isRenewal
    );
    event SaleConfigured(
        uint256 indexed saleId,
        uint256 indexed manifestoId,
        uint256 price,
        uint256 startTime,
        uint256 endTime
    );
    event SaleDeactivated(uint256 indexed saleId);
    event ManifestoMinted(
        uint256 indexed manifestoId,
        uint256 indexed saleId,
        address indexed recipient,
        uint256 amount,
        uint256 price
    );
    event BatchDistributed(
        uint256 indexed manifestoId,
        uint256 recipientCount,
        uint256 successCount,
        uint256 failedCount
    );
    event PayoutAddressUpdated(address indexed previousAddress, address indexed newAddress);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    // ============ Errors ============

    error InvalidManifestoContract();
    error InvalidPayoutAddress();
    error InvalidPaymentToken();
    error InvalidRecipient();
    error InvalidTimeWindow();
    error InvalidTier();
    error BatchTooLarge();
    error ManifestoNotFound(uint256 manifestoId);
    error SaleNotFound(uint256 saleId);
    error SaleNotActive(uint256 saleId);
    error SaleNotStarted(uint256 saleId, uint256 startTime);
    error SaleEnded(uint256 saleId, uint256 endTime);
    error NoFundsToWithdraw();
    error ExceedsMaxPerTx(uint256 requested, uint256 maximum);
    error InvalidAmount();
    error EmptyBatch();

    // ============ Constructor ============

    /**
     * @notice Initialize the Fixed Price Manifesto Minter V2 (ERC-1155)
     * @param _manifestoContract Address of the SolienneManifesto NFT contract
     * @param _owner Owner address (controls all admin functions)
     * @param _payoutAddress Address to receive sale proceeds
     * @param _paymentToken Address of the USDC token contract
     */
    constructor(
        address _manifestoContract,
        address _owner,
        address _payoutAddress,
        address _paymentToken
    ) Ownable(_owner) {
        if (_manifestoContract == address(0)) revert InvalidManifestoContract();
        if (_owner == address(0) || _payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_paymentToken == address(0)) revert InvalidPaymentToken();

        manifestoContract = SolienneManifesto(_manifestoContract);
        payoutAddress = _payoutAddress;
        paymentToken = IERC20(_paymentToken);

        // Initialize sale counter to 10 (first sale will be ID 10, nextSaleId will be 11)
        _saleIdCounter = 10;

        emit PayoutAddressUpdated(address(0), _payoutAddress);
    }

    // ============ External Functions - Subscriptions ============

    /**
     * @notice Subscribe to receive manifestos
     * @dev Anyone can subscribe by paying the correct amount in USDC
     * @dev User must approve USDC spending before calling this function
     * @dev Subscriptions stack: paying again extends your existing subscription
     * @dev Maximum subscription duration is capped at 10 years from now
     * @param tier 1 = monthly ($30), 2 = yearly ($300)
     */
    function subscribe(uint8 tier) external nonReentrant whenNotPaused {
        if (tier != 1 && tier != 2) revert InvalidTier();

        uint256 price = tier == 1 ? MONTHLY_PRICE : YEARLY_PRICE;
        uint256 duration = tier == 1 ? 30 days : 365 days;

        // Stack subscriptions: extend from current expiry if active, otherwise from now
        uint256 newExpiry;
        if (subscriptions[msg.sender].expiresAt > block.timestamp) {
            // Extend existing active subscription
            newExpiry = subscriptions[msg.sender].expiresAt + duration;
        } else {
            // New or expired subscription
            newExpiry = block.timestamp + duration;
        }

        // Cap subscription at 10 years from now to prevent overflow abuse
        uint256 maxExpiry = block.timestamp + (MAX_SUBSCRIPTION_YEARS * 365 days);
        if (newExpiry > maxExpiry) {
            newExpiry = maxExpiry;
        }

        // Preserve original subscribedAt for existing subscribers
        uint256 originalSubscribedAt = subscriptions[msg.sender].subscribedAt;
        bool isRenewal = originalSubscribedAt != 0;

        // Only set subscribedAt on first subscription
        if (originalSubscribedAt == 0) {
            originalSubscribedAt = block.timestamp;
        }

        subscriptions[msg.sender] = Subscription({
            tier: tier,
            expiresAt: newExpiry,
            subscribedAt: originalSubscribedAt
        });

        // Add to subscriber index if first time subscriber
        if (!hasEverSubscribed[msg.sender]) {
            subscriberByIndex[subscriberCount] = msg.sender;
            hasEverSubscribed[msg.sender] = true;
            unchecked {
                subscriberCount++;
            }
        }

        // Update state BEFORE external calls (CEI pattern)
        totalRevenue += price;

        // Transfer USDC from user to contract
        paymentToken.safeTransferFrom(msg.sender, address(this), price);

        emit Subscribed(msg.sender, tier, newExpiry, originalSubscribedAt, isRenewal);
    }

    /**
     * @notice Subscribe on behalf of another address (gift subscription)
     * @dev V2 FEATURE: Anyone can pay to create subscriptions for others
     * @dev Caller pays the USDC, recipient gets the subscription
     * @dev Useful for: Crossmint, Stripe, gifting, corporate sponsorships
     * @dev User must approve USDC spending before calling this function
     * @dev Subscription behavior matches subscribe(): stacking, capping, indexing
     * @param recipient The address receiving the subscription
     * @param tier Subscription tier (1 = monthly, 2 = yearly)
     */
    function subscribeFor(address recipient, uint8 tier) external nonReentrant whenNotPaused {
        // Validate parameters
        if (tier != 1 && tier != 2) revert InvalidTier();
        if (recipient == address(0)) revert InvalidRecipient();

        uint256 price = tier == 1 ? MONTHLY_PRICE : YEARLY_PRICE;
        uint256 duration = tier == 1 ? 30 days : 365 days;

        // Stack subscriptions: extend from current expiry if active, otherwise from now
        uint256 newExpiry;
        if (subscriptions[recipient].expiresAt > block.timestamp) {
            // Extend existing active subscription
            newExpiry = subscriptions[recipient].expiresAt + duration;
        } else {
            // New or expired subscription
            newExpiry = block.timestamp + duration;
        }

        // Cap subscription at 10 years from now to prevent overflow abuse
        uint256 maxExpiry = block.timestamp + (MAX_SUBSCRIPTION_YEARS * 365 days);
        if (newExpiry > maxExpiry) {
            newExpiry = maxExpiry;
        }

        // Preserve original subscribedAt for existing subscribers
        uint256 originalSubscribedAt = subscriptions[recipient].subscribedAt;
        bool isRenewal = originalSubscribedAt != 0;

        // Only set subscribedAt on first subscription
        if (originalSubscribedAt == 0) {
            originalSubscribedAt = block.timestamp;
        }

        subscriptions[recipient] = Subscription({
            tier: tier,
            expiresAt: newExpiry,
            subscribedAt: originalSubscribedAt
        });

        // Add to subscriber index if first time subscriber
        if (!hasEverSubscribed[recipient]) {
            subscriberByIndex[subscriberCount] = recipient;
            hasEverSubscribed[recipient] = true;
            unchecked {
                subscriberCount++;
            }
        }

        // Update state BEFORE external calls (CEI pattern)
        totalRevenue += price;

        // Transfer USDC from caller (msg.sender) to contract
        paymentToken.safeTransferFrom(msg.sender, address(this), price);

        emit SubscribedFor(recipient, msg.sender, tier, newExpiry, originalSubscribedAt, isRenewal);
    }

    /**
     * @notice Check if an address has an active subscription
     * @param user Address to check
     * @return True if subscription is active
     */
    function isActive(address user) public view returns (bool) {
        return subscriptions[user].expiresAt > block.timestamp;
    }

    /**
     * @notice Get full subscription details for an address
     * @param user Address to check
     * @return tier Subscription tier (1 = monthly, 2 = yearly, 0 = never subscribed)
     * @return expiresAt Expiration timestamp (0 if never subscribed)
     * @return subscribedAt First subscription timestamp (0 if never subscribed)
     * @return isActive Whether subscription is currently active
     * @return daysRemaining Days until expiration (0 if expired or never subscribed)
     */
    function getSubscriptionDetails(
        address user
    )
        external
        view
        returns (
            uint8 tier,
            uint256 expiresAt,
            uint256 subscribedAt,
            bool isActive,
            uint256 daysRemaining
        )
    {
        Subscription memory sub = subscriptions[user];
        bool active = sub.expiresAt > block.timestamp;
        uint256 remaining = active ? (sub.expiresAt - block.timestamp) / 1 days : 0;

        return (sub.tier, sub.expiresAt, sub.subscribedAt, active, remaining);
    }

    // ============ External Functions - Batch Distribution ============

    /**
     * @notice Distribute manifesto to a batch of subscribers
     * @dev Can only be called by owner
     * @dev Batch size limited to MAX_BATCH_SIZE (200) for gas efficiency
     * @dev Uses ERC-1155 batch minting for maximum efficiency
     * @param subscribers Array of subscriber addresses (must have active subscriptions)
     * @param manifestoId Manifesto type to distribute
     * @return successCount Number of successful distributions
     */
    function distributeToSubscribersBatch(
        address[] calldata subscribers,
        uint256 manifestoId
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256 successCount) {
        if (subscribers.length > MAX_BATCH_SIZE) revert BatchTooLarge();

        // Note: If manifestoId doesn't exist, mint() will revert with ManifestoNotFound

        // Mint to each active subscriber with try/catch for DOS protection
        uint256 failedCount = 0;
        successCount = 0;

        for (uint256 i = 0; i < subscribers.length; i++) {
            // Skip inactive subscribers
            if (!isActive(subscribers[i])) {
                continue;
            }

            // Try to mint to this subscriber
            // Using try/catch prevents malicious contracts from blocking distribution
            try manifestoContract.mint(subscribers[i], manifestoId, 1) {
                unchecked {
                    successCount++;
                }
            } catch {
                unchecked {
                    failedCount++;
                }
            }
        }

        // Update total minted counter
        if (successCount > 0) {
            unchecked {
                totalMinted += successCount;
            }
        }

        emit BatchDistributed(manifestoId, subscribers.length, successCount, failedCount);

        return successCount;
    }

    // ============ External Functions - Single Sales (Non-Subscribers) ============

    /**
     * @notice Configure a new time-windowed sale (for non-subscribers)
     * @dev Can only be called by owner
     * @dev Typical use: 24-hour sale window for manifesto purchases
     * @dev Fixed price: $5 USDC per mint (SINGLE_MINT_PRICE constant, immutable)
     * @dev Multiple sales can have same startTime - dateToSaleId stores most recent
     * @param manifestoId Manifesto type to sell (must exist)
     * @param startTime Sale start timestamp (use block.timestamp for immediate)
     * @param endTime Sale end timestamp (e.g., startTime + 24 hours)
     * @return saleId The ID of the created sale
     */
    function createSale(
        uint256 manifestoId,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        if (!manifestoContract.manifestoExists(manifestoId)) {
            revert ManifestoNotFound(manifestoId);
        }
        if (endTime <= startTime) revert InvalidTimeWindow();

        // Note: Multiple sales can have same startTime (collisions allowed)
        // dateToSaleId will store the most recent sale for that timestamp
        uint256 saleId = _saleIdCounter;

        sales[saleId] = Sale({
            manifestoId: manifestoId,
            price: SINGLE_MINT_PRICE,
            startTime: startTime,
            endTime: endTime,
            active: true,
            exists: true
        });

        // Store mappings for easy lookup
        // Store saleId + 1 to distinguish saleId 0 from unset (0)
        dateToSaleId[startTime] = saleId + 1;
        manifestoIdToSaleId[manifestoId] = saleId;

        unchecked {
            _saleIdCounter++;
        }

        emit SaleConfigured(saleId, manifestoId, SINGLE_MINT_PRICE, startTime, endTime);

        return saleId;
    }

    /**
     * @notice Create manifesto and sale in a single transaction (printing press model)
     * @dev Can only be called by owner
     * @dev Requires this contract to be set as authorized minter on the NFT contract
     * @dev Call: nft.updateMinter(address(this)) after deployment
     * @dev Saves gas by combining two operations into one transaction
     * @dev Fixed price: $5 USDC per mint (SINGLE_MINT_PRICE constant)
     * @dev Manifesto timestamp = block.timestamp (when created, always unique)
     * @dev Sale: starts NOW, ends in 24 hours (auto-calculated)
     * @dev Multiple sales can run concurrently (different sale IDs)
     * @param uri IPFS URI for the manifesto metadata
     * @return manifestoId The ID of the created manifesto
     * @return saleId The ID of the created sale
     */
    function createManifestoAndSale(
        string calldata uri
    ) external onlyOwner nonReentrant returns (uint256 manifestoId, uint256 saleId) {
        // Manifesto timestamp = NOW (creation time, always unique)
        uint256 timestamp = block.timestamp;

        // Sale: starts NOW, ends in 24 hours
        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + 24 hours;

        // Pre-allocate sale ID (CEI pattern - update state before external call)
        saleId = _saleIdCounter;
        unchecked {
            _saleIdCounter++;
        }

        // Create manifesto on NFT contract (requires minter to be authorized via updateMinter)
        manifestoId = manifestoContract.createManifesto(uri, timestamp);

        // Store sale configuration (after external call, but using pre-allocated ID)
        sales[saleId] = Sale({
            manifestoId: manifestoId,
            price: SINGLE_MINT_PRICE,
            startTime: startTime,
            endTime: endTime,
            active: true,
            exists: true
        });

        // Store mappings for easy lookup
        // Store saleId + 1 to distinguish saleId 0 from unset (0)
        // Note: Multiple sales can have same startTime (collisions allowed)
        dateToSaleId[startTime] = saleId + 1;
        manifestoIdToSaleId[manifestoId] = saleId;

        emit SaleConfigured(saleId, manifestoId, SINGLE_MINT_PRICE, startTime, endTime);

        return (manifestoId, saleId);
    }

    /**
     * @notice Deactivate a sale (emergency stop for specific sale)
     * @dev Can only be called by owner
     * @param saleId ID of the sale to deactivate
     */
    function deactivateSale(uint256 saleId) external onlyOwner {
        if (!sales[saleId].exists) revert SaleNotFound(saleId);
        sales[saleId].active = false;
        emit SaleDeactivated(saleId);
    }

    /**
     * @notice Mint manifesto from an active sale (self-mint, non-subscribers)
     * @dev Requires USDC payment (user must approve USDC first) and active sale window
     * @dev Crossmint compatible: standard interface
     * @param saleId ID of the sale to mint from
     * @param quantity Number of copies to mint (max 50 per tx)
     */
    function mint(uint256 saleId, uint256 quantity) external nonReentrant whenNotPaused {
        _executeMint(msg.sender, saleId, quantity);
    }

    /**
     * @notice Mint manifesto from an active sale to a recipient (non-subscribers)
     * @dev Requires USDC payment (user must approve USDC first) and active sale window
     * @dev Crossmint compatible: can mint to different recipient
     * @param recipient Address to receive the manifesto
     * @param saleId ID of the sale to mint from
     * @param quantity Number of copies to mint (max 50 per tx)
     */
    function mintTo(
        address recipient,
        uint256 saleId,
        uint256 quantity
    ) external nonReentrant whenNotPaused {
        _executeMint(recipient, saleId, quantity);
    }

    /**
     * @notice Batch mint manifestos to multiple recipients (admin airdrop for non-subscribers)
     * @dev Can only be called by owner
     * @dev Useful for promotional airdrops, partnerships, or giveaways
     * @dev No payment required (admin-controlled distribution)
     * @dev Batch size limited to MAX_BATCH_SIZE (200) for gas efficiency
     * @param saleId ID of the sale to mint from (must be active)
     * @param recipients Array of addresses to receive manifestos
     * @param amounts Array of amounts for each recipient
     * @return successCount Number of successful mints
     */
    function adminMintBatch(
        uint256 saleId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256 successCount) {
        if (recipients.length == 0) revert EmptyBatch();
        if (recipients.length != amounts.length) revert InvalidAmount();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge();

        Sale memory sale = sales[saleId];

        // Check if sale exists and is active
        if (!sale.exists) revert SaleNotFound(saleId);
        if (!sale.active) revert SaleNotActive(saleId);

        // Note: No time window checks for admin (can airdrop before/after sale)
        // Note: No payment required (admin-controlled distribution)

        successCount = 0;
        uint256 totalAmount = 0;

        // Mint to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0) || amounts[i] == 0) {
                continue;
            }

            // Mint manifestos
            manifestoContract.mint(recipients[i], sale.manifestoId, amounts[i]);

            unchecked {
                successCount++;
                totalAmount += amounts[i];
            }
        }

        // Update total minted counter
        totalMinted += totalAmount;

        return successCount;
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to execute mint with validation
     * @param recipient Address to receive the manifestos
     * @param saleId ID of the sale to mint from
     * @param quantity Number of copies to mint
     */
    function _executeMint(address recipient, uint256 saleId, uint256 quantity) internal {
        if (recipient == address(0)) revert InvalidRecipient();
        if (quantity == 0 || quantity > MAX_MINT_PER_TX) {
            revert ExceedsMaxPerTx(quantity, MAX_MINT_PER_TX);
        }

        Sale memory sale = sales[saleId];

        // Check if sale exists and is active
        if (!sale.exists) revert SaleNotFound(saleId);
        if (!sale.active) revert SaleNotActive(saleId);

        // Check time window
        if (block.timestamp < sale.startTime) {
            revert SaleNotStarted(saleId, sale.startTime);
        }
        if (block.timestamp >= sale.endTime) {
            revert SaleEnded(saleId, sale.endTime);
        }

        // Calculate total cost in USDC
        uint256 totalCost = sale.price * quantity;

        // Update state BEFORE external calls (CEI pattern)
        totalRevenue += totalCost;
        totalMinted += quantity;

        // Transfer USDC from user to contract
        paymentToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Mint manifestos
        manifestoContract.mint(recipient, sale.manifestoId, quantity);

        emit ManifestoMinted(sale.manifestoId, saleId, recipient, quantity, sale.price);
    }

    // ============ External Functions - Admin ============

    /**
     * @notice Update the payout address
     * @dev Can only be called by owner
     * @param newPayoutAddress New address to receive sale proceeds
     */
    function updatePayoutAddress(address newPayoutAddress) external onlyOwner {
        if (newPayoutAddress == address(0)) revert InvalidPayoutAddress();
        address prev = payoutAddress;
        payoutAddress = newPayoutAddress;
        emit PayoutAddressUpdated(prev, newPayoutAddress);
    }

    /**
     * @notice Pause all minting operations (emergency stop)
     * @dev Can only be called by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting operations
     * @dev Can only be called by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw USDC balance to payout address
     * @dev Can only be called by owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = paymentToken.balanceOf(address(this));
        if (balance == 0) revert NoFundsToWithdraw();

        paymentToken.safeTransfer(payoutAddress, balance);

        emit FundsWithdrawn(payoutAddress, balance);
    }

    // ============ External View Functions ============

    /**
     * @notice Check if a sale is currently available for minting (non-subscribers)
     * @param saleId ID of the sale to check
     * @return available True if sale is available for minting
     * @return manifestoId The manifesto being sold
     * @return price Current price per token (0 if not available)
     * @return timeRemaining Seconds remaining in sale window (0 if not available)
     */
    function isSaleAvailable(
        uint256 saleId
    )
        external
        view
        returns (bool available, uint256 manifestoId, uint256 price, uint256 timeRemaining)
    {
        Sale memory sale = sales[saleId];

        if (!sale.exists) return (false, 0, 0, 0);
        if (!sale.active) return (false, 0, 0, 0);
        if (block.timestamp < sale.startTime) return (false, 0, 0, 0);
        if (block.timestamp >= sale.endTime) return (false, 0, 0, 0);

        return (true, sale.manifestoId, sale.price, sale.endTime - block.timestamp);
    }

    /**
     * @notice Calculate total cost for minting quantity from a sale
     * @param saleId ID of the sale
     * @param quantity Number of copies to mint
     * @return Total cost in wei
     */
    function calculateTotalCost(uint256 saleId, uint256 quantity) external view returns (uint256) {
        Sale memory sale = sales[saleId];
        return sale.price * quantity;
    }

    /**
     * @notice Get sale information
     * @param saleId ID of the sale
     * @return sale The sale configuration
     */
    function getSale(uint256 saleId) external view returns (Sale memory sale) {
        return sales[saleId];
    }

    /**
     * @notice Get sale by start date
     * @param startDate Start date timestamp
     * @return exists True if a sale exists for this date
     * @return sale The sale configuration (empty if doesn't exist)
     */
    function getSaleByDate(
        uint256 startDate
    ) external view returns (bool exists, Sale memory sale) {
        uint256 storedValue = dateToSaleId[startDate];
        if (storedValue == 0) {
            return (false, sale);
        }
        // Subtract 1 to get actual saleId (we store saleId + 1)
        uint256 saleId = storedValue - 1;
        Sale memory saleData = sales[saleId];
        return (saleData.exists, saleData);
    }

    /**
     * @notice Get sale by manifesto ID
     * @param manifestoId The manifesto ID to look up
     * @return exists True if a sale exists for this manifesto
     * @return sale The sale configuration (empty if doesn't exist)
     */
    function getSaleByManifestoId(
        uint256 manifestoId
    ) external view returns (bool exists, Sale memory sale) {
        uint256 saleId = manifestoIdToSaleId[manifestoId];
        Sale memory saleData = sales[saleId];
        return (saleData.exists, saleData);
    }

    /**
     * @notice Get the next sale ID that will be created
     * @return The next sale ID
     */
    function nextSaleId() external view returns (uint256) {
        return _saleIdCounter;
    }

    /**
     * @notice Get minter statistics
     * @return minted Total manifesto copies distributed through this minter
     * @return revenue Total revenue collected in USDC
     * @return balance Current USDC balance
     */
    function getMinterStats()
        external
        view
        returns (uint256 minted, uint256 revenue, uint256 balance)
    {
        return (totalMinted, totalRevenue, paymentToken.balanceOf(address(this)));
    }

    // ============ External View Functions - Subscriber Indexing ============

    /**
     * @notice Get total count of unique subscribers ever
     * @return Total number of addresses that have ever subscribed
     */
    function getTotalSubscriberCount() external view returns (uint256) {
        return subscriberCount;
    }

    /**
     * @notice Get batch of subscriber addresses by index range
     * @dev Returns all subscribers (both active and inactive) in the specified range
     * @dev Use this to iterate through all subscribers on-chain
     * @param start Start index (inclusive)
     * @param end End index (exclusive, like array slicing)
     * @return addresses Array of subscriber addresses in the range
     */
    function getSubscribersBatch(
        uint256 start,
        uint256 end
    ) external view returns (address[] memory addresses) {
        // Validate range
        if (end > subscriberCount) {
            end = subscriberCount;
        }
        if (start >= end) {
            return new address[](0);
        }

        uint256 length = end - start;
        addresses = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            addresses[i] = subscriberByIndex[start + i];
        }

        return addresses;
    }

    /**
     * @notice Get batch of ACTIVE subscriber addresses by index range
     * @dev Filters for only currently active subscriptions (expiresAt > block.timestamp)
     * @dev More gas intensive than getSubscribersBatch() due to filtering
     * @dev Use this when you only want to process active subscribers
     * @param start Start index (inclusive)
     * @param end End index (exclusive, like array slicing)
     * @return addresses Array of active subscriber addresses
     * @return count Number of active subscribers found (addresses array is right-sized)
     */
    function getActiveSubscribersBatch(
        uint256 start,
        uint256 end
    ) external view returns (address[] memory addresses, uint256 count) {
        // Validate range
        if (end > subscriberCount) {
            end = subscriberCount;
        }
        if (start >= end) {
            return (new address[](0), 0);
        }

        uint256 length = end - start;
        address[] memory allAddresses = new address[](length);
        uint256 activeCount = 0;

        // Filter for active subscribers
        for (uint256 i = 0; i < length; i++) {
            address subscriber = subscriberByIndex[start + i];
            if (isActive(subscriber)) {
                allAddresses[activeCount] = subscriber;
                unchecked {
                    activeCount++;
                }
            }
        }

        // Resize array to actual active count
        addresses = new address[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            addresses[i] = allAddresses[i];
        }

        return (addresses, activeCount);
    }
}
