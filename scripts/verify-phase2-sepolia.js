/**
 * @title Phase 2 Verification Script - Sepolia Testnet
 * @notice Verifies all Phase 2 contracts on Etherscan
 * @dev Run with: npx hardhat run scripts/verify-phase2-sepolia.js --network sepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Helper function to verify a contract on Etherscan
 */
async function verifyContract(address, constructorArguments, contractName) {
    console.log(`\n📝 Verifying ${contractName}...`);
    console.log(`   Address: ${address}`);

    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log(`✅ ${contractName} verified successfully!`);
        return true;
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`ℹ️  ${contractName} is already verified`);
            return true;
        }
        console.error(`❌ Error verifying ${contractName}:`, error.message);
        return false;
    }
}

/**
 * Main verification function
 */
async function main() {
    console.log("\n========================================");
    console.log("🔍 PHASE 2 VERIFICATION - SEPOLIA TESTNET");
    console.log("========================================\n");

    // Load Phase 1 deployment
    const phase1File = path.join(__dirname, "..", "deployments", "sepolia-phase1.json");
    if (!fs.existsSync(phase1File)) {
        console.error("❌ Phase 1 deployment file not found!");
        console.error("   Expected:", phase1File);
        process.exit(1);
    }

    const phase1Deployment = JSON.parse(fs.readFileSync(phase1File, "utf8"));
    console.log("✅ Phase 1 deployment loaded");

    // Load Phase 2 deployment
    const phase2File = path.join(__dirname, "..", "deployments", "sepolia-phase2.json");
    if (!fs.existsSync(phase2File)) {
        console.error("❌ Phase 2 deployment file not found!");
        console.error("   Expected:", phase2File);
        console.error("\nPlease run deployment first:");
        console.error("   npx hardhat run scripts/deploy-phase2-sepolia.js --network sepolia");
        process.exit(1);
    }

    const phase2Deployment = JSON.parse(fs.readFileSync(phase2File, "utf8"));
    console.log("✅ Phase 2 deployment loaded");
    console.log("\n");

    // Configuration
    const CONFIG = {
        feeParams: {
            baseFeeBps: 50,
            platformFeeBps: 25,
            creatorFeeBps: 25,
            maxAdditionalFeeBps: 100
        },
        timelockDelay: 48 * 60 * 60 // 48 hours
    };

    const results = {
        techToken: false,
        timelock: false,
        referenceMarket: false,
        factory: false,
        rewardDistributor: false
    };

    try {
        // ============================================
        // 1. VERIFY TECH TOKEN
        // ============================================
        results.techToken = await verifyContract(
            phase2Deployment.contracts.techToken,
            [
                "KEKTECH Token",
                "TECH",
                18
            ],
            "TECH Token (MockERC20)"
        );

        // ============================================
        // 2. VERIFY FACTORY TIMELOCK
        // ============================================
        results.timelock = await verifyContract(
            phase2Deployment.contracts.timelock,
            [CONFIG.timelockDelay],
            "FactoryTimelock"
        );

        // ============================================
        // 3. VERIFY REFERENCE PREDICTION MARKET
        // ============================================
        // Note: We need to get the deployment timestamp to construct the correct endTime/resolutionTime
        const deploymentTimestamp = Math.floor(new Date(phase2Deployment.timestamp).getTime() / 1000);
        results.referenceMarket = await verifyContract(
            phase2Deployment.contracts.referenceMarket,
            [
                phase2Deployment.deployer,           // creator
                phase2Deployment.deployer,           // resolver
                "Reference Market",                   // question
                deploymentTimestamp + 86400,         // endTime (1 day from deployment)
                deploymentTimestamp + 172800,        // resolutionTime (2 days from deployment)
                phase1Deployment.contracts.basedToken, // basedToken
                phase1Deployment.treasury,           // platformTreasury
                CONFIG.feeParams.baseFeeBps,         // baseFeeBps
                CONFIG.feeParams.platformFeeBps,     // platformFeeBps
                CONFIG.feeParams.creatorFeeBps,      // creatorFeeBps
                CONFIG.feeParams.maxAdditionalFeeBps // maxAdditionalFeeBps
            ],
            "PredictionMarket (Reference)"
        );

        // ============================================
        // 4. VERIFY PREDICTION MARKET FACTORY
        // ============================================
        results.factory = await verifyContract(
            phase2Deployment.contracts.factory,
            [
                phase1Deployment.contracts.basedToken,
                phase1Deployment.treasury,
                phase2Deployment.contracts.referenceMarket, // Reference market address
                CONFIG.feeParams
            ],
            "PredictionMarketFactory"
        );

        // ============================================
        // 5. VERIFY REWARD DISTRIBUTOR
        // ============================================
        results.rewardDistributor = await verifyContract(
            phase2Deployment.contracts.rewardDistributor,
            [
                phase1Deployment.contracts.basedToken,
                phase2Deployment.contracts.techToken,
                phase2Deployment.deployer
            ],
            "RewardDistributor"
        );

        // ============================================
        // VERIFICATION SUMMARY
        // ============================================
        console.log("\n========================================");
        console.log("📊 VERIFICATION SUMMARY");
        console.log("========================================\n");

        const allVerified = Object.values(results).every(result => result === true);

        console.log("Contract Verification Status:");
        console.log("─".repeat(50));
        console.log(`1. TECH Token:           ${results.techToken ? "✅" : "❌"}`);
        console.log(`2. FactoryTimelock:      ${results.timelock ? "✅" : "❌"}`);
        console.log(`3. Reference Market:     ${results.referenceMarket ? "✅" : "❌"}`);
        console.log(`4. PredictionMarketFactory: ${results.factory ? "✅" : "❌"}`);
        console.log(`5. RewardDistributor:    ${results.rewardDistributor ? "✅" : "❌"}`);
        console.log("\n");

        if (allVerified) {
            console.log("✅ All Phase 2 contracts verified successfully!\n");
            console.log("🔗 View on Etherscan:");
            console.log("─".repeat(50));
            console.log(`https://sepolia.etherscan.io/address/${phase2Deployment.contracts.techToken}`);
            console.log(`https://sepolia.etherscan.io/address/${phase2Deployment.contracts.timelock}`);
            console.log(`https://sepolia.etherscan.io/address/${phase2Deployment.contracts.referenceMarket}`);
            console.log(`https://sepolia.etherscan.io/address/${phase2Deployment.contracts.factory}`);
            console.log(`https://sepolia.etherscan.io/address/${phase2Deployment.contracts.rewardDistributor}`);
            console.log("\n");

            console.log("📋 System Status:");
            console.log("─".repeat(50));
            console.log("Phase 1: ✅ Deployed & Verified (5 contracts)");
            console.log("Phase 2: ✅ Deployed & Verified (5 contracts)");
            console.log("TOTAL: 10 contracts operational on Sepolia\n");

            console.log("🎯 Next Steps:");
            console.log("─".repeat(50));
            console.log("1. Test market creation and betting");
            console.log("2. Test reward distribution");
            console.log("3. Run integration tests");
            console.log("4. Prepare for mainnet deployment\n");
        } else {
            console.log("⚠️  Some contracts failed to verify");
            console.log("    Please check the errors above and retry\n");
        }

    } catch (error) {
        console.error("\n❌ ERROR during verification:");
        console.error("─".repeat(50));
        console.error(error);
        console.log("\n");
        process.exit(1);
    }
}

// Execute verification
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
