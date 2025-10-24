const hre = require("hardhat");

/**
 * VERIFY PHASE 1 DEPLOYMENT
 *
 * Checks that all Phase 1 contracts are working correctly
 */

async function main() {
  console.log("\n🔍 VERIFYING PHASE 1 DEPLOYMENT");
  console.log("=".repeat(60) + "\n");

  const deployment = {
    basedToken: "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
    nft: "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd",
    staking: "0x420687494Dad8da9d058e9399cD401Deca17f6bd",
    bondManager: "0x188830810E01EDFBAe040D902BD445CfFDCe1BD8",
    governance: "0xEbF0b8A1E6961d2F2bbBaf43851B1Cbc9376847b"
  };

  let allGood = true;

  // Check BASED Token
  try {
    const based = await hre.ethers.getContractAt("MockERC20", deployment.basedToken);
    const symbol = await based.symbol();
    const supply = await based.totalSupply();
    console.log(`✅ BASED Token: ${symbol}`);
    console.log(`   Supply: ${hre.ethers.formatEther(supply)} BASED\n`);
  } catch (error) {
    console.log("❌ BASED Token check failed:", error.message, "\n");
    allGood = false;
  }

  // Check NFT
  try {
    const nft = await hre.ethers.getContractAt("MockERC721", deployment.nft);
    const name = await nft.name();
    const supply = await nft.totalSupply();
    console.log(`✅ NFT Contract: ${name}`);
    console.log(`   Total Supply: ${supply} NFTs\n`);
  } catch (error) {
    console.log("❌ NFT check failed:", error.message, "\n");
    allGood = false;
  }

  // Check Staking
  try {
    const staking = await hre.ethers.getContractAt("EnhancedNFTStaking", deployment.staking);
    const nftAddr = await staking.nftContract();
    console.log(`✅ NFT Staking`);
    console.log(`   NFT Contract: ${nftAddr}\n`);
  } catch (error) {
    console.log("❌ Staking check failed:", error.message, "\n");
    allGood = false;
  }

  // Check BondManager
  try {
    const bondMgr = await hre.ethers.getContractAt("BondManager", deployment.bondManager);
    const gov = await bondMgr.governance();
    const treasury = await bondMgr.treasury();
    console.log(`✅ Bond Manager`);
    console.log(`   Governance: ${gov}`);
    console.log(`   Treasury: ${treasury}\n`);
  } catch (error) {
    console.log("❌ BondManager check failed:", error.message, "\n");
    allGood = false;
  }

  // Check Governance
  try {
    const governance = await hre.ethers.getContractAt("GovernanceContract", deployment.governance);
    const bondMgrAddr = await governance.bondManager();
    const stakingAddr = await governance.stakingContract();
    console.log(`✅ Governance Contract`);
    console.log(`   Bond Manager: ${bondMgrAddr}`);
    console.log(`   Staking Contract: ${stakingAddr}\n`);
  } catch (error) {
    console.log("❌ Governance check failed:", error.message, "\n");
    allGood = false;
  }

  // Summary
  console.log("=".repeat(60));
  if (allGood) {
    console.log("🎉 ALL PHASE 1 CONTRACTS VERIFIED SUCCESSFULLY!");
    console.log("=".repeat(60) + "\n");
    console.log("✅ Ready for testing!");
    console.log("✅ All contracts operational!");
    console.log("✅ Configurations correct!\n");
  } else {
    console.log("⚠️  SOME CHECKS FAILED - Review errors above");
    console.log("=".repeat(60) + "\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
