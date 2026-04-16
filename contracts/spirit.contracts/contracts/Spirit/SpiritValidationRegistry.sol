// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISpiritValidation} from "./interfaces/ISpiritValidation.sol";
import {ISpiritIdentity} from "./interfaces/ISpiritIdentity.sol";

/**
 * @title SpiritValidationRegistry
 * @author Eden Platform
 * @notice ERC-8004 compliant validation registry for Spirit synthetic artist agents
 * @dev Handles validation requests and responses for agent credentials/capabilities
 *
 * ARCHITECTURE:
 * - Linked to SpiritIdentityRegistry for agent verification
 * - Validators respond to validation requests
 * - Request-response pattern with unique hashing
 * - Supports categorization via tags
 * - Tracks validation history per agent
 *
 * SECURITY:
 * - Reentrancy protection on all state-changing functions
 * - Only designated validators can respond
 * - Request hashing prevents duplicate requests
 * - Response codes validated (0=pending, 1=approved, 2=rejected)
 */
contract SpiritValidationRegistry is Ownable, ReentrancyGuard, ISpiritValidation {
    // ============ State Variables ============

    /// @notice Reference to the Spirit Identity Registry
    ISpiritIdentity public immutable identityRegistry;

    /// @notice Mapping from request hash to validation request
    mapping(bytes32 => ValidationRequest) private _requests;

    /// @notice Mapping from request hash to validation response
    mapping(bytes32 => ValidationResponse) private _responses;

    /// @notice Mapping from agent ID to array of request hashes
    mapping(uint256 => bytes32[]) private _agentValidations;

    /// @notice Mapping from validator address to array of request hashes
    mapping(address => bytes32[]) private _validatorRequests;

    /// @notice Counter for total validation requests
    uint256 public totalRequests;

    /// @notice Counter for approved validations
    uint256 public totalApproved;

    /// @notice Counter for rejected validations
    uint256 public totalRejected;

    // ============ Constructor ============

    /**
     * @notice Initialize the Spirit Validation Registry
     * @param _identityRegistry Address of the Spirit Identity Registry
     * @param _owner Address that will own the contract
     */
    constructor(address _identityRegistry, address _owner) Ownable(_owner) {
        if (_identityRegistry == address(0)) revert AgentNotFound(0);
        identityRegistry = ISpiritIdentity(_identityRegistry);
    }

    // ============ External Functions - Validation Requests ============

    /**
     * @notice Create a validation request for an agent
     * @param validatorAddress Address of the validator to request from
     * @param agentId The agent to validate
     * @param requestURI URI to validation request details
     * @param requestHash Hash of request content
     * @return requestHashGenerated The generated request hash
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external nonReentrant returns (bytes32 requestHashGenerated) {
        // Validate inputs
        if (validatorAddress == address(0)) revert InvalidValidatorAddress();
        if (bytes(requestURI).length == 0) revert EmptyRequestURI();

        // Verify agent exists
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        // Generate unique request hash
        requestHashGenerated = keccak256(
            abi.encodePacked(agentId, msg.sender, validatorAddress, requestHash, block.timestamp)
        );

        // Check if request already exists
        if (_requests[requestHashGenerated].createdAt != 0) {
            revert("ValidationRegistry: Request already exists");
        }

        // Create validation request
        _requests[requestHashGenerated] = ValidationRequest({
            agentId: agentId,
            requester: msg.sender,
            validatorAddress: validatorAddress,
            requestURI: requestURI,
            requestHash: requestHash,
            createdAt: block.timestamp,
            status: ValidationStatus.Pending
        });

        // Update mappings
        _agentValidations[agentId].push(requestHashGenerated);
        _validatorRequests[validatorAddress].push(requestHashGenerated);
        totalRequests++;

        emit ValidationRequested(
            requestHashGenerated,
            agentId,
            msg.sender,
            validatorAddress,
            requestURI
        );

        return requestHashGenerated;
    }

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
    ) external nonReentrant {
        // Validate inputs
        if (
            response != uint8(ValidationStatus.Approved) &&
            response != uint8(ValidationStatus.Rejected)
        ) {
            revert InvalidResponseCode(response);
        }
        if (bytes(responseURI).length == 0) revert EmptyResponseURI();

        // Get request
        ValidationRequest storage request = _requests[requestHash];
        if (request.createdAt == 0) {
            revert ValidationRequestNotFound(requestHash);
        }

        // Check if already responded
        if (request.status != ValidationStatus.Pending) {
            revert ValidationAlreadyResponded(requestHash);
        }

        // Verify caller is the designated validator
        if (msg.sender != request.validatorAddress) {
            revert UnauthorizedValidator(msg.sender);
        }

        // Update request status
        ValidationStatus status = ValidationStatus(response);
        request.status = status;

        // Create response
        _responses[requestHash] = ValidationResponse({
            requestHash: requestHash,
            validator: msg.sender,
            response: status,
            responseURI: responseURI,
            responseHash: responseHash,
            tag: tag,
            respondedAt: block.timestamp
        });

        // Update counters
        if (status == ValidationStatus.Approved) {
            totalApproved++;
        } else if (status == ValidationStatus.Rejected) {
            totalRejected++;
        }

        emit ValidationResponded(
            requestHash,
            request.agentId,
            msg.sender,
            response,
            responseURI,
            tag
        );
    }

    // ============ External View Functions ============

    /**
     * @notice Get validation request details
     * @param requestHash Hash of the validation request
     * @return request The validation request data
     */
    function getValidationRequest(
        bytes32 requestHash
    ) external view returns (ValidationRequest memory request) {
        request = _requests[requestHash];
        if (request.createdAt == 0) {
            revert ValidationRequestNotFound(requestHash);
        }
        return request;
    }

    /**
     * @notice Get validation response details
     * @param requestHash Hash of the validation request
     * @return response The validation response data
     */
    function getValidationResponse(
        bytes32 requestHash
    ) external view returns (ValidationResponse memory response) {
        // Verify request exists
        if (_requests[requestHash].createdAt == 0) {
            revert ValidationRequestNotFound(requestHash);
        }

        response = _responses[requestHash];

        // Response might not exist yet (still pending)
        if (response.respondedAt == 0) {
            revert("ValidationRegistry: Response not yet provided");
        }

        return response;
    }

    /**
     * @notice Get all validation requests for an agent
     * @param agentId The agent's token ID
     * @return requests Array of validation requests
     */
    function getAgentValidations(
        uint256 agentId
    ) external view returns (ValidationRequest[] memory requests) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        bytes32[] storage requestHashes = _agentValidations[agentId];
        requests = new ValidationRequest[](requestHashes.length);

        for (uint256 i = 0; i < requestHashes.length; i++) {
            requests[i] = _requests[requestHashes[i]];
        }

        return requests;
    }

    /**
     * @notice Get approved validations count for an agent
     * @param agentId The agent's token ID
     * @return count Number of approved validations
     */
    function getApprovedValidationsCount(uint256 agentId) external view returns (uint256 count) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        bytes32[] storage requestHashes = _agentValidations[agentId];

        for (uint256 i = 0; i < requestHashes.length; i++) {
            if (_requests[requestHashes[i]].status == ValidationStatus.Approved) {
                count++;
            }
        }

        return count;
    }

    /**
     * @notice Check if a specific validation is approved
     * @param requestHash Hash of the validation request
     * @return True if validation is approved
     */
    function isValidationApproved(bytes32 requestHash) external view returns (bool) {
        ValidationRequest storage request = _requests[requestHash];
        if (request.createdAt == 0) {
            revert ValidationRequestNotFound(requestHash);
        }
        return request.status == ValidationStatus.Approved;
    }

    /**
     * @notice Get all validations by a specific validator
     * @param validatorAddress The validator's address
     * @return requests Array of validation requests
     */
    function getValidationsByValidator(
        address validatorAddress
    ) external view returns (ValidationRequest[] memory requests) {
        bytes32[] storage requestHashes = _validatorRequests[validatorAddress];
        requests = new ValidationRequest[](requestHashes.length);

        for (uint256 i = 0; i < requestHashes.length; i++) {
            requests[i] = _requests[requestHashes[i]];
        }

        return requests;
    }

    // ============ Public View Functions ============

    /**
     * @notice Get total pending validations
     * @return count Number of pending validations
     */
    function getTotalPending() public view returns (uint256 count) {
        return totalRequests - totalApproved - totalRejected;
    }
}
