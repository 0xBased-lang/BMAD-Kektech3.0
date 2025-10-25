/**
 * CRITICAL: Check Live NFT Supply (Simple Version)
 *
 * Uses generic ERC721 interface to check total supply
 *
 * Usage:
 * npx hardhat run scripts/check-live-supply-simple.js --network basedMainnet
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 CHECKING LIVE NFT SUPPLY...\n");
  console.log("=" .repeat(60));

  // Live NFT contract address
  const NFT_ADDRESS = "0x40B6184b901334C0A88f528c1A0a1de7a77490f1";

  try {
    console.log("📍 NFT Contract:", NFT_ADDRESS);

    // Generic ERC721 interface
    const ERC721_ABI = [
      "function totalSupply() view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function balanceOf(address owner) view returns (uint256)"
    ];

    const provider = hre.ethers.provider;
    const nft = new hre.ethers.Contract(NFT_ADDRESS, ERC721_ABI, provider);

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

    const supply = Number(totalSupply.toString());

    if (supply < 4200) {
      console.log("✅ STATUS: CAN PROCEED WITH 4,200 MODIFICATION");
      console.log(`   Current Supply: ${supply} NFTs`);
      console.log(`   Remaining Capacity: ${4200 - supply} NFTs`);
      console.log("\n✅ RECOMMENDATION: Proceed with deployment plan");
      console.log("   - Deploy new staking contract for 4,200 NFTs");
      console.log("   - Existing NFT holders unaffected");
      console.log("   - Clear path forward");
      console.log("\n🚀 NEXT STEPS:");
      console.log("   1. Get Sepolia testnet ETH (FREE)");
      console.log("   2. Deploy to Sepolia for testing");
      console.log("   3. Follow Week 1 plan in PRACTICAL_ACTION_PLAN.md");
    } else {
      console.log("⚠️  STATUS: NEED ALTERNATIVE STRATEGY");
      console.log(`   Current Supply: ${supply} NFTs`);
      console.log(`   Over Capacity: ${supply - 4200} NFTs`);
      console.log("\n⚠️  YOUR 4,200 MODIFICATION WON'T WORK AS-IS");
      console.log("\n📋 OPTIONS:");
      console.log("   A) Keep 10,000 NFT design (no modification needed)");
      console.log("   B) Develop migration/buyback for NFTs 4,201+");
      console.log("   C) Implement dual staking system");
      console.log("\n⚠️  RECOMMENDATION: Discuss strategy before proceeding");
    }

    console.log("=" .repeat(60));

    // Additional info
    console.log("\n📋 CONTRACT INFO:");
    console.log("=" .repeat(60));

    try {
      const name = await nft.name();
      const symbol = await nft.symbol();
      console.log(`Name:   ${name}`);
      console.log(`Symbol: ${symbol}`);
    } catch (e) {
      console.log("ℹ️  Could not fetch name/symbol (may not be implemented)");
    }

    console.log("=" .repeat(60));
    console.log("\n✅ Check complete!\n");

  } catch (error) {
    console.log("\n❌ ERROR checking live NFT supply:");
    console.log(error.message);
    console.log("\nPossible reasons:");
    console.log("1. Network connection issue - check BASED_MAINNET_RPC in .env");
    console.log("2. RPC endpoint not responding");
    console.log("3. Contract doesn't support totalSupply()");
    console.log("\nTry checking your RPC endpoint:");
    console.log(`   BASED_MAINNET_RPC=${process.env.BASED_MAINNET_RPC || 'NOT SET'}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
