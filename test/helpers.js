const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * Test Helper Utilities for KEKTECH 3.0 Prediction Markets
 *
 * This file contains common helper functions used throughout the test suite.
 */

/**
 * Time Manipulation Helpers
 */

/**
 * Advances the blockchain time by the specified number of seconds
 * @param {number} seconds - Number of seconds to advance
 */
async function advanceTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Advances the blockchain by the specified number of blocks
 * @param {number} blocks - Number of blocks to mine
 */
async function advanceBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

/**
 * Gets the current block timestamp
 * @returns {Promise<number>} Current block timestamp
 */
async function getCurrentTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

/**
 * Sets the timestamp for the next block
 * @param {number} timestamp - Unix timestamp to set
 */
async function setNextBlockTimestamp(timestamp) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Balance Checking Helpers
 */

/**
 * Gets the ETH balance of an address
 * @param {string} address - Address to check
 * @returns {Promise<BigNumber>} Balance in wei
 */
async function getBalance(address) {
  return await ethers.provider.getBalance(address);
}

/**
 * Expects a balance change for an address after executing a function
 * @param {Function} txFunc - Function that executes a transaction
 * @param {string} address - Address to check balance change
 * @param {BigNumber} expectedChange - Expected balance change (can be negative)
 */
async function expectBalanceChange(txFunc, address, expectedChange) {
  const balanceBefore = await getBalance(address);
  await txFunc();
  const balanceAfter = await getBalance(address);
  const actualChange = balanceAfter - balanceBefore;

  expect(actualChange).to.equal(expectedChange);
}

/**
 * Event Verification Helpers
 */

/**
 * Expects a transaction to emit a specific event with arguments
 * @param {Promise} tx - Transaction promise
 * @param {string} eventName - Name of the event to check
 * @param {Array} args - Expected event arguments
 */
async function expectEvent(tx, eventName, args = []) {
  const receipt = await tx.wait();
  const event = receipt.events?.find(e => e.event === eventName);

  expect(event).to.not.be.undefined;
  if (args.length > 0) {
    args.forEach((arg, index) => {
      expect(event.args[index]).to.equal(arg);
    });
  }
}

/**
 * Signer Helpers
 */

/**
 * Gets test signers with descriptive names
 * @returns {Promise<Object>} Object containing named signers
 */
async function getNamedSigners() {
  const [deployer, alice, bob, carol, dave, eve, factory, treasury, resolver] =
    await ethers.getSigners();

  return {
    deployer,
    alice,
    bob,
    carol,
    dave,
    eve,
    factory,
    treasury,
    resolver,
  };
}

/**
 * Deployment Helpers
 */

/**
 * Deploys a contract and returns the instance
 * @param {string} contractName - Name of the contract to deploy
 * @param {Array} args - Constructor arguments
 * @returns {Promise<Contract>} Deployed contract instance
 */
async function deployContract(contractName, args = []) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

/**
 * Assertion Helpers
 */

/**
 * Expects a transaction to revert with a specific error message
 * @param {Promise} tx - Transaction promise
 * @param {string} errorMessage - Expected error message
 */
async function expectRevert(tx, errorMessage) {
  await expect(tx).to.be.revertedWith(errorMessage);
}

/**
 * Expects a transaction to revert with a custom error
 * @param {Promise} tx - Transaction promise
 * @param {string} errorName - Expected custom error name
 */
async function expectCustomError(tx, errorName) {
  await expect(tx).to.be.revertedWithCustomError(errorName);
}

/**
 * Conversion Helpers
 */

/**
 * Converts ether amount to wei
 * @param {string|number} amount - Amount in ether
 * @returns {BigNumber} Amount in wei
 */
function toWei(amount) {
  return ethers.parseEther(amount.toString());
}

/**
 * Converts wei amount to ether
 * @param {BigNumber} amount - Amount in wei
 * @returns {string} Amount in ether
 */
function fromWei(amount) {
  return ethers.formatEther(amount);
}

/**
 * Test Data Generators
 */

/**
 * Generates a random address
 * @returns {string} Random Ethereum address
 */
function randomAddress() {
  return ethers.Wallet.createRandom().address;
}

/**
 * Generates a random bytes32 value
 * @returns {string} Random bytes32 hex string
 */
function randomBytes32() {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Constants for Testing
 */
const ZERO_ADDRESS = ethers.ZeroAddress;
const MAX_UINT256 = ethers.MaxUint256;

module.exports = {
  // Time manipulation
  advanceTime,
  advanceBlocks,
  getCurrentTimestamp,
  setNextBlockTimestamp,

  // Balance checking
  getBalance,
  expectBalanceChange,

  // Event verification
  expectEvent,

  // Signers
  getNamedSigners,

  // Deployment
  deployContract,

  // Assertions
  expectRevert,
  expectCustomError,

  // Conversions
  toWei,
  fromWei,

  // Test data
  randomAddress,
  randomBytes32,

  // Constants
  ZERO_ADDRESS,
  MAX_UINT256,
};
