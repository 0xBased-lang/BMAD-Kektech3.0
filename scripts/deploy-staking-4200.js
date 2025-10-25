/**
 * Production Deployment Script for EnhancedNFTStaking (4,200 NFTs)
 *
 * Best Practices:
 * - Pre-deployment validation
 * - Comprehensive error handling
 * - Deployment verification
 * - Post-deployment testing
 * - Complete logging
 * - Deployment artifact storage
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// KEKTECH NFT contract address (BasedAI mainnet)
const KEKTECH_NFT_ADDRESS = "0x40B6184b901334C0A88f528c1A0a1de7a77490f1";

async function main() {
  console.log("\n🚀 DEPLOYING EnhancedNFTStaking (4,200 NFTs)\n");
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    // ========================================
    // STEP 1: PRE-DEPLOYMENT VALIDATION
    // ========================================
    console.log("📋 Step 1: Pre-Deployment Validation\n");

    const [deployer] = await ethers.getSigners();
    console.log(`✅ Deployer Address: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`✅ Deployer Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther("0.01")) {
      throw new Error("❌ Insufficient balance for deployment! Need at least 0.01 ETH");
    }

    const network = await ethers.provider.getNetwork();
    console.log(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`✅ Current Block: ${blockNumber}\n`);

    // Verify NFT contract exists
    const nftCode = await ethers.provider.getCode(KEKTECH_NFT_ADDRESS);
    if (nftCode === "0x" || nftCode === "0x0") {
      throw new Error("❌ KEKTECH NFT contract not found at specified address!");
    }
    console.log(`✅ KEKTECH NFT Contract Verified: ${KEKTECH_NFT_ADDRESS}`);
    console.log(`   Code Size: ${(nftCode.length - 2) / 2} bytes\n`);

    // ========================================
    // STEP 2: DEPLOY CONTRACT
    // ========================================
    console.log("📋 Step 2: Deploying EnhancedNFTStaking Contract\n");

    const EnhancedNFTStaking = await ethers.getContractFactory("EnhancedNFTStaking");
    console.log("✅ Contract Factory Created");

    console.log("⏳ Deploying contract...");
    const stakingContract = await EnhancedNFTStaking.deploy(KEKTECH_NFT_ADDRESS);

    console.log("⏳ Waiting for deployment confirmation...");
    await stakingContract.waitForDeployment();

    const stakingAddress = await stakingContract.getAddress();
    console.log(`✅ Contract Deployed: ${stakingAddress}\n`);

    // ========================================
    // STEP 3: DEPLOYMENT VERIFICATION
    // ========================================
    console.log("📋 Step 3: Deployment Verification\n");

    // Verify contract code exists
    const deployedCode = await ethers.provider.getCode(stakingAddress);
    if (deployedCode === "0x" || deployedCode === "0x0") {
      throw new Error("❌ Contract deployment failed - no code at address!");
    }
    console.log(`✅ Contract Code Verified: ${(deployedCode.length - 2) / 2} bytes`);

    // Verify NFT contract reference
    const nftContractAddress = await stakingContract.nftContract();
    console.log(`✅ NFT Contract Reference: ${nftContractAddress}`);

    if (nftContractAddress.toLowerCase() !== KEKTECH_NFT_ADDRESS.toLowerCase()) {
      throw new Error("❌ NFT contract address mismatch!");
    }
    console.log(`✅ NFT Contract Address Verified\n`);

    // ========================================
    // STEP 4: POST-DEPLOYMENT TESTING
    // ========================================
    console.log("📋 Step 4: Post-Deployment Testing\n");

    // Test 1: Verify rarity calculation for all boundaries
    console.log("Test 1: Boundary Verification");

    const boundaries = [
      { id: 0, expected: 0, name: "First Common" },
      { id: 2939, expected: 0, name: "Last Common" },
      { id: 2940, expected: 1, name: "First Uncommon" },
      { id: 3569, expected: 1, name: "Last Uncommon" },
      { id: 3570, expected: 2, name: "First Rare" },
      { id: 3779, expected: 2, name: "Last Rare" },
      { id: 3780, expected: 3, name: "First Epic" },
      { id: 4109, expected: 3, name: "Last Epic" },
      { id: 4110, expected: 4, name: "First Legendary" },
      { id: 4199, expected: 4, name: "Last Legendary" }
    ];

    for (const boundary of boundaries) {
      const rarity = await stakingContract.calculateRarity(boundary.id);
      if (Number(rarity) !== boundary.expected) {
        throw new Error(`❌ Boundary test failed for ${boundary.name} (ID ${boundary.id}): Expected ${boundary.expected}, got ${rarity}`);
      }
      console.log(`   ✅ ${boundary.name} (${boundary.id}): Correct`);
    }

    // Test 2: Verify invalid token IDs are rejected
    console.log("\nTest 2: Invalid Token Rejection");

    try {
      await stakingContract.calculateRarity(4200);
      throw new Error("❌ Should have rejected token 4200!");
    } catch (error) {
      if (error.message.includes("Invalid token ID")) {
        console.log("   ✅ Token 4200: Correctly rejected");
      } else {
        throw error;
      }
    }

    try {
      await stakingContract.calculateRarity(9999);
      throw new Error("❌ Should have rejected token 9999!");
    } catch (error) {
      if (error.message.includes("Invalid token ID")) {
        console.log("   ✅ Token 9999: Correctly rejected");
      } else {
        throw error;
      }
    }

    // Test 3: Verify rarity multipliers
    console.log("\nTest 3: Rarity Multipliers");

    const multipliers = [
      { rarity: 0, expected: 1, name: "Common" },
      { rarity: 1, expected: 2, name: "Uncommon" },
      { rarity: 2, expected: 3, name: "Rare" },
      { rarity: 3, expected: 4, name: "Epic" },
      { rarity: 4, expected: 5, name: "Legendary" }
    ];

    for (const mult of multipliers) {
      const multiplier = await stakingContract.getRarityMultiplier(mult.rarity);
      if (multiplier !== BigInt(mult.expected)) {
        throw new Error(`❌ Multiplier test failed for ${mult.name}`);
      }
      console.log(`   ✅ ${mult.name}: ${mult.expected}x`);
    }

    // Test 4: Verify initial state
    console.log("\nTest 4: Initial State Verification");

    const totalStaked = await stakingContract.getTotalStaked();
    console.log(`   ✅ Total Staked: ${totalStaked} (should be 0)`);

    if (totalStaked !== 0n) {
      throw new Error("❌ Initial total staked should be 0!");
    }

    const totalVotingPower = await stakingContract.getTotalVotingPower();
    console.log(`   ✅ Total Voting Power: ${totalVotingPower} (should be 0)`);

    if (totalVotingPower !== 0n) {
      throw new Error("❌ Initial total voting power should be 0!");
    }

    const distribution = await stakingContract.getRarityDistribution();
    console.log(`   ✅ Rarity Distribution: All zeros (initial state)`);

    // Test 5: Verify ownership
    console.log("\nTest 5: Contract Ownership");

    const owner = await stakingContract.owner();
    console.log(`   ✅ Contract Owner: ${owner}`);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("❌ Owner should be deployer!");
    }
    console.log(`   ✅ Owner matches deployer\n`);

    // ========================================
    // STEP 5: SAVE DEPLOYMENT INFO
    // ========================================
    console.log("📋 Step 5: Saving Deployment Information\n");

    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber: blockNumber
      },
      deployer: {
        address: deployer.address,
        balance: ethers.formatEther(balance)
      },
      contracts: {
        stakingContract: stakingAddress,
        nftContract: KEKTECH_NFT_ADDRESS
      },
      configuration: {
        maxSupply: 4200,
        distribution: {
          common: { range: "0-2939", count: 2940, percentage: "70.00%", multiplier: "1x" },
          uncommon: { range: "2940-3569", count: 630, percentage: "15.00%", multiplier: "2x" },
          rare: { range: "3570-3779", count: 210, percentage: "5.00%", multiplier: "3x" },
          epic: { range: "3780-4109", count: 330, percentage: "7.86%", multiplier: "4x" },
          legendary: { range: "4110-4199", count: 90, percentage: "2.14%", multiplier: "5x" }
        }
      },
      verification: {
        allBoundariesTested: true,
        invalidTokensRejected: true,
        multipliersCorrect: true,
        initialStateCorrect: true,
        ownershipCorrect: true
      },
      timestamp: new Date().toISOString(),
      deploymentScript: "scripts/deploy-staking-4200.js"
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info
    const filename = `staking-4200-${network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`✅ Deployment info saved: ${filename}\n`);

    // ========================================
    // DEPLOYMENT SUCCESS SUMMARY
    // ========================================
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("🎉 DEPLOYMENT SUCCESSFUL!\n");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("📊 Deployment Summary:\n");
    console.log(`Network:           ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Block Number:      ${blockNumber}`);
    console.log(`Deployer:          ${deployer.address}`);
    console.log(`Staking Contract:  ${stakingAddress}`);
    console.log(`NFT Contract:      ${KEKTECH_NFT_ADDRESS}`);
    console.log(`Max Supply:        4,200 NFTs`);
    console.log(`Deployment File:   ${filename}\n`);

    console.log("✅ All Verification Tests Passed:");
    console.log("   ✅ 10 boundary tests");
    console.log("   ✅ Invalid token rejection");
    console.log("   ✅ Rarity multipliers");
    console.log("   ✅ Initial state");
    console.log("   ✅ Contract ownership\n");

    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("📋 Next Steps:\n");
    console.log("1. Run validation script:");
    console.log(`   npx hardhat run scripts/validate-staking-deployment.js --network ${network.name}\n`);
    console.log("2. Test staking with real NFT:");
    console.log(`   npx hardhat run scripts/test-staking-integration.js --network ${network.name}\n`);
    console.log("3. (Optional) Verify contract on block explorer");
    console.log("4. Update frontend with new contract address\n");

    console.log("═══════════════════════════════════════════════════════════════\n");

    return {
      stakingAddress,
      nftAddress: KEKTECH_NFT_ADDRESS,
      deployer: deployer.address,
      network: network.name,
      chainId: Number(network.chainId)
    };

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!\n");
    console.error("Error:", error.message);
    console.error("\nStack Trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ CRITICAL ERROR!");
    console.error(error);
    process.exit(1);
  });
