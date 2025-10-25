/**
 * @title Phase 2 Deployment Script - Sepolia Testnet
 * @notice Deploys Prediction Markets, Factory, Timelock, and Reward Distribution
 * @dev Run with: npx hardhat run scripts/deploy-phase2-sepolia.js --network sepolia
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Phase 1 deployment addresses (from sepolia-phase1.json)
const PHASE1_ADDRESSES = {
    basedToken: "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
    nft: "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd",
    staking: "0x420687494Dad8da9d058e9399cD401Deca17f6bd",
    bondManager: "0x188830810E01EDFBAe040D902BD445CfFDCe1BD8",
    governance: "0xEbF0b8A1E6961d2F2bbBaf43851B1Cbc9376847b",
    treasury: "0x25fD72154857Bd204345808a690d51a61A81EB0b"
};

// Deployment configuration
const CONFIG = {
    // Factory fee parameters (in basis points, 10000 = 100%)
    feeParams: {
        baseFeeBps: 50,          // 0.5% base fee
        platformFeeBps: 25,      // 0.25% platform fee
        creatorFeeBps: 25,       // 0.25% creator fee
        maxAdditionalFeeBps: 100 // 1% max additional fee (volume-based)
    },
    // Timelock delay (48 hours for testnet, should be 48-72 hours for mainnet)
    timelockDelay: 48 * 60 * 60, // 48 hours in seconds
    // TECH token initial supply (for testnet)
    techTokenSupply: ethers.parseEther("1000000") // 1M TECH tokens
};

/**
 * Main deployment function
 */
async function main() {
    console.log("\n========================================");
    console.log("🚀 PHASE 2 DEPLOYMENT - SEPOLIA TESTNET");
    console.log("========================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deploying from address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH\n");

    if (balance < ethers.parseEther("0.05")) {
        console.log("⚠️  WARNING: Low balance! Need at least 0.05 ETH for Phase 2 deployment");
        console.log("   Current balance:", ethers.formatEther(balance), "ETH");
        process.exit(1);
    }

    // Deployment results
    const deployedContracts = {
        phase: 2,
        network: "sepolia",
        chainId: "11155111",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        treasury: PHASE1_ADDRESSES.treasury,
        phase1Contracts: PHASE1_ADDRESSES,
        contracts: {}
    };

    console.log("✅ Phase 1 contracts loaded:");
    console.log("   BASED Token:", PHASE1_ADDRESSES.basedToken);
    console.log("   Treasury:", PHASE1_ADDRESSES.treasury);
    console.log("\n");

    try {
        // ============================================
        // 1. DEPLOY TECH TOKEN (for testing)
        // ============================================
        console.log("📦 [1/4] Deploying TECH Token...");
        console.log("─".repeat(50));

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const techToken = await MockERC20.deploy(
            "KEKTECH Token",
            "TECH",
            18
        );
        await techToken.waitForDeployment();
        const techTokenAddress = await techToken.getAddress();
        deployedContracts.contracts.techToken = techTokenAddress;

        console.log("✅ TECH Token deployed:", techTokenAddress);

        // Mint initial supply to deployer
        const mintTx = await techToken.mint(deployer.address, CONFIG.techTokenSupply);
        await mintTx.wait();
        console.log("   ✅ Minted", ethers.formatEther(CONFIG.techTokenSupply), "TECH to deployer");
        console.log("\n");

        // ============================================
        // 2. DEPLOY FACTORY TIMELOCK
        // ============================================
        console.log("⏰ [2/4] Deploying FactoryTimelock...");
        console.log("─".repeat(50));

        const FactoryTimelock = await ethers.getContractFactory("FactoryTimelock");
        const timelock = await FactoryTimelock.deploy(CONFIG.timelockDelay);
        await timelock.waitForDeployment();
        const timelockAddress = await timelock.getAddress();
        deployedContracts.contracts.timelock = timelockAddress;

        console.log("✅ FactoryTimelock deployed:", timelockAddress);
        console.log("   Timelock delay:", CONFIG.timelockDelay / 3600, "hours");
        console.log("\n");

        // ============================================
        // 3. DEPLOY PREDICTION MARKET FACTORY
        // ============================================
        console.log("🏭 [3/5] Deploying PredictionMarketFactory...");
        console.log("─".repeat(50));

        // First, deploy a reference PredictionMarket as implementation
        console.log("   Deploying reference PredictionMarket...");
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");

        // Deploy reference market with dummy parameters (won't be used, just for reference)
        const referenceMarket = await PredictionMarket.deploy(
            deployer.address,                    // creator (dummy)
            deployer.address,                    // resolver (dummy)
            "Reference Market",                   // question (dummy)
            Math.floor(Date.now() / 1000) + 86400, // endTime (1 day from now)
            Math.floor(Date.now() / 1000) + 172800, // resolutionTime (2 days from now)
            PHASE1_ADDRESSES.basedToken,         // basedToken
            PHASE1_ADDRESSES.treasury,           // platformTreasury
            CONFIG.feeParams.baseFeeBps,         // baseFeeBps
            CONFIG.feeParams.platformFeeBps,     // platformFeeBps
            CONFIG.feeParams.creatorFeeBps,      // creatorFeeBps
            CONFIG.feeParams.maxAdditionalFeeBps // maxAdditionalFeeBps
        );
        await referenceMarket.waitForDeployment();
        const referenceMarketAddress = await referenceMarket.getAddress();
        deployedContracts.contracts.referenceMarket = referenceMarketAddress;
        console.log("   ✅ Reference market:", referenceMarketAddress);

        // Now deploy the factory with the reference market as implementation
        const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarketFactory");
        const factory = await PredictionMarketFactory.deploy(
            PHASE1_ADDRESSES.basedToken,        // BASED token
            PHASE1_ADDRESSES.treasury,          // treasury
            referenceMarketAddress,             // market implementation
            CONFIG.feeParams                     // initial fee parameters
        );
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        deployedContracts.contracts.factory = factoryAddress;

        console.log("✅ PredictionMarketFactory deployed:", factoryAddress);
        console.log("   Market implementation:", referenceMarketAddress);
        console.log("   Fee Parameters:");
        console.log("     Base Fee:", CONFIG.feeParams.baseFeeBps / 100, "%");
        console.log("     Platform Fee:", CONFIG.feeParams.platformFeeBps / 100, "%");
        console.log("     Creator Fee:", CONFIG.feeParams.creatorFeeBps / 100, "%");
        console.log("     Max Additional Fee:", CONFIG.feeParams.maxAdditionalFeeBps / 100, "%");
        console.log("\n");

        // ============================================
        // 4. DEPLOY REWARD DISTRIBUTOR
        // ============================================
        console.log("💰 [4/5] Deploying RewardDistributor...");
        console.log("─".repeat(50));

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(
            PHASE1_ADDRESSES.basedToken,  // BASED token
            techTokenAddress,              // TECH token
            deployer.address               // distributor (can be changed later)
        );
        await rewardDistributor.waitForDeployment();
        const rewardDistributorAddress = await rewardDistributor.getAddress();
        deployedContracts.contracts.rewardDistributor = rewardDistributorAddress;

        console.log("✅ RewardDistributor deployed:", rewardDistributorAddress);
        console.log("   Distributor:", deployer.address);
        console.log("\n");

        // ============================================
        // SAVE DEPLOYMENT RESULTS
        // ============================================
        console.log("💾 Saving deployment results...");
        console.log("─".repeat(50));

        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentFile = path.join(deploymentsDir, "sepolia-phase2.json");
        fs.writeFileSync(deploymentFile, JSON.stringify(deployedContracts, null, 2));

        console.log("✅ Deployment results saved to:", deploymentFile);
        console.log("\n");

        // ============================================
        // DEPLOYMENT SUMMARY
        // ============================================
        console.log("========================================");
        console.log("✅ PHASE 2 DEPLOYMENT COMPLETE!");
        console.log("========================================\n");

        console.log("📋 Deployed Contracts:");
        console.log("─".repeat(50));
        console.log("1. TECH Token:          ", techTokenAddress);
        console.log("2. FactoryTimelock:     ", timelockAddress);
        console.log("3. Reference Market:    ", referenceMarketAddress);
        console.log("4. PredictionMarketFactory:", factoryAddress);
        console.log("5. RewardDistributor:   ", rewardDistributorAddress);
        console.log("\n");

        console.log("🔗 Integration Points:");
        console.log("─".repeat(50));
        console.log("• Factory uses BASED token:", PHASE1_ADDRESSES.basedToken);
        console.log("• Factory sends fees to treasury:", PHASE1_ADDRESSES.treasury);
        console.log("• RewardDistributor distributes BASED:", PHASE1_ADDRESSES.basedToken);
        console.log("• RewardDistributor distributes TECH:", techTokenAddress);
        console.log("\n");

        console.log("📊 System Status:");
        console.log("─".repeat(50));
        console.log("• Phase 1: ✅ Core System (5 contracts)");
        console.log("• Phase 2: ✅ Prediction Markets (5 contracts)");
        console.log("• TOTAL: 10 contracts deployed on Sepolia");
        console.log("\n");

        console.log("🎯 Next Steps:");
        console.log("─".repeat(50));
        console.log("1. Verify contracts on Etherscan:");
        console.log("   npx hardhat run scripts/verify-phase2-sepolia.js --network sepolia");
        console.log("\n2. Test market creation:");
        console.log("   • Create a prediction market through Factory");
        console.log("   • Test betting functionality");
        console.log("   • Test resolution and claiming");
        console.log("\n3. Test reward distribution:");
        console.log("   • Publish distribution with Merkle root");
        console.log("   • Test reward claiming");
        console.log("\n4. Integration testing:");
        console.log("   • Verify Phase 1 + Phase 2 work together");
        console.log("   • Test complete user flows");
        console.log("\n");

        console.log("🔐 View on Etherscan:");
        console.log("─".repeat(50));
        console.log(`https://sepolia.etherscan.io/address/${techTokenAddress}`);
        console.log(`https://sepolia.etherscan.io/address/${timelockAddress}`);
        console.log(`https://sepolia.etherscan.io/address/${referenceMarketAddress}`);
        console.log(`https://sepolia.etherscan.io/address/${factoryAddress}`);
        console.log(`https://sepolia.etherscan.io/address/${rewardDistributorAddress}`);
        console.log("\n");

        return deployedContracts;

    } catch (error) {
        console.error("\n❌ ERROR during deployment:");
        console.error("─".repeat(50));
        console.error(error);
        console.log("\n");
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
