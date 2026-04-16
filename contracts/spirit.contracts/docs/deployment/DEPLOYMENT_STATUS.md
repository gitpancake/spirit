# Deployment Status - Eden Smart Contracts

## Current Status
✅ **FirstWorks Production Deployment - SUCCESSFUL**

Deployed to Ethereum Mainnet on October 1, 2025

## Mainnet Deployments

### FirstWorks NFT Collection (Production)

**Network:** Ethereum Mainnet (Chain ID: 1)
**Deployment Date:** October 1, 2025
**Status:** ✅ Deployed & Verified

#### Contract Addresses

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **AbrahamFirstWorks** (NFT) | `0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8` | [View on Etherscan](https://etherscan.io/address/0x9734c959A5FEC7BaD8b0b560AD94F9740B90Efd8#code) |
| **FixedPriceSale** | `0xB47708719F606E5AEb4D42E5667317640677448b` | [View on Etherscan](https://etherscan.io/address/0xB47708719F606E5AEb4D42E5667317640677448b#code) |

#### Configuration

- **Collection Name:** Abraham's First Works
- **Symbol:** AFW
- **Max Supply:** 2,500 NFTs
- **Sale Price:** 0.025 ETH
- **Artist:** Gene (0xF7425fB026f9297fCc57B14ace187215442586a2)
- **Royalties:** 5% to Gene
- **Sale Proceeds:** Eden Operations Multisig (0x2B5C11E2aaa431501f661f508e465B59fBD73e0C)

#### Sale Timeline

- **Presale Start:** Monday, October 6, 2025 at 12:00 PM EDT (1759766400 Unix)
- **Public Sale:** Wednesday, October 8, 2025 at 12:00 PM EDT (1759939200 Unix)
- **Whitelist:** Merkle root configured (presale access)

#### Deployment Details

**Deployer Address:** 0xe4951bee6fa86b809655922f610ff74c0e33416c

**Deployment Attempts:**
1. FirstWorksProduction-1759379026 (Initial attempt - nonce conflict during verification)
2. FirstWorksProduction-1759379990 (Final successful deployment - fully verified)

**Verification Method:** Hardhat Verify with Etherscan API V2

#### Key Features

- ✅ All-or-nothing minting (exact payment required)
- ✅ Batch minting support (up to 50 NFTs per transaction)
- ✅ Merkle tree whitelist for presale
- ✅ Artist-reserved minting capability
- ✅ ERC-2981 royalty standard support
- ✅ Pausable contract functionality
- ✅ Upgradeable authorized minter

## Testnet Deployments

### FirstWorks Test Deployments (Sepolia)

Multiple test deployments have been conducted on Sepolia testnet for testing and verification purposes.

See `deployment-logs/sepolia.log` for complete deployment history.

## Infrastructure Updates

### Recent Upgrades (October 2025)

- **Hardhat:** Upgraded to v2.26.3
- **@nomicfoundation/hardhat-verify:** Upgraded to v2.1.1
- **Etherscan API:** Migrated to V2 for contract verification
- **Deployment Automation:** Enhanced Makefile with deployer address display

## Deployment Logs

All deployment activities are tracked in the `deployment-logs/` directory:

- `ethereum.log` - Ethereum mainnet deployments
- `mainnet.log` - Mainnet deployment records
- `sepolia.log` - Sepolia testnet deployments

## Deployment Artifacts

Full deployment artifacts including ABIs, build info, and transaction journals are preserved in:

```
ignition/deployments/
├── FirstWorksProduction-1759379026/  # Initial attempt
└── FirstWorksProduction-1759379990/  # Final verified deployment
```

## Next Steps

### Pre-Launch Checklist

- [x] Deploy contracts to mainnet
- [x] Verify contracts on Etherscan
- [x] Configure whitelist merkle root
- [ ] Upload NFT metadata to IPFS
- [ ] Update metadata URI if needed
- [ ] Test presale access with whitelisted addresses
- [ ] Prepare marketing materials
- [ ] Monitor contract on launch day

### Post-Launch Monitoring

- [ ] Track sales during presale window
- [ ] Monitor gas usage and transaction success rates
- [ ] Verify royalty payments are functioning
- [ ] Track minting activity and remaining supply

## Technical Details

### Contract Verification

Both contracts are verified on Etherscan using the Solidity compiler version **0.8.26** with:
- Optimizer: Enabled (1000 runs)
- Via IR: True

### Security Considerations

- ✅ All tests passing (68 test suites)
- ✅ Reentrancy guards implemented
- ✅ Access control with owner-only functions
- ✅ Pausable for emergency situations
- ✅ Exact payment validation (no overpayment)
- ✅ Supply limits enforced at contract level

## Support & Resources

- **Documentation:** See [FIRSTWORKS_MAINNET_DEPLOYMENT.md](./FIRSTWORKS_MAINNET_DEPLOYMENT.md) for detailed deployment guide
- **Deployment Scripts:** `ignition/modules/FirstWorks/`
- **Test Suite:** `test/FirstWorks/`
- **Makefile Commands:** `make deploy-first-works-production`

---

**Last Updated:** October 2, 2025
**Status:** Production deployment complete and verified
