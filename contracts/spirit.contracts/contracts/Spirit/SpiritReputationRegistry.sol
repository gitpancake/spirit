// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISpiritReputation} from "./interfaces/ISpiritReputation.sol";
import {ISpiritIdentity} from "./interfaces/ISpiritIdentity.sol";

/**
 * @title SpiritReputationRegistry
 * @author Eden Platform
 * @notice ERC-8004 compliant reputation registry for Spirit synthetic artist agents
 * @dev Tracks feedback, ratings, and reputation scores with revocation support
 *
 * ARCHITECTURE:
 * - Linked to SpiritIdentityRegistry for agent verification
 * - Feedback scored 0-100 with dual tagging system
 * - Aggregated reputation summaries with filtering
 * - Support for feedback revocation by original submitter
 * - Gas-optimized storage with packed structs
 *
 * SECURITY:
 * - Reentrancy protection on all state-changing functions
 * - Only feedback submitter can revoke their own feedback
 * - Agent existence verified via identity registry
 * - Score validation (0-100 range)
 */
contract SpiritReputationRegistry is Ownable, ReentrancyGuard, ISpiritReputation {
    // ============ State Variables ============

    /// @notice Reference to the Spirit Identity Registry
    ISpiritIdentity public immutable identityRegistry;

    /// @notice Mapping from agent ID to array of feedback entries
    mapping(uint256 => Feedback[]) private _agentFeedback;

    /// @notice Mapping from agent ID to reputation statistics
    mapping(uint256 => ReputationStats) private _reputationStats;

    /// @notice Maximum score value (0-100)
    uint8 public constant MAX_SCORE = 100;

    // ============ Internal Structs ============

    /**
     * @notice Internal reputation statistics for gas-optimized tracking
     * @param totalFeedbackCount Total feedback entries (including revoked)
     * @param activeFeedbackCount Active (non-revoked) feedback entries
     * @param totalScore Sum of all active feedback scores
     * @param lastUpdated Timestamp of last feedback update
     */
    struct ReputationStats {
        uint128 totalFeedbackCount;
        uint128 activeFeedbackCount;
        uint256 totalScore;
        uint256 lastUpdated;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the Spirit Reputation Registry
     * @param _identityRegistry Address of the Spirit Identity Registry
     * @param _owner Address that will own the contract
     */
    constructor(address _identityRegistry, address _owner) Ownable(_owner) {
        if (_identityRegistry == address(0)) revert AgentNotFound(0);
        identityRegistry = ISpiritIdentity(_identityRegistry);
    }

    // ============ External Functions - Feedback ============

    /**
     * @notice Give feedback for an agent
     * @param agentId The agent receiving feedback
     * @param score Numerical score (0-100)
     * @param tag1 Primary categorization tag
     * @param tag2 Secondary categorization tag
     * @param feedbackURI URI to detailed feedback content
     * @param feedbackHash Hash of feedback content
     * @param feedbackAuth Optional authentication signature (unused in v1)
     * @return feedbackIndex Index of the new feedback entry
     */
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackURI,
        bytes32 feedbackHash,
        bytes memory feedbackAuth
    ) external nonReentrant returns (uint64 feedbackIndex) {
        // Validate inputs
        if (score > MAX_SCORE) revert InvalidScore(score);
        if (bytes(feedbackURI).length == 0) revert EmptyFeedbackURI();

        // Verify agent exists
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        // Create feedback entry
        Feedback memory newFeedback = Feedback({
            fromAddress: msg.sender,
            score: score,
            tag1: tag1,
            tag2: tag2,
            feedbackURI: feedbackURI,
            feedbackHash: feedbackHash,
            timestamp: block.timestamp,
            isRevoked: false
        });

        // Store feedback
        _agentFeedback[agentId].push(newFeedback);
        feedbackIndex = uint64(_agentFeedback[agentId].length - 1);

        // Update statistics
        ReputationStats storage stats = _reputationStats[agentId];
        stats.totalFeedbackCount++;
        stats.activeFeedbackCount++;
        stats.totalScore += score;
        stats.lastUpdated = block.timestamp;

        emit FeedbackGiven(agentId, feedbackIndex, msg.sender, score, tag1, tag2);

        // Note: feedbackAuth is for future compatibility with signed feedback
        return feedbackIndex;
    }

    /**
     * @notice Revoke previously given feedback
     * @dev Only the original feedback submitter can revoke
     * @param agentId The agent whose feedback to revoke
     * @param feedbackIndex Index of feedback to revoke
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external nonReentrant {
        // Verify agent exists
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        // Verify feedback exists
        if (feedbackIndex >= _agentFeedback[agentId].length) {
            revert FeedbackNotFound(agentId, feedbackIndex);
        }

        Feedback storage feedback = _agentFeedback[agentId][feedbackIndex];

        // Verify caller is the original submitter
        if (feedback.fromAddress != msg.sender) {
            revert UnauthorizedToRevoke(msg.sender);
        }

        // Check if already revoked
        if (feedback.isRevoked) {
            revert FeedbackNotFound(agentId, feedbackIndex);
        }

        // Mark as revoked
        feedback.isRevoked = true;

        // Update statistics
        ReputationStats storage stats = _reputationStats[agentId];
        stats.activeFeedbackCount--;
        stats.totalScore -= feedback.score;
        stats.lastUpdated = block.timestamp;

        emit FeedbackRevoked(agentId, feedbackIndex, msg.sender);
    }

    // ============ External View Functions ============

    /**
     * @notice Get reputation summary for an agent
     * @param agentId The agent's token ID
     * @param clientAddresses Optional array of specific addresses to filter by
     * @param tag1 Optional primary tag filter (0x0 for no filter)
     * @param tag2 Optional secondary tag filter (0x0 for no filter)
     * @return summary The aggregated reputation summary
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        bytes32 tag1,
        bytes32 tag2
    ) external view returns (ReputationSummary memory summary) {
        // Verify agent exists
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        Feedback[] storage feedbacks = _agentFeedback[agentId];

        uint256 filteredCount = 0;
        uint256 filteredTotalScore = 0;
        uint256 totalCount = 0;

        // Apply filters
        for (uint256 i = 0; i < feedbacks.length; i++) {
            Feedback storage feedback = feedbacks[i];

            if (!feedback.isRevoked) {
                totalCount++;

                // Check if this feedback matches filters
                bool matchesAddress = clientAddresses.length == 0 ||
                    _isAddressInArray(feedback.fromAddress, clientAddresses);
                bool matchesTag1 = tag1 == bytes32(0) || feedback.tag1 == tag1;
                bool matchesTag2 = tag2 == bytes32(0) || feedback.tag2 == tag2;

                if (matchesAddress && matchesTag1 && matchesTag2) {
                    filteredCount++;
                    filteredTotalScore += feedback.score;
                }
            }
        }

        // Calculate average
        uint256 averageScore = filteredCount > 0 ? filteredTotalScore / filteredCount : 0;

        return
            ReputationSummary({
                totalFeedbackCount: uint256(_reputationStats[agentId].totalFeedbackCount),
                activeFeedbackCount: totalCount,
                averageScore: averageScore,
                totalScore: filteredTotalScore,
                lastUpdated: _reputationStats[agentId].lastUpdated
            });
    }

    /**
     * @notice Get specific feedback entry
     * @param agentId The agent's token ID
     * @param feedbackIndex Index of the feedback entry
     * @return feedback The feedback entry
     */
    function getFeedback(
        uint256 agentId,
        uint64 feedbackIndex
    ) external view returns (Feedback memory feedback) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }
        if (feedbackIndex >= _agentFeedback[agentId].length) {
            revert FeedbackNotFound(agentId, feedbackIndex);
        }
        return _agentFeedback[agentId][feedbackIndex];
    }

    /**
     * @notice Get all feedback for an agent
     * @param agentId The agent's token ID
     * @param includeRevoked Whether to include revoked feedback
     * @return feedbacks Array of feedback entries
     */
    function getAllFeedback(
        uint256 agentId,
        bool includeRevoked
    ) external view returns (Feedback[] memory feedbacks) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        Feedback[] storage allFeedback = _agentFeedback[agentId];

        if (includeRevoked) {
            return allFeedback;
        }

        // Count active feedback
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allFeedback.length; i++) {
            if (!allFeedback[i].isRevoked) {
                activeCount++;
            }
        }

        // Build active feedback array
        feedbacks = new Feedback[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allFeedback.length; i++) {
            if (!allFeedback[i].isRevoked) {
                feedbacks[index++] = allFeedback[i];
            }
        }

        return feedbacks;
    }

    /**
     * @notice Get feedback count for an agent
     * @param agentId The agent's token ID
     * @return count Total number of feedback entries
     */
    function getFeedbackCount(uint256 agentId) external view returns (uint256 count) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }
        return _agentFeedback[agentId].length;
    }

    /**
     * @notice Get average score for an agent
     * @param agentId The agent's token ID
     * @return score Average score (0-100)
     */
    function getAverageScore(uint256 agentId) external view returns (uint256 score) {
        if (!identityRegistry.agentExists(agentId)) {
            revert AgentNotFound(agentId);
        }

        ReputationStats storage stats = _reputationStats[agentId];
        if (stats.activeFeedbackCount == 0) {
            return 0;
        }

        return stats.totalScore / uint256(stats.activeFeedbackCount);
    }

    // ============ Internal Functions ============

    /**
     * @dev Check if an address is in an array
     * @param addr Address to search for
     * @param addresses Array to search in
     * @return True if address is found
     */
    function _isAddressInArray(
        address addr,
        address[] calldata addresses
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < addresses.length; i++) {
            if (addresses[i] == addr) {
                return true;
            }
        }
        return false;
    }
}
