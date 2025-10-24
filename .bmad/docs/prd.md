# KEKTECH 3.0 Prediction Markets - Product Requirements Document (PRD)

**Author:** Sir
**Date:** October 24, 2025
**Project Level:** 3 (Complex System)
**Target Scale:** 50-60 user stories across 11 epics
**Rebuild Status:** Precision recreation from validated 9.4/10 implementation

---

## Goals and Background Context

### Goals

This project aims to rebuild the complete KEKTECH 3.0 Prediction Markets platform exactly as originally implemented, achieving production-ready status with all features, innovations, and quality metrics from the documented build.

#### **CATEGORY 1: CORE SMART CONTRACT SYSTEM**

**Goal 1.1**: Implement PredictionMarket contract (658 lines)
- Binary YES/NO betting functionality
- Multi-user position tracking
- Market lifecycle management (Created → Active → Resolved → Finalized)
- Fee calculation and extraction
- Winner payout distribution
- Emergency refund mechanisms

**Goal 1.2**: Implement PredictionMarketFactory contract with UUPS upgradeability (507 lines)
- Market creation via factory pattern
- CREATE2 deterministic addressing
- Template registration system for multiple market types
- Parameter management and validation
- Integration with all supporting contracts

**Goal 1.3**: Implement FactoryTimelock contract for upgrade protection (213 lines) 🔒 **CRITICAL INNOVATION**
- 48-hour delay on factory upgrades
- Queue/execute/cancel upgrade mechanism
- Community cancellation capability (ANYONE can cancel)
- Rug-pull prevention system
- Maintains platform trust

**Goal 1.4**: Implement EnhancedNFTStaking contract (612 lines) ⚡ **REVOLUTIONARY INNOVATION**
- NFT staking/unstaking functionality
- **Deterministic rarity system** (saves 200M+ gas)
- Voting power calculation with caching
- Batch operations support (up to 100 NFTs)
- 24-hour minimum stake period
- Integration with KEKTECH NFT collection (4,200 NFTs)

**Goal 1.5**: Implement GovernanceContract with DAO capabilities (687 lines)
- Proposal creation and management
- Weighted voting based on staked NFTs
- Tiered voting power system (1x, 3x, 5x multipliers)
- Snapshot-based voting (prevents manipulation)
- Proposal execution after approval
- Integration with bond and staking systems

**Goal 1.6**: Implement BondManager contract (380 lines)
- Bond deposit and locking
- Bond refund mechanism
- Bond forfeiture on spam/abuse
- Economic spam deterrent
- Integration with governance proposals

**Goal 1.7**: Implement RewardDistributor contract (453 lines) 📦 **MASSIVE GAS SAVINGS**
- **Merkle tree-based reward distribution**
- Proof verification (~47K gas per claim vs ~100K traditional)
- Multi-period claiming support
- Bitmap tracking for claimed periods
- Dual-token support (TECH + BASED)
- Scales to 10,000+ users efficiently

#### **CATEGORY 2: THE 9 CRITICAL SECURITY FIXES** (ALL MANDATORY)

**Goal 2.1**: Fix #1 - Linear Additional Fee Formula
- Prevent excessive parabolic fee growth
- Linear scaling: 1,000 BASED = 1 bps additional fee

**Goal 2.2**: Fix #2 - Multiply Before Divide
- Prevent integer division rounding errors
- Formula: `(amount * pool) / total` not `(amount / total) * pool`

**Goal 2.3**: Fix #3 - Minimum Volume Protection
- Require ≥10,000 BASED volume OR trigger automatic refund
- Prevents low-volume manipulation

**Goal 2.4**: Fix #4 - Pull Payment Pattern
- Separate claimCreatorFees() and claimPlatformFees()
- Prevents reentrancy vulnerabilities
- Fair gas distribution across all claimers

**Goal 2.5**: Fix #5 - Emergency Reversal Limits
- MAX_REVERSALS = 2 per market
- Prevents infinite reversal loops

**Goal 2.6**: Fix #6 - Grace Period for Market Close
- 5-minute grace period after endTime
- Prevents front-running and race conditions

**Goal 2.7**: Fix #7 - Comprehensive Spam Prevention
- 100K BASED bond requirement for proposals
- 24-hour cooldown after rejection
- Blacklist capability after 3 failed proposals

**Goal 2.8**: Fix #8 - Cross-Parameter Validation
- Validate total fees ≤7% on every parameter change
- Prevents accidental fee cap violations

**Goal 2.9**: Fix #9 - Batch Operation Limits
- MAX_BATCH_SIZE = 100 NFTs per transaction
- Prevents gas limit exceeding

#### **CATEGORY 3: INTEGRATION WITH EXISTING INFRASTRUCTURE**

**Goal 3.1**: Integration with existing KEKTECH NFT Collection
- Address: `0x40B6184b901334C0A88f528c1A0a1de7a77490f1` (BASED Chain)
- 4,200 NFT collection
- Standard ERC721 (OpenZeppelin)

**Goal 3.2**: Integration with existing TECH Token
- Address: `0x62E8D022CAf673906e62904f7BB5ae467082b546`
- ERC20 standard (18 decimals)
- Daily emissions for staking rewards

**Goal 3.3**: Native BASED Token Integration
- BASED Chain native token
- Used for all betting and bonds
- No ERC20 approvals needed

#### **CATEGORY 4: FLEXIBLE PARAMETER SYSTEM**

**Goal 4.1**: Implement comprehensive ParameterStorage system
- All economic values as adjustable parameters
- Global defaults with individual market overrides
- Min/max ranges for safety
- No contract redeployment needed for tuning

**Goal 4.2**: Implement upgradeable architecture with timelock protection
- UUPS proxy pattern for factory
- 48-hour community review on upgrades
- Cancellation mechanism for malicious upgrades

#### **CATEGORY 5: ECONOMIC MODEL IMPLEMENTATION**

**Goal 5.1**: Implement two-lever creator incentive system
- Bond-based fee tier (10-100 bps for 5K-100K BASED bonds)
- Additional fee mechanism (linear scaling)
- Combined creator fees up to 200 bps (2.0%)

**Goal 5.2**: Implement platform fee distribution
- Team fee: 1.0% of volume
- Treasury fee: 1.5% of volume
- Burn fee: 0.5% of volume
- Total system cap: 5.0%

**Goal 5.3**: Implement proposal system economics
- Proposal tax: 1% of (bond + additional fee)
- Bond refundable on approval
- Additional fee non-refundable

**Goal 5.4**: Implement 48-hour resolution finalization window
- Pending period after resolution
- Community review time
- Emergency reversal capability (up to 2 times)
- Automatic finalization after 48 hours

#### **CATEGORY 6: COMPREHENSIVE TESTING SUITE**

**Goal 6.1**: Implement complete test suite (212 tests, 100% passing)
- Unit tests: 86 tests
- Edge case tests: 45 tests
- Gas profiling: 15 tests
- Integration tests: 30 tests
- Timelock tests: 18 tests

**Goal 6.2**: Achieve documented gas cost targets
- Create market: ~2.5M gas
- Place bet: ~180K gas
- Claim winnings: ~85K gas
- Merkle claim: ~47K gas
- Deterministic rarity: ~300 gas (vs ~20K traditional)

**Goal 6.3**: Achieve quality score targets
- Overall quality: ≥9.0/10 (original: 9.4/10)
- Security: ≥9.5/10
- Gas optimization: ≥9.5/10
- Test coverage: ≥95%

#### **CATEGORY 7: DEPLOYMENT INFRASTRUCTURE**

**Goal 7.1**: Create testnet deployment system (40-step checklist)
**Goal 7.2**: Create mainnet deployment system (45-step checklist)
**Goal 7.3**: Create deployment scripts and automation

#### **CATEGORY 8: ARCHITECTURAL PATTERNS**

**Goal 8.1**: Implement Registry pattern for contract discovery
**Goal 8.2**: Implement Factory pattern with CREATE2
**Goal 8.3**: Implement role-based access control
**Goal 8.4**: Implement pull-based claiming patterns

#### **CATEGORY 9: ADDITIONAL SYSTEM FEATURES**

**Goal 9.1**: Implement tiered voting power system
**Goal 9.2**: Implement emergency mechanisms
**Goal 9.3**: Implement comprehensive event architecture
**Goal 9.4**: Implement batch operation support

#### **CATEGORY 10: DOCUMENTATION & VALIDATION**

**Goal 10.1**: Maintain comprehensive inline documentation
**Goal 10.2**: Validate against original implementation (±10% gas costs, 100% test pass rate)

### Background Context

KEKTECH 3.0 represents the evolution of the KEKTECH ecosystem into decentralized prediction markets. The platform builds on existing KEKTECH infrastructure deployed on BASED Chain:

**Existing Assets:**
- **KEKTECH NFT Collection**: 4,200 NFTs deployed at `0x40B6184b901334C0A88f528c1A0a1de7a77490f1`
- **TECH Token**: ERC20 deployed at `0x62E8D022CAf673906e62904f7BB5ae467082b546`
- **Target Network**: BASED Chain (EVM-compatible, low fees, fast blocks)

**Previous Implementation (January 2025):**

A complete implementation was previously built and documented, achieving:
- **7 smart contracts** (6,124 lines total)
- **212 tests** (100% passing)
- **9.4/10 quality score**
- **3 revolutionary innovations** (250M+ gas saved)
- **18-20 hours** focused implementation time

**Why Rebuild:**

The original code is inaccessible, but **complete implementation documentation exists** (5,500+ lines across 4 documents):
- Step-by-step implementation timeline (14 phases)
- Complete technical specifications with all code examples
- All design decisions with rationale
- All test cases and expected results
- Measured gas costs for validation

This provides a **blueprint for precision recreation** with validated architecture (9.4/10 quality score).

**Rebuild Strategy:**

Follow the documented implementation timeline exactly, using BMAD methodology for systematic tracking. Each epic maps to original implementation phases. Each story includes code examples and acceptance criteria from documentation. Validate all metrics against documented targets.

---

## Requirements

### Functional Requirements

#### FR-1: Prediction Market Core Functionality
- **FR-1.1**: Users can create binary YES/NO prediction markets
- **FR-1.2**: Users can place bets on either outcome using BASED tokens
- **FR-1.3**: Markets have defined end times and resolution windows
- **FR-1.4**: Authorized resolvers can resolve markets to winning outcome
- **FR-1.5**: Winners can claim proportional payouts after finalization
- **FR-1.6**: Markets automatically finalize 48 hours after resolution
- **FR-1.7**: Emergency refunds available if minimum volume not met

#### FR-2: Fee System
- **FR-2.1**: Creator fees calculated using two-lever system (bond + additional)
- **FR-2.2**: Platform fees fixed at 3.0% (team 1%, treasury 1.5%, burn 0.5%)
- **FR-2.3**: Total fees capped at 5.0% (creator + platform ≤ 5%)
- **FR-2.4**: Fees extracted during finalization, not during claims
- **FR-2.5**: Pull payment pattern for creator and platform fee claims

#### FR-3: NFT Staking System
- **FR-3.1**: Users can stake KEKTECH NFTs to earn rewards
- **FR-3.2**: Deterministic rarity system assigns multipliers (1x-5x)
- **FR-3.3**: Batch staking supports up to 100 NFTs per transaction
- **FR-3.4**: Minimum 24-hour stake period before rewards accrue
- **FR-3.5**: Users can unstake anytime after minimum period
- **FR-3.6**: Voting power calculated from staked NFTs with tiered multipliers

#### FR-4: Governance & Proposals
- **FR-4.1**: Users can create market proposals with required bond (100K BASED)
- **FR-4.2**: Community votes weighted by staked NFT holdings
- **FR-4.3**: Tiered voting power (1x, 3x, 5x) based on stake size
- **FR-4.4**: 7-day voting period for all proposals
- **FR-4.5**: >50% approval required for market creation
- **FR-4.6**: Approved bonds refunded, rejected bonds refunded after cooldown
- **FR-4.7**: Blacklist capability after 3 failed proposals

#### FR-5: Reward Distribution
- **FR-5.1**: Weekly Merkle tree-based reward distribution
- **FR-5.2**: Users claim rewards with cryptographic proofs
- **FR-5.3**: Multi-period claims supported (batch multiple weeks)
- **FR-5.4**: Dual-token rewards (TECH + BASED)
- **FR-5.5**: Unclaimed rewards persist indefinitely

#### FR-6: Upgrade System
- **FR-6.1**: Factory upgradeable via UUPS proxy pattern
- **FR-6.2**: All upgrades queued with 48-hour timelock
- **FR-6.3**: Anyone can cancel queued upgrades
- **FR-6.4**: Upgrades executable only after timelock expires
- **FR-6.5**: Individual markets immutable after creation

#### FR-7: Parameter Management
- **FR-7.1**: All economic parameters adjustable without redeployment
- **FR-7.2**: Global defaults apply to all markets
- **FR-7.3**: Individual market overrides possible for special cases
- **FR-7.4**: Cross-parameter validation enforces constraints
- **FR-7.5**: Min/max ranges prevent misconfiguration

#### FR-8: Emergency Controls
- **FR-8.1**: Emergency resolution reversal (max 2 times per market)
- **FR-8.2**: Emergency market refund capability
- **FR-8.3**: Emergency unstake for NFTs
- **FR-8.4**: Blacklist management for spam prevention
- **FR-8.5**: Owner override functions for critical situations

### Non-Functional Requirements

#### NFR-1: Performance & Gas Optimization
- **NFR-1.1**: Create market: ≤2.5M gas
- **NFR-1.2**: Place bet: ≤180K gas
- **NFR-1.3**: Claim winnings: ≤85K gas
- **NFR-1.4**: Merkle claim: ≤47K gas
- **NFR-1.5**: Rarity lookup: ≤300 gas (98.5% reduction vs traditional)
- **NFR-1.6**: Batch stake 10 NFTs: ≤1.8M gas (~180K each)
- **NFR-1.7**: Total gas savings: 250M+ across platform lifecycle

#### NFR-2: Security
- **NFR-2.1**: All 9 critical security fixes implemented
- **NFR-2.2**: Reentrancy guards on all external functions
- **NFR-2.3**: Pull payment pattern prevents reentrancy
- **NFR-2.4**: Access control on all admin functions
- **NFR-2.5**: Timelock prevents malicious upgrades
- **NFR-2.6**: Input validation on all user inputs
- **NFR-2.7**: Safe math for all calculations (Solidity 0.8+)
- **NFR-2.8**: Security score: ≥9.5/10

#### NFR-3: Quality & Testing
- **NFR-3.1**: 212 tests with 100% pass rate
- **NFR-3.2**: Test coverage ≥95%
- **NFR-3.3**: All edge cases tested
- **NFR-3.4**: Gas profiling for all operations
- **NFR-3.5**: Integration tests for complete workflows
- **NFR-3.6**: Overall quality score: ≥9.0/10

#### NFR-4: Scalability
- **NFR-4.1**: Merkle distribution scales to 10,000+ users
- **NFR-4.2**: Batch operations support 100 NFTs per transaction
- **NFR-4.3**: No loops over unbounded arrays
- **NFR-4.4**: Constant-time rarity lookups
- **NFR-4.5**: Efficient event indexing for backend

#### NFR-5: Maintainability
- **NFR-5.1**: Comprehensive inline documentation (NatSpec)
- **NFR-5.2**: Clear separation of concerns
- **NFR-5.3**: Modular architecture
- **NFR-5.4**: Upgradeable where appropriate
- **NFR-5.5**: Well-documented design decisions

#### NFR-6: Reliability
- **NFR-6.1**: Graceful handling of edge cases
- **NFR-6.2**: Comprehensive error messages
- **NFR-6.3**: Emergency mechanisms for issue recovery
- **NFR-6.4**: Fail-safe defaults
- **NFR-6.5**: Predictable behavior under all conditions

#### NFR-7: Compatibility
- **NFR-7.1**: BASED Chain mainnet compatible
- **NFR-7.2**: Standard ERC721 for NFT integration
- **NFR-7.3**: Standard ERC20 for token integration
- **NFR-7.4**: OpenZeppelin library compatibility
- **NFR-7.5**: Solidity 0.8.20+ compiler

---

## User Journeys

### Journey 1: Market Creator

**Persona:** Alex, experienced trader who wants to create a prediction market

**Goal:** Create a high-quality market and earn creator fees

**Journey:**
1. **Planning**: Alex researches a market topic and determines optimal bond/fee structure
2. **Proposal Submission**: Alex submits proposal with 100K BASED bond + additional fee
   - Pays 1% proposal tax
   - Locks bond and additional fee in escrow
3. **Community Vote**: NFT holders vote on Alex's proposal over 7-day period
4. **Market Creation**: If >50% approval, market automatically created by factory
5. **Market Lifecycle**: Users bet on the market Alex created
6. **Resolution**: Authorized resolver sets winning outcome after end time
7. **Fee Collection**: After 48-hour finalization, Alex claims creator fees
8. **Bond Refund**: Alex claims refunded bond (100K BASED returned)

**Value:** Alex earns 0.5%-2.0% of total volume based on bond/fee choices

### Journey 2: Bettor/Trader

**Persona:** Bailey, casual user betting on outcomes

**Goal:** Bet on outcomes and claim winnings

**Journey:**
1. **Discovery**: Bailey browses active markets on platform
2. **Analysis**: Bailey reads market details and analyzes odds
3. **Bet Placement**: Bailey bets 1,000 BASED on YES outcome
   - Transaction costs ~180K gas
   - Position recorded on-chain
4. **Wait for Resolution**: Market runs until end time
5. **Resolution**: Resolver sets outcome (YES wins)
6. **Finalization**: 48-hour window passes, market finalizes
7. **Claim Winnings**: Bailey claims proportional share of losing side
   - Receives original 1,000 BASED + share of NO bets
   - Minus platform and creator fees
   - Transaction costs ~85K gas

**Value:** Bailey earns profit from correct prediction

### Journey 3: NFT Staker

**Persona:** Casey, KEKTECH NFT holder seeking passive rewards

**Goal:** Stake NFTs to earn weekly rewards

**Journey:**
1. **NFT Ownership**: Casey owns 5 KEKTECH NFTs (mixed rarities)
2. **Rarity Check**: Casey checks rarity multipliers (deterministic)
   - NFT #1000: Common (1x)
   - NFT #2500: Rare (1.25x)
   - NFT #8700: Epic (3x)
   - NFT #9200: Legendary (4x)
   - NFT #9950: Mythic (5x)
3. **Staking**: Casey stakes all 5 NFTs in one transaction (~900K gas)
4. **Voting Power**: Casey's voting power calculated (tiered: 5 NFTs = 3x = 15 votes)
5. **Reward Accrual**: After 24 hours, rewards start accruing
6. **Weekly Distribution**: Weekly Merkle tree published
7. **Claim Rewards**: Casey claims accumulated TECH + BASED
   - Multi-week claiming supported
   - Only ~47K gas per claim
8. **Unstake**: Casey can unstake anytime to trade or transfer NFTs

**Value:** Casey earns passive income from trading fees + TECH emissions

### Journey 4: Governance Participant

**Persona:** Drew, engaged community member voting on proposals

**Goal:** Influence platform direction through governance

**Journey:**
1. **Stake NFTs**: Drew stakes 12 KEKTECH NFTs for voting power
   - Tiered power: 12 NFTs = 5x = 60 votes
2. **Review Proposals**: Drew reviews active market proposals
3. **Vote**: Drew votes YES on high-quality proposal
   - Voting weight: 60 (from 12 staked NFTs)
4. **Monitor Results**: Drew tracks voting progress over 7 days
5. **Approval**: Proposal passes with >50% weighted approval
6. **Market Creation**: Market automatically created
7. **Ongoing Participation**: Drew continues voting on future proposals

**Value:** Drew shapes platform growth and market quality

---

## UX Design Principles

**Note:** This project focuses on smart contract implementation (backend). Frontend UX is out of scope for Phase 1.

### Smart Contract UX Principles

**Principle 1: Gas Efficiency**
- Minimize gas costs for all user operations
- Batch operations where possible
- Optimize storage patterns
- Use deterministic calculations over external calls

**Principle 2: User Sovereignty**
- Pull-based claiming (users control timing)
- No automatic transfers
- Explicit actions required for all state changes
- Users can exit positions anytime (after minimums)

**Principle 3: Safety First**
- Grace periods prevent front-running
- Timelock prevents malicious upgrades
- Emergency mechanisms for recovery
- Clear error messages for failures

**Principle 4: Transparency**
- All state changes emit events
- Deterministic calculations (users can verify)
- Clear parameter visibility
- Predictable outcomes

**Principle 5: Simplicity**
- Clean function interfaces
- Standard patterns (ERC20, ERC721)
- Minimal complexity
- Well-documented behavior

---

## User Interface Design Goals

**Status:** OUT OF SCOPE for Phase 1 (Smart Contract Implementation)

**Future Phases:**
- Phase 2 could include frontend implementation
- Next.js 15 + Wagmi 2.18 (as used in original)
- Wallet integration (MetaMask, WalletConnect)
- Market browsing interface
- Real-time updates
- Responsive design

---

## Epic List

This project consists of **11 major epics** sequenced for logical implementation:

**Epic 1: Project Foundation & Environment** (~4 hours)
- Initialize development environment
- Set up Hardhat, OpenZeppelin, testing framework
- Create project structure

**Epic 2: Interface Contracts** (~1 hour)
- Define all contract interfaces
- Establish API contracts between components

**Epic 3: PredictionMarket Contract** (~3-4 hours)
- Implement core market functionality
- All betting, resolution, claiming logic
- Implement Fixes #1-6

**Epic 4: Factory & Upgrade System** (~5-6 hours) 🔒
- PredictionMarketFactory with UUPS proxy
- **FactoryTimelock for 48-hour protection** (CRITICAL)
- Parameter management
- Implement Fixes #7-8

**Epic 5: NFT Staking System** (~3-4 hours) ⚡
- EnhancedNFTStaking contract
- **Deterministic rarity innovation** (200M gas saved)
- Batch operations
- Implement Fix #9

**Epic 6: Governance System** (~2-3 hours)
- GovernanceContract with DAO
- Proposal system
- Weighted voting
- Spam prevention

**Epic 7: Bond Management** (~2 hours)
- BondManager contract
- Lock/refund/forfeit logic
- Economic deterrent

**Epic 8: Reward Distribution** (~2-3 hours) 📦
- RewardDistributor contract
- **Merkle tree innovation** (50M+ gas saved)
- Multi-period claiming

**Epic 9: Comprehensive Testing** (~6-8 hours)
- 212 tests across all categories
- Unit, edge case, integration, gas profiling
- Achieve 100% pass rate

**Epic 10: Validation & Final Fixes** (~4-5 hours)
- Complete validation checklist
- Verify all 9 fixes implemented
- Quality score validation (≥9.0/10)
- Gas cost validation (±10%)

**Epic 11: Deployment Scripts** (~4 hours)
- Testnet deployment (40-step checklist)
- Mainnet deployment (45-step checklist)
- Verification and monitoring setup

**Total Estimated Time:** 40-50 hours with BMAD tracking (original: 18-20 hours)

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

The following items are documented but **OUT OF SCOPE** for this rebuild:

### Future Market Types (Post-MVP)
- **Multi-Outcome Markets**: Markets with 3-5 possible outcomes
- **Duel Markets**: Head-to-head betting between two entities
- **NFT Battle Markets**: Collection vs collection competitions
- **Crowdfunding Markets**: Markets with beneficiary fee routing

### Advanced Governance Features
- **Fully Decentralized Resolution**: Community-based resolution (vs authorized resolvers)
- **Delegate Voting**: Vote delegation system
- **Quadratic Voting**: Alternative voting mechanism
- **Governance Reputation**: Reputation-based governance

### Frontend Application
- **Web Interface**: Next.js application (separate project)
- **Mobile App**: Native or PWA mobile interface
- **Analytics Dashboard**: Platform statistics and metrics
- **Admin Panel**: Parameter management interface

### Backend Services
- **API Server**: RESTful API for platform data
- **Event Indexer**: Automated event monitoring
- **Reward Calculator**: Weekly Merkle tree generation
- **Notification System**: User alerts and updates

### Integration Enhancements
- **Oracle Integration**: Automated resolution via oracles
- **Cross-Chain Bridge**: Multi-chain deployment
- **DEX Integration**: Liquidity provision
- **Social Features**: Comments, reputation, leaderboards

### Advanced Features
- **Market Pausing**: Temporary market suspension
- **Partial Claims**: Claim subsets of winnings
- **Market Categories**: Categorization and filtering
- **Market Templates**: Pre-configured market types
- **Liquidity Pools**: Automated market making

### Quality Enhancements
- **Formal Verification**: Mathematical proof of correctness
- **Professional Security Audit**: Third-party audit ($50K-$100K)
- **Bug Bounty Program**: Community security program
- **Performance Optimization**: Further gas reductions
- **Documentation Website**: Comprehensive user/dev docs

---

**For Implementation:** Use the BMAD workflows to systematically build this platform following the documented implementation timeline. Each epic in [epics.md](./epics.md) maps to specific phases from the original build process, with all code examples and acceptance criteria included.

**Target:** Match or exceed the original 9.4/10 quality score with 100% test pass rate and all documented gas cost targets achieved.

---

_Document Version: 1.0_
_BMAD Framework: v6.0.0-alpha.0_
_Last Updated: October 24, 2025_
