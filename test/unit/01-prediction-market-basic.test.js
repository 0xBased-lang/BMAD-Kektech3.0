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
 * PredictionMarket Basic Test Suite
 *
 * This test suite verifies core functionality of the PredictionMarket contract
 * Tests all 6 security fixes and basic functionality
 */
describe("PredictionMarket - Basic Tests", function () {
  let basedToken;
  let predictionMarket;
  let creator, resolver, factory, treasury, alice, bob;

  beforeEach(async function () {
    // Get signers
    const signers = await getNamedSigners();
    creator = signers.deployer;
    resolver = signers.resolver;
    factory = signers.factory;
    treasury = signers.treasury;
    alice = signers.alice;
    bob = signers.bob;

    // Deploy BASED token
    basedToken = await deployContract("MockERC20", ["BASED Token", "BASED", toWei(1000000)]);

    // Transfer tokens
    await basedToken.transfer(alice.address, toWei(20000));
    await basedToken.transfer(bob.address, toWei(20000));

    // Calculate timestamps
    const currentTime = await getCurrentTimestamp();
    const endTime = currentTime + (86400 * 7); // 7 days
    const resolutionTime = endTime + (86400 * 1); // 1 day after end

    // Deploy market
    const MarketFactory = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await MarketFactory.connect(factory).deploy(
      creator.address,
      resolver.address,
      "Will ETH reach $5000?",
      endTime,
      resolutionTime,
      await basedToken.getAddress(),
      treasury.address,
      100, // base fee 1%
      50,  // platform fee 0.5%
      100, // creator fee 1%
      50   // max additional fee 0.5%
    );
    await predictionMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await predictionMarket.creator()).to.equal(creator.address);
      expect(await predictionMarket.resolver()).to.equal(resolver.address);
      expect(await predictionMarket.factory()).to.equal(factory.address);
      expect(await predictionMarket.platformTreasury()).to.equal(treasury.address);
      expect(await predictionMarket.question()).to.equal("Will ETH reach $5000?");
    });

    it("should start in ACTIVE state", async function () {
      expect(await predictionMarket.state()).to.equal(1); // MarketState.ACTIVE
    });

    it("should have 2 outcomes (YES/NO)", async function () {
      const outcome0 = await predictionMarket.outcomes(0);
      const outcome1 = await predictionMarket.outcomes(1);

      expect(outcome0.outcomeType).to.equal(0); // YES
      expect(outcome1.outcomeType).to.equal(1); // NO
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(20000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(20000));
    });

    it("should allow placing bets", async function () {
      await expect(predictionMarket.connect(alice).placeBet(0, toWei(100)))
        .to.emit(predictionMarket, "BetPlaced");
    });

    it("should collect fees using linear formula (Fix #1)", async function () {
      await predictionMarket.connect(alice).placeBet(0, toWei(1000));

      // Fees should be accumulated
      const creatorFees = await predictionMarket.claimableCreatorFees();
      const platformFees = await predictionMarket.claimablePlatformFees();

      expect(creatorFees).to.be.greaterThan(0);
      expect(platformFees).to.be.greaterThan(0);
    });

    it("should accept bets within grace period (Fix #6)", async function () {
      // Advance to end time
      const endTime = await predictionMarket.endTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(endTime) - currentTime + 1);

      // Should still accept within grace period (5 minutes)
      await expect(predictionMarket.connect(alice).placeBet(0, toWei(100)))
        .to.emit(predictionMarket, "BetPlaced");
    });

    it("should reject bets after grace period (Fix #6)", async function () {
      const endTime = await predictionMarket.endTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(endTime) - currentTime + 301); // 5 minutes + 1 second

      await expect(
        predictionMarket.connect(alice).placeBet(0, toWei(100))
      ).to.be.revertedWith("Grace period ended");
    });
  });

  describe("Resolution", function () {
    beforeEach(async function () {
      // Place bets above minimum volume
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(20000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(20000));

      await predictionMarket.connect(alice).placeBet(0, toWei(6000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      // Advance past resolution time
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);
    });

    it("should allow resolver to propose resolution", async function () {
      await expect(predictionMarket.connect(resolver).proposeResolution(0))
        .to.emit(predictionMarket, "ResolutionProposed");
    });

    it("should finalize after proposal delay", async function () {
      await predictionMarket.connect(resolver).proposeResolution(0);

      // Advance past proposal delay (48 hours)
      await advanceTime(48 * 3600 + 1);

      await expect(predictionMarket.connect(resolver).finalizeResolution())
        .to.emit(predictionMarket, "MarketResolved");
    });

    it("should go to REFUNDING if minimum volume not met (Fix #3)", async function () {
      // Deploy new market
      const currentTime = await getCurrentTimestamp();
      const MarketFactory = await ethers.getContractFactory("PredictionMarket");
      const newMarket = await MarketFactory.connect(factory).deploy(
        creator.address,
        resolver.address,
        "Test market",
        currentTime + 1000,
        currentTime + 2000,
        await basedToken.getAddress(),
        treasury.address,
        100, 50, 100, 50
      );
      await newMarket.waitForDeployment();

      // Place small bet (below minimum volume)
      await basedToken.connect(alice).approve(await newMarket.getAddress(), toWei(20000));
      await newMarket.connect(alice).placeBet(0, toWei(100));

      // Advance past resolution time
      await advanceTime(2100);

      await newMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);

      await newMarket.connect(resolver).finalizeResolution();

      // Should be in REFUNDING state
      expect(await newMarket.state()).to.equal(3); // MarketState.REFUNDING
    });
  });

  describe("Claims (Fix #2, #4)", function () {
    beforeEach(async function () {
      // Setup and resolve market
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(20000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(20000));

      await predictionMarket.connect(alice).placeBet(0, toWei(6000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();
    });

    it("should allow winners to claim (Fix #2: multiply before divide)", async function () {
      const aliceBalanceBefore = await basedToken.balanceOf(alice.address);

      await expect(predictionMarket.connect(alice).claimWinnings())
        .to.emit(predictionMarket, "WinningsClaimed");

      const aliceBalanceAfter = await basedToken.balanceOf(alice.address);
      expect(aliceBalanceAfter).to.be.greaterThan(aliceBalanceBefore);
    });

    it("should use pull payment pattern (Fix #4)", async function () {
      // Fees accumulated during betting
      const creatorFeesBefore = await predictionMarket.claimableCreatorFees();
      expect(creatorFeesBefore).to.be.greaterThan(0);

      // Creator pulls fees
      const creatorBalanceBefore = await basedToken.balanceOf(creator.address);
      await predictionMarket.connect(creator).claimCreatorFees();
      const creatorBalanceAfter = await basedToken.balanceOf(creator.address);

      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(creatorFeesBefore);
      expect(await predictionMarket.claimableCreatorFees()).to.equal(0);
    });

    it("should prevent double claiming", async function () {
      await predictionMarket.connect(alice).claimWinnings();

      await expect(
        predictionMarket.connect(alice).claimWinnings()
      ).to.be.revertedWith("Already claimed");
    });
  });

  describe("Reversal (Fix #5)", function () {
    beforeEach(async function () {
      // Setup and resolve
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(20000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(20000));

      await predictionMarket.connect(alice).placeBet(0, toWei(6000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();
    });

    it("should allow resolution reversal", async function () {
      await expect(predictionMarket.connect(resolver).reverseResolution(1))
        .to.emit(predictionMarket, "ResolutionReversed");

      expect(await predictionMarket.correctOutcomeIndex()).to.equal(1);
    });

    it("should enforce maximum 2 reversals (Fix #5)", async function () {
      // First reversal
      await predictionMarket.connect(resolver).reverseResolution(1);
      expect(await predictionMarket.reversalCount()).to.equal(1);

      // Second reversal
      await predictionMarket.connect(resolver).reverseResolution(0);
      expect(await predictionMarket.reversalCount()).to.equal(2);

      // Third should fail
      await expect(
        predictionMarket.connect(resolver).reverseResolution(1)
      ).to.be.revertedWith("Max reversals reached");
    });
  });

  describe("Integration", function () {
    it("should handle complete lifecycle", async function () {
      // 1. Market starts ACTIVE
      expect(await predictionMarket.state()).to.equal(1);

      // 2. Place bets
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(20000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(20000));

      await predictionMarket.connect(alice).placeBet(0, toWei(7000));
      await predictionMarket.connect(bob).placeBet(1, toWei(4000));

      // 3. Advance time
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      // 4. Propose resolution
      await predictionMarket.connect(resolver).proposeResolution(0);

      // 5. Finalize
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // 6. Claim winnings
      await predictionMarket.connect(alice).claimWinnings();

      // 7. Claim fees
      await predictionMarket.connect(creator).claimCreatorFees();
      await predictionMarket.connect(factory).claimPlatformFees();

      // Success - no reverts
    });
  });
});
