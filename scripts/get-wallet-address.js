/**
 * Get Wallet Address
 *
 * Displays your deployment wallet address from .env PRIVATE_KEY
 *
 * Usage:
 * npx hardhat run scripts/get-wallet-address.js
 */

const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("📍 YOUR DEPLOYMENT WALLET ADDRESS");
  console.log("=".repeat(60));

  try {
    // Get signer from private key in .env
    const [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();

    console.log("\n✅ Wallet Address:");
    console.log(`   ${address}`);

    console.log("\n📋 USE THIS ADDRESS TO GET SEPOLIA ETH:");
    console.log("   1. Visit: https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log(`   2. Paste: ${address}`);
    console.log("   3. Request: 0.5 Sepolia ETH");
    console.log("   4. Wait: 1-2 minutes");

    console.log("\n🔍 VERIFY ON EXPLORER:");
    console.log(`   Sepolia: https://sepolia.etherscan.io/address/${address}`);
    console.log(`   Mainnet: https://explorer.bf1337.org/address/${address}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Copy the address above to get testnet ETH!");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.log("\n❌ ERROR getting wallet address:");
    console.log(error.message);
    console.log("\nMake sure PRIVATE_KEY is set in .env file");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
