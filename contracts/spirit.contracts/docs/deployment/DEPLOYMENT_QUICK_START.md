# 🚀 ThirteenYearAuction Quick Deployment Guide

## ✅ Yes, you can run `make deploy-auction`!

The Makefile has been updated to deploy the new ThirteenYearAuction contract.

## 📋 Available Commands

### 1. Standard Ignition Deployment
```bash
make deploy-auction NETWORK=base-sepolia
```
- Uses environment variables for configuration
- Deploys using Hardhat Ignition
- Automatic contract verification
- Deployment logging

### 2. Interactive Deployment (Recommended)
```bash
make deploy-auction-interactive NETWORK=base-sepolia
```
- Step-by-step prompts for all parameters
- Real-time configuration validation  
- Deployment summary and verification
- User-friendly interface

### 3. Contract Management
```bash
make manage-auction NETWORK=base-sepolia
```
- Interactive menu-driven interface
- View auction status, place bids, settle auctions
- Set token URIs, start genesis auction
- Withdraw payouts, recover failed refunds

## 🔧 Environment Variables (for non-interactive deployment)

Set these before running `make deploy-auction`:

```bash
export AUCTION_NAME="Your Auction Name"
export AUCTION_SYMBOL="YAN"
export AUCTION_OWNER="0x..."
export AUCTION_PAYOUT_ADDRESS="0x..."
export MAX_AUCTIONS="4745"
export AUCTION_DURATION="86400"  # 1440 minutes = 86400 seconds
export REST_DURATION="86400"     # 1440 minutes = 86400 seconds  
export REST_INTERVAL="30"
```

## 🎯 Quick Examples

### Daily Auctions for 13 Years
```bash
# Interactive (recommended)
make deploy-auction-interactive NETWORK=base-sepolia

# Or with environment variables
export AUCTION_NAME="Eden 13-Year Daily Auction"
export AUCTION_SYMBOL="E13DA"
export MAX_AUCTIONS="4745"
export AUCTION_DURATION="86400"  # 1440 minutes (24 hours)
export REST_DURATION="86400"     # 1440 minutes (24 hours)
export REST_INTERVAL="30"
make deploy-auction NETWORK=base-sepolia
```

### Testing Configuration
```bash
# Interactive (recommended)
make deploy-auction-interactive NETWORK=base-sepolia

# Or with environment variables
export AUCTION_NAME="Test Auction"
export AUCTION_SYMBOL="TEST"
export MAX_AUCTIONS="10"
export AUCTION_DURATION="3600"   # 60 minutes (1 hour)
export REST_DURATION="1800"      # 30 minutes
export REST_INTERVAL="3"
make deploy-auction NETWORK=base-sepolia
```

### Manage Deployed Contract
```bash
make manage-auction NETWORK=base-sepolia
```

## 📚 Post-Deployment Steps

1. **Set Token URIs**: Use management interface or call `setTokenURI()` directly
2. **Start Genesis Auction**: Call `startGenesisAuction()` as contract owner
3. **Monitor Activity**: Watch for bidding, settlement, and payout events

## 🌐 Network Support

All networks configured in `hardhat.config.ts`:
- `base-sepolia` (default)
- `sepolia`
- `mainnet`
- `localhost`
- `hardhat`

## 📄 Deployment Logs

Check deployment status:
```bash
make deploy-status NETWORK=base-sepolia
```

Deployment logs are saved to `./deployment-logs/`

## 🆘 Help & Documentation

```bash
make help                    # Full help menu
make list-deployments        # All deployment targets
```

For detailed documentation, see:
- `scripts/THIRTEEN_YEAR_AUCTION_README.md`
- `ignition/modules/NFT/DeployThirteenYearAuction.ts`

---

**🎉 The Makefile has been fully updated for ThirteenYearAuction deployment!**