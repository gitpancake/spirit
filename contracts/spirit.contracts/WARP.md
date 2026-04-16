# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Spirit Smart Contracts is a comprehensive Hardhat-based project featuring advanced ERC-20 tokens with automated distribution capabilities. The system includes multiple contract types: Spirit tokens with proportional revenue distribution, SuperTokens with Superfluid integration, NFT auctions, and various utility contracts.

## Essential Commands

### Development Environment Setup
```bash
# Install dependencies (recommended over npm install)
npm ci

# Environment setup
cp .env.example .env
# Then edit .env with required API keys

# Compile contracts
npm run compile
# or
make compile

# Clean build artifacts
npm run clean
# or
make clean
```

### Testing
```bash
# Run all tests with local node management
make test

# Run tests manually
npm test
# or
npx hardhat test

# Run specific test files
npx hardhat test test/Spirit/Spirit.test.ts
npx hardhat test --grep "Deployment"

# Test coverage
npm run coverage
# or
make coverage

# Gas reporting
npm run gas-report
# or 
make gas-report

# SuperToken-specific tests
make test-supertoken
```

### Local Development
```bash
# Start local Hardhat node (background)
make node

# Stop local node
make stop-node

# Test on localhost network
npx hardhat test --network localhost
```

### Code Quality
```bash
# Lint TypeScript and Solidity
npm run lint
# or
make lint

# Auto-fix linting issues
npm run lint:fix

# Format code (Prettier)
npm run format
# or
make format
```

### Deployment
```bash
# Deploy to testnet using Ignition (recommended)
npx hardhat ignition deploy ignition/modules/Spirit/DeploySpirit.ts --network sepolia

# Deploy using Makefile shortcuts
make deploy-spirit NETWORK=base-sepolia
make deploy-distributor NETWORK=base-sepolia
make deploy-auction NETWORK=base-sepolia
make deploy-supertoken-complete NETWORK=base-sepolia

# Check deployment status
make deploy-status NETWORK=base-sepolia

# See all deployment options
make list-deployments
```

### Superfluid/Distribution Pool Management
```bash
# Interact with distribution pools
make interact-pool NETWORK=base-sepolia

# Check pool status
make check-pool-status NETWORK=base-sepolia

# Start revenue flow
make start-revenue-flow NETWORK=base-sepolia FLOW_RATE=100

# Stop revenue flow
make stop-revenue-flow NETWORK=base-sepolia

# Learn ETH distribution mechanics (interactive)
make learn-eth-distribution NETWORK=base-sepolia
```

## Architecture Overview

### Contract Hierarchy

**Spirit Token System:**
```
Spirit.sol (Main Contract)
├── ERC20Mechanics.sol (ERC-20 + Distribution Integration)
│   └── OpenZeppelin ERC20
└── Distributor.sol (Distribution Logic + Holder Management)
    ├── ReentrancyGuard (Security)
    ├── Ownable (Access Control)
    ├── Pausable (Emergency Controls)
    └── Libraries/
        ├── DistributionEvents.sol
        └── DistributionErrors.sol
```

**SuperToken System (Superfluid Integration):**
```
PureSuperToken.sol
├── CustomSuperTokenBase (Superfluid)
├── UUPSProxy (Upgradeability)
└── DistributionPool.sol (Revenue Distribution)
```

### Key Components

1. **Spirit Token**: Core ERC-20 with automated ETH/token distribution to holders
2. **SuperTokens**: Superfluid-compatible tokens with streaming capabilities
3. **NFT Auctions**: Daily auction system for NFT minting
4. **Distribution System**: Sophisticated holder management with linked lists
5. **Ignition Modules**: Production deployment management

### Distribution Mechanics

**Spirit Token Distribution:**
- < 200 holders: Auto-distribute ETH immediately via `receive()`
- ≥ 200 holders: Manual batch distribution via `distributeEthBatch()`
- ERC-20 tokens: Always manual distribution via `distributeERC20Batch()`
- Proportional to token holdings: `share = (totalAmount × holderBalance) / totalSupply`

**Holder Management:**
- Efficient linked list structure for large holder counts
- O(1) add/remove operations
- Automatic tracking on transfers
- Gas-optimized batch processing

## Environment Configuration

### Required Environment Variables
```bash
# Deployment keys
PRIVATE_KEY=your_private_key_here
RPC_API_KEY=your_rpc_provider_api_key

# Contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key

# Optional gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### Supported Networks
- `hardhat`: Local development
- `localhost`: Local node (requires `hardhat node`)
- `sepolia`: Ethereum testnet
- `base-sepolia`: Base testnet (default for deployments)

## Development Patterns

### Solidity Configuration
- **Version**: 0.8.26 and 0.8.28 compilers
- **Optimizer**: Enabled with 1000 runs
- **ViaIR**: Enabled (affects debugging with some Hardhat features)
- **Security**: ReentrancyGuard, Pausable, Ownable patterns

### Testing Patterns
```bash
# Single contract tests
npx hardhat test test/Spirit/SpiritDistribution.test.ts

# Specific test patterns
npx hardhat test --grep "should distribute ETH automatically"

# Network-specific testing
npx hardhat test --network localhost
```

### Gas Optimization
- Linked list holder management for efficient large-scale distributions
- Configurable batch sizes to prevent gas limit issues
- Gas guards to prevent DoS attacks
- Conservative defaults for Base network (50 recipients/tx max)

## Security Features

### Access Control
- Owner-only administrative functions
- Treasury role for token support management
- Emergency pause capabilities
- Reentrancy protection on all critical functions

### Emergency Controls
```solidity
// Pause all distributions
pauseDistribution("Emergency maintenance")

// Emergency asset recovery
emergencyWithdraw(tokenAddress, amount, recipient)
```

### Testing Security
- Comprehensive reentrancy attack tests
- Gas exhaustion protection tests
- Double-distribution prevention
- Edge case coverage (zero balances, invalid addresses)

## Deployment Strategy

### Using Ignition (Recommended)
```bash
# Complete SuperToken infrastructure
make deploy-supertoken-complete NETWORK=base-sepolia

# Individual components
make deploy-spirit NETWORK=base-sepolia
make deploy-auction NETWORK=base-sepolia
```

### Post-Deployment
1. Verify contracts on block explorer
2. Configure supported ERC-20 tokens
3. Set up monitoring for distribution events
4. Test distribution functions on testnet

## Troubleshooting

### Common Issues
```bash
# Compilation errors
make clean && make compile

# Environment variable issues
npx hardhat compile  # Check for missing vars in output

# Local node issues
make stop-node && make test

# Network connectivity
npx hardhat console --network sepolia
```

### ViaIR Considerations
- ViaIR is enabled in Solidity settings for optimization
- May affect some Hardhat debugging features
- Consider disabling for development if debugging issues arise

## Important Notes

- **Fixed Supply**: Spirit token has 1B fixed supply (non-mintable after deployment)
- **Automatic Distribution**: ETH sent to Spirit contract triggers automatic distribution
- **Batch Limits**: Default 200 holders max per batch (configurable)
- **Network Defaults**: Base Sepolia is the default deployment network
- **Gas Costs**: Distribution costs ~50k gas per 100 holders for ETH
