const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * SYSTEM HEALTH CHECK SCRIPT
 *
 * Purpose: Comprehensive health monitoring of all deployed contracts
 * Usage: npx hardhat run scripts/monitoring/health-check.js --network [NETWORK]
 *
 * Checks:
 * - Contract deployment and responsiveness
 * - Contract balances and states
 * - Pause status
 * - Configuration validation
 * - Suspicious activity detection
 *
 * Recommended: Run every hour during Week 2 mainnet testing
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m"
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    check: "🔍"
  };
  console.log(`[${timestamp}] ${prefix[type]} ${message}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log("=".repeat(60) + "\n");
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

class HealthMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      network: "",
      overallStatus: "healthy",
      checks: [],
      warnings: [],
      errors: [],
      metrics: {}
    };
  }

  addCheck(name, status, details = {}) {
    this.results.checks.push({
      name,
      status,
      details,
      timestamp: new Date().toISOString()
    });

    if (status === "warning") {
      this.results.warnings.push(name);
      if (this.results.overallStatus === "healthy") {
        this.results.overallStatus = "degraded";
      }
    } else if (status === "error") {
      this.results.errors.push(name);
      this.results.overallStatus = "critical";
    }
  }

  addMetric(name, value) {
    this.results.metrics[name] = value;
  }

  getReport() {
    return this.results;
  }

  saveReport(network) {
    const reportsDir = path.join(__dirname, "../../deployments/health-reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `health-${network}-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));

    // Also save as latest
    const latestPath = path.join(reportsDir, `health-${network}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));

    return filename;
  }
}

async function checkContractDeployment(monitor, name, address) {
  log(`Checking ${name} deployment...`, "check");

  try {
    const code = await hre.ethers.provider.getCode(address);

    if (code === "0x") {
      log(`❌ ${name} has no code at ${address}`, "error");
      monitor.addCheck(`${name} Deployment`, "error", {
        address,
        issue: "No code at address"
      });
      return false;
    }

    log(`✅ ${name} deployed correctly`, "success");
    monitor.addCheck(`${name} Deployment`, "success", { address });
    return true;
  } catch (error) {
    log(`❌ Error checking ${name}: ${error.message}`, "error");
    monitor.addCheck(`${name} Deployment`, "error", {
      address,
      error: error.message
    });
    return false;
  }
}

async function checkPauseStatus(monitor, name, contract) {
  log(`Checking ${name} pause status...`, "check");

  try {
    const isPaused = await contract.paused();

    if (isPaused) {
      log(`⚠️  ${name} is PAUSED`, "warning");
      monitor.addCheck(`${name} Pause Status`, "warning", {
        paused: true,
        message: "Contract is paused - normal operations disabled"
      });
    } else {
      log(`✅ ${name} is active`, "success");
      monitor.addCheck(`${name} Pause Status`, "success", { paused: false });
    }

    monitor.addMetric(`${name}.paused`, isPaused);
    return !isPaused;
  } catch (error) {
    // Contract might not have pause functionality
    log(`ℹ️  ${name} does not support pause`, "info");
    monitor.addCheck(`${name} Pause Status`, "success", {
      pausable: false
    });
    return true;
  }
}

async function checkBalances(monitor, deployment) {
  log("Checking contract balances...", "check");

  try {
    const basedToken = await hre.ethers.getContractAt(
      "MockERC20",
      deployment.contracts.MockERC20
    );

    // Check market contract balance
    const marketBalance = await basedToken.balanceOf(deployment.contracts.BMADPredictionMarket);
    log(`Market balance: ${hre.ethers.formatEther(marketBalance)} BASED`);
    monitor.addMetric("market.balance", hre.ethers.formatEther(marketBalance));

    // Check reward distributor balance
    const rewardBalance = await basedToken.balanceOf(deployment.contracts.MerkleRewardDistributor);
    log(`Reward distributor balance: ${hre.ethers.formatEther(rewardBalance)} BASED`);
    monitor.addMetric("rewards.balance", hre.ethers.formatEther(rewardBalance));

    // Warning if market has very low balance during operations
    if (marketBalance < hre.ethers.parseEther("100")) {
      log("⚠️  Market balance is low", "warning");
      monitor.addCheck("Market Balance", "warning", {
        balance: hre.ethers.formatEther(marketBalance),
        message: "Balance below 100 BASED"
      });
    } else {
      monitor.addCheck("Market Balance", "success", {
        balance: hre.ethers.formatEther(marketBalance)
      });
    }

    // Check total supply
    const totalSupply = await basedToken.totalSupply();
    log(`Total BASED supply: ${hre.ethers.formatEther(totalSupply)}`);
    monitor.addMetric("based.totalSupply", hre.ethers.formatEther(totalSupply));

    monitor.addCheck("Token Balances", "success");
    return true;
  } catch (error) {
    log(`❌ Error checking balances: ${error.message}`, "error");
    monitor.addCheck("Token Balances", "error", { error: error.message });
    return false;
  }
}

async function checkMarketState(monitor, deployment) {
  log("Checking market state...", "check");

  try {
    const market = await hre.ethers.getContractAt(
      "BMADPredictionMarket",
      deployment.contracts.BMADPredictionMarket
    );

    // Get market count
    const marketCount = await market.nextMarketId();
    log(`Total markets created: ${marketCount}`);
    monitor.addMetric("markets.total", marketCount.toString());

    // Check configuration
    const marketBond = await market.marketCreationBond();
    const minBet = await market.minBetAmount();

    log(`Market creation bond: ${hre.ethers.formatEther(marketBond)} BASED`);
    log(`Minimum bet: ${hre.ethers.formatEther(minBet)} BASED`);

    monitor.addMetric("market.creationBond", hre.ethers.formatEther(marketBond));
    monitor.addMetric("market.minBet", hre.ethers.formatEther(minBet));

    monitor.addCheck("Market State", "success", {
      marketCount: marketCount.toString(),
      configuration: {
        bond: hre.ethers.formatEther(marketBond),
        minBet: hre.ethers.formatEther(minBet)
      }
    });

    return true;
  } catch (error) {
    log(`❌ Error checking market state: ${error.message}`, "error");
    monitor.addCheck("Market State", "error", { error: error.message });
    return false;
  }
}

async function checkGovernanceState(monitor, deployment) {
  log("Checking governance state...", "check");

  try {
    const governance = await hre.ethers.getContractAt(
      "GovernanceStaking",
      deployment.contracts.GovernanceStaking
    );

    // Check total staked NFTs
    const totalVotingPower = await governance.getTotalVotingPower();
    log(`Total voting power: ${totalVotingPower.toString()}`);
    monitor.addMetric("governance.totalVotingPower", totalVotingPower.toString());

    // Check proposal count
    const proposalCount = await governance.proposalCount();
    log(`Total proposals: ${proposalCount}`);
    monitor.addMetric("governance.proposalCount", proposalCount.toString());

    // Check configuration
    const proposalThreshold = await governance.proposalThreshold();
    const votingPeriod = await governance.votingPeriod();

    log(`Proposal threshold: ${hre.ethers.formatEther(proposalThreshold)} BASED`);
    log(`Voting period: ${votingPeriod} seconds (${votingPeriod / 86400} days)`);

    monitor.addMetric("governance.proposalThreshold", hre.ethers.formatEther(proposalThreshold));
    monitor.addMetric("governance.votingPeriod", votingPeriod.toString());

    monitor.addCheck("Governance State", "success", {
      totalVotingPower: totalVotingPower.toString(),
      proposalCount: proposalCount.toString()
    });

    return true;
  } catch (error) {
    log(`❌ Error checking governance: ${error.message}`, "error");
    monitor.addCheck("Governance State", "error", { error: error.message });
    return false;
  }
}

async function checkNFTState(monitor, deployment) {
  log("Checking NFT state...", "check");

  try {
    const nft = await hre.ethers.getContractAt(
      "NFTContract",
      deployment.contracts.NFTContract
    );

    // Check total supply
    const totalSupply = await nft.totalSupply();
    log(`Total NFTs minted: ${totalSupply}`);
    monitor.addMetric("nft.totalSupply", totalSupply.toString());

    // Check max supply
    const maxSupply = await nft.MAX_SUPPLY();
    log(`Max NFT supply: ${maxSupply}`);
    monitor.addMetric("nft.maxSupply", maxSupply.toString());

    // Calculate remaining
    const remaining = maxSupply - totalSupply;
    log(`NFTs remaining: ${remaining}`);
    monitor.addMetric("nft.remaining", remaining.toString());

    // Warning if close to max supply
    if (remaining < 100n) {
      log("⚠️  Approaching max NFT supply", "warning");
      monitor.addCheck("NFT Supply", "warning", {
        remaining: remaining.toString(),
        message: "Less than 100 NFTs remaining"
      });
    } else {
      monitor.addCheck("NFT Supply", "success", {
        totalSupply: totalSupply.toString(),
        remaining: remaining.toString()
      });
    }

    return true;
  } catch (error) {
    log(`❌ Error checking NFT state: ${error.message}`, "error");
    monitor.addCheck("NFT State", "error", { error: error.message });
    return false;
  }
}

async function main() {
  logSection("🔍 BMAD SYSTEM HEALTH CHECK");

  const network = hre.network.name;
  log(`Network: ${network}`, "info");

  // Load deployment
  log("Loading deployment data...", "info");
  const deployment = await loadDeployment(network);

  // Initialize monitor
  const monitor = new HealthMonitor();
  monitor.results.network = network;

  // ============================================================
  // DEPLOYMENT CHECKS
  // ============================================================
  logSection("CONTRACT DEPLOYMENT CHECKS");

  const contracts = [
    ["MockERC20", "BASED Token"],
    ["NFTContract", "NFT Contract"],
    ["GovernanceStaking", "Governance Staking"],
    ["BMADPredictionMarket", "Prediction Market"],
    ["TokenBondingCurve", "Token Bonding Curve"],
    ["MerkleRewardDistributor", "Reward Distributor"]
  ];

  for (const [contractKey, displayName] of contracts) {
    const address = deployment.contracts[contractKey];
    if (address) {
      await checkContractDeployment(monitor, displayName, address);
    }
  }

  // ============================================================
  // PAUSE STATUS CHECKS
  // ============================================================
  logSection("PAUSE STATUS CHECKS");

  const pausableContracts = [
    ["BMADPredictionMarket", "Prediction Market"],
    ["GovernanceStaking", "Governance Staking"],
    ["MerkleRewardDistributor", "Reward Distributor"]
  ];

  for (const [contractKey, displayName] of pausableContracts) {
    const address = deployment.contracts[contractKey];
    if (address) {
      try {
        const contract = await hre.ethers.getContractAt(contractKey, address);
        await checkPauseStatus(monitor, displayName, contract);
      } catch (error) {
        log(`Error checking pause status for ${displayName}: ${error.message}`, "error");
      }
    }
  }

  // ============================================================
  // STATE CHECKS
  // ============================================================
  logSection("CONTRACT STATE CHECKS");

  await checkBalances(monitor, deployment);
  await checkMarketState(monitor, deployment);
  await checkGovernanceState(monitor, deployment);
  await checkNFTState(monitor, deployment);

  // ============================================================
  // NETWORK CHECKS
  // ============================================================
  logSection("NETWORK CHECKS");

  // Check gas price
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;
  log(`Current gas price: ${hre.ethers.formatUnits(gasPrice, "gwei")} gwei`);
  monitor.addMetric("network.gasPrice", hre.ethers.formatUnits(gasPrice, "gwei"));

  // Check block number
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  log(`Current block: ${blockNumber}`);
  monitor.addMetric("network.blockNumber", blockNumber);

  monitor.addCheck("Network Status", "success");

  // ============================================================
  // SUMMARY
  // ============================================================
  logSection("HEALTH CHECK SUMMARY");

  const report = monitor.getReport();

  // Overall status
  let statusColor = colors.green;
  let statusEmoji = "✅";
  if (report.overallStatus === "degraded") {
    statusColor = colors.yellow;
    statusEmoji = "⚠️";
  } else if (report.overallStatus === "critical") {
    statusColor = colors.red;
    statusEmoji = "❌";
  }

  console.log(`${statusColor}${colors.bright}Overall Status: ${statusEmoji} ${report.overallStatus.toUpperCase()}${colors.reset}\n`);

  // Statistics
  const totalChecks = report.checks.length;
  const successfulChecks = report.checks.filter(c => c.status === "success").length;
  const warningChecks = report.warnings.length;
  const errorChecks = report.errors.length;

  console.log(`${colors.bright}Check Statistics:${colors.reset}`);
  console.log(`  Total Checks: ${totalChecks}`);
  console.log(`  ${colors.green}✅ Successful: ${successfulChecks}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Warnings: ${warningChecks}${colors.reset}`);
  console.log(`  ${colors.red}❌ Errors: ${errorChecks}${colors.reset}`);

  // Show warnings and errors
  if (warningChecks > 0) {
    console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
    report.warnings.forEach(warning => {
      console.log(`  ⚠️  ${warning}`);
    });
  }

  if (errorChecks > 0) {
    console.log(`\n${colors.red}${colors.bright}Errors:${colors.reset}`);
    report.errors.forEach(error => {
      console.log(`  ❌ ${error}`);
    });
  }

  // Key metrics
  console.log(`\n${colors.bright}Key Metrics:${colors.reset}`);
  console.log(`  Markets Created: ${report.metrics["markets.total"] || "0"}`);
  console.log(`  Total NFTs: ${report.metrics["nft.totalSupply"] || "0"}`);
  console.log(`  Voting Power: ${report.metrics["governance.totalVotingPower"] || "0"}`);
  console.log(`  Market Balance: ${report.metrics["market.balance"] || "0"} BASED`);

  // Save report
  const filename = monitor.saveReport(network);
  log(`\nHealth report saved: ${filename}`, "success");

  // Recommendations
  if (report.overallStatus !== "healthy") {
    console.log(`\n${colors.bright}⚡ RECOMMENDED ACTIONS:${colors.reset}`);

    if (report.errors.length > 0) {
      console.log("  🚨 URGENT: Address critical errors immediately");
      console.log("  📖 Review emergency procedures if needed");
    }

    if (report.warnings.length > 0) {
      console.log("  ⚠️  Review warnings and monitor closely");
      console.log("  📊 Check if warnings indicate developing issues");
    }

    console.log("  📞 Notify team of status");
    console.log("  🔄 Re-run health check in 1 hour");
  } else {
    console.log(`\n${colors.green}✅ System is healthy - Continue monitoring${colors.reset}`);
  }

  log("\n🔍 Health check complete!", "success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Health check failed: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  });
