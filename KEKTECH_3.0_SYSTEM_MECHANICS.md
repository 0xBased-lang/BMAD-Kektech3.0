# KEKTECH 3.0 PREDICTION MARKET SYSTEM - COMPREHENSIVE MECHANICS ANALYSIS

**Date**: October 23, 2025
**Status**: Complete System Analysis
**Documents Analyzed**:
- KEKTECH_3.0_MASTER_PLAN.md
- KEKTECH_3.0_VALIDATION_REPORT.md

---

## EXECUTIVE SUMMARY

KEKTECH 3.0 is a decentralized prediction market platform built on BasedAI Chain (32323) that combines:
- **Prediction Markets**: Users bet on outcomes of real-world events
- **NFT Staking**: KEKTECH NFT holders stake for rewards
- **Dual-Token Economics**: TECH token rewards + BASED native token
- **Community Governance**: NFT holders vote on market proposals
- **Creator Incentives**: Market creators earn percentage fees from volume

The system consists of 10+ smart contracts, off-chain distribution scripts, and a Next.js frontend.

---

## SECTION 1: SMART CONTRACTS ARCHITECTURE

### 1.1 CONTRACT REGISTRY & OVERVIEW

**Total Contracts**: 10 core + market implementations

| Contract | Purpose | Pattern | Upgradeable |
|----------|---------|---------|-------------|
| Registry | Central directory for all contracts | Service locator | No (addresses can be updated) |
| ParameterStorage | All configurable values | Parameter storage | No (values can be updated) |
| FlexibleMarketFactory | Creates market instances | Factory pattern | No (implementation can change) |
| PredictionMarket | Binary prediction market template | Template/Clone | N/A (cloned) |
| MultiOutcomeMarket | N-outcome market template | Template/Clone | N/A (cloned) |
| CrowdfundingMarket | Funding rounds with betting | Template/Clone | N/A (cloned) |
| ProposalSystem | Governance & market approval | DAO governance | No |
| EnhancedNFTStaking | NFT staking with rarity tiers | Staking | No |
| RewardDistributor | Merkle tree reward distribution | Merkle distribution | No |
| BondManager | Manages creator bonds | Escrow | No |

---

## SECTION 2: SMART CONTRACT SPECIFICATIONS

### 2.1 REGISTRY CONTRACT

**Purpose**: Central directory mapping contract identifiers to current addresses

**Key Pattern**: Service Locator - enables contract upgrades without redeployment

**State Variables**:
```solidity
mapping(bytes32 => address) private contracts;
mapping(address => bool) private authorizedUpdaters;
```

**Functions**:

#### `getContract(bytes32 identifier) → address`
- Returns current address for a contract identifier
- Used by all contracts when they need to interact with another contract
- Returns zero address if not registered (callers must handle)
- Identifiers: `keccak256("PARAMETER_STORAGE")`, `keccak256("NFT_STAKING")`, etc.

**Example Usage**:
```solidity
address paramStorage = registry.getContract(keccak256("PARAMETER_STORAGE"));
uint256 bondAmount = IParameterStorage(paramStorage).getParameter(
    keccak256("MARKET_CREATION"),
    keccak256("MIN_BOND_AMOUNT")
);
```

#### `setContract(bytes32 identifier, address contractAddress) → void`
- Updates the address for a contract identifier
- **Access**: Only owner
- Emits `ContractUpdated(bytes32 identifier, address oldAddress, address newAddress)`
- Used when deploying new contract versions
- New version becomes active immediately for all callers

#### `authorizeUpdater(address updater) → void`
- Grants permission for an address to update contract registrations
- **Access**: Only owner
- Allows delegating update authority to multi-sig without giving full owner control
- Authorized updaters can call `setContract()` but cannot authorize others

**Events**:
```solidity
event ContractUpdated(
    bytes32 indexed identifier,
    address indexed oldAddress,
    address indexed newAddress
);
```

**Access Control**:
- **Owner**: Can set contracts, authorize/revoke updaters, transfer ownership
- **Authorized Updater**: Can set contract addresses
- **Public**: Can query contract addresses (read-only)

---

### 2.2 PARAMETER STORAGE CONTRACT

**Purpose**: Centralized repository for all configurable system parameters

**Key Pattern**: Parameter storage with global defaults + market-specific overrides

**State Variables**:
```solidity
mapping(bytes32 => mapping(bytes32 => uint256)) globalParameters;
mapping(address => mapping(bytes32 => mapping(bytes32 => uint256))) marketOverrides;
mapping(bytes32 => mapping(bytes32 => uint256)) minValues;
mapping(bytes32 => mapping(bytes32 => uint256)) maxValues;
```

**Parameters Stored** (by category):

#### MARKET_CREATION
- `MIN_BOND_AMOUNT`: 5,000 BASED (minimum creator bond)
- `MAX_BOND_AMOUNT`: 100,000 BASED (maximum creator bond)
- `BOND_MIN_CREATOR_FEE_BPS`: 10 bps (0.1% fee at minimum bond)
- `BOND_MAX_CREATOR_FEE_BPS`: 100 bps (1.0% fee at maximum bond)
- `MAX_ADDITIONAL_FEE`: 100,000 BASED (limit on additional fee payment)
- `BASED_PER_BPS`: 1,000 BASED (conversion for additional fee formula)
- `PROPOSAL_TAX_BPS`: 100 bps (1% tax on proposals)
- `MIN_TOTAL_VOLUME`: 10,000 BASED (minimum volume to finalize)

#### FEE_STRUCTURE
- `TEAM_FEE_BPS`: 100 bps (1.0%)
- `TREASURY_FEE_BPS`: 150 bps (1.5%)
- `BURN_FEE_BPS`: 50 bps (0.5%)
- `MAX_TOTAL_FEE_BPS`: 500 bps (5.0%) - Hard cap

#### GOVERNANCE
- `VOTING_PERIOD_DAYS`: 7 days
- `APPROVAL_THRESHOLD_BPS`: 5000 bps (50% majority)
- `TIERED_VOTING_ENABLED`: true (can be toggled)
- `TIER1_MIN_NFTS`: 1 NFT
- `TIER1_VOTING_POWER`: 1 vote per NFT
- `TIER2_MIN_NFTS`: 5 NFTs
- `TIER2_VOTING_POWER`: 3 votes per NFT
- `TIER3_MIN_NFTS`: 10 NFTs
- `TIER3_VOTING_POWER`: 5 votes per NFT

#### STAKING
- `MIN_STAKING_PERIOD_HOURS`: 24 hours (before rewards accrue)
- Rarity multipliers (in basis points):
  - Common: 10,000 (1.0x)
  - Rare: 12,500 (1.25x)
  - Epic: 17,500 (1.75x)
  - Legendary: 30,000 (3.0x)
  - Mythic: 50,000 (5.0x)

#### MARKET_RESOLUTION
- `FINALIZATION_PERIOD_HOURS`: 48 hours
- `RESOLUTION_GRACE_PERIOD`: 5 minutes
- `MAX_REVERSALS`: 2 (maximum emergency reversals)

#### BATCH_LIMITS
- `MAX_STAKE_PER_TX`: 50 NFTs (conservative, tested on mainnet)
- `MAX_UNSTAKE_PER_TX`: 50 NFTs
- `MAX_CLAIMS_PER_TX`: 10 claims per transaction
- `MAX_RARITY_BATCH`: 100 NFTs per batch

**Functions**:

#### `getParameter(bytes32 category, bytes32 name) → uint256`
- Returns global parameter value for a category/name pair
- Used by contracts to read configuration
- All calculations reference this function

#### `getParameterForMarket(address market, bytes32 category, bytes32 name) → uint256`
- Returns parameter value with override support
- Checks if market has override for this parameter
- Returns override if exists, otherwise returns global default
- Enables custom parameters for special markets

#### `setParameter(bytes32 category, bytes32 name, uint256 value) → void`
- Updates a global parameter value
- **Access**: Only owner
- Validates new value is within min/max bounds
- Prevents change from exceeding maximum change percentage
- Emits `ParameterUpdated(bytes32 category, bytes32 name, uint256 oldValue, uint256 newValue)`
- Affects all future markets (existing markets retain their values)

#### `setMarketOverride(address market, bytes32 category, bytes32 name, uint256 value) → void`
- Sets a parameter override for a specific market
- **Access**: Only owner
- Allows special markets to have custom fees/parameters
- Stored separately from global parameters

#### `removeMarketOverride(address market, bytes32 category, bytes32 name) → void`
- Removes a parameter override for a market
- Market will use global default again

#### `initializeParameters() → void`
- One-time function to populate initial parameter values
- Sets all defaults
- Should only be callable once

**Events**:
```solidity
event ParameterUpdated(
    bytes32 indexed category,
    bytes32 indexed name,
    uint256 oldValue,
    uint256 newValue
);

event MarketOverrideSet(
    address indexed market,
    bytes32 indexed category,
    bytes32 indexed name,
    uint256 value
);
```

**Access Control**:
- **Owner**: Can set global and market-specific parameters
- **Public**: Can query parameters

**Implementation Notes**:
- All percentage values stored in basis points (10000 = 100%)
- Must validate cross-parameter relationships (Issue #8 in validation report)
- Cannot exceed total fee cap of 500 bps
- Parameter changes logged with timestamp for audit trail

---

### 2.3 FLEXIBLE MARKET FACTORY

**Purpose**: Creates new prediction market instances for approved proposals

**Key Pattern**: Factory with CREATE2 deterministic deployment + minimal proxy pattern

**State Variables**:
```solidity
address[] public markets; // All created markets
mapping(address => bool) public isMarket; // Quick lookup
mapping(address => address[]) public creatorMarkets;
mapping(uint256 => address) public marketImplementations;
uint256 public marketCount;
```

**Market Types** (enum):
```solidity
enum MarketType {
    BINARY_PREDICTION,    // 0: Win/Lose
    MULTI_OUTCOME,        // 1: Multiple outcomes
    CROWDFUNDING         // 2: Funding + outcome betting
}
```

**Functions**:

#### `registerMarketTemplate(uint256 marketType, address implementation) → void`
- Registers implementation contract for a market type
- **Access**: Only owner
- When adding new market types, deploy implementation first, then register
- Maps enum value to implementation address

**Example**:
```solidity
// Deploy binary market implementation
BinaryMarket impl = new BinaryMarket();
// Register it
factory.registerMarketTemplate(0, address(impl));
```

#### `createMarketFromProposal(uint256 proposalId, address creator, MarketType marketType, bytes calldata marketData, uint256 creatorFeeBPS, address specialBeneficiary) → address`

**Detailed Workflow**:

1. **Read Parameters**:
   ```solidity
   address paramStorage = registry.getContract(keccak256("PARAMETER_STORAGE"));
   uint256 teamFee = IParameterStorage(paramStorage).getParameter(
       keccak256("FEE_STRUCTURE"), keccak256("TEAM_FEE_BPS")
   );
   uint256 treasuryFee = IParameterStorage(paramStorage).getParameter(
       keccak256("FEE_STRUCTURE"), keccak256("TREASURY_FEE_BPS")
   );
   uint256 burnFee = IParameterStorage(paramStorage).getParameter(
       keccak256("FEE_STRUCTURE"), keccak256("BURN_FEE_BPS")
   );
   ```

2. **Validate Total Fees**:
   ```solidity
   uint256 totalPlatformFees = teamFee + treasuryFee + burnFee;
   uint256 totalFees = totalPlatformFees + creatorFeeBPS;
   require(totalFees <= 500, "Exceeds 5% cap");
   ```

3. **Deploy Market Instance**:
   ```solidity
   address implementation = marketImplementations[uint256(marketType)];
   address newMarket = _createClone(implementation, salt);
   ```

4. **Initialize Market**:
   ```solidity
   IMarket(newMarket).initialize({
       question: marketData.question,
       endTime: marketData.endTime,
       creatorFeeBPS: creatorFeeBPS,
       platformFeesBPS: totalPlatformFees,
       creator: creator,
       resolver: msg.sender
   });
   ```

5. **Transfer Bond**:
   ```solidity
   address bondManager = registry.getContract(keccak256("BOND_MANAGER"));
   IBondManager(bondManager).depositBond(creator, bond);
   ```

6. **Transfer Additional Fee**:
   ```solidity
   address treasury = registry.getContract(keccak256("TREASURY_WALLET"));
   BASED.transfer(treasury, additionalFee);
   ```

7. **Record Market**:
   ```solidity
   markets.push(newMarket);
   isMarket[newMarket] = true;
   creatorMarkets[creator].push(newMarket);
   marketCount++;
   ```

8. **Emit Event**:
   ```solidity
   emit MarketCreated({
       market: newMarket,
       creator: creator,
       question: marketData.question,
       endTime: marketData.endTime,
       creatorFeeBPS: creatorFeeBPS,
       platformFeesBPS: totalPlatformFees,
       marketType: marketType
   });
   ```

**Returns**: Address of newly created market

#### `getMarketsForCreator(address creator) → address[]`
- Returns all markets created by a specific creator
- Enables portfolio tracking

#### `getMarketCount() → uint256`
- Returns total number of markets created

#### `getMarketByIndex(uint256 index) → address`
- Returns market address at specific index

**Events**:
```solidity
event MarketCreated(
    address indexed market,
    address indexed creator,
    string question,
    uint256 endTime,
    uint256 creatorFeeBPS,
    uint256 platformFeesBPS,
    uint8 marketType
);

event TemplateRegistered(
    uint8 indexed marketType,
    address indexed implementation
);
```

**Access Control**:
- **ProposalSystem**: Can call `createMarketFromProposal()`
- **Owner**: Can register market templates
- **Public**: Can query markets

**Implementation Notes**:
- Uses EIP-1167 minimal proxy pattern for gas efficiency
- CREATE2 salt: `keccak256(abi.encodePacked(proposalId, creator))`
- Validates implementation is a contract (code.length > 0)
- Each market type must have thoroughly tested implementation
- Factory doesn't store market parameters - each market is independent

---

### 2.4 PREDICTION MARKET CONTRACT (Binary)

**Purpose**: Individual prediction market instance for binary outcomes (Yes/No)

**Key Pattern**: Independent contract instance created by factory

**State Variables**:
```solidity
string public question;
uint256 public endTime;
uint256 public creatorFeeBPS;
uint256 public platformFeesBPS;
address public creator;
address public resolver;

bool public resolved;
bool public outcome; // true = YES, false = NO
uint256 public resolutionTime;
uint256 public finalizationTime;
bool public finalized;
bool public refunded;
uint256 public reversalCount;

uint256 public totalYes;
uint256 public totalNo;

mapping(address => mapping(bool => uint256)) public positions; // user => outcome => amount
mapping(address => bool) public hasClaimed;

bool public feesExtracted;
```

**Events**:
```solidity
event BetPlaced(address indexed bettor, bool outcome, uint256 amount);
event MarketResolved(bool outcome, uint256 timestamp);
event EmergencyReverse(bool newOutcome, uint256 reversalCount, uint256 newFinalizationTime);
event MarketFinalized(address indexed market, uint256 totalVolume);
event FeesExtracted(uint256 teamFee, uint256 treasuryFee, uint256 burnFee, uint256 creatorFee);
event Claimed(address indexed user, uint256 amount);
event EmergencyRefund();
```

**Functions**:

#### `placeBet(bool outcome) external payable nonReentrant`

**Parameters**:
- `outcome`: true for YES, false for NO
- `msg.value`: Amount in BASED tokens to bet

**Requirements**:
- `block.timestamp < endTime` (betting not closed)
- `msg.value > 0` (must bet something)
- Market not resolved
- Market not refunded

**Logic**:
```solidity
function placeBet(bool outcome) external payable nonReentrant {
    require(block.timestamp < endTime, "Betting closed");
    require(msg.value > 0, "Must send BASED");
    require(!resolved, "Market resolved");
    require(!refunded, "Market refunded");

    // Record position
    positions[msg.sender][outcome] += msg.value;

    // Update totals
    if (outcome) {
        totalYes += msg.value;
    } else {
        totalNo += msg.value;
    }

    emit BetPlaced(msg.sender, outcome, msg.value);
}
```

**Note**: Full amount enters pool, no fees deducted during betting

#### `resolve(bool winningOutcome) external onlyResolver nonReentrant`

**Parameters**:
- `winningOutcome`: The correct outcome

**Requirements**:
- `block.timestamp >= endTime + RESOLUTION_GRACE_PERIOD` (5-minute grace period)
- Market not already resolved
- Only callable by resolver

**Logic**:
```solidity
function resolve(bool winningOutcome) external onlyResolver nonReentrant {
    require(
        block.timestamp >= endTime + RESOLUTION_GRACE_PERIOD,
        "Grace period not elapsed"
    );
    require(!resolved, "Already resolved");

    outcome = winningOutcome;
    resolved = true;
    resolutionTime = block.timestamp;
    finalizationTime = block.timestamp + 48 hours;

    emit MarketResolved(outcome, resolutionTime);
}
```

**Why 5-minute Grace Period?**
- Prevents race conditions at market end time
- Betting closes at `endTime`
- Resolution cannot start until `endTime + 5 minutes`
- Clear separation: betting vs. resolution windows

#### `emergencyReverse(bool newOutcome) external onlyOwner nonReentrant`

**Parameters**:
- `newOutcome`: The corrected outcome

**Requirements**:
- Market is resolved but not finalized (in 48-hour window)
- `reversalCount < MAX_REVERSALS` (max 2 reversals)
- Only callable by owner

**Logic**:
```solidity
function emergencyReverse(bool newOutcome) external onlyOwner nonReentrant {
    require(resolved && !finalized, "Invalid state");
    require(reversalCount < MAX_REVERSALS, "Max reversals reached");

    reversalCount++;
    outcome = newOutcome;
    resolutionTime = block.timestamp;
    finalizationTime = block.timestamp + 48 hours;

    emit EmergencyReverse(newOutcome, reversalCount, finalizationTime);
}
```

**Rationale for MAX_REVERSALS = 2**:
- 1st reversal: Corrects honest mistakes
- 2nd reversal: Corrects if community feedback reveals issue
- 3rd+: Indicates fundamental problem, should not happen

#### `finalize() external nonReentrant`

**Requirements**:
- Market is resolved
- Not already finalized
- `block.timestamp >= finalizationTime` (48-hour window elapsed)
- `totalYes + totalNo >= MIN_TOTAL_VOLUME` (10,000 BASED minimum)

**Logic**:
```solidity
function finalize() external nonReentrant {
    require(resolved && !finalized, "Invalid state");
    require(block.timestamp >= finalizationTime, "Still in pending period");

    uint256 totalVolume = totalYes + totalNo;
    require(totalVolume >= MIN_TOTAL_VOLUME, "Volume too low");

    // Extract fees DURING finalization (not during claiming)
    _extractFees();
    feesExtracted = true;

    finalized = true;
    emit MarketFinalized(address(this), totalVolume);
}
```

**Why Extract Fees During Finalization?**
- First claimer shouldn't bear gas cost of fee distribution
- Resolver/owner benefits from resolution, they can pay
- All claimers have equal gas costs
- Cleaner claim logic

#### `_extractFees() internal`

**Calculation Logic**:

```solidity
function _extractFees() internal {
    uint256 totalVolume = totalYes + totalNo;
    
    // Calculate fee percentages
    uint256 teamFeeBPS = IParameterStorage(paramStorage)
        .getParameter(keccak256("FEE_STRUCTURE"), keccak256("TEAM_FEE_BPS"));
    uint256 treasuryFeeBPS = IParameterStorage(paramStorage)
        .getParameter(keccak256("FEE_STRUCTURE"), keccak256("TREASURY_FEE_BPS"));
    uint256 burnFeeBPS = IParameterStorage(paramStorage)
        .getParameter(keccak256("FEE_STRUCTURE"), keccak256("BURN_FEE_BPS"));
    
    // Calculate amounts
    uint256 teamFee = (totalVolume * teamFeeBPS) / 10000; // 1% of volume
    uint256 treasuryFee = (totalVolume * treasuryFeeBPS) / 10000; // 1.5%
    uint256 burnFee = (totalVolume * burnFeeBPS) / 10000; // 0.5%
    uint256 creatorFee = (totalVolume * creatorFeeBPS) / 10000; // Variable 0.1%-1%
    
    // Transfer team fee
    (bool sentTeam,) = payable(teamWallet).call{value: teamFee}("");
    require(sentTeam, "Team transfer failed");
    
    // Transfer treasury fee
    (bool sentTreasury,) = payable(treasuryWallet).call{value: treasuryFee}("");
    require(sentTreasury, "Treasury transfer failed");
    
    // Burn fee (keep in contract or send to burn address)
    burnedAmount = burnFee;
    
    // Creator fee
    (bool sentCreator,) = payable(creator).call{value: creatorFee}("");
    require(sentCreator, "Creator transfer failed");
    
    emit FeesExtracted(teamFee, treasuryFee, burnFee, creatorFee);
}
```

**Example Calculation**:
- Market volume: 1,000 BASED
- Team fee (1%): 10 BASED
- Treasury fee (1.5%): 15 BASED
- Burn fee (0.5%): 5 BASED
- Creator fee (0.5% average): 5 BASED
- **Total fees**: 35 BASED (3.5%)
- **Remaining for winners**: 965 BASED

#### `claim() external nonReentrant`

**Requirements**:
- Market is finalized
- `msg.sender` hasn't already claimed
- Fees have been extracted

**Logic**:
```solidity
function claim() external nonReentrant {
    require(finalized, "Market not finalized");
    require(!hasClaimed[msg.sender], "Already claimed");

    uint256 totalVolume = totalYes + totalNo;
    uint256 winningPool = outcome ? totalYes : totalNo;
    uint256 losingPool = outcome ? totalNo : totalYes;
    
    // Calculate user's winning position
    uint256 userWinningAmount = positions[msg.sender][outcome];
    
    // Calculate user's share of winning pool (proportional)
    uint256 feesFee = totalVolume - winningPool; // Remaining pool goes to fees
    uint256 winningPoolAfterFees = winningPool - feesFee;
    
    uint256 userWinnings = (userWinningAmount * winningPoolAfterFees) / winningPool;
    
    hasClaimed[msg.sender] = true;
    
    // Transfer winnings
    (bool sent,) = payable(msg.sender).call{value: userWinnings}("");
    require(sent, "Transfer failed");
    
    emit Claimed(msg.sender, userWinnings);
}
```

**Example Claim Calculation**:
- User bet 10 BASED on YES
- Market: YES wins with 600 BASED volume
- Fee percentage: 3.5% = 35 BASED
- Remaining: 965 BASED
- User's share: (10 / 600) × 965 = 16.08 BASED

**User Profit**: 16.08 - 10 = 6.08 BASED (60.8% gain)

#### `emergencyRefund() external onlyOwner nonReentrant`

**Requirements**:
- Market is resolved but not finalized

**Logic**:
```solidity
function emergencyRefund() external onlyOwner nonReentrant {
    require(resolved && !finalized, "Can only refund during pending");
    
    refunded = true;
    
    emit EmergencyRefund();
}
```

**Effect**: Users can claim their full bet amounts back (no losses)

#### `claim() with refund support`

**If refunded**:
```solidity
if (refunded) {
    uint256 totalBet = positions[msg.sender][true] + positions[msg.sender][false];
    hasClaimed[msg.sender] = true;
    
    (bool sent,) = payable(msg.sender).call{value: totalBet}("");
    require(sent, "Refund transfer failed");
    
    emit Claimed(msg.sender, totalBet);
}
```

**Access Control**:
- **Resolver**: Can resolve markets
- **Owner**: Can emergency reverse, emergency refund
- **Any user**: Can place bets, claim winnings
- **Public**: Can query market state, positions

**Implementation Notes**:
- Use `nonReentrant` modifier on all external state-changing functions
- Fee extraction happens during finalization, not claiming
- Require minimum 10,000 BASED volume to finalize
- Handle edge cases: one-sided markets, zero bets
- Return value checks for all `.call()` operations

---

### 2.5 MULTI-OUTCOME MARKET CONTRACT

**Purpose**: Market with N possible outcomes (not just binary)

**Similar Structure** to PredictionMarket with modifications:

**State Variables**:
```solidity
string[] public outcomes; // Array of outcome descriptions
mapping(uint256 => uint256) public totalOutcomeVolume; // outcome index => total
mapping(address => mapping(uint256 => uint256)) public positions; // user => outcome => amount
uint256 public winningOutcomeIndex;
```

**Key Differences**:
- Users specify outcome index instead of boolean
- Fee extraction same as binary
- Winning calculation more complex (no losing pool, all bets on losing outcomes go to winners)

**Example: Sports Market**
```
Team A wins: 5000 BASED
Team B wins: 3000 BASED
Draw: 2000 BASED
Total: 10,000 BASED

If Team A wins:
- Fee pool: 5000 BASED (from B + Draw)
- Winner pool: 5000 BASED (Team A bets)
- Each Team A bettor gets proportional share of remaining after fees
```

---

### 2.6 PROPOSAL SYSTEM CONTRACT

**Purpose**: Governance system for market proposals and voting

**State Variables**:
```solidity
mapping(uint256 => Proposal) public proposals;
mapping(uint256 => mapping(address => Vote)) public votes;
mapping(address => uint256) public lastRejectedProposal;
mapping(address => bool) public blacklistedCreators;

uint256 public proposalCount;

struct Proposal {
    uint256 id;
    address creator;
    uint256 bond;
    uint256 additionalFee;
    string question;
    uint256 endTime;
    MarketType marketType;
    bytes marketData;
    
    uint256 submittedAt;
    uint256 votingEndsAt;
    
    uint256 yesWeight;
    uint256 noWeight;
    
    ProposalStatus status; // PENDING, APPROVED, REJECTED
    bool executed;
}

struct Vote {
    address voter;
    bool support;
    uint256 weight;
    uint256 timestamp;
}

enum ProposalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    EXECUTED
}
```

**Events**:
```solidity
event ProposalSubmitted(
    uint256 indexed proposalId,
    address indexed creator,
    string question,
    uint256 bond,
    uint256 additionalFee
);

event Voted(
    uint256 indexed proposalId,
    address indexed voter,
    bool support,
    uint256 weight
);

event ProposalApproved(uint256 indexed proposalId);
event ProposalRejected(uint256 indexed proposalId);
event CreatorBlacklisted(address indexed creator, bool status, string reason);
```

**Functions**:

#### `submitProposal(string memory question, uint256 bond, uint256 additionalFee, uint256 endTime, MarketType marketType, bytes calldata marketData) external payable nonReentrant → uint256`

**Parameters**:
- `question`: Market question (e.g., "Will Bitcoin reach $100k by end of 2025?")
- `bond`: Creator's bond amount (5,000 - 100,000 BASED)
- `additionalFee`: Extra fee (0 - 100,000 BASED)
- `endTime`: When betting ends
- `marketType`: Type of market
- `marketData`: Additional market data

**Requirements**:
- Creator not blacklisted
- Creator not in cooldown from rejection
- Bond within min/max ranges
- Additional fee within limits
- `msg.value >= totalCost` (bond + fee + tax)

**Workflow**:

1. **Calculate costs**:
   ```solidity
   uint256 taxBPS = IParameterStorage(paramStorage)
       .getParameter(keccak256("MARKET_CREATION"), keccak256("PROPOSAL_TAX_BPS"));
   
   uint256 totalCreatorCost = bond + additionalFee;
   uint256 tax = (totalCreatorCost * taxBPS) / 10000;
   uint256 totalRequired = totalCreatorCost + tax;
   
   require(msg.value >= totalRequired, "Insufficient payment");
   ```

   **Example**: 
   - Bond: 50,000 BASED
   - Additional: 40,000 BASED
   - Total: 90,000 BASED
   - Tax (1%): 900 BASED
   - **Total paid**: 90,900 BASED

2. **Distribute payment**:
   ```solidity
   // Tax to team immediately
   (bool sentTax,) = payable(teamWallet).call{value: tax}("");
   require(sentTax, "Tax transfer failed");
   
   // Bond + additional fee held in contract
   // (escrow until voting concludes)
   ```

3. **Calculate creator fee percentage**:
   ```solidity
   // Two-lever system: bond + additional fee
   
   // Bond lever: 10-100 bps based on bond size
   uint256 bondFeeBPS = 10 + ((bond - 5000) / 95000) * 90;
   
   // Additional lever: linear (1000 BASED = 1 bps)
   uint256 additionalFeeBPS = additionalFee / 1000;
   
   uint256 totalCreatorFeeBPS = bondFeeBPS + additionalFeeBPS;
   ```

   **Examples**:
   - Minimum: 5,000 bond + 0 fee = 10 bps (0.1%)
   - Mid: 50,000 bond + 40,000 fee = 52.63 + 40 = 92.63 bps (0.926%)
   - Maximum: 100,000 bond + 100,000 fee = 100 + 100 = 200 bps (2.0%)

4. **Create proposal**:
   ```solidity
   uint256 proposalId = proposalCount++;
   
   proposals[proposalId] = Proposal({
       id: proposalId,
       creator: msg.sender,
       bond: bond,
       additionalFee: additionalFee,
       question: question,
       endTime: endTime,
       marketType: marketType,
       marketData: marketData,
       submittedAt: block.timestamp,
       votingEndsAt: block.timestamp + VOTING_PERIOD_DAYS * 1 days,
       yesWeight: 0,
       noWeight: 0,
       status: ProposalStatus.PENDING,
       executed: false
   });
   
   emit ProposalSubmitted(proposalId, msg.sender, question, bond, additionalFee);
   ```

5. **Return proposal ID**:
   ```solidity
   return proposalId;
   ```

#### `vote(uint256 proposalId, bool support) external nonReentrant`

**Parameters**:
- `proposalId`: The proposal to vote on
- `support`: true = YES, false = NO

**Requirements**:
- Proposal still in voting period
- Voter has staked NFTs
- Voter hasn't already voted

**Voting Power Calculation**:

```solidity
function _calculateVotingWeight(address voter) internal view returns (uint256) {
    address stakingContract = registry.getContract(keccak256("NFT_STAKING"));
    uint256 stakedCount = IEnhancedNFTStaking(stakingContract).getStakedNFTCount(voter);
    
    bool tieringEnabled = IParameterStorage(paramStorage)
        .getParameter(keccak256("GOVERNANCE"), keccak256("TIERED_VOTING_ENABLED"));
    
    if (!tieringEnabled) {
        // Flat voting: 1 vote per voter
        return stakedCount > 0 ? 1 : 0;
    }
    
    // Tiered voting: More NFTs = more power
    if (stakedCount >= 10) {
        return stakedCount * 5; // Tier 3: 5 votes per NFT
    } else if (stakedCount >= 5) {
        return stakedCount * 3; // Tier 2: 3 votes per NFT
    } else if (stakedCount >= 1) {
        return stakedCount * 1; // Tier 1: 1 vote per NFT
    }
    
    return 0; // No NFTs, no voting power
}
```

**Voting Examples** (with tiered voting enabled):
- 1 NFT staked: 1 voting power
- 5 NFTs staked: 15 voting power (5 × 3)
- 10 NFTs staked: 50 voting power (10 × 5)

**Vote Recording**:
```solidity
function vote(uint256 proposalId, bool support) external nonReentrant {
    Proposal storage proposal = proposals[proposalId];
    
    require(block.timestamp < proposal.votingEndsAt, "Voting ended");
    require(proposal.status == ProposalStatus.PENDING, "Not active");
    require(votes[proposalId][msg.sender].voter == address(0), "Already voted");
    
    uint256 weight = _calculateVotingWeight(msg.sender);
    require(weight > 0, "No voting power");
    
    votes[proposalId][msg.sender] = Vote({
        voter: msg.sender,
        support: support,
        weight: weight,
        timestamp: block.timestamp
    });
    
    if (support) {
        proposal.yesWeight += weight;
    } else {
        proposal.noWeight += weight;
    }
    
    emit Voted(proposalId, msg.sender, support, weight);
}
```

#### `finalizeProposal(uint256 proposalId) external nonReentrant`

**Called after voting period ends**

**Approval Logic**:
```solidity
function finalizeProposal(uint256 proposalId) external nonReentrant {
    Proposal storage proposal = proposals[proposalId];
    
    require(block.timestamp >= proposal.votingEndsAt, "Voting still active");
    require(proposal.status == ProposalStatus.PENDING, "Already finalized");
    
    uint256 totalWeight = proposal.yesWeight + proposal.noWeight;
    uint256 thresholdBPS = IParameterStorage(paramStorage)
        .getParameter(keccak256("GOVERNANCE"), keccak256("APPROVAL_THRESHOLD_BPS"));
    
    // Check if YES votes exceed threshold (default 50%)
    if (proposal.yesWeight > (totalWeight * thresholdBPS) / 10000) {
        // APPROVED
        proposal.status = ProposalStatus.APPROVED;
        
        // Transfer bond to BondManager (for escrow)
        address bondManager = registry.getContract(keccak256("BOND_MANAGER"));
        IBondManager(bondManager).depositBond(proposal.creator, proposal.bond);
        
        // Transfer additional fee to treasury (spent)
        address treasury = registry.getContract(keccak256("TREASURY_WALLET"));
        BASED.transfer(treasury, proposal.additionalFee);
        
        emit ProposalApproved(proposalId);
    } else {
        // REJECTED
        proposal.status = ProposalStatus.REJECTED;
        
        // Record rejection for cooldown
        lastRejectedProposal[proposal.creator] = block.timestamp;
        
        // Refund bond to creator (additional fee kept)
        (bool sent,) = payable(proposal.creator).call{value: proposal.bond}("");
        require(sent, "Bond refund failed");
        
        emit ProposalRejected(proposalId);
    }
}
```

**Outcome Summary**:

| Status | Creator Cost | Bond Status | Additional Fee | Tax |
|--------|--------------|-------------|-----------------|-----|
| APPROVED | Locked in market | Escrow (refundable) | Spent | Spent |
| REJECTED | Refunded | Refunded | Kept | Kept |

#### `createMarketFromProposal(uint256 proposalId) external nonReentrant`

**Called after approval**

```solidity
function createMarketFromProposal(uint256 proposalId) external nonReentrant returns (address) {
    Proposal storage proposal = proposals[proposalId];
    
    require(proposal.status == ProposalStatus.APPROVED, "Not approved");
    require(!proposal.executed, "Already executed");
    
    uint256 creatorFeeBPS = 10 + ((proposal.bond - 5000) / 95000) * 90
                          + (proposal.additionalFee / 1000);
    
    address factory = registry.getContract(keccak256("FLEXIBLE_FACTORY"));
    address market = IFlexibleMarketFactory(factory).createMarketFromProposal({
        proposalId: proposalId,
        creator: proposal.creator,
        marketType: proposal.marketType,
        marketData: proposal.marketData,
        creatorFeeBPS: creatorFeeBPS,
        specialBeneficiary: address(0)
    });
    
    proposal.executed = true;
    
    return market;
}
```

#### `blacklistCreator(address creator, bool status, string calldata reason) external onlyOwner`

**Security Feature (User Requirement)**:

```solidity
function blacklistCreator(
    address creator,
    bool status,
    string calldata reason
) external onlyOwner {
    blacklistedCreators[creator] = status;
    emit CreatorBlacklisted(creator, status, reason);
}
```

**Use Cases**:
- Spam prevention
- Scam prevention
- Terms of service violations

#### `submitProposal()` with blacklist check:

```solidity
require(!blacklistedCreators[msg.sender], "Address blacklisted");
require(
    block.timestamp >= lastRejectedProposal[msg.sender] + REJECTION_COOLDOWN,
    "Cooldown active"
);
```

**Access Control**:
- **Creator**: Can submit proposals
- **NFT Stakers**: Can vote
- **Any user**: Can finalize voting (call finalizeProposal)
- **Any user**: Can create market from approved proposal
- **Owner**: Can blacklist creators

---

### 2.7 ENHANCED NFT STAKING CONTRACT

**Purpose**: Manage KEKTECH NFT staking with rarity-based rewards

**State Variables**:
```solidity
address public KEKTECH_NFT;
address public TECH_TOKEN;

mapping(uint256 => uint8) public tokenRarity; // Token ID => Rarity tier (0-4)
mapping(uint8 => uint256) public rarityMultipliers; // Rarity tier => weight (basis points)

mapping(address => mapping(uint256 => StakeInfo)) public stakes;
mapping(address => uint256) public stakedCount; // Cache for voting

uint256 public totalStakingWeight;

struct StakeInfo {
    uint256 stakedAt;
    uint256 weight; // Rarity multiplier applied
}
```

**Rarity Tiers**:
```solidity
mapping(uint8 => string) public rarityNames;

rarityNames[0] = "Common";
rarityNames[1] = "Rare";
rarityNames[2] = "Epic";
rarityNames[3] = "Legendary";
rarityNames[4] = "Mythic";

rarityMultipliers[0] = 10000;  // 1.0x
rarityMultipliers[1] = 12500;  // 1.25x
rarityMultipliers[2] = 17500;  // 1.75x
rarityMultipliers[3] = 30000;  // 3.0x
rarityMultipliers[4] = 50000;  // 5.0x
```

**Distribution** (4,200 total):
```
Common (20%): 840 NFTs × 1.0x = 840 weight
Rare (20%): 840 NFTs × 1.25x = 1,050 weight
Epic (30%): 1,260 NFTs × 1.75x = 2,205 weight
Legendary (20%): 840 NFTs × 3.0x = 2,520 weight
Mythic (10%): 420 NFTs × 5.0x = 2,100 weight

Total weight: 8,715 units
```

**Events**:
```solidity
event Staked(address indexed user, uint256[] tokenIds, uint256 totalWeight);
event Unstaked(address indexed user, uint256[] tokenIds);
event RarityUpdated(uint256 indexed tokenId, uint8 rarity);
event BatchRarityUpdated(uint256[] tokenIds, uint8[] rarities);
```

**Functions**:

#### `stake(uint256[] calldata tokenIds) external nonReentrant`

**Parameters**:
- `tokenIds`: Array of NFT token IDs to stake

**Requirements**:
- `tokenIds.length > 0` (must stake at least one)
- `tokenIds.length <= MAX_STAKE_PER_TX` (batch limit, e.g., 50)
- Each token owned by msg.sender
- Each token not already staked

**Workflow**:

```solidity
function stake(uint256[] calldata tokenIds) external nonReentrant {
    require(tokenIds.length > 0, "Must stake at least one");
    require(tokenIds.length <= MAX_STAKE_PER_TX, "Exceeds batch limit");
    
    uint256 totalWeightAdded = 0;
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
        uint256 tokenId = tokenIds[i];
        
        // Verify ownership
        require(
            KEKTECH_NFT.ownerOf(tokenId) == msg.sender,
            "Not owner"
        );
        
        // Transfer NFT to staking contract
        KEKTECH_NFT.transferFrom(msg.sender, address(this), tokenId);
        
        // Get rarity and calculate weight
        uint8 rarity = tokenRarity[tokenId];
        uint256 weight = rarityMultipliers[rarity];
        
        // Record stake
        stakes[msg.sender][tokenId] = StakeInfo({
            stakedAt: block.timestamp,
            weight: weight
        });
        
        totalWeightAdded += weight;
    }
    
    // Update global tracking
    totalStakingWeight += totalWeightAdded;
    stakedCount[msg.sender] += tokenIds.length;
    
    emit Staked(msg.sender, tokenIds, totalWeightAdded);
}
```

**Gas Optimization**:
- `stakedCount` cached for O(1) voting power lookup
- `totalStakingWeight` updated for reward calculations
- Batch support (50 NFTs = ~2.5M gas)

#### `unstake(uint256[] calldata tokenIds) external nonReentrant`

**Parameters**:
- `tokenIds`: Array of NFT token IDs to unstake

**Requirements**:
- User has staked these tokens
- Tokens staked for at least 24 hours (MIN_STAKING_PERIOD_HOURS)

**Workflow**:

```solidity
function unstake(uint256[] calldata tokenIds) external nonReentrant {
    require(tokenIds.length > 0, "Must unstake at least one");
    require(tokenIds.length <= MAX_UNSTAKE_PER_TX, "Exceeds batch limit");
    
    uint256 totalWeightRemoved = 0;
    uint256 minStakingPeriod = IParameterStorage(paramStorage)
        .getParameter(
            keccak256("STAKING"),
            keccak256("MIN_STAKING_PERIOD_HOURS")
        ) * 1 hours;
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
        uint256 tokenId = tokenIds[i];
        StakeInfo storage stakeInfo = stakes[msg.sender][tokenId];
        
        require(stakeInfo.stakedAt > 0, "Not staked");
        require(
            block.timestamp >= stakeInfo.stakedAt + minStakingPeriod,
            "Too early"
        );
        
        uint256 weight = stakeInfo.weight;
        
        // Transfer NFT back to user
        KEKTECH_NFT.transferFrom(address(this), msg.sender, tokenId);
        
        // Remove stake
        delete stakes[msg.sender][tokenId];
        
        totalWeightRemoved += weight;
    }
    
    // Update global tracking
    totalStakingWeight -= totalWeightRemoved;
    stakedCount[msg.sender] -= tokenIds.length;
    
    emit Unstaked(msg.sender, tokenIds);
}
```

#### `setTokenRarity(uint256 tokenId, uint8 rarity) external onlyOwner`

**Parameters**:
- `tokenId`: NFT token ID
- `rarity`: Rarity tier (0-4)

```solidity
function setTokenRarity(uint256 tokenId, uint8 rarity) external onlyOwner {
    require(rarity <= 4, "Invalid rarity tier");
    
    tokenRarity[tokenId] = rarity;
    
    emit RarityUpdated(tokenId, rarity);
}
```

**Note**: Changes apply to future stakes, existing stakes keep original weight

#### `batchSetRarities(uint256[] calldata tokenIds, uint8[] calldata rarities) external onlyOwner`

**Batch rarity assignment** for initial setup

```solidity
function batchSetRarities(
    uint256[] calldata tokenIds,
    uint8[] calldata rarities
) external onlyOwner {
    require(tokenIds.length == rarities.length, "Length mismatch");
    require(tokenIds.length > 0, "Empty arrays");
    require(tokenIds.length <= 100, "Max 100 per batch");
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
        require(rarities[i] <= 4, "Invalid rarity");
        tokenRarity[tokenIds[i]] = rarities[i];
    }
    
    emit BatchRarityUpdated(tokenIds, rarities);
}
```

**Setup Example**: 4,200 NFTs / 100 per batch = 42 transactions

#### `calculateStakingWeight(uint256 tokenId) external view → uint256`

```solidity
function calculateStakingWeight(uint256 tokenId) external view returns (uint256) {
    uint8 rarity = tokenRarity[tokenId];
    return rarityMultipliers[rarity];
}
```

#### `getStakedNFTCount(address user) external view → uint256`

```solidity
function getStakedNFTCount(address user) external view returns (uint256) {
    return stakedCount[user]; // O(1) lookup using cache
}
```

#### `getTotalStakingWeight() external view → uint256`

```solidity
function getTotalStakingWeight() external view returns (uint256) {
    return totalStakingWeight;
}
```

#### `getStakerWeight(address user) external view → uint256`

Calculate user's total weight contribution

```solidity
function getStakerWeight(address user) external view returns (uint256) {
    // Sum weights of all staked NFTs
    // Could be cached separately for efficiency
    uint256 totalWeight = 0;
    // Iterate through staked tokens (optimization: maintain array)
    return totalWeight;
}
```

**Access Control**:
- **Owner**: Can set rarity tiers
- **Users**: Can stake/unstake their NFTs
- **ProposalSystem**: Can query staked count for voting
- **RewardDistributor**: Can query weights for distributions

**Implementation Notes**:
- Rarity changes don't affect existing stakes
- Cache `stakedCount` for O(1) voting power calculation
- Batch operations support up to 50 NFTs per transaction
- Require minimum 24-hour staking period before rewards accrue

---

### 2.8 REWARD DISTRIBUTOR CONTRACT

**Purpose**: Distribute TECH and BASED tokens to stakers via Merkle trees

**Key Pattern**: Merkle tree pull-based claiming (off-chain computation, on-chain verification)

**State Variables**:
```solidity
mapping(uint256 => DistributionPeriod) public distributions;
mapping(address => mapping(uint256 => bool)) public hasClaimed;

uint256 public distributionCount;

struct DistributionPeriod {
    uint256 id;
    uint256 snapshotTimestamp;
    bytes32 merkleRoot;
    uint256 totalTechRewards;
    uint256 totalBasedRewards;
    uint256 totalStakingWeight;
    uint256 publishedAt;
}
```

**Events**:
```solidity
event DistributionPublished(
    uint256 indexed distributionId,
    bytes32 merkleRoot,
    uint256 totalTech,
    uint256 totalBased,
    uint256 totalWeight
);

event RewardsClaimed(
    address indexed claimer,
    uint256[] distributionIds,
    uint256 totalTech,
    uint256 totalBased
);
```

**Functions**:

#### `publishDistribution(bytes32 merkleRoot, uint256 totalTech, uint256 totalBased, uint256 totalWeight) external onlyOwner`

**Called by backend distribution script**

```solidity
function publishDistribution(
    bytes32 merkleRoot,
    uint256 totalTech,
    uint256 totalBased,
    uint256 totalWeight
) external onlyOwner {
    uint256 distId = distributionCount++;
    
    distributions[distId] = DistributionPeriod({
        id: distId,
        snapshotTimestamp: block.timestamp,
        merkleRoot: merkleRoot,
        totalTechRewards: totalTech,
        totalBasedRewards: totalBased,
        totalStakingWeight: totalWeight,
        publishedAt: block.timestamp
    });
    
    emit DistributionPublished(
        distId,
        merkleRoot,
        totalTech,
        totalBased,
        totalWeight
    );
}
```

**Workflow**:
1. Backend calculates rewards for all stakers
2. Builds Merkle tree
3. Calls this function with root hash
4. Frontend fetches full tree data from backend/IPFS
5. Users can then claim using tree data

#### `claimRewards(uint256[] calldata distributionIds, ClaimData[] calldata claims) external nonReentrant`

**Parameters**:
- `distributionIds`: Array of distribution IDs to claim
- `claims`: Array of (merkleProof, techAmount, basedAmount) for each distribution

**Requirements**:
- User hasn't already claimed each distribution
- `claims.length <= MAX_CLAIMS_PER_TX` (e.g., 10)
- Merkle proof verifies for each distribution

**Claim Data Structure**:
```solidity
struct ClaimData {
    bytes32[] merkleProof;
    uint256 techAmount;
    uint256 basedAmount;
}
```

**Workflow**:

```solidity
function claimRewards(
    uint256[] calldata distributionIds,
    ClaimData[] calldata claims
) external nonReentrant {
    require(distributionIds.length == claims.length, "Length mismatch");
    require(distributionIds.length > 0, "Empty claims");
    require(distributionIds.length <= MAX_CLAIMS_PER_TX, "Too many claims");
    
    uint256 totalTechClaimed = 0;
    uint256 totalBasedClaimed = 0;
    
    for (uint256 i = 0; i < distributionIds.length; i++) {
        uint256 distId = distributionIds[i];
        ClaimData calldata claim = claims[i];
        
        require(!hasClaimed[msg.sender][distId], "Already claimed");
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(
            msg.sender,
            claim.techAmount,
            claim.basedAmount
        ));
        
        require(
            _verifyMerkleProof(
                claim.merkleProof,
                distributions[distId].merkleRoot,
                leaf
            ),
            "Invalid proof"
        );
        
        // Mark as claimed
        hasClaimed[msg.sender][distId] = true;
        
        totalTechClaimed += claim.techAmount;
        totalBasedClaimed += claim.basedAmount;
    }
    
    // Transfer all rewards
    if (totalTechClaimed > 0) {
        TECH_TOKEN.transfer(msg.sender, totalTechClaimed);
    }
    
    if (totalBasedClaimed > 0) {
        (bool sent,) = payable(msg.sender).call{value: totalBasedClaimed}("");
        require(sent, "BASED transfer failed");
    }
    
    emit RewardsClaimed(msg.sender, distributionIds, totalTechClaimed, totalBasedClaimed);
}
```

#### `_verifyMerkleProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal view → bool`

**Standard Merkle verification**

```solidity
function _verifyMerkleProof(
    bytes32[] memory proof,
    bytes32 root,
    bytes32 leaf
) internal pure returns (bool) {
    bytes32 computedHash = leaf;
    
    for (uint256 i = 0; i < proof.length; i++) {
        bytes32 proofElement = proof[i];
        
        if (computedHash <= proofElement) {
            computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
        } else {
            computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
        }
    }
    
    return computedHash == root;
}
```

#### `getDistributionInfo(uint256 distributionId) external view → DistributionPeriod`

```solidity
function getDistributionInfo(uint256 distributionId)
    external
    view
    returns (DistributionPeriod memory)
{
    return distributions[distributionId];
}
```

#### `hasClaimedDistribution(address user, uint256 distributionId) external view → bool`

```solidity
function hasClaimedDistribution(address user, uint256 distributionId)
    external
    view
    returns (bool)
{
    return hasClaimed[user][distributionId];
}
```

**Access Control**:
- **Owner**: Can publish distributions
- **Users**: Can claim rewards
- **Public**: Can query distribution info

**Implementation Notes**:
- Root hash only data stored on-chain (low storage)
- Full Merkle tree data stored off-chain (backend, IPFS)
- Users can claim multiple periods in one transaction
- Unclaimed rewards always claimable (no expiration)
- TECH token must be transferred to contract before distribution
- BASED must be in contract balance (from market fees)

---

### 2.9 BOND MANAGER CONTRACT

**Purpose**: Manage creator bonds - locked capital that gets refunded when markets resolve

**State Variables**:
```solidity
mapping(address => uint256) public bonds;
mapping(address => bool) public isPredictionMarket;

uint256 public totalBondsHeld;
```

**Events**:
```solidity
event BondDeposited(address indexed creator, uint256 amount);
event BondRefunded(address indexed creator, uint256 amount);
event BondForfeited(address indexed creator, uint256 amount, string reason);
```

**Functions**:

#### `depositBond(address creator, uint256 amount) external onlyFactory`

**Called by FlexibleMarketFactory when market is created**

```solidity
function depositBond(address creator, uint256 amount) external onlyFactory {
    require(amount > 0, "Must deposit");
    
    // Bond transferred from ProposalSystem to this contract
    bonds[creator] += amount;
    totalBondsHeld += amount;
    
    emit BondDeposited(creator, amount);
}
```

#### `refundBond(address creator, uint256 amount) external onlyMarket`

**Called by PredictionMarket when market finalizes successfully**

```solidity
function refundBond(address creator, uint256 amount) external onlyMarket {
    require(amount > 0, "Must refund");
    require(bonds[creator] >= amount, "Insufficient bond");
    
    bonds[creator] -= amount;
    totalBondsHeld -= amount;
    
    // Transfer bond back to creator
    (bool sent,) = payable(creator).call{value: amount}("");
    require(sent, "Refund failed");
    
    emit BondRefunded(creator, amount);
}
```

**Why Bonds Are Refundable**:
- Bonds represent locked capital, not penalties
- Creators need liquidity to keep creating markets
- Incentivizes high-quality markets (if market quality is poor, bond is at risk of forfeiture)
- Creates positive feedback loop

#### `forfeitBond(address creator, uint256 amount, string calldata reason) external onlyOwner`

**Emergency function**:

```solidity
function forfeitBond(
    address creator,
    uint256 amount,
    string calldata reason
) external onlyOwner {
    require(amount > 0, "Must forfeit");
    require(bonds[creator] >= amount, "Insufficient bond");
    
    bonds[creator] -= amount;
    totalBondsHeld -= amount;
    
    // Transfer forfeited bond to treasury
    (bool sent,) = payable(treasuryWallet).call{value: amount}("");
    require(sent, "Transfer failed");
    
    emit BondForfeited(creator, amount, reason);
}
```

**Use Cases**:
- Market resolution disputes
- Creator misconduct
- Fraud detection

#### `getBondBalance(address creator) external view → uint256`

```solidity
function getBondBalance(address creator) external view returns (uint256) {
    return bonds[creator];
}
```

**Access Control**:
- **Factory**: Can deposit bonds
- **Market**: Can refund bonds
- **Owner**: Can forfeit bonds
- **Public**: Can query balances

---

## SECTION 3: ECONOMIC MODEL

### 3.1 TWO-LEVER CREATOR INCENTIVE SYSTEM

**Goal**: Align creator incentives with market quality and platform success

**Lever 1: Bond-Based Fee**
- Creator posts bond (5,000 - 100,000 BASED)
- Bond size unlocks fee percentage
- **Formula**: `feeBPS = 10 + ((bond - 5000) / 95000) × 90`

**Lever 2: Additional Fee**
- Creator can pay extra to boost fee
- **Formula**: `additionalFeeBPS = additionalFee / 1000 BASED`
- 1,000 BASED payment = 1 bps increase

**Combined Effect**:
```
Minimum: 5,000 bond only → 10 bps (0.1%)
Mid: 50,000 bond + 40,000 fee → 92.63 bps (0.926%)
Maximum: 100,000 bond + 100,000 fee → 200 bps (2.0%)
```

**Why Two Levers?**
- **Bond**: Demonstrates commitment, capital lock
- **Additional**: Fine-tune incentives for specific markets
- **Together**: Flexible within guardrails

### 3.2 FEE STRUCTURE BREAKDOWN

**Platform Fees** (fixed):
- Team: 1.0% (100 bps)
- Treasury: 1.5% (150 bps)
- Burn: 0.5% (50 bps)
- **Total Platform**: 3.0% (300 bps)

**Creator Fee** (variable):
- Minimum: 0.1% (10 bps)
- Maximum: 2.0% (200 bps)

**Total Fee Cap**: 5.0% (500 bps)

**Fee Extraction Flow**:
```
Market Volume: 100 BASED

Team Fee (1%):       1.00 BASED → Team Wallet
Treasury Fee (1.5%): 1.50 BASED → Treasury Wallet
Burn Fee (0.5%):     0.50 BASED → Burn Address
Creator Fee (0.5%):  0.50 BASED → Creator Wallet

Total Fees:          3.50 BASED
Remaining:          96.50 BASED → Winners

Winner Share: 96.50 / (total losing bets + 96.50)
```

**Example: YES Market with Unequal Betting**
```
YES bets:  600 BASED
NO bets:   400 BASED
Total:    1000 BASED

YES wins:
- Team:     10 BASED
- Treasury: 15 BASED
- Burn:     5 BASED
- Creator:  5 BASED
- Subtotal Fees: 35 BASED

Remaining: 965 BASED
YES winners split 965 proportional to their bets:
  User with 100 YES: (100/600) × 965 = 160.83 BASED
  Profit: 160.83 - 100 = 60.83 BASED (60.8% gain)
```

### 3.3 PROPOSAL ECONOMICS

**Proposal Cost Breakdown**:

| Component | Amount | Refundable | Recipient |
|-----------|--------|-----------|-----------|
| Bond | 5K-100K BASED | YES | BondManager (escrow) |
| Additional Fee | 0-100K BASED | NO | Treasury |
| Tax | 1% of (bond+fee) | NO | Team |
| **Total Cost** | 90.9K BASED | Partial | Mixed |

**Example: 50K Bond + 40K Fee**
```
Bond:               50,000 BASED (locked, refundable)
Additional Fee:     40,000 BASED (spent)
Subtotal:           90,000 BASED
Tax (1%):              900 BASED (immediate, non-refundable)
Total Payment:      90,900 BASED

Outcome if APPROVED:
- Bond:       50,000 → BondManager (refundable when market resolves)
- Fee:        40,000 → Treasury (gone)
- Tax:           900 → Team (gone)
- Creator Fee Rate: 92.63 bps

Outcome if REJECTED:
- Bond:       50,000 → Creator (refunded immediately)
- Fee:        40,000 → Team (kept)
- Tax:           900 → Team (kept)
```

### 3.4 REWARD DISTRIBUTION

**Sources of Rewards**:
1. **Staking Rewards**: Daily TECH emissions for staking
2. **Trading Fees**: Portion of market fees
3. **Activity Rewards**: Bonuses for community participation

**Calculation (Weekly)**:

```javascript
// For each staker
stakerWeight = sum of (rarity multiplier for each staked NFT)

// Total network weight
totalNetworkWeight = sum of all staker weights

// TECH reward share
stakerTechReward = (stakerWeight / totalNetworkWeight) × weeklyTechEmission

// BASED reward share (from trading fees)
feesCollected = (team + treasury + burn fees from all markets that week)
stakerBasedReward = (stakerWeight / totalNetworkWeight) × feesCollected

// Total reward
totalReward = stakerTechReward + stakerBasedReward
```

**Rarity Impact**:
```
Same staking position:
- Common NFT (1x):     100 TECH
- Rare NFT (1.25x):    125 TECH
- Epic NFT (1.75x):    175 TECH
- Legendary (3x):      300 TECH
- Mythic (5x):         500 TECH
```

**Example Calculation**:

```
Network State:
- Total staking weight: 8,715 units
- Weekly TECH emission: 10,000 TECH

User A staking:
- 5 Common NFTs (1x each) = 5 weight units
- Share: 5 / 8,715 = 0.057%
- TECH reward: 10,000 × 0.057% = 5.7 TECH

User B staking:
- 2 Mythic NFTs (5x each) = 10 weight units
- Share: 10 / 8,715 = 0.115%
- TECH reward: 10,000 × 0.115% = 11.5 TECH

User B gets 2x rewards for better NFTs!
```

---

## SECTION 4: ECONOMIC MECHANICS

### 4.1 MARKET LIFECYCLE & MONEY FLOW

**Phase 1: Proposal Submission**
```
Creator pays:
  Bond:    50,000 BASED
  Fee:     40,000 BASED
  Tax:        900 BASED
  Total:   90,900 BASED

Destination:
  Bond:    → ProposalSystem (escrow)
  Fee:     → Team wallet (immediate)
  Tax:     → Team wallet (immediate)
```

**Phase 2: Voting** (7 days)
```
NFT stakers vote (weighted by staking count):
  YES: approve proposal
  NO: reject proposal

  Approval threshold: >50%

If APPROVED:
  - Bond transferred to BondManager (locked)
  - Additional fee moved to treasury
  - Market created with parameters

If REJECTED:
  - Bond refunded to creator
  - Additional fee kept by team
  - Creator can resubmit after 24-hour cooldown
```

**Phase 3: Betting** (until endTime)
```
Users place bets on outcomes:
- Each bet enters market pool
- No fees deducted during betting
- User tracks positions per outcome

Example:
  Alice bets 10 on YES
  Bob bets 8 on NO
  Charlie bets 7 on YES

  YES pool: 17
  NO pool:  8
  Total:    25
```

**Phase 4: Resolution** (endTime)
```
Resolver calls resolve(outcome) after endTime + 5-min grace period

Market state transitions:
  OPEN → RESOLVED
  
  48-hour finalization window opens

If resolver is wrong:
  - Owner can call emergencyReverse() (up to 2 times)
  - Each reversal resets 48-hour window
  - After 2nd reversal, no more changes allowed
  
Alternative:
  - Owner can call emergencyRefund()
  - All users get their bets back
```

**Phase 5: Finalization** (48-hour window)
```
After 48 hours, market can finalize:

Finalize() extracts fees:
  Team fee:     1.0% of volume
  Treasury fee: 1.5% of volume
  Burn fee:     0.5% of volume
  Creator fee:  Variable (0.1%-2.0%)

These fees leave the pool, remaining goes to winners
```

**Phase 6: Claiming** (indefinite)
```
Winners claim proportional share of winning pool:

Winner share = (user's winning bet / total winning bets) × (pool - fees)

Example:
  Market: 25 BASED total
  YES wins (had 17 BASED)
  Fees: 0.875 BASED (3.5%)
  Remaining: 24.125 BASED
  
  Alice (10 of 17 YES):
    Claim = (10/17) × 24.125 = 14.19 BASED
    Profit = 14.19 - 10 = 4.19 (41.9% gain)
    
  Charlie (7 of 17 YES):
    Claim = (7/17) × 24.125 = 9.93 BASIC
    Profit = 9.93 - 7 = 2.93 (41.9% gain - same %)
```

### 4.2 MEAN REVERSION IN PRICING

Prediction markets naturally create prices that reflect probabilities:

```
Market with 600 BASED YES, 400 BASED NO

Implied probability of YES:
  600 / 1000 = 60%

If YES wins, YES bettors profit < 100%:
  - They paid 600 to win 1000 pool
  - Minus 3.5% fees = 965 remaining
  - Profit per dollar: 965/600 = 1.608x (60.8% return)
  
NO bettors get 0

Symmetric risk:
- 60% chance they lose 100% of bet
- 40% chance they gain 60.8%
- Expected value for NO bettor: -60% × 100% + 40% × 60.8% = -24.3%

This incentivizes moving to YES until:
- Price reaches true probability
- Or liquidity dries up on NO side
```

---

## SECTION 5: ON-CHAIN VS OFF-CHAIN

### 5.1 ON-CHAIN (Smart Contracts)

**What happens on-chain**:
1. Market creation and configuration
2. Bet placement and position tracking
3. Market resolution and finalization
4. Fee extraction and distribution
5. Winning claim processing
6. Bond management
7. Proposal voting
8. NFT staking/unstaking
9. Merkle root publishing
10. Reward claiming

**Smart Contracts**:
- Registry
- ParameterStorage
- FlexibleMarketFactory
- PredictionMarket
- MultiOutcomeMarket
- CrowdfundingMarket
- ProposalSystem
- EnhancedNFTStaking
- RewardDistributor
- BondManager

**On-Chain Data**:
- User bet positions
- Market states
- Staked NFTs
- NFT rarities
- Parameters
- Proposal votes
- Merkle roots (only hashes)

### 5.2 OFF-CHAIN (Backend)

**What happens off-chain**:
1. Weekly reward calculations
2. Merkle tree generation
3. Individual Merkle proofs
4. Frontend data indexing
5. User interface
6. Event listening and indexing
7. Comments and social features

**Backend Services**:
- Distribution calculation engine
- Merkle tree builder
- Database for indexing
- IPFS pinning service
- WebSocket for real-time updates

**Off-Chain Data**:
- Full Merkle trees (full tree data)
- Comments and metadata
- Frontend state
- User profiles
- Market details

### 5.3 INTEGRATION POINTS

**Contracts → Off-Chain**:
```
Event: Resolved(market, outcome, timestamp)
Backend listens for resolution events
Begins calculating rewards for completed markets
```

**Off-Chain → Contracts**:
```
Backend calculates distribution
Publishes Merkle root: publishDistribution(root, totalTech, totalBased)
Frontend queries root: getDistributionInfo(distributionId)
```

**User → Contracts**:
```
Frontend generates proofs from off-chain tree
User calls: claimRewards(distributionIds, claims)
Contract verifies proofs on-chain
```

---

## SECTION 6: DATA STRUCTURES & EVENTS

### 6.1 CORE DATA STRUCTURES

**Proposal**:
```solidity
struct Proposal {
    uint256 id;
    address creator;
    uint256 bond;
    uint256 additionalFee;
    string question;
    uint256 endTime;
    MarketType marketType;
    bytes marketData;
    uint256 submittedAt;
    uint256 votingEndsAt;
    uint256 yesWeight;
    uint256 noWeight;
    ProposalStatus status;
    bool executed;
}
```

**StakeInfo**:
```solidity
struct StakeInfo {
    uint256 stakedAt;
    uint256 weight;
}
```

**DistributionPeriod**:
```solidity
struct DistributionPeriod {
    uint256 id;
    uint256 snapshotTimestamp;
    bytes32 merkleRoot;
    uint256 totalTechRewards;
    uint256 totalBasedRewards;
    uint256 totalStakingWeight;
    uint256 publishedAt;
}
```

### 6.2 MARKET RESOLUTION FLOW (EVENTS)

```
1. ProposalSubmitted(proposalId, creator, question)
2. Voted(proposalId, voter, support, weight) [repeated]
3. ProposalApproved(proposalId)
4. MarketCreated(market, creator, question, endTime, fees)
5. BetPlaced(market, bettor, outcome, amount) [repeated]
6. MarketResolved(market, outcome, timestamp)
7. [48-hour window]
8. MarketFinalized(market, totalVolume)
9. FeesExtracted(teamFee, treasuryFee, burnFee, creatorFee)
10. Claimed(user, winnings) [repeated for each claimer]
```

### 6.3 STAKING FLOW (EVENTS)

```
1. Staked(user, tokenIds, totalWeight)
2. [24 hours minimum]
3. DistributionPublished(distributionId, merkleRoot, totalTech, totalBased)
4. RewardsClaimed(user, distributionIds, totalTech, totalBased)
5. Unstaked(user, tokenIds)
```

---

## SECTION 7: USER WORKFLOWS

### 7.1 MARKET CREATOR WORKFLOW

**Step 1: Plan Market**
```
Creator decides:
- Question (e.g., "Will Bitcoin reach $100k by Dec 31?")
- End time (when betting closes)
- Bond amount (5K-100K BASED)
- Additional fee (0-100K BASED to boost creator fee %)
- Expected volume (market size estimate)
```

**Step 2: Calculate Incentives**
```
Bond: 50,000 BASED → unlocks 52.63 bps creator fee
Additional: 40,000 BASED → unlocks 40 bps creator fee
Total creator fee: 92.63 bps (0.926%)

If market reaches 10M BASED volume:
  Creator earns: 10M × 0.926% = 92,600 BASED
  Plus refunded bond: 50,000 BASED
  Minus investment: 90,000 BASED
  Net profit: 52,600 BASED (58.5% ROI)
```

**Step 3: Submit Proposal**
```
Creator calls: submitProposal(
  question: "Will Bitcoin reach $100k?",
  bond: 50,000 BASED,
  additionalFee: 40,000 BASED,
  endTime: 1704067200,  // Dec 31, 2025 8:00 AM UTC
  marketType: BINARY_PREDICTION,
  marketData: bytes(...)
)

Sends: 90,900 BASED (90,000 + 1% tax)
```

**Step 4: Community Votes** (7 days)
```
Process:
- Proposal visible on voting interface
- NFT holders can vote YES/NO
- Each vote weighted by staking amount
- After 7 days, votes finalized

If APPROVED:
- Creator's bond locked in BondManager
- Additional fee transferred to treasury
- Market created

If REJECTED:
- Bond refunded immediately
- Creator can retry after 24-hour cooldown
```

**Step 5: Market Lives** (variable, usually days-weeks)
```
- Market is OPEN
- Users can place bets
- No withdrawal possible (all-in)
- Market tracks total YES and NO positions
```

**Step 6: Market Ends**
```
Creator or oracle calls: resolve(OUTCOME)

Market enters 48-hour pending state
- Can still be reversed (up to 2x)
- Can still be refunded (emergency only)
```

**Step 7: Market Finalizes**
```
After 48 hours, market finalizes:
- Fees extracted
- Winner pool calculated
- Market ready for claims
```

**Step 8: Creator Gets Refund + Fees**
```
Market receives claim transactions from winners
- First finalize() extracts fees
- Creator fee automatically sent to creator
- Bond refunded to creator

Creator receives:
- Refunded bond: 50,000 BASED
- Creator fee share: 92,600 BASED (from 10M volume)
- Total: 142,600 BASED
```

### 7.2 BETTOR/TRADER WORKFLOW

**Step 1: Find Market**
```
Visit kektech.xyz prediction markets interface
Search or filter markets by:
- Category (sports, crypto, politics, etc.)
- End date (upcoming, this week, this month)
- Volume (liquidity)
- Creator (reputation)
```

**Step 2: Analyze Market**
```
Reviews:
- Current odds (YES% vs NO%)
- Total volume so far
- Creator's track record
- Comments/predictions from community
```

**Step 3: Place Bet**
```
User clicks outcome (YES or NO)
Specifies amount: 10 BASED
Approves transaction
Sends 10 BASED to market contract

User positions:
- YES: 10 BASED
- NO: 0 BASED
```

**Step 4: Wait for Resolution**
```
Market remains open until endTime
- User can see position
- Can see current odds
- Cannot withdraw (all-in bet)
```

**Step 5: Market Resolves**
```
At endTime + 5 min grace period:
- Resolver calls resolve(outcome)
- Market status → RESOLVED
- Waiting for finalization
```

**Step 6: Wait 48 Hours**
```
During 48-hour window:
- Could be reversed if wrong
- Could be refunded if error
- After 48h, becomes immutable
```

**Step 7: Claim Winnings or Loss**
```
If outcome matches bet:
- User calls claim()
- Receives proportional share of winning pool
- Profit = share - original bet

If outcome differs:
- User's position is lost
- No need to call claim() (nothing owed)

If refunded:
- User calls claim()
- Receives original bet amount back
```

**Example Results**:
```
Scenario 1: User WINS
- Bet: 10 BASED on YES
- Market: YES wins with 600 YES, 400 NO (1000 total)
- Fees: 3.5% = 35 BASED
- Remaining: 965 BASED
- User share: (10/600) × 965 = 16.08 BASED
- Profit: 6.08 BASED (+60.8%)

Scenario 2: User LOSES
- Bet: 10 BASED on NO
- Market: YES wins
- User's bet lost completely
- Claim: User gets 0

Scenario 3: REFUNDED
- Bet: 10 BASED on YES
- Market refunded due to error
- User claim: 10 BASED (full refund)
- No loss or profit
```

### 7.3 NFT STAKER WORKFLOW

**Step 1: Own KEKTECH NFT**
```
Purchase NFT from:
- Secondary market (OpenSea, Blur)
- Creator drops
- or created during mint phase

Example: Own token #42
```

**Step 2: Check Rarity**
```
Visit staking interface
View token rarity: "Legendary" (3x multiplier)

Rarity tiers:
- Common: 1.0x
- Rare: 1.25x
- Epic: 1.75x
- Legendary: 3.0x
- Mythic: 5.0x
```

**Step 3: Stake NFT**
```
User clicks "Stake"
Approves NFT transfer
Calls: stake([42])

NFT transfers to EnhancedNFTStaking contract
User can now see:
- NFT locked
- Staking weight: 3.0x
- Eligible for rewards
```

**Step 4: Wait 24 Hours**
```
Staking position must be held for 24 hours minimum before rewards accrue

This prevents:
- Flash loan attacks
- Sybil attacks
- Reward gaming
```

**Step 5: Earn Rewards (Weekly)**
```
Backend runs weekly distribution:
- Calculates all stakers' weights
- Distributes TECH tokens
- Distributes BASED from trading fees

User's share:
  TECH = (3.0 / totalNetworkWeight) × weeklyTechEmission
  BASED = (3.0 / totalNetworkWeight) × weeklyTradingFees

Example:
- Network weight: 8,715 total
- User weight: 3.0 (for 1 legendary NFT)
- Weekly TECH: 10,000
- User TECH earned: (3.0 / 8,715) × 10,000 = 3.44 TECH

- Trading fees collected: 5,000 BASED
- User BASED earned: (3.0 / 8,715) × 5,000 = 1.72 BASED
```

**Step 6: Vote on Proposals** (Optional)
```
With staked NFT, user gets voting power:
- 1 NFT: 1 vote
- 5 NFTs: 5 votes × 3 = 15 voting power
- 10+ NFTs: votes × 5

User can vote YES/NO on new market proposals
Voting weighted by staking count
```

**Step 7: Claim Rewards (Weekly)**
```
After each weekly distribution:

Frontend queries: getDistributionInfo(distributionId)
User sees: "2.15 TECH + 1.72 BASED available to claim"

User clicks "Claim"
Provides Merkle proofs
Receives tokens in wallet
```

**Step 8: Unstake NFT** (Optional)
```
After 24-hour minimum hold:
- User clicks "Unstake"
- NFT returns to user wallet
- Staking weight removed
- No longer earns rewards
- Can restake later
```

---

## SECTION 8: CRITICAL MECHANICS SUMMARY

### 8.1 FEE EXTRACTION TIMING

**When**: During `finalize()` call (not during betting or individual claims)
**Who**: Resolver/owner (they pay gas)
**How**: All fees calculated once, distributed to destinations
**Why**: Fair gas cost distribution - no first-claimer burden

### 8.2 GRACE PERIOD AT MARKET END

**5-minute grace period** prevents race conditions

```
endTime = block.timestamp
placeBet() requires: block.timestamp < endTime (can bet until endTime)
resolve() requires: block.timestamp >= endTime + 5 minutes

Clear separation:
- 0:00: endTime reached
- 0:01-5:00: Grace period (betting closed, resolution waiting)
- 5:00+: Resolution can begin
```

### 8.3 MAXIMUM REVERSALS

**Why max 2 reversals?**
- 1st: Corrects honest mistakes
- 2nd: Corrects if community feedback reveals new info
- 3rd+: Indicates fundamental problem

After 2 reversals, market MUST finalize (no more changes possible)

### 8.4 MINIMUM VOLUME REQUIREMENT

**Why 10,000 BASED minimum?**

```
100 BASED market with 0.5% creator fee:
  Creator fee = 100 × 0.5% = 0.5 BASED (rounds down to 0 due to integer division!)

With 10,000 BASED minimum:
  Minimum creator fee = 10,000 × 0.5% = 50 BASED ✓
  Creator always gets fees
```

Prevents: Integer division rounding loss leaving creators with 0 fees

### 8.5 VOTING POWER TIERS

**Why tiered voting?**
- Incentivizes large NFT holdings
- Gives loyal community members more say
- Prevents vote dilution by sybils

**Voting Power**:
```
Staked NFTs: Voting Power
1:            1 (Tier 1)
2-4:          1-4 (Tier 1, 1 per NFT)
5:            15 (Tier 2, 3 per NFT)
10:           50 (Tier 3, 5 per NFT)
```

**Can be disabled**: `TIERED_VOTING_ENABLED` parameter toggles flat voting (1 vote per person regardless of NFTs)

---

## SECTION 9: PARAMETER FLEXIBILITY

All numeric values in KEKTECH are parameters, not hardcoded:

```
Adjustable parameters:

MARKET_CREATION:
  - MIN_BOND_AMOUNT
  - MAX_BOND_AMOUNT
  - PROPOSAL_TAX_BPS
  - MIN_TOTAL_VOLUME

FEE_STRUCTURE:
  - TEAM_FEE_BPS
  - TREASURY_FEE_BPS
  - BURN_FEE_BPS

GOVERNANCE:
  - VOTING_PERIOD_DAYS
  - APPROVAL_THRESHOLD_BPS
  - TIERED_VOTING_ENABLED
  - TIER1/2/3 voting power

STAKING:
  - MIN_STAKING_PERIOD_HOURS
  - RARITY_MULTIPLIERS (per tier)

RESOLUTION:
  - FINALIZATION_PERIOD_HOURS (48h)
  - RESOLUTION_GRACE_PERIOD (5min)
  - MAX_REVERSALS (2)

BATCH_LIMITS:
  - MAX_STAKE_PER_TX
  - MAX_UNSTAKE_PER_TX
  - MAX_CLAIMS_PER_TX
```

**Owner can adjust** via `ParameterStorage.setParameter()` without redeploying markets.

---

## SECTION 10: DEPLOYMENT ARCHITECTURE

### 10.1 SMART CONTRACTS DEPLOYMENT ORDER

1. Registry (no dependencies)
2. ParameterStorage (queries Registry)
3. PredictionMarket implementation (template)
4. MultiOutcomeMarket implementation (template)
5. CrowdfundingMarket implementation (template)
6. FlexibleMarketFactory (queries Registry, ParameterStorage)
7. ProposalSystem (queries Registry, ParameterStorage)
8. EnhancedNFTStaking (queries existing KEKTECH NFT)
9. RewardDistributor (queries TECH token)
10. BondManager (manages BASED escrow)

### 10.2 INTEGRATION SETUP

```solidity
// Register all contracts in Registry
registry.setContract(keccak256("PARAMETER_STORAGE"), parameterStorage.address);
registry.setContract(keccak256("FLEXIBLE_FACTORY"), factory.address);
registry.setContract(keccak256("PROPOSAL_SYSTEM"), proposalSystem.address);
registry.setContract(keccak256("NFT_STAKING"), stakingContract.address);
registry.setContract(keccak256("REWARD_DISTRIBUTOR"), rewardDistributor.address);
registry.setContract(keccak256("BOND_MANAGER"), bondManager.address);

// Register market templates
factory.registerMarketTemplate(0, binaryMarketImpl.address);
factory.registerMarketTemplate(1, multiOutcomeImpl.address);
factory.registerMarketTemplate(2, crowdfundingImpl.address);

// Initialize parameters
parameterStorage.initializeParameters();

// Setup rarity mapping
stakingContract.batchSetRarities([...tokenIds...], [...rarities...]);
```

---

## SECTION 11: SECURITY CONSIDERATIONS

### 11.1 CRITICAL ISSUES (From Validation Report)

1. **Integer Division Rounding**: Fixed with MIN_TOTAL_VOLUME = 10,000 BASED
2. **First Claimer Gas Burden**: Fixed by moving fee extraction to finalize()
3. **Infinite Emergency Reversal**: Fixed with MAX_REVERSALS = 2
4. **Race Condition at End Time**: Fixed with 5-minute RESOLUTION_GRACE_PERIOD
5. **Proposal Spam**: Fixed with blacklist + 24-hour cooldown
6. **Cross-Parameter Validation**: Check total fees don't exceed 500 bps cap
7. **Batch Size Gas Limits**: Set MAX_STAKE_PER_TX = 50 (test on mainnet)
8. **Reentrancy Protection**: All external functions use nonReentrant modifier
9. **Registry Single Point of Failure**: Mitigated by authorized updaters role

### 11.2 ACCESS CONTROL

```solidity
// Registry
- Owner: setContract()
- Authorized Updater: setContract()
- Public: getContract()

// ParameterStorage
- Owner: setParameter(), setMarketOverride()
- Public: getParameter(), getParameterForMarket()

// FlexibleMarketFactory
- ProposalSystem: createMarketFromProposal()
- Owner: registerMarketTemplate()
- Public: queryMarkets()

// PredictionMarket
- Resolver: resolve()
- Owner: emergencyReverse(), emergencyRefund()
- Any: placeBet(), claim(), finalize()

// ProposalSystem
- Creator: submitProposal(), vote()
- Owner: blacklistCreator()
- Public: finalizeProposal(), createMarketFromProposal()

// EnhancedNFTStaking
- Owner: setTokenRarity(), batchSetRarities()
- Users: stake(), unstake()
- ProposalSystem/RewardDistributor: query functions

// RewardDistributor
- Owner: publishDistribution()
- Users: claimRewards()
- Public: getDistributionInfo()

// BondManager
- Factory: depositBond()
- Market: refundBond()
- Owner: forfeitBond()
- Public: getBondBalance()
```

---

## SECTION 12: NEXT STEPS FOR IMPLEMENTATION

1. **Code all smart contracts** with fixes from validation report
2. **Deploy to BasedAI testnet**
3. **Test all user workflows** end-to-end
4. **Validate batch size limits** (measure gas consumption)
5. **Test rarity system** with 100 NFTs
6. **External security audit** (recommended)
7. **Deploy to mainnet** with multi-sig wallets
8. **Launch soft beta** with limited volume
9. **Gradually increase limits** as system stabilizes
10. **Activate governance** with community voting

---

## APPENDIX: KEY FORMULAS

### Creator Fee Calculation

```solidity
// Lever 1: Bond-based fee (10-100 bps)
bondFeeBPS = 10 + ((bond - 5000) / 95000) * 90

// Lever 2: Additional fee-based (linear)
additionalFeeBPS = additionalFee / 1000

// Combined
totalCreatorFeeBPS = bondFeeBPS + additionalFeeBPS
```

### Voting Power (Tiered)

```solidity
// Tier 1: 1-4 NFTs
if (stakedCount >= 1 && stakedCount < 5)
    votingPower = stakedCount * 1

// Tier 2: 5-9 NFTs
else if (stakedCount >= 5 && stakedCount < 10)
    votingPower = stakedCount * 3

// Tier 3: 10+ NFTs
else if (stakedCount >= 10)
    votingPower = stakedCount * 5
```

### Fee Extraction

```solidity
totalVolume = totalYes + totalNo

teamFee = (totalVolume * teamFeeBPS) / 10000
treasuryFee = (totalVolume * treasuryFeeBPS) / 10000
burnFee = (totalVolume * burnFeeBPS) / 10000
creatorFee = (totalVolume * creatorFeeBPS) / 10000

feesTotal = teamFee + treasuryFee + burnFee + creatorFee
remainingPool = totalVolume - feesTotal
```

### Winner Payout

```solidity
winningPool = outcome ? totalYes : totalNo
userWinningAmount = positions[user][outcome]

userShare = (userWinningAmount / winningPool) * remainingPool
```

### Reward Distribution

```solidity
userWeight = calculateStakingWeight(userNFTs)
totalNetworkWeight = sum of all staker weights
userTechShare = (userWeight / totalNetworkWeight) * weeklyTechEmission
userBasedShare = (userWeight / totalNetworkWeight) * collectedFees
```

---

**END OF COMPREHENSIVE ANALYSIS**

*Generated: October 23, 2025*
*Analysis Scope: Complete KEKTECH 3.0 System*
*Status: Ready for Implementation*
