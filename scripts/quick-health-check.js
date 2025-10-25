/**
 * Quick Health Check
 *
 * Fast 30-second health check of deployed contract
 *
 * Usage:
 * npx hardhat run scripts/quick-health-check.js --network [NETWORK]
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n🏥 QUICK HEALTH CHECK\n");

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  try {
    // Get network
    const network = await ethers.provider.getNetwork();
    const block = await ethers.provider.getBlockNumber();

    console.log(`Network: ${network.name} (${network.chainId})`);
    console.log(`Block: ${block}\n`);

    // Load deployment
    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "..", "deployments");

    const files = fs.readdirSync(deploymentsDir)
      .filter(f => f.includes(`staking-4200-${network.name}`))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log(`❌ No deployment found for ${network.name}\n`);
      process.exit(1);
    }

    const deployment = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
    );

    const address = deployment.contracts.stakingContract;
    console.log(`Contract: ${address}\n`);

    const staking = await ethers.getContractAt("EnhancedNFTStaking", address);

    console.log("Running checks...\n");

    // Check 1: Contract accessible
    try {
      await staking.owner();
      console.log("✅ Contract accessible");
      passed++;
    } catch (e) {
      console.log(`❌ Contract not accessible: ${e.message}`);
      failed++;
    }

    // Check 2: Critical boundaries
    const boundaries = [
      { id: 0, expected: 0 },
      { id: 2940, expected: 1 },
      { id: 4199, expected: 4 }
    ];

    let boundariesOk = true;
    for (const { id, expected } of boundaries) {
      const rarity = await staking.calculateRarity(id);
      if (Number(rarity) !== expected) {
        console.log(`❌ Boundary ${id} wrong: expected ${expected}, got ${rarity}`);
        boundariesOk = false;
        failed++;
      }
    }
    if (boundariesOk) {
      console.log("✅ Critical boundaries correct");
      passed++;
    }

    // Check 3: Pause status
    const isPaused = await staking.paused();
    if (isPaused) {
      console.log("⚠️  Contract is PAUSED");
      warnings++;
    } else {
      console.log("✅ Contract operational");
      passed++;
    }

    // Check 4: Total staked reasonable
    const totalStaked = await staking.getTotalStaked();
    if (totalStaked > 4200n) {
      console.log(`❌ Total staked (${totalStaked}) exceeds 4200!`);
      failed++;
    } else {
      console.log(`✅ Total staked: ${totalStaked}`);
      passed++;
    }

    // Check 5: Voting power consistent
    const totalVP = await staking.getTotalVotingPower();
    const maxVP = Number(totalStaked) * 5;
    if (totalVP > maxVP) {
      console.log(`❌ Voting power (${totalVP}) exceeds max (${maxVP})`);
      failed++;
    } else {
      console.log(`✅ Voting power: ${totalVP}`);
      passed++;
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n═══════════════════════════════════════");
    console.log("HEALTH CHECK SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(`✅ Passed:   ${passed}`);
    if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);
    if (failed > 0) console.log(`❌ Failed:   ${failed}`);
    console.log(`Time: ${elapsed}s`);
    console.log("");

    if (failed === 0) {
      console.log("🏥 Overall: HEALTHY ✅\n");
      process.exit(0);
    } else {
      console.log("🏥 Overall: UNHEALTHY ❌\n");
      console.log("⚠️  Investigate failed checks immediately!\n");
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Health check error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
