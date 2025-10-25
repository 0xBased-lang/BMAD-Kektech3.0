# 🚀 Testnet Deployment Guide - EnhancedNFTStaking (4,200 NFTs)

**Purpose:** Step-by-step guide for deploying to Sepolia testnet
**Status:** Ready for execution
**Risk Level:** LOW (testnet deployment)

---

## 📋 Pre-Deployment Checklist

### Required Preparations

- [ ] **Sepolia ETH** - At least 0.1 ETH in deployer wallet (for deployment + testing)
- [ ] **Private Key** - Securely stored in `.env` file
- [ ] **RPC Endpoint** - Alchemy/Infura Sepolia RPC configured
- [ ] **All Tests Passing** - Verify locally first
- [ ] **Fork Tests Passed** - Confirm fork deployment successful
- [ ] **Backup Created** - All code backed up to git

### Environment Setup

```bash
# 1. Verify .env file has required variables
cat .env | grep -E "SEPOLIA_RPC|PRIVATE_KEY"

# Should show:
# SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/[YOUR_KEY]
# PRIVATE_KEY=[YOUR_PRIVATE_KEY]

# 2. Verify you have Sepolia ETH
npx hardhat console --network sepolia
> const [deployer] = await ethers.getSigners();
> const balance = await ethers.provider.getBalance(deployer.address);
> console.log(ethers.formatEther(balance));
> .exit

# Should show at least 0.1 ETH
```

### Final Verification

```bash
# 1. Run all unit tests one more time
npx hardhat test test/EnhancedNFTStaking-4200.test.js

# Should show: 32 passing

# 2. Verify contract compiles
npx hardhat compile

# Should show: Compiled successfully

# 3. Verify network configuration
npx hardhat run scripts/check-network.js --network sepolia
```

---

## 🚀 Deployment Process

### Step 1: Pre-Deployment Safety Check

**Create safety check script:**

```bash
# Create quick safety verification
cat > scripts/pre-deployment-check.js << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 PRE-DEPLOYMENT SAFETY CHECK\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  if (balance < ethers.parseEther("0.05")) {
    console.log("\n❌ WARNING: Low balance! Get more testnet ETH");
    process.exit(1);
  }

  if (network.chainId !== 11155111n) {
    console.log("\n❌ ERROR: Not on Sepolia! Current chain:", network.chainId);
    process.exit(1);
  }

  console.log("\n✅ Safety checks passed!");
}

main().catch(console.error);
EOF

# Run safety check
npx hardhat run scripts/pre-deployment-check.js --network sepolia
```

### Step 2: Deploy to Sepolia

```bash
# Deploy with production script
npx hardhat run scripts/deploy-staking-4200.js --network sepolia

# This will:
# 1. Run pre-deployment validation
# 2. Deploy EnhancedNFTStaking contract
# 3. Verify deployment
# 4. Run post-deployment tests
# 5. Save deployment info to deployments/
```

**Expected Output:**
```
🚀 DEPLOYING EnhancedNFTStaking (4,200 NFTs)

📋 Step 1: Pre-Deployment Validation
✅ Deployer Address: 0x...
✅ Deployer Balance: X.XX ETH
✅ Network: sepolia (Chain ID: 11155111)
✅ Current Block: XXXXXX
✅ KEKTECH NFT Contract Verified: 0x...

📋 Step 2: Deploying EnhancedNFTStaking Contract
✅ Contract Factory Created
⏳ Deploying contract...
⏳ Waiting for deployment confirmation...
✅ Contract Deployed: 0x...

📋 Step 3: Deployment Verification
✅ Contract Code Verified
✅ NFT Contract Reference: 0x...

📋 Step 4: Post-Deployment Testing
✅ 10 boundary tests passed
✅ Invalid token rejection verified
✅ Rarity multipliers correct

📋 Step 5: Saving Deployment Information
✅ Deployment info saved: staking-4200-sepolia-[timestamp].json

🎉 DEPLOYMENT SUCCESSFUL!
```

### Step 3: Validate Deployment

```bash
# Run comprehensive validation
npx hardhat run scripts/validate-staking-deployment.js --network sepolia

# Should show 22/22 tests passing
```

### Step 4: Verify Contract on Etherscan

**Option A: Automatic Verification (Hardhat)**

```bash
# Install verification plugin (if not already installed)
npm install --save-dev @nomicfoundation/hardhat-verify

# Verify contract
npx hardhat verify --network sepolia [CONTRACT_ADDRESS] [NFT_CONTRACT_ADDRESS]

# Example:
# npx hardhat verify --network sepolia 0x123... 0x40B6184b901334C0A88f528c1A0a1de7a77490f1
```

**Option B: Manual Verification (Sepolia Etherscan)**

1. Go to Sepolia Etherscan: https://sepolia.etherscan.io/
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select:
   - Compiler: v0.8.22
   - Optimization: Yes (200 runs)
   - Via IR: Yes
6. Paste contract code
7. Submit

---

## 🧪 Post-Deployment Testing

### Test 1: Read Functions (No Gas)

```bash
# Create test script
cat > scripts/test-sepolia-reads.js << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  const deployment = require("../deployments/staking-4200-sepolia-[YOUR_TIMESTAMP].json");
  const staking = await ethers.getContractAt("EnhancedNFTStaking", deployment.contracts.stakingContract);

  console.log("\n📖 Testing Read Functions\n");

  // Test boundary calculations
  console.log("Rarity Tests:");
  console.log("  Token 0:", await staking.calculateRarity(0)); // Should be 0 (COMMON)
  console.log("  Token 2940:", await staking.calculateRarity(2940)); // Should be 1 (UNCOMMON)
  console.log("  Token 4199:", await staking.calculateRarity(4199)); // Should be 4 (LEGENDARY)

  // Test multipliers
  console.log("\nMultipliers:");
  for (let i = 0; i < 5; i++) {
    console.log(`  Rarity ${i}:`, await staking.getRarityMultiplier(i));
  }

  // Test state
  console.log("\nContract State:");
  console.log("  Total Staked:", await staking.getTotalStaked());
  console.log("  Total Voting Power:", await staking.getTotalVotingPower());

  console.log("\n✅ All read functions working!");
}

main().catch(console.error);
EOF

npx hardhat run scripts/test-sepolia-reads.js --network sepolia
```

### Test 2: Staking Test (Requires Test NFT)

**If you have a test NFT on Sepolia:**

```bash
cat > scripts/test-sepolia-staking.js << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  const [user] = await ethers.getSigners();
  const deployment = require("../deployments/staking-4200-sepolia-[YOUR_TIMESTAMP].json");
  const staking = await ethers.getContractAt("EnhancedNFTStaking", deployment.contracts.stakingContract);

  const TEST_TOKEN_ID = 100; // Your test NFT ID

  console.log("\n🧪 Testing Staking Functionality\n");

  // 1. Check rarity
  const rarity = await staking.calculateRarity(TEST_TOKEN_ID);
  console.log(`Token ${TEST_TOKEN_ID} Rarity:`, rarity);

  // 2. Approve staking contract
  const nft = await ethers.getContractAt("IERC721", deployment.contracts.nftContract);
  console.log("Approving staking contract...");
  const approveTx = await nft.approve(deployment.contracts.stakingContract, TEST_TOKEN_ID);
  await approveTx.wait();
  console.log("✅ Approved");

  // 3. Stake NFT
  console.log("Staking NFT...");
  const stakeTx = await staking.stakeNFT(TEST_TOKEN_ID);
  const stakeReceipt = await stakeTx.wait();
  console.log("✅ Staked! Gas used:", stakeReceipt.gasUsed.toString());

  // 4. Verify stake
  const stakeInfo = await staking.getStakeInfo(TEST_TOKEN_ID);
  console.log("\nStake Info:");
  console.log("  Owner:", stakeInfo.owner);
  console.log("  Rarity:", stakeInfo.rarity);
  console.log("  Voting Power:", stakeInfo.votingPower);

  // 5. Check user's voting power
  const votingPower = await staking.getVotingPower(user.address);
  console.log("\nUser Voting Power:", votingPower.toString());

  console.log("\n✅ Staking test successful!");
}

main().catch(console.error);
EOF

# Run staking test
npx hardhat run scripts/test-sepolia-staking.js --network sepolia
```

---

## 📊 Monitoring Setup

### Block Explorer

1. **Add to Sepolia Etherscan Watchlist**
   - Go to https://sepolia.etherscan.io/
   - Search for your contract
   - Click "Add to Watchlist"
   - Enable email notifications

2. **Monitor Key Metrics**
   - Transaction count
   - Gas usage per transaction
   - Contract balance
   - Recent transactions

### Event Monitoring

```javascript
// scripts/monitor-events.js
const { ethers } = require("hardhat");

async function monitorEvents() {
  const deployment = require("./deployments/staking-4200-sepolia-[TIMESTAMP].json");
  const staking = await ethers.getContractAt("EnhancedNFTStaking", deployment.contracts.stakingContract);

  console.log("👀 Monitoring staking events...\n");

  // Monitor NFTStaked events
  staking.on("NFTStaked", (owner, tokenId, rarity, votingPower) => {
    console.log(`\n🎯 NFT Staked!`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Token: ${tokenId}`);
    console.log(`   Rarity: ${rarity}`);
    console.log(`   Voting Power: ${votingPower}`);
  });

  // Monitor NFTUnstaked events
  staking.on("NFTUnstaked", (owner, tokenId, votingPower) => {
    console.log(`\n📤 NFT Unstaked!`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Token: ${tokenId}`);
    console.log(`   Voting Power: ${votingPower}`);
  });

  console.log("Press Ctrl+C to stop monitoring");
}

monitorEvents().catch(console.error);
```

---

## 🔍 Validation Checklist

### Deployment Validation

- [ ] Contract deployed successfully
- [ ] Deployment transaction confirmed (3+ confirmations)
- [ ] Contract verified on Etherscan
- [ ] Deployment artifact saved
- [ ] Contract address documented

### Functionality Validation

- [ ] All 10 boundary tests passed
- [ ] Invalid tokens rejected correctly
- [ ] Rarity multipliers correct (1x-5x)
- [ ] Voting power calculations correct
- [ ] Initial state correct (0 staked, 0 voting power)
- [ ] Owner is deployer address
- [ ] NFT contract reference correct

### Integration Validation

- [ ] Read functions working (no gas)
- [ ] Can calculate rarity for all valid IDs
- [ ] Can stake NFT (if test NFT available)
- [ ] Events emitted correctly
- [ ] Gas usage reasonable (~300K for staking)

---

## 📝 Documentation Updates

After successful deployment:

### 1. Update Contract Addresses

```bash
# Update frontend config
echo "SEPOLIA_STAKING_CONTRACT=0x[YOUR_ADDRESS]" >> frontend/.env

# Update backend config
echo "SEPOLIA_STAKING_CONTRACT=0x[YOUR_ADDRESS]" >> backend/.env
```

### 2. Create Deployment Record

```markdown
# deployments/SEPOLIA_DEPLOYMENT.md

## Sepolia Testnet Deployment

**Date:** [DATE]
**Deployer:** [ADDRESS]
**Network:** Sepolia (Chain ID: 11155111)

### Contract Addresses
- **Staking Contract:** 0x...
- **NFT Contract:** 0x40B6184b901334C0A88f528c1A0a1de7a77490f1

### Deployment Transaction
- **Hash:** 0x...
- **Block:** [BLOCK_NUMBER]
- **Gas Used:** [GAS_USED]

### Verification
- **Etherscan:** https://sepolia.etherscan.io/address/0x...
- **Verified:** [YES/NO]

### Testing
- [x] Boundary tests passed
- [x] Staking test passed
- [x] Events monitored
- [x] Integration validated
```

---

## ⏭️ Next Steps

### If Deployment Successful ✅

1. **Monitor for 24-48 hours**
   - Watch transactions
   - Monitor events
   - Check gas usage

2. **Test with team**
   - Have team members stake test NFTs
   - Verify everything works
   - Collect feedback

3. **Prepare for mainnet**
   - Review testnet learnings
   - Update documentation
   - Plan mainnet deployment

### If Deployment Failed ❌

1. **Check error messages**
   - Review deployment logs
   - Identify root cause
   - Document issue

2. **Verify prerequisites**
   - Sufficient ETH balance?
   - Correct network?
   - Valid NFT contract?

3. **Retry deployment**
   - Fix identified issues
   - Run pre-deployment checks
   - Deploy again

---

## 🚨 Emergency Procedures

### If Contract Has Issues

**Pause Contract (Owner Only):**
```javascript
const staking = await ethers.getContractAt("EnhancedNFTStaking", CONTRACT_ADDRESS);
await staking.pause();
console.log("✅ Contract paused");
```

**Unpause Contract:**
```javascript
await staking.unpause();
console.log("✅ Contract unpaused");
```

### If Need to Redeploy

1. **Pause current contract** (if possible)
2. **Deploy new contract** (new address)
3. **Update all references** to new address
4. **Test new deployment** thoroughly
5. **Migrate users** (if any stakes exist)

---

## 📞 Support Resources

### Sepolia Testnet Resources

- **Sepolia Faucet:** https://sepoliafaucet.com/
- **Alchemy Faucet:** https://www.alchemy.com/faucets/ethereum-sepolia
- **Sepolia Explorer:** https://sepolia.etherscan.io/
- **Sepolia RPC:** https://rpc.sepolia.org/

### Hardhat Resources

- **Documentation:** https://hardhat.org/docs
- **Network Config:** https://hardhat.org/hardhat-runner/docs/config#networks
- **Verification:** https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify

---

## ✅ Deployment Success Criteria

**Deployment is successful when:**

- [x] Contract deployed to Sepolia
- [x] Transaction confirmed (3+ confirmations)
- [x] Contract verified on Etherscan
- [x] All 22 validation tests passing
- [x] Read functions working correctly
- [x] Staking test successful (if NFT available)
- [x] Events monitored and working
- [x] Documentation updated
- [x] Team notified

**After success:**
- Continue monitoring for 24-48 hours
- Test with multiple users
- Prepare for mainnet deployment

---

**Status:** Ready for Sepolia deployment
**Risk:** LOW (testnet)
**Next:** Execute deployment when ready

