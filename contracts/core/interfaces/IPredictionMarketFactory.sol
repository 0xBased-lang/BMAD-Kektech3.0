// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarketFactory
 * @notice Interface for the factory contract that creates and manages prediction markets
 * @dev Implements UUPS upgradeable pattern with timelock protection
 */
interface IPredictionMarketFactory {
    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Parameters for creating a new market
     * @param question Market question
     * @param endTime When betting ends
     * @param resolutionTime When resolution can occur
     * @param resolver Address authorized to resolve
     * @param outcomes Array of outcome descriptions
     */
    struct MarketParams {
        string question;
        uint256 endTime;
        uint256 resolutionTime;
        address resolver;
        string[] outcomes;
    }

    /**
     * @notice Global fee parameters
     * @param baseFeeBps Base fee in basis points
     * @param platformFeeBps Platform fee in basis points
     * @param creatorFeeBps Creator fee in basis points
     * @param maxAdditionalFeeBps Maximum additional fee in basis points
     */
    struct FeeParams {
        uint256 baseFeeBps;
        uint256 platformFeeBps;
        uint256 creatorFeeBps;
        uint256 maxAdditionalFeeBps;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new market is created
     * @param marketAddress Address of the created market
     * @param creator Address that created the market
     * @param question Market question
     * @param endTime When betting ends
     */
    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint256 endTime
    );

    /**
     * @notice Emitted when fee parameters are updated
     * @param baseFeeBps New base fee
     * @param platformFeeBps New platform fee
     * @param creatorFeeBps New creator fee
     * @param maxAdditionalFeeBps New max additional fee
     */
    event FeeParametersUpdated(
        uint256 baseFeeBps,
        uint256 platformFeeBps,
        uint256 creatorFeeBps,
        uint256 maxAdditionalFeeBps
    );

    /**
     * @notice Emitted when a parameter update is queued in timelock
     * @param parameterName Name of the parameter
     * @param newValue New value
     * @param executeAfter Earliest execution time
     */
    event ParameterUpdateQueued(
        string parameterName,
        uint256 newValue,
        uint256 executeAfter
    );

    /**
     * @notice Emitted when a queued parameter update is executed
     * @param parameterName Name of the parameter
     * @param newValue New value
     */
    event ParameterUpdateExecuted(string parameterName, uint256 newValue);

    /**
     * @notice Emitted when a queued parameter update is cancelled
     * @param parameterName Name of the parameter
     */
    event ParameterUpdateCancelled(string parameterName);

    /**
     * @notice Emitted when treasury address is updated
     * @param oldTreasury Previous treasury address
     * @param newTreasury New treasury address
     */
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @notice Emitted when market implementation is upgraded
     * @param oldImplementation Previous implementation address
     * @param newImplementation New implementation address
     */
    event ImplementationUpgraded(
        address indexed oldImplementation,
        address indexed newImplementation
    );

    /**
     * @notice Emitted when factory is paused
     * @param admin Address that paused
     */
    event FactoryPaused(address indexed admin);

    /**
     * @notice Emitted when factory is unpaused
     * @param admin Address that unpaused
     */
    event FactoryUnpaused(address indexed admin);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Create a new prediction market
     * @param params Market creation parameters
     * @return marketAddress Address of the created market
     */
    function createMarket(MarketParams calldata params)
        external
        returns (address marketAddress);

    /**
     * @notice Queue a fee parameter update (requires timelock)
     * @param baseFeeBps New base fee
     * @param platformFeeBps New platform fee
     * @param creatorFeeBps New creator fee
     * @param maxAdditionalFeeBps New max additional fee
     * @dev Updates are executed after timelock delay (Fix #8)
     */
    function queueFeeUpdate(
        uint256 baseFeeBps,
        uint256 platformFeeBps,
        uint256 creatorFeeBps,
        uint256 maxAdditionalFeeBps
    ) external;

    /**
     * @notice Execute a queued fee parameter update
     * @dev Can only be called after timelock delay has passed
     */
    function executeFeeUpdate() external;

    /**
     * @notice Cancel a queued fee parameter update
     * @dev Can only be called by admin before execution
     */
    function cancelFeeUpdate() external;

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     * @dev Subject to timelock delay
     */
    function updateTreasury(address newTreasury) external;

    /**
     * @notice Upgrade market implementation contract
     * @param newImplementation New implementation address
     * @dev Subject to timelock delay for security (Fix #8)
     */
    function upgradeImplementation(address newImplementation) external;

    /**
     * @notice Pause market creation
     * @dev Emergency function, only callable by admin
     */
    function pause() external;

    /**
     * @notice Unpause market creation
     * @dev Only callable by admin
     */
    function unpause() external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get current fee parameters
     * @return feeParams Current fee configuration
     */
    function getFeeParameters() external view returns (FeeParams memory feeParams);

    /**
     * @notice Get market address by index
     * @param index Market index
     * @return marketAddress Address of the market
     */
    function getMarket(uint256 index) external view returns (address marketAddress);

    /**
     * @notice Get total number of created markets
     * @return count Total market count
     */
    function getMarketCount() external view returns (uint256 count);

    /**
     * @notice Get markets created by a specific address
     * @param creator Creator address
     * @return markets Array of market addresses
     */
    function getMarketsByCreator(address creator)
        external
        view
        returns (address[] memory markets);

    /**
     * @notice Check if an address is a valid market created by this factory
     * @param marketAddress Address to check
     * @return isValid True if valid market
     */
    function isValidMarket(address marketAddress) external view returns (bool isValid);

    /**
     * @notice Get current market implementation address
     * @return implementation Current implementation
     */
    function getImplementation() external view returns (address implementation);

    /**
     * @notice Get treasury address
     * @return treasury Current treasury address
     */
    function getTreasury() external view returns (address treasury);

    /**
     * @notice Check if factory is paused
     * @return isPaused True if paused
     */
    function isPaused() external view returns (bool isPaused);

    /**
     * @notice Get timelock delay for parameter updates
     * @return delay Delay in seconds
     */
    function getTimelockDelay() external view returns (uint256 delay);

    /**
     * @notice Get details of queued fee update
     * @return isQueued True if update is queued
     * @return executeAfter Earliest execution time
     * @return feeParams Queued fee parameters
     */
    function getQueuedFeeUpdate()
        external
        view
        returns (
            bool isQueued,
            uint256 executeAfter,
            FeeParams memory feeParams
        );
}
