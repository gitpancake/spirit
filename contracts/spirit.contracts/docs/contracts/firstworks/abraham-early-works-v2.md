# Abraham Early Works V2 - Deployment Guide

## 🎯 Quick Deployment

### Option 1: Default Configuration (2,500 NFTs, 0.005 ETH each)
```bash
npm run deploy:abraham-v2
```

### Option 2: Custom Configuration  
```bash
ABRAHAM_MAX_SUPPLY=2500 \
ABRAHAM_NFT_PRICE=0.005 \
ABRAHAM_BASE_URI="https://gateway.pinata.cloud/ipfs/QmYourActualPinataHash" \
npm run deploy:abraham-v2
```

## 📋 Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `ABRAHAM_MAX_SUPPLY` | `2500` | Maximum NFTs that can ever be minted |
| `ABRAHAM_NFT_PRICE` | `0.005` | Price per NFT in ETH |
| `ABRAHAM_BASE_URI` | `(placeholder)` | **REQUIRED**: Your Pinata IPFS gateway URL |
| `ABRAHAM_OWNER` | `deployer` | Contract owner address |
| `ABRAHAM_PAYOUT` | `owner` | Address to receive sale proceeds |

## 🔗 Pinata Configuration

### Your Pinata setup should look like:
```
https://gateway.pinata.cloud/ipfs/QmYourHash/
├── 0/
│   └── metadata.json
├── 1/
│   └── metadata.json  
├── 2/
│   └── metadata.json
└── ...
```

### Example metadata.json:
```json
{
  "name": "Abraham Early Works #1",
  "description": "Early work from Abraham's creative practice",
  "image": "https://gateway.pinata.cloud/ipfs/QmImageHash/1.jpg",
  "attributes": [
    {
      "trait_type": "Collection",
      "value": "Early Works"
    },
    {
      "trait_type": "Creation Date", 
      "value": "2024-12-16"
    }
  ]
}
```

## 🚀 Deployment Steps

### 1. Prepare Your Environment
```bash
# Make sure you have Sepolia ETH
# Check your balance
cast balance $YOUR_ADDRESS --rpc-url $SEPOLIA_RPC_URL
```

### 2. Set Your Pinata Base URI
```bash
export ABRAHAM_BASE_URI="https://gateway.pinata.cloud/ipfs/QmYourActualHash"
```

### 3. Optional: Customize Settings
```bash
export ABRAHAM_MAX_SUPPLY=2500        # How many NFTs total
export ABRAHAM_NFT_PRICE=0.005        # Price in ETH
export ABRAHAM_PAYOUT=0xYourAddress   # Where sales money goes
```

### 4. Deploy!
```bash
npm run deploy:abraham-v2
```

## 📊 What Gets Deployed

### 1. **AbrahamEarlyWorks** (NFT Contract)
- **Purpose**: Stores the actual NFTs
- **Features**: Limited supply, metadata URIs, authorized minting
- **Owner**: Can update metadata URI, change authorized minter

### 2. **FixedPriceSale** (Sale Contract)  
- **Purpose**: Handles the purchasing/minting flow
- **Features**: Fixed price, batch minting, revenue collection
- **Owner**: Can change price, pause sales, withdraw funds

### 3. **Connection**: Sale contract is authorized to mint NFTs

## 🧪 Testing After Deployment

### Check Contract Status
```bash
# Replace with your actual deployed addresses
NFT_CONTRACT=0xYourNFTAddress
SALE_CONTRACT=0xYourSaleAddress

# Check max supply
cast call $NFT_CONTRACT "maxSupply()(uint256)" --rpc-url $SEPOLIA_RPC_URL

# Check current price  
cast call $SALE_CONTRACT "price()(uint256)" --rpc-url $SEPOLIA_RPC_URL

# Check if sale is active
cast call $SALE_CONTRACT "saleActive()(bool)" --rpc-url $SEPOLIA_RPC_URL
```

### Test Mint
```bash
# Mint one NFT (replace 0.005 with your actual price)
cast send $SALE_CONTRACT "mint()" \
  --value 0.005ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Batch mint (buy 10 NFTs at once)  
cast send $SALE_CONTRACT "batchMint(uint256)" 10 \
  --value 0.05ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Check Your NFT
```bash
# Check your balance
cast call $NFT_CONTRACT "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Get metadata URI for token #0
cast call $NFT_CONTRACT "tokenURI(uint256)(string)" 0 --rpc-url $SEPOLIA_RPC_URL
```

## ⚠️ Common Issues

### 1. "QmYourHashHere" in Base URI
- **Problem**: You're using the placeholder Base URI
- **Fix**: Set `ABRAHAM_BASE_URI` to your actual Pinata IPFS URL

### 2. "insufficient funds for gas * price + value"
- **Problem**: Not enough Sepolia ETH
- **Fix**: Get more from https://sepoliafaucet.com

### 3. Metadata not loading
- **Problem**: Pinata folder structure doesn't match contract expectations
- **Fix**: Ensure your IPFS has folders `0/`, `1/`, etc. with `metadata.json` files

### 4. "Mint failed"
- **Problem**: Could be max supply reached, wrong price, or sale inactive
- **Fix**: Check sale status and remaining supply

## 🔐 Security Notes

- **Owner Controls**: Can pause sales, change prices, withdraw funds
- **Immutable Supply**: Once deployed, max supply cannot be exceeded  
- **Revenue Security**: Funds held in contract until withdrawn by owner
- **Emergency Controls**: Owner can pause sales if needed

## 📱 Frontend Integration

After deployment, you can integrate with your frontend:

```typescript
const NFT_ADDRESS = "0xYourDeployedNFTAddress";
const SALE_ADDRESS = "0xYourDeployedSaleAddress";

// Check price
const price = await saleContract.price();

// Mint NFT
const tx = await saleContract.mint({ value: price });
```

## 🎉 Success Indicators

After successful deployment:
✅ Two contract addresses on Sepolia Etherscan  
✅ Sale contract is authorized minter for NFT contract  
✅ Test mint works and returns token with metadata  
✅ Metadata loads correctly from your Pinata IPFS  
✅ Owner can withdraw sale proceeds