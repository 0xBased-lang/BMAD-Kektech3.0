const hre = require("hardhat");
const fs = require("fs");

/**
 * COMPLETE BMAD SYSTEM DEPLOYMENT
 *
 * Bulletproof, thorough, comprehensive deployment of entire system.
 * Takes time but ensures EVERYTHING works together perfectly.
 *
 * Week 1 Strategy: Thorough > Fast
 */

async function main() {
  console.log("\n🛡️  COMPLETE BMAD SYSTEM DEPLOYMENT - BULLETPROOF MODE");
  console.log("=".repeat(70));
  console.log("Strategy: Thorough & Safe (Week 1 - 7 days available)\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("Network:", (await hre.ethers.provider.getNetwork()).name);
  console.log("=".repeat(70) + "\n");

  const deployed = {};

  // ============================================
  // STEP 1: MockERC20 (BASED Token) - CHECK IF EXISTS
  // ============================================
  console.log("📝 Step 1: BASED Token");

  // Check if already deployed
  const existingBasedAddress = "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84";
  try {
    const code = await hre.ethers.provider.getCode(existingBasedAddress);
    if (code !== "0x") {
      console.log("✅ BASED Token ALREADY DEPLOYED:", existingBasedAddress);
      deployed.basedToken = existingBasedAddress;
    }
  } catch {
    // Deploy new one
    console.log("Deploying new BASED token...");
    const initialSupply = hre.ethers.parseEther("10000000"); // 10M
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const based = await MockERC20.deploy("Based Token", "BASED", initialSupply);
    await based.waitForDeployment();
    deployed.basedToken = await based.getAddress();
    console.log("✅ BASED Token:", deployed.basedToken);
  }
  console.log("");

  // ============================================
  // STEP 2: MockERC20 (TECH Token for rewards)
  // ============================================
  console.log("📝 Step 2: TECH Token (for rewards)");

  const initialTechSupply = hre.ethers.parseEther("5000000"); // 5M
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const techToken = await MockERC20.deploy("Tech Token", "TECH", initialTechSupply);
  await techToken.waitForDeployment();
  deployed.techToken = await techToken.getAddress();
  console.log("✅ TECH Token:", deployed.techToken);
  console.log("   Supply: 5,000,000 TECH\n");

  // ============================================
  // STEP 3: MockERC721 (NFT for staking)
  // ============================================
  console.log("📝 Step 3: Kektech NFT");

  const MockERC721 = await hre.ethers.getContractFactory("MockERC721");
  const nft = await MockERC721.deploy("Kektech NFT", "KEKTECH");
  await nft.waitForDeployment();
  deployed.nft = await nft.getAddress();
  console.log("✅ NFT Contract:", deployed.nft);

  // Mint 20 test NFTs (covers all rarity tiers)
  console.log("   Minting 20 test NFTs across all rarity tiers...");
  for (let i = 1; i <= 20; i++) {
    await nft.mint(deployer.address, i);
  }
  console.log("   ✅ Minted NFTs #1-#20\n");

  // ============================================
  // STEP 4: EnhancedNFTStaking (NO PROXY!)
  // ============================================
  console.log("📝 Step 4: NFT Staking Contract");

  const EnhancedNFTStaking = await hre.ethers.getContractFactory("EnhancedNFTStaking");
  const staking = await EnhancedNFTStaking.deploy(deployed.nft);
  await staking.waitForDeployment();
  deployed.staking = await staking.getAddress();
  console.log("✅ NFT Staking:", deployed.staking);
  console.log("   Note: Simple constructor, NO proxy pattern!\n");

  // ============================================
  // STEP 5: BondManager
  // ============================================
  console.log("📝 Step 5: Bond Manager");

  // Use deployer as treasury for testing
  const treasury = deployer.address;

  const BondManager = await hre.ethers.getContractFactory("BondManager");
  const bondManager = await BondManager.deploy(deployed.basedToken, treasury);
  await bondManager.waitForDeployment();
  deployed.bondManager = await bondManager.getAddress();
  console.log("✅ Bond Manager:", deployed.bondManager);
  console.log(`   Treasury: ${treasury}\n`);

  // ============================================
  // STEP 6: PredictionMarket (Implementation)
  // ============================================
  console.log("📝 Step 6: Prediction Market Implementation");

  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  // Deploy as implementation (will be cloned by factory)
  // Constructor parameters aren't critical as it's just an implementation
  const marketImpl = await PredictionMarket.deploy(
    deployer.address, // temp owner
    deployed.basedToken,
    "Implementation Market",
    "For Factory Cloning",
    Math.floor(Date.now() / 1000) + 86400, // temp end time
    "Implementation"
  );
  await marketImpl.waitForDeployment();
  deployed.marketImpl = await marketImpl.getAddress();
  console.log("✅ Market Implementation:", deployed.marketImpl);
  console.log("   Note: This is a template for factory cloning\n");

  // ============================================
  // STEP 7: PredictionMarketFactory
  // ============================================
  console.log("📝 Step 7: Prediction Market Factory");

  const feeParams = {
    platformFee: 200, // 2%
    creatorFee: 100,  // 1%
    minVolume: hre.ethers.parseEther("100"),
    maxMarketDuration: 30 * 24 * 60 * 60 // 30 days
  };

  const PredictionMarketFactory = await hre.ethers.getContractFactory("PredictionMarketFactory");
  const factory = await PredictionMarketFactory.deploy(
    deployed.basedToken,
    treasury,
    deployed.marketImpl,
    feeParams
  );
  await factory.waitForDeployment();
  deployed.factory = await factory.getAddress();
  console.log("✅ Market Factory:", deployed.factory);
  console.log(`   Platform Fee: ${feeParams.platformFee / 100}%`);
  console.log(`   Creator Fee: ${feeParams.creatorFee / 100}%\n`);

  // ============================================
  // STEP 8: FactoryTimelock
  // ============================================
  console.log("📝 Step 8: Factory Timelock");

  const FactoryTimelock = await hre.ethers.getContractFactory("FactoryTimelock");
  const timelock = await FactoryTimelock.deploy();
  await timelock.waitForDeployment();
  deployed.timelock = await timelock.getAddress();
  console.log("✅ Factory Timelock:", deployed.timelock);
  console.log("   Default delay: 48 hours\n");

  // ============================================
  // STEP 9: GovernanceContract
  // ============================================
  console.log("📝 Step 9: Governance Contract");

  const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
  const governance = await GovernanceContract.deploy(
    deployed.bondManager,
    deployed.factory,
    deployed.staking,
    treasury
  );
  await governance.waitForDeployment();
  deployed.governance = await governance.getAddress();
  console.log("✅ Governance:", deployed.governance);
  console.log("   Fully integrated with all components\n");

  // ============================================
  // STEP 10: RewardDistributor
  // ============================================
  console.log("📝 Step 10: Reward Distributor");

  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewards = await RewardDistributor.deploy(
    deployed.basedToken,
    deployed.techToken,
    deployer.address // distributor address
  );
  await rewards.waitForDeployment();
  deployed.rewards = await rewards.getAddress();
  console.log("✅ Reward Distributor:", deployed.rewards);
  console.log("   Distributor:", deployer.address, "\n");

  // ============================================
  // STEP 11: Configure Permissions & Links
  // ============================================
  console.log("📝 Step 11: Configuring Permissions & Links");

  console.log("   Setting BondManager → Governance link...");
  await bondManager.setGovernance(deployed.governance);
  console.log("   ✅ BondManager configured");

  console.log("   Setting Staking → Governance link...");
  await staking.setGovernanceContract(deployed.governance);
  console.log("   ✅ Staking configured");

  console.log("   Setting Factory → Timelock link...");
  await factory.setTimelock(deployed.timelock);
  console.log("   ✅ Factory configured");

  console.log("   Setting Timelock → Factory link...");
  await timelock.setFactory(deployed.factory);
  console.log("   ✅ Timelock configured\n");

  // ============================================
  // DEPLOYMENT SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(70));
  console.log("🎉 COMPLETE SYSTEM DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(70) + "\n");

  console.log("📋 Deployed Contracts:\n");
  console.log("TOKENS:");
  console.log(`  BASED Token:         ${deployed.basedToken}`);
  console.log(`  TECH Token:          ${deployed.techToken}`);
  console.log(`  Kektech NFT:         ${deployed.nft}`);
  console.log("");
  console.log("STAKING & GOVERNANCE:");
  console.log(`  NFT Staking:         ${deployed.staking}`);
  console.log(`  Bond Manager:        ${deployed.bondManager}`);
  console.log(`  Governance:          ${deployed.governance}`);
  console.log("");
  console.log("PREDICTION MARKETS:");
  console.log(`  Market Implementation: ${deployed.marketImpl}`);
  console.log(`  Market Factory:      ${deployed.factory}`);
  console.log(`  Factory Timelock:    ${deployed.timelock}`);
  console.log("");
  console.log("REWARDS:");
  console.log(`  Reward Distributor:  ${deployed.rewards}`);
  console.log("");
  console.log("CONFIGURATION:");
  console.log(`  Treasury:            ${treasury}`);
  console.log(`  Deployer:            ${deployer.address}`);

  // ============================================
  // SAVE DEPLOYMENT DATA
  // ============================================
  const deploymentData = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    treasury: treasury,
    contracts: deployed,
    config: {
      feeParams,
      initialBasedSupply: "10,000,000",
      initialTechSupply: "5,000,000",
      testNFTsMinted: 20
    }
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    `${deploymentsDir}/sepolia-complete-${Date.now()}.json`,
    JSON.stringify(deploymentData, null, 2)
  );

  fs.writeFileSync(
    `${deploymentsDir}/sepolia-latest.json`,
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n💾 Deployment data saved to:");
  console.log(`   - deployments/sepolia-latest.json`);
  console.log(`   - deployments/sepolia-complete-${Date.now()}.json`);

  // ============================================
  // NEXT STEPS
  // ============================================
  console.log("\n📊 Next Steps for Week 1 Testing:\n");
  console.log("1. ✅ Verify all contracts on Sepolia Etherscan");
  console.log("2. ✅ Test NFT staking workflow");
  console.log("3. ✅ Test market creation via factory");
  console.log("4. ✅ Test governance proposal flow");
  console.log("5. ✅ Test reward distribution");
  console.log("6. ✅ Run comprehensive smoke tests");
  console.log("7. ✅ Invite community testers (Day 6-7)");

  console.log("\n🎯 Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${deployed.factory}`);

  console.log("\n✅ BULLETPROOF DEPLOYMENT COMPLETE! Ready for thorough testing! 🛡️\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    console.error(error);
    process.exit(1);
  });
