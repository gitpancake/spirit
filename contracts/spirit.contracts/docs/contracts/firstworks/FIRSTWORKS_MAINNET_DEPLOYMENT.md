# FirstWorks Mainnet Deployment Guide

## Overview

This document provides comprehensive details about the Abraham's First Works NFT collection deployment to Ethereum mainnet, including contract addresses, configuration, timeline, and operational procedures.

## Deployment Information

### Network Details

- **Network**: Ethereum Mainnet
- **Chain ID**: 1
- **Deployment Date**: October 1, 2025
- **Deployer**: 0xe4951bee6fa86b809655922f610ff74c0e33416c
- **Status**: ✅ Deployed & Verified

### Contract Addresses

| Contract | Address | Verified |
|----------|---------|----------|
| **AbrahamFirstWorks** (NFT) | [0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8](https://etherscan.io/address/0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8#code) | ✅ |
| **FixedPriceSale** | [0xB47708719F606E5AEb4D42E5667317640677448b](https://etherscan.io/address/0xB47708719F606E5AEb4D42E5667317640677448b#code) | ✅ |

## Collection Configuration

### Basic Information

```
Name: Abraham's First Works
Symbol: AFW
Max Supply: 2,500 NFTs
Sale Price: 0.025 ETH per NFT
Batch Limit: 50 NFTs per transaction
```

### Metadata

```
Base URI: ipfs://bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre
Token URI Format: {baseURI}/{tokenId}
```

### Roles & Addresses

| Role | Address | Purpose |
|------|---------|---------|
| **Artist** | 0xF7425fB026f9297fCc57B14ace187215442586a2 | Gene - Can mint reserved tokens |
| **Royalty Receiver** | 0xF7425fB026f9297fCc57B14ace187215442586a2 | Gene - Receives 5% royalties |
| **Payout Address** | 0x2B5C11E2aaa431501f661f508e465B59fBD73e0C | Eden Operations Multisig |
| **Owner** | 0xe4951bee6fa86b809655922f610ff74c0e33416c | Contract owner/admin |
| **Authorized Minter** | 0xB47708719F606E5AEb4D42E5667317640677448b | FixedPriceSale contract |

### Royalties

- **Standard**: ERC-2981
- **Percentage**: 5% (500 basis points)
- **Receiver**: Gene (0xF7425fB026f9297fCc57B14ace187215442586a2)

## Sale Timeline

### Presale (Whitelist)

- **Start Time**: Monday, October 6, 2025 at 12:00 PM EDT
- **Unix Timestamp**: 1759766400
- **Access**: Merkle tree whitelist required
- **Duration**: 48 hours (until public sale)

### Public Sale

- **Start Time**: Wednesday, October 8, 2025 at 12:00 PM EDT
- **Unix Timestamp**: 1759939200
- **Access**: Open to all
- **Duration**: Until sold out or paused

### Whitelist Configuration

The presale uses a Merkle tree for whitelist verification:
- Whitelist addresses and proofs managed off-chain
- Merkle root configured in FixedPriceSale contract
- Each whitelisted address can mint during presale window

## Contract Features

### AbrahamFirstWorks NFT Contract

**Core Functionality:**
- ERC-721 compliant NFT with metadata
- Immutable max supply (2,500)
- Single authorized minter (FixedPriceSale contract)
- Artist-reserved minting capability
- Owner-controlled base URI updates
- Pausable for emergency situations

**Key Functions:**
```solidity
// Minting (only authorized minter or artist)
function mint(address recipient) external returns (uint256)
function mintBatch(address recipient, uint256 count) external returns (uint256[] memory)

// Artist minting (only artist)
function artistMint(address recipient, uint256 count) external returns (uint256[] memory)

// Admin functions (owner only)
function updateBaseURI(string memory newBaseURI) external
function updateAuthorizedMinter(address newMinter) external
function pause() external
function unpause() external
```

### FixedPriceSale Contract

**Core Functionality:**
- Fixed price minting (0.025 ETH)
- Presale with whitelist verification
- Public sale after presale period
- Batch minting support (up to 50 NFTs)
- Exact payment validation (no overpayment)
- Artist reserved minting
- Automatic ETH forwarding to payout address

**Key Functions:**
```solidity
// Public minting
function mint() external payable returns (uint256)
function mintBatch(uint256 count) external payable returns (uint256[] memory)
function mintBatchTo(address recipient, uint256 count) external payable returns (uint256[] memory)

// Whitelist minting (presale)
function whitelistMint(bytes32[] calldata proof) external payable returns (uint256)
function whitelistMintBatch(uint256 count, bytes32[] calldata proof) external payable returns (uint256[] memory)

// Artist minting (no payment required)
function artistMint(uint256 count) external returns (uint256[] memory)
function artistMintTo(address recipient, uint256 count) external returns (uint256[] memory)

// Admin functions
function updatePrice(uint256 newPrice) external
function updateWhitelistMerkleRoot(bytes32 newRoot) external
function updatePayoutAddress(address newAddress) external
function updateArtist(address newArtist) external
function updateSaleTiming(uint256 newPresaleStart, uint256 newPublicStart) external
function pause() external
function unpause() external
function withdraw() external
```

## Sale Mechanics

### Pricing

- **Base Price**: 0.025 ETH per NFT
- **Payment**: Exact amount required (overpayment rejected)
- **Batch Pricing**: `price * count` (exact payment)

### Minting Limits

- **Single Mint**: 1 NFT per transaction
- **Batch Mint**: Up to 50 NFTs per transaction
- **Total Supply**: 2,500 NFTs maximum
- **No per-wallet limit**: Users can mint multiple times

### Payment Flow

1. User sends exact ETH amount (`price * count`)
2. Contract validates payment amount
3. NFTs minted to specified recipient
4. ETH automatically forwarded to payout address
5. Events emitted for tracking

### Whitelist Verification

**Presale Process:**
1. User submits Merkle proof with transaction
2. Contract verifies proof against stored root
3. If valid, minting proceeds with presale pricing
4. Whitelist enforced only during presale window

**Generating Proofs:**
```bash
# Use the merkle tree generation script
node scripts/generate-merkle-tree.js --addresses addresses.txt
```

## Security Features

### Access Control

- **Owner-only functions**: Price updates, timing changes, pause/unpause
- **Artist-only functions**: Reserved minting
- **Authorized minter**: Only FixedPriceSale can mint through NFT contract

### Safety Mechanisms

1. **Reentrancy Protection**: All state changes before external calls
2. **Pausable**: Emergency pause functionality
3. **Supply Limits**: Hard cap at contract level
4. **Payment Validation**: Exact payment required (no overpayment)
5. **Immutable Parameters**: Max supply cannot be changed after deployment

### Tested Scenarios

✅ All 68 test suites passing, including:
- Standard minting flows
- Batch minting with various quantities
- Whitelist verification
- Artist reserved minting
- Payment validation (exact, underpayment, overpayment)
- Supply limit enforcement
- Access control
- Pause/unpause functionality
- Edge cases and error conditions

## Deployment Process

### Deployment Steps

The deployment was executed using Hardhat Ignition:

```bash
# Production deployment command
make deploy-first-works-production NETWORK=ethereum
```

**Deployment Sequence:**
1. Deploy AbrahamFirstWorks NFT contract
2. Deploy FixedPriceSale contract (references NFT)
3. Set FixedPriceSale as authorized minter on NFT contract
4. Log deployment addresses and configuration

### Verification Process

Contracts verified using Hardhat with Etherscan API V2:

```bash
# NFT contract verification
npx hardhat verify --network ethereum 0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8 \
  "Abraham's First Works" "AFW" \
  "0xe4951bee6fa86b809655922f610ff74c0e33416c" \
  2500 \
  "0x0000000000000000000000000000000000000000" \
  "ipfs://bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre" \
  "0xF7425fB026f9297fCc57B14ace187215442586a2" \
  500

# Sale contract verification
npx hardhat verify --network ethereum 0xB47708719F606E5AEb4D42E5667317640677448b \
  "0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8" \
  "0xe4951bee6fa86b809655922f610ff74c0e33416c" \
  "0x2B5C11E2aaa431501f661f508e465B59fBD73e0C" \
  "25000000000000000" \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  "0xF7425fB026f9297fCc57B14ace187215442586a2" \
  1759766400 \
  1759939200
```

### Deployment Artifacts

Full deployment artifacts are preserved in:
```
ignition/deployments/FirstWorksProduction-1759379990/
├── artifacts/              # Contract ABIs and metadata
├── build-info/            # Compilation details
├── deployed_addresses.json # Contract addresses
└── journal.jsonl          # Transaction log
```

## Operations Guide

### Pre-Launch Checklist

- [x] Deploy contracts to mainnet
- [x] Verify contracts on Etherscan
- [x] Configure whitelist merkle root
- [ ] Upload complete NFT metadata to IPFS
- [ ] Test presale with whitelisted addresses
- [ ] Verify royalty configuration
- [ ] Prepare monitoring dashboard
- [ ] Set up alert systems

### Launch Day Operations

**Before Presale:**
1. Final whitelist verification
2. Test minting on testnet
3. Monitor gas prices
4. Prepare communication channels

**During Presale:**
1. Monitor transactions and events
2. Track minting progress
3. Support user issues
4. Verify ETH forwarding to payout address

**During Public Sale:**
1. Continue monitoring
2. Track remaining supply
3. Verify all minting types work correctly

### Administrative Tasks

**Update Price:**
```javascript
// Only if needed before launch
const tx = await fixedPriceSale.updatePrice(ethers.parseEther("0.03"));
await tx.wait();
```

**Update Whitelist:**
```javascript
// Update merkle root if whitelist changes
const newRoot = "0x...";
const tx = await fixedPriceSale.updateWhitelistMerkleRoot(newRoot);
await tx.wait();
```

**Emergency Pause:**
```javascript
// Pause both contracts if critical issue
await abrahamFirstWorks.pause();
await fixedPriceSale.pause();
```

**Withdraw Funds:**
```javascript
// Manually withdraw if needed (ETH auto-forwards normally)
const tx = await fixedPriceSale.withdraw();
await tx.wait();
```

### Monitoring

**Key Metrics to Track:**
- Total minted vs remaining supply
- ETH collected and forwarded
- Gas prices and transaction success rates
- Whitelist usage during presale
- Artist reserved mints used
- Any failed transactions or errors

**Events to Monitor:**
```solidity
// NFT Contract
event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint256 price)
event BatchMinted(address indexed payer, address indexed recipient, uint256[] tokenIds, uint256 totalPrice)

// Sale Contract
event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint256 price)
event BatchMinted(address indexed payer, address indexed recipient, uint256[] tokenIds, uint256 totalPrice)
event PriceUpdated(uint256 oldPrice, uint256 newPrice)
event WhitelistMerkleRootUpdated(bytes32 oldRoot, bytes32 newRoot)
```

## Integration Examples

### Frontend Minting Integration

**Standard Public Mint:**
```javascript
const saleContract = new ethers.Contract(SALE_ADDRESS, SALE_ABI, signer);
const price = await saleContract.price();
const tx = await saleContract.mint({ value: price });
await tx.wait();
```

**Batch Mint:**
```javascript
const count = 5;
const price = await saleContract.price();
const totalCost = price * BigInt(count);
const tx = await saleContract.mintBatch(count, { value: totalCost });
await tx.wait();
```

**Whitelist Mint:**
```javascript
// Get proof from backend/API
const proof = await fetchMerkleProof(userAddress);
const price = await saleContract.price();
const tx = await saleContract.whitelistMint(proof, { value: price });
await tx.wait();
```

### Reading Contract State

```javascript
// Check total supply and minted count
const maxSupply = await nftContract.maxSupply();
const totalMinted = await nftContract.totalMinted();
const remaining = maxSupply - totalMinted;

// Check sale status
const saleStatus = await saleContract.getSaleStatus();
// Returns: [0=NotStarted, 1=Presale, 2=PublicSale]

// Check pricing
const price = await saleContract.price();
const formattedPrice = ethers.formatEther(price);
```

## Troubleshooting

### Common Issues

**"Mint not started"**
- Check current time vs presale/public start times
- Verify sale status with `getSaleStatus()`

**"Invalid merkle proof"**
- Verify user address in whitelist
- Regenerate merkle proof
- Check whitelist merkle root matches

**"Insufficient payment"**
- Calculate exact amount: `price * count`
- Don't send extra (will revert)

**"Exceeds max supply"**
- Check remaining supply
- Reduce batch size

**"Batch size exceeds maximum"**
- Limit batch to 50 NFTs
- Split large mints into multiple transactions

## Technical Specifications

### Compiler Settings

```
Solidity: 0.8.26
Optimizer: Enabled (1000 runs)
Via IR: True
```

### Gas Estimates

Approximate gas costs on mainnet:
- Single mint: ~100k-150k gas
- Batch mint (10): ~500k-800k gas
- Batch mint (50): ~2M-3M gas
- Artist mint: Similar to batch mint

*Note: Gas costs vary with network conditions*

### Dependencies

- OpenZeppelin Contracts v5.1.0
- ERC-721 with enumerable and metadata
- ERC-2981 royalty standard
- Ownable access control
- Pausable emergency control

## Support & Resources

### Documentation
- Main README: [README.md](./README.md)
- Deployment Status: [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)
- Contract Source: `contracts/FirstWorks/`
- Tests: `test/FirstWorks/`

### External Links
- Etherscan (NFT): https://etherscan.io/address/0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8
- Etherscan (Sale): https://etherscan.io/address/0xB47708719F606E5AEb4D42E5667317640677448b
- IPFS Metadata: ipfs://bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre

### Contact
For technical issues or questions, contact the Eden development team.

---

**Last Updated:** October 2, 2025
**Version:** 1.0
**Status:** Production Deployment Complete
