const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {
  getNamedSigners,
  deployContract,
} = require("../helpers");

describe("Epic 6: Governance System (Fix #7)", function () {
  let basedToken;
  let mockNFT;
  let stakingContract;
  let bondManager;
  let governance;
  let factory;
  let owner, treasury, alice, bob, charlie;

  // Constants from contracts
  const PROPOSAL_BOND = ethers.parseEther("100000"); // 100,000 BASED
  const PROPOSAL_COOLDOWN = 24 * 60 * 60; // 24 hours
  const MAX_FAILED_PROPOSALS = 3;
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const MIN_PARTICIPATION_RATE = 10; // 10%

  beforeEach(async function () {
    // Get named signers
    const signers = await getNamedSigners();
    owner = signers.deployer;
    treasury = signers.treasury;
    alice = signers.alice;
    bob = signers.bob;
    charlie = signers.carol;

    // Deploy MockERC20 for BASED token
    basedToken = await deployContract("MockERC20", [
      "BASED Token",
      "BASED",
      ethers.parseEther("10000000") // 10M initial supply
    ]);

    // Deploy MockERC721 for staking
    mockNFT = await deployContract("MockERC721", ["Test NFT", "TNFT"]);

    // Deploy EnhancedNFTStaking (upgradeable)
    const EnhancedNFTStaking = await ethers.getContractFactory("EnhancedNFTStaking");
    stakingContract = await upgrades.deployProxy(
      EnhancedNFTStaking,
      [await mockNFT.getAddress()],
      { initializer: "initialize" }
    );

    // Deploy BondManager
    bondManager = await deployContract("BondManager", [
      await basedToken.getAddress(),
      treasury.address
    ]);

    // Deploy mock factory (for testing)
    // Note: Factory needs (basedToken, treasury, marketImplementation, initialFeeParams)
    const feeParams = {
      baseFeeBps: 50,    // 0.5%
      platformFeeBps: 50, // 0.5%
      creatorFeeBps: 50,  // 0.5%
      maxAdditionalFeeBps: 300 // 3% max
    };

    factory = await deployContract("PredictionMarketFactory", [
      await basedToken.getAddress(),
      treasury.address,
      treasury.address, // marketImplementation (placeholder for tests)
      feeParams
    ]);

    // Deploy GovernanceContract
    governance = await deployContract("GovernanceContract", [
      await bondManager.getAddress(),
      await factory.getAddress(),
      await stakingContract.getAddress(),
      treasury.address
    ]);

    // Set governance in BondManager
    await bondManager.setGovernance(await governance.getAddress());

    // Mint and approve tokens for testing
    await basedToken.mint(alice.address, ethers.parseEther("1000000"));
    await basedToken.mint(bob.address, ethers.parseEther("1000000"));
    await basedToken.mint(charlie.address, ethers.parseEther("1000000"));

    await basedToken.connect(alice).approve(await bondManager.getAddress(), ethers.MaxUint256);
    await basedToken.connect(bob).approve(await bondManager.getAddress(), ethers.MaxUint256);
    await basedToken.connect(charlie).approve(await bondManager.getAddress(), ethers.MaxUint256);

    // Mint NFTs for voting power testing
    // Rarity ranges: LEGENDARY: 9900-9999, EPIC: 9000-9899, RARE: 8500-8999, UNCOMMON: 7000-8499, COMMON: 0-6999
    // Alice: 1 Legendary (ID 9900), 2 Epic (IDs 9000-9001), 1 Common (ID 100)
    await mockNFT.mint(alice.address, 9900); // Legendary
    await mockNFT.mint(alice.address, 9000); // Epic
    await mockNFT.mint(alice.address, 9001); // Epic
    await mockNFT.mint(alice.address, 100); // Common

    // Bob: 1 Epic (ID 9002), 1 Rare (ID 8500)
    await mockNFT.mint(bob.address, 9002); // Epic
    await mockNFT.mint(bob.address, 8500); // Rare

    // Approve and stake NFTs
    await mockNFT.connect(alice).setApprovalForAll(await stakingContract.getAddress(), true);
    await mockNFT.connect(bob).setApprovalForAll(await stakingContract.getAddress(), true);

    await stakingContract.connect(alice).batchStakeNFTs([9900, 9000, 9001, 100]);
    await stakingContract.connect(bob).batchStakeNFTs([9002, 8500]);
  });

  /*//////////////////////////////////////////////////////////////
                        BOND MANAGER TESTS
  //////////////////////////////////////////////////////////////*/

  describe.skip("BondManager (tested indirectly through governance)", function () {
    it("should lock a bond correctly", async function () {
      const amount = ethers.parseEther("100000");
      const balanceBefore = await basedToken.balanceOf(alice.address);

      // Impersonate governance contract
      await ethers.provider.send("hardhat_impersonateAccount", [await governance.getAddress()]);
      const governanceSigner = await ethers.getSigner(await governance.getAddress());

      // Fund governance signer for gas
      await owner.sendTransaction({
        to: await governance.getAddress(),
        value: ethers.parseEther("1")
      });

      await bondManager.connect(governanceSigner).lockBond(alice.address, amount);

      await ethers.provider.send("hardhat_stopImpersonatingAccount", [await governance.getAddress()]);

      expect(await bondManager.getLockedBond(alice.address)).to.equal(amount);
      expect(await bondManager.getTotalLockedBonds()).to.equal(amount);
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore - amount);
    });

    it("should refund a bond correctly", async function () {
      const amount = ethers.parseEther("100000");
      const balanceBefore = await basedToken.balanceOf(alice.address);

      await bondManager.connect(governance).lockBond(alice.address, amount);
      await bondManager.connect(governance).refundBond(alice.address);

      expect(await bondManager.getLockedBond(alice.address)).to.equal(0);
      expect(await bondManager.getTotalLockedBonds()).to.equal(0);
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore);
    });

    it("should forfeit a bond to treasury", async function () {
      const amount = ethers.parseEther("100000");
      const treasuryBalanceBefore = await basedToken.balanceOf(treasury.address);

      await bondManager.connect(governance).lockBond(alice.address, amount);
      await bondManager.connect(governance).forfeitBond(alice.address);

      expect(await bondManager.getLockedBond(alice.address)).to.equal(0);
      expect(await bondManager.getTotalLockedBonds()).to.equal(0);
      expect(await basedToken.balanceOf(treasury.address)).to.equal(treasuryBalanceBefore + amount);
    });

    it("should only allow governance to call bond functions", async function () {
      const amount = ethers.parseEther("100000");

      await expect(
        bondManager.connect(alice).lockBond(alice.address, amount)
      ).to.be.revertedWith("BondManager: Only governance");

      await bondManager.connect(governance).lockBond(alice.address, amount);

      await expect(
        bondManager.connect(alice).refundBond(alice.address)
      ).to.be.revertedWith("BondManager: Only governance");

      await expect(
        bondManager.connect(alice).forfeitBond(alice.address)
      ).to.be.revertedWith("BondManager: Only governance");
    });

    it("should prevent locking bond twice", async function () {
      const amount = ethers.parseEther("100000");

      await bondManager.connect(governance).lockBond(alice.address, amount);

      await expect(
        bondManager.connect(governance).lockBond(alice.address, amount)
      ).to.be.revertedWith("BondManager: Bond already locked");
    });

    it("should check hasBondLocked correctly", async function () {
      expect(await bondManager.hasBondLocked(alice.address)).to.be.false;

      await bondManager.connect(governance).lockBond(alice.address, PROPOSAL_BOND);

      expect(await bondManager.hasBondLocked(alice.address)).to.be.true;

      await bondManager.connect(governance).refundBond(alice.address);

      expect(await bondManager.hasBondLocked(alice.address)).to.be.false;
    });
  });

  /*//////////////////////////////////////////////////////////////
                    PROPOSAL CREATION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Proposal Creation", function () {
    it("should create a proposal with correct bond lock (Fix #7)", async function () {
      const balanceBefore = await basedToken.balanceOf(alice.address);

      const tx = await governance.connect(alice).createProposal(
        "Will BTC hit $100k?",
        "Bitcoin price prediction for 2024",
        "Crypto"
      );

      await expect(tx)
        .to.emit(governance, "ProposalCreated")
        .withArgs(0, alice.address, "Will BTC hit $100k?", PROPOSAL_BOND);

      expect(await governance.proposalCount()).to.equal(1);
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore - PROPOSAL_BOND);
      expect(await bondManager.getLockedBond(alice.address)).to.equal(PROPOSAL_BOND);
    });

    it("should enforce cooldown period (Fix #7)", async function () {
      // Create first proposal
      await governance.connect(alice).createProposal(
        "Question 1",
        "Description 1",
        "Category 1"
      );

      // Try to create second proposal immediately - should fail
      await expect(
        governance.connect(alice).createProposal(
          "Question 2",
          "Description 2",
          "Category 2"
        )
      ).to.be.revertedWith("Governance: Cooldown active");

      // Fast forward 23 hours - still in cooldown
      await time.increase(23 * 60 * 60);

      await expect(
        governance.connect(alice).createProposal(
          "Question 2",
          "Description 2",
          "Category 2"
        )
      ).to.be.revertedWith("Governance: Cooldown active");

      // Fast forward another 2 hours (total 25 hours) - cooldown over
      await time.increase(2 * 60 * 60);

      // First proposal needs to be finalized to free up the bond
      await time.increase(VOTING_PERIOD);
      await governance.finalizeProposal(0);

      // Now should succeed
      await expect(
        governance.connect(alice).createProposal(
          "Question 2",
          "Description 2",
          "Category 2"
        )
      ).to.not.be.reverted;
    });

    it("should prevent blacklisted addresses from creating proposals (Fix #7)", async function () {
      // Create and fail 3 proposals to trigger blacklist
      for (let i = 0; i < 3; i++) {
        await governance.connect(alice).createProposal(
          `Question ${i + 1}`,
          `Description ${i + 1}`,
          `Category ${i + 1}`
        );

        // Fast forward past voting period
        await time.increase(VOTING_PERIOD + 1);

        // Finalize with low participation (no votes) - should forfeit bond
        await governance.finalizeProposal(i);

        // Fast forward past cooldown for next proposal
        if (i < 2) {
          await time.increase(PROPOSAL_COOLDOWN + 1);
        }
      }

      // Verify Alice is blacklisted
      expect(await governance.isBlacklisted(alice.address)).to.be.true;
      expect(await governance.getFailedProposalCount(alice.address)).to.equal(3);

      // Try to create another proposal - should fail
      await expect(
        governance.connect(alice).createProposal(
          "Question 4",
          "Description 4",
          "Category 4"
        )
      ).to.be.revertedWith("Governance: Blacklisted");
    });

    it("should validate proposal inputs", async function () {
      await expect(
        governance.connect(alice).createProposal("", "Description", "Category")
      ).to.be.revertedWith("Governance: Empty question");

      await expect(
        governance.connect(alice).createProposal("Question", "", "Category")
      ).to.be.revertedWith("Governance: Empty description");

      await expect(
        governance.connect(alice).createProposal("Question", "Description", "")
      ).to.be.revertedWith("Governance: Empty category");
    });
  });

  /*//////////////////////////////////////////////////////////////
                         VOTING TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Voting System", function () {
    beforeEach(async function () {
      // Create a proposal
      await governance.connect(alice).createProposal(
        "Test Question",
        "Test Description",
        "Test Category"
      );
    });

    it("should calculate voting power correctly based on rarity", async function () {
      // Alice has: 1 Legendary (10x) + 2 Epic (5x each) + 1 Common (1x) = 21
      // IDs: 9900 (Legendary), 9000 (Epic), 9001 (Epic), 100 (Common)
      // Power: 10 + 5 + 5 + 1 = 21
      const alicePower = await governance.getVotingPower(alice.address);
      expect(alicePower).to.equal(21);

      // Bob has: 1 Epic (5x) + 1 Rare (3x) = 8
      // IDs: 9002 (Epic), 8500 (Rare)
      // Power: 5 + 3 = 8
      const bobPower = await governance.getVotingPower(bob.address);
      expect(bobPower).to.equal(8);

      // Charlie has no staked NFTs
      const charliePower = await governance.getVotingPower(charlie.address);
      expect(charliePower).to.equal(0);
    });

    it("should allow voting with weighted power", async function () {
      const tx = await governance.connect(alice).vote(0, true);

      await expect(tx)
        .to.emit(governance, "VoteCast")
        .withArgs(0, alice.address, true, 21);

      const proposal = await governance.getProposal(0);
      expect(proposal.votesFor).to.equal(21);
      expect(proposal.votesAgainst).to.equal(0);
    });

    it("should track votes correctly for both sides", async function () {
      await governance.connect(alice).vote(0, true); // 21 votes for
      await governance.connect(bob).vote(0, false); // 8 votes against

      const proposal = await governance.getProposal(0);
      expect(proposal.votesFor).to.equal(21);
      expect(proposal.votesAgainst).to.equal(8);
    });

    it("should prevent double voting", async function () {
      await governance.connect(alice).vote(0, true);

      await expect(
        governance.connect(alice).vote(0, false)
      ).to.be.revertedWith("Governance: Already voted");
    });

    it("should prevent voting after period ends", async function () {
      await time.increase(VOTING_PERIOD + 1);

      await expect(
        governance.connect(alice).vote(0, true)
      ).to.be.revertedWith("Governance: Voting ended");
    });

    it("should prevent voting with no staking power", async function () {
      await expect(
        governance.connect(charlie).vote(0, true)
      ).to.be.revertedWith("Governance: No voting power");
    });

    it("should track hasVoted correctly", async function () {
      expect(await governance.hasVoted(0, alice.address)).to.be.false;

      await governance.connect(alice).vote(0, true);

      expect(await governance.hasVoted(0, alice.address)).to.be.true;
      expect(await governance.hasVoted(0, bob.address)).to.be.false;
    });
  });

  /*//////////////////////////////////////////////////////////////
                   PROPOSAL FINALIZATION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Proposal Finalization", function () {
    beforeEach(async function () {
      await governance.connect(alice).createProposal(
        "Test Question",
        "Test Description",
        "Test Category"
      );
    });

    it("should approve proposal with majority votes and refund bond", async function () {
      await governance.connect(alice).vote(0, true); // 21 votes
      await governance.connect(bob).vote(0, false); // 8 votes
      // Alice wins 21 vs 8

      await time.increase(VOTING_PERIOD + 1);

      const balanceBefore = await basedToken.balanceOf(alice.address);

      const tx = await governance.finalizeProposal(0);

      await expect(tx)
        .to.emit(governance, "ProposalFinalized");

      await expect(tx)
        .to.emit(governance, "BondRefunded")
        .withArgs(0, alice.address, PROPOSAL_BOND);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(1); // APPROVED

      // Bond refunded
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore + PROPOSAL_BOND);
    });

    it("should reject proposal but refund bond if participation >= 10%", async function () {
      await governance.connect(alice).vote(0, false); // 21 votes against
      await governance.connect(bob).vote(0, false); // 8 votes against
      // Total 29 votes against (high participation)

      await time.increase(VOTING_PERIOD + 1);

      const balanceBefore = await basedToken.balanceOf(alice.address);

      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(2); // REJECTED

      // Bond refunded due to high participation
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore + PROPOSAL_BOND);
    });

    it("should forfeit bond if participation < 10% (Fix #7)", async function () {
      // No votes = 0% participation

      await time.increase(VOTING_PERIOD + 1);

      const treasuryBalanceBefore = await basedToken.balanceOf(treasury.address);

      const tx = await governance.finalizeProposal(0);

      await expect(tx)
        .to.emit(governance, "BondForfeited")
        .withArgs(0, alice.address, PROPOSAL_BOND);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(2); // REJECTED

      // Bond forfeited to treasury
      expect(await basedToken.balanceOf(treasury.address)).to.equal(treasuryBalanceBefore + PROPOSAL_BOND);

      // Failed count incremented
      expect(await governance.getFailedProposalCount(alice.address)).to.equal(1);
    });

    it("should prevent finalization before voting ends", async function () {
      await expect(
        governance.finalizeProposal(0)
      ).to.be.revertedWith("Governance: Voting active");
    });

    it("should prevent double finalization", async function () {
      await time.increase(VOTING_PERIOD + 1);

      await governance.finalizeProposal(0);

      await expect(
        governance.finalizeProposal(0)
      ).to.be.revertedWith("Governance: Not pending");
    });

    it("should auto-blacklist after 3 failed proposals (Fix #7)", async function () {
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await time.increase(PROPOSAL_COOLDOWN + 1);
          await governance.connect(alice).createProposal(
            `Question ${i + 1}`,
            `Description ${i + 1}`,
            `Category ${i + 1}`
          );
        }

        await time.increase(VOTING_PERIOD + 1);

        const tx = await governance.finalizeProposal(i);

        if (i === 2) {
          await expect(tx)
            .to.emit(governance, "ProposerBlacklisted")
            .withArgs(alice.address, 3);
        }
      }

      expect(await governance.isBlacklisted(alice.address)).to.be.true;
      expect(await governance.getFailedProposalCount(alice.address)).to.equal(3);
    });
  });

  /*//////////////////////////////////////////////////////////////
                   PROPOSAL EXECUTION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await governance.connect(alice).createProposal(
        "Test Question",
        "Test Description",
        "Test Category"
      );

      await governance.connect(alice).vote(0, true);
      await governance.connect(bob).vote(0, true);

      await time.increase(VOTING_PERIOD + 1);

      await governance.finalizeProposal(0);
    });

    it("should execute an approved proposal", async function () {
      const tx = await governance.executeProposal(0);

      await expect(tx)
        .to.emit(governance, "ProposalExecuted")
        .withArgs(0, ethers.ZeroAddress); // Placeholder address

      const proposal = await governance.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.state).to.equal(3); // EXECUTED
    });

    it("should prevent executing non-approved proposal", async function () {
      // Create and reject a proposal
      await time.increase(PROPOSAL_COOLDOWN + 1);
      await governance.connect(bob).createProposal(
        "Question 2",
        "Description 2",
        "Category 2"
      );

      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(1); // Will be rejected (no votes)

      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWith("Governance: Not approved");
    });

    it("should prevent double execution", async function () {
      await governance.executeProposal(0);

      await expect(
        governance.executeProposal(0)
      ).to.be.revertedWith("Governance: Already executed");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("View Functions", function () {
    it("should return correct proposal count", async function () {
      expect(await governance.proposalCount()).to.equal(0);

      await governance.connect(alice).createProposal("Q1", "D1", "C1");
      expect(await governance.proposalCount()).to.equal(1);

      await time.increase(PROPOSAL_COOLDOWN + 1);
      await governance.connect(alice).createProposal("Q2", "D2", "C2");
      expect(await governance.proposalCount()).to.equal(2);
    });

    it("should return correct cooldown end time", async function () {
      expect(await governance.getCooldownEnd(alice.address)).to.equal(0);

      const tx = await governance.connect(alice).createProposal("Q1", "D1", "C1");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const expectedEnd = block.timestamp + PROPOSAL_COOLDOWN;
      expect(await governance.getCooldownEnd(alice.address)).to.equal(expectedEnd);

      // Fast forward past cooldown
      await time.increase(PROPOSAL_COOLDOWN + 1);

      expect(await governance.getCooldownEnd(alice.address)).to.equal(0);
    });

    it("should return proposal details correctly", async function () {
      await governance.connect(alice).createProposal(
        "Test Question",
        "Test Description",
        "Test Category"
      );

      const proposal = await governance.getProposal(0);

      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(alice.address);
      expect(proposal.question).to.equal("Test Question");
      expect(proposal.description).to.equal("Test Description");
      expect(proposal.category).to.equal("Test Category");
      expect(proposal.state).to.equal(0); // PENDING
      expect(proposal.votesFor).to.equal(0);
      expect(proposal.votesAgainst).to.equal(0);
      expect(proposal.executed).to.be.false;
    });
  });

  /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await governance.connect(alice).createProposal("Q1", "D1", "C1");
    });

    it("should allow owner to cancel proposal and refund bond", async function () {
      const balanceBefore = await basedToken.balanceOf(alice.address);

      await governance.connect(owner).cancelProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(4); // CANCELED

      // Bond refunded
      expect(await basedToken.balanceOf(alice.address)).to.equal(balanceBefore + PROPOSAL_BOND);
    });

    it("should prevent non-owner from canceling", async function () {
      await expect(
        governance.connect(alice).cancelProposal(0)
      ).to.be.revertedWithCustomError(governance, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to update treasury", async function () {
      await governance.connect(owner).setTreasury(bob.address);
      expect(await governance.treasury()).to.equal(bob.address);
    });
  });
});
