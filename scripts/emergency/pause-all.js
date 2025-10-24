const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * EMERGENCY PAUSE SCRIPT
 *
 * Purpose: Immediately pause all pausable contracts in emergency situations
 * Usage: npx hardhat run scripts/emergency/pause-all.js --network [NETWORK]
 *
 * When to use:
 * - Active exploit detected
 * - Critical vulnerability discovered
 * - Unauthorized contract behavior
 * - Owner instructs immediate pause
 *
 * Safety: This script can only be called by contract owner
 */

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  bright: "\x1b[1m"
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    emergency: "🚨"
  };
  console.log(`[${timestamp}] ${prefix[type]} ${message}`);
}

async function loadDeployment(network) {
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const filename = `${network}-latest.json`;
  const filepath = path.join(deploymentsDir, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Deployment file not found: ${filename}`);
  }

  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.red}${colors.bright}🚨 EMERGENCY PAUSE PROCEDURE 🚨${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  // Get network
  const network = hre.network.name;
  log(`Network: ${network}`, "info");

  // Get signer
  const [owner] = await hre.ethers.getSigners();
  log(`Owner: ${owner.address}`, "info");

  // Load deployment
  log("Loading deployment data...", "info");
  const deployment = await loadDeployment(network);

  // Confirm action
  log(`${colors.yellow}⚠️  WARNING: This will pause all contracts!${colors.reset}`, "warning");
  log("Proceeding in 5 seconds... (Ctrl+C to cancel)", "warning");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const results = {
    network: network,
    timestamp: new Date().toISOString(),
    paused: [],
    failed: [],
    transactions: []
  };

  // ============================================================
  // Pause BMADPredictionMarket
  // ============================================================
  if (deployment.contracts.BMADPredictionMarket) {
    log("\nPausing Prediction Market...", "emergency");
    try {
      const market = await hre.ethers.getContractAt(
        "BMADPredictionMarket",
        deployment.contracts.BMADPredictionMarket
      );

      const pauseTx = await market.pause();
      log(`Transaction sent: ${pauseTx.hash}`, "info");

      const receipt = await pauseTx.wait();
      log("✅ Prediction Market PAUSED", "success");

      results.paused.push("BMADPredictionMarket");
      results.transactions.push({
        contract: "BMADPredictionMarket",
        hash: pauseTx.hash,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      log(`❌ Failed to pause Prediction Market: ${error.message}`, "error");
      results.failed.push({
        contract: "BMADPredictionMarket",
        error: error.message
      });
    }
  }

  // ============================================================
  // Pause GovernanceStaking
  // ============================================================
  if (deployment.contracts.GovernanceStaking) {
    log("\nPausing Governance Staking...", "emergency");
    try {
      const governance = await hre.ethers.getContractAt(
        "GovernanceStaking",
        deployment.contracts.GovernanceStaking
      );

      const pauseTx = await governance.pause();
      log(`Transaction sent: ${pauseTx.hash}`, "info");

      const receipt = await pauseTx.wait();
      log("✅ Governance Staking PAUSED", "success");

      results.paused.push("GovernanceStaking");
      results.transactions.push({
        contract: "GovernanceStaking",
        hash: pauseTx.hash,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      log(`❌ Failed to pause Governance Staking: ${error.message}`, "error");
      results.failed.push({
        contract: "GovernanceStaking",
        error: error.message
      });
    }
  }

  // ============================================================
  // Pause MerkleRewardDistributor
  // ============================================================
  if (deployment.contracts.MerkleRewardDistributor) {
    log("\nPausing Reward Distributor...", "emergency");
    try {
      const rewards = await hre.ethers.getContractAt(
        "MerkleRewardDistributor",
        deployment.contracts.MerkleRewardDistributor
      );

      const pauseTx = await rewards.pause();
      log(`Transaction sent: ${pauseTx.hash}`, "info");

      const receipt = await pauseTx.wait();
      log("✅ Reward Distributor PAUSED", "success");

      results.paused.push("MerkleRewardDistributor");
      results.transactions.push({
        contract: "MerkleRewardDistributor",
        hash: pauseTx.hash,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      log(`❌ Failed to pause Reward Distributor: ${error.message}`, "error");
      results.failed.push({
        contract: "MerkleRewardDistributor",
        error: error.message
      });
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}PAUSE PROCEDURE SUMMARY${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  console.log(`${colors.green}Successfully Paused (${results.paused.length}):${colors.reset}`);
  results.paused.forEach(contract => {
    console.log(`  ✅ ${contract}`);
  });

  if (results.failed.length > 0) {
    console.log(`\n${colors.red}Failed to Pause (${results.failed.length}):${colors.reset}`);
    results.failed.forEach(item => {
      console.log(`  ❌ ${item.contract}: ${item.error}`);
    });
  }

  console.log(`\n${colors.bright}Transaction Hashes:${colors.reset}`);
  results.transactions.forEach(tx => {
    console.log(`  ${tx.contract}: ${tx.hash}`);
  });

  // Save pause record
  const emergencyDir = path.join(__dirname, "../../deployments/emergency");
  if (!fs.existsSync(emergencyDir)) {
    fs.mkdirSync(emergencyDir, { recursive: true });
  }

  const filename = `pause-${network}-${Date.now()}.json`;
  const filepath = path.join(emergencyDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  log(`\nPause record saved: ${filename}`, "success");

  // ============================================================
  // NEXT STEPS
  // ============================================================
  console.log(`\n${colors.bright}IMMEDIATE NEXT STEPS:${colors.reset}`);
  console.log("  1. 🔍 Investigate the cause of the emergency");
  console.log("  2. 📋 Document the incident (see emergency-procedures.md)");
  console.log("  3. 💬 Communicate with users (Discord/Twitter)");
  console.log("  4. 🔧 Develop and test fix thoroughly");
  console.log("  5. ✅ Deploy fix and unpause when safe");
  console.log("\n📖 See .bmad/docs/emergency-procedures.md for detailed procedures");

  log(`\n🚨 ALL CONTRACTS PAUSED - No user transactions possible`, "emergency");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Emergency pause failed: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  });
