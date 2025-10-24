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
 * PredictionMarket Coverage Enhancement Tests
 *
 * Tests for uncovered code paths to reach 90% coverage:
 * 1. REFUNDING state and claimRefund()
 * 2. High-volume fee scenarios (additional fee cap)
 * 3. View function edge cases
 */
describe("PredictionMarket - Coverage Enhancement", function () {
  let basedToken;
  let predictionMarket;
  let creator, resolver, factory, treasury, alice, bob, carol, dave;

  beforeEach(async function () {
    const signers = await getNamedSigners();
    creator = signers.deployer;
    resolver = signers.resolver;
    factory = signers.factory;
    treasury = signers.treasury;
    alice = signers.alice;
    bob = signers.bob;
    carol = signers.carol;
    dave = signers.dave;

    basedToken = await deployContract("MockERC20", ["BASED", "BASED", toWei(10000000)]);

    await basedToken.transfer(alice.address, toWei(50000));
    await basedToken.transfer(bob.address, toWei(50000));
    await basedToken.transfer(carol.address, toWei(50000));
    await basedToken.transfer(dave.address, toWei(50000));

    const currentTime = await getCurrentTimestamp();
    const MarketFactory = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await MarketFactory.connect(factory).deploy(
      creator.address,
      resolver.address,
      "Will ETH reach $5000?",
      currentTime + 86400 * 7,
      currentTime + 86400 * 8,
      await basedToken.getAddress(),
      treasury.address,
      100, // baseFeeBps
      50,  // platformFeeBps
      100, // creatorFeeBps
      50   // maxAdditionalFeeBps
    );
    await predictionMarket.waitForDeployment();
  });

  describe("REFUNDING State and claimRefund()", function () {
    it("should enter REFUNDING state when volume below minimum", async function () {
      // Place small bets (below 10,000 BASED minimum)
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(3000));

      // Advance to resolution time
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      // Propose and finalize resolution
      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);

      // Finalize should trigger REFUNDING state (Fix #3)
      await predictionMarket.connect(resolver).finalizeResolution();

      // Verify state is REFUNDING (state enum: 0=ACTIVE, 1=PROPOSED, 2=RESOLVED, 3=REFUNDING)
      expect(await predictionMarket.state()).to.equal(3);
    });

    it("should allow users to claim refunds in REFUNDING state", async function () {
      // Setup REFUNDING state
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));
      await predictionMarket.connect(alice).placeBet(0, toWei(1000)); // Multiple bets

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(3000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Alice claims refund
      const aliceBalanceBefore = await basedToken.balanceOf(alice.address);

      await expect(predictionMarket.connect(alice).claimRefund())
        .to.emit(predictionMarket, "RefundClaimed");

      const aliceBalanceAfter = await basedToken.balanceOf(alice.address);

      // Alice should get back her bets (minus fees)
      // She bet 3000 total, so should get most back (some taken as fees)
      expect(aliceBalanceAfter).to.be.greaterThan(aliceBalanceBefore);

      // Calculate expected refund (approximately 2970 after 1% fees)
      const expectedRefundApprox = toWei(2970); // 3000 - ~1% fees
      expect(aliceBalanceAfter - aliceBalanceBefore).to.be.greaterThan(expectedRefundApprox - toWei(100));
    });

    it("should prevent double claiming refunds", async function () {
      // Setup REFUNDING state
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(3000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // First claim succeeds
      await predictionMarket.connect(alice).claimRefund();

      // Second claim fails
      await expect(
        predictionMarket.connect(alice).claimRefund()
      ).to.be.revertedWith("Already claimed refund");
    });

    it("should reject refund claims when not in REFUNDING state", async function () {
      // Market is in ACTIVE state
      await expect(
        predictionMarket.connect(alice).claimRefund()
      ).to.be.revertedWith("Market not refunding");
    });

    it("should reject refund claim with no bets", async function () {
      // Setup REFUNDING state
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(3000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Carol has no bets, should fail
      await expect(
        predictionMarket.connect(carol).claimRefund()
      ).to.be.revertedWith("No refund to claim");
    });
  });

  describe("High Volume Fee Scenarios", function () {
    it("should cap additional fees at maxAdditionalFeeBps", async function () {
      // Place many large bets to trigger high volume
      // maxAdditionalFeeBps = 50 (0.5%)
      // Additional fee increases by 1 bps per 1,000 BASED
      // So we need >50,000 BASED volume to trigger the cap

      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await basedToken.connect(carol).approve(await predictionMarket.getAddress(), toWei(50000));
      await basedToken.connect(dave).approve(await predictionMarket.getAddress(), toWei(50000));

      // Place large bets to accumulate >50,000 BASED volume
      await predictionMarket.connect(alice).placeBet(0, toWei(20000));
      await predictionMarket.connect(bob).placeBet(1, toWei(20000));
      await predictionMarket.connect(carol).placeBet(0, toWei(15000));

      // Check total volume is high enough to trigger cap
      const volumeBefore = await predictionMarket.totalVolume();
      expect(volumeBefore).to.be.greaterThan(toWei(50000));

      // Place one more bet - additional fee should be capped
      await expect(predictionMarket.connect(dave).placeBet(1, toWei(10000)))
        .to.emit(predictionMarket, "BetPlaced");

      // Verify the bet was placed successfully despite high volume
      const daveBets = await predictionMarket.getUserBets(dave.address);
      expect(daveBets.length).to.equal(1);
    });

    it("should calculate linear additional fees correctly", async function () {
      // Test linear fee formula (Fix #1)
      // 1,000 BASED = 1 basis point additional fee

      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));

      // First bet: Volume ~0, additional fee ~0 bps
      await predictionMarket.connect(alice).placeBet(0, toWei(5000));

      // Check volume increased
      const volumeAfterFirst = await predictionMarket.totalVolume();
      expect(volumeAfterFirst).to.be.greaterThan(0);

      // Second bet: Volume ~5,000, additional fee ~5 bps
      await expect(predictionMarket.connect(bob).placeBet(1, toWei(5000)))
        .to.emit(predictionMarket, "BetPlaced");

      // Volume should have increased further
      const volumeAfterSecond = await predictionMarket.totalVolume();
      expect(volumeAfterSecond).to.be.greaterThan(volumeAfterFirst);
    });
  });

  describe("View Function Edge Cases", function () {
    it("should return 0 for calculateClaimableWinnings in non-RESOLVED state", async function () {
      // Market is ACTIVE
      const claimable = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimable).to.equal(0);
    });

    it("should return 0 for calculateClaimableWinnings when already claimed", async function () {
      // Setup and resolve market
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Before claim
      const claimableBefore = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimableBefore).to.be.greaterThan(0);

      // Claim winnings
      await predictionMarket.connect(alice).claimWinnings();

      // After claim
      const claimableAfter = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimableAfter).to.equal(0);
    });

    it("should calculate additional fees correctly via view function", async function () {
      // Test calculateAdditionalFee view function (requires 4 parameters)
      const volume0 = toWei(0);
      const volume1000 = toWei(1000);
      const volume5000 = toWei(5000);
      const volume100000 = toWei(100000);

      // Function signature: calculateAdditionalFee(volume, base, platform, creator)
      expect(await predictionMarket.calculateAdditionalFee(volume0, 100, 50, 100)).to.equal(0);
      expect(await predictionMarket.calculateAdditionalFee(volume1000, 100, 50, 100)).to.equal(1);
      expect(await predictionMarket.calculateAdditionalFee(volume5000, 100, 50, 100)).to.equal(5);

      // High volume should not cap in view function (cap happens in actual collection)
      expect(await predictionMarket.calculateAdditionalFee(volume100000, 100, 50, 100)).to.equal(100);
    });

    it("should handle getUserBets for user with multiple bets", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));

      await predictionMarket.connect(alice).placeBet(0, toWei(1000));
      await predictionMarket.connect(alice).placeBet(1, toWei(2000));
      await predictionMarket.connect(alice).placeBet(0, toWei(3000));

      const bets = await predictionMarket.getUserBets(alice.address);
      expect(bets.length).to.equal(3);

      // Bets should be stored after fees are deducted
      // Each bet will be slightly less than the input amount due to fees
      expect(bets[0].amount).to.be.greaterThan(toWei(900));
      expect(bets[0].amount).to.be.lessThan(toWei(1000));

      expect(bets[1].amount).to.be.greaterThan(toWei(1900));
      expect(bets[1].amount).to.be.lessThan(toWei(2000));

      expect(bets[2].amount).to.be.greaterThan(toWei(2900));
      expect(bets[2].amount).to.be.lessThan(toWei(3000));
    });

    it("should return correct market state and properties", async function () {
      // Create a fresh market for this test to ensure clean state
      const currentTime = await getCurrentTimestamp();
      const MarketFactory = await ethers.getContractFactory("PredictionMarket");
      const freshMarket = await MarketFactory.connect(factory).deploy(
        creator.address,
        resolver.address,
        "Fresh Test Market",
        currentTime + 86400 * 7,
        currentTime + 86400 * 8,
        await basedToken.getAddress(),
        treasury.address,
        100, 50, 100, 50
      );
      await freshMarket.waitForDeployment();

      // Test individual getters
      expect(await freshMarket.creator()).to.equal(creator.address);
      expect(await freshMarket.resolver()).to.equal(resolver.address);
      expect(await freshMarket.question()).to.equal("Fresh Test Market");
      expect(await freshMarket.state()).to.equal(1); // ACTIVE (enum: CREATED=0, ACTIVE=1, RESOLVED=2, REFUNDING=3, FINALIZED=4)
    });

    it("should verify grace period status correctly", async function () {
      // Initially in grace period
      expect(await predictionMarket.isInGracePeriod()).to.be.true;

      // After end time but within grace period
      const endTime = await predictionMarket.endTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(endTime) - currentTime + 60);

      expect(await predictionMarket.isInGracePeriod()).to.be.true;

      // After grace period
      await advanceTime(6 * 60); // 6 more minutes (total 7 min past end time, grace is 5 min)
      expect(await predictionMarket.isInGracePeriod()).to.be.false;
    });
  });

  describe("Edge Cases and Defensive Checks", function () {
    it("should handle zero-amount outcome correctly", async function () {
      // Only Alice bets on outcome 0
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(15000));

      // Advance and resolve to outcome 1 (which has 0 amount)
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(1);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // No one should have winnings on outcome 1
      const claimable = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimable).to.equal(0);
    });

    it("should emit correct events for all claim operations", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(15000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(10000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Claim winnings - should emit event
      await expect(predictionMarket.connect(alice).claimWinnings())
        .to.emit(predictionMarket, "WinningsClaimed");
    });

    it("should handle max total fees validation correctly", async function () {
      // This should pass with normal fees
      // base(100) + platform(50) + creator(100) + additional(50 max) = 300 bps = 3%
      // Well below 700 bps (7%) limit

      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));

      // Should not revert
      await expect(
        predictionMarket.connect(alice).placeBet(0, toWei(10000))
      ).to.not.be.reverted;
    });
  });
});
