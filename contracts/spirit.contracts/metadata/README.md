# Token Metadata

This directory contains metadata files for the Eden token ecosystem.

## 📁 Files

- `eden-token-metadata.json` - Complete metadata for the Eden token

## 🚀 Upload to IPFS

### Step 1: Prepare the Metadata

1. **Update the metadata file** with your actual information:
   - Replace `QmYourImageHashHere` with your actual token logo IPFS hash
   - Update social media links
   - Update website URLs
   - Add actual contract addresses after deployment

### Step 2: Upload to IPFS

#### Option A: Using Pinata

```bash
# 1. Go to https://app.pinata.cloud/
# 2. Upload the eden-token-metadata.json file
# 3. Copy the IPFS hash (Qm...)
```

#### Option B: Using NFT.Storage

```bash
# 1. Go to https://nft.storage/
# 2. Upload the eden-token-metadata.json file
# 3. Copy the IPFS hash (Qm...)
```

#### Option C: Using IPFS CLI

```bash
# 1. Install IPFS CLI
# 2. Run: ipfs add eden-token-metadata.json
# 3. Copy the IPFS hash (Qm...)
```

### Step 3: Update Deployment

1. **Copy the IPFS hash** from the upload
2. **Update the deployment module**:
   ```typescript
   // In ignition/modules/Abraham/DeployAbraham.ts
   const metadataURI = "ipfs://QmYourActualHashHere";
   ```

## 📋 Metadata Structure

The metadata includes:

- **Basic Info**: Name, symbol, description
- **Visual**: Logo image URL
- **Links**: Website, social media
- **Tokenomics**: Supply, distribution details
- **Features**: Key functionality
- **Contracts**: Addresses (filled after deployment)
- **Revenue Sources**: How the token generates value
- **Burning Mechanics**: How deflation works
- **Claiming**: How to claim revenue
- **Verification**: Audit status, license

## 🔗 IPFS Gateway

After uploading, your metadata will be available at:

- `ipfs://QmYourHashHere`
- `https://ipfs.io/ipfs/QmYourHashHere`
- `https://gateway.pinata.cloud/ipfs/QmYourHashHere`

## 🎯 Usage

Once deployed, the metadata URI will be:

- **Displayed in wallets** (MetaMask, etc.)
- **Shown on DEXs** (Uniswap, etc.)
- **Used by token explorers** for information
- **Referenced by community tools**

## 📝 Customization

Feel free to customize the metadata for your specific project:

- Update branding and colors
- Add project-specific features
- Include additional social links
- Modify tokenomics details
- Add team information

## 🔄 Updates

After deployment, you can update the metadata URI using:

```solidity
// Call on the token contract
setMetadataURI("ipfs://QmNewHashHere");
```
