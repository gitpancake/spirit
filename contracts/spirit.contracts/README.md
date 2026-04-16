# Spirit Smart Contracts

**Foundry-based smart contract deployment system for Spirit NFT collections and AI agent registry.**

## Overview

This repository contains all Spirit smart contracts including:
- **Spirit Registry V2**: ERC-8004 compliant AI agent identity system with Safe multisig support
- **NFT Collections**: Abraham, Gepetto, Solienne collections with various sale mechanics
- **Auction Contracts**: Time-based and fixed-price auction systems
- **Superfluid Integration**: Distribution pools and SuperToken implementations

## Quick Start

### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Setup Account

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

### 4. Deploy

```bash
# Deploy Spirit Registry V2
make deploy-spirit-registry-v2 NETWORK=sepolia ACCOUNT=deployer

# Deploy NFT Collections
make deploy-abraham-early-works NETWORK=sepolia ACCOUNT=deployer
make deploy-gepetto-toys NETWORK=base ACCOUNT=deployer
make deploy-solienne-manifesto NETWORK=sepolia ACCOUNT=deployer

# See all available commands
make help
```

## Documentation

- [📋 Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [🏛️ Spirit Registry Documentation](./contracts/Spirit/README.md) - ERC-8004 AI agent system
- [🎨 NFT Collections Documentation](./contracts/NFT/README.md) - All NFT contracts

## Foundry Tools

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:
- **Forge**: Ethereum testing framework for smart contract development
- **Cast**: Swiss army knife for interacting with EVM smart contracts
- **Anvil**: Local Ethereum node for development and testing
- **Chisel**: Fast, utilitarian, and verbose Solidity REPL

## Development

### Build

```bash
make build
# or
forge build
```

### Test

```bash
make test
# or
forge test -vv
```

### Test Coverage

```bash
forge coverage
```

### Format

```bash
make format
# or
forge fmt
```

### Local Development

```bash
# Start local node
make start-local-node

# Fork mainnet
make fork-mainnet

# Fork Base
make fork-base
```

## Contract Deployments

All deployments use Foundry with automatic Etherscan verification. Each command clearly states what it deploys:

| Command | Description |
|---------|-------------|
| `deploy-spirit-registry-v2` | Complete Spirit Registry V2 system |
| `deploy-abraham-early-works` | Abraham Early Works NFT |
| `deploy-abraham-covenant` | Abraham Covenant NFT |
| `deploy-gepetto-toys` | Gepetto Toys NFT + Minter |
| `deploy-solienne-manifesto` | Solienne Manifesto NFT |
| `deploy-solienne-origin-series` | Solienne Origin Series NFT |

View all commands: `make help`

## Networks

| Network | Chain ID | Configuration |
|---------|----------|---------------|
| Ethereum | 1 | `ethereum` |
| Sepolia | 11155111 | `sepolia` |
| Base | 8453 | `base` |
| Base Sepolia | 84532 | `base-sepolia` |
| Local | 31337 | `localhost` |

## Security

1. **Never commit private keys** - Use Foundry keystore
2. **Always test on testnet first** - Use Sepolia or Base Sepolia
3. **Verify contracts** - Automatic with deployments
4. **Use multisig for production** - Transfer ownership to Safe after deployment

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Cast Reference](https://book.getfoundry.sh/reference/cast/)
- [Forge Reference](https://book.getfoundry.sh/reference/forge/)

## License

MIT