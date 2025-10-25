# 🛡️ ULTRA-CAUTIOUS MAINNET DEPLOYMENT GUIDE

**Strategy:** Hybrid Approach with MAXIMUM CAUTION on Mainnet
**Timeline:** 16 days total (4 days testnet + 7 days mainnet restricted + 5 days gradual launch)
**Philosophy:** "SLOW IS SMOOTH, SMOOTH IS FAST" - Every step verified before proceeding
**Status:** Ready to Execute

---

## 🎯 DEPLOYMENT PHILOSOPHY

### **CORE PRINCIPLES:**

1. **VERIFY EVERYTHING** - Never assume, always check
2. **ONE STEP AT A TIME** - Complete each step before moving forward
3. **CHECKPOINT GATES** - Mandatory verification before proceeding
4. **DOCUMENT EVERYTHING** - Log every action, every result
5. **TEAM APPROVAL** - Get team confirmation at key decision points
6. **EMERGENCY READY** - Know how to pause/rollback at every moment

### **MAINNET SAFETY RULES:**

```
🔴 NEVER rush on mainnet
🔴 NEVER skip verification steps
🔴 NEVER proceed with warnings/errors
🔴 ALWAYS have emergency pause ready
🔴 ALWAYS backup before changes
🔴 ALWAYS test on testnet first
```

---

## 📅 COMPLETE TIMELINE OVERVIEW

```
╔════════════════════════════════════════════════════════════╗
║  PHASE 1: COMMUNITY TESTING (Days 1-4)                    ║
║  Location: Sepolia Testnet                                 ║
║  Risk: ZERO (testnet only)                                 ║
║  Cost: $0                                                   ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║  PHASE 2: MAINNET RESTRICTED (Days 5-11) ⚠️ REAL MONEY    ║
║  Location: Mainnet                                          ║
║  Risk: MINIMAL (restricted params + monitoring)            ║
║  Cost: $2,500-5,000                                         ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║  PHASE 3: GRADUAL LAUNCH (Days 12-16)                     ║
║  Location: Mainnet                                          ║
║  Risk: LOW (proven system)                                 ║
║  Cost: Minimal                                              ║
╚════════════════════════════════════════════════════════════╝
```

---

# 📋 PHASE 1: COMMUNITY TESTING (Days 1-4)

**Location:** Sepolia Testnet (Already Deployed!)
**Risk Level:** ZERO (testnet only)
**Your Status:** ✅ 100% Validation Complete

## Day 1: Community Tester Onboarding

### **Hour 1-2: Create Testing Guide**

**STEP 1.1: Create Testing Document**
```bash
# Create testing guide for community
# This explains how testers will interact with your system
```

**What to Include:**
1. Welcome & overview
2. How to get Sepolia ETH
3. How to get test BASED tokens
4. Step-by-step testing scenarios
5. How to report issues
6. FAQ

**Time Estimate:** 1-2 hours
**Deliverable:** Testing guide document

---

### **Hour 3-4: Set Up Token Faucet**

**STEP 1.2: Create Distribution Script**
```bash
# You need to distribute test tokens to community members
# Two options:

# Option A: Manual distribution (simple)
# - Keep list of tester addresses
# - Manually send tokens using Metamask

# Option B: Automated faucet (better)
# - Create simple smart contract faucet
# - Users claim tokens themselves
```

**Recommended: Manual Distribution (simpler, more control)**

**Time Estimate:** 1-2 hours
**Deliverable:** Distribution method ready

---

### **Hour 5-6: Invite Testers**

**STEP 1.3: Recruit Community**
```bash
# Target: 10-20 trusted community members

# Where to find testers:
# - Your Discord/Telegram
# - Twitter followers
# - Previous users
# - Crypto communities
# - Friends in crypto
```

**Tester Criteria:**
- ✅ Trustworthy
- ✅ Active in crypto
- ✅ Willing to test thoroughly
- ✅ Can provide feedback
- ✅ Available for 2-3 days

**Time Estimate:** 1-2 hours
**Deliverable:** 10-20 confirmed testers

---

### **Hour 7-8: Distribute Resources**

**STEP 1.4: Give Testers Everything They Need**
```bash
# Each tester needs:
1. Sepolia ETH (0.1 ETH) - for gas
2. BASED tokens (1,000 BASED) - for testing
3. TECH tokens (500 TECH) - for rewards testing
4. NFTs (5 NFTs) - for staking testing
5. Testing guide document
6. Feedback form link
```

**Distribution Checklist:**
- [ ] Get tester wallet addresses
- [ ] Send Sepolia ETH to each
- [ ] Send BASED tokens
- [ ] Send TECH tokens
- [ ] Mint NFTs and send
- [ ] Share testing guide
- [ ] Provide feedback form

**Time Estimate:** 1-2 hours
**Deliverable:** All testers have resources

---

**DAY 1 CHECKPOINT:**
```
✅ Testing guide created
✅ Distribution method ready
✅ 10-20 testers confirmed
✅ All testers have resources
✅ Feedback system ready

🎯 READY FOR DAY 2: TESTING BEGINS
```

---

## Days 2-3: Guided Testing Scenarios

### **Testing Scenario 1: Prediction Market Lifecycle** (2-3 hours)

**STEP 2.1: Create Test Market**
```javascript
// Testers will create markets and place bets

Test Steps:
1. Connect wallet to Sepolia
2. Go to market creation page
3. Create a simple YES/NO market
   Question: "Will Bitcoin reach $100k by end of year?"
4. Set betting period: 1 day
5. Submit transaction
6. Verify market created
```

**What You Monitor:**
- Market creation successful? ✅
- Gas costs reasonable? ✅
- UI/UX working? ✅
- Any errors? ❌

---

**STEP 2.2: Place Bets**
```javascript
Test Steps:
1. Find created market
2. Place bet on YES (100 BASED)
3. Confirm transaction
4. Verify bet recorded
5. Check balance reduced correctly
```

**What You Monitor:**
- Bets placing successfully? ✅
- Balance updates correct? ✅
- Gas costs reasonable? ✅
- Any transaction failures? ❌

---

**STEP 2.3: Market Resolution**
```javascript
Test Steps:
1. Wait for betting period to end
2. Propose resolution (YES wins)
3. Wait for dispute period
4. Finalize resolution
5. Claim winnings
6. Verify correct payout
```

**What You Monitor:**
- Resolution working? ✅
- Payouts correct? ✅
- No stuck funds? ✅
- Users happy? ✅

**Success Criteria:**
- ✅ 5+ markets created successfully
- ✅ 50+ bets placed successfully
- ✅ 3+ markets fully resolved
- ✅ All payouts correct
- ✅ Zero stuck funds
- ✅ Gas costs <$10 per operation (testnet simulation)

---

### **Testing Scenario 2: NFT Staking & Governance** (1-2 hours)

**STEP 2.4: Stake NFTs**
```javascript
Test Steps:
1. View owned NFTs
2. Select NFT to stake
3. Approve NFT transfer
4. Stake NFT
5. Verify voting power increased
```

**What You Monitor:**
- Staking successful? ✅
- Voting power calculated correctly? ✅
- Rarity multipliers working? ✅
- Gas costs reasonable? ✅

---

**STEP 2.5: Vote on Proposal**
```javascript
Test Steps:
1. Create governance proposal (or vote on existing)
2. Vote with staked voting power
3. Wait for voting period
4. Execute proposal if passed
5. Verify proposal executed
```

**What You Monitor:**
- Voting working? ✅
- Voting power counted? ✅
- Proposal execution successful? ✅
- No issues? ✅

---

**STEP 2.6: Unstake NFTs**
```javascript
Test Steps:
1. Wait for minimum stake period (24 hours)
2. Unstake NFT
3. Verify NFT returned
4. Verify voting power reduced
```

**Success Criteria:**
- ✅ 10+ NFTs staked
- ✅ Voting power correct
- ✅ 3+ proposals created/voted
- ✅ All unstaking successful
- ✅ Zero stuck NFTs

---

### **Testing Scenario 3: Merkle Rewards** (1 hour)

**STEP 2.7: Claim Rewards**
```javascript
Test Steps:
1. Generate reward distribution
2. Generate Merkle proofs
3. Claim rewards (single)
4. Try double-claim (should fail)
5. Claim rewards (batch)
```

**Success Criteria:**
- ✅ Reward claims successful
- ✅ Double-claim prevented
- ✅ Gas costs reasonable (~47K)
- ✅ Both BASED and TECH work

---

**DAYS 2-3 CHECKPOINT:**
```
Metrics Achieved:
- Testers: ___/20
- Transactions: ___/100+
- Markets created: ___/5+
- Bets placed: ___/50+
- NFTs staked: ___/10+
- Proposals: ___/3+
- Issues found: ___

✅ All core flows working
✅ No critical bugs
✅ Gas costs reasonable
✅ Positive feedback

🎯 READY FOR DAY 4: ANALYSIS
```

---

## Day 4: Feedback Analysis & GO/NO-GO Decision

### **Hour 1-4: Collect & Analyze Feedback**

**STEP 4.1: Gather All Feedback**
```bash
# Collect from:
- Feedback forms
- Discord/Telegram messages
- Direct tester communication
- Transaction logs
- Error logs
```

**Categorize Issues:**
```
CRITICAL (Must fix before mainnet):
- [ ] Fund loss bugs
- [ ] Security vulnerabilities
- [ ] Contract errors

HIGH (Should fix):
- [ ] UX/UI issues
- [ ] Gas optimization
- [ ] Feature improvements

MEDIUM (Nice to have):
- [ ] Documentation updates
- [ ] Minor improvements

LOW (Can defer):
- [ ] Cosmetic issues
- [ ] Future features
```

---

**STEP 4.2: Calculate Success Metrics**
```bash
Community Testing Results:

Testers: ___/20 (target: 10+)
Transactions: ___/100+ (target: 100+)
Markets: ___/5+ (target: 5+)
Bets: ___/50+ (target: 50+)
Success Rate: ___%

Critical Bugs: ___ (target: 0)
High Bugs: ___ (target: <3)
User Satisfaction: ___/10 (target: >8)

Gas Costs (simulated):
- Market Creation: ___ gas
- Place Bet: ___ gas
- Claim Winnings: ___ gas
- Stake NFT: ___ gas
- Vote: ___ gas
```

---

### **Hour 5-8: GO/NO-GO DECISION** 🚨

**CRITICAL DECISION POINT:**

```
╔════════════════════════════════════════════════════════╗
║  GO/NO-GO CRITERIA FOR MAINNET                        ║
╚════════════════════════════════════════════════════════╝

✅ MUST HAVE (GO CRITERIA):
- [ ] Zero critical bugs
- [ ] All core flows working
- [ ] 10+ successful testers
- [ ] 100+ successful transactions
- [ ] User satisfaction >8/10
- [ ] Gas costs reasonable (<$10/op at current prices)
- [ ] No fund loss scenarios
- [ ] All security checks passed
- [ ] Emergency pause tested and working
- [ ] Team unanimous GO decision

❌ NO-GO TRIGGERS:
- [ ] Any critical bug found
- [ ] Fund loss possible
- [ ] Security vulnerability
- [ ] Core flow broken
- [ ] User satisfaction <7/10
- [ ] Unexplained errors
- [ ] Team member has concerns

⚠️ BORDERLINE (EXTEND TESTING):
- [ ] Minor bugs remaining
- [ ] User feedback mixed
- [ ] Need more data
- [ ] Team split on decision
```

---

**STEP 4.3: Make Decision**

**IF GO:** ✅
```bash
✅ All criteria met
✅ Team unanimous GO
✅ No concerns remaining
✅ Ready for mainnet preparation

NEXT: Begin Phase 2 preparation
```

**IF NO-GO:** ❌
```bash
❌ Critical issues found
❌ Must fix before mainnet

ACTION PLAN:
1. Document all issues
2. Prioritize fixes
3. Implement fixes
4. Re-test on Sepolia
5. Restart Day 4 evaluation
```

**IF EXTEND:** ⚠️
```bash
⚠️ Need more data
⚠️ Minor concerns

ACTION PLAN:
1. Extend testing 2-3 more days
2. Focus on specific areas
3. Collect more data
4. Reconvene for decision
```

---

**DAY 4 FINAL CHECKPOINT:**
```
DECISION: [ GO / NO-GO / EXTEND ]

IF GO:
✅ Community testing successful
✅ All criteria met
✅ Team ready
✅ Emergency procedures ready
✅ Monitoring ready

🎯 PROCEED TO PHASE 2: MAINNET RESTRICTED
   (ULTRA-CAUTIOUS MODE ACTIVATED)
```

---

# 🚨 PHASE 2: MAINNET RESTRICTED MODE (Days 5-11)

**⚠️ WARNING: REAL MONEY FROM HERE ⚠️**
**Location:** Mainnet (BASED Chain or your target chain)
**Risk Level:** MINIMAL (with restrictions)
**Cost:** $2,500-5,000

## 🛡️ ULTRA-CAUTIOUS MAINNET RULES

```
╔════════════════════════════════════════════════════════════╗
║  🔴 CRITICAL: MAINNET SAFETY PROTOCOL                     ║
╚════════════════════════════════════════════════════════════╝

1. NEVER rush - take your time
2. VERIFY every single step
3. CHECK balances before and after
4. DOCUMENT everything
5. HAVE emergency pause ready at ALL times
6. GET team approval before proceeding
7. MONITOR continuously
8. STOP immediately if anything seems wrong
9. ASK questions if unsure
10. BACKUP all data before changes
```

---

## Day 5: Mainnet Pre-Deployment Preparation

### **CRITICAL PRE-FLIGHT CHECKLIST** (ALL MUST BE ✅)

```
╔════════════════════════════════════════════════════════════╗
║  MANDATORY CHECKS BEFORE MAINNET DEPLOYMENT              ║
╚════════════════════════════════════════════════════════════╝

CODE VERIFICATION:
- [ ] Community testing completed successfully
- [ ] All critical bugs fixed
- [ ] All tests passing (100%)
- [ ] Code reviewed by team
- [ ] Contracts compile without warnings
- [ ] No last-minute changes

WALLET PREPARATION:
- [ ] Deployment wallet created (DEDICATED wallet!)
- [ ] Deployment wallet funded (1-2 ETH worth)
- [ ] Backup wallet created and funded
- [ ] Seed phrases backed up securely (OFFLINE!)
- [ ] Private keys secured (NEVER share!)
- [ ] Test transactions on mainnet successful

ENVIRONMENT SETUP:
- [ ] .env file configured for mainnet
- [ ] RPC endpoints working (test with curl)
- [ ] Block explorer API key working
- [ ] Gas price oracle configured
- [ ] Network chain ID correct

TEAM READINESS:
- [ ] All team members briefed
- [ ] Roles assigned (who does what)
- [ ] Emergency contacts confirmed
- [ ] 24/7 on-call schedule set
- [ ] Communication channels ready (Discord/Telegram)
- [ ] Team available for 4-6 hours (deployment window)

TOOLS & MONITORING:
- [ ] Tenderly/Defender configured
- [ ] Alert system tested
- [ ] Health check script tested
- [ ] Emergency pause script tested
- [ ] Monitoring dashboard ready

DOCUMENTATION:
- [ ] Deployment checklist printed/ready
- [ ] Emergency procedures accessible
- [ ] Contract addresses template ready
- [ ] Announcement draft prepared
- [ ] Post-deployment tasks listed

RISK MITIGATION:
- [ ] Restricted mode parameters confirmed
- [ ] Emergency pause tested on testnet
- [ ] Rollback plan documented
- [ ] Insurance/fund protection considered
- [ ] Legal/compliance checked (if applicable)

FINAL VERIFICATIONS:
- [ ] Double-check all contract addresses
- [ ] Triple-check all parameters
- [ ] Verify gas settings reasonable
- [ ] Confirm chain ID matches
- [ ] Team unanimous GO decision
```

---

**⚠️ STOP: DO NOT PROCEED UNTIL ALL CHECKBOXES ARE ✅**

**If ANY checkbox is unchecked:**
1. STOP deployment
2. Fix the issue
3. Get team confirmation
4. Return to checklist
5. Only proceed when 100% ready

---

### **Hour 1-2: Final Environment Setup**

**STEP 5.1: Configure Mainnet Environment**

```bash
# 1. Copy mainnet environment template
cp .env.example .env.mainnet

# 2. Edit with EXTREME care
nano .env.mainnet
```

**Critical .env Configuration:**
```bash
# Network
NETWORK=mainnet  # or "based" if using Based chain
CHAIN_ID=_____ # VERIFY THIS MATCHES YOUR CHAIN!

# Deployer (DEDICATED wallet!)
PRIVATE_KEY=your_deployer_private_key_here  # NEVER commit!

# RPC Endpoint
RPC_URL=https://your-mainnet-rpc-endpoint

# Block Explorer
ETHERSCAN_API_KEY=your_etherscan_api_key
BLOCK_EXPLORER_URL=https://explorer.yourchain.com

# Restricted Mode Parameters
MAX_BET_PER_USER=100000000000000000000  # 100 BASED
MAX_MARKET_SIZE=10000000000000000000000  # 10,000 BASED
MIN_MARKET_DURATION=86400  # 24 hours
MAX_MARKET_DURATION=604800  # 7 days

# Whitelisting
REQUIRE_WHITELIST=true
WHITELISTED_CREATORS=0xAddress1,0xAddress2,0xAddress3

# Emergency
EMERGENCY_PAUSER=your_deployer_address
EMERGENCY_CONTACT=your_telegram_or_phone

# Monitoring
TENDERLY_PROJECT=your_project
DEFENDER_API_KEY=your_key
```

---

**STEP 5.2: Verify RPC Connection**

```bash
# Test RPC endpoint
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return latest block number
# Example: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

**✅ CHECKPOINT: RPC working?**
- [ ] YES - Proceed
- [ ] NO - Fix RPC endpoint, test again

---

**STEP 5.3: Check Deployment Wallet Balance**

```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network mainnet

# Expected output:
# Deployer: 0x...
# Balance: 1.5 ETH (or equivalent)
# Status: ✅ Sufficient for deployment
```

**✅ CHECKPOINT: Balance sufficient?**
- [ ] YES (>1 ETH equivalent) - Proceed
- [ ] NO - Fund wallet, check again

**⚠️ IMPORTANT:**
- Keep 50%+ balance after deployment
- Need funds for operations
- Don't deploy if balance too low

---

**STEP 5.4: Test Transaction on Mainnet**

```bash
# Send tiny test transaction (0.001 ETH to yourself)
# This verifies:
# - Private key works
# - RPC connection works
# - Gas settings work
# - Signatures work

# Use Metamask or script:
npx hardhat run scripts/test-transaction.js --network mainnet
```

**✅ CHECKPOINT: Test transaction successful?**
- [ ] YES - Proceed
- [ ] NO - Debug issue, try again

---

### **Hour 3-4: Create Deployment Script with Verification**

**STEP 5.5: Prepare Mainnet Deployment Script**

```bash
# We already have deployment scripts from Sepolia
# Copy and modify for mainnet:

cp scripts/deploy-phase1-sepolia.js scripts/deploy-phase1-mainnet.js
cp scripts/deploy-phase2-sepolia.js scripts/deploy-phase2-mainnet.js

# Modify for mainnet parameters
nano scripts/deploy-phase1-mainnet.js
```

**Key Modifications for Mainnet:**
```javascript
// Add extra verification steps
// Add gas price limits
// Add balance checks
// Add emergency pause testing
// Add restricted mode parameter setting
// Add confirmation prompts
```

---

**STEP 5.6: Dry Run (Simulation)**

```bash
# Simulate deployment (doesn't actually deploy)
# This checks:
# - Gas estimates
# - Contract compilation
# - Constructor arguments
# - Deployment sequence

npx hardhat run scripts/deploy-phase1-mainnet.js --network hardhat

# Review output carefully:
# - Estimated gas costs
# - Constructor arguments
# - Deployment order
# - Any warnings/errors
```

**✅ CHECKPOINT: Dry run successful?**
- [ ] YES - Review output, confirm reasonable
- [ ] NO - Fix issues, run again

---

### **Hour 5-6: Final Team Review**

**STEP 5.7: Team Sync Meeting**

**Agenda:**
1. Review community testing results
2. Review pre-deployment checklist (all ✅?)
3. Review deployment plan step-by-step
4. Assign roles:
   - Deployer (runs scripts)
   - Verifier (checks each step)
   - Monitor (watches transactions)
   - Documenter (records everything)
   - Emergency (ready to pause if needed)
5. Review emergency procedures
6. Set deployment time window
7. Final GO/NO-GO vote

**✅ CHECKPOINT: Team unanimous GO?**
- [ ] YES - Proceed to Day 6 deployment
- [ ] NO - Address concerns, reconvene
- [ ] DELAY - Schedule new deployment time

---

**DAY 5 FINAL CHECKPOINT:**
```
Pre-Deployment Complete:
✅ All checklist items verified
✅ Environment configured
✅ RPC tested
✅ Wallet funded
✅ Test transaction successful
✅ Deployment scripts ready
✅ Dry run successful
✅ Team briefed and ready
✅ Emergency procedures ready
✅ Roles assigned

🎯 READY FOR DAY 6: MAINNET DEPLOYMENT
   (Set specific time: ___:___ on ___/___/___)
```

---

## Day 6: MAINNET DEPLOYMENT (D-DAY) 🚀

**⚠️ CRITICAL DAY ⚠️**
**Time Required:** 4-6 hours (don't rush!)
**Team:** All hands on deck
**Status:** ULTRA-CAUTIOUS MODE

### **PRE-DEPLOYMENT FINAL CHECK (30 minutes before)**

```bash
╔════════════════════════════════════════════════════════════╗
║  FINAL GO/NO-GO CHECK - 30 MINUTES BEFORE DEPLOYMENT     ║
╚════════════════════════════════════════════════════════════╝

ENVIRONMENT:
- [ ] .env.mainnet configured
- [ ] RPC endpoint working (test NOW)
- [ ] Block explorer accessible
- [ ] Gas prices reasonable (check now)

TEAM:
- [ ] All team members present
- [ ] Roles confirmed
- [ ] Communication channels open
- [ ] Emergency procedures ready

WALLET:
- [ ] Balance confirmed (check NOW)
- [ ] Test transaction works
- [ ] Backup wallet ready

EXTERNAL:
- [ ] Network not congested
- [ ] Gas prices not spiking
- [ ] No major news/events
- [ ] Community aware (if announcing)

MENTAL:
- [ ] Team rested and focused
- [ ] No distractions
- [ ] Calm and ready
- [ ] Emergency contacts ready

ALL ✅? → PROCEED
ANY ❌? → DELAY, FIX, RECONVENE
```

---

### **🚀 DEPLOYMENT SEQUENCE - PHASE 1 (Core System)**

**⏱️ Estimated Time:** 2-3 hours
**💰 Estimated Cost:** $1,000-2,500

---

#### **STEP 6.1: Deploy BASED Token** (Production Token!)

```bash
# ⚠️ CRITICAL: This is the REAL token, not MockERC20!

echo "🚨 DEPLOYING BASED TOKEN TO MAINNET"
echo "Team ready? (yes/no)"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

npx hardhat run scripts/deploy-based-token-mainnet.js --network mainnet
```

**What Happens:**
1. Compiles BASED token contract
2. Estimates gas
3. Prompts for confirmation
4. Deploys contract
5. Waits for confirmation
6. Returns contract address

**Expected Output:**
```
Deploying BASED Token...
Gas Estimate: ~2,500,000 gas
Gas Price: 25 gwei
Total Cost: ~0.0625 ETH (~$125)

Confirm deployment? (yes/no): yes

Deploying... TX: 0x...
Waiting for confirmation...
✅ Deployed to: 0xBASED_TOKEN_ADDRESS

Verifying on block explorer...
✅ Verified!
```

---

**✅ CHECKPOINT 6.1: BASED Token Deployed**

**MANDATORY VERIFICATION:**
```bash
# 1. Check contract on block explorer
# Go to: https://explorer.yourchain.com/address/0xBASED_TOKEN_ADDRESS

Verify:
- [ ] Contract deployed (has code)
- [ ] Contract verified (green checkmark)
- [ ] Name: "BASED Token" (or your token name)
- [ ] Symbol: "BASED"
- [ ] Decimals: 18
- [ ] Total Supply: ______ (your initial supply)

# 2. Check token balance
npx hardhat run scripts/check-token-balance.js --network mainnet --address 0xBASED_TOKEN_ADDRESS

Expected:
- Deployer balance: [Initial Supply]
- Total Supply: [Initial Supply]

# 3. Test token transfer
npx hardhat run scripts/test-token-transfer.js --network mainnet --token 0xBASED_TOKEN_ADDRESS --amount 1

Expected:
- ✅ Transfer successful
- ✅ Balance updated
```

**✅ ALL CHECKS PASS?**
- [ ] YES - Record address, proceed to next
- [ ] NO - STOP, investigate, DO NOT PROCEED

**📝 RECORD:**
```
BASED Token: 0x_____________________
Deployed at block: _____
Deployer balance: _____
Total supply: _____
Gas used: _____
Cost: _____ ETH
```

---

#### **STEP 6.2: Deploy NFT Collection** (10 minutes)

```bash
echo "🚨 DEPLOYING NFT COLLECTION TO MAINNET"
echo "Team ready? (yes/no)"
read CONFIRM

npx hardhat run scripts/deploy-nft-mainnet.js --network mainnet
```

**Expected Output:**
```
Deploying Kektech NFT...
Gas Estimate: ~3,000,000 gas
Cost: ~0.075 ETH (~$150)

Deploying... TX: 0x...
✅ Deployed to: 0xNFT_ADDRESS
✅ Verified!
```

---

**✅ CHECKPOINT 6.2: NFT Collection Deployed**

**MANDATORY VERIFICATION:**
```bash
# 1. Check on block explorer
Verify:
- [ ] Contract deployed
- [ ] Contract verified
- [ ] Name: "Kektech NFT" (or your NFT name)
- [ ] Symbol: "KEKTECH"
- [ ] Supports ERC721

# 2. Test NFT minting
npx hardhat run scripts/test-nft-mint.js --network mainnet --nft 0xNFT_ADDRESS

Expected:
- ✅ Mint successful
- ✅ Owner confirmed
- ✅ Token ID: 0
```

**✅ ALL CHECKS PASS?**
- [ ] YES - Record address, proceed
- [ ] NO - STOP, investigate

**📝 RECORD:**
```
NFT Collection: 0x_____________________
Test mint TX: 0x_____________________
Gas used: _____
Cost: _____ ETH
```

---

#### **STEP 6.3: Deploy Enhanced NFT Staking** (10 minutes)

```bash
echo "🚨 DEPLOYING STAKING CONTRACT TO MAINNET"
echo "⚠️ This contract will hold user NFTs!"
echo "Team ready? (yes/no)"
read CONFIRM

npx hardhat run scripts/deploy-staking-mainnet.js --network mainnet
```

**Expected Output:**
```
Deploying Enhanced NFT Staking...
Constructor args:
- NFT Address: 0xNFT_ADDRESS

Gas Estimate: ~4,500,000 gas
Cost: ~0.1125 ETH (~$225)

Deploying... TX: 0x...
✅ Deployed to: 0xSTAKING_ADDRESS
✅ Verified!
```

---

**✅ CHECKPOINT 6.3: Staking Deployed**

**MANDATORY VERIFICATION:**
```bash
# 1. Check on block explorer
Verify:
- [ ] Contract deployed
- [ ] Contract verified
- [ ] Owner: Deployer address
- [ ] NFT contract address correct
- [ ] MAX_BATCH_SIZE = 100

# 2. Check deterministic rarity
npx hardhat run scripts/test-rarity.js --network mainnet --staking 0xSTAKING_ADDRESS

Expected:
- ✅ Token 5000: Rarity COMMON (0), Multiplier 1
- ✅ Token 9000: Rarity EPIC (3), Multiplier 4
- ✅ Token 9950: Rarity LEGENDARY (4), Multiplier 5

# 3. Check pause functionality
npx hardhat run scripts/test-pause.js --network mainnet --staking 0xSTAKING_ADDRESS

Expected:
- ✅ Pause successful
- ✅ Operations blocked
- ✅ Unpause successful
- ✅ Operations resume
```

**✅ ALL CHECKS PASS?**
- [ ] YES - Record address, proceed
- [ ] NO - STOP, investigate, DO NOT PROCEED

**⚠️ CRITICAL:** If pause doesn't work, DO NOT PROCEED!

**📝 RECORD:**
```
Staking Contract: 0x_____________________
Pause test TX: 0x_____________________
Gas used: _____
Cost: _____ ETH
```

---

#### **STEP 6.4: Deploy Bond Manager** (10 minutes)

```bash
echo "🚨 DEPLOYING BOND MANAGER TO MAINNET"
echo "Team ready? (yes/no)"
read CONFIRM

npx hardhat run scripts/deploy-bond-manager-mainnet.js --network mainnet
```

**Expected Output:**
```
Deploying Bond Manager...
Constructor args:
- BASED Token: 0xBASED_TOKEN_ADDRESS

Gas Estimate: ~3,500,000 gas
Cost: ~0.0875 ETH (~$175)

Deploying... TX: 0x...
✅ Deployed to: 0xBOND_MANAGER_ADDRESS
✅ Verified!
```

---

**✅ CHECKPOINT 6.4: Bond Manager Deployed**

**MANDATORY VERIFICATION:**
```bash
# 1. Check on block explorer
Verify:
- [ ] Contract deployed
- [ ] Contract verified
- [ ] BASED token address correct

# 2. Test bond parameters
npx hardhat run scripts/check-bond-params.js --network mainnet --bonds 0xBOND_MANAGER_ADDRESS

Expected:
- Min bond: _____ BASED
- Max failures: 3
- Blacklist period: _____ days
```

**✅ ALL CHECKS PASS?**
- [ ] YES - Record address, proceed
- [ ] NO - STOP, investigate

**📝 RECORD:**
```
Bond Manager: 0x_____________________
Gas used: _____
Cost: _____ ETH
```

---

#### **STEP 6.5: Deploy Governance Contract** (10 minutes)

```bash
echo "🚨 DEPLOYING GOVERNANCE CONTRACT TO MAINNET"
echo "⚠️ This controls system parameters!"
echo "Team ready? (yes/no)"
read CONFIRM

npx hardhat run scripts/deploy-governance-mainnet.js --network mainnet
```

**Expected Output:**
```
Deploying Governance Contract...
Constructor args:
- Staking: 0xSTAKING_ADDRESS
- Bond Manager: 0xBOND_MANAGER_ADDRESS

Gas Estimate: ~4,000,000 gas
Cost: ~0.1 ETH (~$200)

Deploying... TX: 0x...
✅ Deployed to: 0xGOVERNANCE_ADDRESS
✅ Verified!
```

---

**✅ CHECKPOINT 6.5: Governance Deployed**

**MANDATORY VERIFICATION:**
```bash
# 1. Check on block explorer
Verify:
- [ ] Contract deployed
- [ ] Contract verified
- [ ] Staking address correct
- [ ] Bond manager address correct

# 2. Check governance parameters
npx hardhat run scripts/check-governance-params.js --network mainnet --governance 0xGOVERNANCE_ADDRESS

Expected:
- Voting period: _____ blocks
- Timelock: _____ seconds
- Quorum: _____%
```

**✅ ALL CHECKS PASS?**
- [ ] YES - PHASE 1 COMPLETE! 🎉
- [ ] NO - STOP, investigate

**📝 RECORD:**
```
Governance: 0x_____________________
Gas used: _____
Cost: _____ ETH
```

---

### **🎉 PHASE 1 DEPLOYMENT COMPLETE!**

**✅ MAJOR CHECKPOINT: CORE SYSTEM DEPLOYED**

```bash
╔════════════════════════════════════════════════════════════╗
║  PHASE 1 CONTRACTS DEPLOYED SUCCESSFULLY                  ║
╚════════════════════════════════════════════════════════════╝

✅ BASED Token: 0x_____________________
✅ NFT Collection: 0x_____________________
✅ Staking: 0x_____________________
✅ Bond Manager: 0x_____________________
✅ Governance: 0x_____________________

Total Gas Used: ~17,500,000 gas
Total Cost: ~_____ ETH (~$______)
```

**⏸️ MANDATORY BREAK: 15-30 MINUTES**
```
Team, take a break! You've deployed the core system to mainnet! 🎉

Before continuing:
- [ ] Save all contract addresses
- [ ] Backup deployment data
- [ ] Team debrief
- [ ] Check for any warnings/issues
- [ ] Refresh, hydrate, focus
- [ ] Review Phase 2 plan

Ready to continue? (yes/no)
```

---

### **🚀 DEPLOYMENT SEQUENCE - PHASE 2 (Prediction Markets)**

**⏱️ Estimated Time:** 2-3 hours
**💰 Estimated Cost:** $1,000-2,500

[CONTINUES IN NEXT PART DUE TO LENGTH...]

---

**STATUS:** Phase 1 complete, continuing with Phase 2...
**Time Elapsed:** ~3 hours
**Cost So Far:** ~$1,250
**Status:** ✅ ON TRACK

Would you like me to continue with the complete Phase 2 deployment steps?
