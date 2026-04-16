# AgentRegistry Contract Documentation

## Overview

The **AgentRegistry** is an ERC-721 NFT contract designed for registering AI agents on-chain. Each agent is represented as a unique NFT with metadata stored off-chain (typically IPFS), providing a decentralized registry for agent identity and management.

## Key Features

- **ERC-721 Compliant**: Standard NFT functionality with metadata URI support
- **Simplified Permissions**: Owner-based control with trainer delegation
- **Metadata-First**: All agent data stored in metadata (no duplicate on-chain storage)
- **Trainer System**: Address-based trainer permissions for operational flexibility
- **Gas Optimized**: Clean, minimal storage design

## Contract Architecture

### Inheritance
```solidity
contract AgentRegistry is ERC721, ERC721URIStorage, Ownable
```

### Core Components
- **ERC721**: Standard NFT functionality
- **ERC721URIStorage**: Metadata URI management per token
- **Ownable**: Single owner permission system

## Permission Model

### Owner
- **Full Administrative Control**
- Can mint new agent NFTs
- Can burn existing agent NFTs
- Can add/remove trainer addresses
- Can update metadata URIs

### Trainers
- **Limited Operational Access**
- Can update metadata URIs for existing tokens
- **Cannot** burn tokens
- **Cannot** mint new tokens
- **Cannot** manage other trainers

### Public
- **Read-Only Access**
- Can view token information
- Can check trainer status
- Standard ERC-721 view functions

## Core Functions

### Agent Management

#### `register(address recipient, string metadataURI)`
- **Permission**: `onlyOwner`
- **Purpose**: Mint new agent NFT
- **Parameters**:
  - `recipient`: Address to receive the NFT
  - `metadataURI`: IPFS URI containing agent metadata
- **Returns**: Token ID of newly minted NFT
- **Events**: `AgentRegistered(tokenId, owner, metadataURI)`

#### `burn(uint256 tokenId)`
- **Permission**: `onlyOwner`
- **Purpose**: Permanently remove agent NFT
- **Parameters**:
  - `tokenId`: ID of token to burn
- **Events**: `AgentDeregistered(tokenId)`

#### `setTokenURI(uint256 tokenId, string newURI)`
- **Permission**: `onlyOwnerOrTrainer`
- **Purpose**: Update agent metadata URI
- **Parameters**:
  - `tokenId`: ID of token to update
  - `newURI`: New metadata URI

### Trainer Management

#### `addTrainer(address trainer)`
- **Permission**: `onlyOwner`
- **Purpose**: Grant trainer privileges to address
- **Parameters**:
  - `trainer`: Address to add as trainer
- **Events**: `TrainerAdded(trainer)`

#### `removeTrainer(address trainer)`
- **Permission**: `onlyOwner`
- **Purpose**: Revoke trainer privileges from address
- **Parameters**:
  - `trainer`: Address to remove as trainer
- **Events**: `TrainerRemoved(trainer)`

#### `isTrainer(address trainer)`
- **Permission**: Public view
- **Purpose**: Check if address has trainer privileges
- **Parameters**:
  - `trainer`: Address to check
- **Returns**: Boolean indicating trainer status

### Utility Functions

#### `getTokenUris(uint256[] tokenIds)`
- **Permission**: Public view
- **Purpose**: Get multiple token URIs in single call
- **Parameters**:
  - `tokenIds`: Array of token IDs
- **Returns**: Array of corresponding metadata URIs

## Events

```solidity
event AgentRegistered(
    uint256 indexed tokenId,
    address indexed owner,
    string metadataURI
);

event AgentDeregistered(uint256 indexed tokenId);

event TrainerAdded(address indexed trainer);

event TrainerRemoved(address indexed trainer);
```

## Error Handling

The contract includes custom errors for gas-efficient revert reasons:

- `InvalidRecipient()`: Zero address provided as recipient
- `InvalidTokenId()`: Token does not exist
- `UnauthorizedCaller()`: Caller lacks required permissions
- `InvalidMetadataURI()`: Empty metadata URI provided
- `TrainerAlreadyAdded()`: Address already has trainer privileges
- `TrainerNotFound()`: Address is not a trainer
- `InvalidTrainerAddress()`: Zero address provided as trainer

## Metadata Structure

Agent metadata should follow this JSON structure:

```json
{
  "name": "Agent Name",
  "description": "Agent description",
  "image": "ipfs://...",
  "agentId": "unique-agent-identifier",
  "applicationStatus": "active|pending|suspended",
  "attributes": [
    {
      "trait_type": "Agent Type",
      "value": "AI Assistant"
    },
    {
      "trait_type": "Version",
      "value": "1.0.0"
    }
  ],
  "external_url": "https://agent-dashboard.com/agent-id"
}
```

## Deployment

### Constructor Parameters
```solidity
constructor(
    string memory _name,      // Collection name (e.g., "Agent Registry")
    string memory _symbol,    // Collection symbol (e.g., "AGENT")
    address _owner           // Owner address
)
```

### Deployment Example
```typescript
// Using Hardhat Ignition
const agentRegistry = m.contract("AgentRegistry", [
    "Agent Registry",                              // name
    "AGENT",                                       // symbol
    "0x5D6D8518A1d564c85ea5c41d1dc0deca70F2301C" // owner
]);
```

### Makefile Deployment
```bash
make deploy-agent-registry NETWORK=base-sepolia
```

## Usage Patterns

### Basic Agent Registration
```solidity
// Owner registers new agent
uint256 tokenId = agentRegistry.register(
    userAddress,
    "ipfs://QmHash.../agent-metadata.json"
);
```

### Trainer Management
```solidity
// Owner adds trainer
agentRegistry.addTrainer(trainerAddress);

// Trainer updates metadata
agentRegistry.setTokenURI(tokenId, "ipfs://newHash.../updated-metadata.json");

// Owner removes trainer
agentRegistry.removeTrainer(trainerAddress);
```

### Query Operations
```solidity
// Check trainer status
bool isTrainerActive = agentRegistry.isTrainer(someAddress);

// Get multiple metadata URIs
uint256[] memory tokenIds = [1, 2, 3];
string[] memory uris = agentRegistry.getTokenUris(tokenIds);

// Standard ERC-721 queries
address owner = agentRegistry.ownerOf(tokenId);
string memory uri = agentRegistry.tokenURI(tokenId);
```

## Security Considerations

### Access Control
- **Owner Centralization**: Single owner has full control over the registry
- **Trainer Limitations**: Trainers cannot burn tokens or manage other trainers
- **Metadata Integrity**: Metadata URIs should be immutable (IPFS recommended)

### Best Practices
1. **Metadata Validation**: Validate metadata structure before setting URIs
2. **Trainer Management**: Regularly review trainer permissions
3. **URI Immutability**: Use content-addressed storage (IPFS) for metadata
4. **Event Monitoring**: Monitor events for unauthorized changes

## Integration Examples

### Frontend Integration
```javascript
// Connect to contract
const agentRegistry = new ethers.Contract(address, abi, signer);

// Register new agent
const tx = await agentRegistry.register(
    recipientAddress,
    metadataURI
);
await tx.wait();

// Listen for registrations
agentRegistry.on("AgentRegistered", (tokenId, owner, metadataURI) => {
    console.log(`New agent ${tokenId} registered for ${owner}`);
});
```

### Backend Integration
```javascript
// Query agent data
const tokenId = 1;
const owner = await agentRegistry.ownerOf(tokenId);
const metadataURI = await agentRegistry.tokenURI(tokenId);
const metadata = await fetch(metadataURI).then(r => r.json());

console.log(`Agent ${metadata.agentId} owned by ${owner}`);
```

## Gas Costs (Estimated)

| Function | Estimated Gas |
|----------|---------------|
| `register()` | ~100,000 gas |
| `burn()` | ~50,000 gas |
| `setTokenURI()` | ~30,000 gas |
| `addTrainer()` | ~25,000 gas |
| `removeTrainer()` | ~25,000 gas |
| View functions | <10,000 gas |

## Changelog

### v2.0.0 (Current)
- Renamed from SpiritRegistry to AgentRegistry
- Removed on-chain agentId and applicationStatus storage
- Simplified permission system (removed AccessControl)
- Implemented address-based trainer system
- Removed TrainerRegistry dependency

### v1.0.0 (Legacy)
- Initial SpiritRegistry implementation
- Complex role-based permissions
- On-chain agent data storage
- TrainerRegistry integration

## Support

For technical support or questions about the AgentRegistry contract, please refer to:
- Contract source code in `/contracts/SuperTokens/AgentRegistry.sol`
- Deployment scripts in `/ignition/modules/SuperTokens/DeployAgentRegistry.ts`
- Test files in `/test/SpiritRegistry/` (being updated to AgentRegistry)