/**
 * CRITICAL: Check Live NFT Supply
 *
 * This script checks how many NFTs are currently minted on mainnet.
 * CRITICAL DECISION POINT:
 * - If < 4,200: ✅ Can proceed with 4,200 modification
 * - If > 4,200: ❌ Must reconsider approach
 *
 * Usage:
 * npx hardhat run scripts/check-live-nft-supply.js --network basedMainnet
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 CHECKING LIVE NFT SUPPLY...\n");
  console.log("=" .repeat(60));

  // Live NFT contract address
  const NFT_ADDRESS = "0x40B6184b901334C0A88f528c1A0a1de7a77490f1";

  try {
    // Get contract instance
    console.log("📍 NFT Contract:", NFT_ADDRESS);

    const nft = await hre.ethers.getContractAt(
      "KektechNFT",
      NFT_ADDRESS
    );

    // Check total supply
    console.log("\n⏳ Fetching total supply...");
    const totalSupply = await nft.totalSupply();

    console.log("\n" + "=" .repeat(60));
    console.log("📊 CURRENT NFT SUPPLY");
    console.log("=" .repeat(60));
    console.log(`Total Minted: ${totalSupply.toString()} NFTs`);
    console.log(`Max Supply:   10,000 NFTs (current contract)`);
    console.log(`Your Target:  4,200 NFTs (modification)`);
    console.log("=" .repeat(60));

    // Critical decision point
    console.log("\n🎯 CRITICAL DECISION:");
    console.log("=" .repeat(60));

    if (totalSupply.lt(4200)) {
      console.log("✅ STATUS: CAN PROCEED");
      console.log(`   Supply: ${totalSupply} < 4,200`);
      console.log("   Your 4,200 NFT modification will work!");
      console.log("\n✅ RECOMMENDATION: Proceed with deployment plan");
      console.log("   - Deploy new staking contract for 4,200 NFTs");
      console.log("   - Existing NFT holders unaffected");
      console.log("   - Clear path forward");
    } else if (totalSupply.gte(4200)) {
      console.log("⚠️  STATUS: NEED ALTERNATIVE STRATEGY");
      console.log(`   Supply: ${totalSupply} >= 4,200`);
      console.log("   Your 4,200 NFT modification needs adjustment!");
      console.log("\n⚠️  OPTIONS:");
      console.log("   A) Keep 10,000 NFT design (no modification)");
      console.log("   B) Develop migration strategy for existing holders");
      console.log("   C) Implement dual staking system");
      console.log("\n⚠️  RECOMMENDATION: Discuss strategy before proceeding");
    }

    console.log("=" .repeat(60));

    // Additional info
    console.log("\n📋 ADDITIONAL INFO:");
    console.log("=" .repeat(60));

    try {
      const name = await nft.name();
      const symbol = await nft.symbol();
      console.log(`Name:   ${name}`);
      console.log(`Symbol: ${symbol}`);
    } catch (e) {
      console.log("ℹ️  Could not fetch name/symbol");
    }

    console.log("=" .repeat(60));
    console.log("\n✅ Check complete!");

  } catch (error) {
    console.log("\n❌ ERROR checking live NFT supply:");
    console.log(error.message);
    console.log("\nPossible reasons:");
    console.log("1. Network connection issue");
    console.log("2. RPC endpoint not configured");
    console.log("3. Contract address incorrect");
    console.log("\nPlease check hardhat.config.js network configuration");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
