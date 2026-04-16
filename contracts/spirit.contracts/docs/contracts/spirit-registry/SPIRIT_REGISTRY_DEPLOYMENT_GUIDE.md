# Spirit Registry System - Deployment Guide

## Quick Start

This guide covers deploying the ERC-8004 compliant Spirit Registry System for the Spirit Protocol.

## System Overview

The Spirit Registry System consists of three interconnected contracts:

1. **SpiritIdentityRegistry** - Agent NFTs with EOA linkage
2. **SpiritReputationRegistry** - Feedback and reputation tracking
3. **SpiritValidationRegistry** - Validation requests/responses

## Prerequisites

### Environment Setup

1. **Set Environment Variables**

```bash
# Required: Private key for deployment
PRIVATE_KEY=your_private_key_here

# Required: RPC provider API key
RPC_API_KEY=your_rpc_api_key

# Required: Block explorer API keys for verification
BASESCAN_API_KEY=your_basescan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Spirit Council multisig address (defaults to deployer)
SPIRIT_COUNCIL_MULTISIG=0x...
```

2. **Install Dependencies**

```bash
npm ci
```

3. **Compile Contracts**

```bash
npx hardhat compile
```

## Deployment Options

### Option 1: Using Hardhat Ignition (Recommended)

#### Deploy to Base Sepolia (Testnet)

```bash
# Deploy with verification
npx hardhat ignition deploy ignition/modules/Spirit/DeploySpiritRegistrySystem.ts \
  --deployment-id SpiritRegistry-$(date +%s) \
  --network base-sepolia \
  --verify
```

#### Deploy to Base Mainnet (Production)

```bash
# Set Spirit Council multisig address
export SPIRIT_COUNCIL_MULTISIG=0x...

# Deploy with verification
npx hardhat ignition deploy ignition/modules/Spirit/DeploySpiritRegistrySystem.ts \
  --deployment-id SpiritRegistry-$(date +%s) \
  --network base \
  --verify
```

### Option 2: Using Makefile

Add these targets to the Makefile:

```makefile
deploy-spirit-registry: check-env
	@echo "🎭 Deploying Spirit Registry System to $(NETWORK)..."
	@echo "📋 ERC-8004 compliant agent identity, reputation, and validation"
	@echo "👤 Owner: $(if $(SPIRIT_COUNCIL_MULTISIG),$(SPIRIT_COUNCIL_MULTISIG),Deployer wallet)"
	$(if $(SPIRIT_COUNCIL_MULTISIG),SPIRIT_COUNCIL_MULTISIG=$(SPIRIT_COUNCIL_MULTISIG)) \
	npx hardhat ignition deploy ignition/modules/Spirit/DeploySpiritRegistrySystem.ts \
	--deployment-id SpiritRegistry-$(shell date +%s) --network $(NETWORK) --verify || true
	@echo "✅ Spirit Registry System deployed successfully!"
	@echo "📋 Identity Registry: Check deployment logs for address"
	@echo "📋 Reputation Registry: Check deployment logs for address"
	@echo "📋 Validation Registry: Check deployment logs for address"
	$(call log-deployment,SpiritRegistry)
```

Then deploy:

```bash
# Deploy to Base Sepolia
make deploy-spirit-registry NETWORK=base-sepolia

# Deploy to Base with custom multisig
make deploy-spirit-registry NETWORK=base SPIRIT_COUNCIL_MULTISIG=0x...
```

## Post-Deployment Setup

### 1. Verify Deployment

Check that all three contracts deployed successfully:

```bash
# Check deployment artifacts
ls ignition/deployments/SpiritRegistry-*/deployed_addresses.json

# View deployed addresses
cat ignition/deployments/SpiritRegistry-*/deployed_addresses.json
```

### 2. Verify Contract Addresses

Each contract should have a unique address:

- `SpiritRegistrySystem#SpiritIdentityRegistry`: 0x...
- `SpiritRegistrySystem#SpiritReputationRegistry`: 0x...
- `SpiritRegistrySystem#SpiritValidationRegistry`: 0x...

### 3. Verify on Block Explorer

Navigate to the block explorer and verify each contract is verified:

- Base Sepolia: https://sepolia.basescan.org/address/0x...
- Base Mainnet: https://basescan.org/address/0x...

### 4. Test Basic Functionality

#### Register First Agent (Owner Only)

```solidity
// Using cast (Foundry) - replace addresses with your values
cast send <IDENTITY_REGISTRY_ADDRESS> \
  "registerAgent(address,address,string)" \
  <AGENT_EOA> \
  <ARTIST_ADDRESS> \
  "ipfs://QmExample..." \
  --rpc-url <RPC_URL> \
  --private-key <PRIVATE_KEY>
```

#### Give Feedback (Anyone)

```solidity
cast send <REPUTATION_REGISTRY_ADDRESS> \
  "giveFeedback(uint256,uint8,bytes32,bytes32,string,bytes32,bytes)" \
  1 \
  85 \
  "0x7175616c69747900000000000000000000000000000000000000000000000000" \
  "0x636f6c6c61626f726174696f6e00000000000000000000000000000000000000" \
  "ipfs://QmFeedback..." \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  "0x" \
  --rpc-url <RPC_URL> \
  --private-key <PRIVATE_KEY>
```

## Network Configuration

### Base Sepolia (Testnet)

- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Bridge: https://bridge.base.org/deposit

### Base Mainnet (Production)

- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org
- Bridge: https://bridge.base.org/deposit

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│     Deploy SpiritIdentityRegistry       │
│     (Owner: Spirit Council)             │
└────────────────┬────────────────────────┘
                 │
                 │ (pass address to)
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌──────────────────┐  ┌─────────────────────┐
│ Reputation       │  │ Validation          │
│ Registry         │  │ Registry            │
│ (links to ID)    │  │ (links to ID)       │
└──────────────────┘  └─────────────────────┘
```

## Governance Configuration

### Phase 1 — Council Governance (Launch)

**Owner Address**: Spirit Council Multisig

Responsibilities:
- Register new agents
- Graduate agents to autonomy
- Update agent metadata
- Emergency controls

### Phase 2 — Hybrid Governance (6-12 months)

**Owner Address**: Still Spirit Council
**Input**: SPIRIT token holder signaling via Snapshot

### Phase 3 — Tokenholder Governance (12+ months)

**Owner Address**: Governance contract (DAO)
**Control**: SPIRIT token holders with quadratic voting

## Security Checklist

Before production deployment, verify:

- [ ] Spirit Council multisig configured and tested
- [ ] All contracts compiled with optimizer enabled
- [ ] Deployment script tested on testnet
- [ ] Contract addresses verified on block explorer
- [ ] Owner address is correct multisig (not deployer)
- [ ] Test agent registration works
- [ ] Test feedback submission works
- [ ] Test validation request works
- [ ] Gas limits tested with realistic data
- [ ] Emergency pause mechanisms tested (if applicable)

## Cost Estimates

Approximate deployment costs (Base network):

| Contract | Gas Estimate | Cost @ 0.5 Gwei | Cost @ 1 Gwei |
|----------|-------------|----------------|---------------|
| SpiritIdentityRegistry | ~3,500,000 | ~0.00175 ETH | ~0.0035 ETH |
| SpiritReputationRegistry | ~2,800,000 | ~0.0014 ETH | ~0.0028 ETH |
| SpiritValidationRegistry | ~2,600,000 | ~0.0013 ETH | ~0.0026 ETH |
| **Total** | **~8,900,000** | **~0.00445 ETH** | **~0.0089 ETH** |

Base typically has very low gas fees (< 0.1 Gwei), so actual costs will be minimal.

## Monitoring and Maintenance

### Event Monitoring

Set up event indexing for:

- `AgentRegistered` - New agents joining
- `FeedbackGiven` - Community engagement
- `ValidationRequested` - Validation activity
- `AgentGraduated` - Agents achieving autonomy

### Recommended Tools

- **The Graph**: Subgraph for event indexing
- **Tenderly**: Real-time monitoring and alerting
- **Dune Analytics**: Dashboard for registry statistics
- **Etherscan**: Contract interaction and verification

## Troubleshooting

### Common Issues

**Issue**: Deployment fails with "insufficient funds"
- **Solution**: Ensure deployer wallet has enough ETH for gas

**Issue**: Verification fails
- **Solution**: Check BASESCAN_API_KEY is set correctly, wait 30 seconds after deployment

**Issue**: Constructor argument mismatch
- **Solution**: Verify SPIRIT_COUNCIL_MULTISIG is a valid address format

**Issue**: Deployment ID conflict
- **Solution**: Use unique timestamp-based ID: `--deployment-id SpiritRegistry-$(date +%s)`

## Upgrade Path

The current contracts are **non-upgradeable** by design for security and trustlessness.

For future upgrades:
1. Deploy new contracts with improvements
2. Migrate data via governance proposal
3. Update frontend to point to new contracts
4. Maintain old contracts as historical record

## Support

For deployment issues:
- GitHub Issues: [repository]/issues
- Discord: Spirit Protocol community
- Email: henry@eden.art

## Next Steps

After successful deployment:

1. **Frontend Integration**: Update dApp with new contract addresses
2. **Subgraph Deployment**: Deploy The Graph subgraph for indexing
3. **Documentation**: Update API documentation with contract ABIs
4. **Testing**: Run comprehensive integration tests
5. **Monitoring**: Set up Tenderly alerts
6. **Announcement**: Notify community of new registry system

---

**Spirit Protocol** - Decentralized infrastructure for synthetic artists
