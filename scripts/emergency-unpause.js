/**
 * EMERGENCY: Unpause Contract
 *
 * Use this script to unpause the staking contract
 * after resolving critical issues.
 *
 * Prerequisites:
 * - You must be the contract owner
 * - Contract must be paused
 * - Issues must be resolved
 *
 * Usage:
 * npx hardhat run scripts/emergency-unpause.js --network [NETWORK]
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n✅ EMERGENCY UNPAUSE PROCEDURE\n");
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

    // Check if paused
    const isPaused = await staking.paused();
    if (!isPaused) {
      console.log("ℹ️  Contract is not currently paused.");
      console.log("\nNo action needed. Contract is already operational.\n");
      return;
    }

    console.log("⚠️  WARNING: This will unpause the staking contract!");
    console.log("⚠️  Users will be able to stake NFTs again.\n");

    console.log("📋 PRE-UNPAUSE CHECKLIST:\n");
    console.log("Before unpausing, ensure:\n");
    console.log("  [ ] The issue that caused the pause has been resolved");
    console.log("  [ ] Contract has been thoroughly tested");
    console.log("  [ ] Team is ready to monitor");
    console.log("  [ ] Users have been notified");
    console.log("  [ ] Monitoring systems are active\n");

    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("✅ INITIATING UNPAUSE\n");

    // Unpause the contract
    const tx = await staking.unpause();
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...\n");

    const receipt = await tx.wait();
    console.log(`✅ CONTRACT UNPAUSED at block ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}\n`);

    // Verify unpaused state
    const pausedNow = await staking.paused();
    console.log(`Paused Status: ${pausedNow ? "❌ STILL PAUSED" : "✅ OPERATIONAL"}\n`);

    if (!pausedNow) {
      console.log("═══════════════════════════════════════════════════════════════\n");
      console.log("✅ UNPAUSE SUCCESSFUL - CONTRACT OPERATIONAL\n");
      console.log("═══════════════════════════════════════════════════════════════\n");

      console.log("📋 POST-UNPAUSE ACTIONS:\n");
      console.log("1. Start intensive monitoring (24-48 hours)");
      console.log("2. Watch for any unusual activity");
      console.log("3. Communicate with users that service is restored");
      console.log("4. Document the incident");
      console.log("5. Review and update procedures\n");

      console.log("📊 Current State:");
      console.log("   ✅ Staking: ENABLED");
      console.log("   ✅ Unstaking: ENABLED");
      console.log("   ✅ Contract: OPERATIONAL\n");

      console.log("🚨 CRITICAL: Monitor closely for the next 24-48 hours!\n");

    } else {
      throw new Error("Unpause failed - contract still paused!");
    }

  } catch (error) {
    console.error("\n❌ UNPAUSE FAILED!\n");
    console.error("Error:", error.message);
    console.error("\nStack Trace:");
    console.error(error.stack);
    console.error("\n═══════════════════════════════════════════════════════════════\n");
    console.error("⚠️  Contract could not be unpaused!");
    console.error("⚠️  Investigate and try again.\n");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
