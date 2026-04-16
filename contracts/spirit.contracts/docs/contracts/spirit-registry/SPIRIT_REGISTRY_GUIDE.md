# 🎭 SpiritRegistry - Enhanced Agent Registry with Application Status

The SpiritRegistry is an ERC-721 NFT contract that manages agent registration with comprehensive application status tracking.

## ✨ **New Features Added**

### 🔄 Application Status Management
- **Automatic Status Initialization**: New agents start with "pending" status
- **Owner-Controlled Status Updates**: Contract owner can set and update agent statuses
- **Batch Operations**: Update multiple agent statuses in a single transaction
- **Status-Based Filtering**: Query agents by their application status
- **Event Logging**: All status changes are logged with previous and new status

## 📋 **Application Status Workflow**

### Status Lifecycle
```
mint() → "pending" → owner sets → "approved"/"rejected"/"active"/"suspended"
```

### Common Status Values
- **`"pending"`** - Default status for new applications
- **`"approved"`** - Application has been approved
- **`"rejected"`** - Application has been rejected
- **`"active"`** - Agent is active and operational
- **`"suspended"`** - Agent is temporarily suspended
- **`"under-review"`** - Application is being reviewed
- **`"inactive"`** - Agent is inactive

## 🔧 **New Functions**

### Owner Functions (Registry Management)

#### Set Status by Token ID (Primary Method)
```solidity
function setApplicationStatus(uint256 tokenId, string calldata status) external onlyOwner
```
**Usage**: Set application status using token ID (more efficient)
**Example**: `setApplicationStatus(1, "approved")`

#### Set Status by Agent ID (Convenience Method)
```solidity
function setApplicationStatusByAgentId(string calldata agentId, string calldata status) external onlyOwner
```
**Usage**: Set application status using agent ID (legacy compatibility)
**Example**: `setApplicationStatusByAgentId("agent-001", "approved")`

#### Batch Set Status (Token ID Based)
```solidity
function batchSetApplicationStatus(uint256[] calldata tokenIds, string[] calldata statuses) external onlyOwner
```
**Usage**: Update multiple agent statuses using token IDs
**Example**: `batchSetApplicationStatus([1, 2, 3], ["approved", "rejected", "pending"])`

### Public View Functions

#### Get Status by Token ID (Primary Method)
```solidity
function getApplicationStatus(uint256 tokenId) external view returns (string memory)
```
**Usage**: Get current application status using token ID
**Example**: `getApplicationStatus(1)` → `"approved"`

#### Get Status by Agent ID (Convenience Method)
```solidity
function getApplicationStatusByAgentId(string calldata agentId) external view returns (string memory)
```
**Usage**: Get current application status using agent ID
**Example**: `getApplicationStatusByAgentId("agent-001")` → `"approved"`

#### Get Token IDs by Status (Primary Method)
```solidity
function getTokenIdsByStatus(string calldata status) external view returns (uint256[] memory)
```
**Usage**: Get all token IDs with a specific status (more efficient)
**Example**: `getTokenIdsByStatus("approved")` → `[1, 3, 5]`

#### Get Agent IDs by Status (Convenience Method)
```solidity
function getAgentsByStatus(string calldata status) external view returns (string[] memory)
```
**Usage**: Get all agent IDs with a specific status (backward compatibility)
**Example**: `getAgentsByStatus("approved")` → `["agent-001", "agent-003"]`

## 📡 **New Events**

### ApplicationStatusUpdated
```solidity
event ApplicationStatusUpdated(uint256 indexed tokenId, string indexed agentId, string previousStatus, string newStatus);
```
**Emitted**: When an agent's application status changes
**Parameters**: 
- `tokenId`: The token ID of the agent (indexed for efficient filtering)
- `agentId`: The agent ID (indexed for backward compatibility)  
- `previousStatus`: The previous status string
- `newStatus`: The new status string
**Use Case**: Track status history and audit trail with both tokenId and agentId references

## 🎯 **Usage Examples**

### Deploy SpiritRegistry
```bash
# Using existing deployment script
make deploy-spirit-registry NETWORK=base-sepolia
```

### Manage Registry
```bash
# Interactive management interface
npm run manage:spirit-registry
```

### Programmatic Usage
```typescript
// Connect to deployed registry
const registry = await ethers.getContractAt("SpiritRegistry", contractAddress);

// Get all pending token IDs (most efficient)
const pendingTokenIds = await registry.getTokenIdsByStatus("pending");

// Get all pending agents (backward compatibility)
const pendingAgents = await registry.getAgentsByStatus("pending");

// Approve an agent using token ID (most efficient)
await registry.setApplicationStatus(1, "approved");

// Approve an agent using agent ID (convenience method)
await registry.setApplicationStatusByAgentId("agent-001", "approved");

// Batch update statuses using token IDs (most efficient)
await registry.batchSetApplicationStatus(
  [1, 2, 3], 
  ["active", "suspended", "rejected"]
);

// Check agent status using token ID (most efficient)
const status = await registry.getApplicationStatus(1);
console.log(`Token 1 status: ${status}`);

// Check agent status using agent ID (convenience method)
const statusByAgentId = await registry.getApplicationStatusByAgentId("agent-001");
console.log(`Agent agent-001 status: ${statusByAgentId}`);
```

## 🛠️ **Management Interface**

The interactive management script provides a menu-driven interface:

```bash
npm run manage:spirit-registry
```

### Available Actions:
1. **View all registered agents** - Shows all agents with their current status
2. **View agents by status** - Filter agents by specific status
3. **Get agent application status** - Check individual agent status
4. **Set agent application status** - Update single agent status (owner only)
5. **Batch set application status** - Update multiple agents (owner only)
6. **Mint new agent** - Register new agent (treasury only)
7. **Burn agent** - Remove agent from registry (treasury only)
8. **Get agent details** - Full agent information

## 🔐 **Access Control**

### Owner Capabilities
- Set and update application statuses
- Update token metadata URIs
- Transfer contract ownership

### Treasury Capabilities  
- Mint new agent NFTs
- Burn existing agent NFTs
- Update treasury address

### Public Capabilities
- View agent information
- Query agents by status
- Check registration status

## 📊 **Status Analytics**

### Track Application Metrics
```typescript
// Get counts by status
const pendingCount = (await registry.getAgentsByStatus("pending")).length;
const approvedCount = (await registry.getAgentsByStatus("approved")).length;
const rejectedCount = (await registry.getAgentsByStatus("rejected")).length;

console.log(`Pending: ${pendingCount}, Approved: ${approvedCount}, Rejected: ${rejectedCount}`);
```

### Monitor Status Changes
```typescript
// Listen for status updates
registry.on("ApplicationStatusUpdated", (agentId, previousStatus, newStatus) => {
  console.log(`Agent ${agentId}: ${previousStatus} → ${newStatus}`);
});
```

## 🧪 **Testing**

Comprehensive tests ensure reliability:

```bash
# Run application status tests
npx hardhat test test/SpiritRegistry/ApplicationStatus.test.ts
```

### Test Coverage
- ✅ Status initialization on mint
- ✅ Owner-only status updates
- ✅ Batch status operations
- ✅ Status filtering and queries
- ✅ Event emission verification
- ✅ Error handling and validation

## 🚀 **Integration**

### With Existing Systems
The enhanced SpiritRegistry maintains full backward compatibility while adding powerful status management capabilities. Integration points:

- **Agent Onboarding**: Automated status progression
- **Compliance Tracking**: Audit trail for regulatory requirements  
- **Dashboard Integration**: Real-time status visualization
- **Notification Systems**: Status change alerts

### Smart Contract Integration
```solidity
interface ISpiritRegistry {
    function getApplicationStatus(string calldata agentId) external view returns (string memory);
    function setApplicationStatus(string calldata agentId, string calldata status) external;
}

// Example integration in another contract
contract AgentService {
    ISpiritRegistry public spiritRegistry;
    
    modifier onlyApprovedAgent(string calldata agentId) {
        require(
            keccak256(bytes(spiritRegistry.getApplicationStatus(agentId))) == 
            keccak256(bytes("approved")), 
            "Agent not approved"
        );
        _;
    }
}
```

## 📈 **Benefits**

✅ **Centralized Status Management** - Single source of truth for agent statuses  
✅ **Audit Trail** - Complete history of status changes via events  
✅ **Batch Operations** - Efficient mass status updates  
✅ **Flexible Status Values** - Support for any string-based status system  
✅ **Query Efficiency** - Fast filtering of agents by status  
✅ **Access Control** - Secure owner-only status management  
✅ **Backward Compatible** - No breaking changes to existing functionality  

---

**The SpiritRegistry is now a comprehensive agent management system with powerful application status tracking capabilities! 🎭✨**