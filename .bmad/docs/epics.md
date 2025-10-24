# KEKTECH 3.0 Prediction Markets - Epic Breakdown

**Author:** Sir
**Date:** October 24, 2025
**Project Level:** 3 (Complex System)
**Total Epics:** 11
**Total Estimated Stories:** 50-60

---

## Overview

This document provides the detailed epic breakdown for KEKTECH 3.0 Prediction Markets, expanding on the high-level epic list in the [PRD](./prd.md).

Each epic maps directly to phases from the **documented 18-20 hour implementation** (see vps-documentation/01-IMPLEMENTATION-TIMELINE.md), ensuring we rebuild exactly as originally built.

**Epic Sequencing:**
1. Foundation → Interfaces → Core Contracts → Supporting Contracts → Testing → Deployment
2. Each epic builds on previous work (no forward dependencies)
3. Stories within epics follow documented implementation order
4. All code examples available in technical reference documents

---

## Epic 1: Project Foundation & Environment

**Goal:** Set up complete development environment and project structure

**Value:** Enables all subsequent development work

**Time Estimate:** 2.5 hours original → ~4 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 0-1
- Technical Reference: Section 1 (Environment Setup)

**Stories:**

**Story 1.1: Initialize Project Structure**
- Create project directory
- Initialize npm project with package.json
- Set up basic folder structure (contracts/, test/, scripts/)
- Initialize git repository (optional)

**Story 1.2: Install Core Dependencies**
- Install Hardhat and Hardhat Toolbox
- Install OpenZeppelin contracts (^5.0.0)
- Install OpenZeppelin contracts-upgradeable (^5.0.0)
- Install Chai and Ethers for testing
- Verify all dependencies resolve correctly

**Story 1.3: Configure Hardhat**
- Create hardhat.config.js with Solidity 0.8.20
- Enable optimizer (200 runs)
- Configure networks (hardhat, basedTestnet, basedMainnet)
- Set up environment variables (.env)
- Test compilation works

**Story 1.4: Initialize Testing Framework**
- Set up Chai assertion library
- Configure Ethers.js for contract interaction
- Create test helper utilities
- Verify test runner works

**Acceptance Criteria:**
- ✅ `npx hardhat compile` runs successfully
- ✅ `npx hardhat test` executes (even with no tests)
- ✅ All dependencies installed without conflicts
- ✅ Environment ready for contract development

---

## Epic 2: Interface Contracts

**Goal:** Define all contract interfaces for clean API separation

**Value:** Establishes contracts between components, enables parallel development

**Time Estimate:** 30 minutes original → ~1 hour with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 2
- Technical Reference: Section 2 (Interfaces)

**Stories:**

**Story 2.1: Define Core Market Interfaces**
- Create IPredictionMarket.sol interface
- Create IPredictionMarketFactory.sol interface
- Define all core market functions (bet, resolve, claim, etc.)
- Define events
- Verify interfaces compile

**Story 2.2: Define Supporting Contract Interfaces**
- Create IEnhancedNFTStaking.sol interface
- Create IGovernanceContract.sol interface
- Create IRewardDistributor.sol interface
- Create IBondManager.sol interface
- Create IFactoryTimelock.sol interface
- Define all functions and events
- Verify all interfaces compile

**Acceptance Criteria:**
- ✅ All 6 interface files created
- ✅ No implementation, only function signatures
- ✅ Comprehensive NatSpec documentation
- ✅ All interfaces compile without errors

---

## Epic 3: PredictionMarket Contract (CORE)

**Goal:** Implement complete prediction market functionality with all security fixes

**Value:** Core platform feature - enables betting and payouts

**Time Estimate:** 2 hours original → ~3-4 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 3
- Technical Reference: Section 3 (PredictionMarket Contract)
- All code examples for Fixes #1-6

**Stories:**

**Story 3.1: Implement Market Structure & State**
- Define state variables (totalYes, totalNo, positions, etc.)
- Implement market lifecycle states enum
- Create constructor with initialization logic
- Define modifiers (onlyActive, onlyResolver, etc.)

**Story 3.2: Implement Betting Functionality**
- Implement `placeBet()` function
- Position tracking per user per outcome
- Accept BASED payments via msg.value
- Emit BetPlaced events
- **Fix #6**: Implement 5-minute grace period

**Story 3.3: Implement Resolution Logic**
- Implement `resolve()` function (onlyResolver)
- Set winning outcome
- Start 48-hour finalization countdown
- Emit MarketResolved event

**Story 3.4: Implement Finalization & Fee Extraction**
- Implement `finalize()` function
- **Fix #3**: Check minimum 10,000 BASED volume OR refund
- **Fix #1**: Calculate creator fees (linear formula)
- **Fix #2**: Use multiply-before-divide for accuracy
- **Fix #4**: Extract all fees during finalization (pull pattern)
- Emit MarketFinalized event

**Story 3.5: Implement Claims & Refunds (Pull Pattern)**
- Implement `claimWinnings()` for winners
- Implement `claimCreatorFees()` for market creator
- Implement `claimPlatformFees()` for platform wallets
- Implement `claimRefund()` for failed markets
- **Fix #4**: Separate claim functions (reentrancy safe)
- Track claimed status per user

**Story 3.6: Implement Emergency Controls**
- Implement `reverseResolution()` function
- **Fix #5**: MAX_REVERSALS = 2 limit
- Implement `emergencyRefund()` function
- Only owner/authorized roles
- Emit emergency events

**Story 3.7: Write PredictionMarket Tests**
- Unit tests for all functions (12 tests minimum)
- Edge cases for fixes #1-6
- Gas profiling for key operations
- Integration test for complete market lifecycle

**Acceptance Criteria:**
- ✅ All 6 fixes (#1-6) implemented correctly
- ✅ Complete market lifecycle works end-to-end
- ✅ All tests passing
- ✅ Gas costs within ±10% of documented values
  - Place bet: ~180K gas
  - Claim winnings: ~85K gas

---

## Epic 4: Factory & Upgrade System (CRITICAL SECURITY)

**Goal:** Implement factory with UUPS upgradeability AND 48-hour timelock protection

**Value:** Enables market creation + prevents rug pulls

**Time Estimate:** 3 hours original (Phase 4 + 13) → ~5-6 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 4 + Phase 13 (CRITICAL)
- Technical Reference: Sections 4-5 (Factory + Timelock)
- TIMELOCK IS MANDATORY SECURITY FEATURE

**Stories:**

**Story 4.1: Implement PredictionMarketFactory Base**
- UUPS upgradeable pattern
- CREATE2 market deployment
- Market registry mapping
- Template registration system
- Market creation function

**Story 4.2: Implement Parameter Management**
- Global parameter storage
- Individual market overrides
- **Fix #8**: Cross-parameter validation (total fees ≤7%)
- Parameter update functions
- Min/max ranges enforcement

**Story 4.3: Implement Factory Upgrade Logic**
- UUPS upgrade authorization
- Integration with FactoryTimelock
- Version tracking
- Upgrade events

**Story 4.4: Implement FactoryTimelock Contract** 🔒 **CRITICAL**
- Queue upgrade function
- 48-hour delay enforcement
- Cancel upgrade function (public - ANYONE can cancel)
- Execute upgrade after delay
- Event emission for transparency
- **This prevents rug pulls!**

**Story 4.5: Write Factory Tests**
- Market creation tests (14 tests minimum)
- Parameter validation tests
- Upgrade tests with timelock
- Cross-parameter validation tests (Fix #8)

**Story 4.6: Write Timelock Tests** 🔒 **CRITICAL**
- Queue upgrade tests (18 tests minimum)
- Execute after 48 hours tests
- Cancel upgrade tests (ensure public access)
- Prevent immediate upgrade tests
- Community protection validation

**Acceptance Criteria:**
- ✅ Factory creates markets via CREATE2
- ✅ Fix #8 implemented (fees ≤7% validated)
- ✅ **Timelock enforces 48-hour delay**
- ✅ **Anyone can cancel malicious upgrades**
- ✅ All 32 tests passing (14 factory + 18 timelock)
- ✅ Create market gas: ~2.5M

---

## Epic 5: NFT Staking System (REVOLUTIONARY GAS SAVINGS)

**Goal:** Implement staking with deterministic rarity innovation

**Value:** 200M+ gas saved across platform lifecycle

**Time Estimate:** 2 hours original → ~3-4 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 5
- Technical Reference: Section 6 (Staking + Deterministic Rarity)
- **THIS IS A REVOLUTIONARY INNOVATION**

**Stories:**

**Story 5.1: Implement Deterministic Rarity System** ⚡ **INNOVATION**
- Pure function `getRarityMultiplier(tokenId)`
- Token ID ranges for each tier:
  - Common (1x): 0-6,999 (70%)
  - Rare (1.25x): 7,000-8,499 (15%)
  - Epic (3x): 8,500-8,999 (5%)
  - Legendary (4x): 9,000-9,899 (9%)
  - Mythic (5x): 9,900-9,999 (1%)
- **~300 gas vs ~20,000 gas external lookup!**
- No external calls required

**Story 5.2: Implement Staking Functionality**
- `stakeNFT()` function
- Transfer NFT to contract
- Track stake timestamp
- 24-hour minimum before rewards
- Emit StakeNFT event

**Story 5.3: Implement Batch Staking**
- `stakeMultiple()` function
- **Fix #9**: MAX_BATCH_SIZE = 100 NFTs
- Loop efficiency optimizations
- Batch event emission
- Gas profiling validation

**Story 5.4: Implement Unstaking**
- `unstakeNFT()` function
- Return NFT to owner
- Any time after 24-hour minimum
- Update voting power
- Emit UnstakeNFT event

**Story 5.5: Implement Voting Power Calculation**
- `calculateVotingPower()` function
- Tiered multipliers (1x, 3x, 5x) based on stake count
- 1-4 NFTs: 1x
- 5-9 NFTs: 3x
- 10+ NFTs: 5x
- Cache results for gas efficiency

**Story 5.6: Write Staking Tests**
- Unit tests (16 tests minimum)
- Deterministic rarity tests (verify all tiers)
- Batch staking tests (verify 100 limit - Fix #9)
- Gas profiling (verify ~300 gas rarity lookups)
- Voting power calculation tests

**Acceptance Criteria:**
- ✅ Deterministic rarity works (pure function)
- ✅ Fix #9 implemented (batch limit 100)
- ✅ Gas costs match documented:
  - Rarity lookup: ~300 gas
  - Single stake: ~215K gas
  - Batch 10: ~1.8M gas
- ✅ 200M+ gas savings validated vs traditional approach

---

## Epic 6: Governance System

**Goal:** Implement DAO governance with spam prevention

**Value:** Community-driven market creation

**Time Estimate:** 1.5 hours original → ~2-3 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 6
- Technical Reference: Section 7 (Governance)

**Stories:**

**Story 6.1: Implement Proposal Creation**
- `createProposal()` function
- **Fix #7**: 100K BASED bond requirement
- **Fix #7**: Proposal tax (1%)
- **Fix #7**: 24-hour cooldown after rejection
- Bond lock in BondManager
- Emit ProposalCreated event

**Story 6.2: Implement Voting System**
- `vote()` function
- Query staking contract for voting power
- Tiered power application
- Snapshot-based (prevent manipulation)
- Track votes per proposal
- Emit VoteCast event

**Story 6.3: Implement Proposal Execution**
- `executeProposal()` function
- Check >50% weighted approval
- Call factory to create market
- Refund bond on approval
- Transfer additional fee to treasury

**Story 6.4: Implement Spam Prevention**
- **Fix #7**: Blacklist capability
- **Fix #7**: Auto-blacklist after 3 rejections
- Cooldown tracking
- Blacklist management functions

**Story 6.5: Write Governance Tests**
- Proposal creation tests (17 tests minimum)
- Voting tests with different stake sizes
- Weighted voting validation
- Spam prevention tests (Fix #7)
- Blacklist tests

**Acceptance Criteria:**
- ✅ Fix #7 implemented completely
- ✅ 100K bond + cooldown + blacklist work
- ✅ Weighted voting accurate
- ✅ All 17 tests passing

---

## Epic 7: Bond Management

**Goal:** Implement bond lock/refund system

**Value:** Economic spam deterrent

**Time Estimate:** 1 hour original → ~2 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 7
- Technical Reference: Section 8 (Bonds)

**Stories:**

**Story 7.1: Implement Bond Deposit**
- `depositBond()` function
- Lock BASED tokens
- Track bond per proposal
- Emit BondDeposited event

**Story 7.2: Implement Bond Refund**
- `refundBond()` function
- Return bond on approval
- Return bond on rejection (after cooldown)
- Track refund status

**Story 7.3: Implement Bond Forfeiture**
- `forfeitBond()` function
- Burn or treasury on blacklist
- Integration with governance

**Story 7.4: Write Bond Tests**
- Bond deposit tests (16 tests minimum)
- Refund condition tests
- Forfeiture tests
- Edge cases

**Acceptance Criteria:**
- ✅ Bonds lock/unlock correctly
- ✅ All 16 tests passing

---

## Epic 8: Reward Distribution (MASSIVE GAS SAVINGS)

**Goal:** Implement Merkle tree reward distribution

**Value:** 50M+ gas saved, scales to 10K+ users

**Time Estimate:** 1.5 hours original → ~2-3 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 8
- Technical Reference: Section 9 (Rewards + Merkle)

**Stories:**

**Story 8.1: Implement Merkle Verification**
- `claim()` function
- Merkle proof verification logic
- Integrate OpenZeppelin MerkleProof library
- ~47K gas per claim

**Story 8.2: Implement Root Publishing**
- `publishDistribution()` function
- Store Merkle root on-chain
- Period ID tracking
- Emit DistributionPublished event

**Story 8.3: Implement Multi-Period Claims**
- `claimMultiplePeriods()` function
- Batch claims across weeks
- Bitmap tracking for claimed periods
- Gas optimization

**Story 8.4: Implement Dual-Token Support**
- TECH token transfers
- BASED token transfers
- Separate accounting
- Safe transfer patterns

**Story 8.5: Write Reward Tests**
- Merkle proof tests (19 tests minimum)
- Multi-period claim tests
- Invalid proof rejection tests
- Gas profiling (~47K validation)

**Acceptance Criteria:**
- ✅ Merkle verification works
- ✅ Multi-period claims supported
- ✅ Gas cost: ~47K per claim
- ✅ All 19 tests passing
- ✅ 50M+ gas savings vs traditional

---

## Epic 9: Comprehensive Testing

**Goal:** Achieve 212 tests with 100% pass rate

**Value:** Production-ready quality validation

**Time Estimate:** 4 hours original → ~6-8 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 9-11
- Technical Reference: Section 10 (Testing Strategy)

**Stories:**

**Story 9.1-9.3: Complete Unit Tests (86 tests total)**
- Cover all contracts individually
- Test all functions
- Test all state transitions

**Story 9.4-9.6: Edge Case Tests (45 tests total)**
- Boundary conditions
- Zero amounts
- Maximum values
- Attack vectors
- Overflow/underflow checks

**Story 9.7-9.9: Gas Profiling Tests (15 tests total)**
- Measure all operations
- Validate against documented costs
- Batch vs single comparisons
- Optimization validation

**Story 9.10-9.12: Integration Tests (30 tests total)**
- Full market lifecycle
- Staking + governance integration
- Reward distribution end-to-end
- Emergency scenarios
- Upgrade procedures

**Acceptance Criteria:**
- ✅ 212 tests total
- ✅ 100% pass rate
- ✅ ~95% code coverage
- ✅ All gas costs within ±10% of documented

---

## Epic 10: Validation & Final Fixes

**Goal:** Verify all 9 fixes and achieve quality score ≥9.0/10

**Value:** Production-ready confidence

**Time Estimate:** 3 hours original → ~4-5 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 12
- Validation Report (all 9 fixes)

**Stories:**

**Story 10.1: Validate All 9 Fixes**
- Fix #1: Linear fee formula ✅
- Fix #2: Multiply before divide ✅
- Fix #3: Minimum volume ✅
- Fix #4: Pull payment ✅
- Fix #5: Reversal limits ✅
- Fix #6: Grace period ✅
- Fix #7: Spam prevention ✅
- Fix #8: Cross-parameter validation ✅
- Fix #9: Batch limits ✅

**Story 10.2: Quality Score Validation**
- Code quality check
- Security audit (self)
- Gas optimization review
- Documentation completeness
- Target: ≥9.0/10

**Story 10.3: Gas Cost Validation**
- All costs within ±10%
- Create market: ~2.5M
- Place bet: ~180K
- Claim: ~85K
- Merkle claim: ~47K
- Rarity lookup: ~300

**Story 10.4: Code Cleanup**
- Remove debug code
- Optimize comments
- Consistent formatting
- Final NatSpec pass

**Acceptance Criteria:**
- ✅ All 9 fixes verified
- ✅ Quality score ≥9.0/10
- ✅ All gas costs validated
- ✅ Code production-ready

---

## Epic 11: Deployment Scripts

**Goal:** Create deployment automation for testnet and mainnet

**Value:** Reproducible deployments

**Time Estimate:** 2.5 hours original → ~4 hours with BMAD

**Documentation Reference:**
- Implementation Timeline: Phase 14
- Deployment checklists (40 + 45 steps)

**Stories:**

**Story 11.1: Create Testnet Deployment Script**
- Deploy all 7 contracts in order
- Initialize parameters
- Verify on block explorer
- Follow 40-step checklist

**Story 11.2: Create Mainnet Deployment Script**
- Same as testnet + production safeguards
- Multi-sig integration
- Follow 45-step checklist

**Story 11.3: Create Verification Scripts**
- Auto-verify contracts on block explorer
- Generate deployment report
- Save all addresses

**Story 11.4: Test on Local Network**
- Deploy to hardhat network
- Verify all interactions work
- Integration test complete flow

**Acceptance Criteria:**
- ✅ Deployment scripts work on hardhat
- ✅ All contracts deploy in correct order
- ✅ Verification works
- ✅ Ready for testnet deployment

---

## Implementation Notes

### Story Creation Process

When implementing, use BMAD workflows:

1. **create-story**: SM agent drafts detailed story from epic
2. **story-context**: Inject relevant documentation sections
3. **story-ready**: SM approves for development
4. **dev-story**: DEV agent implements with tests
5. **story-done**: Mark complete after validation

### Documentation References

All stories reference specific sections of:
- **01-IMPLEMENTATION-TIMELINE.md**: Step-by-step build process
- **02-COMPLETE-TECHNICAL-REFERENCE.md**: All code examples
- **KEKTECH_3.0_VALIDATION_REPORT.md**: All 9 fixes detailed

### Acceptance Criteria Pattern

Every story must have:
- ✅ Code implementation complete
- ✅ Tests written and passing
- ✅ Gas costs within ±10% of documented
- ✅ Documentation updated
- ✅ No regressions introduced

### Quality Gates

After each epic:
- Run complete test suite
- Validate gas costs
- Check code quality
- Verify against documentation

---

**Total Stories:** ~50-60 (exact count determined during implementation)
**Total Time:** 40-50 hours with BMAD tracking
**Target Quality:** ≥9.0/10 (original: 9.4/10)
**Target Tests:** 212 tests, 100% passing

---

_Document Version: 1.0_
_BMAD Framework: v6.0.0-alpha.0_
_Last Updated: October 24, 2025_
