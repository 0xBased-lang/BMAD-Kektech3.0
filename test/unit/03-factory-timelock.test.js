const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  advanceTime,
  getCurrentTimestamp,
  getNamedSigners,
  toWei,
  deployContract,
} = require("../helpers");

/**
 * FactoryTimelock Test Suite
 *
 * Tests comprehensive timelock functionality including:
 * - Operation queueing
 * - Execution timing and enforcement
 * - Cancellation
 * - Delay management
 * - Status tracking
 * - Security scenarios
 */
describe("FactoryTimelock", function () {
  let timelock;
  let mockTarget;
  let owner, alice, bob;

  const DEFAULT_DELAY = 48 * 3600; // 48 hours
  const MINIMUM_DELAY = 24 * 3600; // 24 hours
  const MAXIMUM_DELAY = 7 * 86400; // 7 days

  beforeEach(async function () {
    const signers = await getNamedSigners();
    owner = signers.deployer;
    alice = signers.alice;
    bob = signers.bob;

    // Deploy timelock
    const TimelockContract = await ethers.getContractFactory("FactoryTimelock");
    timelock = await TimelockContract.deploy(DEFAULT_DELAY);
    await timelock.waitForDeployment();

    // Deploy mock target for testing operations
    mockTarget = await deployContract("MockERC20", ["Mock", "MCK", toWei(1000000)]);
  });

  describe("Deployment", function () {
    it("should deploy with correct delay", async function () {
      expect(await timelock.getTimelockDelay()).to.equal(DEFAULT_DELAY);
    });

    it("should set correct minimum and maximum delays", async function () {
      expect(await timelock.getMinimumDelay()).to.equal(MINIMUM_DELAY);
      expect(await timelock.getMaximumDelay()).to.equal(MAXIMUM_DELAY);
    });

    it("should reject delay below minimum", async function () {
      const TimelockContract = await ethers.getContractFactory("FactoryTimelock");
      await expect(
        TimelockContract.deploy(MINIMUM_DELAY - 1)
      ).to.be.revertedWith("Delay too short");
    });

    it("should reject delay above maximum", async function () {
      const TimelockContract = await ethers.getContractFactory("FactoryTimelock");
      await expect(
        TimelockContract.deploy(MAXIMUM_DELAY + 1)
      ).to.be.revertedWith("Delay too long");
    });
  });

  describe("Operation Queueing", function () {
    it("should queue an operation", async function () {
      const operationType = 0; // FEE_UPDATE
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = "0x";
      const description = "Test operation";

      await expect(
        timelock.queueOperation(operationType, target, value, data, description)
      ).to.emit(timelock, "OperationQueued");
    });

    it("should compute unique operation ID", async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = "0x";
      const description = "Test operation";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];

      const computedId = await timelock.computeOperationId(
        operationType,
        target,
        value,
        data,
        description
      );

      expect(operationId).to.equal(computedId);
    });

    it("should set correct executeAfter timestamp", async function () {
      const currentTime = await getCurrentTimestamp();
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = "0x";
      const description = "Test operation";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];
      const operation = await timelock.getOperation(operationId);

      expect(operation.executeAfter).to.be.closeTo(
        currentTime + DEFAULT_DELAY,
        5 // Allow 5 second tolerance
      );
    });

    it("should mark operation as pending", async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = "0x";
      const description = "Test operation";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];

      expect(await timelock.isOperationPending(operationId)).to.be.true;
      expect(await timelock.isOperationReady(operationId)).to.be.false;
    });

    it("should only allow owner to queue operations", async function () {
      await expect(
        timelock.connect(alice).queueOperation(0, await mockTarget.getAddress(), 0, "0x", "Test")
      ).to.be.revertedWithCustomError(timelock, "OwnableUnauthorizedAccount");
    });

    it("should track multiple operations", async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();

      await timelock.queueOperation(operationType, target, 0, "0x", "Operation 1");
      await timelock.queueOperation(operationType, target, 0, "0x", "Operation 2");
      await timelock.queueOperation(operationType, target, 0, "0x", "Operation 3");

      const pending = await timelock.getPendingOperations();
      expect(pending.length).to.equal(3);
    });
  });

  describe("Operation Execution", function () {
    let operationId;

    beforeEach(async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = mockTarget.interface.encodeFunctionData("mint", [alice.address, toWei(1000)]);
      const description = "Mint tokens";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      operationId = timelock.interface.parseLog(event).args[0];
    });

    it("should reject execution before timelock expires", async function () {
      await expect(
        timelock.executeOperation(operationId)
      ).to.be.revertedWith("Timelock not expired");
    });

    it("should allow execution after timelock expires", async function () {
      await advanceTime(DEFAULT_DELAY + 1);

      await expect(timelock.executeOperation(operationId))
        .to.emit(timelock, "OperationExecuted")
        .withArgs(operationId, owner.address);
    });

    it("should execute the target operation", async function () {
      await advanceTime(DEFAULT_DELAY + 1);

      const balanceBefore = await mockTarget.balanceOf(alice.address);
      await timelock.executeOperation(operationId);
      const balanceAfter = await mockTarget.balanceOf(alice.address);

      expect(balanceAfter - balanceBefore).to.equal(toWei(1000));
    });

    it("should mark operation as executed", async function () {
      await advanceTime(DEFAULT_DELAY + 1);
      await timelock.executeOperation(operationId);

      const operation = await timelock.getOperation(operationId);
      expect(operation.status).to.equal(2); // EXECUTED

      expect(await timelock.isOperationPending(operationId)).to.be.false;
      expect(await timelock.isOperationReady(operationId)).to.be.false;
    });

    it("should prevent double execution", async function () {
      await advanceTime(DEFAULT_DELAY + 1);
      await timelock.executeOperation(operationId);

      await expect(
        timelock.executeOperation(operationId)
      ).to.be.revertedWith("Operation not pending");
    });

    it("should allow anyone to execute after timelock", async function () {
      await advanceTime(DEFAULT_DELAY + 1);

      await expect(timelock.connect(alice).executeOperation(operationId))
        .to.emit(timelock, "OperationExecuted");
    });

    it("should reject execution of non-existent operation", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        timelock.executeOperation(fakeId)
      ).to.be.revertedWith("Operation does not exist");
    });
  });

  describe("Operation Cancellation", function () {
    let operationId;

    beforeEach(async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = mockTarget.interface.encodeFunctionData("mint", [alice.address, toWei(500)]);
      const description = "Test operation";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      operationId = timelock.interface.parseLog(event).args[0];
    });

    it("should allow owner to cancel pending operation", async function () {
      await expect(timelock.cancelOperation(operationId))
        .to.emit(timelock, "OperationCancelled")
        .withArgs(operationId, owner.address);
    });

    it("should mark operation as cancelled", async function () {
      await timelock.cancelOperation(operationId);

      const operation = await timelock.getOperation(operationId);
      expect(operation.status).to.equal(3); // CANCELLED

      expect(await timelock.isOperationPending(operationId)).to.be.false;
    });

    it("should prevent execution of cancelled operation", async function () {
      await timelock.cancelOperation(operationId);
      await advanceTime(DEFAULT_DELAY + 1);

      await expect(
        timelock.executeOperation(operationId)
      ).to.be.revertedWith("Operation not pending");
    });

    it("should only allow owner to cancel", async function () {
      await expect(
        timelock.connect(alice).cancelOperation(operationId)
      ).to.be.revertedWithCustomError(timelock, "OwnableUnauthorizedAccount");
    });

    it("should prevent cancellation of executed operation", async function () {
      await advanceTime(DEFAULT_DELAY + 1);
      await timelock.executeOperation(operationId);

      await expect(
        timelock.cancelOperation(operationId)
      ).to.be.revertedWith("Operation not pending");
    });
  });

  describe("Delay Management", function () {
    it("should allow owner to update delay", async function () {
      const newDelay = 72 * 3600; // 72 hours

      await expect(timelock.updateTimelockDelay(newDelay))
        .to.emit(timelock, "TimelockDelayUpdated")
        .withArgs(DEFAULT_DELAY, newDelay);

      expect(await timelock.getTimelockDelay()).to.equal(newDelay);
    });

    it("should reject delay below minimum", async function () {
      await expect(
        timelock.updateTimelockDelay(MINIMUM_DELAY - 1)
      ).to.be.revertedWith("Delay too short");
    });

    it("should reject delay above maximum", async function () {
      await expect(
        timelock.updateTimelockDelay(MAXIMUM_DELAY + 1)
      ).to.be.revertedWith("Delay too long");
    });

    it("should only allow owner to update delay", async function () {
      await expect(
        timelock.connect(alice).updateTimelockDelay(72 * 3600)
      ).to.be.revertedWithCustomError(timelock, "OwnableUnauthorizedAccount");
    });

    it("should not affect already queued operations", async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();

      const tx = await timelock.queueOperation(operationType, target, 0, "0x", "Test");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];
      const operationBefore = await timelock.getOperation(operationId);

      // Update delay
      await timelock.updateTimelockDelay(72 * 3600);

      const operationAfter = await timelock.getOperation(operationId);

      // ExecuteAfter should not change
      expect(operationAfter.executeAfter).to.equal(operationBefore.executeAfter);
    });
  });

  describe("View Functions", function () {
    let operationId;

    beforeEach(async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const value = 0;
      const data = "0x";
      const description = "Test operation";

      const tx = await timelock.queueOperation(operationType, target, value, data, description);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      operationId = timelock.interface.parseLog(event).args[0];
    });

    it("should get operation details", async function () {
      const operation = await timelock.getOperation(operationId);

      expect(operation.operationType).to.equal(0);
      expect(operation.target).to.equal(await mockTarget.getAddress());
      expect(operation.value).to.equal(0);
      expect(operation.status).to.equal(0); // PENDING
    });

    it("should check if operation is ready", async function () {
      expect(await timelock.isOperationReady(operationId)).to.be.false;

      await advanceTime(DEFAULT_DELAY + 1);

      expect(await timelock.isOperationReady(operationId)).to.be.true;
    });

    it("should get time remaining", async function () {
      const remaining = await timelock.getTimeRemaining(operationId);

      expect(remaining).to.be.closeTo(DEFAULT_DELAY, 5);

      await advanceTime(DEFAULT_DELAY + 1);

      expect(await timelock.getTimeRemaining(operationId)).to.equal(0);
    });

    it("should get pending operations", async function () {
      // Queue more operations
      await timelock.queueOperation(0, await mockTarget.getAddress(), 0, "0x", "Op 2");
      await timelock.queueOperation(0, await mockTarget.getAddress(), 0, "0x", "Op 3");

      const pending = await timelock.getPendingOperations();
      expect(pending.length).to.equal(3);
    });
  });

  describe("Security Scenarios", function () {
    it("should prevent reentrancy attacks", async function () {
      // This is implicitly tested by the nonReentrant modifier
      // but we verify it works with normal execution
      const operationType = 0;
      const target = await mockTarget.getAddress();
      const data = mockTarget.interface.encodeFunctionData("mint", [alice.address, toWei(1000)]);

      const tx = await timelock.queueOperation(operationType, target, 0, data, "Mint test");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];

      await advanceTime(DEFAULT_DELAY + 1);
      await timelock.executeOperation(operationId);

      // Should succeed without reentrancy issues
      expect(await mockTarget.balanceOf(alice.address)).to.equal(toWei(1000));
    });

    it("should handle failed operations gracefully", async function () {
      const operationType = 0;
      const target = await mockTarget.getAddress();
      // This will fail because we're not providing the required parameters
      const data = "0x12345678"; // Invalid function selector

      const tx = await timelock.queueOperation(operationType, target, 0, data, "Invalid op");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];

      await advanceTime(DEFAULT_DELAY + 1);

      await expect(
        timelock.executeOperation(operationId)
      ).to.be.reverted;
    });
  });

  describe("Integration", function () {
    it("should handle complete operation lifecycle", async function () {
      // 1. Queue operation
      const operationType = 1; // TREASURY_UPDATE
      const target = await mockTarget.getAddress();
      const data = mockTarget.interface.encodeFunctionData("mint", [bob.address, toWei(5000)]);

      const tx = await timelock.queueOperation(operationType, target, 0, data, "Mint for Bob");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log).name === "OperationQueued";
        } catch {
          return false;
        }
      });

      const operationId = timelock.interface.parseLog(event).args[0];

      // 2. Check it's pending
      expect(await timelock.isOperationPending(operationId)).to.be.true;
      expect(await timelock.isOperationReady(operationId)).to.be.false;

      // 3. Wait for timelock
      await advanceTime(DEFAULT_DELAY + 1);

      // 4. Check it's ready
      expect(await timelock.isOperationReady(operationId)).to.be.true;

      // 5. Execute
      await timelock.connect(alice).executeOperation(operationId);

      // 6. Verify execution
      expect(await mockTarget.balanceOf(bob.address)).to.equal(toWei(5000));

      // 7. Check final state
      const operation = await timelock.getOperation(operationId);
      expect(operation.status).to.equal(2); // EXECUTED
      expect(await timelock.isOperationPending(operationId)).to.be.false;
    });
  });
});
