/**
 * Deploy SimpleTest Contract to Fork
 * Purpose: Validate deployment workflow before modifying real contracts
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 DEPLOYING SIMPLE TEST CONTRACT\n");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer Information:");
    console.log(`   Address: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`   Network: Chain ID ${network.chainId}`);

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`   Block: ${blockNumber}\n`);

    // Deploy SimpleTest contract
    console.log("📦 Deploying SimpleTest contract...");

    const SimpleTest = await ethers.getContractFactory("SimpleTest");
    console.log("   ✅ Contract factory created");

    const simpleTest = await SimpleTest.deploy();
    console.log("   ⏳ Deployment transaction sent...");

    await simpleTest.waitForDeployment();
    const contractAddress = await simpleTest.getAddress();

    console.log("   ✅ Contract deployed!\n");

    // Get deployment details
    console.log("📊 Deployment Details:");
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Transaction Hash: ${simpleTest.deploymentTransaction().hash}`);
    console.log(`   Block Number: ${simpleTest.deploymentTransaction().blockNumber || 'pending'}`);

    // Verify contract is deployed
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`   Code Size: ${(code.length - 2) / 2} bytes\n`);

    // Test contract functions
    console.log("🔍 Testing Contract Functions:");

    const message = await simpleTest.message();
    console.log(`   ✅ message(): "${message}"`);

    const counter = await simpleTest.counter();
    console.log(`   ✅ counter(): ${counter}`);

    const deployerAddr = await simpleTest.deployer();
    console.log(`   ✅ deployer(): ${deployerAddr}`);

    const [msg, cnt, dep] = await simpleTest.getState();
    console.log(`   ✅ getState(): ["${msg}", ${cnt}, "${dep}"]\n`);

    // Success summary
    console.log("═══════════════════════════════════════════════════");
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("✅ Contract deployed successfully");
    console.log("✅ All functions responding correctly");
    console.log("✅ Fork deployment workflow validated!");
    console.log("✅ Ready for real contract deployments!\n");

    // Save deployment info
    const deploymentInfo = {
      contractName: "SimpleTest",
      address: contractAddress,
      deployer: deployer.address,
      network: "localhost (fork)",
      chainId: Number(network.chainId),
      blockNumber: blockNumber,
      deploymentTime: new Date().toISOString(),
    };

    console.log("💾 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log();

    return deploymentInfo;

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("Error:", error.message);
    if (error.transaction) {
      console.error("Transaction:", error.transaction);
    }
    throw error;
  }
}

main()
  .then((info) => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
