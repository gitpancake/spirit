// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title AuctionErrors
 * @dev Library containing all custom errors for the DailyAuctionNFT contract
 */
library AuctionErrors {
    // ============ Auction State Errors ============

    /// @dev Thrown when attempting to interact with an inactive auction
    error AuctionNotActive();

    /// @dev Thrown when attempting to settle an already settled auction
    error AuctionAlreadySettled();

    /// @dev Thrown when attempting to bid on an auction that hasn't started yet
    error AuctionNotStarted();

    /// @dev Thrown when attempting to bid on an auction that has already ended
    error AuctionHasEnded();

    /// @dev Thrown when attempting to settle an auction that is still active
    error AuctionStillActive();

    /// @dev Thrown when the genesis auction has already been started
    error GenesisAuctionAlreadyStarted();

    // ============ Bidding Errors ============

    /// @dev Thrown when a bid is not higher than the current highest bid
    error BidNotHighEnough(uint256 currentHighestBid, uint256 attemptedBid);

    /// @dev Thrown when attempting to refund ETH to a contract that cannot receive it
    /// @param recipient The address that failed to receive the refund
    /// @param amount The amount that failed to transfer
    error RefundFailed(address recipient, uint256 amount);

    // ============ Transfer Errors ============

    /// @dev Thrown when ETH transfer to payout address fails
    /// @param recipient The intended recipient of the transfer
    /// @param amount The amount that failed to transfer
    error PayoutTransferFailed(address recipient, uint256 amount);

    // ============ Configuration Errors ============

    /// @dev Thrown when an invalid payout address (zero address) is provided
    error InvalidPayoutAddress();

    /// @dev Thrown when invalid auction duration is provided (zero)
    error InvalidAuctionDuration();

    /// @dev Thrown when invalid rest duration is provided (zero)
    error InvalidRestDuration();

    /// @dev Thrown when invalid rest interval is provided (zero)
    error InvalidRestInterval();

    /// @dev Thrown when max auctions is set to zero
    error InvalidMaxAuctions();

    // ============ Token URI Errors ============

    /// @dev Thrown when attempting to set URI for a token that already has one
    /// @param tokenId The token ID that already has a URI set
    error TokenURIAlreadySet(uint256 tokenId);

    /// @dev Thrown when providing an empty URI string
    error EmptyTokenURI();

    /// @dev Thrown when attempting to start an auction without a token URI set
    /// @param tokenId The token ID missing a URI
    error MissingTokenURI(uint256 tokenId);

    /// @dev Thrown when no available token ID can be found for URI assignment
    error NoAvailableTokenId();

    // ============ Limit Errors ============

    /// @dev Thrown when maximum number of auctions has been reached
    /// @param maxAuctions The maximum number of auctions allowed
    error MaxAuctionsReached(uint256 maxAuctions);

    /// @dev Thrown when pagination parameters are invalid
    /// @param providedLimit The limit that was provided
    /// @param minLimit The minimum allowed limit
    /// @param maxLimit The maximum allowed limit
    error InvalidPaginationLimit(uint256 providedLimit, uint256 minLimit, uint256 maxLimit);

    // ============ Refund & Payout Errors ============

    /// @dev Thrown when user tries to recover refunds but has none
    error NoFailedRefundToRecover();

    /// @dev Thrown when refund recovery transfer fails
    /// @param recipient The address that failed to receive the refund
    /// @param amount The amount that failed to transfer
    error RefundRecoveryFailed(address recipient, uint256 amount);

    /// @dev Thrown when payout address tries to withdraw but has no pending payouts
    error NoPayoutToWithdraw();

    /// @dev Thrown when payout withdrawal transfer fails
    /// @param recipient The address that failed to receive the payout
    /// @param amount The amount that failed to transfer
    error PayoutWithdrawalFailed(address recipient, uint256 amount);

    /// @dev Thrown when contract has insufficient balance for operation
    /// @param requested The amount requested
    /// @param available The amount available
    error InsufficientBalance(uint256 requested, uint256 available);

    /// @dev Thrown when accounting is inconsistent between total and per-auction refunds
    /// @param requested The amount requested for recovery
    /// @param available The total amount available for the user
    error AccountingInconsistency(uint256 requested, uint256 available);
}
