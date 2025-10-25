/**
 * SEPOLIA TESTNET DEPLOYMENT
 *
 * Deploys complete testing environment:
 * 1. Mock KektechNFT contract
 * 2. EnhancedNFTStaking (4,200 NFTs)
 *
 * Usage:
 * npx hardhat run scripts/deploy-sepolia-complete.js --network sepolia
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 SEPOLIA TESTNET DEPLOYMENT - Complete Environment\n");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📍 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log("═".repeat(70));

  const deployedContracts = {};

  try {
    // ========================================
    // STEP 1: DEPLOY MOCK NFT CONTRACT
    // ========================================
    console.log("\n📋 STEP 1: Deploying Mock KektechNFT\n");

    const MockNFT = await ethers.getContractFactory("MockNFT");
    console.log("⏳ Deploying Mock NFT...");

    const mockNFT = await MockNFT.deploy();
    await mockNFT.waitForDeployment();

    const nftAddress = await mockNFT.getAddress();
    deployedContracts.mockNFT = nftAddress;

    console.log(`✅ Mock NFT Deployed: ${nftAddress}`);

    // Verify deployment
    const nftCode = await ethers.provider.getCode(nftAddress);
    console.log(`✅ Code Size: ${(nftCode.length - 2) / 2} bytes\n`);

    // ========================================
    // STEP 2: DEPLOY ENHANCED NFT STAKING
    // ========================================
    console.log("📋 STEP 2: Deploying EnhancedNFTStaking (4,200 NFTs)\n");

    const EnhancedNFTStaking = await ethers.getContractFactory("EnhancedNFTStaking");
    console.log("⏳ Deploying Staking Contract...");

    const staking = await EnhancedNFTStaking.deploy(nftAddress);
    await staking.waitForDeployment();

    const stakingAddress = await staking.getAddress();
    deployedContracts.staking = stakingAddress;

    console.log(`✅ Staking Deployed: ${stakingAddress}`);

    // Verify deployment
    const stakingCode = await ethers.provider.getCode(stakingAddress);
    console.log(`✅ Code Size: ${(stakingCode.length - 2) / 2} bytes\n`);

    // ========================================
    // STEP 3: VERIFICATION
    // ========================================
    console.log("📋 STEP 3: Deployment Verification\n");

    // Verify NFT reference
    const referencedNFT = await staking.nftContract();
    if (referencedNFT.toLowerCase() !== nftAddress.toLowerCase()) {
      throw new Error("❌ NFT address mismatch!");
    }
    console.log(`✅ NFT Contract Reference Verified`);

    // Test rarity calculation works (this confirms MAX_NFT_SUPPLY = 4200)
    console.log(`✅ Testing rarity calculations to verify 4,200 NFT implementation`);

    // Test boundary calculations
    console.log(`\n📊 Testing Boundary Calculations:`);

    const testCases = [
      { id: 0, expectedRarity: 4200, desc: "First NFT (highest rarity)" },
      { id: 2940, expectedRarity: 1260, desc: "Common/Uncommon boundary" },
      { id: 4199, expectedRarity: 1, desc: "Last NFT (lowest rarity)" }
    ];

    for (const test of testCases) {
      const rarity = await staking.calculateRarity(test.id);
      const match = rarity === BigInt(test.expectedRarity);
      const symbol = match ? "✅" : "❌";
      console.log(`   ${symbol} NFT #${test.id}: rarity ${rarity} (expected ${test.expectedRarity})`);

      if (!match) {
        throw new Error(`Rarity calculation mismatch for token ${test.id}!`);
      }
    }

    // Test rejection of invalid token
    try {
      await staking.calculateRarity(4200);
      throw new Error("❌ Should have rejected token 4200!");
    } catch (error) {
      if (error.message.includes("Token ID out of range")) {
        console.log(`   ✅ Correctly rejects token 4200`);
      } else if (error.message.includes("Should have rejected")) {
        throw error;
      }
    }

    console.log(`\n✅ All Verification Tests Passed!\n`);

    // ========================================
    // STEP 4: SAVE DEPLOYMENT INFO
    // ========================================
    console.log("📋 STEP 4: Saving Deployment Information\n");

    const deployment = {
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      contracts: {
        mockNFT: nftAddress,
        enhancedNFTStaking: stakingAddress
      },
      verification: {
        maxSupply: 4200,
        nftReference: referencedNFT
      },
      explorer: {
        mockNFT: `https://sepolia.etherscan.io/address/${nftAddress}`,
        staking: `https://sepolia.etherscan.io/address/${stakingAddress}`
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info
    const filename = `sepolia-deployment-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));

    console.log(`✅ Deployment saved to: ${filename}\n`);

    // ========================================
    // DEPLOYMENT SUMMARY
    // ========================================
    console.log("═".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("═".repeat(70));
    console.log(`\n📋 DEPLOYED CONTRACTS:\n`);
    console.log(`   Mock NFT:        ${nftAddress}`);
    console.log(`   Staking (4,200): ${stakingAddress}`);

    console.log(`\n🔍 VERIFY ON SEPOLIA ETHERSCAN:\n`);
    console.log(`   NFT:     https://sepolia.etherscan.io/address/${nftAddress}`);
    console.log(`   Staking: https://sepolia.etherscan.io/address/${stakingAddress}`);

    console.log(`\n📊 CONFIGURATION:\n`);
    console.log(`   MAX_NFT_SUPPLY:  4,200`);
    console.log(`   NFT Reference:   ${referencedNFT}`);
    console.log(`   Deployer:        ${deployer.address}`);

    console.log(`\n✅ NEXT STEPS:\n`);
    console.log(`   1. Verify contracts on Etherscan`);
    console.log(`   2. Run validation: npx hardhat run scripts/validate-staking-deployment.js --network sepolia`);
    console.log(`   3. Test manually with test NFTs`);
    console.log(`   4. Document gas costs`);

    console.log(`\n` + "═".repeat(70) + `\n`);

    return deployment;

  } catch (error) {
    console.log(`\n❌ DEPLOYMENT FAILED!\n`);
    console.log(`Error: ${error.message}\n`);

    if (error.stack) {
      console.log(`Stack Trace:`);
      console.log(error.stack);
    }

    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
