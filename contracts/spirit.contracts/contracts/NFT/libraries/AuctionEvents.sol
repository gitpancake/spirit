// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title AuctionEvents
 * @dev Library containing all events for the DailyAuctionNFT contract
 */
library AuctionEvents {
    // ============ Auction Lifecycle Events ============

    /// @dev Emitted when a new auction is started
    /// @param auctionId The unique identifier for this auction
    /// @param tokenId The NFT token ID that will be minted to the winner
    /// @param startTime The timestamp when the auction starts
    /// @param endTime The timestamp when the auction ends
    event AuctionStarted(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        uint256 startTime,
        uint256 endTime
    );

    /// @dev Emitted when an auction is settled
    /// @param auctionId The unique identifier for this auction
    /// @param winner The address that won the auction (zero if no bids)
    /// @param winningBid The final winning bid amount
    /// @param tokenId The NFT token ID minted to the winner
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        uint256 indexed tokenId
    );

    /// @dev Emitted when a rest period is scheduled after an auction block
    /// @param nextAuctionStartTime The timestamp when the next auction will start
    /// @param restDuration The duration of the rest period in seconds
    event RestPeriodScheduled(uint256 nextAuctionStartTime, uint256 restDuration);

    /// @dev Emitted when all auctions have been completed (max reached)
    event AllAuctionsCompleted();

    // ============ Bidding Events ============

    /// @dev Emitted when a bid is placed on an auction
    /// @param auctionId The auction receiving the bid
    /// @param bidder The address placing the bid
    /// @param amount The bid amount in wei
    /// @param timestamp The timestamp of the bid
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );

    /// @dev Emitted when a previous bid is refunded
    /// @param auctionId The auction where the refund occurred
    /// @param bidder The address receiving the refund
    /// @param amount The refunded amount in wei
    event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount);

    /// @dev Emitted when a refund fails and ETH is retained by the contract
    /// @param auctionId The auction where the refund failed
    /// @param failedRecipient The address that failed to receive the refund
    /// @param amount The amount retained by the contract
    event RefundFailedAndRetained(
        uint256 indexed auctionId,
        address indexed failedRecipient,
        uint256 amount
    );

    // ============ Configuration Events ============

    /// @dev Emitted when the payout address is updated
    /// @param previousAddress The old payout address
    /// @param newAddress The new payout address
    event PayoutAddressUpdated(address indexed previousAddress, address indexed newAddress);

    /// @dev Emitted when a token URI is set
    /// @param tokenId The token ID receiving the URI
    /// @param uri The metadata URI for the token
    event TokenURISet(uint256 indexed tokenId, string uri);

    // ============ Payment Events ============

    /// @dev Emitted when auction proceeds are sent to the payout address
    /// @param auctionId The auction that generated the proceeds
    /// @param recipient The payout address receiving the funds
    /// @param amount The amount transferred
    event PayoutSent(uint256 indexed auctionId, address indexed recipient, uint256 amount);

    /// @dev Emitted when payout is withdrawn by the payout address
    /// @param recipient The address that withdrew the payout
    /// @param amount The amount withdrawn
    event PayoutWithdrawn(address indexed recipient, uint256 amount);

    /// @dev Emitted when the contract receives ETH through fallback
    /// @param sender The address sending ETH
    /// @param amount The amount received
    event EthReceived(address indexed sender, uint256 amount);

    // ============ NFT Events ============

    /// @dev Emitted when an NFT is minted to the auction winner
    /// @param tokenId The token ID minted
    /// @param recipient The address receiving the NFT
    /// @param auctionId The auction that resulted in this mint
    event NFTMinted(uint256 indexed tokenId, address indexed recipient, uint256 indexed auctionId);
}
