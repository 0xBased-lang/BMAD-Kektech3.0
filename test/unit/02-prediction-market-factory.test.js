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
 * PredictionMarketFactory Test Suite
 *
 * Tests all factory functionality including:
 * - Market creation
 * - Fee parameter management with timelock
 * - Treasury updates
 * - Implementation upgrades
 * - Pause/unpause
 * - View functions
 */
describe("PredictionMarketFactory", function () {
  let factory;
  let basedToken;
  let marketImplementation;
  let owner, treasury, alice, bob, resolver;

  const DEFAULT_FEE_PARAMS = {
    baseFeeBps: 100,       // 1%
    platformFeeBps: 50,    // 0.5%
    creatorFeeBps: 100,    // 1%
    maxAdditionalFeeBps: 50 // 0.5%
  };

  const TIMELOCK_DELAY = 48 * 3600; // 48 hours

  beforeEach(async function () {
    const signers = await getNamedSigners();
    owner = signers.deployer;
    treasury = signers.treasury;
    alice = signers.alice;
    bob = signers.bob;
    resolver = signers.resolver;

    // Deploy BASED token
    basedToken = await deployContract("MockERC20", ["BASED Token", "BASED", toWei(1000000)]);

    // Deploy market implementation
    const currentTime = await getCurrentTimestamp();
    const MarketFactory = await ethers.getContractFactory("PredictionMarket");
    marketImplementation = await MarketFactory.deploy(
      owner.address,
      resolver.address,
      "Template Market",
      currentTime + 1000,
      currentTime + 2000,
      await basedToken.getAddress(),
      treasury.address,
      100, 50, 100, 50
    );
    await marketImplementation.waitForDeployment();

    // Deploy factory
    const FactoryContract = await ethers.getContractFactory("PredictionMarketFactory");
    factory = await FactoryContract.deploy(
      await basedToken.getAddress(),
      treasury.address,
      await marketImplementation.getAddress(),
      DEFAULT_FEE_PARAMS
    );
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await factory.basedToken()).to.equal(await basedToken.getAddress());
      expect(await factory.treasury()).to.equal(treasury.address);
      expect(await factory.marketImplementation()).to.equal(await marketImplementation.getAddress());
    });

    it("should initialize with correct fee parameters", async function () {
      const feeParams = await factory.getFeeParameters();
      expect(feeParams.baseFeeBps).to.equal(DEFAULT_FEE_PARAMS.baseFeeBps);
      expect(feeParams.platformFeeBps).to.equal(DEFAULT_FEE_PARAMS.platformFeeBps);
      expect(feeParams.creatorFeeBps).to.equal(DEFAULT_FEE_PARAMS.creatorFeeBps);
      expect(feeParams.maxAdditionalFeeBps).to.equal(DEFAULT_FEE_PARAMS.maxAdditionalFeeBps);
    });

    it("should start unpaused", async function () {
      expect(await factory.isPaused()).to.be.false;
    });

    it("should reject invalid token address", async function () {
      const FactoryContract = await ethers.getContractFactory("PredictionMarketFactory");
      await expect(
        FactoryContract.deploy(
          ethers.ZeroAddress,
          treasury.address,
          await marketImplementation.getAddress(),
          DEFAULT_FEE_PARAMS
        )
      ).to.be.revertedWith("Invalid token");
    });

    it("should reject fees exceeding 7% (Fix #8)", async function () {
      const FactoryContract = await ethers.getContractFactory("PredictionMarketFactory");
      const invalidFees = {
        baseFeeBps: 300,  // 3%
        platformFeeBps: 300, // 3%
        creatorFeeBps: 200,  // 2%
        maxAdditionalFeeBps: 100 // 1% = 9% total
      };

      await expect(
        FactoryContract.deploy(
          await basedToken.getAddress(),
          treasury.address,
          await marketImplementation.getAddress(),
          invalidFees
        )
      ).to.be.revertedWith("Total fees exceed 7%");
    });
  });

  describe("Market Creation", function () {
    it("should create a new market", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Will ETH reach $5000?",
        endTime: currentTime + 86400 * 7,
        resolutionTime: currentTime + 86400 * 8,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.emit(factory, "MarketCreated");

      expect(await factory.getMarketCount()).to.equal(1);
    });

    it("should track markets by creator", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Will ETH reach $5000?",
        endTime: currentTime + 86400 * 7,
        resolutionTime: currentTime + 86400 * 8,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await factory.connect(alice).createMarket(params);
      await factory.connect(alice).createMarket(params);
      await factory.connect(bob).createMarket(params);

      const aliceMarkets = await factory.getMarketsByCreator(alice.address);
      const bobMarkets = await factory.getMarketsByCreator(bob.address);

      expect(aliceMarkets.length).to.equal(2);
      expect(bobMarkets.length).to.equal(1);
    });

    it("should validate market as created by factory", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Will ETH reach $5000?",
        endTime: currentTime + 86400 * 7,
        resolutionTime: currentTime + 86400 * 8,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      const tx = await factory.connect(alice).createMarket(params);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreated";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args[0];

      expect(await factory.isValidMarket(marketAddress)).to.be.true;
      expect(await factory.isValidMarket(ethers.ZeroAddress)).to.be.false;
    });

    it("should reject empty question", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "",
        endTime: currentTime + 86400 * 7,
        resolutionTime: currentTime + 86400 * 8,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.be.revertedWith("Empty question");
    });

    it("should reject end time in past", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Test question?",
        endTime: currentTime - 1000,
        resolutionTime: currentTime + 1000,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.be.revertedWith("End time in past");
    });

    it("should reject invalid resolution time", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Test question?",
        endTime: currentTime + 2000,
        resolutionTime: currentTime + 1000, // Before end time
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.be.revertedWith("Invalid resolution time");
    });

    it("should reject non-binary outcomes", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Test question?",
        endTime: currentTime + 1000,
        resolutionTime: currentTime + 2000,
        resolver: resolver.address,
        outcomes: ["Yes", "No", "Maybe"] // 3 outcomes
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.be.revertedWith("Must have 2 outcomes");
    });

    it("should reject market creation when paused", async function () {
      await factory.pause();

      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Test question?",
        endTime: currentTime + 1000,
        resolutionTime: currentTime + 2000,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await expect(factory.connect(alice).createMarket(params))
        .to.be.revertedWithCustomError(factory, "EnforcedPause");
    });
  });

  describe("Fee Parameter Management (Fix #8)", function () {
    it("should queue fee parameter update", async function () {
      const newFees = {
        baseFeeBps: 150,
        platformFeeBps: 75,
        creatorFeeBps: 125,
        maxAdditionalFeeBps: 75
      };

      await expect(
        factory.queueFeeUpdate(
          newFees.baseFeeBps,
          newFees.platformFeeBps,
          newFees.creatorFeeBps,
          newFees.maxAdditionalFeeBps
        )
      ).to.emit(factory, "ParameterUpdateQueued");

      const queued = await factory.getQueuedFeeUpdate();
      expect(queued.isQueued).to.be.true;
    });

    it("should enforce timelock delay for fee updates", async function () {
      const newFees = {
        baseFeeBps: 150,
        platformFeeBps: 75,
        creatorFeeBps: 125,
        maxAdditionalFeeBps: 75
      };

      await factory.queueFeeUpdate(
        newFees.baseFeeBps,
        newFees.platformFeeBps,
        newFees.creatorFeeBps,
        newFees.maxAdditionalFeeBps
      );

      // Try to execute immediately - should fail
      await expect(factory.executeFeeUpdate())
        .to.be.revertedWith("Timelock not expired");

      // Advance time past delay
      await advanceTime(TIMELOCK_DELAY + 1);

      // Should succeed now
      await expect(factory.executeFeeUpdate())
        .to.emit(factory, "FeeParametersUpdated");
    });

    it("should update fee parameters after timelock", async function () {
      const newFees = {
        baseFeeBps: 150,
        platformFeeBps: 75,
        creatorFeeBps: 125,
        maxAdditionalFeeBps: 75
      };

      await factory.queueFeeUpdate(
        newFees.baseFeeBps,
        newFees.platformFeeBps,
        newFees.creatorFeeBps,
        newFees.maxAdditionalFeeBps
      );

      await advanceTime(TIMELOCK_DELAY + 1);
      await factory.executeFeeUpdate();

      const feeParams = await factory.getFeeParameters();
      expect(feeParams.baseFeeBps).to.equal(newFees.baseFeeBps);
      expect(feeParams.platformFeeBps).to.equal(newFees.platformFeeBps);
      expect(feeParams.creatorFeeBps).to.equal(newFees.creatorFeeBps);
      expect(feeParams.maxAdditionalFeeBps).to.equal(newFees.maxAdditionalFeeBps);
    });

    it("should allow owner to cancel queued update", async function () {
      const newFees = {
        baseFeeBps: 150,
        platformFeeBps: 75,
        creatorFeeBps: 125,
        maxAdditionalFeeBps: 75
      };

      await factory.queueFeeUpdate(
        newFees.baseFeeBps,
        newFees.platformFeeBps,
        newFees.creatorFeeBps,
        newFees.maxAdditionalFeeBps
      );

      await expect(factory.cancelFeeUpdate())
        .to.emit(factory, "ParameterUpdateCancelled");

      const queued = await factory.getQueuedFeeUpdate();
      expect(queued.isQueued).to.be.false;
    });

    it("should reject fee updates exceeding 7% (Fix #8)", async function () {
      const invalidFees = {
        baseFeeBps: 300,
        platformFeeBps: 300,
        creatorFeeBps: 200,
        maxAdditionalFeeBps: 100 // Total 9%
      };

      await expect(
        factory.queueFeeUpdate(
          invalidFees.baseFeeBps,
          invalidFees.platformFeeBps,
          invalidFees.creatorFeeBps,
          invalidFees.maxAdditionalFeeBps
        )
      ).to.be.revertedWith("Total fees exceed 7%");
    });

    it("should reject queueing when update already pending", async function () {
      const newFees = {
        baseFeeBps: 150,
        platformFeeBps: 75,
        creatorFeeBps: 125,
        maxAdditionalFeeBps: 75
      };

      await factory.queueFeeUpdate(
        newFees.baseFeeBps,
        newFees.platformFeeBps,
        newFees.creatorFeeBps,
        newFees.maxAdditionalFeeBps
      );

      await expect(
        factory.queueFeeUpdate(150, 75, 125, 75)
      ).to.be.revertedWith("Update already queued");
    });

    it("should only allow owner to queue updates", async function () {
      await expect(
        factory.connect(alice).queueFeeUpdate(150, 75, 125, 75)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should only allow owner to cancel updates", async function () {
      await factory.queueFeeUpdate(150, 75, 125, 75);

      await expect(
        factory.connect(alice).cancelFeeUpdate()
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Treasury Management", function () {
    it("should update treasury address", async function () {
      const newTreasury = alice.address;

      await expect(factory.updateTreasury(newTreasury))
        .to.emit(factory, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury);

      expect(await factory.getTreasury()).to.equal(newTreasury);
    });

    it("should reject zero address treasury", async function () {
      await expect(factory.updateTreasury(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid treasury");
    });

    it("should only allow owner to update treasury", async function () {
      await expect(
        factory.connect(alice).updateTreasury(bob.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Implementation Upgrades", function () {
    it("should upgrade market implementation", async function () {
      const currentTime = await getCurrentTimestamp();
      const MarketFactory = await ethers.getContractFactory("PredictionMarket");
      const newImplementation = await MarketFactory.deploy(
        owner.address,
        resolver.address,
        "New Template",
        currentTime + 1000,
        currentTime + 2000,
        await basedToken.getAddress(),
        treasury.address,
        100, 50, 100, 50
      );
      await newImplementation.waitForDeployment();

      await expect(factory.upgradeImplementation(await newImplementation.getAddress()))
        .to.emit(factory, "ImplementationUpgraded");

      expect(await factory.getImplementation()).to.equal(await newImplementation.getAddress());
    });

    it("should reject zero address implementation", async function () {
      await expect(factory.upgradeImplementation(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid implementation");
    });

    it("should only allow owner to upgrade implementation", async function () {
      await expect(
        factory.connect(alice).upgradeImplementation(alice.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pause/Unpause", function () {
    it("should allow owner to pause factory", async function () {
      await expect(factory.pause())
        .to.emit(factory, "FactoryPaused")
        .withArgs(owner.address);

      expect(await factory.isPaused()).to.be.true;
    });

    it("should allow owner to unpause factory", async function () {
      await factory.pause();

      await expect(factory.unpause())
        .to.emit(factory, "FactoryUnpaused")
        .withArgs(owner.address);

      expect(await factory.isPaused()).to.be.false;
    });

    it("should only allow owner to pause", async function () {
      await expect(
        factory.connect(alice).pause()
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should only allow owner to unpause", async function () {
      await factory.pause();

      await expect(
        factory.connect(alice).unpause()
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("should return correct timelock delay", async function () {
      expect(await factory.getTimelockDelay()).to.equal(TIMELOCK_DELAY);
    });

    it("should get market by index", async function () {
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Test?",
        endTime: currentTime + 1000,
        resolutionTime: currentTime + 2000,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await factory.createMarket(params);

      const marketAddress = await factory.getMarket(0);
      expect(marketAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should reject invalid market index", async function () {
      await expect(factory.getMarket(0))
        .to.be.revertedWith("Index out of bounds");
    });
  });

  describe("Integration", function () {
    it("should handle complete workflow", async function () {
      // 1. Create market
      const currentTime = await getCurrentTimestamp();
      const params = {
        question: "Will BTC reach $100k?",
        endTime: currentTime + 86400 * 7,
        resolutionTime: currentTime + 86400 * 8,
        resolver: resolver.address,
        outcomes: ["Yes", "No"]
      };

      await factory.connect(alice).createMarket(params);
      expect(await factory.getMarketCount()).to.equal(1);

      // 2. Queue fee update
      await factory.queueFeeUpdate(150, 75, 125, 75);
      const queued = await factory.getQueuedFeeUpdate();
      expect(queued.isQueued).to.be.true;

      // 3. Wait for timelock
      await advanceTime(TIMELOCK_DELAY + 1);

      // 4. Execute update
      await factory.executeFeeUpdate();
      const newFees = await factory.getFeeParameters();
      expect(newFees.baseFeeBps).to.equal(150);

      // 5. Update treasury
      await factory.updateTreasury(bob.address);
      expect(await factory.getTreasury()).to.equal(bob.address);

      // Success - no reverts
    });
  });
});
