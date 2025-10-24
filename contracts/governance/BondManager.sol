// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBondManager.sol";

/**
 * @title BondManager
 * @notice Manages governance proposal bonds for spam prevention (Fix #7)
 * @dev Clean separation of concerns - handles economic spam deterrent
 *
 * KEY FEATURES:
 * - Lock bonds when proposals created
 * - Refund bonds for good proposals
 * - Forfeit bonds to treasury for bad proposals
 * - Only governance contract can call bond functions
 *
 * SECURITY:
 * - Uses SafeERC20 for all token operations
 * - Only governance can manage bonds
 * - Comprehensive input validation
 * - Clear event logging for transparency
 */
contract BondManager is IBondManager, Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The BASED token contract
    IERC20 public immutable basedToken;

    /// @notice The governance contract (only address that can call bond functions)
    address public governance;

    /// @notice The treasury address (receives forfeited bonds)
    address public treasury;

    /// @notice Locked bonds per proposer
    mapping(address => uint256) public lockedBonds;

    /// @notice Total amount of locked bonds
    uint256 public totalLockedBonds;

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Restrict function to governance contract only
     */
    modifier onlyGovernance() {
        require(msg.sender == governance, "BondManager: Only governance");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the BondManager
     * @param _basedToken Address of the BASED token
     * @param _treasury Address of the treasury
     */
    constructor(address _basedToken, address _treasury) Ownable(msg.sender) {
        require(_basedToken != address(0), "BondManager: Invalid token");
        require(_treasury != address(0), "BondManager: Invalid treasury");

        basedToken = IERC20(_basedToken);
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                          GOVERNANCE SETUP
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set the governance contract address
     * @dev Can only be called once by owner
     * @param _governance The governance contract address
     */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "BondManager: Invalid governance");
        require(governance == address(0), "BondManager: Governance already set");

        governance = _governance;
    }

    /**
     * @notice Update treasury address
     * @dev Only owner can update treasury
     * @param _treasury The new treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "BondManager: Invalid treasury");
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                          BOND MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Lock a bond for a proposal
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     * @param amount The bond amount to lock
     */
    function lockBond(address proposer, uint256 amount) external onlyGovernance {
        require(amount > 0, "BondManager: Invalid amount");
        require(proposer != address(0), "BondManager: Invalid proposer");
        require(lockedBonds[proposer] == 0, "BondManager: Bond already locked");

        // Transfer tokens from proposer to this contract
        basedToken.safeTransferFrom(proposer, address(this), amount);

        // Track locked bond
        lockedBonds[proposer] = amount;
        totalLockedBonds += amount;

        emit BondLocked(proposer, amount, block.timestamp);
    }

    /**
     * @notice Refund a locked bond (good proposal)
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     */
    function refundBond(address proposer) external onlyGovernance {
        uint256 amount = lockedBonds[proposer];
        require(amount > 0, "BondManager: No bond locked");

        // Clear locked bond
        lockedBonds[proposer] = 0;
        totalLockedBonds -= amount;

        // Refund to proposer
        basedToken.safeTransfer(proposer, amount);

        emit BondRefunded(proposer, amount, block.timestamp);
    }

    /**
     * @notice Forfeit a locked bond to treasury (bad proposal)
     * @dev Only callable by governance contract
     * @param proposer The address of the proposer
     */
    function forfeitBond(address proposer) external onlyGovernance {
        uint256 amount = lockedBonds[proposer];
        require(amount > 0, "BondManager: No bond locked");

        // Clear locked bond
        lockedBonds[proposer] = 0;
        totalLockedBonds -= amount;

        // Send to treasury
        basedToken.safeTransfer(treasury, amount);

        emit BondForfeited(proposer, amount, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get locked bond amount for a proposer
     * @param proposer The address to check
     * @return amount The locked bond amount
     */
    function getLockedBond(address proposer) external view returns (uint256) {
        return lockedBonds[proposer];
    }

    /**
     * @notice Check if a proposer has a locked bond
     * @param proposer The address to check
     * @return hasLocked True if bond is locked
     */
    function hasBondLocked(address proposer) external view returns (bool) {
        return lockedBonds[proposer] > 0;
    }

    /**
     * @notice Get total locked bonds
     * @return totalLocked Total amount of locked bonds
     */
    function getTotalLockedBonds() external view returns (uint256) {
        return totalLockedBonds;
    }
}
