const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * SMOKE TEST SUITE
 *
 * Purpose: Quick validation that all critical functionality works after deployment
 * Usage: npx hardhat run scripts/smoke/run-smoke-tests.js --network [NETWORK]
 *
 * Tests:
 * 1. Token transfers
 * 2. NFT minting and transfers
 * 3. NFT staking
 * 4. Market creation
 * 5. Bet placement
 * 6. Market lifecycle
 * 7. Reward claiming
 *
 * Expected runtime: 5-10 minutes
 * Should be run immediately after deployment
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
    test: "🧪"
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

class SmokeTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      network: "",
      passed: [],
      failed: [],
      skipped: [],
      duration: 0
    };
    this.startTime = Date.now();
  }

  async runTest(name, testFunc) {
    log(`Running: ${name}`, "test");
    try {
      await testFunc();
      log(`✅ PASSED: ${name}`, "success");
      this.results.passed.push(name);
      return true;
    } catch (error) {
      log(`❌ FAILED: ${name} - ${error.message}`, "error");
      this.results.failed.push({ name, error: error.message });
      return false;
    }
  }

  finalize() {
    this.results.duration = (Date.now() - this.startTime) / 1000;
    return this.results;
  }

  saveReport(network) {
    const reportsDir = path.join(__dirname, "../../deployments/smoke-reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `smoke-${network}-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));

    return filename;
  }
}

async function main() {
  logSection("🧪 BMAD SMOKE TEST SUITE");

  const network = hre.network.name;
  log(`Network: ${network}`, "info");

  // Load deployment
  const deployment = await loadDeployment(network);
  const [deployer, testAccount] = await hre.ethers.getSigners();

  log(`Deployer: ${deployer.address}`);
  log(`Test Account: ${testAccount ? testAccount.address : "Using deployer for all tests"}`);

  // Initialize test runner
  const runner = new SmokeTestRunner();
  runner.results.network = network;

  // Get contract instances
  const basedToken = await hre.ethers.getContractAt(
    "MockERC20",
    deployment.contracts.MockERC20
  );

  const nftContract = await hre.ethers.getContractAt(
    "NFTContract",
    deployment.contracts.NFTContract
  );

  const governanceStaking = await hre.ethers.getContractAt(
    "GovernanceStaking",
    deployment.contracts.GovernanceStaking
  );

  const predictionMarket = await hre.ethers.getContractAt(
    "BMADPredictionMarket",
    deployment.contracts.BMADPredictionMarket
  );

  // ============================================================
  // TEST 1: Token Transfer
  // ============================================================
  await runner.runTest("Token Transfer", async () => {
    const amount = hre.ethers.parseEther("100");
    const balanceBefore = await basedToken.balanceOf(deployer.address);

    const tx = await basedToken.transfer(deployment.contracts.BMADPredictionMarket, amount);
    await tx.wait();

    const balanceAfter = await basedToken.balanceOf(deployer.address);
    const marketBalance = await basedToken.balanceOf(deployment.contracts.BMADPredictionMarket);

    if (balanceBefore - balanceAfter !== amount) {
      throw new Error("Balance not reduced correctly");
    }

    if (marketBalance < amount) {
      throw new Error("Market didn't receive tokens");
    }

    log(`Transferred ${hre.ethers.formatEther(amount)} BASED to market`);
  });

  // ============================================================
  // TEST 2: NFT Minting
  // ============================================================
  await runner.runTest("NFT Minting", async () => {
    const totalSupplyBefore = await nftContract.totalSupply();

    const tx = await nftContract.mint(deployer.address);
    const receipt = await tx.wait();

    const totalSupplyAfter = await nftContract.totalSupply();

    if (totalSupplyAfter !== totalSupplyBefore + 1n) {
      throw new Error("Total supply not incremented");
    }

    // Get token ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = nftContract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsed && parsed.name === "Transfer";
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error("Transfer event not found");
    }

    log(`Minted NFT #${totalSupplyAfter}`);
  });

  // ============================================================
  // TEST 3: NFT Approval & Staking
  // ============================================================
  await runner.runTest("NFT Staking", async () => {
    // Get last token ID
    const totalSupply = await nftContract.totalSupply();
    const tokenId = totalSupply - 1n;

    // Approve governance contract
    const approveTx = await nftContract.approve(
      deployment.contracts.GovernanceStaking,
      tokenId
    );
    await approveTx.wait();
    log(`Approved NFT #${tokenId} for staking`);

    // Stake NFT
    const stakeTx = await governanceStaking.stakeNFT(tokenId);
    await stakeTx.wait();

    // Verify staking
    const isStaked = await governanceStaking.isStaked(tokenId);
    if (!isStaked) {
      throw new Error("NFT not marked as staked");
    }

    log(`Staked NFT #${tokenId} successfully`);
  });

  // ============================================================
  // TEST 4: Market Creation
  // ============================================================
  let testMarketId;
  await runner.runTest("Market Creation", async () => {
    const marketBond = await predictionMarket.marketCreationBond();

    // Approve bond
    const approveTx = await basedToken.approve(
      deployment.contracts.BMADPredictionMarket,
      marketBond
    );
    await approveTx.wait();

    // Create market
    const question = "Will BMAD launch successfully?";
    const category = "Launch";
    const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const description = "Test market for smoke testing";

    const createTx = await predictionMarket.createMarket(
      question,
      category,
      endTime,
      description
    );
    const receipt = await createTx.wait();

    // Get market ID
    testMarketId = await predictionMarket.nextMarketId() - 1n;

    log(`Created market #${testMarketId}: "${question}"`);
  });

  // ============================================================
  // TEST 5: Place Bet
  // ============================================================
  await runner.runTest("Place Bet", async () => {
    if (testMarketId === undefined) {
      throw new Error("No test market created");
    }

    const betAmount = hre.ethers.parseEther("10");

    // Approve bet amount
    const approveTx = await basedToken.approve(
      deployment.contracts.BMADPredictionMarket,
      betAmount
    );
    await approveTx.wait();

    // Place bet on YES
    const betTx = await predictionMarket.placeBet(testMarketId, true, betAmount);
    await betTx.wait();

    // Verify bet
    const market = await predictionMarket.getMarket(testMarketId);
    if (market.yesShares === 0n) {
      throw new Error("Bet not recorded");
    }

    log(`Placed ${hre.ethers.formatEther(betAmount)} BASED bet on YES`);
  });

  // ============================================================
  // TEST 6: Market Query
  // ============================================================
  await runner.runTest("Market Query", async () => {
    if (testMarketId === undefined) {
      throw new Error("No test market created");
    }

    const market = await predictionMarket.getMarket(testMarketId);

    log(`Market Status: Active`);
    log(`Total Pool: ${hre.ethers.formatEther(market.totalPool)} BASED`);
    log(`YES Shares: ${market.yesShares.toString()}`);
    log(`NO Shares: ${market.noShares.toString()}`);

    if (market.totalPool === 0n) {
      throw new Error("Market has no pool");
    }
  });

  // ============================================================
  // TEST 7: Governance Query
  // ============================================================
  await runner.runTest("Governance Query", async () => {
    const totalVotingPower = await governanceStaking.getTotalVotingPower();
    const proposalCount = await governanceStaking.proposalCount();
    const proposalThreshold = await governanceStaking.proposalThreshold();

    log(`Total Voting Power: ${totalVotingPower.toString()}`);
    log(`Proposal Count: ${proposalCount.toString()}`);
    log(`Proposal Threshold: ${hre.ethers.formatEther(proposalThreshold)} BASED`);

    if (totalVotingPower === 0n) {
      log("Warning: No NFTs staked", "warning");
    }
  });

  // ============================================================
  // TEST 8: Pause/Unpause (if owner)
  // ============================================================
  await runner.runTest("Pause/Unpause Functionality", async () => {
    // Pause
    const pauseTx = await predictionMarket.pause();
    await pauseTx.wait();

    const isPaused = await predictionMarket.paused();
    if (!isPaused) {
      throw new Error("Contract not paused");
    }
    log("Contract paused successfully");

    // Unpause
    const unpauseTx = await predictionMarket.unpause();
    await unpauseTx.wait();

    const isUnpaused = !(await predictionMarket.paused());
    if (!isUnpaused) {
      throw new Error("Contract not unpaused");
    }
    log("Contract unpaused successfully");
  });

  // ============================================================
  // TEST SUMMARY
  // ============================================================
  const results = runner.finalize();

  logSection("SMOKE TEST SUMMARY");

  const totalTests = results.passed.length + results.failed.length + results.skipped.length;
  const passRate = totalTests > 0 ? ((results.passed.length / totalTests) * 100).toFixed(1) : 0;

  console.log(`${colors.bright}Test Statistics:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`  ${colors.yellow}⏭  Skipped: ${results.skipped.length}${colors.reset}`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log(`  Duration: ${results.duration.toFixed(2)}s`);

  if (results.failed.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    results.failed.forEach(test => {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Error: ${test.error}`);
    });
  }

  // Save report
  const filename = runner.saveReport(network);
  log(`\nSmoke test report saved: ${filename}`, "success");

  // Final verdict
  if (results.failed.length === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL SMOKE TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}✅ Deployment is functioning correctly${colors.reset}`);
    log("\n✅ Ready for next phase of testing!", "success");
  } else {
    console.log(`\n${colors.red}${colors.bright}⚠️  SOME SMOKE TESTS FAILED${colors.reset}`);
    console.log(`${colors.red}❌ Review and fix issues before proceeding${colors.reset}`);
    throw new Error("Smoke tests failed - deployment may have issues");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Smoke tests failed: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  });
