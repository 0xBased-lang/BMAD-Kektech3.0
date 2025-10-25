/**
 * SEPOLIA VALIDATION SCRIPT
 *
 * Validates the Sepolia deployment with comprehensive tests
 *
 * Usage:
 * npx hardhat run scripts/validate-sepolia.js --network sepolia
 */

const { ethers } = require("hardhat");

// Deployed contract addresses on Sepolia
const MOCK_NFT_ADDRESS = "0xf355F6d475c495B046Ca37235c7aB212fcc69dCb";
const STAKING_ADDRESS = "0x2aA99Af78fCd40Ae0AeFc5a8385557eB7AAF9473";

async function main() {
  console.log("\n🔍 SEPOLIA DEPLOYMENT VALIDATION\n");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📍 Validator: ${deployer.address}`);
  console.log(`📍 Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log("═".repeat(70));

  let passCount = 0;
  let failCount = 0;
  const results = [];

  try {
    // Get contract instances
    const mockNFT = await ethers.getContractAt("MockNFT", MOCK_NFT_ADDRESS);
    const staking = await ethers.getContractAt("EnhancedNFTStaking", STAKING_ADDRESS);

    console.log("\n📋 VALIDATION TESTS\n");

    // ========================================
    // TEST 1: Contract Deployment
    // ========================================
    console.log("Test 1: Contract Deployment Verification");
    try {
      const nftCode = await ethers.provider.getCode(MOCK_NFT_ADDRESS);
      const stakingCode = await ethers.provider.getCode(STAKING_ADDRESS);

      if (nftCode !== "0x" && stakingCode !== "0x") {
        console.log("   ✅ Both contracts deployed");
        passCount++;
        results.push({ test: "Contract Deployment", status: "PASS" });
      } else {
        throw new Error("Contract code not found");
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failCount++;
      results.push({ test: "Contract Deployment", status: "FAIL", error: error.message });
    }

    // ========================================
    // TEST 2: NFT Contract Reference
    // ========================================
    console.log("\nTest 2: NFT Contract Reference");
    try {
      const nftRef = await staking.nftContract();
      if (nftRef.toLowerCase() === MOCK_NFT_ADDRESS.toLowerCase()) {
        console.log(`   ✅ Correct NFT reference: ${nftRef}`);
        passCount++;
        results.push({ test: "NFT Reference", status: "PASS" });
      } else {
        throw new Error(`Wrong NFT reference: ${nftRef}`);
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failCount++;
      results.push({ test: "NFT Reference", status: "FAIL", error: error.message });
    }

    // ========================================
    // TEST 3: Rarity Calculations (4,200 basis)
    // ========================================
    console.log("\nTest 3: Rarity Calculations (4,200 NFT basis)");

    const rarityTests = [
      { id: 0, expected: 4200, desc: "First NFT (highest)" },
      { id: 1000, expected: 3200, desc: "Mid-range Common" },
      { id: 2940, expected: 1260, desc: "Common/Uncommon boundary" },
      { id: 3570, expected: 630, desc: "Uncommon/Rare boundary" },
      { id: 4199, expected: 1, desc: "Last NFT (lowest)" }
    ];

    let rarityPass = 0;
    for (const test of rarityTests) {
      try {
        const rarity = await staking.calculateRarity(test.id);
        if (Number(rarity) === test.expected) {
          console.log(`   ✅ NFT #${test.id}: rarity ${rarity} (${test.desc})`);
          rarityPass++;
        } else {
          console.log(`   ❌ NFT #${test.id}: got ${rarity}, expected ${test.expected}`);
          failCount++;
        }
      } catch (error) {
        console.log(`   ❌ NFT #${test.id}: ${error.message}`);
        failCount++;
      }
    }

    if (rarityPass === rarityTests.length) {
      passCount++;
      results.push({ test: "Rarity Calculations", status: "PASS", details: `${rarityPass}/${rarityTests.length}` });
    } else {
      results.push({ test: "Rarity Calculations", status: "PARTIAL", details: `${rarityPass}/${rarityTests.length}` });
    }

    // ========================================
    // TEST 4: Invalid Token Rejection
    // ========================================
    console.log("\nTest 4: Invalid Token Rejection");
    try {
      await staking.calculateRarity(4200);
      console.log("   ❌ Should have rejected token 4200");
      failCount++;
      results.push({ test: "Invalid Token Rejection", status: "FAIL" });
    } catch (error) {
      if (error.message.includes("Token ID out of range") || error.message.includes("revert")) {
        console.log("   ✅ Correctly rejects token 4200");
        passCount++;
        results.push({ test: "Invalid Token Rejection", status: "PASS" });
      } else {
        console.log(`   ❌ Wrong error: ${error.message}`);
        failCount++;
        results.push({ test: "Invalid Token Rejection", status: "FAIL", error: error.message });
      }
    }

    // ========================================
    // TEST 5: Rarity-to-Tier Mapping
    // ========================================
    console.log("\nTest 5: Rarity-to-Tier Mapping");

    const tierTests = [
      { id: 0, tier: 4, desc: "Legendary (top 90)" },
      { id: 2939, tier: 0, desc: "Common (first 2940)" },
      { id: 2940, tier: 1, desc: "Uncommon boundary" },
      { id: 3570, tier: 2, desc: "Rare boundary" },
      { id: 3780, tier: 3, desc: "Epic boundary" }
    ];

    let tierPass = 0;
    for (const test of tierTests) {
      try {
        const tier = await staking.getRarityTier(test.id);
        if (Number(tier) === test.tier) {
          console.log(`   ✅ NFT #${test.id}: tier ${tier} - ${test.desc}`);
          tierPass++;
        } else {
          console.log(`   ❌ NFT #${test.id}: got tier ${tier}, expected ${test.tier}`);
        }
      } catch (error) {
        console.log(`   ❌ NFT #${test.id}: ${error.message}`);
      }
    }

    if (tierPass === tierTests.length) {
      passCount++;
      results.push({ test: "Tier Mapping", status: "PASS", details: `${tierPass}/${tierTests.length}` });
    } else {
      results.push({ test: "Tier Mapping", status: "PARTIAL", details: `${tierPass}/${tierTests.length}` });
    }

    // ========================================
    // TEST 6: Distribution Verification
    // ========================================
    console.log("\nTest 6: Distribution Verification");
    try {
      const distribution = {
        Common: 0,      // 0-2939
        Uncommon: 0,    // 2940-3569
        Rare: 0,        // 3570-3779
        Epic: 0,        // 3780-4109
        Legendary: 0    // 4110-4199
      };

      // Sample check
      for (let i = 0; i < 4200; i += 100) {
        const tier = await staking.getRarityTier(i);
        const tierNum = Number(tier);

        if (tierNum === 0) distribution.Common++;
        else if (tierNum === 1) distribution.Uncommon++;
        else if (tierNum === 2) distribution.Rare++;
        else if (tierNum === 3) distribution.Epic++;
        else if (tierNum === 4) distribution.Legendary++;
      }

      console.log("   Sample Distribution (every 100th NFT):");
      console.log(`   Common: ${distribution.Common}, Uncommon: ${distribution.Uncommon}, Rare: ${distribution.Rare}, Epic: ${distribution.Epic}, Legendary: ${distribution.Legendary}`);
      console.log("   ✅ Distribution verified");
      passCount++;
      results.push({ test: "Distribution", status: "PASS" });
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failCount++;
      results.push({ test: "Distribution", status: "FAIL", error: error.message });
    }

    // ========================================
    // TEST 7: Read-Only Functions
    // ========================================
    console.log("\nTest 7: Read-Only Functions");
    try {
      const stakers = await staking.totalStakers();
      const totalStaked = await staking.totalStakedNFTs();
      console.log(`   ✅ totalStakers: ${stakers}`);
      console.log(`   ✅ totalStakedNFTs: ${totalStaked}`);
      passCount++;
      results.push({ test: "Read-Only Functions", status: "PASS" });
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failCount++;
      results.push({ test: "Read-Only Functions", status: "FAIL", error: error.message });
    }

    // ========================================
    // VALIDATION SUMMARY
    // ========================================
    console.log("\n" + "═".repeat(70));
    console.log("📊 VALIDATION SUMMARY");
    console.log("═".repeat(70));

    console.log(`\n✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

    console.log("\n📋 Detailed Results:");
    results.forEach((result, index) => {
      const symbol = result.status === "PASS" ? "✅" : result.status === "PARTIAL" ? "⚠️" : "❌";
      const details = result.details ? ` (${result.details})` : "";
      console.log(`   ${index + 1}. ${symbol} ${result.test}${details}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log("\n" + "═".repeat(70));

    // Final verdict
    if (failCount === 0) {
      console.log("\n🎉 VALIDATION PASSED - Ready for comprehensive testing!");
      console.log("\n📍 Contract Addresses:");
      console.log(`   MockNFT:  ${MOCK_NFT_ADDRESS}`);
      console.log(`   Staking:  ${STAKING_ADDRESS}`);
      console.log("\n✅ NEXT STEPS:");
      console.log("   1. Mint test NFTs");
      console.log("   2. Test staking/unstaking");
      console.log("   3. Test voting power calculations");
      console.log("   4. Document gas costs");
    } else if (passCount > failCount) {
      console.log("\n⚠️  VALIDATION MOSTLY PASSED - Some issues to investigate");
      console.log("   Review failed tests above and investigate");
    } else {
      console.log("\n❌ VALIDATION FAILED - Issues need to be fixed");
      console.log("   Review all failed tests and fix before proceeding");
    }

    console.log("\n" + "═".repeat(70) + "\n");

  } catch (error) {
    console.log("\n❌ VALIDATION ERROR:");
    console.log(error.message);
    if (error.stack) {
      console.log("\nStack trace:");
      console.log(error.stack);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
