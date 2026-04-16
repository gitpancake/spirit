// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ISpiritReputation
 * @notice ERC-8004 compliant interface for Spirit Agent reputation management
 * @dev Tracks feedback, ratings, and reputation scores for agents
 */
interface ISpiritReputation {
    // ============ Events ============

    /**
     * @notice Emitted when feedback is given for an agent
     * @param agentId The agent receiving feedback
     * @param feedbackIndex Index of this feedback entry
     * @param fromAddress Address giving the feedback
     * @param score Numerical score (0-100)
     * @param tag1 Primary categorization tag
     * @param tag2 Secondary categorization tag
     */
    event FeedbackGiven(
        uint256 indexed agentId,
        uint64 indexed feedbackIndex,
        address indexed fromAddress,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2
    );

    /**
     * @notice Emitted when feedback is revoked
     * @param agentId The agent whose feedback was revoked
     * @param feedbackIndex Index of revoked feedback
     * @param revokedBy Address that revoked the feedback
     */
    event FeedbackRevoked(
        uint256 indexed agentId,
        uint64 indexed feedbackIndex,
        address indexed revokedBy
    );

    // ============ Errors ============

    error InvalidScore(uint8 score);
    error EmptyFeedbackURI();
    error FeedbackNotFound(uint256 agentId, uint64 feedbackIndex);
    error UnauthorizedToRevoke(address caller);
    error AgentNotFound(uint256 agentId);

    // ============ Structs ============

    /**
     * @notice Individual feedback entry
     * @param fromAddress Address that provided feedback
     * @param score Numerical score (0-100)
     * @param tag1 Primary categorization tag (e.g., "quality", "collaboration")
     * @param tag2 Secondary categorization tag
     * @param feedbackURI URI to detailed feedback content
     * @param feedbackHash Hash of feedback content for verification
     * @param timestamp When feedback was given
     * @param isRevoked Whether this feedback has been revoked
     */
    struct Feedback {
        address fromAddress;
        uint8 score;
        bytes32 tag1;
        bytes32 tag2;
        string feedbackURI;
        bytes32 feedbackHash;
        uint256 timestamp;
        bool isRevoked;
    }

    /**
     * @notice Aggregated reputation summary
     * @param totalFeedbackCount Total number of feedback entries (including revoked)
     * @param activeFeedbackCount Number of active (non-revoked) feedback entries
     * @param averageScore Average score across all active feedback
     * @param totalScore Sum of all active feedback scores
     * @param lastUpdated Timestamp of last feedback update
     */
    struct ReputationSummary {
        uint256 totalFeedbackCount;
        uint256 activeFeedbackCount;
        uint256 averageScore;
        uint256 totalScore;
        uint256 lastUpdated;
    }

    // ============ View Functions ============

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
    ) external view returns (ReputationSummary memory summary);

    /**
     * @notice Get specific feedback entry
     * @param agentId The agent's token ID
     * @param feedbackIndex Index of the feedback entry
     * @return feedback The feedback entry
     */
    function getFeedback(
        uint256 agentId,
        uint64 feedbackIndex
    ) external view returns (Feedback memory feedback);

    /**
     * @notice Get all feedback for an agent
     * @param agentId The agent's token ID
     * @param includeRevoked Whether to include revoked feedback
     * @return feedbacks Array of feedback entries
     */
    function getAllFeedback(
        uint256 agentId,
        bool includeRevoked
    ) external view returns (Feedback[] memory feedbacks);

    /**
     * @notice Get feedback count for an agent
     * @param agentId The agent's token ID
     * @return count Total number of feedback entries
     */
    function getFeedbackCount(uint256 agentId) external view returns (uint256 count);

    /**
     * @notice Get average score for an agent
     * @param agentId The agent's token ID
     * @return score Average score (0-100)
     */
    function getAverageScore(uint256 agentId) external view returns (uint256 score);

    // ============ State-Changing Functions ============

    /**
     * @notice Give feedback for an agent
     * @param agentId The agent receiving feedback
     * @param score Numerical score (0-100)
     * @param tag1 Primary categorization tag
     * @param tag2 Secondary categorization tag
     * @param feedbackURI URI to detailed feedback content
     * @param feedbackHash Hash of feedback content
     * @param feedbackAuth Optional authentication signature
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
    ) external returns (uint64 feedbackIndex);

    /**
     * @notice Revoke previously given feedback
     * @param agentId The agent whose feedback to revoke
     * @param feedbackIndex Index of feedback to revoke
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;
}
