# KEKTECH 3.0 - QUICK REFERENCE GUIDE

## DOCUMENT OVERVIEW

Main Mechanics Document: `KEKTECH_3.0_SYSTEM_MECHANICS.md` (2,762 lines)

This quick reference provides quick lookup for specific mechanics.

---

## SMART CONTRACTS AT A GLANCE

| Contract | Purpose | Key Functions | Caller |
|----------|---------|---------------|--------|
| **Registry** | Contract directory | `getContract()`, `setContract()` | All contracts |
| **ParameterStorage** | Global config | `getParameter()`, `setParameter()` | All contracts |
| **FlexibleMarketFactory** | Creates markets | `createMarketFromProposal()` | ProposalSystem |
| **PredictionMarket** | Binary betting | `placeBet()`, `resolve()`, `claim()` | Users |
| **MultiOutcomeMarket** | N-outcome betting | `placeBet()`, `resolve()`, `claim()` | Users |
| **ProposalSystem** | Governance | `submitProposal()`, `vote()`, `finalizeProposal()` | Community |
| **EnhancedNFTStaking** | NFT rewards | `stake()`, `unstake()`, `setTokenRarity()` | Users, Owner |
| **RewardDistributor** | Merkle rewards | `publishDistribution()`, `claimRewards()` | Owner, Users |
| **BondManager** | Bond escrow | `depositBond()`, `refundBond()` | Factory, Markets |

---

## ECONOMIC MODELS

### Creator Fee (Two-Lever System)

**Lever 1: Bond-based**
```
feeBPS = 10 + ((bond - 5000) / 95000) × 90
Min (5K): 10 bps = 0.1%
Max (100K): 100 bps = 1.0%
```

**Lever 2: Additional fee**
```
additionalFeeBPS = additionalFee / 1000
1000 BASED = 1 bps
```

**Combined Max**: 200 bps (2.0%)

### Platform Fees (Fixed)

```
Team:     1.0% (100 bps)
Treasury: 1.5% (150 bps)
Burn:     0.5% (50 bps)
Total:    3.0% (300 bps)
```

**Grand Total Cap**: 5.0% (500 bps)

### Proposal Costs

```
Bond:           50,000 BASED (locked, refundable)
Additional Fee: 40,000 BASED (spent)
Tax (1%):          900 BASED (spent)
Total:          90,900 BASED
```

**If Approved**: Bond → BondManager, Fee → Treasury, Tax → Team
**If Rejected**: Bond → Creator (refund), Fee → Team (kept), Tax → Team

### NFT Rarity Multipliers

```
Common:    1.0x (10,000 bps)
Rare:      1.25x (12,500 bps)
Epic:      1.75x (17,500 bps)
Legendary: 3.0x (30,000 bps)
Mythic:    5.0x (50,000 bps)
```

**Example Weekly Rewards** (10,000 TECH available):

```
User with 5 Epic NFTs (8.75 weight) in 8,715 total network weight:
TECH = (8.75 / 8,715) × 10,000 = 10.04 TECH
BASED = (8.75 / 8,715) × 5,000 trading fees = 5.02 BASED
```

---

## MARKET LIFECYCLE

### Phase 1: Proposal Submission
- Creator pays bond + fee + tax
- ProposalSystem holds bond + fee in escrow
- Tax sent immediately to team

### Phase 2: Voting (7 days)
- NFT stakers vote weighted by staking count
- Approval requires >50% support

**If Approved**:
- Bond → BondManager
- Fee → Treasury
- Market created

**If Rejected**:
- Bond → Creator (refunded)
- Fee → Team (kept)
- 24-hour cooldown before resubmit

### Phase 3: Betting (until endTime)
- Users place bets
- No fees during betting
- Full amounts enter pool

### Phase 4: Resolution
- Resolver calls `resolve(outcome)` after endTime + 5-minute grace period
- Market enters 48-hour finalization window
- Can be reversed up to 2x

### Phase 5: Finalization (after 48 hours)
- `finalize()` called
- Fees extracted
- Minimum 10,000 BASED volume required

### Phase 6: Claiming (indefinite)
- Winners claim proportional share
- User shares: (userBet / totalWinningBets) × (pool - fees)

---

## CRITICAL MECHANICS

### Grace Period
```
Betting closes:     endTime
Resolution grace:   endTime + 5 minutes
Resolution starts:  endTime + 5 minutes +
```

Prevents race conditions at market boundaries.

### Maximum Reversals
```
After resolution:   Can reverse (counter = 1)
After 1st reverse:  Can reverse again (counter = 2)
After 2nd reverse:  No more reversals (locked)
```

Limits correction window to 2 changes maximum.

### Minimum Volume
```
Market volume < 10,000 BASED → Cannot finalize
Market volume ≥ 10,000 BASED → Can finalize
```

Prevents integer division rounding loss on creator fees.

### Fee Extraction Timing
```
Extracted during:  finalize() (not during claim)
Paid by:           Resolver/owner
Benefit:           All claimers have equal gas cost
```

### Voting Power (Tiered)
```
1-4 NFTs:      Tier 1 (1 vote/NFT) = 1-4 power
5-9 NFTs:      Tier 2 (3 votes/NFT) = 15-27 power
10+ NFTs:      Tier 3 (5 votes/NFT) = 50+ power
```

Can be disabled for flat voting (1 vote per person).

### Staking Requirements
```
Minimum hold:  24 hours before rewards accrue
NFTs staked:   In EnhancedNFTStaking contract
Rarity:        Determines multiplier on rewards
Can unstake:   Anytime after 24-hour hold
```

---

## DATA FLOWS

### Market Creation Flow
```
Creator → ProposalSystem.submitProposal()
        ↓
NFT Stakers → ProposalSystem.vote()
           ↓
ProposalSystem.finalizeProposal()
           ↓
FlexibleMarketFactory.createMarketFromProposal()
           ↓
PredictionMarket instance created
```

### Betting Flow
```
User → PredictionMarket.placeBet(amount)
    ↓
Positions tracked: positions[user][outcome] += amount
    ↓
Totals updated: totalYes += amount (or totalNo)
    ↓
No fees deducted yet
```

### Resolution Flow
```
Resolver → PredictionMarket.resolve(outcome)
        ↓
Market state: RESOLVED
        ↓
Wait 48 hours (can be reversed up to 2x)
        ↓
PredictionMarket.finalize()
        ↓
_extractFees() called (fees distributed)
        ↓
Market state: FINALIZED
```

### Claiming Flow
```
Winner → PredictionMarket.claim()
      ↓
Calculate share: (userBet / totalWinningBets) × remaining
      ↓
Transfer to user
      ↓
Mark hasClaimed[user] = true
```

### Reward Distribution Flow
```
Off-chain script (weekly):
  - Query all staked NFTs
  - Calculate rewards by weight
  - Build Merkle tree
  - Publish root hash
        ↓
RewardDistributor.publishDistribution(merkleRoot)
        ↓
Users → Frontend queries tree data
      ↓
RewardDistributor.claimRewards(proofs)
      ↓
Contract verifies proofs against root
      ↓
Transfer TECH + BASED tokens
```

---

## KEY PARAMETERS

### Market Creation
```
MIN_BOND_AMOUNT:        5,000 BASED
MAX_BOND_AMOUNT:        100,000 BASED
MAX_ADDITIONAL_FEE:     100,000 BASED
MIN_TOTAL_VOLUME:       10,000 BASED
PROPOSAL_TAX_BPS:       100 (1%)
```

### Fee Structure
```
TEAM_FEE_BPS:           100 (1.0%)
TREASURY_FEE_BPS:       150 (1.5%)
BURN_FEE_BPS:           50 (0.5%)
MAX_TOTAL_FEE_BPS:      500 (5.0%) - CAP
```

### Governance
```
VOTING_PERIOD_DAYS:     7
APPROVAL_THRESHOLD_BPS: 5000 (50%)
TIERED_VOTING_ENABLED:  true (can be toggled)
```

### Staking
```
MIN_STAKING_PERIOD_HOURS: 24
Rarity multipliers:
  - Common: 1.0x
  - Rare: 1.25x
  - Epic: 1.75x
  - Legendary: 3.0x
  - Mythic: 5.0x
```

### Resolution
```
FINALIZATION_PERIOD_HOURS:  48
RESOLUTION_GRACE_PERIOD:    5 minutes
MAX_REVERSALS:              2
```

### Batch Limits
```
MAX_STAKE_PER_TX:       50 NFTs
MAX_UNSTAKE_PER_TX:     50 NFTs
MAX_CLAIMS_PER_TX:      10 claims
MAX_RARITY_BATCH:       100 NFTs
```

---

## USER JOURNEYS SUMMARY

### Market Creator
```
1. Plan market (question, timing, incentives)
2. Calculate fees (bond + additional fee)
3. Submit proposal (pay bond + fee + 1% tax)
4. Community votes (7 days)
5. Market created (if approved)
6. Bet-in period (users place bets)
7. Market ends (endTime reached)
8. Resolution (resolver sets outcome)
9. Finalization (48-hour window, then finalize)
10. Collect fees + refunded bond
```

**Profits**: Fees earned from market volume + refunded bond - initial investment

### Bettor/Trader
```
1. Find market (browse interface)
2. Analyze odds (YES% vs NO%)
3. Place bet (send BASED)
4. Wait (market runs to endTime)
5. Market resolves (outcome determined)
6. Wait 48 hours (finalization window)
7. Claim (receive winnings or nothing)
```

**Outcome**:
- If correct: Proportional share of winning pool minus fees
- If wrong: Lose entire bet
- If refunded: Get full bet back

### NFT Staker
```
1. Own KEKTECH NFT
2. Check rarity (1.0x to 5.0x multiplier)
3. Stake NFT (approve + transfer)
4. Wait 24 hours (reward accrual begins)
5. Vote on proposals (optional, with staked weight)
6. Weekly rewards (TECH + BASED distributed)
7. Claim rewards (weekly or accumulate)
8. Unstake (reclaim NFT anytime after 24h)
```

**Rewards**: Weekly share of TECH emissions + trading fees, weighted by rarity

---

## SECURITY FEATURES

### Access Control
- **Owner**: Full administrative control
- **Resolver**: Can resolve markets only
- **Authorized Updater**: Can update contract addresses
- **Users**: Can participate (bet, stake, vote)

### Protection Mechanisms
- Reentrancy guards (`nonReentrant` modifier)
- Integer division rounding protection (10K minimum volume)
- First-claimer gas burden eliminated (fees extracted at finalize)
- Race condition prevention (5-minute grace period)
- Reversal limits (MAX_REVERSALS = 2)
- Proposal spam prevention (blacklist + 24h cooldown)
- Parameter validation (total fees capped at 5%)
- Batch size limits (50 NFTs per transaction)

### Emergency Functions
- `emergencyReverse()`: Correct wrong resolutions (max 2x)
- `emergencyRefund()`: Full refund if market fails
- Blacklist/cooldown: Prevent spam proposals

---

## ON-CHAIN vs OFF-CHAIN

### On-Chain (Smart Contracts)
- Market creation & betting
- Resolution & finalization
- Fee extraction & distribution
- NFT staking/unstaking
- Merkle root publishing
- Reward claiming (verifies proofs)

### Off-Chain (Backend)
- Reward calculations (weekly)
- Merkle tree generation
- Individual proofs
- Frontend indexing
- Event listening
- Data hosting (IPFS, database)

---

## CRITICAL FORMULAS

```solidity
// Creator fee from bond (10-100 bps)
feeBPS = 10 + ((bond - 5000) / 95000) × 90

// Creator fee from additional payment (linear)
additionalFeeBPS = additionalFee / 1000 BASED

// Total fees extraction
totalFees = (volume × feeBPS) / 10000

// Winner payout
payout = (userBet / totalWinningBets) × (totalVolume - totalFees)

// Voting power (tiered)
if (stakedCount ≥ 10):    power = stakedCount × 5
else if (stakedCount ≥ 5): power = stakedCount × 3
else if (stakedCount ≥ 1): power = stakedCount × 1

// Reward distribution
userShare = (userWeight / totalNetworkWeight) × weeklyRewards
```

---

## FREQUENTLY USED FUNCTION SIGNATURES

```solidity
// Proposal System
submitProposal(question, bond, fee, endTime, type, data)
vote(proposalId, support)
finalizeProposal(proposalId)
createMarketFromProposal(proposalId)

// Prediction Market
placeBet(outcome)
resolve(outcome)
finalize()
emergencyReverse(outcome)
emergencyRefund()
claim()

// NFT Staking
stake(tokenIds[])
unstake(tokenIds[])
setTokenRarity(tokenId, rarity)
batchSetRarities(tokenIds[], rarities[])
getStakedNFTCount(user)

// Reward Distributor
publishDistribution(root, totalTech, totalBased, weight)
claimRewards(distributionIds[], claims[])

// Parameter Storage
getParameter(category, name)
setParameter(category, name, value)
getParameterForMarket(market, category, name)
setMarketOverride(market, category, name, value)
```

---

## QUICK TROUBLESHOOTING

**Market won't finalize**
- Check: `totalVolume >= 10,000 BASED` minimum
- Check: 48-hour window has elapsed
- Check: Not more than 2 reversals already done

**User can't vote**
- Check: Has staked NFTs (≥1)
- Check: Voting period not ended yet
- Check: Hasn't voted already on this proposal

**Claim returns 0**
- User bet on losing outcome (no refund if not emergency)
- Or user already claimed
- Or market not finalized yet

**Rarity not applying**
- Check: NFT is staked AFTER rarity was set
- Existing stakes keep original weight
- Rarity changes apply on next stake

**Can't unstake**
- Check: 24 hours minimum hold met
- Check: NFT still owns (not transferred elsewhere)

---

## USEFUL CALCULATIONS

### Example Market (10M BASED volume)

```
Creator investment:
  Bond:       50,000 BASED
  Fee:        40,000 BASED
  Tax (1%):       900 BASED
  Total:      90,900 BASED

Creator fee percentage: 52.63 + 40 = 92.63 bps (0.926%)

Market outcome with 10M BASED volume:

Team:       10M × 1.0% = 100,000 BASED
Treasury:   10M × 1.5% = 150,000 BASED
Burn:       10M × 0.5% = 50,000 BASED
Creator:    10M × 0.926% = 92,600 BASED
Total fees: 392,600 BASED

Remaining for winners: 9,607,400 BASED

Creator gets:
  Fees:       92,600 BASED
  Bond:       50,000 BASED
  Profit:     92,600 + 50,000 - 90,900 = 51,700 BASED (57% ROI)
```

### Example Staking (1 Legendary NFT)

```
Network weight: 8,715 total
Your weight: 3.0 (Legendary = 3x)
Your share: 3.0 / 8,715 = 0.0344%

Weekly TECH emission: 10,000 TECH
Your TECH:  10,000 × 0.0344% = 3.44 TECH

Weekly trading fees: 5,000 BASED
Your BASED: 5,000 × 0.0344% = 1.72 BASED

Annual return (estimated):
  TECH: 3.44 × 52 weeks = 179 TECH
  BASED: 1.72 × 52 weeks = 89 BASED
```

---

## LINKS TO DETAILED DOCS

- **Full System Mechanics**: `KEKTECH_3.0_SYSTEM_MECHANICS.md`
- **Master Plan**: `KEKTECH_3.0_MASTER_PLAN.md`
- **Validation Report**: `KEKTECH_3.0_VALIDATION_REPORT.md`

---

*Last Updated: October 23, 2025*
*KEKTECH 3.0 Pre-Implementation Phase*
