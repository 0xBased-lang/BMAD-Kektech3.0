// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBondManager
 * @notice Interface for managing economic bonds for spam prevention
 * @dev Separate contract for cleaner separation of concerns
 */
interface IBondManager {
    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Bond status
     */
    enum BondStatus {
        LOCKED,     // Bond is locked
        REFUNDABLE, // Bond can be refunded
        FORFEITED   // Bond was forfeited
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Bond information
     * @param depositor Address that deposited the bond
     * @param amount Bond amount
     * @param lockedAt Timestamp when locked
     * @param unlockTime Earliest unlock time
     * @param status Current status
     * @param purpose Purpose of the bond
     */
    struct BondInfo {
        address depositor;
        uint256 amount;
        uint256 lockedAt;
        uint256 unlockTime;
        BondStatus status;
        string purpose;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a bond is deposited
     * @param bondId ID of the bond
     * @param depositor Address depositing the bond
     * @param amount Bond amount
     * @param purpose Purpose of the bond
     */
    event BondDeposited(
        uint256 indexed bondId,
        address indexed depositor,
        uint256 amount,
        string purpose
    );

    /**
     * @notice Emitted when a bond is refunded
     * @param bondId ID of the bond
     * @param depositor Address receiving refund
     * @param amount Refund amount
     */
    event BondRefunded(
        uint256 indexed bondId,
        address indexed depositor,
        uint256 amount
    );

    /**
     * @notice Emitted when a bond is forfeited
     * @param bondId ID of the bond
     * @param depositor Address whose bond was forfeited
     * @param amount Forfeited amount
     * @param reason Reason for forfeiture
     */
    event BondForfeited(
        uint256 indexed bondId,
        address indexed depositor,
        uint256 amount,
        string reason
    );

    /**
     * @notice Emitted when bond parameters are updated
     * @param purpose Bond purpose
     * @param newAmount New required amount
     * @param newLockDuration New lock duration
     */
    event BondParametersUpdated(
        string purpose,
        uint256 newAmount,
        uint256 newLockDuration
    );

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Deposit a bond
     * @param amount Bond amount
     * @param purpose Purpose of the bond
     * @param lockDuration Duration to lock the bond
     * @return bondId ID of the created bond
     */
    function depositBond(
        uint256 amount,
        string calldata purpose,
        uint256 lockDuration
    ) external returns (uint256 bondId);

    /**
     * @notice Refund a bond to depositor
     * @param bondId ID of the bond
     * @dev Can only be called after unlock time for refundable bonds
     */
    function refundBond(uint256 bondId) external;

    /**
     * @notice Forfeit a bond (called by governance)
     * @param bondId ID of the bond
     * @param reason Reason for forfeiture
     * @dev Only callable by authorized contracts (governance)
     */
    function forfeitBond(uint256 bondId, string calldata reason) external;

    /**
     * @notice Mark bond as refundable (called by governance)
     * @param bondId ID of the bond
     * @dev Changes status from LOCKED to REFUNDABLE
     */
    function markRefundable(uint256 bondId) external;

    /**
     * @notice Update bond requirements for a purpose
     * @param purpose Bond purpose
     * @param newAmount New required amount
     * @param newLockDuration New lock duration
     * @dev Only callable by governance
     */
    function updateBondRequirements(
        string calldata purpose,
        uint256 newAmount,
        uint256 newLockDuration
    ) external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get bond information
     * @param bondId ID of the bond
     * @return bondInfo Complete bond information
     */
    function getBond(uint256 bondId) external view returns (BondInfo memory bondInfo);

    /**
     * @notice Get bonds deposited by an address
     * @param depositor Address to query
     * @return bondIds Array of bond IDs
     */
    function getBondsByDepositor(address depositor)
        external
        view
        returns (uint256[] memory bondIds);

    /**
     * @notice Get required bond amount for a purpose
     * @param purpose Bond purpose
     * @return amount Required bond amount
     */
    function getRequiredBond(string calldata purpose)
        external
        view
        returns (uint256 amount);

    /**
     * @notice Get bond lock duration for a purpose
     * @param purpose Bond purpose
     * @return duration Lock duration in seconds
     */
    function getLockDuration(string calldata purpose)
        external
        view
        returns (uint256 duration);

    /**
     * @notice Check if bond is refundable
     * @param bondId ID of the bond
     * @return isRefundable True if can be refunded
     */
    function isBondRefundable(uint256 bondId) external view returns (bool isRefundable);

    /**
     * @notice Get total bonds locked
     * @return total Total locked bond amount
     */
    function getTotalLockedBonds() external view returns (uint256 total);

    /**
     * @notice Get total bonds forfeited
     * @return total Total forfeited bond amount
     */
    function getTotalForfeitedBonds() external view returns (uint256 total);
}
