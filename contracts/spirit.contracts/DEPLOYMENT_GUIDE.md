# 📋 Spirit Smart Contracts - Deployment Guide

## Overview

This repository uses **Foundry** for all deployments with automatic Etherscan verification. Each deployment command is **declarative** - the command name tells you exactly what gets deployed.

## Setup

### 1. Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Setup Keystore Account
```bash
# Create new account
cast wallet new ~/.foundry/keystores/deployer

# Or import existing private key
cast wallet import deployer --interactive
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your RPC URLs and API keys
```

## Deployment Commands

### 🏛️ Spirit Registry V2 (ERC-8004 AI Agent System)

```bash
# Deploy complete Spirit Registry V2 system
# Deploys: Identity Registry + Validation Registry + Reputation Registry + Controller
make deploy-spirit-registry-v2 NETWORK=sepolia ACCOUNT=deployer

# Deploy individual components
make deploy-spirit-identity-registry NETWORK=sepolia ACCOUNT=deployer
make deploy-spirit-validation-registry NETWORK=sepolia ACCOUNT=deployer
make deploy-spirit-reputation-registry NETWORK=sepolia ACCOUNT=deployer
make deploy-spirit-controller NETWORK=sepolia ACCOUNT=deployer
```

### 🎨 Abraham NFT Collections

```bash
# Deploy Abraham Early Works NFT
make deploy-abraham-early-works NETWORK=sepolia ACCOUNT=deployer

# Deploy Abraham Covenant NFT
make deploy-abraham-covenant NETWORK=sepolia ACCOUNT=deployer

# Deploy Abraham Auction Contract
make deploy-abraham-auction NETWORK=sepolia ACCOUNT=deployer
```

### 🧸 Gepetto NFT Collections

```bash
# Deploy Gepetto Toys NFT + Minter
make deploy-gepetto-toys NETWORK=base ACCOUNT=deployer

# Deploy just the Minter contract
make deploy-gepetto-minter NETWORK=base ACCOUNT=deployer
```

### 📖 Solienne NFT Collections

```bash
# Deploy Solienne Manifesto NFT
make deploy-solienne-manifesto NETWORK=sepolia ACCOUNT=deployer

# Deploy Solienne Origin Series NFT
make deploy-solienne-origin-series NETWORK=sepolia ACCOUNT=deployer

# Deploy Solienne Genesis Portraits NFT
make deploy-solienne-genesis-portraits NETWORK=sepolia ACCOUNT=deployer
```

### 🔨 Auction Contracts

```bash
# Deploy Thirteen Year Auction NFT
make deploy-thirteen-year-auction NETWORK=sepolia ACCOUNT=deployer

# Deploy Daily Auction NFT
make deploy-daily-auction NETWORK=sepolia ACCOUNT=deployer
```

### 💧 Superfluid Contracts

```bash
# Deploy Superfluid Distribution Pool
make deploy-distribution-pool NETWORK=base ACCOUNT=deployer

# Deploy SPIRIT SuperToken
make deploy-spirit-supertoken NETWORK=base ACCOUNT=deployer
```

### 🤖 Agent Registry

```bash
# Deploy Agent Registry
make deploy-agent-registry NETWORK=sepolia ACCOUNT=deployer
```

## Network Configuration

| Network | Chain ID | RPC Variable |
|---------|----------|--------------|
| `ethereum` | 1 | `ETH_RPC_URL` |
| `sepolia` | 11155111 | `SEPOLIA_RPC_URL` |
| `base` | 8453 | `BASE_RPC_URL` |
| `base-sepolia` | 84532 | `BASE_SEPOLIA_RPC_URL` |
| `localhost` | 31337 | `http://localhost:8545` |

## Environment Variables

### Required for All Deployments
```bash
# In .env file
RPC_API_KEY=your-alchemy-key
ETHERSCAN_API_KEY=your-etherscan-key
BASESCAN_API_KEY=your-basescan-key
```

### Optional Contract-Specific Variables

#### Spirit Registry
```bash
SPIRIT_COUNCIL_ADDRESS=0x...  # Defaults to deployer
SAFE_FACTORY=0x...            # For Safe multisig deployments
```

#### Abraham NFTs
```bash
ABRAHAM_OWNER=0x...           # Defaults to deployer
ABRAHAM_BASE_URI=ipfs://...
ABRAHAM_MAX_SUPPLY=100
```

#### Gepetto NFTs
```bash
TOY_NAME="Gepetto Toys"
TOY_SYMBOL="TOY"
TOY_OWNER=0x...               # Defaults to deployer
PAYOUT_ADDRESS=0x...
ROYALTY_RECEIVER=0x...
BASE_URI=ipfs://...
```

#### Solienne NFTs
```bash
SOLIENNE_OWNER=0x...          # Defaults to deployer
SOLIENNE_BASE_URI=ipfs://...
SOLIENNE_MAX_SUPPLY=1000
```

## Verification

All contracts are **automatically verified** on Etherscan/Basescan when deployed with the default settings.

To verify manually:
```bash
make verify-contract ADDRESS=0x... CONTRACT=ContractName NETWORK=sepolia
```

## Utilities

```bash
# Show all deployed contract addresses
make get-deployment-addresses NETWORK=sepolia

# Check deployer balance
make check-balance NETWORK=sepolia ACCOUNT=deployer

# Estimate gas for deployment
make estimate-gas SCRIPT=DeploySpiritRegistryV2 NETWORK=sepolia ACCOUNT=deployer
```

## Testing

```bash
# Run all tests
make test

# Test specific contract group
make test-spirit-registry
make test-nfts

# Run with gas report
forge test --gas-report
```

## Local Development

```bash
# Start local node
make start-local-node

# Fork mainnet for testing
make fork-mainnet

# Fork Base for testing
make fork-base

# Deploy to local node
make deploy-spirit-registry-v2 NETWORK=localhost ACCOUNT=deployer
```

## Example: Complete Spirit Registry V2 Deployment

```bash
# 1. Setup account (one time)
cast wallet import prod --interactive

# 2. Deploy to testnet
make deploy-spirit-registry-v2 NETWORK=sepolia ACCOUNT=prod

# 3. Get deployed addresses
make get-deployment-addresses NETWORK=sepolia

# Output:
# SpiritIdentityRegistryV2: 0x123...
# SpiritValidationRegistry: 0x456...
# SpiritReputationRegistry: 0x789...
# SpiritRegistryController: 0xabc...
```

## Example: Deploy Gepetto Toys to Base

```bash
# 1. Set environment variables
export TOY_NAME="Gepetto Toys Collection"
export TOY_SYMBOL="GTOY"
export PAYOUT_ADDRESS=0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e
export BASE_URI="ipfs://QmYourIPFSHash/"

# 2. Deploy to Base mainnet
make deploy-gepetto-toys NETWORK=base ACCOUNT=prod

# Output:
# ✅ Gepetto Toys NFT deployed at: 0x123...
# ✅ Gepetto Minter deployed at: 0x456...
```

## Security Notes

1. **Never commit private keys** - Use Foundry keystore
2. **Always test on testnet first** - Use Sepolia or Base Sepolia
3. **Verify contracts** - Automatic with `--verify` flag
4. **Check gas prices** - Use `make estimate-gas` before mainnet
5. **Use multisig for production** - Transfer ownership after deployment

## Troubleshooting

### "Account not found"
```bash
# List available accounts
ls ~/.foundry/keystores/

# Create the account
cast wallet import deployer --interactive
```

### "Insufficient funds"
```bash
# Check balance
make check-balance NETWORK=sepolia ACCOUNT=deployer

# Fund the account on testnet using a faucet
```

### "Verification failed"
```bash
# Ensure API key is set
export ETHERSCAN_API_KEY=your-key

# Verify manually
make verify-contract ADDRESS=0x... CONTRACT=ContractName
```

## Support

- [Foundry Book](https://book.getfoundry.sh/)
- [Cast Reference](https://book.getfoundry.sh/reference/cast/)
- [Forge Reference](https://book.getfoundry.sh/reference/forge/)

---

**All deployments use Foundry with automatic Etherscan verification. Each command clearly states what it deploys.**