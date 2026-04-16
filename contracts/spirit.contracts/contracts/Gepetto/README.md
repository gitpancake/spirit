# Gepetto Toys NFT System

## Overview

Gepetto Toys is a simple, fixed-price NFT minting system for collectible toys. The system consists of two contracts:

1. **GepettoToys**: ERC-721 NFT contract with EIP-2981 royalty support
2. **GepettoMinter**: Fixed-price minter at 0.001 ETH per mint

## Features

### GepettoToys (NFT Contract)

- **Standard**: ERC-721 (NFT standard)
- **Royalties**: EIP-2981 compliant (5% default)
- **Max Supply**: 10,000 toys
- **Token ID**: Starts at 0
- **Metadata**: External JSON files on Supabase
- **Metadata URI**: {baseURI}{tokenId}.json (default: Supabase storage)
- **Upload-First Workflow**: Metadata JSON must be uploaded to Supabase before minting
- **Minter Authorization**: Only authorized minter can mint
- **Pausable**: Emergency stop functionality
- **Ownership**: Deployed with custom owner address

### GepettoMinter (Minting Contract)

- **Price**: 0.001 ETH per mint (fixed)
- **Public Minting**: Anyone can mint by paying the price
- **Admin Batch Mint**: Owner can mint for free (airdrops)
- **Metadata**: External JSON files on Supabase
- **Upload-First**: Metadata JSON must be uploaded to {baseURI}{tokenId}.json before minting
- **Security**: ReentrancyGuard + Pausable
- **Revenue**: ETH collected, withdrawable by owner

## Contract Specifications

### GepettoToys.sol

```solidity
// Core Functions
mint(address to) → uint256 tokenId
tokenURI(uint256 tokenId) → string memory  // Returns Supabase URL: {baseURI}{tokenId}.json
remainingSupply() → uint256

// Admin Functions
updateMinter(address newMinter)
setName(string calldata newName)        // Update collection name
setSymbol(string calldata newSymbol)    // Update collection symbol
setToyName(string calldata newToyName)  // Update toy name used in metadata
setDescription(string calldata newDesc)  // Update description used in metadata
setBaseURI(string calldata newBaseURI)   // Update image base URI
setDefaultRoyalty(address receiver, uint96 feeNumerator)
pause() / unpause()

// View Functions
name() → string memory          // ERC-721 collection name
symbol() → string memory        // ERC-721 collection symbol
toyName() → string memory       // Toy name prefix used in metadata
description() → string memory   // Description used in metadata
baseURI() → string memory       // Base URI for images
totalSupply() → uint256
nextTokenId() → uint256
exists(uint256 tokenId) → bool
authorizedMinter() → address
```

### GepettoMinter.sol

```solidity
// Public Functions
mint(address recipient) payable → uint256 tokenId

// Admin Functions
batchMint(address[] recipients) → uint256 successCount
withdraw()
updatePayoutAddress(address newPayoutAddress)
pause() / unpause()

// View Functions
mintPrice() → uint256 (0.001 ether)
balance() → uint256
totalRevenue() → uint256
totalMinted() → uint256
```

## Deployment

### Quick Deploy

```bash
make deploy-gepetto-toys NETWORK=base-sepolia
```

### With Custom Parameters

```bash
make deploy-gepetto-toys \
  TOY_OWNER=0xYourOwnerAddress \
  PAYOUT_ADDRESS=0xYourPayoutAddress \
  ROYALTY_RECEIVER=0xYourRoyaltyAddress \
  BASE_URI="ipfs://YOUR_CID/" \
  NETWORK=base
```

### What Gets Deployed

1. **GepettoToys NFT** with:
   - Owner: Custom or deployer
   - Initial minter: Deployer (temporary)
   - Royalty receiver: Custom or payout address

2. **GepettoMinter** with:
   - Owner: Custom or deployer
   - Payout address: Custom or deployer
   - Toy contract: GepettoToys address

3. **Auto-configuration**:
   - Updates NFT's authorized minter to GepettoMinter
   - Ready to mint immediately after deployment

## Usage

### Set Base URI (if not set during deployment)

```bash
cast send <NFT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://YOUR_CID/" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### Public Minting (0.001 ETH)

**Important**: Upload metadata JSON to Supabase BEFORE minting!

**Default Base URI**: `https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/`

```bash
# Upload metadata JSON files to Supabase first:
# https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json
# https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/1.json
# etc.

# Then mint a toy to yourself
cast send <MINTER_ADDRESS> \
  "mint(address)" \
  <YOUR_ADDRESS> \
  --value 0.001ether \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY

# Mint a toy as a gift to someone else
cast send <MINTER_ADDRESS> \
  "mint(address)" \
  <RECIPIENT_ADDRESS> \
  --value 0.001ether \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Admin Batch Mint (Free)

```bash
# Upload metadata JSON for token IDs 0, 1, 2 to Supabase first, then airdrop
cast send <MINTER_ADDRESS> \
  "batchMint(address[])" \
  "[0xAddr1,0xAddr2,0xAddr3]" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### Withdraw Revenue

```bash
# Withdraw all collected ETH to payout address
cast send <MINTER_ADDRESS> \
  "withdraw()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### Check Status

```bash
# Check remaining supply
cast call <NFT_ADDRESS> \
  "remainingSupply()(uint256)" \
  --rpc-url $BASE_RPC_URL

# Check total minted
cast call <NFT_ADDRESS> \
  "totalSupply()(uint256)" \
  --rpc-url $BASE_RPC_URL

# Check minter balance
cast call <MINTER_ADDRESS> \
  "balance()(uint256)" \
  --rpc-url $BASE_RPC_URL

# Get token metadata URL
cast call <NFT_ADDRESS> \
  "tokenURI(uint256)" <TOKEN_ID> \
  --rpc-url $BASE_RPC_URL
# Returns: https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json

# Get toy name for reference (stored on-chain)
cast call <NFT_ADDRESS> \
  "toyName()(string)" \
  --rpc-url $BASE_RPC_URL

# Get description for reference (stored on-chain)
cast call <NFT_ADDRESS> \
  "description()(string)" \
  --rpc-url $BASE_RPC_URL
```

## Architecture

### Two-Contract System

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  GepettoMinter  │────────▶│  GepettoToys     │
│                 │ mint()  │   (ERC-721)      │
│  0.001 ETH      │         │   Max: 10,000    │
│                 │         │   Royalty: 5%    │
└─────────────────┘         └──────────────────┘
        │                            │
        │ withdraw()                 │ royaltyInfo()
        ▼                            ▼
┌─────────────────┐         ┌──────────────────┐
│  Payout Address │         │ Royalty Receiver │
│  (ETH revenue)  │         │  (Marketplace %)  │
└─────────────────┘         └──────────────────┘
```

### User Flows

**Public Mint Flow**:
1. User uploads metadata JSON to Supabase at `{baseURI}{nextTokenId}.json`
2. User calls `GepettoMinter.mint(recipient)` with 0.001 ETH
3. Minter validates payment and recipient
4. Minter calls `GepettoToys.mint(recipient)`
5. NFT is minted to recipient, tokenURI points to Supabase metadata
6. ETH stays in minter contract (withdrawable by owner)

**Admin Batch Mint Flow**:
1. Owner uploads metadata JSON for next N tokens to Supabase at `{baseURI}{tokenId}.json`
2. Owner calls `GepettoMinter.batchMint(recipients[])`
3. Minter loops through recipients with try/catch protection
4. For each valid entry, calls `GepettoToys.mint(recipient)`
5. Returns success count and emits events
6. No ETH required (free for owner)

## Security Features

### Access Control
- ✅ Only authorized minter can mint NFTs
- ✅ Only owner can batch mint for free
- ✅ Only owner can withdraw revenue
- ✅ Only owner can update payout address
- ✅ Only owner can pause/unpause

### Safety Mechanisms
- ✅ **ReentrancyGuard**: All payable/state-changing functions protected
- ✅ **Pausable**: Emergency stop for both contracts
- ✅ **Max Supply**: Hard cap at 10,000 tokens
- ✅ **Price Validation**: Exact 0.001 ETH required (no more, no less)
- ✅ **Input Validation**: Checks for zero addresses, empty metadata
- ✅ **DoS Protection**: Batch mint uses try/catch to prevent single failure blocking batch
- ✅ **SafeMint**: Uses ERC721's `_safeMint` for recipient contract safety

### Gas Optimization
- ✅ Immutable variables where possible
- ✅ Unchecked arithmetic for counters (overflow-safe)
- ✅ Batch operations for efficient airdrops
- ✅ No unnecessary storage reads

## Events

### GepettoToys Events
```solidity
event MinterUpdated(address indexed oldMinter, address indexed newMinter);
event RoyaltyInfoUpdated(address indexed receiver, uint96 feeNumerator);
event TokenMinted(address indexed to, uint256 indexed tokenId);
event BaseURIUpdated(string oldBaseURI, string newBaseURI);
```

### GepettoMinter Events
```solidity
event ToyMinted(address indexed recipient, uint256 indexed tokenId, uint256 price);
event BatchMinted(uint256 count, uint256 successCount, uint256 failedCount);
event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);
event FundsWithdrawn(address indexed to, uint256 amount);
```

## Errors

### GepettoToys Errors
```solidity
error MaxSupplyReached();
error UnauthorizedMinter();
error InvalidMinter();
error InvalidRoyaltyFee();
error TokenDoesNotExist();
```

### GepettoMinter Errors
```solidity
error InvalidToyContract();
error InvalidPayoutAddress();
error InvalidPrice();
error InvalidRecipient();
error EmptyArray();
error MintFailed();
error WithdrawalFailed();
error NoFundsToWithdraw();
error BatchTooLarge();
```

## Gas Estimates

| Function | Gas Cost (approx) |
|----------|-------------------|
| Public mint (first time) | ~110,000 gas |
| Public mint (subsequent) | ~95,000 gas |
| Admin batch mint (per item) | ~85,000 gas |
| Withdraw | ~35,000 gas |
| Update payout address | ~25,000 gas |
| Set base URI | ~30,000 gas |

**Note**: External metadata URIs are lightweight, keeping gas costs low.

## Testing Checklist

Before production deployment:

- [ ] Deploy to testnet (Base Sepolia recommended)
- [ ] Verify default Supabase base URI is set correctly
- [ ] Upload metadata JSON files to Supabase at {baseURI}0.json, {baseURI}1.json, etc.
- [ ] Test public mint with exact 0.001 ETH
- [ ] Test public mint with wrong amount (should revert)
- [ ] Verify tokenURI returns correct Supabase URL
- [ ] Verify metadata JSON is accessible from Supabase URL
- [ ] Test minting to own address
- [ ] Test minting to different address (gifting)
- [ ] Test admin batch mint with multiple recipients
- [ ] Test max supply cap (mint up to 10,000)
- [ ] Test setBaseURI to update metadata location (if needed)
- [ ] Test pause/unpause functionality
- [ ] Test withdrawal to payout address
- [ ] Test royalty info on marketplace (OpenSea, etc.)
- [ ] Verify contract on Basescan/Etherscan
- [ ] Test metadata display on OpenSea testnet

## Deployment Configuration

### Default Values

| Parameter | Default | Override With |
|-----------|---------|---------------|
| Collection Name | `Brainrot Toys Collection` | `COLLECTION_NAME="Custom Collection"` |
| Symbol | `TOY` | `COLLECTION_SYMBOL=SYMBOL` |
| Toy Name (in metadata) | `Brainrot Toy` | `TOY_NAME="Custom Toy"` |
| Description (in metadata) | `Generated in Geppetto's Workshop` | `TOY_DESCRIPTION="Custom description"` |
| Owner | Deployer address | `TOY_OWNER=0x...` |
| Payout | `0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e` (Gepetto Multisig) | `PAYOUT_ADDRESS=0x...` |
| Royalty Receiver | Payout Address | `ROYALTY_RECEIVER=0x...` |
| Base URI | Empty | `BASE_URI="ipfs://CID/"` |
| Network | sepolia | `NETWORK=base` |

### Supported Networks

- `base` - Base Mainnet
- `base-sepolia` - Base Sepolia Testnet
- `sepolia` - Ethereum Sepolia Testnet
- `mainnet` - Ethereum Mainnet

## Upgradeability

**This system is NOT upgradeable**. Both contracts use standard OpenZeppelin implementations without proxy patterns.

- To add features, deploy new versions (V2, V3, etc.)
- Existing NFTs remain on original contract
- Can authorize multiple minters on NFT contract if needed

## Integration Examples

### Frontend Integration (TypeScript/wagmi)

```typescript
import { useContractWrite, usePrepareContractWrite, useContractRead } from 'wagmi';
import { parseEther } from 'viem';

// First, get the next token ID
const { data: nextTokenId } = useContractRead({
  address: NFT_ADDRESS,
  abi: GEPETTO_TOYS_ABI,
  functionName: 'nextTokenId',
});

// Upload metadata JSON to Supabase at {baseURI}{nextTokenId}.json FIRST
// Then prepare mint transaction
const { config } = usePrepareContractWrite({
  address: MINTER_ADDRESS,
  abi: GEPETTO_MINTER_ABI,
  functionName: 'mint',
  args: [recipientAddress],
  value: parseEther('0.001'),
});

const { write } = useContractWrite(config);

// Listen for mint events
contract.on('ToyMinted', (recipient, tokenId, price) => {
  console.log(`Toy #${tokenId} minted to ${recipient}`);
  // Metadata is at https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/{tokenId}.json
});
```

## Royalty Configuration

Default royalty is set to **5%** (500 basis points). To update:

```bash
# Set royalty to 7.5% (750 basis points)
cast send <NFT_ADDRESS> \
  "setDefaultRoyalty(address,uint96)" \
  <ROYALTY_RECEIVER> \
  750 \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

## Troubleshooting

### "InvalidPrice" Error
- **Cause**: Sent wrong amount (not 0.001 ETH)
- **Fix**: Use `--value 0.001ether` exactly

### "UnauthorizedMinter" Error
- **Cause**: Calling NFT mint() directly instead of through minter
- **Fix**: Always use GepettoMinter.mint(), not GepettoToys.mint()

### "MaxSupplyReached" Error
- **Cause**: All 10,000 toys have been minted
- **Fix**: No fix - supply is capped by design

### "BatchTooLarge" Error
- **Cause**: Trying to batch mint more than 100 at once
- **Fix**: Split into multiple batches of ≤100 each

## Files

| File | Purpose |
|------|---------|
| `contracts/Gepetto/GepettoToys.sol` | ERC-721 NFT contract |
| `contracts/Gepetto/GepettoMinter.sol` | Fixed-price minter contract |
| `ignition/modules/Gepetto/DeployGepettoToys.ts` | Deployment module |
| `scripts/deploy-gepetto-toys.sh` | Interactive deployment script |
| `Makefile` (line 982) | `deploy-gepetto-toys` target |

## Support

For issues or questions:
- Smart contract bugs: File issue on GitHub
- Deployment help: See deployment script output
- Integration help: Check frontend examples above

---

**Version**: 1.0.0
**Solidity**: 0.8.28
**OpenZeppelin**: v5.4.0
**Author**: Eden Platform
**License**: MIT
**Date**: 2025-11-21
