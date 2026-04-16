# SpiritRegistry Documentation

The SpiritRegistry is a specialized ERC-721 NFT contract designed for agent registration in the EDEN ecosystem. It provides a comprehensive solution for managing AI agents as unique NFTs with metadata, application status tracking, and dual ownership controls.

## Overview

The SpiritRegistry contract serves as the central registry for AI agents, where each agent is represented as an NFT with:

- **Unique Agent ID**: String-based identifier for each agent
- **IPFS Metadata**: Decentralized storage for agent information
- **Application Status**: Lifecycle management (pending, approved, rejected, etc.)
- **Ownership Control**: Dual-role system with Owner and Treasury permissions

## Contract Details

| Property | Value |
|----------|-------|
| **Contract Name** | SpiritRegistry |
| **Token Symbol** | SAR (Spirit Agent Registry) |
| **Standard** | ERC-721 with ERC721URIStorage |
| **Deployment Address** | See deployment logs |
| **Owner Address** | `0x5D6D8518A1d564c85ea5c41d1dc0deca70F2301C` |
| **Treasury Address** | `0x5D6D8518A1d564c85ea5c41d1dc0deca70F2301C` |

## Key Features

### ✨ Agent Registration
- Mint NFTs with specific token IDs and agent IDs
- IPFS metadata integration for decentralized agent information
- Automatic application status initialization

### 🔐 Dual Ownership Model
- **Owner**: Configuration management, agent applications, status updates
- **Treasury**: Minting and burning operations

### 📊 Application Status Tracking
- Lifecycle management with customizable status strings
- Bulk status updates and filtering capabilities
- Event emission for all status changes

### 🔍 Query Functions
- Agent ID to Token ID mapping
- Token ID to Agent ID mapping
- Status-based filtering and retrieval

## Core Functions

### Owner Functions

#### `applyForRegistration(uint256 tokenId, string agentId, string metadataURI)`
Mints an agent NFT to the owner's address.

```solidity
function applyForRegistration(
    uint256 tokenId,
    string calldata agentId,
    string calldata metadataURI
) external onlyOwner returns (uint256)
```

**Parameters:**
- `tokenId`: Specific token ID to mint (must not exist)
- `agentId`: Unique string identifier for the agent
- `metadataURI`: IPFS URI pointing to agent metadata

**Events Emitted:**
- `AgentRegistered(tokenId, agentId, owner, metadataURI)`
- `ApplicationStatusUpdated(tokenId, agentId, "", "pending")`

#### `applyForRegistrationTo(uint256 tokenId, string agentId, string metadataURI, address to)`
Mints an agent NFT to a specified address.

```solidity
function applyForRegistrationTo(
    uint256 tokenId,
    string calldata agentId,
    string calldata metadataURI,
    address to
) external onlyOwner returns (uint256)
```

**Parameters:**
- `tokenId`: Specific token ID to mint (must not exist)
- `agentId`: Unique string identifier for the agent
- `metadataURI`: IPFS URI pointing to agent metadata
- `to`: Address to receive the minted NFT

#### `setApplicationStatus(uint256 tokenId, string status)`
Updates the application status for a specific token.

```solidity
function setApplicationStatus(
    uint256 tokenId,
    string calldata status
) external onlyOwner
```

**Common Status Values:**
- `"pending"` - Initial status after minting
- `"approved"` - Agent application approved
- `"rejected"` - Agent application rejected
- `"active"` - Agent is active and operational
- `"suspended"` - Agent is temporarily suspended

### Treasury Functions

#### `mint(address to, string agentId, string metadataURI)`
Original minting function with auto-incremented token IDs.

```solidity
function mint(
    address to,
    string calldata agentId,
    string calldata metadataURI
) external onlyTreasury returns (uint256)
```

#### `burn(uint256 tokenId)`
Burns an agent NFT and removes all associated data.

```solidity
function burn(uint256 tokenId) external onlyTreasury
```

### Query Functions

#### `getAgentId(uint256 tokenId)`
Returns the agent ID for a given token ID.

```solidity
function getAgentId(uint256 tokenId) public view returns (string memory)
```

#### `getTokenIdByAgentId(string agentId)`
Returns the token ID for a given agent ID.

```solidity
function getTokenIdByAgentId(string calldata agentId) public view returns (uint256)
```

#### `isAgentRegistered(string agentId)`
Checks if an agent ID is already registered.

```solidity
function isAgentRegistered(string calldata agentId) public view returns (bool)
```

#### `getApplicationStatus(uint256 tokenId)`
Returns the current application status for a token.

```solidity
function getApplicationStatus(uint256 tokenId) external view returns (string memory)
```

#### `getTokenIdsByStatus(string status)`
Returns all token IDs with a specific application status.

```solidity
function getTokenIdsByStatus(string calldata status) external view returns (uint256[] memory)
```

#### `getAgentsByStatus(string status)`
Returns all agent IDs with a specific application status.

```solidity
function getAgentsByStatus(string calldata status) external view returns (string[] memory)
```

## Events

### AgentRegistered
Emitted when a new agent is registered.

```solidity
event AgentRegistered(
    uint256 indexed tokenId,
    string indexed agentId,
    address indexed owner,
    string metadataURI
)
```

### ApplicationStatusUpdated
Emitted when an agent's application status changes.

```solidity
event ApplicationStatusUpdated(
    uint256 indexed tokenId,
    string indexed agentId,
    string previousStatus,
    string newStatus
)
```

### AgentDeregistered
Emitted when an agent is burned/removed.

```solidity
event AgentDeregistered(
    uint256 indexed tokenId,
    string indexed agentId
)
```

## Deployment

### Using Makefile

Deploy the SpiritRegistry to Base Sepolia:

```bash
make deploy-spirit-registry NETWORK=base-sepolia
```

Verify ownership after deployment:

```bash
make verify-spirit-registry-ownership SPIRIT_REGISTRY_ADDRESS=0x... NETWORK=base-sepolia
```

### Using Hardhat Ignition

```bash
npx hardhat ignition deploy ignition/modules/SuperTokens/DeploySpiritRegistry.ts --network base-sepolia --verify
```

## Usage Examples

### Registering a New Agent

```javascript
// Using the owner account (0x5D6D8518A1d564c85ea5c41d1dc0deca70F2301C)
const spiritRegistry = await ethers.getContractAt("SpiritRegistry", contractAddress);

// Mint agent NFT to yourself
await spiritRegistry.applyForRegistration(
    1,                              // tokenId
    "my-ai-agent-001",             // agentId
    "ipfs://QmHash123..."          // metadataURI
);

// Mint agent NFT to another address
await spiritRegistry.applyForRegistrationTo(
    2,                              // tokenId
    "collaborative-agent-002",     // agentId
    "ipfs://QmHash456...",         // metadataURI
    "0x742d35Cc6634C0532925a3b8D321140"  // recipient address
);
```

### Managing Application Status

```javascript
// Approve an agent application
await spiritRegistry.setApplicationStatus(1, "approved");

// Get all pending applications
const pendingAgents = await spiritRegistry.getAgentsByStatus("pending");
console.log("Pending agents:", pendingAgents);

// Get all approved token IDs
const approvedTokens = await spiritRegistry.getTokenIdsByStatus("approved");
console.log("Approved tokens:", approvedTokens);
```

### Querying Agent Information

```javascript
// Get agent ID for a token
const agentId = await spiritRegistry.getAgentId(1);

// Get token ID for an agent
const tokenId = await spiritRegistry.getTokenIdByAgentId("my-ai-agent-001");

// Check if agent is registered
const isRegistered = await spiritRegistry.isAgentRegistered("my-ai-agent-001");

// Get token metadata
const tokenURI = await spiritRegistry.tokenURI(1);

// Get token owner
const owner = await spiritRegistry.ownerOf(1);
```

## Error Handling

The contract includes comprehensive error handling:

| Error | Description |
|-------|-------------|
| `InvalidRecipient()` | Attempting to mint to zero address |
| `InvalidTokenId()` | Token ID doesn't exist |
| `UnauthorizedCaller()` | Caller doesn't have required permissions |
| `TokenAlreadyExists()` | Token ID already exists |
| `AgentAlreadyRegistered()` | Agent ID already in use |
| `InvalidAgentId()` | Empty or invalid agent ID |
| `InvalidMetadataURI()` | Empty or invalid metadata URI |
| `UnauthorizedTreasury()` | Caller is not the treasury |
| `InvalidApplicationStatus()` | Empty or invalid status string |
| `AgentNotFound()` | Agent ID not found in registry |

## Testing

The contract includes comprehensive test coverage:

```bash
# Run all SpiritRegistry tests
npx hardhat test test/SpiritRegistry/SpiritRegistry.test.ts

# Run application status tests
npx hardhat test test/SpiritRegistry/ApplicationStatus.test.ts
```

### Test Coverage

- ✅ Owner-only minting functions
- ✅ Treasury minting and burning
- ✅ Application status management
- ✅ Agent ID and token ID mappings
- ✅ Error handling and validation
- ✅ Event emission verification
- ✅ Multiple token scenarios
- ✅ Status filtering and queries

## Security Considerations

### Access Control
- Owner-only functions are protected by OpenZeppelin's `Ownable`
- Treasury functions use custom `onlyTreasury` modifier
- All validation is performed before state changes

### Data Integrity
- Agent IDs must be unique across the registry
- Token IDs cannot be reused
- Metadata URIs are validated for non-empty values
- Status changes emit events for auditability

### Best Practices
- Use specific token IDs for predictable minting
- Store comprehensive metadata on IPFS
- Implement proper error handling in frontend applications
- Monitor events for real-time updates

## Integration Guide

### Frontend Integration

```javascript
import { ethers } from 'ethers';

// Contract setup
const contractAddress = "0x..."; // Deployed contract address
const abi = [...]; // Contract ABI
const contract = new ethers.Contract(contractAddress, abi, signer);

// Listen for agent registrations
contract.on("AgentRegistered", (tokenId, agentId, owner, metadataURI) => {
    console.log(`New agent registered: ${agentId} (Token ${tokenId})`);
});

// Listen for status updates
contract.on("ApplicationStatusUpdated", (tokenId, agentId, previousStatus, newStatus) => {
    console.log(`Agent ${agentId} status: ${previousStatus} → ${newStatus}`);
});
```

### Backend Integration

```python
from web3 import Web3

# Contract setup
w3 = Web3(Web3.HTTPProvider('https://base-sepolia.g.allthatnode.com/...'))
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# Query all agents by status
def get_agents_by_status(status):
    return contract.functions.getAgentsByStatus(status).call()

# Get agent metadata
def get_agent_metadata(agent_id):
    token_id = contract.functions.getTokenIdByAgentId(agent_id).call()
    token_uri = contract.functions.tokenURI(token_id).call()
    return token_uri
```

## Conclusion

The SpiritRegistry provides a robust foundation for AI agent management in the EDEN ecosystem. With its comprehensive feature set, security measures, and extensive testing, it offers a reliable solution for decentralized agent registration and lifecycle management.

For support or questions, please refer to the project's GitHub repository or contact the development team.