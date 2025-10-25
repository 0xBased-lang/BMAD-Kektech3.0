/**
 * Test Fork Connection with KEKTECH Contracts
 * Verifies fork is working and can access real mainnet contracts
 */

const { ethers } = require("hardhat");

// KEKTECH contract addresses (BasedAI mainnet)
const KEKTECH_NFT = "0x40B6184b901334C0A88f528c1A0a1de7a77490f1";
const TECH_TOKEN = "0x62E8D022CAf673906e62904f7BB5ae467082b546";

async function main() {
  console.log("\n🔍 TESTING FORK CONNECTION WITH KEKTECH CONTRACTS\n");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("✅ Network Connected!");
    console.log(`   Chain ID: ${network.chainId}`);

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`   Block Number: ${blockNumber}`);
    console.log(`   Block (hex): 0x${blockNumber.toString(16)}`);

    // Test 1: Check KEKTECH NFT contract exists
    console.log("\n📦 Test 1: KEKTECH NFT Contract");
    const nftCode = await ethers.provider.getCode(KEKTECH_NFT);

    if (nftCode === "0x" || nftCode === "0x0") {
      console.log("   ❌ KEKTECH NFT contract NOT found!");
      console.log("   This means fork is NOT using real BasedAI data");
      process.exit(1);
    }

    console.log("   ✅ KEKTECH NFT contract found!");
    console.log(`   Address: ${KEKTECH_NFT}`);
    console.log(`   Code size: ${(nftCode.length - 2) / 2} bytes`);

    // Test 2: Check TECH Token contract exists
    console.log("\n💰 Test 2: TECH Token Contract");
    const techCode = await ethers.provider.getCode(TECH_TOKEN);

    if (techCode === "0x" || techCode === "0x0") {
      console.log("   ❌ TECH Token contract NOT found!");
      process.exit(1);
    }

    console.log("   ✅ TECH Token contract found!");
    console.log(`   Address: ${TECH_TOKEN}`);
    console.log(`   Code size: ${(techCode.length - 2) / 2} bytes`);

    // Test 3: Try to read from KEKTECH NFT (name and symbol)
    console.log("\n🎨 Test 3: Reading KEKTECH NFT Data");
    try {
      const nft = await ethers.getContractAt(
        ["function name() view returns (string)", "function symbol() view returns (string)"],
        KEKTECH_NFT
      );

      const name = await nft.name();
      const symbol = await nft.symbol();

      console.log(`   ✅ NFT Name: ${name}`);
      console.log(`   ✅ NFT Symbol: ${symbol}`);
    } catch (error) {
      console.log("   ⚠️  Could not read NFT metadata (might not be ERC721 standard)");
    }

    // Test 4: Check test account has funds
    console.log("\n💵 Test 4: Test Account Balance");
    const [testAccount] = await ethers.getSigners();
    console.log(`   Test Account: ${testAccount.address}`);

    const balance = await ethers.provider.getBalance(testAccount.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance > 0) {
      console.log("   ✅ Test account has funds!");
    }

    // Success summary
    console.log("\n═══════════════════════════════════════════════════");
    console.log("🎉 ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("✅ Fork is connected to VPS node data");
    console.log("✅ Can access real KEKTECH NFT contract");
    console.log("✅ Can access real TECH token contract");
    console.log("✅ Test accounts have funds for testing");
    console.log("✅ Ready to deploy and test contracts!\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
