const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * SETUP VERIFICATION SCRIPT
 *
 * Purpose: Verify deployment environment is ready
 * Usage: npx hardhat run scripts/setup/check-setup.js --network sepolia
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
  const prefix = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };
  console.log(`${prefix[type]} ${message}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log("=".repeat(60) + "\n");
}

async function main() {
  logSection("🔍 DEPLOYMENT ENVIRONMENT CHECK");

  let allGood = true;
  const issues = [];

  // ============================================================
  // CHECK 1: .env File Exists
  // ============================================================
  log("Checking .env file...");
  const envPath = path.join(__dirname, "../../.env");

  if (!fs.existsSync(envPath)) {
    log("❌ .env file not found!", "error");
    log("   Run: cp .env.example .env", "error");
    allGood = false;
    issues.push(".env file missing");
  } else {
    log("✅ .env file exists", "success");
  }

  // ============================================================
  // CHECK 2: Network Configuration
  // ============================================================
  log("\nChecking network configuration...");

  try {
    const network = await hre.ethers.provider.getNetwork();
    log(`Network: ${network.name}`, "info");
    log(`Chain ID: ${network.chainId}`, "info");

    if (network.chainId === 11155111n) {
      log("✅ Connected to Sepolia testnet", "success");
    } else {
      log(`⚠️  Not on Sepolia (Chain ID: ${network.chainId})`, "warning");
      log("   Make sure you're using --network sepolia", "warning");
    }
  } catch (error) {
    log("❌ Cannot connect to network", "error");
    log(`   Error: ${error.message}`, "error");
    log("   Check SEPOLIA_RPC in .env file", "error");
    allGood = false;
    issues.push("Network connection failed");
  }

  // ============================================================
  // CHECK 3: Wallet Configuration
  // ============================================================
  log("\nChecking wallet configuration...");

  try {
    const signers = await hre.ethers.getSigners();

    if (signers.length === 0) {
      log("❌ No wallet configured", "error");
      log("   Add PRIVATE_KEY to .env file", "error");
      allGood = false;
      issues.push("No wallet configured");
    } else {
      const deployer = signers[0];
      log(`Deployer Address: ${deployer.address}`, "info");
      log("✅ Wallet configured", "success");

      // Check balance
      try {
        const balance = await hre.ethers.provider.getBalance(deployer.address);
        const balanceEth = hre.ethers.formatEther(balance);

        log(`Balance: ${balanceEth} ETH`, "info");

        if (balance === 0n) {
          log("⚠️  Wallet has zero balance", "warning");
          log("   Get Sepolia ETH from faucets or request from user", "warning");
          issues.push("Zero balance - needs Sepolia ETH");
        } else if (balance < hre.ethers.parseEther("0.3")) {
          log("⚠️  Low balance (< 0.3 ETH)", "warning");
          log("   Deployment needs ~0.15-0.3 ETH", "warning");
          log("   Consider getting more Sepolia ETH", "warning");
        } else {
          log("✅ Sufficient balance for deployment", "success");
        }
      } catch (error) {
        log("⚠️  Could not check balance", "warning");
        log(`   Error: ${error.message}`, "warning");
      }
    }
  } catch (error) {
    log("❌ Wallet check failed", "error");
    log(`   Error: ${error.message}`, "error");
    log("   Verify PRIVATE_KEY in .env (without 0x prefix)", "error");
    allGood = false;
    issues.push("Wallet configuration error");
  }

  // ============================================================
  // CHECK 4: Contracts Compile
  // ============================================================
  log("\nChecking contract compilation...");

  try {
    // Try to get a contract factory to verify compilation
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    log("✅ Contracts compile successfully", "success");
  } catch (error) {
    log("❌ Contract compilation failed", "error");
    log(`   Error: ${error.message}`, "error");
    log("   Run: npx hardhat compile", "error");
    allGood = false;
    issues.push("Compilation failed");
  }

  // ============================================================
  // CHECK 5: Deployment Scripts Exist
  // ============================================================
  log("\nChecking deployment scripts...");

  const requiredScripts = [
    "scripts/deployment/deploy-sepolia.js",
    "scripts/emergency/pause-all.js",
    "scripts/monitoring/health-check.js",
    "scripts/smoke/run-smoke-tests.js"
  ];

  let scriptsOk = true;
  for (const script of requiredScripts) {
    const scriptPath = path.join(__dirname, "../..", script);
    if (fs.existsSync(scriptPath)) {
      log(`✅ ${script.split('/').pop()}`, "success");
    } else {
      log(`❌ ${script} not found`, "error");
      scriptsOk = false;
      allGood = false;
    }
  }

  if (scriptsOk) {
    log("✅ All deployment scripts present", "success");
  } else {
    issues.push("Missing deployment scripts");
  }

  // ============================================================
  // CHECK 6: .gitignore Safety
  // ============================================================
  log("\nChecking .gitignore safety...");

  const gitignorePath = path.join(__dirname, "../../.gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    if (gitignoreContent.includes(".env")) {
      log("✅ .env is in .gitignore", "success");
    } else {
      log("⚠️  .env not in .gitignore!", "warning");
      log("   Add .env to .gitignore to prevent committing secrets", "warning");
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  logSection("SUMMARY");

  if (allGood && issues.length === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL CHECKS PASSED!${colors.reset}\n`);
    console.log(`${colors.green}✅ Environment is ready for deployment${colors.reset}\n`);

    console.log(`${colors.bright}NEXT STEPS:${colors.reset}`);
    console.log("1. Ensure you have sufficient Sepolia ETH (0.3+ ETH recommended)");
    console.log("2. Run deployment:");
    console.log(`   ${colors.cyan}npx hardhat run scripts/deployment/deploy-sepolia.js --network sepolia${colors.reset}`);
    console.log("");
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  ISSUES FOUND${colors.reset}\n`);

    if (issues.length > 0) {
      console.log(`${colors.bright}Issues to fix:${colors.reset}`);
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log("");
    }

    console.log(`${colors.bright}WHAT TO DO:${colors.reset}`);
    console.log("1. Fix the issues listed above");
    console.log("2. Run this check again:");
    console.log(`   ${colors.cyan}npx hardhat run scripts/setup/check-setup.js --network sepolia${colors.reset}`);
    console.log("");
  }

  // ============================================================
  // ADDITIONAL INFO
  // ============================================================
  if (allGood && issues.length === 0) {
    logSection("DEPLOYMENT INFORMATION");

    const signers = await hre.ethers.getSigners();
    if (signers.length > 0) {
      const deployer = signers[0];
      console.log(`${colors.bright}Your Deployment Wallet:${colors.reset}`);
      console.log(`  Address: ${colors.green}${deployer.address}${colors.reset}`);
      console.log("");
      console.log(`${colors.bright}Get Sepolia ETH from:${colors.reset}`);
      console.log("  • https://sepoliafaucet.com/");
      console.log("  • https://www.infura.io/faucet/sepolia");
      console.log("  • https://faucet.quicknode.com/ethereum/sepolia");
      console.log(`  • Or ask user to send to: ${colors.green}${deployer.address}${colors.reset}`);
      console.log("");
      console.log(`${colors.bright}Estimated Deployment Cost:${colors.reset}`);
      console.log("  • Gas: ~15,000,000 units");
      console.log("  • At 10 gwei: ~0.15 ETH");
      console.log("  • At 20 gwei: ~0.30 ETH");
      console.log("  • Recommended: 0.5 ETH for safety margin");
      console.log("");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
