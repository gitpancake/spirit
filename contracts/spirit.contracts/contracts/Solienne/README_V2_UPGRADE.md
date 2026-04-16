# FixedPriceManifestoMinterV2 - Crossmint Integration

## Overview

Version 2 of the Fixed Price Manifesto Minter adds a **gift subscription** feature via `subscribeFor()`. Anyone can pay to create subscriptions for other addresses. This enables:

- 🎁 **Gift subscriptions**: Pay for a friend's subscription
- 💳 **Payment processor integration**: Crossmint, Stripe, etc. can subscribe users after collecting payment
- 🏢 **Corporate sponsorships**: Companies can sponsor community member subscriptions
- 🤝 **Bulk sponsorships**: Onboard multiple users at once by paying for their subscriptions

## What's New in V2

### 1. New Function: `subscribeFor()` - Gift Subscriptions

```solidity
function subscribeFor(address recipient, uint8 tier) external nonReentrant whenNotPaused
```

**Purpose**: Allows anyone to pay for a subscription on behalf of another address (gift subscriptions).

**Key Differences from `subscribe()`**:
- **Permissionless**: Anyone can call it (no authorization required)
- Takes `recipient` parameter (the address receiving the subscription, not the payer)
- **Caller pays**: `msg.sender` approves and sends USDC
- **Recipient receives**: Subscription is created for `recipient` address
- Updates `totalRevenue` (same as `subscribe()`)
- Emits `SubscribedFor` event (includes both recipient and sponsor)

**Parameters**:
- `recipient`: User's wallet address receiving the subscription
- `tier`: 1 = monthly (30 days), 2 = yearly (365 days)

**Behavior**:
- ✅ Subscriptions stack (extends existing active subscriptions)
- ✅ 10-year maximum cap (same as `subscribe()`)
- ✅ Adds user to subscriber index (if first time)
- ✅ Preserves original `subscribedAt` timestamp
- ✅ Supports renewals (tracks with `isRenewal` flag)
- ✅ Requires USDC payment from caller (same security as `subscribe()`)
- ✅ Updates `totalRevenue` (full on-chain accounting)

### 2. New Event: `SubscribedFor`

```solidity
event SubscribedFor(
    address indexed recipient,
    address indexed sponsor,
    uint8 tier,
    uint256 expiresAt,
    uint256 subscribedAt,
    bool isRenewal
);
```

**Difference from `Subscribed` event**:
- Includes `sponsor` field (the address that paid for the subscription)
- `recipient` is the address receiving the subscription (different from sponsor)


## Deployment Checklist

### Before Deployment

- [ ] Verify USDC token address matches target network:
  - Base Mainnet: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
  - Base Sepolia: `0x036cbd53842c5426634e7929541ec2318f3dcf7e`
- [ ] Test on testnet first (Base Sepolia recommended)
- [ ] Ensure deployer wallet has ETH for gas

### After Deployment

1. **Set Minter Authorization**:
   ```solidity
   manifestoContract.updateMinter(address(minterV2))
   ```

2. **Verify Contract on Basescan**:
   ```bash
   npx hardhat verify --network base <DEPLOYED_ADDRESS> \
     <MANIFESTO_ADDRESS> \
     <OWNER_ADDRESS> \
     <PAYOUT_ADDRESS> \
     <USDC_ADDRESS>
   ```

3. **Test Crossmint Integration**:
   - Coordinate with Crossmint to whitelist your contract
   - Test credit card purchase flow on testnet
   - Verify `subscribeFor()` creates subscriptions correctly
   - Check `SubscribedFor` events are emitted properly

4. **Update Frontend**:
   - Add new contract address to `lib/contract.ts`
   - Include updated ABI (with `subscribeFor` function)
   - Implement Crossmint payment widget
   - Handle `SubscribedFor` events for UI updates

## Integration Examples

### Use Case 1: Crossmint Payment Processor

1. **User Payment Flow**:
   ```
   User → Crossmint Widget (credit card)
        → Crossmint collects $30/$300
        → Crossmint approves USDC to your contract
        → Crossmint calls subscribeFor(userAddress, tier)
        → Subscription created on-chain
        → USDC transferred to your contract
   ```

2. **Setup**:
   - Register at: https://www.crossmint.com/console
   - Provide contract ABI with `subscribeFor` function
   - Configure pricing: Tier 1 = $30, Tier 2 = $300
   - Crossmint handles credit card → USDC conversion
   - Crossmint pays gas + USDC for user's subscription

### Use Case 2: Direct Gifting

```solidity
// Alice wants to gift Bob a yearly subscription

// 1. Alice approves USDC
USDC.approve(minterAddress, 300e6);

// 2. Alice calls subscribeFor
minter.subscribeFor(bobAddress, 2); // tier 2 = yearly

// 3. Bob now has an active subscription!
```

### Use Case 3: Corporate Sponsorships

```solidity
// Company sponsors 100 community members

address[] memory recipients = [...]; // 100 addresses

// Company approves USDC: 100 * $30 = $3,000
USDC.approve(minterAddress, 3000e6);

// Loop through recipients
for (uint i = 0; i < recipients.length; i++) {
    minter.subscribeFor(recipients[i], 1); // monthly tier
}
```

## Security Considerations

### ✅ Security Features

- ✅ **Payment Required**: `subscribeFor()` requires USDC payment (same as `subscribe()`)
- ✅ **Reentrancy Protection**: All payable functions use `nonReentrant`
- ✅ **Pausable**: Emergency stop functionality
- ✅ **Input Validation**: Checks for tier (1 or 2), recipient address (not zero), amount validity
- ✅ **Subscription Capping**: 10-year maximum to prevent overflow attacks
- ✅ **CEI Pattern**: Checks-Effects-Interactions to prevent reentrancy
- ✅ **SafeERC20**: Protected token transfers

### ⚠️ Considerations

1. **Permissionless Gifting**:
   - Anyone can create a subscription for anyone else (by paying)
   - Recipient cannot reject a gifted subscription
   - Subscriptions stack automatically (no harm in receiving multiple gifts)

2. **No Refunds On-Chain**:
   - Once USDC is paid and subscription created, it's permanent
   - No on-chain mechanism to cancel or refund
   - Handle refunds off-chain if needed (manual USDC transfer)

3. **Gas Costs**:
   - Caller pays gas fees for `subscribeFor()`
   - Payment processors (like Crossmint) should factor this into pricing

### Upgradeability

**This contract is NOT upgradeable**. It uses standard OpenZeppelin contracts without proxy patterns.

- To add new features, deploy a new version (V3, V4, etc.)
- Users with active subscriptions on V1/V2 keep their subscriptions
- New subscribers can use new contract
- Can authorize multiple minters on the NFT contract if needed

## Backward Compatibility

### V1 → V2 Migration

**Good News**: No migration needed! Both can coexist.

1. **Existing V1 Subscribers**:
   - Continue working with V1 contract
   - Can renew on V1 or switch to V2

2. **NFT Contract Minter**:
   - Can authorize both V1 and V2 as minters
   - Or switch to V2 exclusively

3. **Subscriber Index**:
   - V2 maintains separate subscriber index
   - If you want unified tracking, need off-chain aggregation

### Function Compatibility

All V1 functions preserved:
- ✅ `subscribe(uint8 tier)` - unchanged
- ✅ `mint()` / `mintTo()` - unchanged
- ✅ `distributeToSubscribersBatch()` - unchanged
- ✅ `createSale()` / `createManifestoAndSale()` - unchanged
- ✅ All admin functions - unchanged
- ✅ All view functions - unchanged

New in V2:
- ➕ `subscribeFor(address recipient, uint8 tier)` - NEW

## Testing Recommendations

### Unit Tests to Add

```typescript
describe("FixedPriceManifestoMinterV2 - Crossmint", () => {
  it("should allow Crossmint treasury to create subscription", async () => {
    // Test subscribeFor() with Crossmint signer
  });

  it("should reject subscribeFor() from non-Crossmint address", async () => {
    // Test OnlyCrossmint error
  });

  it("should stack subscriptions via subscribeFor()", async () => {
    // Test renewal logic
  });

  it("should add new subscriber to index", async () => {
    // Test subscriber tracking
  });

  it("should emit SubscribedFor event correctly", async () => {
    // Test event emission
  });

  it("should not update totalRevenue for subscribeFor()", async () => {
    // Verify off-chain payment tracking
  });
});
```

### Integration Tests

1. **Testnet Flow**:
   ```bash
   # Deploy to Base Sepolia
   npx hardhat ignition deploy ignition/modules/Solienne/DeployManifestoMinterV2.ts --network base-sepolia

   # Test subscribeFor() manually
   cast send <MINTER_V2_ADDRESS> \
     "subscribeFor(address,uint8)" \
     <USER_ADDRESS> 1 \
     --private-key <CROSSMINT_PRIVATE_KEY> \
     --rpc-url $BASE_SEPOLIA_RPC_URL
   ```

2. **Verify Subscription Created**:
   ```bash
   cast call <MINTER_V2_ADDRESS> \
     "getSubscriptionDetails(address)" \
     <USER_ADDRESS> \
     --rpc-url $BASE_SEPOLIA_RPC_URL
   ```

## Gas Optimization

No significant gas changes from V1:
- `subscribeFor()` is ~20k gas cheaper than `subscribe()` (no USDC transfer)
- All other functions identical gas costs to V1

## Questions & Answers

### Q: Is this contract upgradeable?
**A**: No. This is a standard non-upgradeable contract. Deploy new versions as needed.

### Q: Where do I get the Crossmint treasury address?
**A**: From Crossmint documentation: https://docs.crossmint.com/

### Q: Can both V1 and V2 work simultaneously?
**A**: Yes! The NFT contract can authorize multiple minters. Both contracts can coexist.

### Q: How are Crossmint payments tracked?
**A**: Off-chain. Reconcile with Crossmint's payment dashboard. On-chain `totalRevenue` only tracks direct USDC payments.

### Q: What happens if Crossmint treasury key is compromised?
**A**: Call `pause()` immediately to prevent new subscriptions. Existing subscriptions are safe.

### Q: Can users subscribe via both methods?
**A**: Yes! Users can use `subscribe()` with USDC or `subscribeFor()` via Crossmint credit card. Subscriptions stack correctly.

## Support

For technical issues:
- Smart contract bugs: File issue on GitHub
- Crossmint integration: https://support.crossmint.com/

---

**Contract**: `contracts/Solienne/FixedPriceManifestoMinterV2.sol`
**Version**: 2.0.0
**Solidity**: 0.8.28
**Author**: Eden Platform
**Date**: 2025-11-20
