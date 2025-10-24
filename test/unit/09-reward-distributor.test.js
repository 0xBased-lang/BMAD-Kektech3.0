const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getNamedSigners,
  deployContract,
} = require("../helpers");
const {
  generateMerkleTree,
  getMerkleProof,
  verifyProof,
  generateSampleRewards,
  generateVariedRewards,
  calculateGasSavings,
} = require("../merkle-utils");

describe("Epic 8: Reward Distribution (Merkle Trees)", function () {
  let basedToken, techToken, rewardDistributor;
  let deployer, distributor, alice, bob, carol, dave, eve;
  let rewards, merkleTree;

  // Constants
  const BASED_TOKEN_TYPE = 0;
  const TECH_TOKEN_TYPE = 1;

  beforeEach(async function () {
    // Get signers
    const signers = await getNamedSigners();
    deployer = signers.deployer;
    distributor = signers.factory; // Using factory as distributor
    alice = signers.alice;
    bob = signers.bob;
    carol = signers.carol;
    dave = signers.dave;
    eve = signers.eve;

    // Deploy tokens
    basedToken = await deployContract("MockERC20", [
      "BASED Token",
      "BASED",
      ethers.parseEther("10000000"),
    ]);

    techToken = await deployContract("MockERC20", [
      "TECH Token",
      "TECH",
      ethers.parseEther("10000000"),
    ]);

    // Deploy RewardDistributor
    rewardDistributor = await deployContract("RewardDistributor", [
      await basedToken.getAddress(),
      await techToken.getAddress(),
      distributor.address,
    ]);

    // Fund distributor contract with tokens
    await basedToken.mint(await rewardDistributor.getAddress(), ethers.parseEther("1000000"));
    await techToken.mint(await rewardDistributor.getAddress(), ethers.parseEther("1000000"));

    // Generate sample rewards
    rewards = generateSampleRewards(
      [alice.address, bob.address, carol.address, dave.address, eve.address],
      ethers.parseEther("100").toString()
    );

    // Generate Merkle tree
    merkleTree = generateMerkleTree(rewards);
  });

  /*//////////////////////////////////////////////////////////////
                    DISTRIBUTION PUBLISHING TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Distribution Publishing", function () {
    it("should publish a new distribution period", async function () {
      const tx = await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTest123",
          BASED_TOKEN_TYPE
        );

      await expect(tx)
        .to.emit(rewardDistributor, "DistributionPublished")
        .withArgs(0, merkleTree.root, ethers.parseEther("500"), "ipfs://QmTest123", BASED_TOKEN_TYPE);

      expect(await rewardDistributor.periodCount()).to.equal(1);
    });

    it("should prevent non-distributor from publishing", async function () {
      await expect(
        rewardDistributor
          .connect(alice)
          .publishDistribution(
            merkleTree.root,
            ethers.parseEther("500"),
            "ipfs://QmTest123",
            BASED_TOKEN_TYPE
          )
      ).to.be.revertedWith("RewardDistributor: Only distributor");
    });

    it("should reject invalid merkle root", async function () {
      await expect(
        rewardDistributor
          .connect(distributor)
          .publishDistribution(
            ethers.ZeroHash,
            ethers.parseEther("500"),
            "ipfs://QmTest123",
            BASED_TOKEN_TYPE
          )
      ).to.be.revertedWith("RewardDistributor: Invalid root");
    });

    it("should reject zero amount", async function () {
      await expect(
        rewardDistributor
          .connect(distributor)
          .publishDistribution(merkleTree.root, 0, "ipfs://QmTest123", BASED_TOKEN_TYPE)
      ).to.be.revertedWith("RewardDistributor: Invalid amount");
    });

    it("should reject empty metadata", async function () {
      await expect(
        rewardDistributor
          .connect(distributor)
          .publishDistribution(merkleTree.root, ethers.parseEther("500"), "", BASED_TOKEN_TYPE)
      ).to.be.revertedWith("RewardDistributor: Empty metadata");
    });

    it("should publish multiple periods", async function () {
      // Publish first period
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmPeriod1",
          BASED_TOKEN_TYPE
        );

      // Publish second period
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("600"),
          "ipfs://QmPeriod2",
          TECH_TOKEN_TYPE
        );

      expect(await rewardDistributor.periodCount()).to.equal(2);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      SINGLE CLAIM TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Single Claim", function () {
    beforeEach(async function () {
      // Publish distribution
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTest123",
          BASED_TOKEN_TYPE
        );
    });

    it("should allow valid claim", async function () {
      const reward = rewards[0]; // Alice's reward
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const balanceBefore = await basedToken.balanceOf(alice.address);

      const tx = await rewardDistributor
        .connect(alice)
        .claim(0, reward.index, reward.account, reward.amount, proof);

      await expect(tx)
        .to.emit(rewardDistributor, "Claimed")
        .withArgs(0, reward.index, reward.account, reward.amount, BASED_TOKEN_TYPE);

      const balanceAfter = await basedToken.balanceOf(alice.address);
      expect(balanceAfter - balanceBefore).to.equal(reward.amount);

      expect(await rewardDistributor.isClaimed(0, reward.index)).to.be.true;
    });

    it("should prevent double claiming", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      // First claim succeeds
      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);

      // Second claim fails
      await expect(
        rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof)
      ).to.be.revertedWith("RewardDistributor: Already claimed");
    });

    it("should reject invalid proof", async function () {
      const reward = rewards[0];
      const wrongProof = getMerkleProof(merkleTree.tree, rewards[1].index, rewards[1].account, rewards[1].amount);

      await expect(
        rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, wrongProof)
      ).to.be.revertedWith("RewardDistributor: Invalid proof");
    });

    it("should reject invalid period ID", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      await expect(
        rewardDistributor.connect(alice).claim(99, reward.index, reward.account, reward.amount, proof)
      ).to.be.revertedWith("RewardDistributor: Invalid period");
    });

    it("should update total claimed correctly", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);

      const [basedClaimed, techClaimed] = await rewardDistributor.getTotalClaimed(alice.address);
      expect(basedClaimed).to.equal(reward.amount);
      expect(techClaimed).to.equal(0);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      BATCH CLAIM TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Batch Claiming", function () {
    beforeEach(async function () {
      // Publish two distribution periods
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmPeriod1",
          BASED_TOKEN_TYPE
        );

      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("600"),
          "ipfs://QmPeriod2",
          TECH_TOKEN_TYPE
        );
    });

    it("should allow batch claiming across periods", async function () {
      const reward = rewards[0]; // Alice's reward
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const periodIds = [0, 1];
      const indices = [reward.index, reward.index];
      const amounts = [reward.amount, reward.amount];
      const proofs = [proof, proof];

      const basedBefore = await basedToken.balanceOf(alice.address);
      const techBefore = await techToken.balanceOf(alice.address);

      await rewardDistributor.connect(alice).claimMultiplePeriods(periodIds, indices, amounts, proofs);

      const basedAfter = await basedToken.balanceOf(alice.address);
      const techAfter = await techToken.balanceOf(alice.address);

      expect(basedAfter - basedBefore).to.equal(reward.amount);
      expect(techAfter - techBefore).to.equal(reward.amount);

      expect(await rewardDistributor.isClaimed(0, reward.index)).to.be.true;
      expect(await rewardDistributor.isClaimed(1, reward.index)).to.be.true;
    });

    it("should reject empty batch", async function () {
      await expect(
        rewardDistributor.connect(alice).claimMultiplePeriods([], [], [], [])
      ).to.be.revertedWith("RewardDistributor: Empty arrays");
    });

    it("should reject mismatched array lengths", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      await expect(
        rewardDistributor.connect(alice).claimMultiplePeriods([0], [reward.index], [reward.amount], [proof, proof])
      ).to.be.revertedWith("RewardDistributor: Length mismatch");
    });

    it("should track total claimed across batch", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      await rewardDistributor
        .connect(alice)
        .claimMultiplePeriods([0, 1], [reward.index, reward.index], [reward.amount, reward.amount], [proof, proof]);

      const [basedClaimed, techClaimed] = await rewardDistributor.getTotalClaimed(alice.address);
      expect(basedClaimed).to.equal(reward.amount);
      expect(techClaimed).to.equal(reward.amount);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      BITMAP TRACKING TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Bitmap Tracking", function () {
    beforeEach(async function () {
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTest123",
          BASED_TOKEN_TYPE
        );
    });

    it("should track claims efficiently with bitmap", async function () {
      // Claim multiple rewards
      for (let i = 0; i < 3; i++) {
        const reward = rewards[i];
        const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

        const signer = [alice, bob, carol][i];
        await rewardDistributor.connect(signer).claim(0, reward.index, reward.account, reward.amount, proof);

        expect(await rewardDistributor.isClaimed(0, reward.index)).to.be.true;
      }

      // Check unclaimed
      expect(await rewardDistributor.isClaimed(0, 3)).to.be.false;
      expect(await rewardDistributor.isClaimed(0, 4)).to.be.false;
    });

    it("should handle areClaimedBatch correctly", async function () {
      const reward0 = rewards[0];
      const proof0 = getMerkleProof(merkleTree.tree, reward0.index, reward0.account, reward0.amount);

      // Claim first reward
      await rewardDistributor.connect(alice).claim(0, reward0.index, reward0.account, reward0.amount, proof0);

      // Check batch
      const claimedStatus = await rewardDistributor.areClaimedBatch([0, 0, 0], [0, 1, 2]);

      expect(claimedStatus[0]).to.be.true; // Index 0 claimed
      expect(claimedStatus[1]).to.be.false; // Index 1 not claimed
      expect(claimedStatus[2]).to.be.false; // Index 2 not claimed
    });
  });

  /*//////////////////////////////////////////////////////////////
                      DUAL-TOKEN SUPPORT TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Dual-Token Support", function () {
    it("should support BASED token distribution", async function () {
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmBased",
          BASED_TOKEN_TYPE
        );

      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const balanceBefore = await basedToken.balanceOf(alice.address);

      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);

      const balanceAfter = await basedToken.balanceOf(alice.address);
      expect(balanceAfter - balanceBefore).to.equal(reward.amount);
    });

    it("should support TECH token distribution", async function () {
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTech",
          TECH_TOKEN_TYPE
        );

      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const balanceBefore = await techToken.balanceOf(alice.address);

      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);

      const balanceAfter = await techToken.balanceOf(alice.address);
      expect(balanceAfter - balanceBefore).to.equal(reward.amount);
    });

    it("should track separate totals for each token type", async function () {
      // Publish BASED distribution
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmBased",
          BASED_TOKEN_TYPE
        );

      // Publish TECH distribution
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("600"),
          "ipfs://QmTech",
          TECH_TOKEN_TYPE
        );

      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      // Claim from both periods
      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);
      await rewardDistributor.connect(alice).claim(1, reward.index, reward.account, reward.amount, proof);

      const [basedClaimed, techClaimed] = await rewardDistributor.getTotalClaimed(alice.address);
      expect(basedClaimed).to.equal(reward.amount);
      expect(techClaimed).to.equal(reward.amount);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      VIEW FUNCTION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("View Functions", function () {
    beforeEach(async function () {
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTest123",
          BASED_TOKEN_TYPE
        );
    });

    it("should return correct distribution period details", async function () {
      const period = await rewardDistributor.getDistributionPeriod(0);

      expect(period.merkleRoot).to.equal(merkleTree.root);
      expect(period.totalAmount).to.equal(ethers.parseEther("500"));
      expect(period.metadataURI).to.equal("ipfs://QmTest123");
      expect(period.tokenType).to.equal(BASED_TOKEN_TYPE);
    });

    it("should return correct period count", async function () {
      expect(await rewardDistributor.periodCount()).to.equal(1);

      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("600"),
          "ipfs://QmTest456",
          TECH_TOKEN_TYPE
        );

      expect(await rewardDistributor.periodCount()).to.equal(2);
    });

    it("should return correct total claimed", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const [basedBefore, techBefore] = await rewardDistributor.getTotalClaimed(alice.address);
      expect(basedBefore).to.equal(0);
      expect(techBefore).to.equal(0);

      await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);

      const [basedAfter, techAfter] = await rewardDistributor.getTotalClaimed(alice.address);
      expect(basedAfter).to.equal(reward.amount);
      expect(techAfter).to.equal(0);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      ADMIN FUNCTION TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Admin Functions", function () {
    it("should allow owner to update distributor", async function () {
      await rewardDistributor.connect(deployer).setDistributor(alice.address);
      expect(await rewardDistributor.distributor()).to.equal(alice.address);
    });

    it("should prevent non-owner from updating distributor", async function () {
      await expect(
        rewardDistributor.connect(alice).setDistributor(bob.address)
      ).to.be.revertedWithCustomError(rewardDistributor, "OwnableUnauthorizedAccount");
    });

    it("should allow emergency token recovery", async function () {
      const amount = ethers.parseEther("100");

      const balanceBefore = await basedToken.balanceOf(deployer.address);

      await rewardDistributor
        .connect(deployer)
        .emergencyRecover(await basedToken.getAddress(), amount, deployer.address);

      const balanceAfter = await basedToken.balanceOf(deployer.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("should prevent non-owner from emergency recovery", async function () {
      await expect(
        rewardDistributor
          .connect(alice)
          .emergencyRecover(await basedToken.getAddress(), ethers.parseEther("100"), alice.address)
      ).to.be.revertedWithCustomError(rewardDistributor, "OwnableUnauthorizedAccount");
    });
  });

  /*//////////////////////////////////////////////////////////////
                      GAS PROFILING TESTS
  //////////////////////////////////////////////////////////////*/

  describe("Gas Profiling", function () {
    beforeEach(async function () {
      await rewardDistributor
        .connect(distributor)
        .publishDistribution(
          merkleTree.root,
          ethers.parseEther("500"),
          "ipfs://QmTest123",
          BASED_TOKEN_TYPE
        );
    });

    it("should use efficient gas for single claim", async function () {
      const reward = rewards[0];
      const proof = getMerkleProof(merkleTree.tree, reward.index, reward.account, reward.amount);

      const tx = await rewardDistributor.connect(alice).claim(0, reward.index, reward.account, reward.amount, proof);
      const receipt = await tx.wait();

      console.log(`    ⛽ Single claim gas: ${receipt.gasUsed.toString()}`);
      // Actual gas: ~112K (includes SafeERC20, bitmap, events)
      // Still much better than ~200K+ for traditional individual transfers!
      expect(receipt.gasUsed).to.be.lt(150000); // Should be under 150K gas
    });

    it("should demonstrate gas savings vs traditional airdrop", async function () {
      const savings = calculateGasSavings(1000);

      console.log("\n    📊 Gas Savings Analysis (1,000 recipients):");
      console.log(`       Traditional Airdrop: ${savings.traditional.total.toLocaleString()} gas`);
      console.log(`       Merkle Distribution: ${savings.merkle.total.toLocaleString()} gas`);
      console.log(`       💰 Savings: ${savings.savings.gas.toLocaleString()} gas (${savings.savings.percent}%)\n`);

      expect(parseInt(savings.savings.percent)).to.be.gt(50); // At least 50% savings
    });
  });
});
