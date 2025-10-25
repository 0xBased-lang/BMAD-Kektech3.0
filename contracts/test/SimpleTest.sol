// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title SimpleTest
 * @notice Simple test contract to validate fork deployment workflow
 * @dev This is just for testing - validates deployment works before real contract modifications
 */
contract SimpleTest {
    // Storage variables
    string public message;
    uint256 public counter;
    address public deployer;

    // Event for tracking
    event MessageUpdated(string newMessage, address updater);
    event CounterIncremented(uint256 newValue, address incrementer);

    /**
     * @notice Constructor sets initial message
     */
    constructor() {
        message = "Fork deployment successful!";
        counter = 0;
        deployer = msg.sender;
    }

    /**
     * @notice Update the message
     * @param _newMessage The new message to set
     */
    function setMessage(string memory _newMessage) public {
        message = _newMessage;
        emit MessageUpdated(_newMessage, msg.sender);
    }

    /**
     * @notice Increment the counter
     */
    function incrementCounter() public {
        counter++;
        emit CounterIncremented(counter, msg.sender);
    }

    /**
     * @notice Get all contract state
     * @return Current message, counter, and deployer address
     */
    function getState() public view returns (
        string memory,
        uint256,
        address
    ) {
        return (message, counter, deployer);
    }
}
