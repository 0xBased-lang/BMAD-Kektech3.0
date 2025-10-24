const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  advanceTime,
  getCurrentTimestamp,
  getNamedSigners,
  toWei,
  fromWei,
  ZERO_ADDRESS,
  MAX_UINT256,
} = require("../helpers");

/**
 * Framework Verification Test
 *
 * This test suite verifies that the testing framework is properly configured
 * and all helper utilities are working correctly.
 */
describe("Testing Framework Verification", function () {
  let deployer, alice, bob;

  before(async function () {
    // Get named signers for testing
    const signers = await getNamedSigners();
    deployer = signers.deployer;
    alice = signers.alice;
    bob = signers.bob;
  });

  describe("Environment Setup", function () {
    it("should have access to ethers", function () {
      expect(ethers).to.not.be.undefined;
    });

    it("should have access to chai assertions", function () {
      expect(expect).to.be.a("function");
    });

    it("should have multiple test accounts available", async function () {
      const signers = await ethers.getSigners();
      expect(signers.length).to.be.at.least(3);
    });

    it("should be able to get named signers", function () {
      expect(deployer).to.not.be.undefined;
      expect(alice).to.not.be.undefined;
      expect(bob).to.not.be.undefined;
      expect(deployer.address).to.be.properAddress;
    });
  });

  describe("Helper Utilities", function () {
    it("should convert ether to wei correctly", function () {
      const oneEther = toWei(1);
      expect(oneEther).to.equal(ethers.parseEther("1"));
    });

    it("should convert wei to ether correctly", function () {
      const oneEtherInWei = ethers.parseEther("1");
      const converted = fromWei(oneEtherInWei);
      expect(converted).to.equal("1.0");
    });

    it("should provide zero address constant", function () {
      expect(ZERO_ADDRESS).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("should provide max uint256 constant", function () {
      expect(MAX_UINT256).to.equal(ethers.MaxUint256);
    });
  });

  describe("Time Manipulation", function () {
    it("should get current block timestamp", async function () {
      const timestamp = await getCurrentTimestamp();
      expect(timestamp).to.be.a("number");
      expect(timestamp).to.be.greaterThan(0);
    });

    it("should advance time correctly", async function () {
      const timestampBefore = await getCurrentTimestamp();
      const secondsToAdvance = 3600; // 1 hour

      await advanceTime(secondsToAdvance);

      const timestampAfter = await getCurrentTimestamp();
      expect(timestampAfter).to.be.at.least(
        timestampBefore + secondsToAdvance
      );
    });
  });

  describe("Balance Operations", function () {
    it("should check account balances", async function () {
      const balance = await ethers.provider.getBalance(deployer.address);
      expect(balance).to.be.greaterThan(0);
    });

    it("should have different addresses for different accounts", function () {
      expect(deployer.address).to.not.equal(alice.address);
      expect(alice.address).to.not.equal(bob.address);
    });
  });

  describe("Hardhat Network", function () {
    it("should be running on hardhat network", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network.name).to.equal("hardhat");
    });

    it("should be able to mine blocks", async function () {
      const blockBefore = await ethers.provider.getBlockNumber();
      await ethers.provider.send("evm_mine", []);
      const blockAfter = await ethers.provider.getBlockNumber();

      expect(blockAfter).to.equal(blockBefore + 1);
    });
  });
});
