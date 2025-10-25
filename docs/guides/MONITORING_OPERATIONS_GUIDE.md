# 📊 Monitoring & Operations Guide - EnhancedNFTStaking

**Purpose:** Day-to-day monitoring and operational procedures
**Audience:** Operations team, developers
**Status:** Production ready

---

## 🎯 Monitoring Strategy

### Three-Layer Monitoring Approach

1. **Real-Time Monitoring** - Active alerts for critical issues
2. **Metrics Monitoring** - Track performance and usage
3. **Health Checks** - Regular validation of contract state

---

## 📡 Real-Time Monitoring

### Event Monitoring Script

```javascript
// scripts/monitor-live.js
const { ethers } = require("hardhat");

async function monitorLive(contractAddress) {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", contractAddress);

  console.log("\n📡 LIVE EVENT MONITORING\n");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Monitor NFTStaked events
  staking.on("NFTStaked", async (owner, tokenId, rarity, votingPower, event) => {
    const block = await event.getBlock();
    console.log(`\n🎯 NFT STAKED`);
    console.log(`   Time: ${new Date(block.timestamp * 1000).toISOString()}`);
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   TX: ${event.transactionHash}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Token: ${tokenId}`);
    console.log(`   Rarity: ${getRarityName(rarity)}`);
    console.log(`   Voting Power: ${votingPower}`);

    // Get updated totals
    const totalStaked = await staking.getTotalStaked();
    const totalVP = await staking.getTotalVotingPower();
    console.log(`   Total Staked: ${totalStaked}`);
    console.log(`   Total VP: ${totalVP}\n`);
  });

  // Monitor NFTUnstaked events
  staking.on("NFTUnstaked", async (owner, tokenId, votingPower, event) => {
    const block = await event.getBlock();
    console.log(`\n📤 NFT UNSTAKED`);
    console.log(`   Time: ${new Date(block.timestamp * 1000).toISOString()}`);
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   TX: ${event.transactionHash}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Token: ${tokenId}`);
    console.log(`   Voting Power Lost: ${votingPower}`);

    const totalStaked = await staking.getTotalStaked();
    const totalVP = await staking.getTotalVotingPower();
    console.log(`   Total Staked: ${totalStaked}`);
    console.log(`   Total VP: ${totalVP}\n`);
  });

  // Monitor BatchNFTsStaked events
  staking.on("BatchNFTsStaked", async (owner, tokenIds, totalVotingPower, event) => {
    console.log(`\n🎯 BATCH STAKED`);
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Count: ${tokenIds.length} NFTs`);
    console.log(`   Total VP: ${totalVotingPower}\n`);
  });

  // Monitor VotingPowerUpdated events
  staking.on("VotingPowerUpdated", (user, newPower, event) => {
    console.log(`\n⚡ VOTING POWER UPDATED`);
    console.log(`   User: ${user}`);
    console.log(`   New Power: ${newPower}\n`);
  });

  // Monitor Pause/Unpause events
  staking.on("Paused", (account, event) => {
    console.log(`\n🚨 CONTRACT PAUSED`);
    console.log(`   By: ${account}`);
    console.log(`   Block: ${event.blockNumber}\n`);
  });

  staking.on("Unpaused", (account, event) => {
    console.log(`\n✅ CONTRACT UNPAUSED`);
    console.log(`   By: ${account}`);
    console.log(`   Block: ${event.blockNumber}\n`);
  });

  console.log("Press Ctrl+C to stop monitoring\n");
}

function getRarityName(rarity) {
  const names = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
  return names[rarity] || "UNKNOWN";
}

// Usage
const CONTRACT_ADDRESS = process.env.STAKING_CONTRACT || "YOUR_CONTRACT_ADDRESS";
monitorLive(CONTRACT_ADDRESS).catch(console.error);
```

**Run continuous monitoring:**
```bash
npx hardhat run scripts/monitor-live.js --network [NETWORK]
```

---

## 📈 Metrics Dashboard

### Daily Metrics Collection

```javascript
// scripts/collect-metrics.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function collectMetrics(contractAddress) {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", contractAddress);
  const network = await ethers.provider.getNetwork();
  const block = await ethers.provider.getBlockNumber();

  const metrics = {
    timestamp: new Date().toISOString(),
    network: network.name,
    chainId: Number(network.chainId),
    blockNumber: block,
    contract: contractAddress,

    // Core metrics
    totalStaked: (await staking.getTotalStaked()).toString(),
    totalVotingPower: (await staking.getTotalVotingPower()).toString(),

    // Rarity distribution
    distribution: await staking.getRarityDistribution().then(d => ({
      common: d.commonCount.toString(),
      uncommon: d.uncommonCount.toString(),
      rare: d.rareCount.toString(),
      epic: d.epicCount.toString(),
      legendary: d.legendaryCount.toString()
    })),

    // Contract state
    paused: await staking.paused(),
    owner: await staking.owner(),

    // Calculate percentages
    percentages: await calculatePercentages(staking)
  };

  // Save metrics
  const filename = `metrics/metrics-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(metrics, null, 2));
  console.log(`✅ Metrics saved: ${filename}`);

  // Print summary
  console.log("\n📊 CURRENT METRICS\n");
  console.log(`Time: ${metrics.timestamp}`);
  console.log(`Network: ${metrics.network} (${metrics.chainId})`);
  console.log(`Block: ${metrics.blockNumber}\n`);

  console.log("Staking Stats:");
  console.log(`  Total Staked: ${metrics.totalStaked} NFTs`);
  console.log(`  Total Voting Power: ${metrics.totalVotingPower}\n`);

  console.log("Rarity Distribution:");
  console.log(`  Common: ${metrics.distribution.common} (${metrics.percentages.common}%)`);
  console.log(`  Uncommon: ${metrics.distribution.uncommon} (${metrics.percentages.uncommon}%)`);
  console.log(`  Rare: ${metrics.distribution.rare} (${metrics.percentages.rare}%)`);
  console.log(`  Epic: ${metrics.distribution.epic} (${metrics.percentages.epic}%)`);
  console.log(`  Legendary: ${metrics.distribution.legendary} (${metrics.percentages.legendary}%)\n`);

  return metrics;
}

async function calculatePercentages(staking) {
  const total = await staking.getTotalStaked();
  if (total === 0n) {
    return { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  }

  const dist = await staking.getRarityDistribution();
  const totalNum = Number(total);

  return {
    common: ((Number(dist.commonCount) / totalNum) * 100).toFixed(2),
    uncommon: ((Number(dist.uncommonCount) / totalNum) * 100).toFixed(2),
    rare: ((Number(dist.rareCount) / totalNum) * 100).toFixed(2),
    epic: ((Number(dist.epicCount) / totalNum) * 100).toFixed(2),
    legendary: ((Number(dist.legendaryCount) / totalNum) * 100).toFixed(2)
  };
}

// Run
const CONTRACT_ADDRESS = process.env.STAKING_CONTRACT || "YOUR_CONTRACT_ADDRESS";
collectMetrics(CONTRACT_ADDRESS).catch(console.error);
```

**Schedule metrics collection:**
```bash
# Create cron job for hourly metrics
# crontab -e
# Add: 0 * * * * cd /path/to/project && npx hardhat run scripts/collect-metrics.js --network mainnet >> logs/metrics.log 2>&1
```

---

## 🏥 Health Checks

### Automated Health Check

```javascript
// scripts/health-check-automated.js
const { ethers } = require("hardhat");

async function healthCheck(contractAddress) {
  console.log("\n🏥 AUTOMATED HEALTH CHECK\n");

  const results = {
    timestamp: new Date().toISOString(),
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    const staking = await ethers.getContractAt("EnhancedNFTStaking", contractAddress);

    // Test 1: Contract is accessible
    try {
      await staking.owner();
      results.passed.push("Contract accessible");
    } catch (e) {
      results.failed.push(`Contract not accessible: ${e.message}`);
      return results;
    }

    // Test 2: Boundary calculations correct
    const boundaries = [
      { id: 0, expected: 0 },
      { id: 2940, expected: 1 },
      { id: 4199, expected: 4 }
    ];

    for (const { id, expected } of boundaries) {
      const rarity = await staking.calculateRarity(id);
      if (Number(rarity) === expected) {
        results.passed.push(`Boundary ${id} correct`);
      } else {
        results.failed.push(`Boundary ${id} incorrect: expected ${expected}, got ${rarity}`);
      }
    }

    // Test 3: Paused status
    const isPaused = await staking.paused();
    if (isPaused) {
      results.warnings.push("Contract is paused");
    } else {
      results.passed.push("Contract not paused");
    }

    // Test 4: Owner verification
    const owner = await staking.owner();
    results.passed.push(`Owner: ${owner}`);

    // Test 5: Total staked reasonable
    const totalStaked = await staking.getTotalStaked();
    if (totalStaked > 4200n) {
      results.failed.push(`Total staked (${totalStaked}) exceeds max supply (4200)`);
    } else {
      results.passed.push(`Total staked: ${totalStaked}`);
    }

    // Test 6: Voting power consistency
    const totalVP = await staking.getTotalVotingPower();
    const maxPossibleVP = Number(totalStaked) * 5; // Max if all legendary

    if (totalVP > maxPossibleVP) {
      results.failed.push(`Voting power (${totalVP}) exceeds theoretical max (${maxPossibleVP})`);
    } else {
      results.passed.push(`Voting power: ${totalVP}`);
    }

  } catch (error) {
    results.failed.push(`Health check error: ${error.message}`);
  }

  // Print results
  console.log("✅ PASSED:", results.passed.length);
  results.passed.forEach(p => console.log(`   ✅ ${p}`));

  if (results.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:", results.warnings.length);
    results.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
  }

  if (results.failed.length > 0) {
    console.log("\n❌ FAILED:", results.failed.length);
    results.failed.forEach(f => console.log(`   ❌ ${f}`));
  }

  const overall = results.failed.length === 0 ? "HEALTHY" : "UNHEALTHY";
  console.log(`\n🏥 Overall Status: ${overall}\n`);

  // Return exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

const CONTRACT_ADDRESS = process.env.STAKING_CONTRACT || "YOUR_CONTRACT_ADDRESS";
healthCheck(CONTRACT_ADDRESS).catch(console.error);
```

**Run health check:**
```bash
# Manual
npx hardhat run scripts/health-check-automated.js --network [NETWORK]

# Automated (every 15 minutes)
# */15 * * * * cd /path/to/project && npx hardhat run scripts/health-check-automated.js --network mainnet || echo "Health check failed!" | mail -s "Staking Contract Alert" admin@example.com
```

---

## 📧 Alerting System

### Email Alerts (Simple)

```javascript
// scripts/alert-email.js
const nodemailer = require("nodemailer");

async function sendAlert(subject, message) {
  // Configure email (use environment variables in production)
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `[STAKING ALERT] ${subject}`,
    text: message,
    html: `<pre>${message}</pre>`
  });

  console.log("✅ Alert sent");
}

// Example usage in monitoring script
async function checkAndAlert(staking) {
  const isPaused = await staking.paused();

  if (isPaused) {
    await sendAlert(
      "Contract Paused",
      `The staking contract at ${await staking.getAddress()} is currently paused.\nTime: ${new Date().toISOString()}`
    );
  }
}
```

### Slack/Discord Webhooks

```javascript
// scripts/alert-discord.js
const https = require("https");

async function sendDiscordAlert(message) {
  const webhookUrl = process.env.DISCORD_WEBHOOK;

  if (!webhookUrl) {
    console.log("No Discord webhook configured");
    return;
  }

  const payload = JSON.stringify({
    content: `🚨 **Staking Contract Alert**\n\n${message}`,
    username: "Staking Monitor"
  });

  const url = new URL(webhookUrl);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": payload.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve());
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Usage
sendDiscordAlert("Total staked exceeds threshold: 1000 NFTs").catch(console.error);
```

---

## 📊 Analytics & Reporting

### Weekly Report Generation

```javascript
// scripts/weekly-report.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function generateWeeklyReport(contractAddress) {
  const staking = await ethers.getContractAt("EnhancedNFTStaking", contractAddress);
  const currentBlock = await ethers.provider.getBlockNumber();
  const blocksPerDay = 7200; // Approximate for Ethereum
  const blocksPerWeek = blocksPerDay * 7;
  const fromBlock = currentBlock - blocksPerWeek;

  console.log("\n📊 GENERATING WEEKLY REPORT\n");

  // Collect events
  const stakedEvents = await staking.queryFilter(
    staking.filters.NFTStaked(),
    fromBlock,
    currentBlock
  );

  const unstakedEvents = await staking.queryFilter(
    staking.filters.NFTUnstaked(),
    fromBlock,
    currentBlock
  );

  // Current state
  const totalStaked = await staking.getTotalStaked();
  const totalVP = await staking.getTotalVotingPower();
  const dist = await staking.getRarityDistribution();

  // Generate report
  const report = {
    period: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      blocks: `${fromBlock} - ${currentBlock}`
    },
    activity: {
      totalStakes: stakedEvents.length,
      totalUnstakes: unstakedEvents.length,
      netChange: stakedEvents.length - unstakedEvents.length
    },
    currentState: {
      totalStaked: totalStaked.toString(),
      totalVotingPower: totalVP.toString(),
      distribution: {
        common: dist.commonCount.toString(),
        uncommon: dist.uncommonCount.toString(),
        rare: dist.rareCount.toString(),
        epic: dist.epicCount.toString(),
        legendary: dist.legendaryCount.toString()
      }
    },
    topStakers: await getTopStakers(staking, stakedEvents),
    rarityStats: calculateRarityStats(stakedEvents)
  };

  // Save report
  const filename = `reports/weekly-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  // Print summary
  console.log("Activity This Week:");
  console.log(`  Stakes: ${report.activity.totalStakes}`);
  console.log(`  Unstakes: ${report.activity.totalUnstakes}`);
  console.log(`  Net Change: ${report.activity.netChange > 0 ? "+" : ""}${report.activity.netChange}\n`);

  console.log("Current State:");
  console.log(`  Total Staked: ${report.currentState.totalStaked}`);
  console.log(`  Total VP: ${report.currentState.totalVotingPower}\n`);

  console.log(`✅ Report saved: ${filename}\n`);

  return report;
}

async function getTopStakers(staking, events) {
  const stakers = {};

  for (const event of events) {
    const owner = event.args.owner;
    stakers[owner] = (stakers[owner] || 0) + 1;
  }

  return Object.entries(stakers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([address, count]) => ({ address, stakes: count }));
}

function calculateRarityStats(events) {
  const stats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const event of events) {
    const rarity = event.args.rarity;
    stats[rarity]++;
  }

  return {
    common: stats[0],
    uncommon: stats[1],
    rare: stats[2],
    epic: stats[3],
    legendary: stats[4]
  };
}

const CONTRACT_ADDRESS = process.env.STAKING_CONTRACT || "YOUR_CONTRACT_ADDRESS";
generateWeeklyReport(CONTRACT_ADDRESS).catch(console.error);
```

---

## 🔧 Operational Procedures

### Daily Checklist

```markdown
## Daily Operations Checklist

### Morning (Start of Day)
- [ ] Check health check passed overnight
- [ ] Review monitoring alerts
- [ ] Check total staked vs yesterday
- [ ] Review any failed transactions
- [ ] Check gas prices

### Midday
- [ ] Collect metrics
- [ ] Review event logs
- [ ] Check for unusual activity
- [ ] Monitor social channels

### Evening (End of Day)
- [ ] Generate daily summary
- [ ] Document any issues
- [ ] Plan next day if needed
- [ ] Ensure monitoring running
```

### Weekly Checklist

```markdown
## Weekly Operations Checklist

- [ ] Generate weekly report
- [ ] Review all metrics trends
- [ ] Check for any anomalies
- [ ] Update documentation if needed
- [ ] Review emergency procedures
- [ ] Test health checks
- [ ] Backup important data
```

---

## 📁 Log Management

### Log Structure

```
logs/
├── monitoring/
│   ├── live-YYYY-MM-DD.log
│   └── errors-YYYY-MM-DD.log
├── metrics/
│   └── metrics-[timestamp].json
├── health/
│   └── health-YYYY-MM-DD.log
└── reports/
    └── weekly-[timestamp].json
```

### Log Rotation

```bash
# logrotate config
# /etc/logrotate.d/staking-contract

/path/to/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 user user
    sharedscripts
    postrotate
        # Optional: send notification
        echo "Logs rotated" | mail -s "Log Rotation" admin@example.com
    endscript
}
```

---

## ✅ Monitoring Checklist

**Initial Setup:**
- [ ] Event monitoring script running
- [ ] Metrics collection scheduled
- [ ] Health checks automated
- [ ] Alerts configured
- [ ] Logs directory created
- [ ] Block explorer bookmarked
- [ ] Dashboard access configured

**Ongoing:**
- [ ] Daily health check passing
- [ ] Weekly report generated
- [ ] Metrics trending normally
- [ ] No unusual alerts
- [ ] Logs reviewed regularly
- [ ] Documentation updated

---

**Status:** Production ready
**Review:** Weekly
**Update:** As needed based on operations

