const hre = require("hardhat");

async function main() {
  try {
    console.log("\n🔍 Checking Sepolia connection...\n");

    const network = await hre.ethers.provider.getNetwork();
    console.log("✅ Network:", network.name);
    console.log("✅ Chain ID:", network.chainId.toString());

    const [deployer] = await hre.ethers.getSigners();
    console.log("✅ Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceEth = hre.ethers.formatEther(balance);
    console.log("✅ Balance:", balanceEth, "ETH");

    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("✅ Current Block:", blockNumber);

    if (balance > 0n) {
      console.log("\n🚀 READY TO DEPLOY!\n");
    } else {
      console.log("\n⚠️  Need Sepolia ETH\n");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
