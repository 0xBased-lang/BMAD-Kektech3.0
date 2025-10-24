// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarket.sol";
import "./interfaces/IPredictionMarketFactory.sol";

/**
 * @title PredictionMarketFactory
 * @notice Factory contract for creating and managing prediction markets
 * @dev Implements timelock-protected parameter updates (Fix #8)
 *
 * Stories Implementation:
 * - Story 4-1: Base factory, market creation, view functions
 * - Story 4-2: Parameter management with timelock
 * - Story 4-3: Implementation upgrade logic
 */
contract PredictionMarketFactory is IPredictionMarketFactory, Ownable, Pausable {
    // ============================================
    // STATE VARIABLES
    // ============================================

    // Market tracking
    address[] public markets;
    mapping(address => address[]) public marketsByCreator;
    mapping(address => bool) public isMarket;

    // Configuration
    address public basedToken;
    address public treasury;
    address public marketImplementation;

    // Fee parameters
    FeeParams public feeParams;

    // Timelock integration (Story 4-2)
    address public timelock;
    uint256 public constant TIMELOCK_DELAY = 48 hours;

    // Queued updates (Story 4-2)
    FeeParams public queuedFeeParams;
    uint256 public feeUpdateQueuedAt;
    bool public hasPendingFeeUpdate;

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize the factory
     * @param _basedToken BASED token address
     * @param _treasury Platform treasury address
     * @param _marketImplementation Initial market implementation
     * @param _initialFeeParams Initial fee parameters
     */
    constructor(
        address _basedToken,
        address _treasury,
        address _marketImplementation,
        FeeParams memory _initialFeeParams
    ) Ownable(msg.sender) {
        require(_basedToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_marketImplementation != address(0), "Invalid implementation");

        // Validate fee parameters (Fix #8 - cross-parameter validation)
        _validateFeeParams(_initialFeeParams);

        basedToken = _basedToken;
        treasury = _treasury;
        marketImplementation = _marketImplementation;
        feeParams = _initialFeeParams;
    }

    // ============================================
    // CORE FUNCTIONS (Story 4-1)
    // ============================================

    /**
     * @notice Create a new prediction market
     * @param params Market creation parameters
     * @return marketAddress Address of the created market
     * @dev Deploys a new PredictionMarket contract
     */
    function createMarket(MarketParams calldata params)
        external
        override
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate parameters
        require(bytes(params.question).length > 0, "Empty question");
        require(params.endTime > block.timestamp, "End time in past");
        require(params.resolutionTime > params.endTime, "Invalid resolution time");
        require(params.resolver != address(0), "Invalid resolver");
        require(params.outcomes.length == 2, "Must have 2 outcomes");

        // Deploy new market
        PredictionMarket market = new PredictionMarket(
            msg.sender,                    // creator
            params.resolver,               // resolver
            params.question,               // question
            params.endTime,                // endTime
            params.resolutionTime,         // resolutionTime
            basedToken,                    // basedToken
            treasury,                      // platformTreasury
            feeParams.baseFeeBps,          // baseFeeBps
            feeParams.platformFeeBps,      // platformFeeBps
            feeParams.creatorFeeBps,       // creatorFeeBps
            feeParams.maxAdditionalFeeBps  // maxAdditionalFeeBps
        );

        marketAddress = address(market);

        // Track market
        markets.push(marketAddress);
        marketsByCreator[msg.sender].push(marketAddress);
        isMarket[marketAddress] = true;

        emit MarketCreated(marketAddress, msg.sender, params.question, params.endTime);
    }

    /**
     * @notice Pause market creation
     * @dev Emergency function, only callable by owner
     */
    function pause() external override onlyOwner {
        _pause();
        emit FactoryPaused(msg.sender);
    }

    /**
     * @notice Unpause market creation
     * @dev Only callable by owner
     */
    function unpause() external override onlyOwner {
        _unpause();
        emit FactoryUnpaused(msg.sender);
    }

    // ============================================
    // PARAMETER MANAGEMENT (Story 4-2)
    // ============================================

    /**
     * @notice Queue a fee parameter update (requires timelock)
     * @param baseFeeBps New base fee
     * @param platformFeeBps New platform fee
     * @param creatorFeeBps New creator fee
     * @param maxAdditionalFeeBps New max additional fee
     * @dev Implementation in Story 4-2
     */
    function queueFeeUpdate(
        uint256 baseFeeBps,
        uint256 platformFeeBps,
        uint256 creatorFeeBps,
        uint256 maxAdditionalFeeBps
    ) external override onlyOwner {
        FeeParams memory newParams = FeeParams({
            baseFeeBps: baseFeeBps,
            platformFeeBps: platformFeeBps,
            creatorFeeBps: creatorFeeBps,
            maxAdditionalFeeBps: maxAdditionalFeeBps
        });

        // Validate new parameters
        _validateFeeParams(newParams);

        require(!hasPendingFeeUpdate, "Update already queued");

        queuedFeeParams = newParams;
        feeUpdateQueuedAt = block.timestamp;
        hasPendingFeeUpdate = true;

        emit ParameterUpdateQueued(
            "feeParams",
            0, // Placeholder for value
            block.timestamp + TIMELOCK_DELAY
        );
    }

    /**
     * @notice Execute a queued fee parameter update
     * @dev Can only be called after timelock delay has passed
     */
    function executeFeeUpdate() external override {
        require(hasPendingFeeUpdate, "No pending update");
        require(
            block.timestamp >= feeUpdateQueuedAt + TIMELOCK_DELAY,
            "Timelock not expired"
        );

        feeParams = queuedFeeParams;
        hasPendingFeeUpdate = false;
        feeUpdateQueuedAt = 0;

        emit FeeParametersUpdated(
            feeParams.baseFeeBps,
            feeParams.platformFeeBps,
            feeParams.creatorFeeBps,
            feeParams.maxAdditionalFeeBps
        );

        emit ParameterUpdateExecuted("feeParams", 0);
    }

    /**
     * @notice Cancel a queued fee parameter update
     * @dev Can only be called by owner before execution
     */
    function cancelFeeUpdate() external override onlyOwner {
        require(hasPendingFeeUpdate, "No pending update");

        hasPendingFeeUpdate = false;
        feeUpdateQueuedAt = 0;

        emit ParameterUpdateCancelled("feeParams");
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     * @dev Implementation in Story 4-2
     */
    function updateTreasury(address newTreasury) external override onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    // ============================================
    // UPGRADE FUNCTIONS (Story 4-3)
    // ============================================

    /**
     * @notice Upgrade market implementation contract
     * @param newImplementation New implementation address
     * @dev Implementation in Story 4-3
     */
    function upgradeImplementation(address newImplementation) external override onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");

        address oldImplementation = marketImplementation;
        marketImplementation = newImplementation;

        emit ImplementationUpgraded(oldImplementation, newImplementation);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get current fee parameters
     * @return Current fee configuration
     */
    function getFeeParameters() external view override returns (FeeParams memory) {
        return feeParams;
    }

    /**
     * @notice Get market address by index
     * @param index Market index
     * @return marketAddress Address of the market
     */
    function getMarket(uint256 index) external view override returns (address marketAddress) {
        require(index < markets.length, "Index out of bounds");
        return markets[index];
    }

    /**
     * @notice Get total number of created markets
     * @return count Total market count
     */
    function getMarketCount() external view override returns (uint256 count) {
        return markets.length;
    }

    /**
     * @notice Get markets created by a specific address
     * @param creator Creator address
     * @return Array of market addresses
     */
    function getMarketsByCreator(address creator)
        external
        view
        override
        returns (address[] memory)
    {
        return marketsByCreator[creator];
    }

    /**
     * @notice Check if an address is a valid market created by this factory
     * @param marketAddress Address to check
     * @return isValid True if valid market
     */
    function isValidMarket(address marketAddress) external view override returns (bool isValid) {
        return isMarket[marketAddress];
    }

    /**
     * @notice Get current market implementation address
     * @return implementation Current implementation
     */
    function getImplementation() external view override returns (address implementation) {
        return marketImplementation;
    }

    /**
     * @notice Get treasury address
     * @return Current treasury address
     */
    function getTreasury() external view override returns (address) {
        return treasury;
    }

    /**
     * @notice Check if factory is paused
     * @return True if paused
     */
    function isPaused() external view override returns (bool) {
        return paused();
    }

    /**
     * @notice Get timelock delay for parameter updates
     * @return delay Delay in seconds
     */
    function getTimelockDelay() external pure override returns (uint256 delay) {
        return TIMELOCK_DELAY;
    }

    /**
     * @notice Get details of queued fee update
     * @return isQueued True if update is queued
     * @return executeAfter Earliest execution time
     * @return queuedParams Queued fee parameters
     */
    function getQueuedFeeUpdate()
        external
        view
        override
        returns (
            bool isQueued,
            uint256 executeAfter,
            FeeParams memory queuedParams
        )
    {
        isQueued = hasPendingFeeUpdate;
        executeAfter = hasPendingFeeUpdate ? feeUpdateQueuedAt + TIMELOCK_DELAY : 0;
        queuedParams = queuedFeeParams;
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Validate fee parameters (Fix #8)
     * @param params Fee parameters to validate
     * @dev Ensures total fees don't exceed 7%
     */
    function _validateFeeParams(FeeParams memory params) internal pure {
        uint256 totalMaxFees = params.baseFeeBps +
            params.platformFeeBps +
            params.creatorFeeBps +
            params.maxAdditionalFeeBps;

        require(totalMaxFees <= 700, "Total fees exceed 7%");
        require(params.baseFeeBps >= 50, "Base fee too low");
        require(params.platformFeeBps >= 25, "Platform fee too low");
    }
}
