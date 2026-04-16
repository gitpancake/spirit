# Fixed Price Manifesto Minter V2 - Deployment Guide

Quick reference for deploying the gift subscription-enabled minter contract.

## What's V2?

V2 adds `subscribeFor(recipient, tier)` - a permissionless function that allows **anyone to pay for subscriptions on behalf of others**.

**Key Features**:
- 🎁 Gift subscriptions: Pay for a friend's subscription
- 💳 Payment processor integration: Crossmint, Stripe, etc.
- 🏢 Corporate sponsorships: Sponsor community members
- ✅ Requires payment: Caller must approve and send USDC (same security as V1)
- ✅ No authorization needed: Anyone can call it

## Prerequisites

### Have These Ready

- ✅ Deployed SolienneManifesto contract address
- ✅ Network RPC URL (Base or Base Sepolia)
- ✅ Private key with ETH for deployment
- ✅ Etherscan/Basescan API key (for verification)
- ✅ Payout address (where USDC goes)

## Quick Deployment

### Base Sepolia (Testnet - Recommended First)

```bash
make deploy-solienne-minter-v2 \
  MANIFESTO_CONTRACT=0xYourManifestoAddress \
  NETWORK=base-sepolia
```

**USDC**: Auto-detected as `0x036cbd53842c5426634e7929541ec2318f3dcf7e`

### Base Mainnet (Production)

```bash
make deploy-solienne-minter-v2 \
  MANIFESTO_CONTRACT=0xYourManifestoAddress \
  NETWORK=base
```

**USDC**: Auto-detected as `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

### With Custom Payout Address

```bash
make deploy-solienne-minter-v2 \
  MANIFESTO_CONTRACT=0xYourManifestoAddress \
  PAYOUT_ADDRESS=0xYourPayoutAddress \
  NETWORK=base-sepolia
```

### Other Networks

```bash
make deploy-solienne-minter-v2 \
  MANIFESTO_CONTRACT=0xYourManifestoAddress \
  USDC_TOKEN=0xUSDCAddressOnYourNetwork \
  NETWORK=your-network
```

## What Happens During Deployment

1. **Pre-flight checks**:
   - Validates `MANIFESTO_CONTRACT` is set
   - Auto-detects USDC for Base/Base Sepolia
   - Gets deployer address
   - Shows deployment configuration table

2. **Deployment**:
   - Deploys `FixedPriceManifestoMinterV2` contract
   - Verifies on Basescan (if API key configured)
   - Logs deployment to `deployment-logs/NETWORK.log`

3. **Post-deployment output**:
   - Shows deployed contract address
   - Lists next steps for integration

## Post-Deployment Steps

### 1. Authorize Minter on Manifesto NFT

```bash
cast send <MANIFESTO_CONTRACT> \
  "updateMinter(address)" <MINTER_V2_ADDRESS> \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2. Verify Contract (if auto-verify failed)

```bash
npx hardhat verify --network base <MINTER_V2_ADDRESS> \
  <MANIFESTO_CONTRACT> \
  <OWNER_ADDRESS> \
  <PAYOUT_ADDRESS> \
  <USDC_TOKEN>
```

### 3. Set Up Crossmint Integration

1. **Register contract**: https://www.crossmint.com/console
2. **Provide ABI**: Include `subscribeFor()` function
3. **Configure pricing**:
   - Tier 1 (Monthly): $30
   - Tier 2 (Yearly): $300
4. **Test integration** on staging/testnet first

### 4. Update Frontend

```typescript
// lib/contract.ts (or equivalent)

export const MANIFESTO_MINTER_V2_ADDRESS = "0xYourDeployedAddress";

// Import ABI with subscribeFor function
import MINTER_V2_ABI from "./abis/FixedPriceManifestoMinterV2.json";

// Listen for SubscribedFor events
contract.on("SubscribedFor", (recipient, sponsor, tier, expiresAt, subscribedAt, isRenewal) => {
  console.log(`User ${recipient} subscribed via Crossmint`);
  // Update UI
});
```

## Environment Variables

Set these in your `.env` file:

```bash
# Required
PRIVATE_KEY=0xYourPrivateKey
RPC_API_KEY=YourAlchemyOrInfuraKey

# Optional (for auto-verification)
BASESCAN_API_KEY=YourBasescanApiKey
ETHERSCAN_API_KEY=YourEtherscanApiKey

# Optional (custom addresses)
MINTER_OWNER=0xOwnerAddress      # Default: deployer
PAYOUT_ADDRESS=0xPayoutAddress   # Default: 0xD5090Df0a9Ec491E95fe21ddE7B5E4868F852874 (Solienne Multisig)
```

## Deployment Configuration Defaults

| Parameter | Default | Override With |
|-----------|---------|---------------|
| Owner | Deployer address | `MINTER_OWNER=0x...` |
| Payout | `0xD5090Df0a9Ec491E95fe21ddE7B5E4868F852874` (Solienne Multisig on Base) | `PAYOUT_ADDRESS=0x...` |
| USDC (Base) | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` | Auto-detected |
| USDC (Base Sepolia) | `0x036cbd53842c5426634e7929541ec2318f3dcf7e` | Auto-detected |
| Network | `sepolia` | `NETWORK=base` |

## Testing Deployment

### 1. Check Minter Authorization

```bash
cast call <MANIFESTO_CONTRACT> \
  "authorizedMinter()(address)" \
  --rpc-url $BASE_RPC_URL

# Should return: <MINTER_V2_ADDRESS>
```

### 2. Test Subscribe Function (V1 - USDC payment)

```bash
# First approve USDC
cast send <USDC_TOKEN> \
  "approve(address,uint256)" <MINTER_V2_ADDRESS> 30000000 \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY

# Then subscribe (Tier 1 = monthly)
cast send <MINTER_V2_ADDRESS> \
  "subscribe(uint8)" 1 \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

### 3. Test SubscribeFor Function (V2 - Crossmint)

**Note**: Can only be called by Crossmint treasury address.

```bash
cast send <MINTER_V2_ADDRESS> \
  "subscribeFor(address,uint8)" <USER_ADDRESS> 1 \
  --rpc-url $BASE_RPC_URL \
  --private-key $CROSSMINT_PRIVATE_KEY

# Tier 1 = monthly (30 days)
# Tier 2 = yearly (365 days)
```

### 4. Check Subscription Status

```bash
cast call <MINTER_V2_ADDRESS> \
  "getSubscriptionDetails(address)(uint8,uint256,uint256,bool,uint256)" \
  <USER_ADDRESS> \
  --rpc-url $BASE_RPC_URL

# Returns: (tier, expiresAt, subscribedAt, isActive, daysRemaining)
```

## Troubleshooting

### "Only Crossmint" Error

**Problem**: `subscribeFor()` reverts with `OnlyCrossmint()` error.

**Solution**: Ensure caller is the Crossmint treasury address defined in the contract.

### "MANIFESTO_CONTRACT is required"

**Problem**: Forgot to specify manifesto contract address.

**Solution**: Add `MANIFESTO_CONTRACT=0x...` to the make command.

### "USDC_TOKEN must be set"

**Problem**: Using a custom network without specifying USDC address.

**Solution**: Add `USDC_TOKEN=0x...` to the make command.

### Verification Failed

**Problem**: Contract deployed but Basescan verification failed.

**Solution**: Manually verify:
```bash
npx hardhat verify --network base <ADDRESS> <CONSTRUCTOR_ARGS>
```

### Minting Fails After Deployment

**Problem**: `mint()` or `distributeToSubscribersBatch()` fails.

**Solution**: Authorize the minter on the Manifesto NFT contract:
```bash
cast send <MANIFESTO_CONTRACT> "updateMinter(address)" <MINTER_V2_ADDRESS>
```

## Files Reference

| File | Purpose |
|------|---------|
| `contracts/Solienne/FixedPriceManifestoMinterV2.sol` | Main contract |
| `ignition/modules/Solienne/DeploySolienneMinterV2.ts` | Ignition deployment module |
| `scripts/deploy-solienne-minter-v2.sh` | Deployment helper script |
| `Makefile` (line 812) | `deploy-solienne-minter-v2` target |
| `contracts/Solienne/README_V2_UPGRADE.md` | Full V2 documentation |
| `deployment-logs/NETWORK.log` | Deployment history |

## Key Differences from V1

| Feature | V1 | V2 |
|---------|----|----|
| **Subscriptions** | `subscribe()` only | `subscribe()` + `subscribeFor()` |
| **Payment Methods** | USDC only | USDC + Credit Cards (via Crossmint) |
| **Caller** | User direct | User OR Crossmint treasury |
| **Integration** | Manual USDC approval | Crossmint payment widget |
| **Events** | `Subscribed` | `Subscribed` + `SubscribedFor` |

## Support & Resources

- **Full Documentation**: `contracts/Solienne/README_V2_UPGRADE.md`
- **Crossmint Docs**: https://docs.crossmint.com/
- **Crossmint Console**: https://www.crossmint.com/console
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Mainnet Explorer**: https://basescan.org/

## Example: Complete Testnet Deployment

```bash
# 1. First deploy Manifesto NFT (if not already deployed)
make deploy-solienne-manifesto NETWORK=base-sepolia

# Copy Manifesto address from output, then:

# 2. Deploy Minter V2
make deploy-solienne-minter-v2 \
  MANIFESTO_CONTRACT=0xYourManifestoAddress \
  NETWORK=base-sepolia

# 3. Authorize minter (copy Minter V2 address from output)
cast send 0xYourManifestoAddress \
  "updateMinter(address)" 0xYourMinterV2Address \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 4. Test subscription
cast send 0xYourMinterV2Address \
  "subscribe(uint8)" 1 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 5. Verify subscription
cast call 0xYourMinterV2Address \
  "isActive(address)(bool)" $YOUR_ADDRESS \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Should return: true
```

## Next Steps After Successful Deployment

1. ✅ Test all functions on testnet
2. ✅ Integrate with Crossmint staging environment
3. ✅ Update frontend with new contract
4. ✅ Deploy to Base mainnet
5. ✅ Coordinate production Crossmint setup
6. ✅ Monitor subscription events
7. ✅ Set up off-chain revenue reconciliation

---

**Ready to deploy?** Just run:

```bash
make deploy-solienne-minter-v2 MANIFESTO_CONTRACT=0x... NETWORK=base-sepolia
```

Good luck! 🚀
