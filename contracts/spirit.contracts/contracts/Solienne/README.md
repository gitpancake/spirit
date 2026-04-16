# Solienne Manifesto Smart Contracts

Newsletter/manifesto subscription system with two implementations: **ERC-1155 (Recommended)** and ERC-721 (Legacy).

## Quick Start

### Recommended: ERC-1155 Implementation

**88% gas savings** compared to ERC-721 for newsletter distribution.

```bash
# Deploy to Sepolia testnet
NETWORK=sepolia \
  MANIFESTO_NAME="Solienne Manifesto" \
  MANIFESTO_SYMBOL="MANIFESTO" \
  make deploy-solienne-manifesto-1155

# Deploy minter (use deployed manifesto address)
NETWORK=sepolia \
  MANIFESTO_CONTRACT=0x... \
  make deploy-solienne-minter-1155
```

**Current Testnet Deployment:**
- Network: Sepolia (chainId: 11155111)
- Manifesto: [`0xE45350664d1a251e542580377bc0bcBB6D2fAcF0`](https://sepolia.etherscan.io/address/0xE45350664d1a251e542580377bc0bcBB6D2fAcF0)
- Minter: [`0x742f8098C6eCA4A97a81D3c16E47EB01cC795EF2`](https://sepolia.etherscan.io/address/0x742f8098C6eCA4A97a81D3c16E47EB01cC795EF2)

---

## Architecture Overview

The system uses a **separation of concerns** pattern:

1. **NFT Contract** (`SolienneManifesto[ERC1155].sol`): Pure token contract, minimal permissions (Ownable only)
2. **Minter Contract** (`FixedPriceManifestoMinter[ERC1155].sol`): Business logic (subscriptions, sales, USDC payments)

**Simplified Permissions:** Uses standard Ownable pattern instead of complex role-based access control. Owner can perform all admin functions. This allows upgrading business logic without migrating NFTs.

---

## Implementation Comparison

### ERC-1155 (Recommended)

**Best for:** Newsletter/edition distribution with high subscriber counts

**Token Model:**
- Each `manifestoId` represents a **token type** (not individual tokens)
- Subscribers receive `amount=1` of that manifesto type
- Example: "1 copy of Manifesto #5" instead of "Token #47"

**Gas Efficiency:**
```
Batch mint 200 addresses:  ~500k gas  (vs ~2-3M for ERC-721)
URI management:            ~100k gas  (vs ~2M for ERC-721)
Total savings:             88% reduction
```

**Workflow:**
```solidity
// 1. Create manifesto type (owner only)
uint256 manifestoId = manifesto.createManifesto("ipfs://Qm...");

// 2. Distribute to subscribers (distributor role)
minter.distributeToSubscribersBatch(subscribers, manifestoId);
// ✅ Native batch mint - all 200 subscribers in one tx
```

**Files:**
- `contracts/Solienne/SolienneManifestoERC1155.sol`
- `contracts/Solienne/FixedPriceManifestoMinterERC1155.sol`
- `ignition/modules/Solienne/DeploySolienneManifestoERC1155.ts`
- `ignition/modules/Solienne/DeploySolienneMinterERC1155.ts`

---

### ERC-721 (Legacy)

**Best for:** Individual collectibles with unique properties

**Token Model:**
- Each `tokenId` is a **unique token**
- One manifesto = one token
- Example: "Token #47"

**Gas Cost:**
```
Batch mint 200 addresses:  ~2-3M gas
URI management:            ~2M gas (or batch commit)
```

**Workflow:**
```solidity
// 1. Batch mint tokens to subscribers
uint256[] memory tokenIds = minter.distributeToSubscribersBatch(subscribers);
// ⚠️ Each mint is separate, 200 transactions worth of gas

// 2. Commit URI to all tokens (owner only)
manifesto.batchCommitDailyManifesto(tokenIds, "ipfs://Qm...");
```

**Files:**
- `contracts/Solienne/SolienneManifesto.sol`
- `contracts/Solienne/FixedPriceManifestoMinter.sol`
- `ignition/modules/Solienne/DeploySolienneManifesto.ts`
- `ignition/modules/Solienne/DeploySolienneMinter.ts`

**Status:** Legacy implementation, kept for reference. Use ERC-1155 for new deployments.

**To deploy ERC-721:**
```bash
NETWORK=sepolia \
  MANIFESTO_NAME="Solienne Manifesto" \
  MANIFESTO_SYMBOL="MANIFESTO" \
  make deploy-solienne-manifesto

NETWORK=sepolia \
  MANIFESTO_CONTRACT=0x... \
  make deploy-solienne-minter
```

---

## Feature Comparison Table

| Feature | ERC-721 | ERC-1155 |
|---------|---------|----------|
| **Token Model** | Each tokenId unique | Each manifestoId = type |
| **Batch Mint Gas** | ~2-3M (200 addresses) | ~500k (200 addresses) |
| **URI Storage** | Per-token | Per-type (shared) |
| **Semantics** | "Token #47" | "1 copy of Manifesto #5" |
| **Marketplace Support** | Universal | OpenSea, Zora, LooksRare |
| **Use Case Fit** | Collectibles | Newsletters/Editions |
| **Status** | Legacy | **Recommended** |

---

## Subscription System (Both Implementations)

**3 Subscription Tiers:**

| Tier | Price | Duration | Use Case |
|------|-------|----------|----------|
| **Single** (Tier 0) | $5 (0.005 ETH) | 7 days | Trial/one-off |
| **Monthly** (Tier 1) | $30 (0.03 ETH) | 30 days | Regular readers |
| **Yearly** (Tier 2) | $300 (0.3 ETH) | 365 days | Committed fans |

**Subscription Flow:**
```solidity
// User subscribes
minter.subscribe{value: 0.005 ether}(0); // Tier 0 (Single)

// Check if active
bool active = minter.isActive(userAddress); // Returns true if not expired

// Distribute to all active subscribers
address[] memory subs = [...]; // From backend
minter.distributeToSubscribersBatch(subs, manifestoId); // ERC-1155
// or
minter.distributeToSubscribersBatch(subs); // ERC-721
```

---

## Sale System (Both Implementations)

### Quick Start - Daily Drops (Printing Press Model)

The "printing press" model: press the button, manifesto created NOW, on sale NOW for 24 hours.

```solidity
// Create manifesto + auto-start 24-hour sale ($5 USDC fixed price)
(uint256 manifestoId, uint256 saleId) = minter.createManifestoAndSale(
    "ipfs://Qm..."    // Just the URI - timestamp = block.timestamp (always unique!)
);
// ✅ Manifesto timestamp = block.timestamp (creation time, no collisions)
// ✅ Sale starts NOW and lasts 24 hours automatically
// ✅ Multiple sales can run concurrently (different sale IDs)
// ✅ Subscribers receive manifestos via separate distributeToSubscribersBatch() call

// User purchases with USDC
minter.mint(saleId, quantity);  // Non-subscribers pay $5 USDC per copy
```

### Advanced - Custom Time Windows

For advanced use cases requiring custom time windows:

```solidity
// Create sale with custom start/end times
minter.createSale(
    manifestoId,      // Reference existing manifesto
    startTime,        // Custom start time
    endTime           // Custom end time
);
```

---

## Access Control (Simplified)

**Ownership-Based Model** - No complex role management:

| Role | Permissions |
|------|-------------|
| **Manifesto Owner** | Create manifestos, update URIs, update authorized minter |
| **Minter Owner** | Distribute to subscribers, create sales, pause, withdraw funds |
| **Authorized Minter** | Mint NFTs + Create manifestos (set via `updateMinter()`) |

**Setup:**
```solidity
// After deploying minter, authorize it to mint NFTs
manifesto.updateMinter(minterAddress);

// That's it! No role grants or ownership transfers needed.
// The minter can now:
// - Mint NFTs (via mint/mintBatch)
// - Create manifestos (via createManifestoAndSale)
```

---

## Crossmint Integration (Both Implementations)

Supports credit card payments via Crossmint:

```solidity
// User purchases with credit card (Crossmint handles payment)
minter.crossmintPurchase(
    recipient,        // User receiving NFT
    saleId,
    quantity
);
// ✅ Crossmint pays gas + purchase price, mints to user
```

---

## Security Features (Both Implementations)

1. **DOS Protection**: Try-catch in batch operations prevents malicious contracts from blocking distribution
2. **Reentrancy Guard**: All payable functions protected
3. **Safe ETH Transfers**: 25k gas limit supports safes/multisigs
4. **Pausable**: Emergency stop for both contracts
5. **Withdrawal Pattern**: Pull over push for refunds

---

## Why We Switched to ERC-1155

**Decision Date:** November 2024

**Rationale:**
1. **88% gas savings** for typical newsletter distribution (200 subscribers)
2. **Better semantics**: "Manifesto #5" clearer than "Token #47"
3. **Simplified architecture**: No token-to-sale mapping needed
4. **Native batch operations**: Built into standard
5. **Newsletter use case fit**: Manifestos are editions, not unique collectibles

**Trade-offs Accepted:**
- Less universal marketplace support (but major platforms supported)
- Slightly different user experience (amount=1 of type vs unique token)

**When to use ERC-721:**
- Unique collectibles with different properties
- Maximum marketplace compatibility required
- Token-level customization needed

---

## Deployment Checklist

### ERC-1155 (Recommended)

- [ ] Deploy `SolienneManifestoERC1155` with name, symbol, owner
- [ ] Verify on Etherscan
- [ ] Deploy `FixedPriceManifestoMinterERC1155` with manifesto address, owner, payout, USDC token
- [ ] Verify on Etherscan
- [ ] Call `manifesto.updateMinter(minterAddress)` to authorize minter (enables minting + createManifestoAndSale)
- [ ] Test: Subscribe → Create manifesto → Create sale → Distribute
- [ ] Update frontend with contract addresses

### ERC-721 (Legacy)

- [ ] Deploy `SolienneManifesto` with name, symbol, owner
- [ ] Verify on Etherscan
- [ ] Deploy `FixedPriceManifestoMinter` with manifesto address, owner, payout, USDC token
- [ ] Verify on Etherscan
- [ ] Call `manifesto.updateMinter(minterAddress)` to authorize minting
- [ ] (Optional) If using `createManifestoAndSale()`, transfer manifesto ownership to minter
- [ ] Test: Subscribe → Create manifesto → Create sale → Distribute
- [ ] Update frontend with contract addresses

---

## Testing

```bash
# Run all tests
npm test

# Test specific implementation
npx hardhat test test/Solienne/SolienneManifestoERC1155.test.ts
npx hardhat test test/Solienne/FixedPriceManifestoMinterERC1155.test.ts
```

---

## Support

- Issues: https://github.com/edenartlab/smart-contracts/issues
- Docs: See inline contract documentation (NatSpec)
- Etherscan: Verified contracts include full source code

---

## Version History

- **v2.0.0** (Nov 2024): ERC-1155 implementation (88% gas savings)
- **v1.0.0** (Nov 2024): Initial ERC-721 implementation with subscriptions
