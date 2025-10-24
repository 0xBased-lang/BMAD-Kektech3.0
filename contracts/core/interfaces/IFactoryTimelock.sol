// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFactoryTimelock
 * @notice Interface for timelock mechanism protecting factory parameter changes
 * @dev Critical security feature (Fix #8) - prevents immediate parameter manipulation
 */
interface IFactoryTimelock {
    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Types of operations that can be timelocked
     */
    enum OperationType {
        FEE_UPDATE,             // Fee parameter updates
        TREASURY_UPDATE,        // Treasury address change
        IMPLEMENTATION_UPGRADE, // Contract implementation upgrade
        EMERGENCY_ACTION        // Emergency actions
    }

    /**
     * @notice Status of a timelocked operation
     */
    enum OperationStatus {
        PENDING,    // Operation queued, not yet executable
        READY,      // Timelock expired, ready to execute
        EXECUTED,   // Operation executed
        CANCELLED   // Operation cancelled
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Timelocked operation
     * @param operationType Type of operation
     * @param queuedAt Timestamp when queued
     * @param executeAfter Earliest execution time
     * @param target Target contract address
     * @param value ETH value (if any)
     * @param data Call data
     * @param description Operation description
     * @param status Current status
     */
    struct TimelockOperation {
        OperationType operationType;
        uint256 queuedAt;
        uint256 executeAfter;
        address target;
        uint256 value;
        bytes data;
        string description;
        OperationStatus status;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when an operation is queued
     * @param operationId ID of the operation
     * @param operationType Type of operation
     * @param executeAfter Earliest execution time
     * @param description Operation description
     */
    event OperationQueued(
        bytes32 indexed operationId,
        OperationType operationType,
        uint256 executeAfter,
        string description
    );

    /**
     * @notice Emitted when an operation is executed
     * @param operationId ID of the operation
     * @param executor Address that executed
     */
    event OperationExecuted(bytes32 indexed operationId, address indexed executor);

    /**
     * @notice Emitted when an operation is cancelled
     * @param operationId ID of the operation
     * @param canceller Address that cancelled
     */
    event OperationCancelled(bytes32 indexed operationId, address indexed canceller);

    /**
     * @notice Emitted when timelock delay is updated
     * @param oldDelay Previous delay
     * @param newDelay New delay
     */
    event TimelockDelayUpdated(uint256 oldDelay, uint256 newDelay);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Queue an operation with timelock
     * @param operationType Type of operation
     * @param target Target contract
     * @param value ETH value
     * @param data Call data
     * @param description Operation description
     * @return operationId ID of the queued operation
     * @dev Can only be called by authorized addresses (admin/governance)
     */
    function queueOperation(
        OperationType operationType,
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external returns (bytes32 operationId);

    /**
     * @notice Execute a queued operation
     * @param operationId ID of the operation
     * @dev Can only be executed after timelock delay has passed
     */
    function executeOperation(bytes32 operationId) external payable;

    /**
     * @notice Cancel a queued operation
     * @param operationId ID of the operation
     * @dev Can only be cancelled by admin before execution
     */
    function cancelOperation(bytes32 operationId) external;

    /**
     * @notice Update the timelock delay
     * @param newDelay New delay in seconds
     * @dev Subject to its own timelock for security
     */
    function updateTimelockDelay(uint256 newDelay) external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get operation details
     * @param operationId ID of the operation
     * @return operation Complete operation information
     */
    function getOperation(bytes32 operationId)
        external
        view
        returns (TimelockOperation memory operation);

    /**
     * @notice Check if operation is ready to execute
     * @param operationId ID of the operation
     * @return isReady True if timelock has expired
     */
    function isOperationReady(bytes32 operationId) external view returns (bool isReady);

    /**
     * @notice Check if operation is pending
     * @param operationId ID of the operation
     * @return isPending True if operation is queued but not ready
     */
    function isOperationPending(bytes32 operationId) external view returns (bool isPending);

    /**
     * @notice Get current timelock delay
     * @return delay Delay in seconds
     */
    function getTimelockDelay() external view returns (uint256 delay);

    /**
     * @notice Get minimum timelock delay
     * @return minDelay Minimum delay in seconds
     */
    function getMinimumDelay() external view returns (uint256 minDelay);

    /**
     * @notice Get maximum timelock delay
     * @return maxDelay Maximum delay in seconds
     */
    function getMaximumDelay() external view returns (uint256 maxDelay);

    /**
     * @notice Get time remaining until operation is ready
     * @param operationId ID of the operation
     * @return timeRemaining Seconds until ready (0 if ready)
     */
    function getTimeRemaining(bytes32 operationId)
        external
        view
        returns (uint256 timeRemaining);

    /**
     * @notice Get all pending operations
     * @return operationIds Array of pending operation IDs
     */
    function getPendingOperations() external view returns (bytes32[] memory operationIds);

    /**
     * @notice Compute operation ID
     * @param operationType Type of operation
     * @param target Target contract
     * @param value ETH value
     * @param data Call data
     * @param description Operation description
     * @return operationId Computed operation ID
     * @dev Useful for checking if operation already queued
     */
    function computeOperationId(
        OperationType operationType,
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external pure returns (bytes32 operationId);
}
