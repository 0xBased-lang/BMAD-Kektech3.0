// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBondManager
 * @notice Interface for managing governance proposal bonds
 * @dev Handles economic spam deterrent for Fix #7
 */
interface IBondManager {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event BondLocked(
        address indexed proposer,
        uint256 amount,
        uint256 timestamp
    );

    event BondRefunded(
        address indexed proposer,
        uint256 amount,
        uint256 timestamp
    );

    event BondForfeited(
        address indexed proposer,
        uint256 amount,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                             CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Lock a bond for a proposal
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     * @param amount The bond amount to lock
     */
    function lockBond(address proposer, uint256 amount) external;

    /**
     * @notice Refund a locked bond
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     */
    function refundBond(address proposer) external;

    /**
     * @notice Forfeit a locked bond to treasury
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     */
    function forfeitBond(address proposer) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get locked bond amount for a proposer
     * @param proposer The address to check
     * @return amount The locked bond amount
     */
    function getLockedBond(address proposer) external view returns (uint256);

    /**
     * @notice Check if a proposer has a locked bond
     * @param proposer The address to check
     * @return hasLocked True if bond is locked
     */
    function hasBondLocked(address proposer) external view returns (bool);

    /**
     * @notice Get total locked bonds
     * @return totalLocked Total amount of locked bonds
     */
    function getTotalLockedBonds() external view returns (uint256);
}
