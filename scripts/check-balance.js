/**
 * Check Wallet Balance
 *
 * Checks your wallet balance on the specified network
 *
 * Usage:
 * npx hardhat run scripts/check-balance.js --network sepolia
 * npx hardhat run scripts/check-balance.js --network basedMainnet
 */

const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;

  console.log("\n" + "=".repeat(60));
  console.log("💰 WALLET BALANCE CHECK");
  console.log("=".repeat(60));

  try {
    const [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceEth = hre.ethers.formatEther(balance);

    console.log(`\n📍 Network:  ${networkName}`);
    console.log(`📍 Address:  ${address}`);
    console.log(`💰 Balance:  ${balanceEth} ETH`);

    // Recommendations
    console.log("\n📊 BALANCE ANALYSIS:");
    console.log("=".repeat(60));

    const balanceNum = parseFloat(balanceEth);

    if (networkName === "sepolia") {
      if (balanceNum >= 0.5) {
        console.log("✅ EXCELLENT - You have plenty for deployment!");
        console.log("   Recommended for Sepolia: 0.1-0.2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
        console.log("\n🚀 READY TO DEPLOY!");
      } else if (balanceNum >= 0.1) {
        console.log("✅ GOOD - Sufficient for deployment");
        console.log("   Recommended: 0.1-0.2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
        console.log("\n✅ Ready to deploy");
      } else if (balanceNum > 0) {
        console.log("⚠️  LOW - May not be enough");
        console.log("   Recommended: 0.1-0.2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
        console.log("\n💡 SUGGESTION: Get more Sepolia ETH");
        console.log("   Visit: https://www.alchemy.com/faucets/ethereum-sepolia");
      } else {
        console.log("❌ NO BALANCE - Need Sepolia ETH");
        console.log("\n📍 GET FREE SEPOLIA ETH:");
        console.log("   1. Visit: https://www.alchemy.com/faucets/ethereum-sepolia");
        console.log("   2. Paste: " + address);
        console.log("   3. Request: 0.5 ETH");
      }
    } else if (networkName === "basedMainnet" || networkName === "basedai") {
      if (balanceNum >= 2.0) {
        console.log("✅ EXCELLENT - You have plenty for mainnet deployment!");
        console.log("   Recommended: 1-2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
      } else if (balanceNum >= 1.0) {
        console.log("✅ GOOD - Sufficient for mainnet deployment");
        console.log("   Recommended: 1-2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
      } else if (balanceNum > 0.1) {
        console.log("⚠️  LOW - May not be enough for mainnet");
        console.log("   Recommended: 1-2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
        console.log("\n💡 SUGGESTION: Get more ETH before mainnet deployment");
      } else {
        console.log("❌ INSUFFICIENT - Need more for mainnet");
        console.log("   Recommended: 1-2 ETH");
        console.log("   Your balance: " + balanceEth + " ETH");
      }
    } else {
      console.log(`Current balance: ${balanceEth} ETH`);
    }

    console.log("=".repeat(60));

    // Explorer link
    if (networkName === "sepolia") {
      console.log(`\n🔍 View on Explorer: https://sepolia.etherscan.io/address/${address}`);
    } else if (networkName === "basedMainnet" || networkName === "basedai") {
      console.log(`\n🔍 View on Explorer: https://explorer.bf1337.org/address/${address}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");

  } catch (error) {
    console.log("\n❌ ERROR checking balance:");
    console.log(error.message);
    console.log("\nPossible issues:");
    console.log("1. Network not configured in hardhat.config.js");
    console.log("2. RPC endpoint not responding");
    console.log("3. PRIVATE_KEY not set in .env");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
