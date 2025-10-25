# 🚀 Mainnet Deployment Playbook - EnhancedNFTStaking

**Purpose:** Step-by-step mainnet deployment with all safety protocols
**Risk Level:** HIGH (production deployment)
**Prerequisites:** Testnet validation complete, security audit passed

---

## ⚠️ CRITICAL WARNING

**This is a MAINNET deployment. Real assets are at stake.**

- Double-check every step
- Verify every transaction
- Test before executing
- Have rollback plan ready
- Team standing by for emergencies

**If in doubt, STOP and review.**

---

## 📋 Pre-Deployment Prerequisites

### Required Completions

- [ ] **Testnet Deployment:** Successful on Sepolia
- [ ] **Testnet Validation:** All tests passing
- [ ] **Security Audit:** Completed and signed off
- [ ] **Team Training:** Emergency procedures practiced
- [ ] **Monitoring:** Infrastructure ready
- [ ] **Multisig:** Configured and tested
- [ ] **Documentation:** All guides complete

### Required Resources

- [ ] **Mainnet ETH:** At least 0.2 ETH for deployment + buffer
- [ ] **Hardware Wallet:** For signing transactions
- [ ] **Multisig:** Gnosis Safe or equivalent
- [ ] **RPC Endpoint:** Reliable mainnet RPC
- [ ] **Block Explorer:** Access configured
- [ ] **Team Availability:** All key personnel available
- [ ] **Communication:** Channels ready (Discord/Slack/Telegram)

---

## 🎯 Deployment Timeline

### Recommended Schedule

**D-7 (One Week Before):**
- Final security audit
- Team training
- Multisig setup
- Communication prep

**D-3 (Three Days Before):**
- Final code review
- Deployment scripts tested
- Monitoring deployed
- Status page ready

**D-1 (One Day Before):**
- Final checklist review
- Team briefing
- Go/No-go decision
- Sleep well!

**D-Day (Deployment Day):**
- Execute deployment (steps below)
- Monitor closely
- Communicate with community

**D+1 to D+7 (First Week):**
- 24/7 monitoring
- Daily status updates
- Issue response ready

---

## 🚀 DEPLOYMENT DAY - DETAILED STEPS

### Pre-Deployment (Morning)

#### Step 1: Final Environment Check

```bash
# 1. Verify you're on the correct machine
hostname
pwd

# 2. Verify git status
git status
git log -1

# Should show: Clean working directory, latest commit

# 3. Verify network configuration
cat hardhat.config.js | grep -A 5 "basedMainnet"

# Should show correct RPC and chain ID

# 4. Verify environment variables
cat .env | grep -E "BASED_MAINNET_RPC|PRIVATE_KEY"

# Should show configured values (PRIVATE_KEY should be hidden)
```

**Checklist:**
- [ ] Correct directory
- [ ] Clean git status
- [ ] Correct network config
- [ ] Environment variables set

#### Step 2: Final Code Verification

```bash
# 1. Run all tests one final time
npx hardhat test test/EnhancedNFTStaking-4200.test.js

# Should show: 32 passing

# 2. Compile contract
npx hardhat compile

# Should show: Compiled successfully

# 3. Verify contract matches testnet
diff contracts/staking/EnhancedNFTStaking.sol [testnet-backup]

# Should show: No differences

# 4. Check contract size
npx hardhat size-contracts

# Should be under 24KB
```

**Checklist:**
- [ ] All 32 tests passing
- [ ] Compilation successful
- [ ] Code matches testnet deployment
- [ ] Contract size acceptable

#### Step 3: Team Briefing

**Attendees Required:**
- [ ] Deployment lead
- [ ] Security lead
- [ ] Operations lead
- [ ] Communications lead

**Briefing Agenda:**
1. Review deployment plan
2. Assign roles and responsibilities
3. Review emergency procedures
4. Confirm communication channels
5. Go/No-go poll

**Go/No-Go Criteria:**
- All tests passing ✓
- Security audit complete ✓
- Team ready ✓
- Monitoring ready ✓
- No blockers ✓

**Decision:** [ ] GO / [ ] NO-GO

---

### Deployment Execution (Afternoon)

#### Step 4: Pre-Deployment Safety Check

```bash
# Create and run pre-deployment check
cat > scripts/mainnet-pre-check.js << 'EOF'
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 MAINNET PRE-DEPLOYMENT SAFETY CHECK\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════");
  console.log("DEPLOYMENT ACCOUNT");
  console.log("═══════════════════════════════════════");
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  console.log("═══════════════════════════════════════");
  console.log("NETWORK VERIFICATION");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("");

  // Verify sufficient balance
  if (balance < ethers.parseEther("0.1")) {
    console.log("❌ CRITICAL: Insufficient balance!");
    console.log("Required: At least 0.1 ETH");
    console.log("Current:", ethers.formatEther(balance), "ETH");
    process.exit(1);
  }

  // Verify correct network
  const EXPECTED_CHAIN_ID = 32323n; // BasedAI mainnet
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    console.log("❌ CRITICAL: Wrong network!");
    console.log("Expected Chain ID:", EXPECTED_CHAIN_ID);
    console.log("Current Chain ID:", network.chainId);
    process.exit(1);
  }

  console.log("✅ Balance sufficient");
  console.log("✅ Network verified");
  console.log("");

  // Verify NFT contract exists
  const NFT_ADDRESS = "0x40B6184b901334C0A88f528c1A0a1de7a77490f1";
  const nftCode = await ethers.provider.getCode(NFT_ADDRESS);

  if (nftCode === "0x" || nftCode === "0x0") {
    console.log("❌ CRITICAL: NFT contract not found!");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════");
  console.log("NFT CONTRACT VERIFICATION");
  console.log("═══════════════════════════════════════");
  console.log("Address:", NFT_ADDRESS);
  console.log("Code Size:", (nftCode.length - 2) / 2, "bytes");
  console.log("✅ NFT contract verified");
  console.log("");

  console.log("═══════════════════════════════════════");
  console.log("🎯 ALL SAFETY CHECKS PASSED");
  console.log("═══════════════════════════════════════");
  console.log("");
  console.log("Ready to deploy to MAINNET");
  console.log("");
  console.log("⚠️  FINAL CONFIRMATION REQUIRED ⚠️");
  console.log("");
  console.log("Type 'yes' to proceed with mainnet deployment:");
}

main().catch(console.error);
EOF

# Run safety check
npx hardhat run scripts/mainnet-pre-check.js --network basedMainnet
```

**Manual Verification:**
- [ ] Deployment account balance confirmed
- [ ] Chain ID verified (BasedAI mainnet)
- [ ] NFT contract exists and verified
- [ ] Team confirms GO

#### Step 5: Execute Mainnet Deployment

**CRITICAL: This step deploys to MAINNET with REAL ASSETS.**

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy-staking-4200.js --network basedMainnet

# WATCH CAREFULLY:
# - Transaction hash
# - Contract address
# - Gas used
# - Any errors
```

**During Deployment:**
1. **Do not interrupt** the process
2. **Save all output** to a log file
3. **Note transaction hash** immediately
4. **Watch block explorer** for confirmation
5. **Wait for confirmations** (3-6 blocks recommended)

**Expected Output:**
```
🚀 DEPLOYING EnhancedNFTStaking (4,200 NFTs)

📋 Step 1: Pre-Deployment Validation
✅ Deployer Address: 0x...
✅ Deployer Balance: X.XX ETH
✅ Network: basedMainnet (Chain ID: 32323)
✅ Current Block: XXXXXX
✅ KEKTECH NFT Contract Verified: 0x40B6...

📋 Step 2: Deploying EnhancedNFTStaking Contract
✅ Contract Factory Created
⏳ Deploying contract...
⏳ Waiting for deployment confirmation...
✅ Contract Deployed: 0x[NEW_ADDRESS]

📋 Step 3: Deployment Verification
✅ Contract Code Verified
✅ NFT Contract Reference: 0x40B6...

📋 Step 4: Post-Deployment Testing
✅ All boundary tests passed
✅ Invalid tokens rejected
✅ Rarity multipliers correct
✅ Initial state verified

📋 Step 5: Saving Deployment Information
✅ Deployment info saved: staking-4200-basedMainnet-[timestamp].json

🎉 DEPLOYMENT SUCCESSFUL!
```

**Immediate Actions:**
1. **Copy contract address** to safe location
2. **Verify transaction** on block explorer
3. **Save deployment artifact**
4. **Notify team** in chat
5. **Begin post-deployment validation**

**Checklist:**
- [ ] Deployment transaction confirmed
- [ ] Contract address saved
- [ ] Deployment artifact saved
- [ ] Team notified
- [ ] Block explorer shows contract

#### Step 6: Immediate Post-Deployment Validation

```bash
# Run validation immediately
npx hardhat run scripts/validate-staking-deployment.js --network basedMainnet

# Expected: 22/22 tests passing
```

**Critical Validations:**
- [ ] All 10 boundary tests passing
- [ ] Invalid tokens rejected (4200, 9999)
- [ ] Rarity multipliers correct (1x-5x)
- [ ] Voting power calculations correct
- [ ] Initial state correct (0 staked, 0 VP)
- [ ] NFT contract reference correct
- [ ] Owner is deployer or multisig

**If ANY validation fails:**
1. **PAUSE deployment** process
2. **DO NOT announce** to community
3. **Investigate immediately**
4. **Consult team**
5. **Consider pause contract** if critical

#### Step 7: Contract Verification on Block Explorer

```bash
# Verify contract source code
npx hardhat verify --network basedMainnet \
  [CONTRACT_ADDRESS] \
  "0x40B6184b901334C0A88f528c1A0a1de7a77490f1"

# Example:
# npx hardhat verify --network basedMainnet \
#   0x123... \
#   "0x40B6184b901334C0A88f528c1A0a1de7a77490f1"
```

**Verification Steps:**
1. Contract source uploaded
2. Compiler settings match
3. Constructor arguments correct
4. Verification successful
5. Contract readable on explorer

**Checklist:**
- [ ] Source code verified
- [ ] Constructor args correct
- [ ] Read functions work
- [ ] Write functions visible
- [ ] Events documented

#### Step 8: Transfer Ownership to Multisig

**CRITICAL: Only do this after ALL validations pass!**

```javascript
// scripts/transfer-ownership.js
const { ethers } = require("hardhat");

async function main() {
  const STAKING_ADDRESS = "YOUR_DEPLOYED_CONTRACT";
  const MULTISIG_ADDRESS = "YOUR_GNOSIS_SAFE";

  console.log("\n⚠️  TRANSFERRING OWNERSHIP TO MULTISIG\n");
  console.log("Contract:", STAKING_ADDRESS);
  console.log("Multisig:", MULTISIG_ADDRESS);
  console.log("");

  const staking = await ethers.getContractAt("EnhancedNFTStaking", STAKING_ADDRESS);

  // Verify current owner
  const currentOwner = await staking.owner();
  console.log("Current Owner:", currentOwner);

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("❌ ERROR: You are not the current owner!");
    process.exit(1);
  }

  // Transfer ownership
  console.log("\n🔄 Transferring ownership...");
  const tx = await staking.transferOwnership(MULTISIG_ADDRESS);
  console.log("TX Hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Ownership transferred at block", receipt.blockNumber);

  // Verify new owner
  const newOwner = await staking.owner();
  console.log("\nNew Owner:", newOwner);

  if (newOwner.toLowerCase() === MULTISIG_ADDRESS.toLowerCase()) {
    console.log("✅ Ownership transfer verified!");
  } else {
    console.log("❌ ERROR: Ownership transfer failed!");
  }
}

main().catch(console.error);
```

**Run transfer:**
```bash
# Update addresses in script first!
# Then execute:
npx hardhat run scripts/transfer-ownership.js --network basedMainnet
```

**Checklist:**
- [ ] Multisig address verified
- [ ] Transfer transaction confirmed
- [ ] New owner verified
- [ ] Test transaction from multisig
- [ ] Deployment account no longer owner

---

### Post-Deployment (Immediately After)

#### Step 9: Start Monitoring

```bash
# Terminal 1: Live event monitoring
npx hardhat run scripts/monitor-live.js --network basedMainnet

# Terminal 2: Health checks (run every 15 min)
watch -n 900 'npx hardhat run scripts/health-check-automated.js --network basedMainnet'

# Terminal 3: Metrics collection (run every hour)
watch -n 3600 'npx hardhat run scripts/collect-metrics.js --network basedMainnet'
```

**Monitoring Setup:**
- [ ] Event monitoring active
- [ ] Health checks running
- [ ] Metrics collection scheduled
- [ ] Alerts configured
- [ ] Team watching

#### Step 10: Documentation & Communication

**Update Documentation:**

```markdown
# deployments/MAINNET_DEPLOYMENT.md

## BasedAI Mainnet Deployment

**Date:** [DATE]
**Deployer:** [ADDRESS]
**Multisig:** [ADDRESS]
**Network:** BasedAI Mainnet (Chain ID: 32323)

### Contract Addresses
- **Staking Contract:** 0x...
- **NFT Contract:** 0x40B6184b901334C0A88f528c1A0a1de7a77490f1

### Deployment Transaction
- **Hash:** 0x...
- **Block:** [BLOCK_NUMBER]
- **Gas Used:** [GAS_USED]
- **Cost:** [ETH_COST] ETH

### Ownership Transfer
- **TX Hash:** 0x...
- **Block:** [BLOCK_NUMBER]
- **New Owner (Multisig):** 0x...

### Verification
- **Block Explorer:** [EXPLORER_URL]
- **Verified:** YES
- **Verification TX:** [TX_HASH]

### Post-Deployment Validation
- [x] 22/22 validation tests passed
- [x] Contract verified on explorer
- [x] Ownership transferred to multisig
- [x] Monitoring active
- [x] Team notified
```

**Community Communication:**

```markdown
# Announcement Template

🎉 **EnhancedNFTStaking Contract Deployed!**

We're excited to announce the successful deployment of the Enhanced NFT Staking contract to BasedAI mainnet!

**Contract Address:** 0x...

**Key Features:**
- Stake your KEKTECH NFTs (4,200 total supply)
- Earn voting power based on rarity
- Deterministic rarity system (gas efficient!)
- Secure, audited, and tested

**Rarity Distribution:**
- Common (0-2939): 2,940 NFTs (70%) = 1x VP
- Uncommon (2940-3569): 630 NFTs (15%) = 2x VP
- Rare (3570-3779): 210 NFTs (5%) = 3x VP
- Epic (3780-4109): 330 NFTs (7.86%) = 4x VP
- Legendary (4110-4199): 90 NFTs (2.14%) = 5x VP

**Getting Started:**
1. Approve the staking contract
2. Stake your NFTs
3. Earn voting power!

**Important:**
- 24-hour minimum staking period
- Emergency unstake always available
- Contract is paused (will be unpaused after monitoring period)

**Security:**
- Thoroughly tested (54 tests, 100% passing)
- Deployed to testnet first
- Ownership transferred to multisig
- 24/7 monitoring active

**Links:**
- Contract: [EXPLORER_LINK]
- Documentation: [DOCS_LINK]
- Discord: [DISCORD_LINK]

Questions? Join our Discord!
```

**Checklist:**
- [ ] Deployment documentation updated
- [ ] Frontend config updated
- [ ] Community announcement prepared
- [ ] Social media posts scheduled
- [ ] Discord/Telegram updated
- [ ] Status page updated

---

## 📊 First 24 Hours - Intensive Monitoring

### Hour 0-6 (Critical Period)

**Team Coverage:**
- Deployment lead: Available
- Security lead: Monitoring
- Operations: Watching metrics
- Communications: Ready to respond

**Monitoring:**
- [ ] Event monitoring active
- [ ] No unexpected events
- [ ] Health checks passing
- [ ] Gas costs normal
- [ ] No errors in logs

**Actions:**
- Watch every transaction
- Note any anomalies
- Respond to questions
- Document everything

### Hour 6-24 (Active Monitoring)

**Reduced but Active Coverage:**
- On-call rotation established
- Regular check-ins (every 2-4 hours)
- Alert system active
- Team available if needed

**Checklist:**
- [ ] No critical issues
- [ ] First stakes successful
- [ ] Gas costs acceptable
- [ ] User feedback positive
- [ ] Metrics trending normally

---

## 🚨 Emergency Procedures

### If Critical Issue Detected

**Immediate Actions:**

1. **Pause Contract** (if needed)
```javascript
// Via multisig
await staking.pause();
```

2. **Notify Team**
   - Post in emergency channel
   - All hands on deck
   - Activate incident response

3. **Investigate**
   - Gather facts
   - Analyze transactions
   - Identify root cause

4. **Communicate**
   - Update status page
   - Post in community channels
   - Explain situation honestly

5. **Resolve**
   - Implement fix if possible
   - Deploy new version if needed
   - Migrate users if necessary

### Rollback Plan

**If deployment fails catastrophically:**

1. **Contract has pause** - Can pause to stop operations
2. **Users can always exit** - Emergency unstake available
3. **No funds trapped** - All NFTs can be unstaked
4. **New deployment** - Can deploy fixed version
5. **Migration process** - Users unstake from V1, stake in V2

---

## ✅ Success Criteria

**Deployment is successful when:**

- [ ] Contract deployed to mainnet
- [ ] All validation tests passing (22/22)
- [ ] Contract verified on explorer
- [ ] Ownership transferred to multisig
- [ ] Monitoring active and healthy
- [ ] No critical issues (24 hours)
- [ ] First stakes successful
- [ ] Gas costs as expected
- [ ] User feedback positive
- [ ] Team comfortable with operations

---

## 📋 Post-Launch Checklist (Week 1)

### Daily Tasks

- [ ] Morning health check
- [ ] Review overnight alerts
- [ ] Check metrics
- [ ] Monitor social channels
- [ ] Update status page

### End of Week 1

- [ ] Generate weekly report
- [ ] Review all incidents
- [ ] Update documentation
- [ ] Team retro meeting
- [ ] Plan next steps

---

## 🎓 Lessons Learned Template

**Complete after first week:**

```markdown
## Mainnet Deployment - Lessons Learned

### What Went Well
- [List successes]

### What Could Be Improved
- [List improvements]

### Action Items
- [List follow-ups]

### Recommendations for Future
- [List recommendations]
```

---

## 📞 Emergency Contacts

**Deployment Day Team:**
- Deployment Lead: [NAME] - [CONTACT]
- Security Lead: [NAME] - [CONTACT]
- Operations Lead: [NAME] - [CONTACT]
- Communications: [NAME] - [CONTACT]

**Escalation:**
- CTO: [NAME] - [CONTACT]
- CEO: [NAME] - [CONTACT]

**External:**
- Auditor: [CONTACT]
- Legal: [CONTACT]

---

**Status:** Ready for mainnet deployment
**Risk:** HIGH (managed with procedures)
**Next:** Execute when ready

⚠️  **MAINNET DEPLOYMENT - HANDLE WITH CARE** ⚠️

