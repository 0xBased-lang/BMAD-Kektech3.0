# KEKTECH 3.0 Prediction Markets - Architecture Documentation

## Overview

KEKTECH 3.0 is a decentralized prediction market platform built on Ethereum, featuring binary outcome markets with timelock-protected governance and gas-optimized operations.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contract Layer                          │
│                                                                   │
│  ┌────────────────────────┐      ┌──────────────────────────┐  │
│  │ PredictionMarketFactory│◄─────┤  FactoryTimelock         │  │
│  │  (Market Creation)     │      │  (Advanced Governance)   │  │
│  └───────────┬────────────┘      └──────────────────────────┘  │
│              │ creates                                           │
│              ▼                                                   │
│  ┌────────────────────────┐                                     │
│  │   PredictionMarket     │  (Multiple Instances)               │
│  │  (Binary Outcomes)     │                                     │
│  └────────────────────────┘                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Dependencies                         │
│  • BASED Token (ERC20)                                          │
│  • Platform Treasury                                             │
│  • Resolver Addresses                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. PredictionMarket Contract

**Purpose:** Individual binary prediction market for a specific question

**Responsibilities:**
- Accept bets on YES/NO outcomes
- Collect fees (creator + platform)
- Handle resolution proposals and finalization
- Process winnings claims and refunds
- Support resolution reversals (max 2)

**Key Features:**
- Binary outcomes only (YES/NO)
- Grace period for late bets (5 minutes)
- Minimum volume threshold (10,000 BASED)
- Pull payment pattern for security
- Pausable by factory for emergencies

**State Machine:**
```
CREATED → ACTIVE → PROPOSED → RESOLVED/REFUNDING → FINALIZED
```

**Security Fixes Implemented:**
- Fix #1: Linear fee formula (not parabolic)
- Fix #2: Multiply before divide (precision)
- Fix #3: Minimum volume or refund
- Fix #4: Pull payment pattern
- Fix #5: Maximum 2 resolution reversals
- Fix #6: Grace period for betting

### 2. PredictionMarketFactory Contract

**Purpose:** Create and manage prediction markets with parameter governance

**Responsibilities:**
- Deploy new PredictionMarket instances
- Manage global fee parameters
- Track all created markets
- Govern treasury address
- Upgrade market implementation
- Emergency pause functionality

**Built-in Simple Timelock:**

The factory includes a **simplified timelock** specifically for fee parameter updates:

```solidity
uint256 public constant TIMELOCK_DELAY = 48 hours;
FeeParams public queuedFeeParams;
uint256 public feeUpdateQueuedAt;

function queueFeeUpdate() → executeFeeUpdate() (after 48h)
```

**Design Decision - Why Simple Timelock:**
- ✅ Fee updates are the most common governance action
- ✅ 48-hour delay is sufficient for user notification
- ✅ Simpler = less attack surface
- ✅ Gas efficient (no external calls)
- ✅ Easy to reason about
- ✅ Tested and proven pattern

**Security Fix:**
- Fix #8: Timelock protection for parameter changes

### 3. FactoryTimelock Contract

**Purpose:** Generic timelock system for advanced governance operations

**Design Decision - Why Separate Contract:**

The FactoryTimelock is a **separate, generic timelock system** for future advanced governance needs:

**Rationale:**
1. **Separation of Concerns**
   - Factory handles market operations
   - Timelock handles complex governance
   - Clean architectural boundaries

2. **Future Expansion**
   - Multi-signature governance
   - DAO proposal systems
   - Complex voting mechanisms
   - Emergency actions
   - Treasury management
   - Protocol upgrades

3. **Flexibility**
   - Supports any operation type
   - Configurable delays (24h - 7 days)
   - Generic call execution
   - Reusable for other contracts

4. **Security**
   - Isolated critical logic
   - Reentrancy protection
   - Operation ID uniqueness
   - Status tracking

**When To Use FactoryTimelock:**
- ❌ NOT for routine fee updates (use Factory's simple timelock)
- ✅ Complex governance proposals
- ✅ Multi-step protocol upgrades
- ✅ Emergency treasury operations
- ✅ Implementation changes requiring multiple approvals
- ✅ DAO-style voting systems (future)

**Relationship:**
```
PredictionMarketFactory
├── Simple Timelock (built-in)
│   └── Fee parameter updates (48h fixed)
│
└── FactoryTimelock (external, optional)
    └── Advanced governance (24h-7d configurable)
        ├── Complex multi-sig operations
        ├── Protocol-wide upgrades
        └── Emergency actions
```

## Architecture Decision Record (ADR)

### ADR-001: Dual Timelock Strategy

**Status:** Accepted
**Date:** 2025-10-24
**Context:** Need to protect parameter changes while maintaining flexibility for future governance

**Decision:**
Implement TWO timelock mechanisms:
1. Simple built-in timelock in Factory for fee updates
2. Generic external Timelock for advanced governance

**Consequences:**

**Positive:**
- ✅ Common operations (fee updates) are simple and gas-efficient
- ✅ Advanced operations have full flexibility
- ✅ Clean separation of concerns
- ✅ Future-proof architecture
- ✅ Each timelock optimized for its use case

**Negative:**
- ⚠️ Conceptual complexity (two timelock systems)
- ⚠️ Need clear documentation (this file!)
- ⚠️ Developers must understand which to use

**Mitigation:**
- 📝 Clear documentation (you're reading it!)
- 🧪 Comprehensive tests for both systems
- 📖 Integration examples
- 🎯 Clear use-case guidelines

## Data Flow Examples

### Example 1: Complete Market Lifecycle

```
1. Alice calls Factory.createMarket()
   ├── Factory validates parameters
   ├── Deploys new PredictionMarket
   ├── Tracks in markets array
   └── Returns market address

2. Bob calls Market.placeBet(YES, 1000 BASED)
   ├── Validates bet amount
   ├── Transfers tokens from Bob
   ├── Calculates fees (linear formula)
   ├── Accumulates fees (pull pattern)
   └── Records bet

3. Carol calls Market.placeBet(NO, 800 BASED)
   └── [Same flow as Bob]

4. Time passes → Market.endTime + gracePeriod

5. Resolver calls Market.proposeResolution(YES)
   ├── Validates caller is resolver
   ├── Validates timing
   ├── Records proposed outcome
   └── Starts dispute period

6. Time passes → 48 hours (proposal delay)

7. Anyone calls Market.finalizeResolution()
   ├── Checks proposal delay passed
   ├── Checks minimum volume met
   ├── Transitions to RESOLVED
   └── Enables claims

8. Bob calls Market.claimWinnings()
   ├── Validates Bob bet on winning outcome (YES)
   ├── Calculates winnings (multiply before divide!)
   ├── Transfers tokens to Bob
   ├── Marks Bob as claimed
   └── Emits event

9. Market creator calls Market.claimCreatorFees()
   ├── Transfers accumulated creator fees
   └── Resets claimable balance

10. Factory calls Market.claimPlatformFees()
    ├── Transfers accumulated platform fees
    ├── Sends to treasury
    └── Resets claimable balance
```

### Example 2: Fee Parameter Update with Timelock

```
1. Owner calls Factory.queueFeeUpdate(150, 75, 125, 75)
   ├── Validates new fees don't exceed 7% total
   ├── Stores queued parameters
   ├── Records timestamp
   └── Emits ParameterUpdateQueued

2. Users have 48 hours to review change
   ├── Monitor events
   ├── Decide to accept or exit
   └── Transparency period

3. After 48h, anyone calls Factory.executeFeeUpdate()
   ├── Validates 48h passed
   ├── Updates active fee parameters
   ├── Clears queued state
   └── Emits FeeParametersUpdated

4. Next market created uses NEW fees
   └── Factory.createMarket() uses updated feeParams
```

## Security Model

### Attack Surfaces & Mitigations

**1. Reentrancy Attacks**
- Mitigation: ReentrancyGuard on all state-changing functions
- Pattern: Checks-Effects-Interactions (CEI)
- Pull payment pattern (no external calls during core logic)

**2. Integer Overflow/Underflow**
- Mitigation: Solidity 0.8.20 (automatic checks)
- Explicit validation in critical calculations

**3. Front-Running**
- Mitigation: Not fully preventable on public blockchain
- Grace period helps reduce impact
- Users can set slippage tolerance (future enhancement)

**4. Parameter Manipulation**
- Mitigation: 48-hour timelock on fee changes (Fix #8)
- 7% maximum total fees enforced
- Owner-only sensitive operations

**5. Precision Loss**
- Mitigation: Multiply before divide (Fix #2)
- Careful ordering of operations
- Test coverage for edge cases

**6. Economic Attacks**
- Mitigation: Minimum volume threshold (Fix #3)
- Pull payment pattern (Fix #4)
- Maximum 2 reversals (Fix #5)

**7. Governance Attacks**
- Mitigation: Simple timelock for routine operations
- Generic timelock for complex operations
- Owner key should be multi-sig (deployment consideration)

## Gas Optimization Strategy

**Current State:** Not yet profiled

**Planned Optimizations:**
1. Batch operations where possible
2. Storage packing (struct alignment)
3. Memory vs. storage optimization
4. Event emission efficiency
5. Loop optimization in view functions

**Measurement Plan:**
- Profile all major operations
- Set baselines
- Target: <200k gas for market creation
- Target: <100k gas for betting
- Target: <150k gas for claims

## Testing Strategy

### Test Pyramid

```
                 ╱╲
                ╱  ╲
               ╱ E2E ╲         10% - End-to-End (Manual/Playwright)
              ╱────────╲
             ╱          ╲
            ╱Integration ╲     20% - Integration Tests
           ╱──────────────╲
          ╱                ╲
         ╱   Unit Tests     ╲   70% - Unit Tests
        ╱────────────────────╲
```

**Current Coverage:**
- Unit Tests: 99 tests ✅
- Integration Tests: 0 tests ❌ ← **NEXT PRIORITY**
- E2E Tests: 0 tests ❌

**Target Coverage:**
- Line Coverage: >90%
- Branch Coverage: >85%
- Function Coverage: 100%

## Deployment Architecture

### Testnet Deployment Order

```
1. Deploy BASED Token (or use existing)
2. Deploy PredictionMarket implementation (template)
3. Deploy FactoryTimelock (optional, for advanced governance)
4. Deploy PredictionMarketFactory
   ├── Pass BASED token address
   ├── Pass treasury address
   ├── Pass implementation address
   └── Pass initial fee parameters
5. Transfer factory ownership to multi-sig (recommended)
6. Create first test market
7. Verify all functionality
```

### Mainnet Deployment Considerations

**Pre-Deployment:**
- ✅ Complete all security fixes (7/9 done)
- ✅ Achieve >90% test coverage
- ✅ Gas profiling complete
- ✅ External audit (recommended)
- ✅ Bug bounty program (recommended)
- ✅ Multi-sig setup for ownership

**Post-Deployment:**
- Monitor events continuously
- Track gas costs
- User feedback loop
- Gradual scaling (start with small markets)
- Emergency pause plan

## Future Enhancements

### Planned (Epics 5-11)

1. **NFT Staking System** (Epic 5)
   - Deterministic rarity
   - Voting power calculation
   - Batch operations

2. **Governance System** (Epic 6)
   - Proposal creation
   - Voting mechanisms
   - Execution logic

3. **Bond Management** (Epic 7)
   - Resolver bonds
   - Forfeiture logic
   - Refund mechanisms

4. **Reward Distribution** (Epic 8)
   - Merkle tree claims
   - Multi-period rewards
   - Dual token support

### Potential Future

- Multi-outcome markets (>2 options)
- Automated Market Maker (AMM) pricing
- Oracle integration
- Layer 2 deployment
- Cross-chain bridges

## Key Metrics

**Current Project Status:**
- Epics Complete: 4/11 (37%)
- Stories Complete: 19/51 (37%)
- Tests Passing: 99/99 (100%)
- Security Fixes: 7/9 (78%)
- Code Written: ~5,800 lines

**Quality Metrics (To Be Measured):**
- Code Coverage: ??? (target >90%)
- Gas Costs: ??? (to be profiled)
- Security Score: ??? (awaiting audit)

## Contact & Resources

**Documentation:**
- This file: `ARCHITECTURE.md`
- Sprint Status: `sprint-status.yaml`
- Test Files: `test/unit/*.test.js`

**Key Contracts:**
- `contracts/core/PredictionMarket.sol` (563 lines)
- `contracts/core/PredictionMarketFactory.sol` (378 lines)
- `contracts/core/FactoryTimelock.sol` (329 lines)

**Interfaces:**
- `contracts/core/interfaces/*.sol` (1,684 lines total)

---

**Last Updated:** 2025-10-24
**Version:** 1.0
**Status:** Active Development
