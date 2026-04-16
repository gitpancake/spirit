// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISpiritIdentity} from "./interfaces/ISpiritIdentity.sol";
import {ISpiritValidation} from "./interfaces/ISpiritValidation.sol";
import {ISpiritReputation} from "./interfaces/ISpiritReputation.sol";

// ============ External Interfaces ============

interface ISpiritIdentityV2 {
    function registerAgentWithSafe(
        address agentEOA,
        address artistAddress,
        address safeAddress,
        string calldata registrationURI
    ) external returns (uint256 agentId);

    function graduateAgent(uint256 agentId) external;
    function deactivateAgent(uint256 agentId) external;
    function reactivateAgent(uint256 agentId) external;
}

interface ISafeFactory {
    function createSafe(address[] calldata owners, uint256 threshold) external returns (address);
}

/**
 * @title SpiritRegistryController
 * @author Eden Platform
 * @notice Unified controller for managing Spirit agent registration across all registries
 * @dev Orchestrates agent setup across Identity, Validation, and Reputation registries
 *
 * FEATURES:
 * - One-stop agent registration across all systems
 * - Safe multisig deployment integration
 * - Initial validation setup
 * - Seed reputation configuration
 * - Batch operations support
 * - Gas-optimized registry interactions
 *
 * SECURITY:
 * - Reentrancy protection
 * - Access control for registry operations
 * - Validation of all inputs
 * - Safe deployment verification
 */
contract SpiritRegistryController is Ownable, ReentrancyGuard {
    // ============ State Variables ============

    /// @notice Identity Registry reference
    ISpiritIdentityV2 public immutable identityRegistry;

    /// @notice Validation Registry reference
    ISpiritValidation public immutable validationRegistry;

    /// @notice Reputation Registry reference
    ISpiritReputation public immutable reputationRegistry;

    /// @notice Safe Factory address (optional)
    address public safeFactory;

    /// @notice Mapping of agent setup configurations
    mapping(uint256 => AgentSetupConfig) public agentConfigs;

    /// @notice Authorized setup operators (can call setupNewAgent)
    mapping(address => bool) public setupOperators;

    // ============ Structs ============

    /**
     * @notice Complete configuration for agent setup
     */
    struct AgentSetupConfig {
        address agentEOA; // Agent's signing wallet
        address artistAddress; // Human trainer
        address safeAddress; // Safe multisig (if pre-deployed)
        string registrationURI; // Identity metadata
        string validationURI; // Initial validation request
        string initialRepURI; // Initial reputation data
        uint8 initialScore; // Seed reputation score
        bool deploySafe; // Whether to deploy new Safe
        bool requestValidation; // Whether to create validation request
        bool seedReputation; // Whether to add initial reputation
    }

    /**
     * @notice Result of agent setup
     */
    struct AgentSetupResult {
        uint256 agentId;
        address safeAddress;
        bytes32 validationRequestHash;
        uint64 reputationIndex;
        bool success;
    }

    // ============ Events ============

    event AgentSetupCompleted(
        uint256 indexed agentId,
        address indexed agentEOA,
        address indexed safeAddress,
        bool validationRequested,
        bool reputationSeeded
    );

    event SetupOperatorUpdated(address indexed operator, bool authorized);
    event SafeFactoryUpdated(address indexed oldFactory, address indexed newFactory);

    event BatchSetupCompleted(uint256 successCount, uint256 totalCount);

    // ============ Constructor ============

    /**
     * @notice Initialize the controller with registry references
     * @param _identityRegistry Address of Identity Registry
     * @param _validationRegistry Address of Validation Registry
     * @param _reputationRegistry Address of Reputation Registry
     * @param _safeFactory Optional Safe factory address
     * @param _owner Owner of this controller
     */
    constructor(
        address _identityRegistry,
        address _validationRegistry,
        address _reputationRegistry,
        address _safeFactory,
        address _owner
    ) Ownable(_owner) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        require(_validationRegistry != address(0), "Invalid validation registry");
        require(_reputationRegistry != address(0), "Invalid reputation registry");

        identityRegistry = ISpiritIdentityV2(_identityRegistry);
        validationRegistry = ISpiritValidation(_validationRegistry);
        reputationRegistry = ISpiritReputation(_reputationRegistry);
        safeFactory = _safeFactory;
    }

    // ============ Main Functions ============

    /**
     * @notice Complete agent setup across all registries
     * @param config Complete configuration for agent setup
     * @return result Setup result including all created IDs
     */
    function setupNewAgent(
        AgentSetupConfig calldata config
    ) external nonReentrant returns (AgentSetupResult memory result) {
        // Validate caller
        require(msg.sender == owner() || setupOperators[msg.sender], "Unauthorized");

        // Validate inputs
        require(config.agentEOA != address(0), "Invalid agent EOA");
        require(config.artistAddress != address(0), "Invalid artist address");
        require(bytes(config.registrationURI).length > 0, "Invalid registration URI");

        // Handle Safe deployment or validation
        address safeAddr = config.safeAddress;
        if (config.deploySafe) {
            require(safeFactory != address(0), "Safe factory not configured");
            safeAddr = _deploySafe(config.agentEOA, config.artistAddress);
        } else if (safeAddr == address(0)) {
            // If not deploying Safe and no address provided, use artist address
            safeAddr = config.artistAddress;
        }

        // 1. Register agent identity
        uint256 agentId = identityRegistry.registerAgentWithSafe(
            config.agentEOA,
            config.artistAddress,
            safeAddr,
            config.registrationURI
        );

        result.agentId = agentId;
        result.safeAddress = safeAddr;

        // 2. Create initial validation request if needed
        if (config.requestValidation && bytes(config.validationURI).length > 0) {
            result.validationRequestHash = _createValidationRequest(
                agentId,
                config.artistAddress, // Artist as initial validator
                config.validationURI
            );
        }

        // 3. Seed initial reputation if needed
        if (config.seedReputation && bytes(config.initialRepURI).length > 0) {
            result.reputationIndex = _seedReputation(
                agentId,
                config.initialScore,
                config.initialRepURI
            );
        }

        // Store config for reference
        agentConfigs[agentId] = config;

        result.success = true;

        emit AgentSetupCompleted(
            agentId,
            config.agentEOA,
            safeAddr,
            config.requestValidation,
            config.seedReputation
        );

        return result;
    }

    /**
     * @notice Batch setup multiple agents
     * @param configs Array of agent configurations
     * @return results Array of setup results
     */
    function batchSetupAgents(
        AgentSetupConfig[] calldata configs
    ) external nonReentrant returns (AgentSetupResult[] memory results) {
        require(msg.sender == owner() || setupOperators[msg.sender], "Unauthorized");
        require(configs.length > 0 && configs.length <= 10, "Invalid batch size");

        results = new AgentSetupResult[](configs.length);
        uint256 successCount = 0;

        for (uint256 i = 0; i < configs.length; i++) {
            try this.setupNewAgent(configs[i]) returns (AgentSetupResult memory result) {
                results[i] = result;
                if (result.success) successCount++;
            } catch {
                results[i].success = false;
            }
        }

        emit BatchSetupCompleted(successCount, configs.length);

        return results;
    }

    /**
     * @notice Quick setup with minimal configuration
     * @param agentEOA Agent's signing wallet
     * @param artistAddress Human trainer address
     * @param metadataURI Single URI for all metadata
     * @param deploySafe Whether to deploy new Safe
     * @return agentId The created agent ID
     * @return safeAddress The Safe address (if deployed)
     */
    function quickSetup(
        address agentEOA,
        address artistAddress,
        string calldata metadataURI,
        bool deploySafe
    ) external nonReentrant returns (uint256 agentId, address safeAddress) {
        require(msg.sender == owner() || setupOperators[msg.sender], "Unauthorized");

        AgentSetupConfig memory config = AgentSetupConfig({
            agentEOA: agentEOA,
            artistAddress: artistAddress,
            safeAddress: address(0),
            registrationURI: metadataURI,
            validationURI: metadataURI,
            initialRepURI: metadataURI,
            initialScore: 50, // Default neutral score
            deploySafe: deploySafe,
            requestValidation: true,
            seedReputation: true
        });

        AgentSetupResult memory result = this.setupNewAgent(config);
        require(result.success, "Setup failed");

        return (result.agentId, result.safeAddress);
    }

    // ============ Admin Functions ============

    /**
     * @notice Graduate an agent to autonomous status
     * @param agentId Agent to graduate
     */
    function graduateAgent(uint256 agentId) external onlyOwner {
        identityRegistry.graduateAgent(agentId);
    }

    /**
     * @notice Deactivate an agent
     * @param agentId Agent to deactivate
     */
    function deactivateAgent(uint256 agentId) external onlyOwner {
        identityRegistry.deactivateAgent(agentId);
    }

    /**
     * @notice Reactivate an agent
     * @param agentId Agent to reactivate
     */
    function reactivateAgent(uint256 agentId) external onlyOwner {
        identityRegistry.reactivateAgent(agentId);
    }

    /**
     * @notice Update setup operator authorization
     * @param operator Address to update
     * @param authorized Whether operator is authorized
     */
    function setSetupOperator(address operator, bool authorized) external onlyOwner {
        setupOperators[operator] = authorized;
        emit SetupOperatorUpdated(operator, authorized);
    }

    /**
     * @notice Update Safe factory address
     * @param newFactory New factory address
     */
    function setSafeFactory(address newFactory) external onlyOwner {
        address oldFactory = safeFactory;
        safeFactory = newFactory;
        emit SafeFactoryUpdated(oldFactory, newFactory);
    }

    // ============ Internal Functions ============

    /**
     * @dev Deploy a new Safe multisig
     * @param agentEOA Agent signing wallet
     * @param artistAddress Artist wallet
     * @return safeAddress Deployed Safe address
     */
    function _deploySafe(
        address agentEOA,
        address artistAddress
    ) internal returns (address safeAddress) {
        address[] memory owners = new address[](2);
        owners[0] = agentEOA;
        owners[1] = artistAddress;

        // Deploy 2-of-2 multisig
        safeAddress = ISafeFactory(safeFactory).createSafe(owners, 2);

        return safeAddress;
    }

    /**
     * @dev Create initial validation request
     * @param agentId Agent ID
     * @param validator Initial validator address
     * @param requestURI Request metadata URI
     * @return requestHash Generated request hash
     */
    function _createValidationRequest(
        uint256 agentId,
        address validator,
        string memory requestURI
    ) internal returns (bytes32 requestHash) {
        // Create initial validation request
        requestHash = validationRegistry.validationRequest(
            validator,
            agentId,
            requestURI,
            keccak256(abi.encodePacked(agentId, requestURI, block.timestamp))
        );

        return requestHash;
    }

    /**
     * @dev Seed initial reputation
     * @param agentId Agent ID
     * @param score Initial score
     * @param reputationURI Reputation metadata URI
     * @return feedbackIndex Created feedback index
     */
    function _seedReputation(
        uint256 agentId,
        uint8 score,
        string memory reputationURI
    ) internal returns (uint64 feedbackIndex) {
        // Add initial reputation entry
        feedbackIndex = reputationRegistry.giveFeedback(
            agentId,
            score,
            keccak256("initial"),
            keccak256("seed"),
            reputationURI,
            keccak256(abi.encodePacked(agentId, reputationURI)),
            "" // No signature for seed reputation
        );

        return feedbackIndex;
    }

    // ============ View Functions ============

    /**
     * @notice Get complete agent configuration
     * @param agentId Agent ID
     * @return config Agent setup configuration
     */
    function getAgentConfig(
        uint256 agentId
    ) external view returns (AgentSetupConfig memory config) {
        return agentConfigs[agentId];
    }

    /**
     * @notice Check if address is authorized setup operator
     * @param operator Address to check
     * @return authorized True if authorized
     */
    function isSetupOperator(address operator) external view returns (bool authorized) {
        return setupOperators[operator];
    }
}
