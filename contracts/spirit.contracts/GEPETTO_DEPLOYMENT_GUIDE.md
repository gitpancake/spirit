# Gepetto Toys - Quick Deployment Guide

Simple reference for deploying the Gepetto Toys NFT system.

## What is Gepetto Toys?

A fixed-price NFT minting system for collectible toys:
- 🎨 **ERC-721 NFT** with external metadata on Supabase
- 💰 **0.001 ETH** fixed price per mint
- 📦 **10,000 max supply** starting at tokenId 0
- 💎 **5% royalties** (EIP-2981 compliant)
- 🎁 **Admin batch mint** for free airdrops
- 🖼️ **Upload-first workflow** - metadata JSON files uploaded to Supabase before minting

## Prerequisites

- ✅ Network RPC URL (Base, Base Sepolia, etc.)
- ✅ Private key with ETH for deployment
- ✅ Etherscan/Basescan API key (for verification)

## Quick Deployment

### Base Sepolia (Testnet - Recommended First)

```bash
make deploy-gepetto-toys NETWORK=base-sepolia
```

### Base Mainnet (Production)

```bash
make deploy-gepetto-toys NETWORK=base
```

### With Custom Configuration

```bash
make deploy-gepetto-toys \
  TOY_OWNER=0xYourOwnerAddress \
  PAYOUT_ADDRESS=0xYourPayoutAddress \
  ROYALTY_RECEIVER=0xYourRoyaltyAddress \
  BASE_URI="ipfs://YOUR_CID/" \
  NETWORK=base
```

**Note**: BASE_URI can be set during deployment or updated later via `setBaseURI()`. If left empty, you must set it before minting.

## What Happens During Deployment

1. **Deploys GepettoToys NFT**:
   - ERC-721 contract
   - Max supply: 10,000
   - Starts at tokenId 0
   - 5% default royalty

2. **Deploys GepettoMinter**:
   - Fixed price: 0.001 ETH
   - Linked to NFT contract
   - Owner can batch mint for free

3. **Auto-configuration**:
   - Sets minter as authorized on NFT
   - Verifies on Basescan (if API key configured)
   - Logs deployment details

## Post-Deployment Testing

### 1. Set Base URI (if not set during deployment)

```bash
cast send <NFT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://YOUR_CID/" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### 2. Upload Metadata to Supabase

Upload metadata JSON files to Supabase **before** minting.

**Default Base URI**: `https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/`

Upload files:
- `https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json` (for tokenId 0)
- `https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/1.json` (for tokenId 1)
- etc.

**Metadata JSON format**:
```json
{
  "name": "Brainrot Toy #0",
  "description": "Generated in Geppetto's Workshop",
  "image": "https://your-image-host.com/0.png"
}
```

You can reference the toy name and description stored in the contract via `toyName()` and `description()` functions.

### 3. Test Public Mint (0.001 ETH)

```bash
cast send <MINTER_ADDRESS> \
  "mint(address)" \
  <RECIPIENT_ADDRESS> \
  --value 0.001ether \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 4. Test Admin Batch Mint (Free)

```bash
cast send <MINTER_ADDRESS> \
  "batchMint(address[])" \
  "[0xAddr1,0xAddr2,0xAddr3]" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### 5. Check Remaining Supply

```bash
cast call <NFT_ADDRESS> \
  "remainingSupply()(uint256)" \
  --rpc-url $BASE_RPC_URL
```

### 6. Check Token Metadata

```bash
cast call <NFT_ADDRESS> \
  "tokenURI(uint256)" <TOKEN_ID> \
  --rpc-url $BASE_RPC_URL
```

**Note**: Returns the Supabase URL for the token's metadata JSON:
```
https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json
```

### 7. Withdraw Collected ETH

```bash
cast send <MINTER_ADDRESS> \
  "withdraw()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
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

# Optional (custom configuration)
COLLECTION_NAME="Custom Collection Name"  # Default: "Brainrot Toys Collection"
COLLECTION_SYMBOL=SYMBOL                  # Default: "TOY"
TOY_NAME="Custom Toy"                     # Default: "Brainrot Toy" (used in metadata)
TOY_DESCRIPTION="Custom description"      # Default: "Generated in Geppetto's Workshop"
TOY_OWNER=0xOwnerAddress                  # Default: deployer
PAYOUT_ADDRESS=0xPayoutAddress            # Default: 0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e (Gepetto Multisig)
ROYALTY_RECEIVER=0xRoyaltyAddress         # Default: payout address
BASE_URI="ipfs://YOUR_CID/"               # Default: empty (set later via setBaseURI)
```

## Configuration Defaults

| Parameter | Default | Override With |
|-----------|---------|---------------|
| Collection Name | `Brainrot Toys Collection` | `COLLECTION_NAME="Custom Collection"` |
| Symbol | `TOY` | `COLLECTION_SYMBOL=SYMBOL` |
| Toy Name (in metadata) | `Brainrot Toy` | `TOY_NAME="Custom Toy"` |
| Description (in metadata) | `Generated in Geppetto's Workshop` | `TOY_DESCRIPTION="Custom description"` |
| Owner | Deployer address | `TOY_OWNER=0x...` |
| Payout | `0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e` (Gepetto Multisig) | `PAYOUT_ADDRESS=0x...` |
| Royalty Receiver | Payout address | `ROYALTY_RECEIVER=0x...` |
| Base URI | Empty | `BASE_URI="ipfs://CID/"` |
| Network | `sepolia` | `NETWORK=base` |

## Common Use Cases

### Use Case 1: Public Sale (0.001 ETH per toy)

Users mint by calling `GepettoMinter.mint()` with 0.001 ETH:
- Anyone can mint
- No whitelist
- No max per wallet
- Metadata served from Supabase storage
- Metadata JSON at `{baseURI}{tokenId}.json` (uploaded before minting)
- ETH goes to minter contract

### Use Case 2: Airdrop Campaign

Owner can batch mint for free:
- No ETH required
- Max 100 per batch
- DoS protection (try/catch)
- Useful for promotions, giveaways, team allocations

### Use Case 3: Gift Minting

Anyone can mint to a different address:
- Pay 0.001 ETH
- Specify recipient address
- Great for gifts or onboarding

## Integration with Frontend

### wagmi/viem Example

```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';

const MINTER_ADDRESS = '0xYourMinterAddress';

// Upload metadata JSON to Supabase at {baseURI}{nextTokenId}.json FIRST
// Then prepare mint transaction
const { config } = usePrepareContractWrite({
  address: MINTER_ADDRESS,
  abi: MINTER_ABI,
  functionName: 'mint',
  args: [userAddress],
  value: parseEther('0.001'),
});

// Execute mint
const { write, isLoading } = useContractWrite(config);

// Listen for events
contract.on('ToyMinted', (recipient, tokenId, price) => {
  console.log(`Toy #${tokenId} minted!`);
  // Metadata is at {baseURI}{tokenId}.json on Supabase
});
```

## Troubleshooting

### "InvalidPrice" Error
**Problem**: Sent wrong ETH amount.
**Solution**: Must send exactly 0.001 ETH: `--value 0.001ether`

### "MaxSupplyReached" Error
**Problem**: All 10,000 toys have been minted.
**Solution**: No fix - this is the designed max supply.

### "UnauthorizedMinter" Error
**Problem**: Trying to call NFT contract directly.
**Solution**: Always use GepettoMinter contract, not GepettoToys.

### Verification Failed
**Problem**: Contract deployed but Basescan verification failed.
**Solution**: Manually verify:
```bash
npx hardhat verify --network base <NFT_ADDRESS> \
  <OWNER> <MINTER> <ROYALTY_RECEIVER>

npx hardhat verify --network base <MINTER_ADDRESS> \
  <NFT_ADDRESS> <OWNER> <PAYOUT_ADDRESS>
```

### Wrong Metadata Showing
**Problem**: OpenSea/marketplace shows wrong metadata.
**Solution**:
1. Check tokenURI is correct: `cast call <NFT_ADDRESS> "tokenURI(uint256)" <ID>`
2. Refresh metadata on OpenSea (can take a few minutes)
3. Ensure IPFS URI is accessible

## Files Reference

| File | Purpose |
|------|---------|
| `contracts/Gepetto/GepettoToys.sol` | ERC-721 NFT contract |
| `contracts/Gepetto/GepettoMinter.sol` | Fixed-price minter |
| `ignition/modules/Gepetto/DeployGepettoToys.ts` | Deployment module |
| `scripts/deploy-gepetto-toys.sh` | Deployment script |
| `Makefile` (line 982) | `deploy-gepetto-toys` target |
| `contracts/Gepetto/README.md` | Full documentation |

## Key Features Summary

| Feature | GepettoToys (NFT) | GepettoMinter |
|---------|-------------------|---------------|
| **Standard** | ERC-721 | Fixed Price |
| **Max Supply** | 10,000 | - |
| **Price** | - | 0.001 ETH |
| **Royalty** | 5% (EIP-2981) | - |
| **Batch Mint** | - | Yes (free, owner only) |
| **Pausable** | Yes | Yes |
| **Metadata** | External (Supabase) | Points to {baseURI}{tokenId}.json |

## Security Notes

✅ **ReentrancyGuard** on all payable functions
✅ **Pausable** for emergency stops
✅ **Max supply cap** at 10,000
✅ **Exact price validation** (must be 0.001 ETH)
✅ **DoS protection** in batch operations
✅ **SafeMint** for contract recipients
✅ **Access control** on admin functions

## Support & Resources

- **Full Documentation**: `contracts/Gepetto/README.md`
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Mainnet Explorer**: https://basescan.org/
- **OpenSea Testnet**: https://testnets.opensea.io/

## Example: Complete Testnet Deployment

```bash
# 1. Deploy to Base Sepolia (uses Supabase baseURI by default)
make deploy-gepetto-toys NETWORK=base-sepolia

# 2. Upload metadata JSON files to Supabase at:
# https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json
# https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/1.json
# etc.

# 3. Test public mint (copy Minter address from output)
cast send 0xYourMinterAddress \
  "mint(address)" \
  $YOUR_ADDRESS \
  --value 0.001ether \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 4. Verify token minted (copy NFT address from output)
cast call 0xYourNFTAddress \
  "tokenURI(uint256)" 0 \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Should return: https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/0.json

# 5. Check remaining supply
cast call 0xYourNFTAddress \
  "remainingSupply()(uint256)" \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Should return: 9999 (10,000 - 1 minted)
```

## Next Steps After Deployment

1. ✅ Test all functions on testnet
2. ✅ Upload metadata JSON files to Supabase storage
3. ✅ Test on OpenSea testnet
4. ✅ Verify royalty configuration
5. ✅ Deploy to mainnet
6. ✅ Update frontend with contract addresses
7. ✅ Monitor mint events
8. ✅ Regularly withdraw ETH to payout address

---

**Ready to deploy?** Just run:

```bash
make deploy-gepetto-toys NETWORK=base-sepolia
```

Good luck! 🎨
