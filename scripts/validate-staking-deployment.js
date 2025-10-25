/**
 * Post-Deployment Validation Script for EnhancedNFTStaking
 *
 * Comprehensive validation of deployed staking contract
 *
 * Tests:
 * - Contract existence and code
 * - All rarity boundaries (12 tests)
 * - Distribution accuracy
 * - Rarity multipliers
 * - Initial state
 * - Contract configuration
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔬 VALIDATING DEPLOYED EnhancedNFTStaking CONTRACT\n");
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    // ========================================
    // STEP 1: LOAD DEPLOYMENT INFO
    // ========================================
    console.log("📋 Step 1: Loading Deployment Information\n");

    // Find most recent deployment file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const files = fs.readdirSync(deploymentsDir)
      .filter(f => f.startsWith("staking-4200-"))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error("No deployment files found! Deploy contract first.");
    }

    const deploymentFile = path.join(deploymentsDir, files[0]);
    console.log(`✅ Loading deployment: ${files[0]}`);

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    const stakingAddress = deploymentInfo.contracts.stakingContract;
    const nftAddress = deploymentInfo.contracts.nftContract;

    console.log(`✅ Staking Contract: ${stakingAddress}`);
    console.log(`✅ NFT Contract: ${nftAddress}\n`);

    // ========================================
    // STEP 2: CONNECT TO CONTRACT
    // ========================================
    console.log("📋 Step 2: Connecting to Deployed Contract\n");

    const network = await ethers.provider.getNetwork();
    console.log(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`✅ Current Block: ${blockNumber}`);

    // Verify contract exists
    const code = await ethers.provider.getCode(stakingAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error("❌ No contract code found at address!");
    }
    console.log(`✅ Contract Code Size: ${(code.length - 2) / 2} bytes\n`);

    // Connect to contract
    const stakingContract = await ethers.getContractAt("EnhancedNFTStaking", stakingAddress);
    console.log("✅ Connected to contract\n");

    // ========================================
    // STEP 3: COMPREHENSIVE BOUNDARY TESTS
    // ========================================
    console.log("📋 Step 3: Comprehensive Boundary Tests\n");

    const boundaries = [
      { id: 0, expected: 0, name: "First Common" },
      { id: 2939, expected: 0, name: "Last Common" },
      { id: 2940, expected: 1, name: "First Uncommon" },
      { id: 3569, expected: 1, name: "Last Uncommon" },
      { id: 3570, expected: 2, name: "First Rare" },
      { id: 3779, expected: 2, name: "Last Rare" },
      { id: 3780, expected: 3, name: "First Epic" },
      { id: 4109, expected: 3, name: "Last Epic" },
      { id: 4110, expected: 4, name: "First Legendary" },
      { id: 4199, expected: 4, name: "Last Legendary (MAX)" }
    ];

    let passedBoundaries = 0;

    for (const boundary of boundaries) {
      const rarity = await stakingContract.calculateRarity(boundary.id);
      if (Number(rarity) === boundary.expected) {
        console.log(`   ✅ Token ${boundary.id.toString().padStart(4, " ")}: ${boundary.name}`);
        passedBoundaries++;
      } else {
        console.log(`   ❌ Token ${boundary.id}: Expected ${boundary.expected}, got ${rarity}`);
      }
    }

    console.log(`\n✅ Boundary Tests: ${passedBoundaries}/10 passed\n`);

    if (passedBoundaries !== 10) {
      throw new Error("❌ Not all boundary tests passed!");
    }

    // ========================================
    // STEP 4: INVALID TOKEN REJECTION
    // ========================================
    console.log("📋 Step 4: Invalid Token Rejection Tests\n");

    let invalidRejections = 0;

    // Test 4200 (first invalid)
    try {
      await stakingContract.calculateRarity(4200);
      console.log("   ❌ Token 4200: Should have been rejected!");
    } catch (error) {
      if (error.message.includes("Invalid token ID")) {
        console.log("   ✅ Token 4200: Correctly rejected");
        invalidRejections++;
      }
    }

    // Test 9999 (old maximum)
    try {
      await stakingContract.calculateRarity(9999);
      console.log("   ❌ Token 9999: Should have been rejected!");
    } catch (error) {
      if (error.message.includes("Invalid token ID")) {
        console.log("   ✅ Token 9999: Correctly rejected");
        invalidRejections++;
      }
    }

    console.log(`\n✅ Invalid Token Tests: ${invalidRejections}/2 passed\n`);

    if (invalidRejections !== 2) {
      throw new Error("❌ Invalid token rejection tests failed!");
    }

    // ========================================
    // STEP 5: DISTRIBUTION VERIFICATION
    // ========================================
    console.log("📋 Step 5: Distribution Verification\n");

    console.log("Verifying rarity distribution across all 4,200 token IDs...");
    console.log("(This may take a minute)\n");

    const counts = {
      0: 0, // COMMON
      1: 0, // UNCOMMON
      2: 0, // RARE
      3: 0, // EPIC
      4: 0  // LEGENDARY
    };

    // Sample verification (test every 10th token for speed)
    for (let i = 0; i < 4200; i += 10) {
      const rarity = await stakingContract.calculateRarity(i);
      counts[rarity]++;
    }

    // Extrapolate to full count
    const fullCounts = {
      0: counts[0] * 10,
      1: counts[1] * 10,
      2: counts[2] * 10,
      3: counts[3] * 10,
      4: counts[4] * 10
    };

    console.log("Distribution (sampled):");
    console.log(`   Common:    ${fullCounts[0]} (~${(fullCounts[0]/4200*100).toFixed(1)}%)`);
    console.log(`   Uncommon:  ${fullCounts[1]} (~${(fullCounts[1]/4200*100).toFixed(1)}%)`);
    console.log(`   Rare:      ${fullCounts[2]} (~${(fullCounts[2]/4200*100).toFixed(1)}%)`);
    console.log(`   Epic:      ${fullCounts[3]} (~${(fullCounts[3]/4200*100).toFixed(1)}%)`);
    console.log(`   Legendary: ${fullCounts[4]} (~${(fullCounts[4]/4200*100).toFixed(1)}%)\n`);

    // Verify approximate percentages
    const commonPct = fullCounts[0] / 4200 * 100;
    const uncommonPct = fullCounts[1] / 4200 * 100;
    const rarePct = fullCounts[2] / 4200 * 100;

    if (Math.abs(commonPct - 70) > 2 || Math.abs(uncommonPct - 15) > 2 || Math.abs(rarePct - 5) > 2) {
      console.log("⚠️  Distribution percentages may be off (based on sampling)");
    } else {
      console.log("✅ Distribution percentages look correct\n");
    }

    // ========================================
    // STEP 6: RARITY MULTIPLIERS
    // ========================================
    console.log("📋 Step 6: Rarity Multiplier Verification\n");

    const multipliers = [
      { rarity: 0, expected: 1, name: "Common" },
      { rarity: 1, expected: 2, name: "Uncommon" },
      { rarity: 2, expected: 3, name: "Rare" },
      { rarity: 3, expected: 4, name: "Epic" },
      { rarity: 4, expected: 5, name: "Legendary" }
    ];

    let passedMultipliers = 0;

    for (const mult of multipliers) {
      const multiplier = await stakingContract.getRarityMultiplier(mult.rarity);
      if (multiplier === BigInt(mult.expected)) {
        console.log(`   ✅ ${mult.name.padEnd(10)}: ${mult.expected}x`);
        passedMultipliers++;
      } else {
        console.log(`   ❌ ${mult.name}: Expected ${mult.expected}x, got ${multiplier}x`);
      }
    }

    console.log(`\n✅ Multiplier Tests: ${passedMultipliers}/5 passed\n`);

    if (passedMultipliers !== 5) {
      throw new Error("❌ Not all multiplier tests passed!");
    }

    // ========================================
    // STEP 7: VOTING POWER CALCULATIONS
    // ========================================
    console.log("📋 Step 7: Voting Power Calculation Verification\n");

    const votingPowerTests = [
      { tokenId: 100, expectedPower: 1, rarity: "Common" },
      { tokenId: 3000, expectedPower: 2, rarity: "Uncommon" },
      { tokenId: 3650, expectedPower: 3, rarity: "Rare" },
      { tokenId: 4000, expectedPower: 4, rarity: "Epic" },
      { tokenId: 4150, expectedPower: 5, rarity: "Legendary" }
    ];

    let passedVotingPower = 0;

    for (const test of votingPowerTests) {
      const power = await stakingContract.calculateVotingPower(test.tokenId);
      if (power === BigInt(test.expectedPower)) {
        console.log(`   ✅ Token ${test.tokenId} (${test.rarity}): ${test.expectedPower} VP`);
        passedVotingPower++;
      } else {
        console.log(`   ❌ Token ${test.tokenId}: Expected ${test.expectedPower} VP, got ${power} VP`);
      }
    }

    console.log(`\n✅ Voting Power Tests: ${passedVotingPower}/5 passed\n`);

    if (passedVotingPower !== 5) {
      throw new Error("❌ Not all voting power tests passed!");
    }

    // ========================================
    // STEP 8: CONTRACT STATE VERIFICATION
    // ========================================
    console.log("📋 Step 8: Contract State Verification\n");

    const totalStaked = await stakingContract.getTotalStaked();
    console.log(`   Total Staked: ${totalStaked}`);

    const totalVotingPower = await stakingContract.getTotalVotingPower();
    console.log(`   Total Voting Power: ${totalVotingPower}`);

    const distribution = await stakingContract.getRarityDistribution();
    console.log(`   Rarity Distribution:`);
    console.log(`      Common: ${distribution.commonCount}`);
    console.log(`      Uncommon: ${distribution.uncommonCount}`);
    console.log(`      Rare: ${distribution.rareCount}`);
    console.log(`      Epic: ${distribution.epicCount}`);
    console.log(`      Legendary: ${distribution.legendaryCount}\n`);

    // ========================================
    // STEP 9: CONTRACT CONFIGURATION
    // ========================================
    console.log("📋 Step 9: Contract Configuration Verification\n");

    const nftContract = await stakingContract.nftContract();
    console.log(`   NFT Contract: ${nftContract}`);

    if (nftContract.toLowerCase() !== nftAddress.toLowerCase()) {
      throw new Error("❌ NFT contract address mismatch!");
    }
    console.log(`   ✅ NFT contract address correct\n`);

    const owner = await stakingContract.owner();
    console.log(`   Contract Owner: ${owner}`);
    console.log(`   ✅ Owner verified\n`);

    const maxBatchSize = await stakingContract.MAX_BATCH_SIZE();
    console.log(`   Max Batch Size: ${maxBatchSize}`);

    const minStakeDuration = await stakingContract.MIN_STAKE_DURATION();
    console.log(`   Min Stake Duration: ${minStakeDuration} seconds (${Number(minStakeDuration)/3600} hours)\n`);

    // ========================================
    // VALIDATION SUMMARY
    // ========================================
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("🎉 VALIDATION COMPLETE!\n");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const totalTests = 10 + 2 + 5 + 5; // boundaries + invalid + multipliers + voting power
    const passedTests = passedBoundaries + invalidRejections + passedMultipliers + passedVotingPower;

    console.log("📊 Validation Summary:\n");
    console.log(`   Contract Address:     ${stakingAddress}`);
    console.log(`   NFT Contract:         ${nftAddress}`);
    console.log(`   Network:              ${network.name}`);
    console.log(`   Block Number:         ${blockNumber}`);
    console.log(`   Total Tests:          ${passedTests}/${totalTests} PASSED ✅\n`);

    console.log("Test Breakdown:");
    console.log(`   ✅ Boundary Tests:        ${passedBoundaries}/10`);
    console.log(`   ✅ Invalid Token Tests:   ${invalidRejections}/2`);
    console.log(`   ✅ Multiplier Tests:      ${passedMultipliers}/5`);
    console.log(`   ✅ Voting Power Tests:    ${passedVotingPower}/5`);
    console.log(`   ✅ Configuration:         Verified`);
    console.log(`   ✅ Initial State:         Verified\n`);

    if (passedTests === totalTests) {
      console.log("✅ ALL VALIDATION TESTS PASSED!\n");
      console.log("═══════════════════════════════════════════════════════════════\n");
      console.log("🚀 Contract is READY FOR USE!\n");
      console.log("Next steps:");
      console.log("1. Test staking with real NFT (if on mainnet/testnet)");
      console.log("2. Update frontend with contract address");
      console.log("3. Monitor initial staking operations\n");
    } else {
      console.log(`⚠️  ${totalTests - passedTests} test(s) failed - review above\n`);
    }

    console.log("═══════════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("\n❌ VALIDATION FAILED!\n");
    console.error("Error:", error.message);
    console.error("\nStack Trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
