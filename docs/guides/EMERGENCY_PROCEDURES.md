# 🚨 Emergency Procedures - EnhancedNFTStaking

**Purpose:** Comprehensive emergency response guide
**Audience:** Contract owners, operators, developers
**Priority:** CRITICAL - Review before deployment

---

## ⚡ Emergency Response Framework

### Response Priority Levels

| Level | Description | Response Time | Action Required |
|-------|-------------|---------------|-----------------|
| **P0 - CRITICAL** | Funds at risk, contract exploit | IMMEDIATE | All hands, pause contract |
| **P1 - HIGH** | Service disruption, major bug | <15 minutes | Senior team, investigate |
| **P2 - MEDIUM** | Minor bug, unexpected behavior | <1 hour | Development team |
| **P3 - LOW** | Cosmetic issues, questions | <24 hours | Support team |

### Emergency Contact Protocol

1. **Identify severity** (P0-P3)
2. **Notify team** (Slack/Discord emergency channel)
3. **Assess situation** (gather facts)
4. **Execute response** (follow procedures below)
5. **Document incident** (post-mortem)

---

## 🚨 P0 - CRITICAL EMERGENCIES

### Scenario 1: Contract Exploit Detected

**Symptoms:**
- Unexpected transfers
- Unauthorized state changes
- Suspicious transactions
- User reports of lost NFTs

**IMMEDIATE ACTIONS:**

```javascript
// 1. PAUSE CONTRACT IMMEDIATELY (if possible)
const { ethers } = require("hardhat");

async function emergencyPause() {
  const [owner] = await ethers.getSigners();
  const staking = await ethers.getContractAt(
    "EnhancedNFTStaking",
    "CONTRACT_ADDRESS" // Replace with deployed address
  );

  console.log("🚨 EMERGENCY PAUSE INITIATED");
  console.log("Owner:", owner.address);

  // Verify you're the owner
  const contractOwner = await staking.owner();
  if (owner.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.log("❌ ERROR: You are not the contract owner!");
    process.exit(1);
  }

  // Pause the contract
  const tx = await staking.pause();
  console.log("⏳ Pausing... TX:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ CONTRACT PAUSED at block", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString());

  // Verify paused state
  const isPaused = await staking.paused();
  console.log("Paused status:", isPaused);
}

emergencyPause().catch(console.error);
```

**Run immediately:**
```bash
npx hardhat run scripts/emergency-pause.js --network [NETWORK]
```

**Next Steps:**
1. Notify all users (Twitter, Discord, Website banner)
2. Investigate exploit (review transactions, analyze contract state)
3. Contact security auditors
4. Prepare fix or migration plan
5. Legal consultation if funds lost

### Scenario 2: Private Key Compromised

**Symptoms:**
- Unauthorized transactions from owner address
- Unexpected contract changes
- Wallet drained

**IMMEDIATE ACTIONS:**

1. **DO NOT PANIC** - Stay calm and methodical

2. **Assess Damage:**
```bash
# Check recent transactions
npx hardhat run scripts/check-owner-txs.js --network [NETWORK]

# Check contract state
npx hardhat run scripts/check-contract-state.js --network [NETWORK]
```

3. **Pause Contract** (if key still has access):
```bash
npx hardhat run scripts/emergency-pause.js --network [NETWORK]
```

4. **Transfer Ownership** (if possible):
```javascript
// Transfer to secure multisig or new address
const newOwner = "SECURE_ADDRESS";
await staking.transferOwnership(newOwner);
```

5. **Notify Users:**
   - Post on all channels
   - Explain situation
   - Provide guidance

6. **Security Review:**
   - How was key compromised?
   - What data was accessed?
   - What needs to be rotated?

**Prevention Going Forward:**
- Use hardware wallet
- Use multisig for ownership
- Never store keys in plain text
- Use environment variables properly

### Scenario 3: Infinite Loop or Gas Issue

**Symptoms:**
- Transactions failing with out-of-gas
- Users unable to stake/unstake
- High gas costs

**DIAGNOSTIC STEPS:**

```javascript
// Test problematic function
const staking = await ethers.getContractAt("EnhancedNFTStaking", CONTRACT_ADDRESS);

try {
  // Try to estimate gas
  const gasEstimate = await staking.stakeNFT.estimateGas(TOKEN_ID);
  console.log("Estimated gas:", gasEstimate.toString());

  if (gasEstimate > 500000) {
    console.log("⚠️  WARNING: Very high gas estimate!");
  }
} catch (error) {
  console.log("❌ Gas estimation failed:", error.message);
}
```

**RESOLUTION:**

1. **Pause contract** to prevent further issues
2. **Analyze problematic transactions** on block explorer
3. **Identify root cause:**
   - Loop in user's token array?
   - Unexpected state?
   - Contract bug?

4. **If bug in contract:**
   - Deploy fixed version
   - Migrate users
   - Communicate plan

5. **If user-specific issue:**
   - Contact user
   - Help them resolve
   - Document for others

---

## ⚠️ P1 - HIGH PRIORITY

### Scenario 4: Rarity Calculation Bug

**Symptoms:**
- Wrong rarity assigned to NFTs
- Voting power incorrect
- User complaints

**DIAGNOSTIC SCRIPT:**

```javascript
// scripts/verify-rarities.js
async function verifyRarities() {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", CONTRACT_ADDRESS);

  const boundaries = [
    { id: 0, expected: 0 },
    { id: 2939, expected: 0 },
    { id: 2940, expected: 1 },
    { id: 3569, expected: 1 },
    { id: 3570, expected: 2 },
    { id: 3779, expected: 2 },
    { id: 3780, expected: 3 },
    { id: 4109, expected: 3 },
    { id: 4110, expected: 4 },
    { id: 4199, expected: 4 }
  ];

  console.log("🔍 Verifying rarity calculations...\n");

  let allCorrect = true;
  for (const { id, expected } of boundaries) {
    const rarity = await staking.calculateRarity(id);
    const correct = Number(rarity) === expected;
    console.log(`Token ${id}: ${correct ? "✅" : "❌"} (Expected: ${expected}, Got: ${rarity})`);
    if (!correct) allCorrect = false;
  }

  return allCorrect;
}

verifyRarities().then(correct => {
  if (correct) {
    console.log("\n✅ All rarities correct!");
  } else {
    console.log("\n❌ RARITY CALCULATION ERRORS DETECTED!");
    console.log("This requires immediate attention!");
  }
});
```

**RESOLUTION:**

If rarities are wrong:
1. **Pause contract** immediately
2. **Verify contract code** was deployed correctly
3. **Check if wrong version** was deployed
4. **Deploy correct version** if needed
5. **Migrate users** if stakes already exist

### Scenario 5: Unstaking Blocked

**Symptoms:**
- Users can't unstake
- unstakeNFT() fails
- Emergency unstake needed

**DIAGNOSTIC:**

```javascript
// Check if paused
const isPaused = await staking.paused();
console.log("Contract paused:", isPaused);

// Check minimum stake duration
const stakeInfo = await staking.getStakeInfo(TOKEN_ID);
const stakedAt = stakeInfo.stakedAt;
const now = Math.floor(Date.now() / 1000);
const elapsed = now - Number(stakedAt);
const minDuration = 24 * 3600; // 24 hours

console.log("Staked at:", new Date(Number(stakedAt) * 1000));
console.log("Time elapsed:", elapsed / 3600, "hours");
console.log("Min duration:", minDuration / 3600, "hours");
console.log("Can unstake:", elapsed >= minDuration);
```

**RESOLUTION:**

1. **If due to MIN_STAKE_DURATION:**
   - User must wait 24 hours
   - Explain to user
   - No emergency action needed

2. **If contract issue:**
   - Investigate specific error
   - May need emergency unstake
   - Consider contract pause

3. **Emergency Unstake Available:**
```javascript
// Users can always emergency unstake (forfeits rewards)
await staking.emergencyUnstakeAll();
```

---

## 📊 P2 - MEDIUM PRIORITY

### Scenario 6: High Gas Costs

**Symptoms:**
- Users complaining about gas fees
- Transactions costing more than expected

**DIAGNOSTIC:**

```javascript
// Measure actual gas usage
const tx = await staking.stakeNFT(TOKEN_ID);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
console.log("Gas price:", receipt.gasPrice.toString());

const cost = receipt.gasUsed * receipt.gasPrice;
console.log("Total cost:", ethers.formatEther(cost), "ETH");
```

**ACTIONS:**

1. **Compare to expected:**
   - Staking should be ~300K gas
   - Batch staking more efficient

2. **Recommend batch operations:**
   - Batch stake multiple NFTs
   - Saves gas per NFT

3. **If gas consistently high:**
   - Review contract efficiency
   - Consider optimization
   - May need contract upgrade

### Scenario 7: Incorrect Voting Power

**Symptoms:**
- User's voting power doesn't match staked NFTs
- Discrepancy in calculations

**DIAGNOSTIC:**

```javascript
// Manual calculation
const stakedTokens = await staking.getStakedTokens(userAddress);
let expectedPower = 0;

for (const tokenId of stakedTokens) {
  const stakeInfo = await staking.getStakeInfo(tokenId);
  expectedPower += Number(stakeInfo.votingPower);
}

const actualPower = await staking.getVotingPower(userAddress);

console.log("Staked tokens:", stakedTokens.length);
console.log("Expected power:", expectedPower);
console.log("Actual power:", actualPower.toString());
console.log("Match:", expectedPower === Number(actualPower));
```

**RESOLUTION:**

1. **If mismatch found:**
   - Document specific case
   - Review contract logic
   - May indicate bug

2. **User can trigger update:**
```javascript
// Stake/unstake triggers voting power recalculation
// User can stake 1 more NFT to trigger update
```

---

## 🛠️ Emergency Tools

### Quick Diagnostic Scripts

**1. Contract Health Check:**

```javascript
// scripts/health-check.js
async function healthCheck() {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", CONTRACT_ADDRESS);

  console.log("\n🏥 CONTRACT HEALTH CHECK\n");

  // Basic state
  console.log("Paused:", await staking.paused());
  console.log("Owner:", await staking.owner());
  console.log("Total Staked:", (await staking.getTotalStaked()).toString());
  console.log("Total Voting Power:", (await staking.getTotalVotingPower()).toString());

  // Distribution
  const dist = await staking.getRarityDistribution();
  console.log("\nRarity Distribution:");
  console.log("  Common:", dist.commonCount.toString());
  console.log("  Uncommon:", dist.uncommonCount.toString());
  console.log("  Rare:", dist.rareCount.toString());
  console.log("  Epic:", dist.epicCount.toString());
  console.log("  Legendary:", dist.legendaryCount.toString());

  // Test a few boundaries
  console.log("\nBoundary Tests:");
  console.log("  Token 0:", await staking.calculateRarity(0));
  console.log("  Token 2940:", await staking.calculateRarity(2940));
  console.log("  Token 4199:", await staking.calculateRarity(4199));

  console.log("\n✅ Health check complete");
}

healthCheck().catch(console.error);
```

**2. Recent Events Monitor:**

```javascript
// scripts/check-recent-events.js
async function checkRecentEvents() {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", CONTRACT_ADDRESS);
  const currentBlock = await ethers.provider.getBlockNumber();
  const fromBlock = currentBlock - 1000; // Last ~1000 blocks

  console.log(`\n📜 Recent Events (blocks ${fromBlock}-${currentBlock})\n`);

  // Get all NFTStaked events
  const stakedEvents = await staking.queryFilter(
    staking.filters.NFTStaked(),
    fromBlock,
    currentBlock
  );
  console.log(`Staked events: ${stakedEvents.length}`);

  // Get all NFTUnstaked events
  const unstakedEvents = await staking.queryFilter(
    staking.filters.NFTUnstaked(),
    fromBlock,
    currentBlock
  );
  console.log(`Unstaked events: ${unstakedEvents.length}`);

  // Show recent activity
  console.log("\nRecent Stakes:");
  for (const event of stakedEvents.slice(-5)) {
    console.log(`  Block ${event.blockNumber}: User ${event.args.owner.slice(0,8)}... staked token ${event.args.tokenId}`);
  }
}

checkRecentEvents().catch(console.error);
```

---

## 📋 Post-Incident Procedures

### After Resolving Emergency

1. **Document Everything:**
   ```markdown
   ## Incident Report: [TITLE]

   **Date:** [DATE]
   **Severity:** [P0/P1/P2/P3]
   **Duration:** [DURATION]

   ### What Happened
   [Description]

   ### Root Cause
   [Analysis]

   ### Impact
   - Users affected: [NUMBER]
   - Funds at risk: [AMOUNT]
   - Downtime: [DURATION]

   ### Resolution
   [Steps taken]

   ### Prevention
   [How to prevent in future]

   ### Lessons Learned
   [Key takeaways]
   ```

2. **Communicate to Users:**
   - What happened
   - What was done
   - Current status
   - Next steps

3. **Review and Improve:**
   - Update emergency procedures
   - Add monitoring for this case
   - Improve documentation
   - Train team

---

## 🔐 Access Control

### Who Can Execute Emergency Actions

| Action | Required Role | Access Method |
|--------|---------------|---------------|
| Pause Contract | Owner | Private key or multisig |
| Unpause Contract | Owner | Private key or multisig |
| Transfer Ownership | Owner | Private key or multisig |
| Emergency Unstake | Any User | Their own NFTs only |

### Multisig Recommendations

For mainnet deployment:
- Use multisig (e.g., Gnosis Safe) for owner
- Require 2-of-3 or 3-of-5 signatures
- Distribute keys across team
- Practice emergency procedures

---

## ✅ Emergency Readiness Checklist

**Before Deployment:**
- [ ] All emergency scripts tested
- [ ] Contact protocol established
- [ ] Team trained on procedures
- [ ] Monitoring set up
- [ ] Incident response plan reviewed
- [ ] Multisig configured (mainnet)
- [ ] Backup plans documented

**After Deployment:**
- [ ] Monitor first 24 hours closely
- [ ] Test pause/unpause
- [ ] Verify emergency unstake works
- [ ] Document deployment details
- [ ] Update emergency contacts
- [ ] Schedule regular drills

---

## 📞 Emergency Contacts Template

```yaml
# .emergency-contacts.yml (DO NOT COMMIT)

team:
  lead:
    name: "[NAME]"
    telegram: "@[USERNAME]"
    phone: "+[NUMBER]"

  developer:
    name: "[NAME]"
    telegram: "@[USERNAME]"

  security:
    name: "[NAME]"
    telegram: "@[USERNAME]"

external:
  auditor:
    company: "[COMPANY]"
    contact: "[EMAIL]"

  legal:
    firm: "[FIRM]"
    contact: "[EMAIL]"

channels:
  emergency: "https://[DISCORD/SLACK]/emergency"
  status: "https://[STATUS_PAGE]"
```

---

**Remember:** Stay calm, follow procedures, document everything!

**Status:** Ready for emergency use
**Review:** Monthly or after incidents
**Update:** As procedures improve

