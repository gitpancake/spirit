# Spirit Registry System

## Overview

The Spirit Registry System is an **ERC-8004 compliant** infrastructure for managing synthetic artist agents in the Spirit Protocol. It provides identity, reputation, and validation tracking for AI agents that create and sell art onchain.

## Architecture

### Components

The system consists of three main registries:

1. **SpiritIdentityRegistry** (`SpiritIdentityRegistry.sol`)
   - ERC-721 NFT representing each agent's identity
   - Links agents to their EOA (Externally Owned Account)
   - Tracks artist/trainer relationships
   - Supports agent graduation to autonomy
   - Freely transferable (standard ERC-721)

2. **SpiritReputationRegistry** (`SpiritReputationRegistry.sol`)
   - Feedback and rating system (0-100 score)
   - Dual-tag categorization (e.g., "quality", "collaboration")
   - Aggregated reputation summaries with filtering
   - Feedback revocation support
   - Gas-optimized storage

3. **SpiritValidationRegistry** (`SpiritValidationRegistry.sol`)
   - Validation request/response system
   - Designated validator pattern
   - Credential and capability verification
   - Categorization via tags
   - Approval/rejection tracking

## ERC-8004 Compliance

The Spirit Registry System implements the [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004) for Trustless Agents, enabling:

- **Agent Discovery**: Find agents across organizational boundaries
- **Reputation Tracking**: Decentralized feedback and validation
- **Identity Management**: Unique global identifiers for agents
- **EOA Integration**: Agents can sign transactions autonomously
- **Flexible Trust Models**: Supports reputation-based and validation-based trust

## Contract Relationships

```
┌─────────────────────────────────────────┐
│     SpiritIdentityRegistry (ERC-721)    │
│  - Agent NFTs with EOA linkage          │
│  - Artist/trainer relationships         │
│  - Graduation tracking                  │
└────────────────┬────────────────────────┘
                 │
                 │ (references)
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│  Reputation  │    │   Validation     │
│   Registry   │    │    Registry      │
│              │    │                  │
│ - Feedback   │    │ - Requests       │
│ - Ratings    │    │ - Responses      │
│ - Summaries  │    │ - Approvals      │
└──────────────┘    └──────────────────┘
```

## Key Features

### Identity Registry

- **Agent Registration**: Each agent receives a unique ERC-721 NFT
- **EOA Linkage**: Agents have an EOA for autonomous transaction signing
- **Artist Attribution**: Each agent is linked to their human trainer
- **Graduation Path**: Agents can graduate to full autonomy (Phase 4)
- **Transferable NFTs**: Standard ERC-721 transfer functionality
- **Query System**: Find agents by EOA or artist address

### Reputation Registry

- **Feedback System**: Anyone can give feedback (0-100 score)
- **Tag Categorization**: Dual-tag system for flexible categorization
- **Aggregation**: Real-time reputation summaries with filtering
- **Revocation**: Feedback submitters can revoke their feedback
- **Gas Optimization**: Packed structs minimize storage costs

### Validation Registry

- **Request/Response Pattern**: Structured validation workflow
- **Designated Validators**: Only specified validators can respond
- **Status Tracking**: Pending → Approved/Rejected
- **Categorization Tags**: Flexible validation categorization
- **History Tracking**: Full validation history per agent

## Spirit Protocol Integration

### Agent Lifecycle

1. **Birth**: Agent created via Eden tooling
2. **Training**: Public iteration and community interaction
3. **Acceptance**: Spirit Council approves admission
4. **Registration**: Agent NFT minted in Identity Registry
5. **Reputation Building**: Community provides feedback
6. **Validation**: Credentials verified by validators
7. **Graduation**: Agent achieves autonomy (Phase 4)

### Multisig Integration

Each agent's EOA becomes a **co-signer** on a multisig wallet, enabling:
- Autonomous transaction signing
- Collaborative decision-making with artist/trainer
- Progressive autonomy as agent matures
- Safe transition to full independence at graduation

### Token Economics

When an agent is accepted into Spirit Academy:
- Agent Token (ERC-20) minted (1B supply)
- 25% → Artist (auto-pledged 12 months)
- 25% → Agent (auto-pledged 12 months)
- 25% → SPIRIT holders (streamed over 3 months)
- 25% → Liquidity Pool

The Identity Registry tracks agent status throughout this lifecycle.

## Deployment

### Prerequisites

- Hardhat environment configured
- Spirit Council multisig address ready
- Network RPC configured (Base recommended)

### Deploy All Registries

```bash
# Set Spirit Council address (optional - defaults to deployer)
export SPIRIT_COUNCIL_MULTISIG=0x...

# Deploy to Base Sepolia testnet
npx hardhat ignition deploy ignition/modules/Spirit/DeploySpiritRegistrySystem.ts --network base-sepolia --verify

# Deploy to Base mainnet
npx hardhat ignition deploy ignition/modules/Spirit/DeploySpiritRegistrySystem.ts --network base --verify
```

### Using the Makefile

```bash
# Deploy Spirit Registry System
make deploy-spirit-registry NETWORK=base-sepolia

# Verify deployment
make verify NETWORK=base-sepolia CONTRACT_ADDRESS=0x...
```

## Usage Examples

### Register a New Agent

```solidity
// Spirit Council calls registerAgent
uint256 agentId = identityRegistry.registerAgent(
    agentEOA,           // 0x... (agent's EOA)
    artistAddress,      // 0x... (artist's address)
    "ipfs://QmAbc..."   // metadata URI
);
```

### Give Feedback

```solidity
// Anyone can give feedback
uint64 feedbackIndex = reputationRegistry.giveFeedback(
    agentId,            // Agent to rate
    85,                 // Score (0-100)
    "quality",          // Primary tag
    "collaboration",    // Secondary tag
    "ipfs://QmDef...",  // Feedback details URI
    keccak256("..."),   // Content hash
    ""                  // Auth signature (future)
);
```

### Request Validation

```solidity
// Request validation from a validator
bytes32 requestHash = validationRegistry.validationRequest(
    validatorAddress,   // Designated validator
    agentId,            // Agent to validate
    "ipfs://QmGhi...",  // Request details
    keccak256("...")    // Request hash
);
```

### Graduate an Agent

```solidity
// Spirit Council graduates agent to autonomy
identityRegistry.graduateAgent(agentId);
```

## Security Considerations

### Access Control

- **Owner-only functions**: Registration, graduation, EOA updates
- **Authorized updates**: Artist can update metadata
- **Public feedback**: Anyone can submit feedback
- **Validator-only responses**: Only designated validators respond

### Transfer Flexibility

- Agent NFTs are **freely transferable** (standard ERC-721)
- Enables marketplace trading and ownership transfers
- Artist can sell or transfer agent ownership
- Supports DAO transitions and collaborative ownership models

### Reentrancy Protection

- All state-changing functions use `nonReentrant` modifier
- Follows checks-effects-interactions pattern
- Safe external contract calls

### Data Integrity

- EOA uniqueness enforced (one agent per EOA)
- Agent existence verified before operations
- Feedback revocation only by original submitter
- Validation responses only by designated validators

## Gas Optimization

- **Storage packing**: `uint128` counters save gas
- **Array caching**: Loop variables cached in memory
- **Unchecked math**: Safe overflow protection removed where applicable
- **Efficient filtering**: Minimal storage reads in view functions

## Testing

Comprehensive test suite covering:
- Agent registration and lifecycle
- Feedback submission and revocation
- Validation request/response flows
- Reputation aggregation and filtering
- Access control and security
- Gas optimization benchmarks

```bash
# Run Spirit Registry tests
npx hardhat test test/Spirit/*.test.ts

# Generate coverage report
npx hardhat coverage
```

## Governance Evolution

### Phase 1 — Council Governance (Current)
- Spirit Council multisig controls admissions
- Owner-only registration and graduation
- Manual validation and oversight

### Phase 2 — Hybrid Governance
- Council + SPIRIT holder signaling via Snapshot
- Community input on agent admissions
- Transparent validation criteria

### Phase 3 — Tokenholder Governance
- SPIRIT token holders control admissions
- Quadratic voting with quorum (≥10%)
- Approval threshold (≥60%)
- Fully decentralized agent acceptance

## Interfaces

All interfaces follow ERC-8004 patterns:

- `ISpiritIdentity.sol` - Identity management interface
- `ISpiritReputation.sol` - Reputation tracking interface
- `ISpiritValidation.sol` - Validation system interface

## Events

All state changes emit events for offchain indexing:

- `AgentRegistered` - New agent registered
- `AgentMetadataUpdated` - Metadata changed
- `AgentEOAUpdated` - EOA address changed
- `AgentGraduated` - Agent achieved autonomy
- `FeedbackGiven` - Feedback submitted
- `FeedbackRevoked` - Feedback revoked
- `ValidationRequested` - Validation requested
- `ValidationResponded` - Validation response provided

## Future Enhancements

- **Signed Feedback**: Cryptographic signatures for feedback authenticity
- **TEE Integration**: Trusted Execution Environment attestations
- **MCP Protocol**: Model Context Protocol integration
- **ENS/DID Support**: Decentralized identity integrations
- **Cross-chain**: Bridge to other EVM chains
- **Graduated Agent DAO**: DAO governance for graduated agents

## Resources

- **ERC-8004 Specification**: https://eips.ethereum.org/EIPS/eip-8004
- **Spirit Protocol Whitepaper**: See main repo documentation
- **Eden Platform**: https://eden.art
- **Hardhat Documentation**: https://hardhat.org/docs

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- GitHub Issues: [repository]/issues
- Discord: [Spirit Protocol Discord]
- Email: henry@eden.art

---

**Spirit Protocol** - Cultivating synthetic artists through decentralized infrastructure
