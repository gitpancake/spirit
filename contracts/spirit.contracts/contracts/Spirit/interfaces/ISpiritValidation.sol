// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ISpiritValidation
 * @notice ERC-8004 compliant interface for Spirit Agent validation management
 * @dev Handles validation requests and responses for agent credentials/capabilities
 */
interface ISpiritValidation {
    // ============ Events ============

    /**
     * @notice Emitted when a validation request is created
     * @param requestHash Unique hash identifying this request
     * @param agentId The agent being validated
     * @param requester Address requesting validation
     * @param validatorAddress Address of the validator
     * @param requestURI URI to validation request details
     */
    event ValidationRequested(
        bytes32 indexed requestHash,
        uint256 indexed agentId,
        address indexed requester,
        address validatorAddress,
        string requestURI
    );

    /**
     * @notice Emitted when a validation response is provided
     * @param requestHash Hash of the original request
     * @param agentId The agent that was validated
     * @param validator Address of the validator
     * @param response Validation response code (0=pending, 1=approved, 2=rejected)
     * @param responseURI URI to validation response details
     * @param tag Categorization tag for this validation
     */
    event ValidationResponded(
        bytes32 indexed requestHash,
        uint256 indexed agentId,
        address indexed validator,
        uint8 response,
        string responseURI,
        bytes32 tag
    );

    // ============ Errors ============

    error InvalidValidatorAddress();
    error EmptyRequestURI();
    error EmptyResponseURI();
    error ValidationRequestNotFound(bytes32 requestHash);
    error ValidationAlreadyResponded(bytes32 requestHash);
    error UnauthorizedValidator(address caller);
    error InvalidResponseCode(uint8 response);
    error AgentNotFound(uint256 agentId);

    // ============ Enums ============

    /**
     * @notice Validation response status codes
     */
    enum ValidationStatus {
        Pending, // 0: Validation request pending
        Approved, // 1: Validation approved
        Rejected // 2: Validation rejected
    }

    // ============ Structs ============

    /**
     * @notice Validation request data
     * @param agentId The agent being validated
     * @param requester Address requesting validation
     * @param validatorAddress Address of the validator
     * @param requestURI URI to validation request details
     * @param requestHash Hash of request content
     * @param createdAt Timestamp when request was created
     * @param status Current validation status
     */
    struct ValidationRequest {
        uint256 agentId;
        address requester;
        address validatorAddress;
        string requestURI;
        bytes32 requestHash;
        uint256 createdAt;
        ValidationStatus status;
    }

    /**
     * @notice Validation response data
     * @param requestHash Hash of the original request
     * @param validator Address of the validator
     * @param response Validation response status
     * @param responseURI URI to validation response details
     * @param responseHash Hash of response content
     * @param tag Categorization tag
     * @param respondedAt Timestamp when response was provided
     */
    struct ValidationResponse {
        bytes32 requestHash;
        address validator;
        ValidationStatus response;
        string responseURI;
        bytes32 responseHash;
        bytes32 tag;
        uint256 respondedAt;
    }

    // ============ View Functions ============

    /**
     * @notice Get validation request details
     * @param requestHash Hash of the validation request
     * @return request The validation request data
     */
    function getValidationRequest(
        bytes32 requestHash
    ) external view returns (ValidationRequest memory request);

    /**
     * @notice Get validation response details
     * @param requestHash Hash of the validation request
     * @return response The validation response data
     */
    function getValidationResponse(
        bytes32 requestHash
    ) external view returns (ValidationResponse memory response);

    /**
     * @notice Get all validation requests for an agent
     * @param agentId The agent's token ID
     * @return requests Array of validation requests
     */
    function getAgentValidations(
        uint256 agentId
    ) external view returns (ValidationRequest[] memory requests);

    /**
     * @notice Get approved validations count for an agent
     * @param agentId The agent's token ID
     * @return count Number of approved validations
     */
    function getApprovedValidationsCount(uint256 agentId) external view returns (uint256 count);

    /**
     * @notice Check if a specific validation is approved
     * @param requestHash Hash of the validation request
     * @return True if validation is approved
     */
    function isValidationApproved(bytes32 requestHash) external view returns (bool);

    /**
     * @notice Get all validations by a specific validator
     * @param validatorAddress The validator's address
     * @return requests Array of validation requests
     */
    function getValidationsByValidator(
        address validatorAddress
    ) external view returns (ValidationRequest[] memory requests);

    // ============ State-Changing Functions ============

    /**
     * @notice Create a validation request for an agent
     * @param validatorAddress Address of the validator to request from
     * @param agentId The agent to validate
     * @param requestURI URI to validation request details
     * @param requestHash Hash of request content
     * @return requestHash The generated request hash
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external returns (bytes32);

    /**
     * @notice Respond to a validation request
     * @param requestHash Hash of the original request
     * @param response Validation response code (1=approved, 2=rejected)
     * @param responseURI URI to validation response details
     * @param responseHash Hash of response content
     * @param tag Categorization tag for this validation
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        bytes32 tag
    ) external;
}
