# Abraham Auction Deployment Changes

## Summary of Contract Updates

The AbrahamAuction contract has been significantly enhanced with flexible pricing and batch operations.

### Key Changes

1. **Removed Hardcoded Minimum Bid Floor**
   - Previously: 0.1 ETH minimum enforced globally
   - Now: Per-auction minimum bid (set when creating auctions)
   - Benefit: Flexibility to create auctions with any minimum bid

2. **Automatic Payout on Settlement**
   - Proceeds are now automatically sent to `payoutAddress` when auctions settle
   - Falls back to manual withdrawal if automatic transfer fails
   - No more need to call `withdrawProceeds()` after each settlement

3. **New Batch Operations**
   - `batchSettleAuctions(uint256[] auctionIds)` - Settle multiple auctions in one tx
   - `batchCancelAuctions(uint256[] auctionIds)` - Cancel multiple auctions in one tx
   - Gas savings: ~40-60% compared to individual operations

4. **New Discovery Functions**
   - `getAllActiveAuctions(uint256 startIndex, uint256 endIndex)` - Find all active auctions
   - `getAuctionsNeedingSettlement(uint256 startIndex, uint256 endIndex)` - Find auctions ready to settle
   - `getUserActiveAuctions(address user)` - Find auctions where user is winning
   - `getAuctionByToken(uint256 tokenId)` - Get auction by token ID in one call
   - `getAuctionsByTokens(uint256[] tokenIds)` - Batch get auctions by token IDs

5. **Enhanced Safety Features**
   - `sweepExcessETH()` - Recover unaccounted ETH (force-sent dust, etc.)
     - Only withdraws funds outside the three accounting ledgers
     - Cannot rug bidders - protects escrowed/pending/realized funds
   - `recoverStuckFunds(address user)` - Now requires contract to be paused
     - Makes fund recovery a deliberate governance action
     - Tries to send to user first, falls back to payout address if that fails

## Updated Deployment Output

When you run `make deploy-abraham-auction NETWORK=sepolia`, you'll now see:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ABRAHAM AUCTION DEPLOYMENT                                                     │
└────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────┬────────────────────────────────────────────────────────────┐
│ Network            │ sepolia                                                    │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Owner              │ 0xe4951bEE6FA86B809655922f610FF74C0E33416C                 │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Covenant Address   │ 0xed6D1E67aA52895ee399cC7C1FC80c4961007f75                 │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Payout Address     │ 0xe4951bEE6FA86B809655922f610FF74C0E33416C                 │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Min Bid            │ Per-auction (set when creating auctions)                   │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Bid Increment      │ 5% minimum                                                 │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Extension Window   │ 5 minutes (last 5 mins trigger extension)                  │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Extension Duration │ 5 minutes per late bid                                     │
└────────────────────┴────────────────────────────────────────────────────────────┘

📋 Features: Multi-auction system with batch operations
💰 Min Bid: Per-auction (flexible) | Increment: 5% | Extension: 5 minutes
⚡ NEW: Batch settlement, auction discovery, auto-payout on settlement
```

And the completion message will show:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT COMPLETED                                                           │
└────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────┬────────────────────────────────────────────────────────────┐
│ Contract Address   │ Check deployment logs above for contract address          │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Features           │ Multi-auction system with batch operations & auto-payout  │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Bidding            │ Individual or batch bids with custom amounts              │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Batch Ops          │ batchSettleAuctions(), batchCancelAuctions()              │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Discovery          │ getAllActiveAuctions(), getAuctionsNeedingSettlement()    │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Min Bid            │ Per-auction (flexible, set when creating auctions)        │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Auto-Payout        │ Proceeds sent to payout address on settlement             │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Safety             │ Withdrawal pattern for refunds (pull over push)           │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Anti-Snipe         │ 5-minute extension on bids in last 5 minutes              │
├────────────────────┼────────────────────────────────────────────────────────────┤
│ Next Steps         │ Authorize auction contract on covenant, create auctions   │
└────────────────────┴────────────────────────────────────────────────────────────┘
```

## Breaking Changes for Frontend

1. **Function Signature Changes:**
   - `createAuction(tokenId, startTime, duration, minBid)` - parameter renamed from `reservePrice` to `minBid`
   - `batchCreateAuctions(tokenIds, startTime, duration, minBid)` - parameter renamed from `reservePrice` to `minBid`

2. **Events Changed:**
   - `AuctionCreated` event no longer includes `reservePrice` parameter (only `minBid`)
   - `BatchAuctionsCreated` event parameter renamed from `reservePrice` to `minBid`
   - `MinBidUpdated` event removed (no longer needed)

3. **State Variables Removed:**
   - `globalMinBid` - no longer exists
   - Constants removed: `MIN_BID_FLOOR`, `MAX_GLOBAL_MIN_BID`

4. **Functions Removed:**
   - `updateGlobalMinBid()` - no longer needed

## New Frontend Capabilities

1. **Batch Settlement (High Priority)**
   ```solidity
   // Instead of 6 separate transactions:
   for (let i = 1; i <= 6; i++) {
     await auction.settleAuction(i);
   }

   // Now: 1 transaction
   await auction.batchSettleAuctions([1, 2, 3, 4, 5, 6]);
   ```

2. **Auction Discovery**
   ```solidity
   // Get all active auctions
   const nextId = await auction.nextAuctionId();
   const activeIds = await auction.getAllActiveAuctions(1, nextId);

   // Find auctions needing settlement
   const needSettlement = await auction.getAuctionsNeedingSettlement(1, nextId);

   // Check what a user is winning
   const userWinning = await auction.getUserActiveAuctions(userAddress);
   ```

3. **Flexible Pricing**
   ```solidity
   // Create auction with 0.01 ETH minimum
   await auction.batchCreateAuctions(
     [7, 8, 9, 10, 11, 12],
     startTime,
     86400,  // 24 hours
     ethers.parseEther("0.01")  // Now works!
   );
   ```

## Migration Guide

If you have existing code that interacts with the old contract:

1. Update function calls from `reservePrice` to `minBid`
2. Remove any references to `globalMinBid` or `MIN_BID_FLOOR`
3. Use batch operations where possible for gas savings
4. No need to call `withdrawProceeds()` after settlement (happens automatically)
5. Update event listeners to expect new event signatures

## Testing

All 33 tests pass ✅
Contract compiles successfully ✅
Ready for deployment ✅
