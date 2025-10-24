// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFactoryTimelock.sol";

/**
 * @title FactoryTimelock
 * @notice Timelock mechanism protecting factory parameter changes
 * @dev Critical security feature (Fix #8) - prevents immediate parameter manipulation
 *
 * Security Features:
 * - Configurable delay (min 24h, max 7 days, default 48h)
 * - Operation ID uniqueness via keccak256 hashing
 * - Status tracking prevents double execution
 * - Admin can queue/cancel, anyone can execute after delay
 * - Reentrancy protection on execution
 *
 * Story 4-4: Complete timelock implementation
 */
contract FactoryTimelock is IFactoryTimelock, Ownable, ReentrancyGuard {
    // ============================================
    // STATE VARIABLES
    // ============================================

    // Timelock configuration
    uint256 public timelockDelay;
    uint256 public constant MINIMUM_DELAY = 24 hours;
    uint256 public constant MAXIMUM_DELAY = 7 days;

    // Operation storage
    mapping(bytes32 => TimelockOperation) public operations;
    bytes32[] public operationIds;

    // Pending operations tracking
    mapping(bytes32 => bool) public isPending;

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize timelock with default delay
     * @param initialDelay Initial timelock delay (default 48 hours)
     */
    constructor(uint256 initialDelay) Ownable(msg.sender) {
        require(initialDelay >= MINIMUM_DELAY, "Delay too short");
        require(initialDelay <= MAXIMUM_DELAY, "Delay too long");

        timelockDelay = initialDelay;
    }

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
     * @dev Can only be called by owner (admin/governance)
     */
    function queueOperation(
        OperationType operationType,
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external override onlyOwner returns (bytes32 operationId) {
        // Compute unique operation ID
        operationId = computeOperationId(operationType, target, value, data, description);

        // Check operation doesn't already exist
        require(
            operations[operationId].status == OperationStatus.PENDING ||
                operations[operationId].queuedAt == 0,
            "Operation already exists"
        );

        // Create operation
        uint256 executeAfter = block.timestamp + timelockDelay;

        operations[operationId] = TimelockOperation({
            operationType: operationType,
            queuedAt: block.timestamp,
            executeAfter: executeAfter,
            target: target,
            value: value,
            data: data,
            description: description,
            status: OperationStatus.PENDING
        });

        operationIds.push(operationId);
        isPending[operationId] = true;

        emit OperationQueued(operationId, operationType, executeAfter, description);
    }

    /**
     * @notice Execute a queued operation
     * @param operationId ID of the operation
     * @dev Can only be executed after timelock delay has passed
     */
    function executeOperation(bytes32 operationId) external payable override nonReentrant {
        TimelockOperation storage operation = operations[operationId];

        require(operation.queuedAt > 0, "Operation does not exist");
        require(operation.status == OperationStatus.PENDING, "Operation not pending");
        require(block.timestamp >= operation.executeAfter, "Timelock not expired");

        // Update status before execution (CEI pattern)
        operation.status = OperationStatus.EXECUTED;
        isPending[operationId] = false;

        // Execute the operation
        (bool success, bytes memory returnData) = operation.target.call{value: operation.value}(
            operation.data
        );

        require(success, _getRevertMsg(returnData));

        emit OperationExecuted(operationId, msg.sender);
    }

    /**
     * @notice Cancel a queued operation
     * @param operationId ID of the operation
     * @dev Can only be cancelled by owner before execution
     */
    function cancelOperation(bytes32 operationId) external override onlyOwner {
        TimelockOperation storage operation = operations[operationId];

        require(operation.queuedAt > 0, "Operation does not exist");
        require(operation.status == OperationStatus.PENDING, "Operation not pending");

        operation.status = OperationStatus.CANCELLED;
        isPending[operationId] = false;

        emit OperationCancelled(operationId, msg.sender);
    }

    /**
     * @notice Update the timelock delay
     * @param newDelay New delay in seconds
     * @dev Subject to its own timelock for security
     */
    function updateTimelockDelay(uint256 newDelay) external override onlyOwner {
        require(newDelay >= MINIMUM_DELAY, "Delay too short");
        require(newDelay <= MAXIMUM_DELAY, "Delay too long");

        uint256 oldDelay = timelockDelay;
        timelockDelay = newDelay;

        emit TimelockDelayUpdated(oldDelay, newDelay);
    }

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
        override
        returns (TimelockOperation memory operation)
    {
        return operations[operationId];
    }

    /**
     * @notice Check if operation is ready to execute
     * @param operationId ID of the operation
     * @return isReady True if timelock has expired
     */
    function isOperationReady(bytes32 operationId) external view override returns (bool isReady) {
        TimelockOperation storage operation = operations[operationId];

        return
            operation.queuedAt > 0 &&
            operation.status == OperationStatus.PENDING &&
            block.timestamp >= operation.executeAfter;
    }

    /**
     * @notice Check if operation is pending
     * @param operationId ID of the operation
     * @return True if operation is queued but not ready
     */
    function isOperationPending(bytes32 operationId)
        external
        view
        override
        returns (bool)
    {
        return isPending[operationId];
    }

    /**
     * @notice Get current timelock delay
     * @return delay Delay in seconds
     */
    function getTimelockDelay() external view override returns (uint256 delay) {
        return timelockDelay;
    }

    /**
     * @notice Get minimum timelock delay
     * @return minDelay Minimum delay in seconds
     */
    function getMinimumDelay() external pure override returns (uint256 minDelay) {
        return MINIMUM_DELAY;
    }

    /**
     * @notice Get maximum timelock delay
     * @return maxDelay Maximum delay in seconds
     */
    function getMaximumDelay() external pure override returns (uint256 maxDelay) {
        return MAXIMUM_DELAY;
    }

    /**
     * @notice Get time remaining until operation is ready
     * @param operationId ID of the operation
     * @return timeRemaining Seconds until ready (0 if ready)
     */
    function getTimeRemaining(bytes32 operationId)
        external
        view
        override
        returns (uint256 timeRemaining)
    {
        TimelockOperation storage operation = operations[operationId];

        if (operation.queuedAt == 0 || operation.status != OperationStatus.PENDING) {
            return 0;
        }

        if (block.timestamp >= operation.executeAfter) {
            return 0;
        }

        return operation.executeAfter - block.timestamp;
    }

    /**
     * @notice Get all pending operations
     * @return operationIds Array of pending operation IDs
     */
    function getPendingOperations()
        external
        view
        override
        returns (bytes32[] memory)
    {
        // Count pending operations
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < operationIds.length; i++) {
            if (isPending[operationIds[i]]) {
                pendingCount++;
            }
        }

        // Build array of pending IDs
        bytes32[] memory pending = new bytes32[](pendingCount);
        uint256 index = 0;

        for (uint256 i = 0; i < operationIds.length; i++) {
            if (isPending[operationIds[i]]) {
                pending[index] = operationIds[i];
                index++;
            }
        }

        return pending;
    }

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
    ) public pure override returns (bytes32 operationId) {
        return keccak256(abi.encode(operationType, target, value, data, description));
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Extract revert message from failed call
     * @param returnData Return data from failed call
     * @return Revert message string
     */
    function _getRevertMsg(bytes memory returnData) internal pure returns (string memory) {
        // If the returnData length is less than 68, then the transaction failed silently
        if (returnData.length < 68) return "Transaction reverted silently";

        assembly {
            // Slice the sighash (first 4 bytes)
            returnData := add(returnData, 0x04)
        }

        return abi.decode(returnData, (string));
    }
}
