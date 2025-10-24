// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRewardDistributor
 * @notice Interface for gas-efficient Merkle tree reward distribution
 * @dev Implements massive gas savings: ~47K per claim vs ~100K+ traditional
 *
 * GAS SAVINGS:
 * - Traditional airdrop: ~100K+ gas per recipient
 * - Merkle claim: ~47K gas per recipient
 * - Savings: ~53K gas per claim
 * - With 1,000 users: 53M gas saved!
 *
 * BITMAP EFFICIENCY:
 * - Stores 256 claim statuses in single storage slot
 * - ~20K gas to mark claimed (vs ~20K per bool)
 * - Massive savings for large distributions
 */
interface IRewardDistributor {
    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Token type for reward distribution
     */
    enum TokenType {
        BASED,  // BASED token rewards
        TECH    // TECH token rewards
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Distribution period information
     * @param merkleRoot Merkle root for this period
     * @param totalAmount Total amount distributed in period
     * @param metadataURI IPFS URI with distribution details
     * @param publishedAt Timestamp when published
     * @param tokenType Type of token being distributed
     */
    struct DistributionPeriod {
        bytes32 merkleRoot;
        uint256 totalAmount;
        string metadataURI;
        uint256 publishedAt;
        TokenType tokenType;
    }

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a new distribution period is published
     * @param periodId ID of the distribution period
     * @param merkleRoot Merkle root for verification
     * @param totalAmount Total amount being distributed
     * @param metadataURI IPFS URI with full distribution data
     * @param tokenType Type of token being distributed
     */
    event DistributionPublished(
        uint256 indexed periodId,
        bytes32 indexed merkleRoot,
        uint256 totalAmount,
        string metadataURI,
        TokenType tokenType
    );

    /**
     * @notice Emitted when a user claims rewards
     * @param periodId Distribution period
     * @param index User's index in Merkle tree
     * @param account Address receiving rewards
     * @param amount Amount claimed
     * @param tokenType Type of token claimed
     */
    event Claimed(
        uint256 indexed periodId,
        uint256 indexed index,
        address indexed account,
        uint256 amount,
        TokenType tokenType
    );

    /**
     * @notice Emitted when multiple periods are claimed in batch
     * @param account Address receiving rewards
     * @param periodIds Array of period IDs claimed
     * @param totalAmount Total amount claimed across all periods
     */
    event BatchClaimed(
        address indexed account,
        uint256[] periodIds,
        uint256 totalAmount
    );

    /*//////////////////////////////////////////////////////////////
                          CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Publish a new distribution period
     * @dev Only callable by authorized distributor
     * @param merkleRoot Merkle root for reward verification
     * @param totalAmount Total amount being distributed
     * @param metadataURI IPFS URI with distribution details
     * @param tokenType Type of token being distributed
     * @return periodId The ID of the newly created period
     */
    function publishDistribution(
        bytes32 merkleRoot,
        uint256 totalAmount,
        string calldata metadataURI,
        TokenType tokenType
    ) external returns (uint256 periodId);

    /**
     * @notice Claim rewards for a single period
     * @dev Verifies Merkle proof and transfers tokens (~47K gas!)
     * @param periodId Distribution period to claim from
     * @param index User's index in the Merkle tree
     * @param account Address to receive rewards
     * @param amount Amount of rewards to claim
     * @param merkleProof Merkle proof for verification
     */
    function claim(
        uint256 periodId,
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @notice Claim rewards across multiple periods in one transaction
     * @dev Gas-efficient batch claiming
     * @param periodIds Array of period IDs to claim from
     * @param indices Array of user indices
     * @param amounts Array of reward amounts
     * @param merkleProofs Array of Merkle proofs
     */
    function claimMultiplePeriods(
        uint256[] calldata periodIds,
        uint256[] calldata indices,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if a claim has been made for a specific period and index
     * @param periodId Distribution period ID
     * @param index User's index in the Merkle tree
     * @return claimed True if already claimed
     */
    function isClaimed(uint256 periodId, uint256 index) external view returns (bool);

    /**
     * @notice Get distribution period details
     * @param periodId Period ID to query
     * @return period The distribution period information
     */
    function getDistributionPeriod(uint256 periodId) external view returns (DistributionPeriod memory);

    /**
     * @notice Get current period count
     * @return count Total number of distribution periods
     */
    function periodCount() external view returns (uint256);

    /**
     * @notice Get total amount claimed by an address across all periods
     * @param account Address to check
     * @return totalBasedClaimed Total BASED tokens claimed
     * @return totalTechClaimed Total TECH tokens claimed
     */
    function getTotalClaimed(address account) external view returns (uint256 totalBasedClaimed, uint256 totalTechClaimed);

    /**
     * @notice Check if multiple claims have been made
     * @param periodIds Array of period IDs
     * @param indices Array of indices
     * @return claimedStatus Array of booleans indicating claim status
     */
    function areClaimedBatch(
        uint256[] calldata periodIds,
        uint256[] calldata indices
    ) external view returns (bool[] memory claimedStatus);
}
