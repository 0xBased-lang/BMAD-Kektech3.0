// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRewardDistributor
 * @notice Interface for efficient reward distribution using Merkle trees
 * @dev Implements off-chain computation with on-chain verification for massive gas savings
 */
interface IRewardDistributor {
    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Reward period information
     * @param periodId Unique period identifier
     * @param merkleRoot Root hash of the Merkle tree
     * @param totalRewards Total rewards for this period
     * @param ipfsHash IPFS hash of full reward data
     * @param startTime Period start timestamp
     * @param endTime Period end timestamp
     * @param basedTokenAmount BASED token rewards
     * @param nativeTokenAmount Native token rewards (if any)
     */
    struct RewardPeriod {
        uint256 periodId;
        bytes32 merkleRoot;
        uint256 totalRewards;
        string ipfsHash;
        uint256 startTime;
        uint256 endTime;
        uint256 basedTokenAmount;
        uint256 nativeTokenAmount;
    }

    /**
     * @notice Claim information for tracking
     * @param claimed Whether rewards were claimed
     * @param amount Amount claimed
     * @param claimedAt Timestamp when claimed
     */
    struct ClaimInfo {
        bool claimed;
        uint256 amount;
        uint256 claimedAt;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new reward period is published
     * @param periodId ID of the period
     * @param merkleRoot Root of the Merkle tree
     * @param totalRewards Total reward amount
     * @param ipfsHash IPFS hash for transparency
     */
    event RewardPeriodPublished(
        uint256 indexed periodId,
        bytes32 merkleRoot,
        uint256 totalRewards,
        string ipfsHash
    );

    /**
     * @notice Emitted when rewards are claimed
     * @param periodId ID of the period
     * @param user Address claiming rewards
     * @param basedAmount BASED token amount claimed
     * @param nativeAmount Native token amount claimed
     */
    event RewardsClaimed(
        uint256 indexed periodId,
        address indexed user,
        uint256 basedAmount,
        uint256 nativeAmount
    );

    /**
     * @notice Emitted when multiple periods are claimed at once
     * @param user Address claiming rewards
     * @param periodIds Array of period IDs
     * @param totalBasedAmount Total BASED tokens claimed
     * @param totalNativeAmount Total native tokens claimed
     */
    event BatchRewardsClaimed(
        address indexed user,
        uint256[] periodIds,
        uint256 totalBasedAmount,
        uint256 totalNativeAmount
    );

    /**
     * @notice Emitted when rewards are deposited
     * @param periodId ID of the period
     * @param basedAmount BASED token amount
     * @param nativeAmount Native token amount
     */
    event RewardsDeposited(
        uint256 indexed periodId,
        uint256 basedAmount,
        uint256 nativeAmount
    );

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Publish a new reward period with Merkle root
     * @param merkleRoot Root hash of the reward Merkle tree
     * @param totalRewards Total rewards for this period
     * @param ipfsHash IPFS hash of complete reward data
     * @param basedTokenAmount BASED token rewards
     * @param nativeTokenAmount Native token rewards
     * @return periodId ID of the created period
     * @dev Only callable by authorized distributor
     */
    function publishRewardPeriod(
        bytes32 merkleRoot,
        uint256 totalRewards,
        string calldata ipfsHash,
        uint256 basedTokenAmount,
        uint256 nativeTokenAmount
    ) external returns (uint256 periodId);

    /**
     * @notice Claim rewards for a single period
     * @param periodId ID of the reward period
     * @param basedAmount Amount of BASED tokens to claim
     * @param nativeAmount Amount of native tokens to claim
     * @param merkleProof Merkle proof for verification
     * @dev Verifies proof against stored Merkle root
     */
    function claimRewards(
        uint256 periodId,
        uint256 basedAmount,
        uint256 nativeAmount,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @notice Claim rewards for multiple periods in one transaction (gas savings!)
     * @param periodIds Array of period IDs
     * @param basedAmounts Array of BASED token amounts
     * @param nativeAmounts Array of native token amounts
     * @param merkleProofs Array of Merkle proofs
     * @dev Batch operation for massive gas savings
     */
    function batchClaimRewards(
        uint256[] calldata periodIds,
        uint256[] calldata basedAmounts,
        uint256[] calldata nativeAmounts,
        bytes32[][] calldata merkleProofs
    ) external;

    /**
     * @notice Deposit rewards for a period
     * @param periodId ID of the period
     * @dev Transfers tokens from sender to contract
     */
    function depositRewards(uint256 periodId) external payable;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get reward period information
     * @param periodId ID of the period
     * @return period Complete period information
     */
    function getRewardPeriod(uint256 periodId)
        external
        view
        returns (RewardPeriod memory period);

    /**
     * @notice Check if user has claimed rewards for a period
     * @param periodId ID of the period
     * @param user Address to check
     * @return claimed True if already claimed
     */
    function hasClaimed(uint256 periodId, address user)
        external
        view
        returns (bool claimed);

    /**
     * @notice Get claim information for a user in a period
     * @param periodId ID of the period
     * @param user Address to check
     * @return claimInfo Complete claim information
     */
    function getClaimInfo(uint256 periodId, address user)
        external
        view
        returns (ClaimInfo memory claimInfo);

    /**
     * @notice Verify a Merkle proof without claiming
     * @param periodId ID of the period
     * @param user Address to verify
     * @param basedAmount BASED token amount
     * @param nativeAmount Native token amount
     * @param merkleProof Merkle proof
     * @return isValid True if proof is valid
     * @dev Useful for frontend validation
     */
    function verifyProof(
        uint256 periodId,
        address user,
        uint256 basedAmount,
        uint256 nativeAmount,
        bytes32[] calldata merkleProof
    ) external view returns (bool isValid);

    /**
     * @notice Get total number of reward periods
     * @return count Total periods
     */
    function getPeriodCount() external view returns (uint256 count);

    /**
     * @notice Get current active period ID
     * @return periodId Current period (0 if none)
     */
    function getCurrentPeriod() external view returns (uint256 periodId);

    /**
     * @notice Get total rewards distributed
     * @return total Total rewards ever distributed
     */
    function getTotalDistributed() external view returns (uint256 total);

    /**
     * @notice Get unclaimed rewards for a period
     * @param periodId ID of the period
     * @return unclaimed Unclaimed reward amount
     */
    function getUnclaimedRewards(uint256 periodId)
        external
        view
        returns (uint256 unclaimed);
}
