# AbrahamAuction Test Coverage Requirements

## ✅ Status: NO TESTS EXIST YET - MUST IMPLEMENT BEFORE PRODUCTION

**Last Updated**: 2025-10-23

**Recent Changes**:
- ✅ Removed `batchBid()` function and related tests
- ✅ Added automatic pending balance re-use in `bid()` function
- ✅ Added new test cases for automatic pending balance behavior
- ✅ Updated integration tests with re-bidding scenario

---

## 🎯 Target Coverage: >95%

---

## 1. CONSTRUCTOR & INITIALIZATION TESTS

### Test Suite: `AbrahamAuction.constructor`
- [ ] **Test**: Deploy with valid parameters
  - Verify nftContract set correctly
  - Verify owner set correctly
  - Verify payoutAddress set correctly
  - Verify globalMinBid = MIN_BID_FLOOR
  - Verify extensionWindow = DEFAULT_EXTENSION_WINDOW
  - Verify extensionDuration = DEFAULT_EXTENSION_DURATION

- [ ] **Test**: Revert on zero address NFT contract
  - Expect: `InvalidNFTContract()`

- [ ] **Test**: Revert on zero address payout
  - Expect: `InvalidPayoutAddress()`

---

## 2. AUCTION CREATION TESTS

### Test Suite: `AbrahamAuction.createAuction`

**Happy Path:**
- [ ] Create auction with immediate start (startTime = 0)
- [ ] Create auction with future start time
- [ ] Create auction with custom reserve price
- [ ] Create auction with zero reserve (uses globalMinBid)
- [ ] Verify auction ID increments correctly
- [ ] Verify tokenToAuction mapping updated
- [ ] Verify AuctionCreated event emitted with correct params

**Edge Cases:**
- [ ] Revert if duration = 0 → `InvalidDuration()`
- [ ] Revert if tokenId >= maxSupply → `InvalidTokenId()`
- [ ] Revert if token already has auction → `AuctionAlreadyExists()`
- [ ] Revert if token not owned by covenant → `InvalidTokenId()`
- [ ] Revert if no approval → `InvalidNFTContract()`
- [ ] Revert if reserve < globalMinBid → `InvalidReservePrice()`
- [ ] **NEW**: Revert if endTime <= block.timestamp → `InvalidDuration()`

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`
- [ ] Revert if paused → `EnforcedPause()`

### Test Suite: `AbrahamAuction.batchCreateAuctions`

**Happy Path:**
- [ ] Create multiple auctions in one tx
- [ ] Verify all auction IDs returned correctly
- [ ] Verify BatchAuctionsCreated event emitted

**Edge Cases:**
- [ ] Revert if empty array → `EmptyBatchCreate()`
- [ ] **NEW**: Revert if array > MAX_BATCH_SIZE → `TooManyAuctions()`
- [ ] Revert if any token invalid (stop at first error)
- [ ] **NEW**: Revert if endTime <= block.timestamp → `InvalidDuration()`

**Gas Testing:**
- [ ] Measure gas for 1, 10, 50 auctions
- [ ] Verify gas savings vs individual creates

---

## 3. BIDDING TESTS

### Test Suite: `AbrahamAuction.bid`

**Happy Path:**
- [ ] Place first bid on auction
- [ ] Outbid existing bidder
- [ ] Bid in last extensionWindow triggers extension
- [ ] Verify BidPlaced event with correct params
- [ ] Verify previous bidder added to pendingWithdrawals

**Edge Cases:**
- [ ] Revert if auction doesn't exist → `AuctionNotActive()`
- [ ] Revert if auction settled → `AuctionAlreadySettled()`
- [ ] Revert if before startTime → `AuctionNotActive()`
- [ ] Revert if after endTime → `AuctionEnded()`
- [ ] **NEW**: Revert if bid > MAX_BID → `BidTooHigh()`
- [ ] Revert if bid < minBid → `BidTooLow()`
- [ ] Revert if bid < reservePrice → `BelowReservePrice()`
- [ ] Revert if bid < minIncrement → `BidTooLow()`
- [ ] **NEW**: Revert if self-outbid → `AlreadyHighestBidder()`

**Extension Logic:**
- [ ] No extension if bid outside window
- [ ] Extension by extensionDuration if within window
- [ ] **NEW**: Revert after MAX_AUCTION_EXTENSIONS → `MaxExtensionsReached()`
- [ ] Verify extensionCount increments correctly

**Access Control:**
- [ ] Revert if paused → `EnforcedPause()`
- [ ] Anyone can bid (no owner restriction)

**Accounting:**
- [ ] Verify contract balance increases
- [ ] Verify totalPendingWithdrawals increases for outbid user
- [ ] Verify auction.highestBid updates correctly
- [ ] Verify auction.highestBidder updates correctly

**Automatic Pending Balance Re-use (NEW):**
- [ ] **NEW**: Bid with pending balance automatically used
- [ ] **NEW**: Verify bidAmount = msg.value + pendingWithdrawals[msg.sender]
- [ ] **NEW**: Verify pending balance cleared after successful bid
- [ ] **NEW**: Verify totalPendingWithdrawals decreased correctly
- [ ] **NEW**: Bid without pending balance (unchanged behavior)
- [ ] **NEW**: Bid on different auction with pending from another
- [ ] **NEW**: Multiple re-bids using pending each time
- [ ] **NEW**: Verify accounting invariant maintained throughout
- [ ] **NEW**: Gas comparison: old withdraw+bid vs new auto-use

---

## 4. SETTLEMENT TESTS

### Test Suite: `AbrahamAuction.settleAuction`

**Happy Path:**
- [ ] Settle auction with winner
- [ ] NFT transferred to winner
- [ ] Verify AuctionSettled event
- [ ] Verify auction.settled = true
- [ ] Verify tokenToAuction cleared

**No Bids Case:**
- [ ] Settle auction with no bids
- [ ] Verify AuctionCanceled event
- [ ] Verify auction marked settled
- [ ] No NFT transfer

**Edge Cases:**
- [ ] Revert if auction doesn't exist → `AuctionNotActive()`
- [ ] Revert if not ended → `AuctionNotEnded()`
- [ ] Revert if already settled → `AuctionAlreadySettled()`
- [ ] **CRITICAL**: Revert if approval revoked → `ApprovalMissing()`

**Reentrancy:**
- [ ] Verify nonReentrant protects against reentrancy
- [ ] Test with malicious NFT contract

**Access Control:**
- [ ] Anyone can settle (no owner restriction)

---

## 5. CANCELLATION TESTS

### Test Suite: `AbrahamAuction.cancelAuction`

**Happy Path:**
- [ ] Cancel auction with no bids
- [ ] Verify AuctionCanceled event
- [ ] Verify auction.settled = true

**Anti-Rug Protection:**
- [ ] **CRITICAL**: Revert if bids exist → `CannotCancelWithBids()`
- [ ] Verify owner cannot rug after bids placed

**Edge Cases:**
- [ ] Revert if auction doesn't exist → `AuctionNotActive()`
- [ ] Revert if already settled → `AuctionAlreadySettled()`

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`
- [ ] Revert if paused → No (can cancel when paused)

---

## 6. WITHDRAWAL TESTS

### Test Suite: `AbrahamAuction.withdraw`

**Happy Path:**
- [ ] User withdraws pendingWithdrawals
- [ ] Verify ETH received
- [ ] Verify FundsWithdrawn event
- [ ] Verify pendingWithdrawals[user] = 0
- [ ] Verify totalPendingWithdrawals decreased

**Edge Cases:**
- [ ] Revert if no funds → `NoFundsToWithdraw()`
- [ ] Revert if transfer fails → `WithdrawalFailed()`

**State Restoration:**
- [ ] **CRITICAL**: Verify state restored on failure
- [ ] Test with contract that reverts on receive

**Reentrancy:**
- [ ] Verify nonReentrant protects
- [ ] Test with malicious user contract

**Accounting:**
- [ ] Verify balance decreases correctly
- [ ] Verify totalPendingWithdrawals decreases correctly

---

## 7. OWNER WITHDRAWAL TESTS

### Test Suite: `AbrahamAuction.withdrawProceeds`

**Happy Path:**
- [ ] Owner withdraws available proceeds
- [ ] Verify PayoutWithdrawn event
- [ ] Verify ETH sent to payoutAddress

**Accounting Protection:**
- [ ] **CRITICAL**: Verify respects pendingWithdrawals
- [ ] **NEW**: Revert if accounting mismatch → `AccountingMismatch()`
- [ ] Calculate availableBalance = balance - pendingWithdrawals

**Edge Cases:**
- [ ] Revert if no available funds → `NoFundsToWithdraw()`
- [ ] Revert if transfer fails → `WithdrawalFailed()`

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`

**Reentrancy:**
- [ ] Verify nonReentrant protects

---

## 8. STUCK FUNDS RECOVERY TESTS

### Test Suite: `AbrahamAuction.recoverStuckFunds`

**Happy Path:**
- [ ] Try send to user first (with gas limit)
- [ ] If user receive succeeds, emit FundsWithdrawn
- [ ] If user receive fails, send to payout, emit StuckFundsRecovered

**Edge Cases:**
- [ ] Revert if no funds for user → `NoStuckFundsForUser()`
- [ ] Revert if both transfers fail → `WithdrawalFailed()`

**State Management:**
- [ ] Verify pendingWithdrawals cleared
- [ ] Verify totalPendingWithdrawals decreased
- [ ] **CRITICAL**: Verify state restored if payout fails

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`

**Gas Limit:**
- [ ] Verify 10k gas limit prevents griefing
- [ ] Test with expensive receive function

---

## 9. EMERGENCY ACCOUNTING TESTS

### Test Suite: `AbrahamAuction.emergencyCorrectAccounting` (NEW)

**Happy Path:**
- [ ] Correct user's pending withdrawal up
- [ ] Correct user's pending withdrawal down
- [ ] Verify AccountingCorrected event
- [ ] Verify totalPendingWithdrawals adjusted correctly

**Edge Cases:**
- [ ] Works when correctAmount > oldAmount
- [ ] Works when correctAmount < oldAmount
- [ ] Works when correctAmount = 0

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`
- [ ] **CRITICAL**: Revert if not paused → `ExpectedPause()`

**Reentrancy:**
- [ ] Verify nonReentrant protects

---

## 10. PARAMETER UPDATE TESTS

### Test Suite: `AbrahamAuction.updateGlobalMinBid`

**Happy Path:**
- [ ] Update globalMinBid
- [ ] Verify MinBidUpdated event
- [ ] Verify only affects new auctions

**Edge Cases:**
- [ ] Revert if < MIN_BID_FLOOR → `InvalidMinBid()`
- [ ] **NEW**: Revert if > MAX_GLOBAL_MIN_BID → `InvalidMinBid()`

**Access Control:**
- [ ] Revert if not owner → `OwnableUnauthorizedAccount()`

### Test Suite: `AbrahamAuction.updateExtensionWindow`

**Happy Path:**
- [ ] Update extensionWindow
- [ ] Verify ExtensionWindowUpdated event

**Edge Cases:**
- [ ] **CRITICAL**: Revert if > 24 hours → `InvalidExtensionParam()`

**Access Control:**
- [ ] Revert if not owner

### Test Suite: `AbrahamAuction.updateExtensionDuration`

**Happy Path:**
- [ ] Update extensionDuration
- [ ] Verify ExtensionDurationUpdated event

**Edge Cases:**
- [ ] **CRITICAL**: Revert if > 24 hours → `InvalidExtensionParam()`

**Access Control:**
- [ ] Revert if not owner

### Test Suite: `AbrahamAuction.updatePayoutAddress`

**Happy Path:**
- [ ] Update payoutAddress
- [ ] Verify PayoutAddressUpdated event

**Edge Cases:**
- [ ] Revert if zero address → `InvalidPayoutAddress()`

**Access Control:**
- [ ] Revert if not owner

---

## 11. PAUSE/UNPAUSE TESTS

### Test Suite: `AbrahamAuction.pause/unpause`

**Happy Path:**
- [ ] Owner pauses contract
- [ ] Owner unpauses contract

**Functionality When Paused:**
- [ ] createAuction reverts → `EnforcedPause()`
- [ ] batchCreateAuctions reverts → `EnforcedPause()`
- [ ] bid reverts → `EnforcedPause()`
- [ ] settleAuction works (can settle during pause)
- [ ] cancelAuction works
- [ ] withdraw works
- [ ] withdrawProceeds works
- [ ] recoverStuckFunds works
- [ ] emergencyCorrectAccounting works (requires pause)

**Access Control:**
- [ ] Revert if not owner

---

## 12. VIEW FUNCTION TESTS

### Test Suite: View Functions

- [ ] `getAuction()` returns correct data
- [ ] `isAuctionActive()` correct for all states
- [ ] `getTimeRemaining()` correct calculations
- [ ] `getPendingWithdrawal()` returns correct amount
- [ ] `nextAuctionId()` returns counter value
- [ ] `getAuctions()` batch retrieval works
- [ ] **NEW**: `getAuctionsByTokens()` returns correct auction IDs
- [ ] **NEW**: `needsSettlement()` correct for all states
- [ ] **NEW**: `getBalanceInfo()` returns correct accounting

---

## 13. INTEGRATION TESTS

### Test Suite: Full Auction Lifecycle

**Scenario: Successful Auction**
1. Owner creates auction
2. User A bids
3. User B outbids
4. User A withdraws refund
5. Time passes
6. Anyone settles auction
7. Winner receives NFT
8. Owner withdraws proceeds

**Scenario: Successful Auction with Auto Re-bid (NEW)**
1. Owner creates auction
2. User A bids 0.15 ETH
3. User B outbids with 0.16 ETH
4. User A has 0.15 ETH pending
5. User A re-bids with 0.02 ETH (effective: 0.17 ETH from pending auto-use)
6. User A wins, auction settles
7. User A receives NFT, owner withdraws 0.17 ETH proceeds

**Scenario: No Bids**
1. Owner creates auction
2. Time passes
3. Anyone settles → NFT stays in covenant

**Scenario: Multiple Extensions**
1. Create auction
2. Bid in extension window (extension 1)
3. Bid in extension window (extension 2)
4. ... repeat up to MAX_AUCTION_EXTENSIONS
5. Verify can't extend beyond limit

**Scenario: Batch Auction Creation**
1. Create 10 auctions in batch
2. Verify all created correctly
3. Verify accounting correct

---

## 14. FUZZ TESTS

### Fuzz Suite: Auction Parameters
- [ ] Fuzz startTime (0 to +1 year)
- [ ] Fuzz duration (1 second to 1 year)
- [ ] Fuzz reservePrice (0 to 1000 ETH)

### Fuzz Suite: Bid Amounts
- [ ] Fuzz bid amounts (0.01 ETH to MAX_BID)
- [ ] Verify highestBid never exceeds uint96 max

### Fuzz Suite: Batch Sizes
- [ ] Fuzz array lengths (1 to MAX_BATCH_SIZE)
- [ ] Verify gas doesn't exceed block limit

---

## 15. INVARIANT TESTS

### Invariant Suite: Critical Invariants

**Accounting Invariant:**
```solidity
assert(address(this).balance >= totalPendingWithdrawals);
```
- [ ] Maintain after every operation

**Auction State Invariant:**
```solidity
if (auction.settled) {
    assert(auction.highestBidder == address(0) || nftTransferred);
}
```
- [ ] Maintain after settlement

**Extension Invariant:**
```solidity
assert(auction.extensionCount <= MAX_AUCTION_EXTENSIONS);
```
- [ ] Maintain after every bid

**Token Mapping Invariant:**
```solidity
if (tokenToAuction[tokenId] != 0) {
    assert(auctions[tokenToAuction[tokenId]].exists);
    assert(!auctions[tokenToAuction[tokenId]].settled);
}
```
- [ ] Maintain after all operations

---

## 16. GAS OPTIMIZATION VERIFICATION

### Gas Benchmark Suite

**Struct Optimization:**
- [ ] Measure gas for auction creation (old vs new struct)
- [ ] Verify ~20k gas savings per auction

**Batch Operations:**
- [ ] Measure gas per auction in batch
- [ ] Verify lower than individual operations

---

## 17. SECURITY TESTS

### Attack Suite: Reentrancy

- [ ] Attempt reentrancy via malicious NFT contract
- [ ] Attempt reentrancy via malicious bidder contract
- [ ] Verify all nonReentrant modifiers work

### Attack Suite: DoS

- [ ] Attempt gas griefing via expensive receive
- [ ] Attempt batch array DoS (verify MAX_BATCH_SIZE blocks it)
- [ ] Attempt infinite extension (verify MAX_AUCTION_EXTENSIONS blocks it)

### Attack Suite: Accounting

- [ ] Attempt to inflate totalPendingWithdrawals
- [ ] Attempt to drain more than balance
- [ ] Verify accounting always consistent

---

## 🎯 TESTING PRIORITY

**Phase 1 (Week 1)**: Critical paths + access control
- Constructor
- Auction creation
- Bidding
- Settlement
- Withdrawal

**Phase 2 (Week 2)**: Edge cases + security
- All revert cases
- Reentrancy tests
- Accounting invariants
- Emergency functions

**Phase 3 (Week 3)**: Integration + fuzz
- Full lifecycle tests
- Fuzz tests
- Gas benchmarks
- Invariant tests

---

## 📊 COVERAGE GOALS

- **Line Coverage**: >95%
- **Branch Coverage**: >90%
- **Function Coverage**: 100%
- **Statement Coverage**: >95%

---

## 🛠️ TESTING TOOLS

- **Framework**: Hardhat
- **Language**: TypeScript
- **Assertions**: Chai
- **Coverage**: solidity-coverage
- **Fuzzing**: Echidna or Foundry
- **Gas**: hardhat-gas-reporter

---

## ✅ SIGN-OFF CHECKLIST

Before considering tests complete:

- [ ] All 200+ test cases pass
- [ ] Coverage >95% verified
- [ ] All invariants maintained
- [ ] All fuzz tests pass (1000+ runs)
- [ ] Gas benchmarks documented
- [ ] Security tests pass
- [ ] Integration tests with AbrahamCovenant pass
- [ ] Tests reviewed by second developer
- [ ] Test documentation complete
