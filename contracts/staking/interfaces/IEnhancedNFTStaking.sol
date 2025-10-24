// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEnhancedNFTStaking
 * @notice Interface for NFT staking with deterministic rarity and voting power
 * @dev Implements revolutionary gas-efficient deterministic rarity system
 */
interface IEnhancedNFTStaking {
    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice NFT rarity tiers (deterministic based on token ID)
     */
    enum RarityTier {
        COMMON,     // 70% of NFTs
        UNCOMMON,   // 20% of NFTs
        RARE,       // 8% of NFTs
        EPIC,       // 1.8% of NFTs
        LEGENDARY   // 0.2% of NFTs
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Staking information for a token
     * @param owner Owner of the staked NFT
     * @param tokenId ID of the staked NFT
     * @param stakedAt Timestamp when staked
     * @param rarity Deterministic rarity tier
     * @param votingPower Calculated voting power
     */
    struct StakeInfo {
        address owner;
        uint256 tokenId;
        uint256 stakedAt;
        RarityTier rarity;
        uint256 votingPower;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when an NFT is staked
     * @param owner Address staking the NFT
     * @param tokenId ID of the NFT
     * @param rarity Deterministic rarity tier
     * @param votingPower Calculated voting power
     */
    event NFTStaked(
        address indexed owner,
        uint256 indexed tokenId,
        RarityTier rarity,
        uint256 votingPower
    );

    /**
     * @notice Emitted when multiple NFTs are staked in batch
     * @param owner Address staking the NFTs
     * @param tokenIds Array of token IDs
     * @param totalVotingPower Total voting power gained
     */
    event BatchNFTsStaked(
        address indexed owner,
        uint256[] tokenIds,
        uint256 totalVotingPower
    );

    /**
     * @notice Emitted when an NFT is unstaked
     * @param owner Address unstaking the NFT
     * @param tokenId ID of the NFT
     * @param votingPower Voting power lost
     */
    event NFTUnstaked(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 votingPower
    );

    /**
     * @notice Emitted when multiple NFTs are unstaked in batch
     * @param owner Address unstaking the NFTs
     * @param tokenIds Array of token IDs
     * @param totalVotingPower Total voting power lost
     */
    event BatchNFTsUnstaked(
        address indexed owner,
        uint256[] tokenIds,
        uint256 totalVotingPower
    );

    /**
     * @notice Emitted when emergency unstake is triggered
     * @param owner Address unstaking
     * @param tokenIds Array of token IDs
     */
    event EmergencyUnstake(address indexed owner, uint256[] tokenIds);

    /**
     * @notice Emitted when voting power is recalculated
     * @param owner Address whose power was recalculated
     * @param newVotingPower New total voting power
     */
    event VotingPowerUpdated(address indexed owner, uint256 newVotingPower);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Stake a single NFT
     * @param tokenId ID of the NFT to stake
     */
    function stakeNFT(uint256 tokenId) external;

    /**
     * @notice Stake multiple NFTs in a single transaction (gas savings!)
     * @param tokenIds Array of token IDs to stake
     * @dev Batch operation for significant gas savings
     */
    function batchStakeNFTs(uint256[] calldata tokenIds) external;

    /**
     * @notice Unstake a single NFT
     * @param tokenId ID of the NFT to unstake
     */
    function unstakeNFT(uint256 tokenId) external;

    /**
     * @notice Unstake multiple NFTs in a single transaction
     * @param tokenIds Array of token IDs to unstake
     */
    function batchUnstakeNFTs(uint256[] calldata tokenIds) external;

    /**
     * @notice Emergency unstake all NFTs (no rewards)
     * @dev For emergency situations only
     */
    function emergencyUnstakeAll() external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Calculate deterministic rarity for a token ID
     * @param tokenId Token ID to check
     * @return rarity The deterministic rarity tier
     * @dev Revolutionary: Rarity determined by token ID math, not storage!
     */
    function calculateRarity(uint256 tokenId) external pure returns (RarityTier rarity);

    /**
     * @notice Calculate voting power for a token
     * @param tokenId Token ID to check
     * @return votingPower Calculated voting power
     */
    function calculateVotingPower(uint256 tokenId) external view returns (uint256 votingPower);

    /**
     * @notice Get total voting power for an address
     * @param user Address to check
     * @return totalPower Total voting power
     * @dev Cached for gas efficiency
     */
    function getVotingPower(address user) external view returns (uint256 totalPower);

    /**
     * @notice Get all staked tokens for an address
     * @param user Address to query
     * @return tokenIds Array of staked token IDs
     */
    function getStakedTokens(address user) external view returns (uint256[] memory tokenIds);

    /**
     * @notice Get detailed stake information for a token
     * @param tokenId Token ID to query
     * @return stakeInfo Complete stake information
     */
    function getStakeInfo(uint256 tokenId) external view returns (StakeInfo memory stakeInfo);

    /**
     * @notice Get number of NFTs staked by an address
     * @param user Address to check
     * @return count Number of staked NFTs
     */
    function getStakedCount(address user) external view returns (uint256 count);

    /**
     * @notice Check if a token is staked
     * @param tokenId Token ID to check
     * @return isStaked True if staked
     */
    function isTokenStaked(uint256 tokenId) external view returns (bool isStaked);

    /**
     * @notice Get rarity distribution statistics
     * @return commonCount Number of common NFTs staked
     * @return uncommonCount Number of uncommon NFTs staked
     * @return rareCount Number of rare NFTs staked
     * @return epicCount Number of epic NFTs staked
     * @return legendaryCount Number of legendary NFTs staked
     */
    function getRarityDistribution()
        external
        view
        returns (
            uint256 commonCount,
            uint256 uncommonCount,
            uint256 rareCount,
            uint256 epicCount,
            uint256 legendaryCount
        );

    /**
     * @notice Get total staked NFTs across all users
     * @return total Total number of staked NFTs
     */
    function getTotalStaked() external view returns (uint256 total);

    /**
     * @notice Get voting power multiplier for a rarity tier
     * @param rarity Rarity tier
     * @return multiplier Voting power multiplier
     */
    function getRarityMultiplier(RarityTier rarity) external pure returns (uint256 multiplier);
}
