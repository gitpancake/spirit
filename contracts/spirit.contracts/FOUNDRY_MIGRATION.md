# Foundry Migration Guide

## ✅ Migration Complete!

The project has been successfully migrated from Hardhat to Foundry. All contracts compile successfully and are ready for deployment using Foundry's superior speed and gas-efficiency.

## What Changed?

### New Files

- **foundry.toml** - Foundry configuration (replaces hardhat.config.ts functionality)
- **remappings.txt** - Import path mappings for dependencies
- **script/DeployGepettoToys.s.sol** - Foundry deployment script for Gepetto Toys
- **lib/** - Foundry dependencies directory
  - `lib/forge-std/` - Foundry standard library
  - `lib/openzeppelin-contracts/` - OpenZeppelin contracts v5.4.0
  - `lib/openzeppelin-contracts-upgradeable/` - OpenZeppelin upgradeable v5.4.0
  - `lib/ethereum-contracts/` - Superfluid contracts

### Updated Files

- **.env.example** - Enhanced with Foundry-specific documentation
- **Makefile** - Added Foundry/Forge targets (see below)

### Configuration Changes

- **EVM Version**: Changed to `cancun` (required for OpenZeppelin v5.4.0)
- **Compiler**: Solidity 0.8.28 with viaIR and 1000 optimizer runs
- **Networks**: Ethereum, Sepolia, Base, Base Sepolia configured
- **Verification**: Etherscan and Basescan API integration

## Quick Start

### 1. Install Dependencies (Already Done ✅)

```bash
forge install  # Already installed during migration
```

### 2. Set Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your keys
```

Required variables:
- `PRIVATE_KEY` - Your deployer private key
- `RPC_API_KEY` - Alchemy/Infura API key
- `ETHERSCAN_API_KEY` - For Ethereum verification
- `BASESCAN_API_KEY` - For Base verification

### 3. Compile Contracts

```bash
make forge-build
# OR
forge build
```

### 4. Run Tests

```bash
make forge-test
# OR
forge test -vvv
```

## Foundry Commands (via Makefile)

### Compilation & Testing

```bash
make forge-build           # Compile all contracts
make forge-test            # Run tests with verbose output
make forge-gas             # Generate gas report
make forge-coverage        # Generate coverage report
make forge-clean           # Clean build artifacts
```

### Gepetto Toys Deployment

```bash
# Dry-run (simulation only)
make forge-deploy-gepetto-toys-dry NETWORK=base-sepolia

# Deploy to Base Sepolia (testnet)
make forge-deploy-gepetto-toys-base-sepolia

# Deploy to Base Mainnet (production)
make forge-deploy-gepetto-toys-base

# Custom network deployment
make forge-deploy-gepetto-toys NETWORK=sepolia
```

### Utilities

```bash
make forge-fmt             # Format Solidity code
make forge-fmt-check       # Check formatting
make forge-update          # Update all dependencies
make forge-config          # Show Foundry configuration
```

## Deployment Example: Gepetto Toys

### Option 1: Using Makefile (Recommended)

```bash
# 1. Set environment variables in .env
TOY_NAME="Brainrot Toys"
TOY_SYMBOL="TOY"
TOY_OWNER=0xYourOwnerAddress
PAYOUT_ADDRESS=0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e
ROYALTY_RECEIVER=0xYourRoyaltyAddress
BASE_URI="ipfs://YOUR_CID/"

# 2. Deploy to Base Sepolia testnet
make forge-deploy-gepetto-toys-base-sepolia

# 3. Check deployment-gepetto-toys.txt for contract addresses
cat deployment-gepetto-toys.txt
```

### Option 2: Direct Forge Command

```bash
forge script script/DeployGepettoToys.s.sol:DeployGepettoToys \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  -vvvv
```

## Environment Variables for Deployment

All deployment parameters can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TOY_NAME` | Collection name | "Brainrot Toys" |
| `TOY_SYMBOL` | Collection symbol | "TOY" |
| `TOY_OWNER` | Contract owner address | Deployer address |
| `PAYOUT_ADDRESS` | Mint revenue recipient | `0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e` (Gepetto Multisig) |
| `ROYALTY_RECEIVER` | Royalty payment recipient | Same as payout address |
| `BASE_URI` | Metadata base URI | Empty (set later via setBaseURI) |

## Advantages of Foundry

### Speed
- **10x faster compilation** than Hardhat
- **Instant test feedback** with `forge test --watch`
- **Parallel test execution**

### Gas Efficiency
- Built-in gas reporting without plugins
- Gas snapshots for tracking optimization
- Detailed gas profiling per function

### Developer Experience
- **Solidity-native testing** - Write tests in Solidity
- **Powerful cheatcodes** - vm.prank(), vm.deal(), vm.warp(), etc.
- **Fuzz testing** built-in
- **Symbolic execution** with `forge verify-contract`

### Type Safety
- No TypeScript/JavaScript layer
- Compile-time checks in deployment scripts
- Direct contract interaction

## Network Configuration

Configured networks in `foundry.toml`:

```toml
[profile.default.rpc_endpoints]
ethereum = "https://eth-mainnet.g.alchemy.com/v2/${RPC_API_KEY}"
sepolia = "https://eth-sepolia.g.alchemy.com/v2/${RPC_API_KEY}"
base = "https://base-mainnet.g.alchemy.com/v2/${RPC_API_KEY}"
base-sepolia = "https://base-sepolia.g.alchemy.com/v2/${RPC_API_KEY}"
localhost = "http://127.0.0.1:8545"
```

## Deployment Artifacts

Foundry stores deployment info in:
- **broadcast/** - Transaction receipts and deployment logs
- **deployment-gepetto-toys.txt** - Contract addresses (auto-generated)
- **out/** - Compiled artifacts (ABI, bytecode)

## Verification

Contracts are automatically verified on block explorers when using `--verify` flag.

Manual verification:
```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  contracts/Gepetto/GepettoToys.sol:GepettoToys \
  --chain base-sepolia \
  --watch
```

## Troubleshooting

### "Failed to get EIP-1559 fees"
- **Solution**: Add `--legacy` flag for networks without EIP-1559

### "Compiler version mismatch"
- **Solution**: Run `forge build --force` to recompile

### "Transaction underpriced"
- **Solution**: Increase gas price with `--gas-price` flag

### "Verification failed"
- **Solution**: Wait 30 seconds after deployment, then verify manually

## Migration Notes

### What's NOT Removed

We kept Hardhat files for reference and backwards compatibility:
- `hardhat.config.ts` - Still present for existing scripts
- `node_modules/` - npm dependencies still installed
- `ignition/` - Hardhat Ignition deployments preserved

You can safely use both Hardhat and Foundry in the same project.

### Why Cancun EVM?

OpenZeppelin v5.4.0 uses the `mcopy` instruction, which requires Cancun EVM version. This is the latest EVM version and is supported by:
- ✅ Ethereum Mainnet (post-Cancun upgrade)
- ✅ Base & Base Sepolia
- ✅ Sepolia testnet

## Next Steps

1. ✅ **Compile contracts**: `make forge-build`
2. ✅ **Run tests**: `make forge-test`
3. 📝 **Set .env variables**: Copy from .env.example
4. 🚀 **Deploy to testnet**: `make forge-deploy-gepetto-toys-base-sepolia`
5. ✅ **Verify deployment**: Check deployment-gepetto-toys.txt
6. 🎨 **Deploy to mainnet**: `make forge-deploy-gepetto-toys-base`

## Resources

- **Foundry Book**: https://book.getfoundry.sh/
- **Forge CLI Reference**: https://book.getfoundry.sh/reference/forge/
- **Foundry Discord**: https://discord.gg/foundry-rs
- **Cast (CLI tool)**: https://book.getfoundry.sh/reference/cast/

## Support

For issues or questions:
- Check `forge --help` or `cast --help`
- Read the Foundry Book: https://book.getfoundry.sh/
- Ask in Foundry Discord: https://discord.gg/foundry-rs

---

**Migration completed**: 2025-11-25  
**Foundry version**: 1.4.4  
**Solidity version**: 0.8.28  
**OpenZeppelin version**: 5.4.0
