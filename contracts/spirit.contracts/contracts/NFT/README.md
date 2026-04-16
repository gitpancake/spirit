# Daily Auction NFT Contract

## Overview

The `DailyAuctionNFT` contract implements a rolling auction system for NFTs with the following features:

- **Rolling Auctions**: Continuous auction cycle driven by bidding activity
- **Bid-Activated Timers**: Auction timer starts when first bid is placed
- **Settlement-Driven Mint**: NFTs are minted to the winner during settlement; if no bids, no NFT is minted and the next auction is scheduled
- **Auto-Expiry**: Auctions with no bids expire after block cycle duration
- **English Auction**: Each NFT auctioned with starting bid of 0, accepting any bid amount
- **Automatic Refunds**: Previous bids are automatically refunded when outbid
- **Historical Tracking**: All auction history and bidders are recorded on-chain

## Key Features

### Rolling Auction Mechanics

- **Starting Bid**: 0 ETH
- **Bid Increment**: Any amount above current highest bid
- **Timer Activation**: First bid starts the auction countdown timer
- **Automatic Refunds**: Previous highest bidder automatically refunded when outbid
- **Settlement Mints**: After auction ends, anyone can call `settleAuction()`; if there is a winner, the NFT is minted to them
- **Auto-Expiry**: Auctions with no bids expire after block cycle duration

### Configuration

- **Auction Duration**: Immutable seconds for each auction, set at deployment
- **Rest Duration**: Immutable seconds for rest window after each cycle, set at deployment
- **Owner Controls**: Owner can start the genesis auction once

### Historical Data

- Complete auction history stored on-chain
- All bids for each auction recorded
- Automatic refunds processed immediately when outbid

## Contract Functions

### Public Functions

- `placeBid()` - Place a bid on current auction (payable)
- `settleAuction()` - Settle the current auction, minting to the winner if any
- `getCurrentAuction()` - Get current auction details
- `getAuctionBids(uint256 auctionId)` - Get all bids for specific auction
- `getAllAuctionIds()` - Get all historical auction IDs
- `canSettleAuction()` - Check if current auction can be settled

### Owner Functions

- `startGenesisAuction()` - Start the very first auction (can be called only once)

## Events

- `AuctionStarted(uint256 auctionId, uint256 tokenId, uint256 endTime)`
- `BidPlaced(uint256 auctionId, address bidder, uint256 amount)`
- `BidRefunded(uint256 auctionId, address bidder, uint256 amount)`
- `AuctionSettled(uint256 auctionId, address winner, uint256 amount, uint256 tokenId)`
- `NewAuctionScheduled(uint256 auctionId, uint256 tokenId, uint256 startTime)`

## Rolling Auction Flow

1. **Auction Creation**: New auction created (timer not started)
2. **First Bid**: First bid starts the auction countdown timer
3. **Bidding**: Users can place bids with any amount higher than current highest
4. **Automatic Refunds**: Previous highest bidder automatically refunded when outbid
5. **Settlement**: After auction ends, anyone can call `settleAuction()`; if there is a winner, the NFT is minted to them
6. **New Auction**: Settlement triggers creation (or scheduling) of the next auction; if no bids, no NFT is minted
7. **Rest Window**: After every 6 auctions, the next auction is scheduled after the rest duration

## Deployment

The contract is deployed using the Ignition module in `ignition/modules/NFT/DeployDailyAuctionNFT.ts` with the following default parameters:

- **Name**: "Daily Auction NFT"
- **Symbol**: "DAILY"
- **Block Cycle**: 20 blocks (~5 minutes)
- **Auction Duration**: 300 seconds (5 minutes)

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Owner controls for configuration updates
- **Safe Transfers**: Secure ETH transfers for refunds
- **Input Validation**: Comprehensive parameter validation

## Gas Optimization

- Efficient storage patterns for auction data
- Minimal state changes during bidding
- Batch operations for historical data retrieval
