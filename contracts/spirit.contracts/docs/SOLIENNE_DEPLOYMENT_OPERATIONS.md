# Solienne NFT Collections - Deployment Operations Manual

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Sale Configuration Guide](#sale-configuration-guide)
6. [Ownership & Security](#ownership--security)
7. [Emergency Procedures](#emergency-procedures)
8. [Verification & Testing](#verification--testing)

---

## Overview

The Solienne NFT system consists of three smart contracts:
- **SolienneGenesisPortraits**: ERC-721 NFT collection (tokens 0-14 = 5 portraits × 3 editions)
- **SolienneOriginSeries**: ERC-721 NFT collection (expandable)
- **SolienneFixedPriceMinter**: Simple fixed-price minter with per-token pricing

**Key Features:**
- Per-token pricing in ETH (each token can have its own price)
- Simple token-based sales (no complex edition tracking)
- Batch sale configuration for uniform pricing
- Irreversible minting lock for collection finalization
- ERC2981 royalty support (max 10%)
- Emergency pause functionality

---

## Pre-Deployment Checklist

### Required Information

- [ ] **Metadata URIs prepared**
  - Genesis Portraits base URI: `ipfs://...`
  - Origin Series base URI: `ipfs://...`
  - Format: `baseURI/tokenId.json` for each token

- [ ] **Wallet addresses confirmed**
  - Deployer wallet: `0x...` (will be contract owner)
  - Royalty receiver: `0x...` (receives marketplace royalties)
  - Payout address: `0xeee98E09620182Be55E5eCD6D20C22aB3697D5f2` (Solienne Multisig - receives sale proceeds)

- [ ] **Financial parameters**
  - Royalty fee: `500` basis points (5%) - max 1000 (10%)
  - Token prices determined for each artwork

- [ ] **Network selection**
  - Testnet: `sepolia` or `base-sepolia`
  - Mainnet: `mainnet` or `base`
  - RPC URL configured in `.env`
  - Deployer wallet funded with ETH for gas

---

## Deployment Steps

### Step 1: Deploy NFT Contracts

```bash
# Deploy Genesis Portraits (5 artworks × 3 editions)
make deploy-solienne-genesis-portraits \
  GENESIS_BASE_URI=ipfs://YOUR_GENESIS_HASH \
  GENESIS_ROYALTY_RECEIVER=0xRoyaltyAddress \
  GENESIS_ROYALTY_FEE=500 \
  NETWORK=sepolia

# Deploy Origin Series (9 artworks × 5 editions)
make deploy-solienne-origin-series \
  ORIGIN_BASE_URI=ipfs://YOUR_ORIGIN_HASH \
  ORIGIN_ROYALTY_RECEIVER=0xRoyaltyAddress \
  ORIGIN_ROYALTY_FEE=500 \
  NETWORK=sepolia
```

**Save deployed addresses:**
```bash
GENESIS_ADDRESS=0x...
ORIGIN_ADDRESS=0x...
```

### Step 2: Deploy Minter Contract

```bash
# Deploy minter (defaults to Solienne multisig: 0xeee98E09620182Be55E5eCD6D20C22aB3697D5f2)
# NFT contracts can be enabled later
make deploy-solienne-fixed-price-minter \
  NETWORK=sepolia

# Or override payout address if needed
make deploy-solienne-fixed-price-minter \
  MINTER_PAYOUT_ADDRESS=0xYourCustomAddress \
  NETWORK=sepolia
```

**Save minter address:**
```bash
MINTER_ADDRESS=0x...
```

**Default Payout Address:** Sale proceeds will be sent to Solienne Multisig `0xeee98E09620182Be55E5eCD6D20C22aB3697D5f2` unless overridden.

---

## Post-Deployment Configuration

### Step 3: Enable NFT Contracts on Minter

```bash
# Enable Genesis Portraits
cast send $MINTER_ADDRESS \
  "enableNFTContract(address)" \
  $GENESIS_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Enable Origin Series
cast send $MINTER_ADDRESS \
  "enableNFTContract(address)" \
  $ORIGIN_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 4: Authorize Minter on NFT Contracts

**CRITICAL for edition enforcement:**

```bash
# Set minter as authorized minter on Genesis Portraits
cast send $GENESIS_ADDRESS \
  "updateAuthorizedMinter(address)" \
  $MINTER_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set minter as authorized minter on Origin Series
cast send $ORIGIN_ADDRESS \
  "updateAuthorizedMinter(address)" \
  $MINTER_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 5: Configure Token Sales with Pricing

#### Genesis Portraits (5 portraits × 3 editions each)

**Token Mapping:**
- Portrait #1 = tokens [0, 1, 2]
- Portrait #2 = tokens [3, 4, 5]
- Portrait #3 = tokens [6, 7, 8]
- Portrait #4 = tokens [9, 10, 11]
- Portrait #5 = tokens [12, 13, 14]

```bash
# Configure Portrait #1: Token IDs 0, 1, 2 at 1.4 ETH each
cast send $MINTER_ADDRESS \
  "configureSale(address,uint256[],uint256)" \
  $GENESIS_ADDRESS \
  "[0,1,2]" \
  1400000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Configure Portrait #2: Token IDs 3, 4, 5 at 1.6 ETH each
cast send $MINTER_ADDRESS \
  "configureSale(address,uint256[],uint256)" \
  $GENESIS_ADDRESS \
  "[3,4,5]" \
  1600000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Continue for portraits 3, 4, 5...
```

**Alternative: Set Individual Token Prices**

If you need different prices for specific tokens:

```bash
# Set price for token 0 only
cast send $MINTER_ADDRESS \
  "setTokenPrice(address,uint256,uint256)" \
  $GENESIS_ADDRESS \
  0 \
  1400000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Or set multiple different prices at once
cast send $MINTER_ADDRESS \
  "setTokenPrices(address,uint256[],uint256[])" \
  $GENESIS_ADDRESS \
  "[0,1,2]" \
  "[1400000000000000000,1500000000000000000,1600000000000000000]" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Sale Configuration Guide

### How Token-Based Sales Work

The simplified minter uses a direct token-to-price mapping:

1. **Configure Sale**: Set prices for specific token IDs
2. **Token Available**: Token has a price > 0 AND hasn't been minted yet
3. **Tracking Editions**: Count unminted tokens in a range to see "2 of 3 remaining"

**Example: Portrait #1**
- Configure tokens [0, 1, 2] at 1.4 ETH each
- All 3 editions available initially
- After token 0 sells: tokens [1, 2] remain (2/3 available)
- After token 1 sells: only token [2] remains (1/3 available)
- After token 2 sells: Portrait #1 is sold out (0/3 available)

### Checking Availability

```bash
# Check which tokens are available for Portrait #1
cast call $MINTER_ADDRESS \
  "getSaleInfo(address,uint256[])(uint256[],bool[])" \
  $GENESIS_ADDRESS \
  "[0,1,2]" \
  --rpc-url $RPC_URL

# Output: (prices[], available[])
# Example: ([1.4e18, 1.4e18, 1.4e18], [false, true, true])
# Means: token 0 sold, tokens 1 and 2 still available (2/3 remaining)
```

### Price Configuration Operations

✅ **SAFE TO DO:**
- Set prices for new tokens (add to sale)
- Update prices for unsold tokens
- Set price to 0 to remove token from sale (without preventing direct minting)

⚠️ **RECOMMENDED:**
- Configure all tokens for a portrait ONCE before any sales
- Use `configureSale()` for uniform pricing (simpler, more gas efficient)
- Use `setTokenPrices()` for varied pricing within same portrait

❌ **NOT RECOMMENDED:**
- Changing prices frequently (confusing for buyers)
- Removing tokens from sale after promotion begins

### Authorization & Security

**CRITICAL:** To ensure ONLY the minter can mint (preventing bypassing price/limits):

```bash
# Verify minter authorization
cast call $GENESIS_ADDRESS "authorizedMinter()" --rpc-url $RPC_URL
# Should return: $MINTER_ADDRESS

# If not set, authorize the minter
cast send $GENESIS_ADDRESS \
  "updateAuthorizedMinter(address)" \
  $MINTER_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Best Practices:**
1. Set minter as `authorizedMinter` (done in Step 4)
2. NEVER call `mintTo()` directly from owner wallet during sales
3. NEVER change `authorizedMinter` after sales begin

### Reconfiguration Example

```bash
# Update price for Portrait #1 tokens
cast send $MINTER_ADDRESS \
  "configureSale(address,uint256[],uint256)" \
  $GENESIS_ADDRESS \
  "[0,1,2]" \
  1500000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Remove specific token from sale (set price to 0)
cast send $MINTER_ADDRESS \
  "setTokenPrice(address,uint256,uint256)" \
  $GENESIS_ADDRESS \
  0 \
  0 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Ownership & Security

### Recommended Ownership Structure

For production deployments, use a multisig wallet:

```
┌─────────────────────────────────────────────────┐
│    Solienne Multisig (Gnosis Safe)              │
│    0xeee98E09620182Be55E5eCD6D20C22aB3697D5f2   │
│                                                  │
│  Signers:                                        │
│  - Artist Wallet                                 │
│  - Technical Admin                               │
│  - Trusted Advisor                               │
└─────────────────────────────────────────────────┘
            │
            ├─> SolienneGenesisPortraits.owner()
            ├─> SolienneOriginSeries.owner()
            ├─> SolienneFixedPriceMinter.owner()
            └─> minter.payoutAddress (sale proceeds)

Additional addresses:
- NFT royalty receiver → Artist/Treasury Address
```

### Transferring Ownership

```bash
# Transfer Genesis Portraits ownership to multisig
cast send $GENESIS_ADDRESS \
  "transferOwnership(address)" \
  $MULTISIG_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Repeat for Origin Series and Minter
```

---

## Emergency Procedures

### Pause Sales

```bash
# Pause minter contract (stops all purchases)
cast send $MINTER_ADDRESS \
  "pause()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Resume Sales

```bash
# Unpause minter contract
cast send $MINTER_ADDRESS \
  "unpause()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Disable Specific Collection

```bash
# Disable Genesis Portraits from minter (keeps other collections active)
cast send $MINTER_ADDRESS \
  "disableNFTContract(address)" \
  $GENESIS_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Withdraw Funds

```bash
# Withdraw all collected ETH to payout address
cast send $MINTER_ADDRESS \
  "withdraw()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Lock Minting Permanently

**WARNING: IRREVERSIBLE - Only do this when collection is finalized**

```bash
# Lock Genesis Portraits minting forever
cast send $GENESIS_ADDRESS \
  "lockMintingPermanently()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Lock Origin Series minting forever
cast send $ORIGIN_ADDRESS \
  "lockMintingPermanently()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

After locking:
- ✅ Edition limits are permanently enforced
- ❌ No one (including owner) can ever mint again
- ✅ Collectors have cryptographic proof of scarcity

---

## Verification & Testing

### Verify Contract Code on Block Explorer

Contracts are auto-verified during deployment. Manually verify if needed:

```bash
npx hardhat verify --network sepolia $GENESIS_ADDRESS \
  "Arg1" "Arg2" ...
```

### Test Mint Flow

```bash
# Check token availability and price
cast call $MINTER_ADDRESS \
  "isTokenAvailable(address,uint256)(bool,uint256)" \
  $GENESIS_ADDRESS \
  0 \
  --rpc-url $RPC_URL
# Output: (available, price)

# Get token price directly
PRICE=$(cast call $MINTER_ADDRESS \
  "tokenPrices(address,uint256)" \
  $GENESIS_ADDRESS \
  0 \
  --rpc-url $RPC_URL)

# Mint token
cast send $MINTER_ADDRESS \
  "mint(address,uint256)" \
  $GENESIS_ADDRESS \
  0 \
  --value $PRICE \
  --rpc-url $RPC_URL \
  --private-key $BUYER_PRIVATE_KEY
```

### Check Portrait Status

```bash
# Check availability for Portrait #1 (tokens 0, 1, 2)
cast call $MINTER_ADDRESS \
  "getSaleInfo(address,uint256[])(uint256[],bool[])" \
  $GENESIS_ADDRESS \
  "[0,1,2]" \
  --rpc-url $RPC_URL

# Output format:
# (prices[], available[])
# Example: ([1.4e18, 1.4e18, 1.4e18], [false, true, true])
# = token 0 sold, tokens 1 and 2 available (2/3 remaining)

# Calculate total cost for batch
cast call $MINTER_ADDRESS \
  "calculateTotalCost(address,uint256[])(uint256)" \
  $GENESIS_ADDRESS \
  "[1,2]" \
  --rpc-url $RPC_URL
```

### Monitor Sales

```bash
# Get minter statistics
cast call $MINTER_ADDRESS \
  "getMinterStats()(uint256,uint256,uint256,address)" \
  --rpc-url $RPC_URL

# Output format:
# (totalSold, totalRevenue, contractBalance, payoutAddress)
```

---

## Common Issues & Solutions

### Issue: "NFTContractNotEnabled" Error

**Meaning:** The NFT contract hasn't been enabled on the minter
**Solution:**
```bash
cast send $MINTER_ADDRESS "enableNFTContract(address)" $NFT_ADDRESS --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### Issue: "UnauthorizedMinter" Error

**Meaning:** The minter isn't authorized to mint on the NFT contract
**Solution:**
```bash
cast send $NFT_ADDRESS "updateAuthorizedMinter(address)" $MINTER_ADDRESS --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### Issue: "TokenNotForSale" Error

**Meaning:** Token has no price set (price = 0) or never configured
**Solution:** Configure the token with a price:
```bash
cast send $MINTER_ADDRESS "setTokenPrice(address,uint256,uint256)" $NFT_ADDRESS $TOKEN_ID $PRICE --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### Issue: "TokenAlreadySold" Error

**Meaning:** This specific token ID has already been minted
**Solution:** Check which tokens are still available:
```bash
cast call $MINTER_ADDRESS "getSaleInfo(address,uint256[])(uint256[],bool[])" $NFT_ADDRESS "[0,1,2]" --rpc-url $RPC_URL
```
Choose a different token ID that shows `available = true`

### Issue: "IncorrectPayment" Error

**Meaning:** ETH sent doesn't match the exact token price
**Solution:** Send exact ETH amount matching token price:
```bash
# Get exact price first
PRICE=$(cast call $MINTER_ADDRESS "tokenPrices(address,uint256)" $NFT_ADDRESS $TOKEN_ID --rpc-url $RPC_URL)
# Then mint with exact amount
cast send $MINTER_ADDRESS "mint(address,uint256)" $NFT_ADDRESS $TOKEN_ID --value $PRICE --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### Issue: "MintingLocked" Error

**Meaning:** Minting has been permanently locked on the NFT contract
**Solution:** This is irreversible. The collection is finalized and no more tokens can be minted.

---

## Design Philosophy

This simplified minter design prioritizes:

✅ **Simplicity:** Direct token-to-price mapping (no complex edition tracking)
✅ **Flexibility:** Each token can have its own price, or batch configure uniform pricing
✅ **Transparency:** Frontend can easily query availability and show "2 of 3 remaining"
✅ **Gas Efficiency:** Minimal state storage (single mapping vs multiple mappings + structs)
✅ **Multi-collection:** Single minter supports unlimited NFT collections

---

## Contact & Support

For questions or issues:
- Technical Documentation: `docs/`
- Smart Contract Code: `contracts/Solienne/`
- Test Suite: `test/Solienne/`

---

**Last Updated:** 2025-01-16
**Version:** 2.0 (Simplified Minter)
**Network Compatibility:** Ethereum Mainnet, Sepolia, Base, Base Sepolia

## Changelog

### v2.0 (2025-01-16) - Simplified Minter
- Removed complex artwork/edition tracking
- Simplified to direct token-to-price mapping
- New functions: `configureSale()`, `getSaleInfo()`, `calculateTotalCost()`
- Renamed all `purchase` functions to `mint` (art is sold, not purchased)
- Fixed tokenURI to avoid double slashes in metadata URLs
- ~300 lines of code removed for simplicity

### v1.0 (2025-01-15) - Initial Release
- Artwork-based edition tracking
- Per-artwork edition limits
- Complex state management with `Artwork` structs
