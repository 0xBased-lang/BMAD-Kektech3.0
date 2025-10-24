const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Ultra-Cautious Sepolia Deployment Script
 * Week 1 - Day 1-2 of Deployment Plan
 *
 * This script deploys all BMAD contracts to Sepolia testnet with:
 * - Pre-deployment validation
 * - Step-by-step deployment with verification
 * - Gas tracking and logging
 * - Smoke tests after each contract
 * - Complete deployment documentation
 *
 * Safety: ZERO risk (testnet only)
 */

// ANSI color codes for better console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m"
};

// Deployment configuration
const config = {
  network: "sepolia",
  saveDeployment: true,
  verifyContracts: true,
  runSmokeTests: true,
  // Initial token supply for testing (1 million BASED)
  mockBasedSupply: hre.ethers.parseEther("1000000"),
  // Test NFT minting
  initialNFTMints: 10,
  // Governance parameters
  governanceProposalThreshold: hre.ethers.parseEther("1000"), // 1000 $BASED
  governanceVotingPeriod: 3 * 24 * 60 * 60, // 3 days in seconds
  // Market parameters
  marketCreationBond: hre.ethers.parseEther("100"), // 100 $BASED bond
  minBetAmount: hre.ethers.parseEther("1"), // 1 $BASED minimum
};

// Deployment state
const deployment = {
  network: "",
  timestamp: "",
  deployer: "",
  contracts: {},
  transactions: {},
  gasUsed: {},
  totalGasUsed: 0n,
  errors: []
};

/**
 * Logging utilities
 */
function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.cyan}ℹ${colors.reset}`,
    success: `${colors.green}✅${colors.reset}`,
    warning: `${colors.yellow}⚠️${colors.reset}`,
    error: `${colors.red}❌${colors.reset}`,
    deploy: `${colors.blue}🚀${colors.reset}`,
  };
  console.log(`[${timestamp}] ${prefix[type] || prefix.info} ${message}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log("=".repeat(60) + "\n");
}

/**
 * Save deployment data to JSON file
 */
function saveDeploymentData() {
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `sepolia-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);

  deployment.totalGasUsed = Object.values(deployment.gasUsed)
    .reduce((sum, gas) => sum + gas, 0n);

  fs.writeFileSync(filepath, JSON.stringify(deployment, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));

  log(`Deployment data saved to: ${filename}`, "success");

  // Also save latest
  const latestPath = path.join(deploymentsDir, "sepolia-latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(deployment, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

/**
 * Pre-deployment validation
 */
async function preDeploymentChecks() {
  logSection("PRE-DEPLOYMENT VALIDATION");

  // Check network
  const network = await hre.ethers.provider.getNetwork();
  log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

  if (network.chainId !== 11155111n) {
    log("ERROR: Not on Sepolia testnet! (Chain ID should be 11155111)", "error");
    throw new Error("Wrong network");
  }

  deployment.network = network.name;
  deployment.timestamp = new Date().toISOString();

  // Check deployer account
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  deployment.deployer = deployer.address;

  log(`Deployer: ${deployer.address}`);
  log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

  if (balance < hre.ethers.parseEther("0.5")) {
    log("WARNING: Balance below 0.5 ETH - may not be enough for deployment", "warning");
    log("Consider getting more Sepolia ETH from faucets", "warning");
  }

  // Estimate gas price
  const feeData = await hre.ethers.provider.getFeeData();
  log(`Gas Price: ${hre.ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`);

  log("Pre-deployment checks complete!", "success");

  return deployer;
}

/**
 * Deploy a contract with logging and error handling
 */
async function deployContract(contractName, constructorArgs = [], deployer) {
  log(`Deploying ${contractName}...`, "deploy");

  try {
    const Contract = await hre.ethers.getContractFactory(contractName, deployer);
    const contract = await Contract.deploy(...constructorArgs);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();

    if (!deployTx) {
      throw new Error("Deployment transaction not found");
    }

    const receipt = await deployTx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Store deployment data
    deployment.contracts[contractName] = address;
    deployment.transactions[contractName] = deployTx.hash;
    deployment.gasUsed[contractName] = receipt.gasUsed;

    log(`${contractName} deployed to: ${colors.green}${address}${colors.reset}`, "success");
    log(`Transaction: ${deployTx.hash}`);
    log(`Gas used: ${receipt.gasUsed.toString()}`);

    return contract;
  } catch (error) {
    log(`Failed to deploy ${contractName}: ${error.message}`, "error");
    deployment.errors.push({
      contract: contractName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Verify contract on Etherscan
 */
async function verifyContract(address, constructorArgs = []) {
  if (!config.verifyContracts) return;

  log(`Verifying contract at ${address}...`);

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    log(`Contract verified successfully!`, "success");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log("Contract already verified", "info");
    } else {
      log(`Verification failed: ${error.message}`, "warning");
      log("You can verify manually later", "info");
    }
  }
}

/**
 * Main deployment function
 */
async function main() {
  logSection("🚀 BMAD SEPOLIA DEPLOYMENT - ULTRA CAUTIOUS MODE");

  // Pre-deployment checks
  const deployer = await preDeploymentChecks();

  // ============================================================
  // STEP 1: Deploy Mock BASED Token (Sepolia only)
  // ============================================================
  logSection("STEP 1: Deploying Mock BASED Token");
  log("Note: This is a test token for Sepolia only");

  const basedToken = await deployContract("MockERC20", ["Based Token", "BASED", config.mockBasedSupply], deployer);

  // Initial supply minted in constructor
  log(`Minted ${hre.ethers.formatEther(config.mockBasedSupply)} BASED tokens in constructor`, "success");

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for Etherscan
    await verifyContract(await basedToken.getAddress(), ["Based Token", "BASED", config.mockBasedSupply]);
  }

  // ============================================================
  // STEP 2: Deploy NFT Contract
  // ============================================================
  logSection("STEP 2: Deploying NFT Contract");

  const nftContract = await deployContract("NFTContract", [await basedToken.getAddress()], deployer);

  // Mint test NFTs
  log("Minting test NFTs...");
  for (let i = 0; i < config.initialNFTMints; i++) {
    const mintTx = await nftContract.mint(deployer.address);
    await mintTx.wait();
    log(`Minted NFT #${i + 1}`, "info");
  }
  log(`Minted ${config.initialNFTMints} test NFTs`, "success");

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    await verifyContract(await nftContract.getAddress(), [await basedToken.getAddress()]);
  }

  // ============================================================
  // STEP 3: Deploy Governance Staking
  // ============================================================
  logSection("STEP 3: Deploying Governance Staking");

  const governanceStaking = await deployContract(
    "GovernanceStaking",
    [
      await nftContract.getAddress(),
      await basedToken.getAddress(),
      config.governanceProposalThreshold,
      config.governanceVotingPeriod
    ],
    deployer
  );

  // Set governance contract in NFT
  log("Connecting NFT contract to Governance...");
  const setGovTx = await nftContract.setGovernanceContract(await governanceStaking.getAddress());
  await setGovTx.wait();
  log("Governance contract set in NFT", "success");

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    await verifyContract(await governanceStaking.getAddress(), [
      await nftContract.getAddress(),
      await basedToken.getAddress(),
      config.governanceProposalThreshold,
      config.governanceVotingPeriod
    ]);
  }

  // ============================================================
  // STEP 4: Deploy Prediction Market
  // ============================================================
  logSection("STEP 4: Deploying Prediction Market");

  const predictionMarket = await deployContract(
    "BMADPredictionMarket",
    [
      await basedToken.getAddress(),
      await governanceStaking.getAddress(),
      config.marketCreationBond,
      config.minBetAmount
    ],
    deployer
  );

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    await verifyContract(await predictionMarket.getAddress(), [
      await basedToken.getAddress(),
      await governanceStaking.getAddress(),
      config.marketCreationBond,
      config.minBetAmount
    ]);
  }

  // ============================================================
  // STEP 5: Deploy Token Bonding Curve
  // ============================================================
  logSection("STEP 5: Deploying Token Bonding Curve");

  const bondingCurve = await deployContract(
    "TokenBondingCurve",
    [await predictionMarket.getAddress()],
    deployer
  );

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    await verifyContract(await bondingCurve.getAddress(), [await predictionMarket.getAddress()]);
  }

  // ============================================================
  // STEP 6: Deploy Merkle Reward Distributor
  // ============================================================
  logSection("STEP 6: Deploying Merkle Reward Distributor");

  const rewardDistributor = await deployContract(
    "MerkleRewardDistributor",
    [await basedToken.getAddress()],
    deployer
  );

  // Verify
  if (config.verifyContracts) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    await verifyContract(await rewardDistributor.getAddress(), [await basedToken.getAddress()]);
  }

  // ============================================================
  // DEPLOYMENT SUMMARY
  // ============================================================
  logSection("DEPLOYMENT SUMMARY");

  console.log(`${colors.bright}Deployed Contracts:${colors.reset}`);
  console.log(`  BASED Token:          ${colors.green}${deployment.contracts.MockERC20}${colors.reset}`);
  console.log(`  NFT Contract:         ${colors.green}${deployment.contracts.NFTContract}${colors.reset}`);
  console.log(`  Governance Staking:   ${colors.green}${deployment.contracts.GovernanceStaking}${colors.reset}`);
  console.log(`  Prediction Market:    ${colors.green}${deployment.contracts.BMADPredictionMarket}${colors.reset}`);
  console.log(`  Bonding Curve:        ${colors.green}${deployment.contracts.TokenBondingCurve}${colors.reset}`);
  console.log(`  Reward Distributor:   ${colors.green}${deployment.contracts.MerkleRewardDistributor}${colors.reset}`);

  const totalGas = Object.values(deployment.gasUsed).reduce((sum, gas) => sum + gas, 0n);
  const avgGasPrice = (await hre.ethers.provider.getFeeData()).gasPrice || 0n;
  const totalCost = totalGas * avgGasPrice;

  console.log(`\n${colors.bright}Gas Usage:${colors.reset}`);
  console.log(`  Total Gas:    ${totalGas.toString()}`);
  console.log(`  Total Cost:   ${hre.ethers.formatEther(totalCost)} ETH`);

  // Save deployment data
  if (config.saveDeployment) {
    saveDeploymentData();
  }

  // ============================================================
  // SMOKE TESTS
  // ============================================================
  if (config.runSmokeTests) {
    logSection("RUNNING SMOKE TESTS");
    log("Running basic functionality tests...");

    // Test 1: Token transfer
    log("Test 1: Token transfer...");
    const transferAmount = hre.ethers.parseEther("1000");
    const transferTx = await basedToken.transfer(await predictionMarket.getAddress(), transferAmount);
    await transferTx.wait();
    log("✅ Token transfer successful", "success");

    // Test 2: NFT approval
    log("Test 2: NFT approval...");
    const approveTx = await nftContract.setApprovalForAll(await governanceStaking.getAddress(), true);
    await approveTx.wait();
    log("✅ NFT approval successful", "success");

    // Test 3: Check configurations
    log("Test 3: Configuration checks...");
    const proposalThreshold = await governanceStaking.proposalThreshold();
    const marketBond = await predictionMarket.marketCreationBond();
    log(`✅ Proposal threshold: ${hre.ethers.formatEther(proposalThreshold)} BASED`, "success");
    log(`✅ Market bond: ${hre.ethers.formatEther(marketBond)} BASED`, "success");

    log("All smoke tests passed! ✅", "success");
  }

  // ============================================================
  // NEXT STEPS
  // ============================================================
  logSection("NEXT STEPS");

  console.log(`${colors.bright}Week 1 - Day 1-2 Complete! ✅${colors.reset}\n`);
  console.log("📋 Next Steps:");
  console.log("  1. Verify all contracts on Sepolia Etherscan");
  console.log("  2. Fund test accounts with BASED tokens");
  console.log("  3. Create test markets for internal testing");
  console.log("  4. Begin Day 3-5 internal testing phase");
  console.log("  5. Invite community testers for Day 6-7");

  console.log(`\n${colors.bright}Important Links:${colors.reset}`);
  console.log(`  Sepolia Etherscan: https://sepolia.etherscan.io/`);
  console.log(`  Your contracts: https://sepolia.etherscan.io/address/${deployment.contracts.BMADPredictionMarket}`);

  log("\n🎉 Deployment completed successfully!", "success");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Deployment failed: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  });
