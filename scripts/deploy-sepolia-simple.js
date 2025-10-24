const hre = require("hardhat");

/**
 * SIMPLIFIED SEPOLIA DEPLOYMENT
 *
 * Deploys core contracts for Week 1 testing:
 * 1. MockERC20 (BASED token)
 * 2. MockERC721 (NFT for staking)
 * 3. EnhancedNFTStaking (NO proxy pattern!)
 * 4. GovernanceContract
 * 5. BondManager
 *
 * Simple, clean, no proxy complexity!
 */

async function main() {
  console.log("\n🚀 SIMPLIFIED SEPOLIA DEPLOYMENT");
  console.log("================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployed = {};

  // ============================================
  // 1. MockERC20 (BASED Token)
  // ============================================
  console.log("📝 Step 1: Deploying MockERC20 (BASED Token)...");

  const initialSupply = hre.ethers.parseEther("1000000"); // 1M tokens
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const basedToken = await MockERC20.deploy("Based Token", "BASED", initialSupply);
  await basedToken.waitForDeployment();

  deployed.basedToken = await basedToken.getAddress();
  console.log("✅ BASED Token:", deployed.basedToken);
  console.log("   Initial supply: 1,000,000 BASED\n");

  // ============================================
  // 2. MockERC721 (NFT)
  // ============================================
  console.log("📝 Step 2: Deploying MockERC721 (NFT)...");

  const MockERC721 = await hre.ethers.getContractFactory("MockERC721");
  const nftContract = await MockERC721.deploy("Kektech NFT", "KEKTECH");
  await nftContract.waitForDeployment();

  deployed.nftContract = await nftContract.getAddress();
  console.log("✅ NFT Contract:", deployed.nftContract);

  // Mint 10 test NFTs
  console.log("   Minting 10 test NFTs...");
  for (let i = 1; i <= 10; i++) {
    await nftContract.mint(deployer.address, i);
  }
  console.log("   ✅ Minted NFTs #1-#10\n");

  // ============================================
  // 3. EnhancedNFTStaking (NO PROXY!)
  // ============================================
  console.log("📝 Step 3: Deploying EnhancedNFTStaking (NO PROXY!)...");

  const EnhancedNFTStaking = await hre.ethers.getContractFactory("EnhancedNFTStaking");
  const staking = await EnhancedNFTStaking.deploy(deployed.nftContract);
  await staking.waitForDeployment();

  deployed.staking = await staking.getAddress();
  console.log("✅ NFT Staking:", deployed.staking);
  console.log("   Note: Simple constructor, no proxy complexity!\n");

  // ============================================
  // 4. BondManager
  // ============================================
  console.log("📝 Step 4: Deploying BondManager...");

  const BondManager = await hre.ethers.getContractFactory("BondManager");
  const bondManager = await BondManager.deploy(deployed.basedToken);
  await bondManager.waitForDeployment();

  deployed.bondManager = await bondManager.getAddress();
  console.log("✅ BondManager:", deployed.bondManager, "\n");

  // ============================================
  // 5. GovernanceContract
  // ============================================
  console.log("📝 Step 5: Deploying GovernanceContract...");

  const bondAmount = hre.ethers.parseEther("100000"); // 100K BASED
  const votingPeriod = 3 * 24 * 60 * 60; // 3 days

  const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
  const governance = await GovernanceContract.deploy(
    deployed.bondManager,
    deployed.staking,
    bondAmount,
    votingPeriod
  );
  await governance.waitForDeployment();

  deployed.governance = await governance.getAddress();
  console.log("✅ Governance:", deployed.governance);
  console.log(`   Bond: ${hre.ethers.formatEther(bondAmount)} BASED`);
  console.log(`   Voting period: ${votingPeriod / 86400} days\n`);

  // ============================================
  // Configure permissions
  // ============================================
  console.log("📝 Step 6: Configuring permissions...");

  await bondManager.setGovernance(deployed.governance);
  console.log("✅ BondManager governance set");

  await staking.setGovernanceContract(deployed.governance);
  console.log("✅ Staking governance set\n");

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60) + "\n");

  console.log("📋 Deployed Contracts:");
  console.log(`  BASED Token:    ${deployed.basedToken}`);
  console.log(`  NFT Contract:   ${deployed.nftContract}`);
  console.log(`  NFT Staking:    ${deployed.staking}`);
  console.log(`  Bond Manager:   ${deployed.bondManager}`);
  console.log(`  Governance:     ${deployed.governance}`);

  console.log("\n📊 Next Steps:");
  console.log("  1. Verify contracts on Sepolia Etherscan");
  console.log("  2. Test staking flow (approve + stake NFT)");
  console.log("  3. Test governance (create proposal)");
  console.log("  4. Celebrate successful deployment! 🎉\n");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentData = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: deployed
  };

  fs.writeFileSync(
    "./deployments/sepolia-latest.json",
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("💾 Deployment data saved to: deployments/sepolia-latest.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
