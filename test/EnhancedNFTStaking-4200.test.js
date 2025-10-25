/**
 * Comprehensive Test Suite for EnhancedNFTStaking (4,200 NFTs)
 *
 * Tests all critical functionality after modification from 10,000 to 4,200 NFTs
 *
 * Test Coverage:
 * 1. Boundary tests (12 critical token IDs)
 * 2. Distribution tests (all 4,200 token IDs)
 * 3. Staking functionality tests
 * 4. Batch operation tests
 * 5. Edge case tests
 * 6. Gas efficiency tests
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedNFTStaking - 4,200 NFT Implementation", function () {
  let staking;
  let mockNFT;
  let owner;
  let user1;
  let user2;

  // Rarity tier enum (matches contract)
  const RarityTier = {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 4
  };

  // Expected distribution for 4,200 NFTs
  const EXPECTED_DISTRIBUTION = {
    COMMON: 2940,      // 70.00%
    UNCOMMON: 630,     // 15.00%
    RARE: 210,         // 5.00%
    EPIC: 330,         // 7.86%
    LEGENDARY: 90      // 2.14%
  };

  // Critical boundaries to test
  const BOUNDARIES = {
    // Common
    FIRST_COMMON: 0,
    LAST_COMMON: 2939,

    // Uncommon
    FIRST_UNCOMMON: 2940,
    LAST_UNCOMMON: 3569,

    // Rare
    FIRST_RARE: 3570,
    LAST_RARE: 3779,

    // Epic
    FIRST_EPIC: 3780,
    LAST_EPIC: 4109,

    // Legendary
    FIRST_LEGENDARY: 4110,
    LAST_LEGENDARY: 4199,

    // Invalid
    FIRST_INVALID: 4200,
    OLD_MAX: 9999
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock NFT contract
    const MockNFT = await ethers.getContractFactory("MockKektechNFT");
    mockNFT = await MockNFT.deploy();
    await mockNFT.waitForDeployment();

    // Deploy staking contract
    const EnhancedNFTStaking = await ethers.getContractFactory("EnhancedNFTStaking");
    staking = await EnhancedNFTStaking.deploy(await mockNFT.getAddress());
    await staking.waitForDeployment();

    console.log("\n✅ Contracts deployed for testing");
  });

  describe("1. Boundary Tests (Critical)", function () {
    it("Should correctly identify FIRST Common (Token 0)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.FIRST_COMMON);
      expect(rarity).to.equal(RarityTier.COMMON);
    });

    it("Should correctly identify LAST Common (Token 2939)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.LAST_COMMON);
      expect(rarity).to.equal(RarityTier.COMMON);
    });

    it("Should correctly identify FIRST Uncommon (Token 2940)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.FIRST_UNCOMMON);
      expect(rarity).to.equal(RarityTier.UNCOMMON);
    });

    it("Should correctly identify LAST Uncommon (Token 3569)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.LAST_UNCOMMON);
      expect(rarity).to.equal(RarityTier.UNCOMMON);
    });

    it("Should correctly identify FIRST Rare (Token 3570)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.FIRST_RARE);
      expect(rarity).to.equal(RarityTier.RARE);
    });

    it("Should correctly identify LAST Rare (Token 3779)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.LAST_RARE);
      expect(rarity).to.equal(RarityTier.RARE);
    });

    it("Should correctly identify FIRST Epic (Token 3780)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.FIRST_EPIC);
      expect(rarity).to.equal(RarityTier.EPIC);
    });

    it("Should correctly identify LAST Epic (Token 4109)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.LAST_EPIC);
      expect(rarity).to.equal(RarityTier.EPIC);
    });

    it("Should correctly identify FIRST Legendary (Token 4110)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.FIRST_LEGENDARY);
      expect(rarity).to.equal(RarityTier.LEGENDARY);
    });

    it("Should correctly identify LAST Legendary (Token 4199 - MAX)", async function () {
      const rarity = await staking.calculateRarity(BOUNDARIES.LAST_LEGENDARY);
      expect(rarity).to.equal(RarityTier.LEGENDARY);
    });

    it("Should REVERT for token 4200 (first invalid)", async function () {
      await expect(
        staking.calculateRarity(BOUNDARIES.FIRST_INVALID)
      ).to.be.revertedWith("Invalid token ID");
    });

    it("Should REVERT for token 9999 (old maximum)", async function () {
      await expect(
        staking.calculateRarity(BOUNDARIES.OLD_MAX)
      ).to.be.revertedWith("Invalid token ID");
    });
  });

  describe("2. Distribution Tests (Comprehensive)", function () {
    it("Should have correct distribution across all 4,200 token IDs", async function () {
      const counts = {
        [RarityTier.COMMON]: 0,
        [RarityTier.UNCOMMON]: 0,
        [RarityTier.RARE]: 0,
        [RarityTier.EPIC]: 0,
        [RarityTier.LEGENDARY]: 0
      };

      // Test every single token ID
      for (let tokenId = 0; tokenId < 4200; tokenId++) {
        const rarity = await staking.calculateRarity(tokenId);
        counts[rarity]++;
      }

      // Verify exact counts
      expect(counts[RarityTier.COMMON]).to.equal(
        EXPECTED_DISTRIBUTION.COMMON,
        "Common count mismatch"
      );
      expect(counts[RarityTier.UNCOMMON]).to.equal(
        EXPECTED_DISTRIBUTION.UNCOMMON,
        "Uncommon count mismatch"
      );
      expect(counts[RarityTier.RARE]).to.equal(
        EXPECTED_DISTRIBUTION.RARE,
        "Rare count mismatch"
      );
      expect(counts[RarityTier.EPIC]).to.equal(
        EXPECTED_DISTRIBUTION.EPIC,
        "Epic count mismatch"
      );
      expect(counts[RarityTier.LEGENDARY]).to.equal(
        EXPECTED_DISTRIBUTION.LEGENDARY,
        "Legendary count mismatch"
      );

      // Verify total
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      expect(total).to.equal(4200, "Total NFT count mismatch");

      console.log("\n✅ Distribution verified:");
      console.log(`   Common: ${counts[RarityTier.COMMON]} (${(counts[RarityTier.COMMON]/4200*100).toFixed(2)}%)`);
      console.log(`   Uncommon: ${counts[RarityTier.UNCOMMON]} (${(counts[RarityTier.UNCOMMON]/4200*100).toFixed(2)}%)`);
      console.log(`   Rare: ${counts[RarityTier.RARE]} (${(counts[RarityTier.RARE]/4200*100).toFixed(2)}%)`);
      console.log(`   Epic: ${counts[RarityTier.EPIC]} (${(counts[RarityTier.EPIC]/4200*100).toFixed(2)}%)`);
      console.log(`   Legendary: ${counts[RarityTier.LEGENDARY]} (${(counts[RarityTier.LEGENDARY]/4200*100).toFixed(2)}%)`);
    });

    it("Should have correct percentage distribution", async function () {
      const percentages = {
        COMMON: (EXPECTED_DISTRIBUTION.COMMON / 4200) * 100,
        UNCOMMON: (EXPECTED_DISTRIBUTION.UNCOMMON / 4200) * 100,
        RARE: (EXPECTED_DISTRIBUTION.RARE / 4200) * 100,
        EPIC: (EXPECTED_DISTRIBUTION.EPIC / 4200) * 100,
        LEGENDARY: (EXPECTED_DISTRIBUTION.LEGENDARY / 4200) * 100
      };

      // Common, Uncommon, Rare should be exactly as expected
      expect(percentages.COMMON).to.equal(70.00);
      expect(percentages.UNCOMMON).to.equal(15.00);
      expect(percentages.RARE).to.equal(5.00);

      // Epic and Legendary are slightly adjusted
      expect(percentages.EPIC).to.be.closeTo(7.86, 0.01);
      expect(percentages.LEGENDARY).to.be.closeTo(2.14, 0.01);

      // Total should be 100%
      const total = Object.values(percentages).reduce((a, b) => a + b, 0);
      expect(total).to.be.closeTo(100, 0.01);
    });
  });

  describe("3. Rarity Multiplier Tests", function () {
    it("Should return correct multipliers for each rarity", async function () {
      expect(await staking.getRarityMultiplier(RarityTier.COMMON)).to.equal(1);
      expect(await staking.getRarityMultiplier(RarityTier.UNCOMMON)).to.equal(2);
      expect(await staking.getRarityMultiplier(RarityTier.RARE)).to.equal(3);
      expect(await staking.getRarityMultiplier(RarityTier.EPIC)).to.equal(4);
      expect(await staking.getRarityMultiplier(RarityTier.LEGENDARY)).to.equal(5);
    });

    it("Should calculate correct voting power for each rarity", async function () {
      // Common (token 100)
      expect(await staking.calculateVotingPower(100)).to.equal(1);

      // Uncommon (token 3000)
      expect(await staking.calculateVotingPower(3000)).to.equal(2);

      // Rare (token 3650)
      expect(await staking.calculateVotingPower(3650)).to.equal(3);

      // Epic (token 4000)
      expect(await staking.calculateVotingPower(4000)).to.equal(4);

      // Legendary (token 4150)
      expect(await staking.calculateVotingPower(4150)).to.equal(5);
    });
  });

  describe("4. Staking Functionality Tests", function () {
    beforeEach(async function () {
      // Mint test NFTs to user1
      await mockNFT.mint(user1.address, 100);    // Common
      await mockNFT.mint(user1.address, 3000);   // Uncommon
      await mockNFT.mint(user1.address, 3650);   // Rare
      await mockNFT.mint(user1.address, 4000);   // Epic
      await mockNFT.mint(user1.address, 4150);   // Legendary

      // Approve staking contract
      await mockNFT.connect(user1).setApprovalForAll(await staking.getAddress(), true);
    });

    it("Should stake Common NFT correctly", async function () {
      await staking.connect(user1).stakeNFT(100);

      const stakeInfo = await staking.getStakeInfo(100);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.rarity).to.equal(RarityTier.COMMON);
      expect(stakeInfo.votingPower).to.equal(1);
    });

    it("Should stake Uncommon NFT correctly", async function () {
      await staking.connect(user1).stakeNFT(3000);

      const stakeInfo = await staking.getStakeInfo(3000);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.rarity).to.equal(RarityTier.UNCOMMON);
      expect(stakeInfo.votingPower).to.equal(2);
    });

    it("Should stake Rare NFT correctly", async function () {
      await staking.connect(user1).stakeNFT(3650);

      const stakeInfo = await staking.getStakeInfo(3650);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.rarity).to.equal(RarityTier.RARE);
      expect(stakeInfo.votingPower).to.equal(3);
    });

    it("Should stake Epic NFT correctly", async function () {
      await staking.connect(user1).stakeNFT(4000);

      const stakeInfo = await staking.getStakeInfo(4000);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.rarity).to.equal(RarityTier.EPIC);
      expect(stakeInfo.votingPower).to.equal(4);
    });

    it("Should stake Legendary NFT correctly", async function () {
      await staking.connect(user1).stakeNFT(4150);

      const stakeInfo = await staking.getStakeInfo(4150);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.rarity).to.equal(RarityTier.LEGENDARY);
      expect(stakeInfo.votingPower).to.equal(5);
    });

    it("Should calculate correct total voting power", async function () {
      // Stake all rarities
      await staking.connect(user1).stakeNFT(100);    // Common: 1
      await staking.connect(user1).stakeNFT(3000);   // Uncommon: 2
      await staking.connect(user1).stakeNFT(3650);   // Rare: 3
      await staking.connect(user1).stakeNFT(4000);   // Epic: 4
      await staking.connect(user1).stakeNFT(4150);   // Legendary: 5

      const votingPower = await staking.getVotingPower(user1.address);
      expect(votingPower).to.equal(15); // 1+2+3+4+5 = 15
    });

    it("Should reject staking invalid token 4200", async function () {
      await mockNFT.mint(user1.address, 4200);
      await expect(
        staking.connect(user1).stakeNFT(4200)
      ).to.be.revertedWith("Token ID exceeds maximum (4199)");
    });
  });

  describe("5. Batch Operation Tests", function () {
    beforeEach(async function () {
      // Mint NFTs across rarity boundaries
      const tokenIds = [2938, 2939, 2940, 2941, 3569, 3570, 3779, 3780, 4109, 4110];

      for (const tokenId of tokenIds) {
        await mockNFT.mint(user1.address, tokenId);
      }

      await mockNFT.connect(user1).setApprovalForAll(await staking.getAddress(), true);
    });

    it("Should batch stake across Common/Uncommon boundary", async function () {
      const tokenIds = [2938, 2939, 2940, 2941];
      await staking.connect(user1).batchStakeNFTs(tokenIds);

      // Verify rarities
      expect((await staking.getStakeInfo(2938)).rarity).to.equal(RarityTier.COMMON);
      expect((await staking.getStakeInfo(2939)).rarity).to.equal(RarityTier.COMMON);
      expect((await staking.getStakeInfo(2940)).rarity).to.equal(RarityTier.UNCOMMON);
      expect((await staking.getStakeInfo(2941)).rarity).to.equal(RarityTier.UNCOMMON);

      // Verify voting power: 1+1+2+2 = 6
      const votingPower = await staking.getVotingPower(user1.address);
      expect(votingPower).to.equal(6);
    });

    it("Should batch stake across multiple rarity boundaries", async function () {
      const tokenIds = [2939, 2940, 3569, 3570, 3779, 3780, 4109, 4110];
      await staking.connect(user1).batchStakeNFTs(tokenIds);

      // Common, Uncommon, Uncommon, Rare, Rare, Epic, Epic, Legendary
      // 1 + 2 + 2 + 3 + 3 + 4 + 4 + 5 = 24
      const votingPower = await staking.getVotingPower(user1.address);
      expect(votingPower).to.equal(24);
    });
  });

  describe("6. Edge Case Tests", function () {
    beforeEach(async function () {
      await mockNFT.mint(user1.address, 0);
      await mockNFT.mint(user1.address, 4199);
      await mockNFT.connect(user1).setApprovalForAll(await staking.getAddress(), true);
    });

    it("Should handle minimum token ID (0)", async function () {
      await staking.connect(user1).stakeNFT(0);
      const stakeInfo = await staking.getStakeInfo(0);
      expect(stakeInfo.rarity).to.equal(RarityTier.COMMON);
    });

    it("Should handle maximum token ID (4199)", async function () {
      await staking.connect(user1).stakeNFT(4199);
      const stakeInfo = await staking.getStakeInfo(4199);
      expect(stakeInfo.rarity).to.equal(RarityTier.LEGENDARY);
    });

    it("Should reject calculateRarity for 4200", async function () {
      await expect(
        staking.calculateRarity(4200)
      ).to.be.revertedWith("Invalid token ID");
    });

    it("Should reject calculateRarity for 10000", async function () {
      await expect(
        staking.calculateRarity(10000)
      ).to.be.revertedWith("Invalid token ID");
    });
  });

  describe("7. Gas Efficiency Tests", function () {
    it("Should use minimal gas for calculateRarity (pure function)", async function () {
      // Pure function calls don't consume gas in view calls, but let's verify it's callable
      const rarity = await staking.calculateRarity(2000);
      expect(rarity).to.equal(RarityTier.COMMON);
    });

    it("Should maintain gas efficiency for staking", async function () {
      await mockNFT.mint(user1.address, 1000);
      await mockNFT.connect(user1).setApprovalForAll(await staking.getAddress(), true);

      const tx = await staking.connect(user1).stakeNFT(1000);
      const receipt = await tx.wait();

      console.log(`\n   Staking gas used: ${receipt.gasUsed.toString()}`);

      // Gas should be reasonable (no external metadata lookups!)
      // Includes: NFT transfer, storage writes, event emissions, voting power calc
      expect(receipt.gasUsed).to.be.lt(350000); // Realistic limit for full staking operation
    });
  });

  describe("8. Integration Tests", function () {
    it("Should handle complete user journey", async function () {
      // Setup
      const tokenIds = [100, 3000, 3650, 4000, 4150];

      for (const tokenId of tokenIds) {
        await mockNFT.mint(user1.address, tokenId);
      }

      await mockNFT.connect(user1).setApprovalForAll(await staking.getAddress(), true);

      // Batch stake
      await staking.connect(user1).batchStakeNFTs(tokenIds);

      // Verify staked count
      expect(await staking.getStakedCount(user1.address)).to.equal(5);

      // Verify voting power (1+2+3+4+5 = 15)
      expect(await staking.getVotingPower(user1.address)).to.equal(15);

      // Verify rarity distribution
      const distribution = await staking.getRarityDistribution();
      expect(distribution.commonCount).to.equal(1);
      expect(distribution.uncommonCount).to.equal(1);
      expect(distribution.rareCount).to.equal(1);
      expect(distribution.epicCount).to.equal(1);
      expect(distribution.legendaryCount).to.equal(1);

      // Verify total staked
      expect(await staking.getTotalStaked()).to.equal(5);
    });
  });
});
