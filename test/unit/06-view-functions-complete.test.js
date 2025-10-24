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
 * View Functions Complete Coverage Test Suite
 *
 * Ultra-targeted tests for 100% view function coverage
 * Targets specific uncovered lines: 520, 527-539, 546, 553-554, 561, 568
 */
describe("PredictionMarket - View Functions Complete Coverage", function () {
  let basedToken;
  let predictionMarket;
  let creator, resolver, factory, treasury, alice, bob, carol;

  beforeEach(async function () {
    const signers = await getNamedSigners();
    creator = signers.deployer;
    resolver = signers.resolver;
    factory = signers.factory;
    treasury = signers.treasury;
    alice = signers.alice;
    bob = signers.bob;
    carol = signers.carol;

    basedToken = await deployContract("MockERC20", ["BASED", "BASED", toWei(1000000)]);

    await basedToken.transfer(alice.address, toWei(50000));
    await basedToken.transfer(bob.address, toWei(50000));
    await basedToken.transfer(carol.address, toWei(50000));

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
      100, 50, 100, 50
    );
    await predictionMarket.waitForDeployment();
  });

  describe("calculateClaimableWinnings() - Line 520", function () {
    it("should return totalWinnings for user with winning bets", async function () {
      // Setup: Alice bets on outcome 0, Bob bets on outcome 1
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      // Resolve to outcome 0 (Alice wins)
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Target line 520: return totalWinnings
      const claimable = await predictionMarket.calculateClaimableWinnings(alice.address);

      // Alice should have winnings (her bet + Bob's losing bet)
      expect(claimable).to.be.greaterThan(toWei(10000));
      expect(claimable).to.be.lessThan(toWei(20000));
    });

    it("should return 0 for user with no winning bets", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      // Resolve to outcome 1 (Bob wins, Alice loses)
      await predictionMarket.connect(resolver).proposeResolution(1);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Alice has losing bets only
      const claimable = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimable).to.equal(0);
    });

    it("should handle user with mix of winning and losing bets correctly", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));

      // Alice bets on both outcomes
      await predictionMarket.connect(alice).placeBet(0, toWei(8000));
      await predictionMarket.connect(alice).placeBet(1, toWei(2000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      // Resolve to outcome 0
      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      // Alice's outcome 0 bets win, outcome 1 bets lose
      const claimable = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(claimable).to.be.greaterThan(toWei(8000));
    });
  });

  describe("calculateRefund() - Lines 527-539", function () {
    let refundingMarket;

    beforeEach(async function () {
      // Create a market that will enter REFUNDING state
      const currentTime = await getCurrentTimestamp();
      const MarketFactory = await ethers.getContractFactory("PredictionMarket");
      refundingMarket = await MarketFactory.connect(factory).deploy(
        creator.address,
        resolver.address,
        "Refunding Test Market",
        currentTime + 86400 * 7,
        currentTime + 86400 * 8,
        await basedToken.getAddress(),
        treasury.address,
        100, 50, 100, 50
      );
      await refundingMarket.waitForDeployment();
    });

    it("should calculate refund amount correctly in REFUNDING state", async function () {
      // Place small bets (below 10,000 BASED minimum)
      await basedToken.connect(alice).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(alice).placeBet(0, toWei(2000));
      await refundingMarket.connect(alice).placeBet(0, toWei(1000));

      await basedToken.connect(bob).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(bob).placeBet(1, toWei(2000));

      // Trigger REFUNDING state
      const resolutionTime = await refundingMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await refundingMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await refundingMarket.connect(resolver).finalizeResolution();

      // Verify REFUNDING state
      expect(await refundingMarket.state()).to.equal(3); // REFUNDING

      // Target lines 527-539: calculate refund
      const aliceRefund = await refundingMarket.calculateRefund(alice.address);
      const bobRefund = await refundingMarket.calculateRefund(bob.address);

      // Alice bet 3000 total (minus fees)
      expect(aliceRefund).to.be.greaterThan(toWei(2800));
      expect(aliceRefund).to.be.lessThan(toWei(3000));

      // Bob bet 2000 (minus fees)
      expect(bobRefund).to.be.greaterThan(toWei(1900));
      expect(bobRefund).to.be.lessThan(toWei(2000));
    });

    it("should return 0 when not in REFUNDING state (line 527)", async function () {
      // Market is ACTIVE
      const refund = await refundingMarket.calculateRefund(alice.address);
      expect(refund).to.equal(0); // Hits line 527: if (state != REFUNDING) return 0
    });

    it("should return 0 when user already claimed refund (line 528)", async function () {
      // Setup REFUNDING state
      await basedToken.connect(alice).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(alice).placeBet(0, toWei(2000));

      await basedToken.connect(bob).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(bob).placeBet(1, toWei(2000));

      const resolutionTime = await refundingMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await refundingMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await refundingMarket.connect(resolver).finalizeResolution();

      // Alice claims refund
      await refundingMarket.connect(alice).claimRefund();

      // Check calculateRefund after claim
      const refund = await refundingMarket.calculateRefund(alice.address);
      expect(refund).to.equal(0); // Hits line 528: if (hasClaimedRefund) return 0
    });

    it("should handle user with no bets correctly (lines 530-535)", async function () {
      // Setup REFUNDING state
      await basedToken.connect(alice).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(alice).placeBet(0, toWei(2000));

      await basedToken.connect(bob).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(bob).placeBet(1, toWei(2000));

      const resolutionTime = await refundingMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await refundingMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await refundingMarket.connect(resolver).finalizeResolution();

      // Carol has no bets
      const carolRefund = await refundingMarket.calculateRefund(carol.address);
      expect(carolRefund).to.equal(0); // Loops through empty bets array (line 533-535)
    });

    it("should return correct refund with partially claimed bets", async function () {
      // This test ensures lines 534-535 are hit (checking !claimed)
      await basedToken.connect(alice).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(alice).placeBet(0, toWei(3000));

      await basedToken.connect(bob).approve(await refundingMarket.getAddress(), toWei(50000));
      await refundingMarket.connect(bob).placeBet(1, toWei(2000));

      const resolutionTime = await refundingMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await refundingMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await refundingMarket.connect(resolver).finalizeResolution();

      // Before claiming
      const refundBefore = await refundingMarket.calculateRefund(alice.address);
      expect(refundBefore).to.be.greaterThan(0);

      // After claiming, all bets are marked claimed
      await refundingMarket.connect(alice).claimRefund();
      const refundAfter = await refundingMarket.calculateRefund(alice.address);
      expect(refundAfter).to.equal(0);
    });
  });

  describe("getUserBets() - Line 546", function () {
    it("should return empty array for user with no bets", async function () {
      // Target line 546: return userBets[user]
      const bets = await predictionMarket.getUserBets(carol.address);
      expect(bets.length).to.equal(0);
    });

    it("should return correct bet history for user with single bet", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(5000));

      const bets = await predictionMarket.getUserBets(alice.address);
      expect(bets.length).to.equal(1);
      expect(bets[0].outcomeIndex).to.equal(0);
    });

    it("should return all bets for user with multiple bets on same outcome", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(5000));
      await predictionMarket.connect(alice).placeBet(0, toWei(3000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));

      const bets = await predictionMarket.getUserBets(alice.address);
      expect(bets.length).to.equal(3);
      expect(bets[0].outcomeIndex).to.equal(0);
      expect(bets[1].outcomeIndex).to.equal(0);
      expect(bets[2].outcomeIndex).to.equal(0);
    });

    it("should return all bets for user with bets on different outcomes", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(5000));
      await predictionMarket.connect(alice).placeBet(1, toWei(3000));
      await predictionMarket.connect(alice).placeBet(0, toWei(2000));

      const bets = await predictionMarket.getUserBets(alice.address);
      expect(bets.length).to.equal(3);
      expect(bets[0].outcomeIndex).to.equal(0);
      expect(bets[1].outcomeIndex).to.equal(1);
      expect(bets[2].outcomeIndex).to.equal(0);
    });
  });

  describe("getOutcome() - Lines 553-554", function () {
    it("should return outcome 0 details correctly", async function () {
      // Place some bets to update outcome totals
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      // Target lines 553-554: require + return outcome
      const outcome = await predictionMarket.getOutcome(0);
      expect(outcome.totalAmount).to.be.greaterThan(0);
      expect(outcome.totalAmount).to.be.lessThan(toWei(10000)); // After fees
    });

    it("should return outcome 1 details correctly", async function () {
      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      const outcome = await predictionMarket.getOutcome(1);
      expect(outcome.totalAmount).to.be.greaterThan(0);
      expect(outcome.totalAmount).to.be.lessThan(toWei(5000));
    });

    it("should revert for invalid outcome index (line 553)", async function () {
      // This hits line 553: require(outcomeIndex < outcomes.length)
      await expect(
        predictionMarket.getOutcome(5)
      ).to.be.revertedWith("Invalid outcome");
    });

    it("should handle outcome with zero bets", async function () {
      // Outcome 1 has no bets yet
      const outcome = await predictionMarket.getOutcome(1);
      expect(outcome.totalAmount).to.equal(0);
    });
  });

  describe("getMarketState() - Line 561", function () {
    it("should return ACTIVE state initially", async function () {
      // Target line 561: return state
      const state = await predictionMarket.getMarketState();
      expect(state).to.equal(1); // ACTIVE
    });

    it("should return RESOLVED state after resolution", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(15000));

      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      const state = await predictionMarket.getMarketState();
      expect(state).to.equal(2); // RESOLVED
    });

    it("should return REFUNDING state for low volume markets", async function () {
      // Create fresh market for clean state
      const currentTime = await getCurrentTimestamp();
      const MarketFactory = await ethers.getContractFactory("PredictionMarket");
      const lowVolumeMarket = await MarketFactory.connect(factory).deploy(
        creator.address,
        resolver.address,
        "Low Volume Test",
        currentTime + 86400 * 7,
        currentTime + 86400 * 8,
        await basedToken.getAddress(),
        treasury.address,
        100, 50, 100, 50
      );
      await lowVolumeMarket.waitForDeployment();

      // Small bets below minimum
      await basedToken.connect(alice).approve(await lowVolumeMarket.getAddress(), toWei(50000));
      await lowVolumeMarket.connect(alice).placeBet(0, toWei(3000));

      await basedToken.connect(bob).approve(await lowVolumeMarket.getAddress(), toWei(50000));
      await lowVolumeMarket.connect(bob).placeBet(1, toWei(2000));

      const resolutionTime = await lowVolumeMarket.resolutionTime();
      const currentTime2 = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime2 + 10);

      await lowVolumeMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await lowVolumeMarket.connect(resolver).finalizeResolution();

      const state = await lowVolumeMarket.getMarketState();
      expect(state).to.equal(3); // REFUNDING
    });
  });

  describe("getTotalVolume() - Line 568", function () {
    it("should return 0 volume initially", async function () {
      // Target line 568: return totalVolume
      const volume = await predictionMarket.getTotalVolume();
      expect(volume).to.equal(0);
    });

    it("should return correct volume after single bet", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      const volume = await predictionMarket.getTotalVolume();
      // Volume should be FULL bet amount (including fees)
      expect(volume).to.equal(toWei(10000));
    });

    it("should return accumulated volume after multiple bets", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(5000));

      await basedToken.connect(carol).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(carol).placeBet(0, toWei(3000));

      const volume = await predictionMarket.getTotalVolume();
      // Volume should be FULL amount (10k + 5k + 3k = 18k including fees)
      expect(volume).to.equal(toWei(18000));
    });

    it("should track volume correctly with large bets", async function () {
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(25000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(25000));

      const volume = await predictionMarket.getTotalVolume();
      // Large volume should be exact sum (25k + 25k = 50k including fees)
      expect(volume).to.equal(toWei(50000));
    });
  });

  describe("Edge Cases for Complete Coverage", function () {
    it("should handle view functions in all market states", async function () {
      // Test all view functions in ACTIVE state
      expect(await predictionMarket.getMarketState()).to.equal(1);
      expect(await predictionMarket.getTotalVolume()).to.equal(0);
      expect(await predictionMarket.getUserBets(alice.address)).to.have.length(0);

      // Place bets and test again
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(15000));

      expect(await predictionMarket.getTotalVolume()).to.be.greaterThan(0);
      expect(await predictionMarket.getUserBets(alice.address)).to.have.length(1);

      // Resolve and test in RESOLVED state
      const resolutionTime = await predictionMarket.resolutionTime();
      const currentTime = await getCurrentTimestamp();
      await advanceTime(Number(resolutionTime) - currentTime + 10);

      await predictionMarket.connect(resolver).proposeResolution(0);
      await advanceTime(48 * 3600 + 1);
      await predictionMarket.connect(resolver).finalizeResolution();

      expect(await predictionMarket.getMarketState()).to.equal(2);
      const winnings = await predictionMarket.calculateClaimableWinnings(alice.address);
      expect(winnings).to.be.greaterThan(0);
    });

    it("should maintain data integrity across all view functions", async function () {
      // Place varied bets
      await basedToken.connect(alice).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(alice).placeBet(0, toWei(10000));
      await predictionMarket.connect(alice).placeBet(1, toWei(5000));

      await basedToken.connect(bob).approve(await predictionMarket.getAddress(), toWei(50000));
      await predictionMarket.connect(bob).placeBet(1, toWei(8000));

      // Verify consistency across view functions
      const volume = await predictionMarket.getTotalVolume();
      const aliceBets = await predictionMarket.getUserBets(alice.address);
      const bobBets = await predictionMarket.getUserBets(bob.address);
      const outcome0 = await predictionMarket.getOutcome(0);
      const outcome1 = await predictionMarket.getOutcome(1);

      // Total volume should equal sum of all bets (FULL amount including fees)
      const totalBetAmount = toWei(23000); // 10k + 5k + 8k
      expect(volume).to.equal(totalBetAmount);

      // Individual outcomes should sum correctly
      expect(aliceBets.length).to.equal(2);
      expect(bobBets.length).to.equal(1);

      // Outcome totals should be less than full amounts (fees deducted)
      expect(outcome0.totalAmount).to.be.greaterThan(0);
      expect(outcome0.totalAmount).to.be.lessThan(toWei(10000));
      expect(outcome1.totalAmount).to.be.greaterThan(0);
      expect(outcome1.totalAmount).to.be.lessThan(toWei(13000));
    });
  });
});
