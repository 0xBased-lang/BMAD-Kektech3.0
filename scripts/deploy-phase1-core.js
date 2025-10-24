const hre = require("hardhat");
const fs = require("fs");

/**
 * PHASE 1: CORE SYSTEM DEPLOYMENT
 *
 * Deploys core contracts for Week 1 Sepolia testing:
 * - BASED Token (check if exists, or deploy new)
 * - Kektech NFT
 * - NFT Staking (no proxy!)
 * - Bond Manager
 * - Governance Contract
 *
 * Bulletproof, thorough, safe!
 */

async function main() {
  console.log("\n🚀 PHASE 1: CORE SYSTEM DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("Network: Sepolia Testnet");
  console.log("Strategy: Bulletproof & Thorough\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("=".repeat(60) + "\n");

  const deployed = {};

  // ============================================
  // STEP 1: BASED Token
  // ============================================
  console.log("📝 Step 1/5: BASED Token");

  const existingBased = "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84";
  try {
    const code = await hre.ethers.provider.getCode(existingBased);
    if (code !== "0x") {
      console.log("✅ BASED Token (existing):", existingBased);
      deployed.basedToken = existingBased;
    }
  } catch {
    console.log("Deploying new BASED token...");
    const initialSupply = hre.ethers.parseEther("10000000");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const based = await MockERC20.deploy("Based Token", "BASED", initialSupply);
    await based.waitForDeployment();
    deployed.basedToken = await based.getAddress();
    console.log("✅ BASED Token (new):", deployed.basedToken);
  }
  console.log("");

  // ============================================
  // STEP 2: Kektech NFT
  // ============================================
  console.log("📝 Step 2/5: Kektech NFT");

  const MockERC721 = await hre.ethers.getContractFactory("MockERC721");
  const nft = await MockERC721.deploy("Kektech NFT", "KEKTECH");
  await nft.waitForDeployment();
  deployed.nft = await nft.getAddress();
  console.log("✅ NFT Contract:", deployed.nft);

  // Mint 20 test NFTs
  console.log("   Minting 20 test NFTs...");
  for (let i = 1; i <= 20; i++) {
    await nft.mint(deployer.address, i);
  }
  console.log("   ✅ Minted NFTs #1-#20\n");

  // ============================================
  // STEP 3: NFT Staking (NO PROXY!)
  // ============================================
  console.log("📝 Step 3/5: NFT Staking Contract");

  const EnhancedNFTStaking = await hre.ethers.getContractFactory("EnhancedNFTStaking");
  const staking = await EnhancedNFTStaking.deploy(deployed.nft);
  await staking.waitForDeployment();
  deployed.staking = await staking.getAddress();
  console.log("✅ NFT Staking:", deployed.staking);
  console.log("   Note: Simple constructor, NO proxy!\n");

  // ============================================
  // STEP 4: Bond Manager
  // ============================================
  console.log("📝 Step 4/5: Bond Manager");

  const treasury = deployer.address; // Use deployer as treasury for testing

  const BondManager = await hre.ethers.getContractFactory("BondManager");
  const bondManager = await BondManager.deploy(deployed.basedToken, treasury);
  await bondManager.waitForDeployment();
  deployed.bondManager = await bondManager.getAddress();
  console.log("✅ Bond Manager:", deployed.bondManager);
  console.log(`   Treasury: ${treasury}\n`);

  // ============================================
  // STEP 5: Governance Contract
  // ============================================
  console.log("📝 Step 5/5: Governance Contract");

  // For Phase 1, use address(0) for factory (will add in Phase 2)
  const tempFactory = "0x0000000000000000000000000000000000000001"; // Temp placeholder

  const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
  const governance = await GovernanceContract.deploy(
    deployed.bondManager,
    tempFactory, // Will update in Phase 2
    deployed.staking,
    treasury
  );
  await governance.waitForDeployment();
  deployed.governance = await governance.getAddress();
  console.log("✅ Governance:", deployed.governance);
  console.log("   Note: Factory placeholder (will update in Phase 2)\n");

  // ============================================
  // CONFIGURE PERMISSIONS
  // ============================================
  console.log("📝 Configuring Permissions...");

  console.log("   Setting BondManager → Governance...");
  await bondManager.setGovernance(deployed.governance);
  console.log("   ✅ Done");

  console.log("   Setting Staking → Governance...");
  await staking.setGovernanceContract(deployed.governance);
  console.log("   ✅ Done\n");

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 PHASE 1 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60) + "\n");

  console.log("📋 Deployed Contracts:\n");
  console.log(`  BASED Token:    ${deployed.basedToken}`);
  console.log(`  Kektech NFT:    ${deployed.nft}`);
  console.log(`  NFT Staking:    ${deployed.staking}`);
  console.log(`  Bond Manager:   ${deployed.bondManager}`);
  console.log(`  Governance:     ${deployed.governance}`);
  console.log("");
  console.log(`  Treasury:       ${treasury}`);
  console.log(`  Deployer:       ${deployer.address}`);

  // ============================================
  // SAVE DATA
  // ============================================
  const deploymentData = {
    phase: 1,
    network: "sepolia",
    chainId: "11155111",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    treasury: treasury,
    contracts: deployed,
    notes: "Phase 1 - Core System. Phase 2 (Markets) to be added later."
  };

  const dir = "./deployments";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    `${dir}/sepolia-phase1.json`,
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n💾 Deployment saved: deployments/sepolia-phase1.json");

  // ============================================
  // NEXT STEPS
  // ============================================
  console.log("\n📊 Ready for Testing:\n");
  console.log("✅ 1. Stake NFTs in staking contract");
  console.log("✅ 2. Test governance proposals");
  console.log("✅ 3. Test bond mechanism");
  console.log("✅ 4. Verify contracts on Etherscan");
  console.log("✅ 5. Add Phase 2 (Markets) when ready");

  console.log("\n🔗 Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${deployed.governance}`);

  console.log("\n🚀 PHASE 1 COMPLETE! Ready for testing! 🎯\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    console.error(error);
    process.exit(1);
  });
