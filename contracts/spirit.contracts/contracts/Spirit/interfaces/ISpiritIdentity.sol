// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ISpiritIdentity
 * @notice ERC-8004 compliant interface for Spirit Agent identity management
 * @dev Identity registry for synthetic artist agents with EOA and metadata
 */
interface ISpiritIdentity {
    // ============ Events ============

    /**
     * @notice Emitted when a new agent is registered
     * @param agentId The unique NFT token ID for the agent
     * @param agentEOA The Externally Owned Account controlled by the agent
     * @param artistAddress The human artist/trainer address
     * @param registrationURI URI pointing to agent's registration metadata
     */
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed agentEOA,
        address indexed artistAddress,
        string registrationURI
    );

    /**
     * @notice Emitted when agent metadata is updated
     * @param agentId The agent's token ID
     * @param newURI Updated metadata URI
     */
    event AgentMetadataUpdated(uint256 indexed agentId, string newURI);

    /**
     * @notice Emitted when agent EOA is updated
     * @param agentId The agent's token ID
     * @param oldEOA Previous agent EOA
     * @param newEOA New agent EOA
     */
    event AgentEOAUpdated(uint256 indexed agentId, address indexed oldEOA, address indexed newEOA);

    /**
     * @notice Emitted when agent graduates to autonomy
     * @param agentId The agent's token ID
     * @param timestamp Graduation timestamp
     */
    event AgentGraduated(uint256 indexed agentId, uint256 timestamp);

    // ============ Errors ============

    error InvalidAgentEOA();
    error InvalidArtistAddress();
    error EmptyRegistrationURI();
    error AgentAlreadyRegistered(uint256 agentId);
    error AgentNotFound(uint256 agentId);
    error UnauthorizedCaller(address caller);
    error AgentAlreadyGraduated(uint256 agentId);

    // ============ Structs ============

    /**
     * @notice Core identity data for a Spirit agent
     * @param agentEOA The agent's Externally Owned Account (for signing transactions)
     * @param artistAddress The human artist/trainer who mentors this agent
     * @param registrationURI URI to agent's registration metadata (JSON)
     * @param registeredAt Timestamp when agent was registered
     * @param graduatedAt Timestamp when agent graduated (0 if not graduated)
     * @param isActive Whether the agent is currently active
     */
    struct AgentIdentity {
        address agentEOA;
        address artistAddress;
        string registrationURI;
        uint256 registeredAt;
        uint256 graduatedAt;
        bool isActive;
    }

    // ============ View Functions ============

    /**
     * @notice Get complete identity information for an agent
     * @param agentId The agent's token ID
     * @return identity The complete AgentIdentity struct
     */
    function getAgentIdentity(
        uint256 agentId
    ) external view returns (AgentIdentity memory identity);

    /**
     * @notice Get agent's EOA address
     * @param agentId The agent's token ID
     * @return The agent's EOA address
     */
    function getAgentEOA(uint256 agentId) external view returns (address);

    /**
     * @notice Get agent's artist/trainer address
     * @param agentId The agent's token ID
     * @return The artist's address
     */
    function getArtistAddress(uint256 agentId) external view returns (address);

    /**
     * @notice Check if an agent has graduated
     * @param agentId The agent's token ID
     * @return True if agent has graduated
     */
    function hasGraduated(uint256 agentId) external view returns (bool);

    /**
     * @notice Check if an agent is active
     * @param agentId The agent's token ID
     * @return True if agent is active
     */
    function isAgentActive(uint256 agentId) external view returns (bool);

    /**
     * @notice Find agent ID by their EOA address
     * @param agentEOA The agent's EOA address
     * @return agentId The agent's token ID (0 if not found)
     */
    function getAgentIdByEOA(address agentEOA) external view returns (uint256 agentId);

    /**
     * @notice Get all agents trained by an artist
     * @param artistAddress The artist's address
     * @return agentIds Array of agent token IDs
     */
    function getAgentsByArtist(
        address artistAddress
    ) external view returns (uint256[] memory agentIds);

    /**
     * @notice Check if an agent exists
     * @param agentId The agent's token ID
     * @return True if agent exists
     */
    function agentExists(uint256 agentId) external view returns (bool);

    // ============ State-Changing Functions ============

    /**
     * @notice Register a new agent in the identity registry
     * @param agentEOA The agent's EOA address (for signing transactions)
     * @param artistAddress The human artist/trainer address
     * @param registrationURI URI to agent's registration metadata
     * @return agentId The newly minted agent token ID
     */
    function registerAgent(
        address agentEOA,
        address artistAddress,
        string calldata registrationURI
    ) external returns (uint256 agentId);

    /**
     * @notice Update agent's metadata URI
     * @param agentId The agent's token ID
     * @param newURI New metadata URI
     */
    function updateAgentMetadata(uint256 agentId, string calldata newURI) external;

    /**
     * @notice Update agent's EOA address
     * @param agentId The agent's token ID
     * @param newEOA New agent EOA address
     */
    function updateAgentEOA(uint256 agentId, address newEOA) external;

    /**
     * @notice Mark an agent as graduated (autonomous)
     * @param agentId The agent's token ID
     */
    function graduateAgent(uint256 agentId) external;

    /**
     * @notice Deactivate an agent
     * @param agentId The agent's token ID
     */
    function deactivateAgent(uint256 agentId) external;

    /**
     * @notice Reactivate a deactivated agent
     * @param agentId The agent's token ID
     */
    function reactivateAgent(uint256 agentId) external;
}
