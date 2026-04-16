# Testing Contracts

Development and testing contracts for the Eden smart contract ecosystem. These contracts are designed for **Sepolia testnet only** and should never be deployed to mainnet.

## 📋 Overview

This directory contains simple, lightweight contracts for testing and development purposes:

- **TestNFT**: Basic ERC721 NFT contract with Eden testnet pre-mints
- **TestERC20**: Simple ERC20 token contract for testing token interactions

## 🎨 TestNFT Contract

### Features
- **Standard ERC721**: Vanilla OpenZeppelin implementation
- **Pre-minted Tokens**: 2 tokens minted at deployment
- **Custom Metadata**: IPFS-based metadata with `.json` format
- **Eden Integration**: Pre-minted to Eden testnet addresses

### Pre-minted Tokens
```solidity
Token ID 0 → Eden Testnet Vault: 0x4351fF96cE1fA09B7eF08BCEF9bDAA753eF9674E
Token ID 1 → Eden Testnet Wallet: 0xc6fA64A9Dea97d4CB80Ed76007Cf3eb8ef4C6917
```

### Metadata Format
- **Base URI**: `ipfs://bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre/`
- **Token URI Pattern**: `{baseURI}{tokenId}.json`
- **Example**: `ipfs://...vre/0.json` for token ID 0

### Contract Details
- **Name**: "Test NFT Collection"
- **Symbol**: "TNFT"
- **Network**: Sepolia testnet only
- **Solidity**: 0.8.28

## 💰 TestERC20 Contract

### Features
- **Standard ERC20**: Basic OpenZeppelin implementation
- **Pre-minted Supply**: 1 billion tokens at deployment
- **18 Decimals**: Standard token precision

### Token Details
- **Name**: "Test Token"
- **Symbol**: "TEST"
- **Total Supply**: 1,000,000,000 tokens (1 billion)
- **Recipient**: Pre-minted to `0xF7425fB026f9297fCc57B14ace187215442586a2`

## 🚀 Deployment

### Deploy TestNFT Only
```bash
# Deploy just the TestNFT contract to Sepolia
make deploy-test-nft
```

### Deploy Both Contracts
```bash
# Deploy both TestNFT and TestERC20 to Sepolia
npx hardhat ignition deploy ignition/modules/Testing/DeployTesting.ts --network sepolia
```

### Deployment Restrictions
⚠️ **IMPORTANT**: These contracts are **Sepolia-only** and configured to prevent mainnet deployment.

## 🧪 Usage

### Testing NFT Functionality
```javascript
// Example interaction with TestNFT
const testNFT = await ethers.getContractAt("TestNFT", contractAddress);

// Check pre-minted tokens
console.log(await testNFT.ownerOf(0)); // Eden testnet vault
console.log(await testNFT.ownerOf(1)); // Eden testnet wallet

// Get metadata URI
console.log(await testNFT.tokenURI(0)); // ipfs://...vre/0.json
```

### Testing ERC20 Functionality
```javascript
// Example interaction with TestERC20
const testERC20 = await ethers.getContractAt("TestERC20", contractAddress);

// Check total supply
console.log(await testERC20.totalSupply()); // 1 billion * 10^18

// Check pre-mint recipient balance
console.log(await testERC20.balanceOf("0xF7425fB026f9297fCc57B14ace187215442586a2"));
```

## 🔧 Development

### Contract Compilation
```bash
# Compile all contracts including testing
make compile
```

### Running Tests
```bash
# Run tests (includes testing contracts)
make test
```

### Linting
```bash
# Lint all contracts
make lint
```

## 📁 File Structure

```
contracts/Testing/
├── TestNFT.sol         # Basic ERC721 with Eden pre-mints
├── TestERC20.sol       # Basic ERC20 with pre-mint
└── README.md           # This file
```

## 🎯 Use Cases

### TestNFT
- Testing NFT marketplace integrations
- Metadata format validation
- Token transfer testing
- Royalty testing (basic ERC721)
- Eden wallet integration testing

### TestERC20
- Token transfer testing
- Allowance and approval testing
- DeFi integration testing
- Multi-token contract interactions

## ⚠️ Important Notes

1. **Testnet Only**: Never deploy to mainnet
2. **Development Use**: Not audited for production
3. **Simple Design**: Minimal features for testing clarity
4. **Fixed Parameters**: Pre-mint addresses and amounts are hardcoded
5. **Eden Integration**: Pre-minted to specific Eden testnet addresses

## 🔗 Related Documentation

- [FirstWorks Contracts](../FirstWorks/README.md) - Production NFT system
- [NFT Contracts](../NFT/README.md) - Auction and rolling NFT systems
- [Main README](../../README.md) - Full project documentation

---

**Happy Testing! 🧪**