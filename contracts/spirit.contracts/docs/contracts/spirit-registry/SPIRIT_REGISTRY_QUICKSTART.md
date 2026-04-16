# Spirit Registry System - Quick Start Guide for Sepolia

## Prerequisites

```bash
# 1. Ensure environment variables are set
cat .env

# Should contain:
# PRIVATE_KEY=0x...
# RPC_API_KEY=...
# ETHERSCAN_API_KEY=...
# BASESCAN_API_KEY=...

# 2. Optional: Set Spirit Council multisig
export SPIRIT_COUNCIL_MULTISIG=0x...  # Or let it default to deployer
```

## Deployment Options

### Option 1: Deploy Complete System (Recommended)

This deploys all three registries in one command:

```bash
# Deploy complete system to Sepolia
make deploy-spirit-registry-system NETWORK=sepolia

# With custom multisig
make deploy-spirit-registry-system NETWORK=sepolia SPIRIT_COUNCIL_MULTISIG=0x...
```

### Option 2: Deploy Individually

Deploy each registry separately for more control:

```bash
# Step 1: Deploy Identity Registry
make deploy-spirit-identity-registry NETWORK=sepolia

# Step 2: Copy Identity Registry address from output, then deploy Reputation Registry
make deploy-spirit-reputation-registry \
  NETWORK=sepolia \
  IDENTITY_REGISTRY_ADDRESS=0x...

# Step 3: Deploy Validation Registry
make deploy-spirit-validation-registry \
  NETWORK=sepolia \
  IDENTITY_REGISTRY_ADDRESS=0x...
```

### Option 3: Using Hardhat Ignition Directly

```bash
# Deploy complete system
npx hardhat ignition deploy \
  ignition/modules/Spirit/DeploySpiritRegistrySystem.ts \
  --deployment-id SpiritRegistrySystem-$(date +%s) \
  --network sepolia \
  --verify

# Deploy only Identity Registry
npx hardhat ignition deploy \
  ignition/modules/Spirit/DeploySpiritIdentityRegistry.ts \
  --deployment-id SpiritIdentityRegistry-$(date +%s) \
  --network sepolia \
  --verify

# Deploy Reputation Registry (requires IDENTITY_REGISTRY_ADDRESS)
IDENTITY_REGISTRY_ADDRESS=0x... npx hardhat ignition deploy \
  ignition/modules/Spirit/DeploySpiritReputationRegistry.ts \
  --deployment-id SpiritReputationRegistry-$(date +%s) \
  --network sepolia \
  --verify

# Deploy Validation Registry (requires IDENTITY_REGISTRY_ADDRESS)
IDENTITY_REGISTRY_ADDRESS=0x... npx hardhat ignition deploy \
  ignition/modules/Spirit/DeploySpiritValidationRegistry.ts \
  --deployment-id SpiritValidationRegistry-$(date +%s) \
  --network sepolia \
  --verify
```

## Post-Deployment

### 1. Record Contract Addresses

After deployment, find contract addresses in the deployment logs:

```bash
# View deployment logs
cat ignition/deployments/SpiritRegistrySystem-*/deployed_addresses.json

# Or check Sepolia deployment log
cat deployment-logs/sepolia.log
```

### 2. Verify Contracts on Etherscan

Contracts should auto-verify with `--verify` flag. If not, verify manually:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 3. Test Agent Registration

Register your first test agent:

```solidity
// Using cast (Foundry CLI)
cast send <IDENTITY_REGISTRY_ADDRESS> \
  "registerAgent(address,address,string)" \
  <AGENT_EOA> \
  <ARTIST_ADDRESS> \
  "ipfs://QmExampleHash..." \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/$RPC_API_KEY \
  --private-key $PRIVATE_KEY
```

Or use the Etherscan UI:
1. Go to contract on Etherscan
2. Click "Contract" tab → "Write Contract"
3. Connect wallet
4. Call `registerAgent` with parameters

## Checking Deployment Status

```bash
# View all Sepolia deployments
make deploy-status NETWORK=sepolia

# Check specific deployment
ls ignition/deployments/SpiritRegistrySystem-*/

# View deployed addresses
cat ignition/deployments/SpiritRegistrySystem-*/deployed_addresses.json
```

## Example: Complete Deployment Flow

```bash
# 1. Set environment
export SPIRIT_COUNCIL_MULTISIG=0x1234567890123456789012345678901234567890

# 2. Deploy complete system
make deploy-spirit-registry-system NETWORK=sepolia

# 3. Wait for deployment to complete and note addresses
# Example output:
# ✅ SpiritIdentityRegistry: 0xABC...
# ✅ SpiritReputationRegistry: 0xDEF...
# ✅ SpiritValidationRegistry: 0x123...

# 4. Verify on Etherscan
# Visit: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>

# 5. Register first agent
cast send 0xABC... \
  "registerAgent(address,address,string)" \
  0xAgentEOA... \
  0xArtistAddress... \
  "ipfs://QmHash..." \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/$RPC_API_KEY \
  --private-key $PRIVATE_KEY

# 6. Verify agent registered
cast call 0xABC... "totalAgents()" --rpc-url https://eth-sepolia.g.alchemy.com/v2/$RPC_API_KEY
```

## Troubleshooting

### Issue: "PRIVATE_KEY is not set"
```bash
# Check .env file exists
ls -la .env

# Check PRIVATE_KEY is set
grep PRIVATE_KEY .env

# Source .env if needed
source .env
```

### Issue: "RPC_API_KEY is not set"
```bash
# Get API key from Alchemy
# Visit: https://dashboard.alchemy.com/

# Add to .env
echo "RPC_API_KEY=your_key_here" >> .env
```

### Issue: "IDENTITY_REGISTRY_ADDRESS is required"
```bash
# You must deploy Identity Registry first
make deploy-spirit-identity-registry NETWORK=sepolia

# Copy the address from output
# Then use it for Reputation/Validation registries
```

### Issue: Verification fails
```bash
# Wait 30 seconds after deployment
sleep 30

# Verify manually
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC**: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

## Contract Addresses (Your Deployment)

After deployment, record your addresses here:

```
SpiritIdentityRegistry:    0x...
SpiritReputationRegistry:  0x...
SpiritValidationRegistry:  0x...

Deployed at: <timestamp>
Deployer: <address>
Owner: <address>
```

## Next Steps

1. ✅ Deploy contracts to Sepolia
2. ✅ Verify contracts on Etherscan
3. 🔜 Register first test agent
4. 🔜 Submit test feedback
5. 🔜 Create validation request
6. 🔜 Build frontend integration
7. 🔜 Deploy subgraph for indexing
8. 🔜 Prepare for mainnet deployment

## Support

For issues or questions:
- GitHub: [repository]/issues
- Discord: Spirit Protocol community
- Email: henry@eden.art

---

**Spirit Protocol** - Decentralized infrastructure for synthetic artists
