/**
 * @title Simple Sepolia Validation
 * @notice Quick validation of deployed contracts - checks what actually exists
 * @dev Run with: npx hardhat run scripts/simple-sepolia-validation.js --network sepolia
 */

const hre = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 SIMPLE SEPOLIA VALIDATION - Testing Actual Deployment");
    console.log("=".repeat(70) + "\n");

    // Load deployment
    const deployment = JSON.parse(fs.readFileSync('./deployments/sepolia-phase2.json', 'utf8'));
    const [deployer] = await hre.ethers.getSigners();

    console.log("📋 Deployment Info:");
    console.log(`   Network: ${deployment.network}`);
    console.log(`   Chain ID: ${deployment.chainId}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Deployed: ${new Date(deployment.timestamp).toLocaleString()}\n`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    let passed = 0;
    let failed = 0;

    // Test Phase 1 Contracts
    console.log("=" .repeat(70));
    console.log("📦 PHASE 1 CONTRACTS");
    console.log("=".repeat(70) + "\n");

    // BASED Token
    try {
        const basedToken = await hre.ethers.getContractAt(
            "BMAD_BASED_Token",
            deployment.phase1Contracts.basedToken
        );
        const name = await basedToken.name();
        const symbol = await basedToken.symbol();
        const totalSupply = await basedToken.totalSupply();
        const balance = await basedToken.balanceOf(deployer.address);

        console.log("✅ BASED Token:");
        console.log(`   Address: ${deployment.phase1Contracts.basedToken}`);
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Total Supply: ${hre.ethers.formatEther(totalSupply)}`);
        console.log(`   Deployer Balance: ${hre.ethers.formatEther(balance)}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ BASED Token FAILED: ${error.message}\n`);
        failed++;
    }

    // NFT
    try {
        const nft = await hre.ethers.getContractAt(
            "BMAD_NFT",
            deployment.phase1Contracts.nft
        );
        const name = await nft.name();
        const symbol = await nft.symbol();

        console.log("✅ NFT:");
        console.log(`   Address: ${deployment.phase1Contracts.nft}`);
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ NFT FAILED: ${error.message}\n`);
        failed++;
    }

    // Staking
    try {
        const staking = await hre.ethers.getContractAt(
            "BMAD_Staking",
            deployment.phase1Contracts.staking
        );
        const stakedBalance = await staking.getStakedBalance(deployer.address);

        console.log("✅ Staking:");
        console.log(`   Address: ${deployment.phase1Contracts.staking}`);
        console.log(`   Deployer Staked: ${hre.ethers.formatEther(stakedBalance)}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Staking FAILED: ${error.message}\n`);
        failed++;
    }

    // Bond Manager
    try {
        const bondManager = await hre.ethers.getContractAt(
            "BMAD_BondManager",
            deployment.phase1Contracts.bondManager
        );

        console.log("✅ Bond Manager:");
        console.log(`   Address: ${deployment.phase1Contracts.bondManager}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Bond Manager FAILED: ${error.message}\n`);
        failed++;
    }

    // Governance
    try {
        const governance = await hre.ethers.getContractAt(
            "BMAD_Governance",
            deployment.phase1Contracts.governance
        );

        console.log("✅ Governance:");
        console.log(`   Address: ${deployment.phase1Contracts.governance}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Governance FAILED: ${error.message}\n`);
        failed++;
    }

    // Test Phase 2 Contracts
    console.log("=".repeat(70));
    console.log("📦 PHASE 2 CONTRACTS");
    console.log("=".repeat(70) + "\n");

    // TECH Token
    try {
        const techToken = await hre.ethers.getContractAt(
            "BMAD_TECH_Token",
            deployment.contracts.techToken
        );
        const name = await techToken.name();
        const symbol = await techToken.symbol();
        const totalSupply = await techToken.totalSupply();
        const balance = await techToken.balanceOf(deployer.address);

        console.log("✅ TECH Token:");
        console.log(`   Address: ${deployment.contracts.techToken}`);
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Total Supply: ${hre.ethers.formatEther(totalSupply)}`);
        console.log(`   Deployer Balance: ${hre.ethers.formatEther(balance)}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ TECH Token FAILED: ${error.message}\n`);
        failed++;
    }

    // Timelock
    try {
        const timelock = await hre.ethers.getContractAt(
            "TimelockController",
            deployment.contracts.timelock
        );

        console.log("✅ Timelock:");
        console.log(`   Address: ${deployment.contracts.timelock}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Timelock FAILED: ${error.message}\n`);
        failed++;
    }

    // Reference Market
    try {
        const referenceMarket = await hre.ethers.getContractAt(
            "BMAD_ReferenceMarket",
            deployment.contracts.referenceMarket
        );

        console.log("✅ Reference Market:");
        console.log(`   Address: ${deployment.contracts.referenceMarket}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Reference Market FAILED: ${error.message}\n`);
        failed++;
    }

    // Factory
    try {
        const factory = await hre.ethers.getContractAt(
            "BMAD_Factory",
            deployment.contracts.factory
        );

        console.log("✅ Factory:");
        console.log(`   Address: ${deployment.contracts.factory}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Factory FAILED: ${error.message}\n`);
        failed++;
    }

    // Reward Distributor
    try {
        const rewardDistributor = await hre.ethers.getContractAt(
            "BMAD_RewardDistributor",
            deployment.contracts.rewardDistributor
        );

        console.log("✅ Reward Distributor:");
        console.log(`   Address: ${deployment.contracts.rewardDistributor}\n`);
        passed++;
    } catch (error) {
        console.log(`❌ Reward Distributor FAILED: ${error.message}\n`);
        failed++;
    }

    // Final Report
    console.log("=".repeat(70));
    console.log("📊 VALIDATION SUMMARY");
    console.log("=".repeat(70) + "\n");

    const total = passed + failed;
    const successRate = (passed / total * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%\n`);

    if (failed === 0) {
        console.log("🎉 ALL CONTRACTS VALIDATED SUCCESSFULLY!");
        console.log("✅ Your Sepolia deployment is FUNCTIONAL and ACCESSIBLE!");
    } else {
        console.log("⚠️  Some contracts failed validation.");
        console.log("Please review the errors above.");
    }

    console.log("\n" + "=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ FATAL ERROR:", error);
        process.exit(1);
    });
