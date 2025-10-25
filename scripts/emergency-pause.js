/**
 * EMERGENCY: Pause Contract
 *
 * Use this script to immediately pause the staking contract
 * in case of critical issues.
 *
 * Prerequisites:
 * - You must be the contract owner
 * - Contract must not already be paused
 *
 * Usage:
 * npx hardhat run scripts/emergency-pause.js --network [NETWORK]
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚨 EMERGENCY PAUSE PROCEDURE\n");
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    // Get deployment info
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Load latest deployment
    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "..", "deployments");

    const files = fs.readdirSync(deploymentsDir)
      .filter(f => f.includes(`staking-4200-${network.name}`))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error(`No deployment found for network: ${network.name}`);
    }

    const deploymentFile = path.join(deploymentsDir, files[0]);
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    const contractAddress = deployment.contracts.stakingContract;

    console.log(`Contract: ${contractAddress}\n`);

    // Connect to contract
    const [owner] = await ethers.getSigners();
    console.log(`Signer: ${owner.address}`);

    const staking = await ethers.getContractAt("EnhancedNFTStaking", contractAddress);

    // Verify ownership
    const contractOwner = await staking.owner();
    console.log(`Contract Owner: ${contractOwner}\n`);

    if (owner.address.toLowerCase() !== contractOwner.toLowerCase()) {
      throw new Error("❌ CRITICAL: You are not the contract owner!");
    }

    // Check if already paused
    const isPaused = await staking.paused();
    if (isPaused) {
      console.log("⚠️  Contract is already paused!");
      console.log("\nNo action needed. Contract is already in paused state.\n");
      return;
    }

    console.log("⚠️  WARNING: This will pause the staking contract!");
    console.log("⚠️  Users will NOT be able to stake new NFTs.");
    console.log("⚠️  Users WILL still be able to unstake.\n");

    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("🚨 INITIATING EMERGENCY PAUSE\n");

    // Pause the contract
    const tx = await staking.pause();
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...\n");

    const receipt = await tx.wait();
    console.log(`✅ CONTRACT PAUSED at block ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}\n`);

    // Verify paused state
    const pausedNow = await staking.paused();
    console.log(`Paused Status: ${pausedNow ? "✅ PAUSED" : "❌ NOT PAUSED"}\n`);

    if (pausedNow) {
      console.log("═══════════════════════════════════════════════════════════════\n");
      console.log("✅ EMERGENCY PAUSE SUCCESSFUL\n");
      console.log("═══════════════════════════════════════════════════════════════\n");

      console.log("📋 NEXT STEPS:\n");
      console.log("1. Investigate the issue that caused the pause");
      console.log("2. Communicate with users about the pause");
      console.log("3. Fix the underlying issue");
      console.log("4. Test the fix thoroughly");
      console.log("5. Unpause when safe (emergency-unpause.js)\n");

      console.log("📊 Current State:");
      console.log("   ✅ Staking: DISABLED");
      console.log("   ✅ Unstaking: ENABLED");
      console.log("   ✅ Emergency Unstake: ENABLED\n");

    } else {
      throw new Error("Pause failed - contract still not paused!");
    }

  } catch (error) {
    console.error("\n❌ EMERGENCY PAUSE FAILED!\n");
    console.error("Error:", error.message);
    console.error("\nStack Trace:");
    console.error(error.stack);
    console.error("\n═══════════════════════════════════════════════════════════════\n");
    console.error("⚠️  CRITICAL: Contract could not be paused!");
    console.error("⚠️  Escalate to senior team immediately!\n");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
