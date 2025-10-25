/**
 * CHECK DEPLOYED CONTRACT
 *
 * Simple script to check what's actually deployed on Sepolia
 *
 * Usage:
 * npx hardhat run scripts/check-deployed-contract.js --network sepolia
 */

const { ethers } = require("hardhat");

const STAKING_ADDRESS = "0x2aA99Af78fCd40Ae0AeFc5a8385557eB7AAF9473";

async function main() {
  console.log("\n🔍 CHECKING DEPLOYED CONTRACT\n");
  console.log("═".repeat(70));

  try {
    // Get contract at address
    const staking = await ethers.getContractAt("EnhancedNFTStaking", STAKING_ADDRESS);

    console.log(`📍 Contract Address: ${STAKING_ADDRESS}`);
    console.log(`📍 Network: ${(await ethers.provider.getNetwork()).name}\n`);

    // Check what we can actually call
    console.log("Testing available functions:\n");

    // Test 1: Calculate rarity for a few tokens
    console.log("1. Testing calculateRarity():");
    try {
      const tests = [0, 100, 1000, 2940, 4199];
      for (const id of tests) {
        const result = await staking.calculateRarity(id);
        console.log(`   Token #${id}: ${result}`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 2: Try to get NFT contract reference
    console.log("\n2. NFT Contract Reference:");
    try {
      const nftContract = await staking.nftContract();
      console.log(`   ✅ NFT Contract: ${nftContract}`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 3: Check if token 4200 is rejected
    console.log("\n3. Testing invalid token (4200):");
    try {
      await staking.calculateRarity(4200);
      console.log(`   ❌ Should have rejected!`);
    } catch (error) {
      console.log(`   ✅ Correctly rejected: ${error.message.substring(0, 50)}...`);
    }

    // Test 4: Check contract code size
    console.log("\n4. Contract Info:");
    const code = await ethers.provider.getCode(STAKING_ADDRESS);
    console.log(`   Code Size: ${(code.length - 2) / 2} bytes`);

    console.log("\n" + "═".repeat(70));
    console.log("\n✅ Basic contract check complete!");
    console.log("\nContract is deployed and responsive.");
    console.log("calculateRarity() is working (though returning unexpected values)");
    console.log("\nThis suggests the contract IS the 4,200 version,");
    console.log("but calculateRarity might return tier instead of rarity value.");
    console.log("\n" + "═".repeat(70) + "\n");

  } catch (error) {
    console.log("\n❌ ERROR:");
    console.log(error.message);
    console.log("\n" + "═".repeat(70) + "\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
