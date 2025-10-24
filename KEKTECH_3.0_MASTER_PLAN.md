# KEKTECH 2.0 - COMPREHENSIVE MASTER PLAN

**Version:** 1.0  
**Date:** October 23, 2025  
**Status:** Definitive Implementation Blueprint  
**Network:** BASED Network (Native BASED Token)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Vision & Core Philosophy](#vision--core-philosophy)
3. [System Architecture Overview](#system-architecture-overview)
4. [Economic Model](#economic-model)
5. [Smart Contract Specifications](#smart-contract-specifications)
6. [Proposal & Governance System](#proposal--governance-system)
7. [NFT Staking & Reward Distribution](#nft-staking--reward-distribution)
8. [Market Types & Mechanics](#market-types--mechanics)
9. [Parameter Management System](#parameter-management-system)
10. [Role-Based Access Control](#role-based-access-control)
11. [Event Architecture & Analytics](#event-architecture--analytics)
12. [User Experience Flows](#user-experience-flows)
13. [Frontend Integration](#frontend-integration)
14. [Phased Implementation Roadmap](#phased-implementation-roadmap)
15. [Testing & Quality Assurance Strategy](#testing--quality-assurance-strategy)
16. [Deployment Plan](#deployment-plan)
17. [Security Considerations](#security-considerations)
18. [Future Enhancements](#future-enhancements)
19. [Technical Requirements](#technical-requirements)
20. [Success Metrics & KPIs](#success-metrics--kpis)

---

## 1. EXECUTIVE SUMMARY

KEKTECH 2.0 represents a next-generation prediction market platform that integrates NFT staking rewards with flexible market creation and community governance. Built exclusively on the BASED Network, the platform enables users to create and participate in prediction markets while earning rewards through NFT staking and active participation.

### Key Innovations

**Two-Lever Creator Incentive System**: Market creators control their earning potential through two independent mechanisms. First, they choose bond amounts that serve as refundable collateral while unlocking base creator fee percentages. Second, they can optionally pay additional creation fees that permanently increase their creator percentage beyond what bonds alone provide. This dual-lever system aligns creator incentives with market quality while providing strategic flexibility based on confidence levels.

**Hybrid Reward Distribution**: The platform combines daily TECH token emissions with market trading fees distributed to NFT stakers. Using Merkle tree proofs for gas-efficient claiming, users accumulate rewards across multiple distribution periods and claim them whenever convenient. Both TECH tokens and BASED tokens flow through the same distribution system, providing unified reward management.

**Global Parameters with Individual Overrides**: All platform economics are controlled through adjustable parameters stored in the ParameterStorage contract. Normal markets use global default parameters that apply consistently across the platform. Special markets like crowdfunding or charity markets can receive individual parameter overrides that customize their fee structures without affecting global settings. This pattern provides operational flexibility while maintaining consistency.

**Community-Driven Governance**: Market proposals require community approval through a voting system weighted by staked NFT holdings. Users with larger staked positions receive tiered voting power, aligning governance influence with platform commitment. The proposal system includes a small tax that funds team operations, bonds that ensure creator accountability, and optional additional fees that unlock enhanced creator earnings.

**48-Hour Resolution Window**: When markets resolve, they enter a 48-hour pending period before becoming finalized. During this window, the community can comment on the resolution and the team can review feedback. If disputes arise, emergency override functions allow resolution reversal or full market refunds. After 48 hours pass without intervention, markets automatically finalize and winners can claim payouts. This provides safety without requiring constant manual oversight.

### Platform Scope

The MVP focuses on Standard prediction markets with binary YES/NO outcomes and Multi-Outcome markets supporting up to five possible outcomes. Users can bet on multiple outcomes simultaneously within multi-outcome markets, enabling hedging strategies. The crowdfunding market type is included in MVP, allowing creators to designate beneficiary addresses that receive configurable percentages of trading fees.

Advanced market types including Duel markets for head-to-head betting, NFT Battle markets for collection competitions, and fully decentralized governance mechanisms are documented for future implementation but excluded from MVP to maintain manageable scope and faster launch timelines.

### Success Criteria

The platform succeeds when it achieves sustainable economic loops where market creators profit from high-quality markets, NFT stakers earn meaningful rewards from platform fees, and traders find markets attractive enough to generate consistent volume. Parameter flexibility ensures the team can tune economics based on real-world behavior rather than theoretical models. The modular architecture enables continuous evolution without requiring contract redeployments.

---

## 2. VISION & CORE PHILOSOPHY

### The Problem We're Solving

Traditional prediction markets suffer from rigid economic structures that can't adapt to changing user behavior. Market creators have fixed fee percentages that don't reflect the risk and effort involved in creating quality markets. Reward distribution often requires expensive on-chain calculations or centralized points of failure. Governance systems give equal voice to casual users and committed long-term participants, leading to capture by short-term actors.

KEKTECH 2.0 addresses these challenges through flexible parameterization, hybrid on-chain and off-chain architecture, and incentive alignment between all participant types. The platform treats adaptability as a core requirement rather than an afterthought.

### Core Principles

**Flexibility First**: Every numeric value in the system is a parameter rather than a hardcoded constant. Fee percentages, bond amounts, reward rates, voting thresholds, and time periods can all be adjusted through ParameterStorage without contract redeployment. This flexibility recognizes that we cannot predict optimal values in advance and must iterate based on observed behavior.

**Simplicity Over Complexity**: Where two approaches achieve similar outcomes, the simpler approach is preferred. Complex dynamic scaling logic is avoided in favor of well-designed parameter ranges. On-chain computation is minimized by moving calculations off-chain when security doesn't require on-chain execution. The codebase should be auditable by the team rather than requiring external security firms initially.

**Alignment Through Incentives**: Every participant type should profit when the platform succeeds and bear costs when it fails. Market creators earn more when they generate high volume. NFT stakers earn more when markets generate fees. Voters gain influence by staking NFTs, aligning governance power with platform commitment. The team earns consistent revenue through proposal taxes, aligning operational sustainability with market creation activity.

**User Sovereignty**: Users control their own fund flows through pull-based claiming rather than push-based distribution. Stakers claim rewards when convenient for gas optimization. Market winners claim payouts on their schedule. Bond refunds require explicit claiming. This pattern prevents the platform from holding user funds hostage while avoiding automatic transfers that could fail or be exploited.

**Progressive Decentralization**: The platform launches with team control over resolution authority and parameter management, building trust through fair operation. As the community matures and processes prove reliable, authority gradually transfers to community governance. This phased approach balances safety during early vulnerability with eventual decentralization as the platform stabilizes.

### Why BASED Network

The BASED Network provides an ideal foundation for KEKTECH 2.0 due to its low transaction costs, fast block times, and native token integration. Users interact with BASED tokens directly through their wallets without requiring ERC-20 approvals. The network's growing ecosystem provides existing liquidity and user bases that can discover and adopt the platform organically.

Future expansion to other chains remains possible through the Registry pattern, but initial focus on BASED ensures platform resources concentrate on delivering excellent user experience on one network rather than fragmenting across multiple chains with varying characteristics.

---

## 3. SYSTEM ARCHITECTURE OVERVIEW

### Architectural Patterns

KEKTECH 2.0 employs several interconnected architectural patterns that work together to create a flexible, upgradeable, and secure system. Understanding these patterns is essential for grasping how the platform operates and evolves.

**Registry Pattern**: The Registry contract serves as the central directory for all other contracts in the system. When one contract needs to interact with another, it queries the Registry to discover the current address. For example, when the FlexibleMarketFactory needs to access ParameterStorage, it calls Registry.getContract with the identifier for ParameterStorage and receives the current address. This indirection enables contract upgrades without breaking integrations. If ParameterStorage needs to be upgraded to fix a bug or add features, a new version deploys to a new address, the Registry updates to point to the new address, and all other contracts automatically start using the new version on their next interaction. Existing markets continue functioning because they already cached parameter values they needed at creation time.

**Parameter Storage Pattern**: Instead of hardcoding numeric values throughout contracts, all configurable values live in the ParameterStorage contract organized by category and parameter name. Contracts read these values when needed through standardized getter functions. This centralization makes parameter management straightforward. When you want to adjust the team fee percentage, you call one update function on ParameterStorage rather than redeploying multiple contracts. The parameter storage also maintains min/max ranges for each parameter and enforces maximum change percentages per update to prevent accidental misconfiguration. Historical parameter values are tracked through events, creating an audit trail of economic changes.

**Factory Pattern with CREATE2**: The FlexibleMarketFactory uses CREATE2 opcode to deploy prediction market contract instances with deterministic addresses. When a market proposal is approved, the factory clones an implementation contract rather than deploying from scratch. This makes market creation gas-efficient because the implementation bytecode isn't repeatedly deployed. The factory maintains mappings of all created markets, enabling efficient queries for market discovery and indexing. Each market type has its own implementation template registered with the factory, and adding new market types requires only deploying a new template and registering it with the factory.

**Merkle Tree Distribution**: Rather than pushing rewards to all stakers through expensive batch transactions, the platform uses Merkle tree proofs for pull-based claiming. The off-chain distribution script calculates rewards for all users, constructs a Merkle tree from the results, and publishes only the root hash on-chain to the RewardDistributor contract. Users generate proofs from the full tree data and submit claims that the contract verifies against the stored root. This pattern enables distributing rewards to thousands of users with minimal gas costs. The contract stores roots for multiple distribution periods, allowing users to claim across periods in single transactions. Unclaimed rewards remain claimable indefinitely since the proofs remain valid as long as the distribution data persists.

**Role-Based Access Control**: OpenZeppelin's AccessControl contract provides granular permission management. Multiple roles exist for different operational needs including owner, resolver, parameter manager, and emergency responder. The owner role has ultimate authority and is the only role that can grant or revoke other roles. Operational roles like resolver can perform specific functions like resolving markets but cannot change critical parameters or assign roles. This separation of concerns limits damage from compromised operational keys while maintaining efficiency. Team members receive only the specific permissions needed for their responsibilities.

### Contract Interaction Flow

To understand how these patterns work together, consider the complete flow when a market creator submits a proposal. The creator interacts with the ProposalSystem contract, providing their market question, parameters, and payment for bond, additional creation fee, and proposal tax. The ProposalSystem queries Registry to find ParameterStorage and reads the required bond ranges, fee formulas, and tax percentage. It validates the creator's inputs against these parameters and calculates their earned creator fee percentage. If valid, it transfers the proposal tax to the team wallet, holds the bond and additional creation fee in escrow, and creates a proposal record in storage. The proposal enters the voting period.

Community members query the ProposalSystem for active proposals and see the creator's market details. They connect their wallets and call the vote function, passing their support or rejection. The ProposalSystem queries Registry to find the EnhancedNFTStaking contract and calls it to determine the voter's staked NFT count. Using the tiered voting parameters from ParameterStorage, it calculates the voter's voting weight and records their vote with that weight. If tiered voting is disabled via the toggle parameter, every voter receives weight of one regardless of staked NFTs.

After the voting period concludes and the proposal has sufficient weighted support, the proposal status changes to approved. The ProposalSystem emits an event that the backend monitors. When approved, anyone can call the createMarketFromProposal function which triggers the factory. The ProposalSystem queries Registry to find FlexibleMarketFactory and calls its market creation function, passing the proposal details and the creator's earned fee percentage.

The FlexibleMarketFactory queries Registry for ParameterStorage to read platform fee percentages for team, treasury, and burn. It sums the creator's earned percentage plus these platform fees and confirms the total doesn't exceed the configured total fee cap. Since caps are prevented by parameter design, this check should never fail, but the validation exists as a safety measure. The factory deploys a new PredictionMarket contract instance using CREATE2, configured with the market question, end time, fee structure, and creator address. The factory calls the BondManager contract to transfer the creator's bond from the ProposalSystem to the BondManager for escrow. It transfers the additional creation fee from ProposalSystem to the rewards treasury wallet. The factory records the new market address in its market registry and emits a comprehensive MarketCreated event with all parameters.

The new PredictionMarket contract is now live and independent. Users can place bets by calling the placeBet function with their chosen outcome and sending BASED tokens. The market contract tracks each user's positions across outcomes. When the market end time arrives, authorized resolvers call the resolve function with the winning outcome. The market enters the 48-hour pending finalization state. After the period elapses without emergency intervention, anyone calls the finalize function which changes the state to finalized. Winners call the claim function to receive their proportional share of the losing side's bets minus fees.

During claiming, the market calculates total fees by applying each fee percentage to the total trading volume. The creator receives their earned percentage directly from volume. The team wallet, treasury wallet, and burn address receive their respective percentages. The remaining volume distributes to winners proportionally. The market emits events for all these transfers, enabling the backend to track fee flows and update analytics.

Meanwhile, the weekly distribution script has been monitoring all markets and staking activity. It calculates that the creator earned fees from their market, stakers earned their share of trading fees and daily TECH emissions, and active participants earned activity rewards. The script builds a Merkle tree with all reward allocations, publishes the root to the RewardDistributor contract, and stores the full tree data on the backend server. Users visit the staking interface where the frontend queries the contract for the latest distribution root, fetches the corresponding tree data from the backend, calculates the user's claimable rewards, and displays the amounts. Users click claim, the frontend generates Merkle proofs, and users submit transactions that the contract verifies and processes, transferring TECH and BASED tokens to the users.

This complete flow demonstrates how the architectural patterns enable modularity, upgradeability, and efficiency. Each contract has clear responsibilities, contracts discover each other through Registry enabling upgrades, parameters control behavior enabling tuning, and the Merkle distribution minimizes gas costs while maintaining security.

### Data Flow Diagram

Understanding the data flows through the system clarifies how information moves between on-chain contracts, off-chain backend services, and frontend applications.

**On-Chain Data Creation**: Smart contracts on the BASED blockchain create data through transactions. Market creation transactions write new market records to the factory's storage. Bet placement transactions write user position data to market contracts. Vote transactions write vote records to the proposal system. Staking transactions write staked NFT records to the staking contract. All of these state changes emit events that contain the relevant data in structured formats.

**Event Indexing**: The backend runs event monitoring services that subscribe to events from all contracts. When a MarketCreated event fires, the indexer captures the market address, creator address, market type, question, end time, and all fee parameters. It writes this data to the PostgreSQL database in a markets table. When a BetPlaced event fires, the indexer writes the bettor address, market address, outcome, amount, and timestamp to a bets table. All events get systematically indexed into the database, creating a queryable view of all on-chain activity.

**Off-Chain Computation**: The distribution calculation script runs weekly on the backend server. It queries the database for all staking positions, market fee distributions, and user activities during the period. Using the rarity tiers from the JSON file and the reward rate parameters, it calculates each user's earned TECH tokens from staking. Using the market fee data, it calculates each user's share of BASED token distributions from trading fees. It combines these into total reward allocations per user, builds the Merkle tree structure, calculates the root hash, and generates proofs for each leaf. The root hash gets submitted to the RewardDistributor contract through a transaction. The full tree data and individual proofs get stored in database tables and optionally to IPFS for decentralization.

**Frontend Queries**: When users visit the KEKTECH website, the Next.js frontend queries both the blockchain and the backend database. For real-time data like current market odds or user balances, it queries the blockchain directly through web3 providers. For historical data like past markets or leaderboards, it queries the backend API which returns pre-aggregated data from the database. For reward claiming, it fetches the latest Merkle root from the blockchain, retrieves the user's proof from the backend API, and constructs claim transactions that combine on-chain verification with off-chain proof data.

**User Transactions**: When users interact with the platform, their transactions flow from the frontend through their wallet to the blockchain. The frontend constructs transaction calls with appropriate parameters, prompts the user's wallet for signing, and broadcasts signed transactions to the network. Contracts process these transactions, update state, and emit events. The event indexer picks up these new events and updates the database. The frontend updates its display by re-querying either the blockchain or the database depending on the data type.

This data flow architecture separates concerns appropriately. The blockchain serves as the source of truth for ownership and value transfer. The backend serves as the indexing and computation layer that makes complex queries efficient. The frontend serves as the user interface that translates between human interactions and contract calls. Each layer has clear responsibilities and well-defined interfaces.

### Technology Stack

**Smart Contracts**: Written in Solidity version 0.8.20 or higher, compiled with optimization enabled. Uses OpenZeppelin contracts version 5.x for standard implementations of access control, token standards, and security patterns. Deployed to BASED Network using Hardhat deployment scripts with contract verification on the BASED blockchain explorer.

**Backend Services**: Node.js version 18 or higher provides the runtime for all backend services. PostgreSQL version 14 or higher stores indexed event data, user sessions, and computed analytics. Web3.js library connects to BASED Network RPC endpoints for reading blockchain data and submitting transactions. The distribution calculation script uses JavaScript for Merkle tree construction and proof generation. Express.js provides REST API endpoints for frontend consumption.

**Frontend Application**: Next.js version 15 with TypeScript provides the web application framework. Wagmi library handles wallet connection and web3 interactions in React hooks. Ethers.js or Viem provides lower-level blockchain interaction capabilities. Tailwind CSS provides styling. The application deploys to Vercel with separate production and private testing deployments.

**Infrastructure**: VPS hosts the backend services including event indexers, API servers, and distribution scripts. PostgreSQL database runs on the same VPS or separate database service. IPFS optionally stores distribution data for decentralized access. The frontend deploys to Vercel's edge network. GitHub hosts all source code repositories with separate repositories for contracts, backend, and frontend.

**Development Tools**: Hardhat provides the smart contract development environment including compilation, testing, deployment, and verification. Jest provides backend service testing. Playwright or Cypress provides end-to-end frontend testing. GitHub Actions provides CI/CD pipelines for automated testing and deployment.

This stack prioritizes proven technologies with strong community support over bleeding-edge experiments. Each component has been battle-tested in production environments and has extensive documentation and troubleshooting resources available.

---

## 4. ECONOMIC MODEL

### The Two-Lever Creator Incentive System

Market creators face a fundamental challenge when deciding whether to invest resources into creating a market. They must estimate potential trading volume, assess their earning potential, and weigh this against the upfront costs and risks. KEKTECH 2.0 addresses this through a sophisticated two-lever system that gives creators precise control over their risk-reward profile.

**Lever One - The Bond Mechanism**: When creators submit market proposals, they must provide a bond denominated in BASED tokens. This bond serves multiple purposes simultaneously. Primarily, it acts as security collateral ensuring creators have skin in the game and won't abandon or manipulate their markets. The bond amount directly determines the creator's base fee percentage, with larger bonds unlocking higher percentages. The relationship between bond size and earned percentage is linear within the configured range. If parameters set minimum bond at 5,000 BASED earning 0.1% creator fees and maximum bond at 100,000 BASED earning 1% creator fees, then a 50,000 BASED bond earns approximately 0.55% through linear interpolation.

The critical characteristic of bonds is refundability. When markets resolve successfully without disputes, creators can claim their full bond back through the BondManager interface. This means the bond represents locked capital rather than spent capital. A creator with sufficient liquidity can afford to put up large bonds repeatedly because they recoup these bonds as markets conclude. This design favors creators who can demonstrate long-term commitment through capital availability while still protecting the platform through the temporary lock.

**Lever Two - The Additional Creation Fee**: On top of their mandatory bond, creators can optionally pay additional creation fees that permanently increase their creator fee percentage beyond what the bond alone provides. Unlike bonds which return after successful market resolution, additional fees are non-refundable and flow immediately to the rewards treasury when proposals are approved. This fee purchases incremental creator percentage points using a configured formula.

The additional fee parameters define the relationship between fee paid and percentage gained. Using example values, each 20,000 BASED paid as additional fee might add 0.2% to the creator percentage, with a maximum additional fee of 100,000 BASED adding 1% total. Combined with the maximum 1% from bonds, a creator could reach 2% total creator fees by putting up 100,000 BASED bond and paying 100,000 BASED additional fee, totaling 200,000 BASED investment with 100,000 refundable and 100,000 permanent spend.

**Strategic Decision Making**: This two-lever system creates interesting strategic choices. Conservative creators with limited capital or uncertainty about market popularity put up small bonds and pay zero additional fees, accepting lower creator percentages in exchange for lower risk. Moderate creators with some confidence put up medium bonds and small additional fees, balancing investment with expected returns. Aggressive creators with high confidence in massive volume put up maximum bonds and maximum additional fees, investing heavily upfront to unlock the highest possible creator percentages.

The separation of refundable versus non-refundable investment is psychologically significant. Creators feel less pain from large bond amounts because they know these return eventually. The additional fee represents genuine spending and requires strong conviction about profitability. This natural self-regulation prevents creators from overleveraging on speculative markets while encouraging heavy investment in markets they genuinely believe will succeed.

**Example Scenarios**: Alice wants to create a niche market about an indie game release. She's uncertain about volume because the game has a small following. She puts up the minimum 5,000 BASED bond earning 0.1% creator fees and pays zero additional fee. Her market generates 500,000 BASED volume over its lifetime. She earns 0.1% of 500,000 which is 500 BASED in creator fees. She claims her 5,000 BASED bond back, netting 5,500 BASED total against her initial 5,000 BASED investment for 500 BASED profit. The small profit is acceptable given her low confidence and the market proved her caution correct by generating modest volume.

Bob creates a market about a trending celebrity couple rumored to be getting engaged. He's fairly confident this will be popular because social media is buzzing about it. He puts up 50,000 BASED bond earning approximately 0.55% creator fees and pays 40,000 BASED additional fee which adds another 0.4%, bringing him to 0.95% total. His market generates 10 million BASED volume as the rumors spread and betting intensifies. He earns 0.95% of 10 million which is 95,000 BASED in creator fees. He claims his 50,000 BASED bond back, netting 145,000 BASED total against his initial 90,000 BASED investment for 55,000 BASED profit. His confidence in the market's popularity was correct and his investment in additional fees paid off handsomely.

Carol creates a market about a major sporting championship that she knows will generate enormous volume because it's a globally watched event. She puts up the maximum 100,000 BASED bond earning 1% creator fees and pays the maximum 100,000 BASED additional fee adding another 1% for 2% total. Her market generates 50 million BASED volume as millions of fans bet on the outcome. She earns 2% of 50 million which is 1 million BASED in creator fees. She claims her 100,000 BASED bond back, netting 1.1 million BASED total against her initial 200,000 BASED investment for 900,000 BASED profit. Her aggressive investment yielded extraordinary returns because she correctly identified a market with mass appeal.

### Proposal Economics and Tax Structure

The proposal submission process itself has economic implications beyond just bonds and additional fees. Every proposal submission requires payment of a proposal tax calculated as a percentage of the total proposed investment. This tax immediately transfers to the team wallet and is never refunded regardless of proposal outcomes.

**Tax Calculation**: If the proposal tax parameter is set at 1%, and a creator submits a proposal with 50,000 BASED bond plus 40,000 BASED additional fee totaling 90,000 BASED, the proposal tax is 900 BASED. The creator must pay 90,900 BASED total when submitting. The 900 BASED tax goes directly to the team wallet. The 90,000 BASED in bond and additional fee are held in the ProposalSystem contract pending voting outcomes.

**Proposal Outcomes**: Three outcomes are possible for any proposal - approval, rejection, or expiration. Each has different economic consequences for the creator. Understanding these outcomes and their costs is essential for creators making informed decisions about proposal submissions.

If a proposal receives approval through community voting, the bond transfers to the BondManager contract for escrow and will be refundable when the market resolves. The additional creation fee transfers to the rewards treasury and is permanently spent. The creator's earned percentage gets locked into the market configuration. The proposal tax remains with the team. The creator's total unrecoverable cost is the proposal tax plus the additional creation fee.

If a proposal receives rejection through community voting, the bond immediately refunds to the creator because the community decided not to allow the market and the security collateral is no longer needed. The additional creation fee transfers to the rewards treasury as a contribution from the rejected proposal. The proposal tax remains with the team. The creator's total loss is the proposal tax plus the additional creation fee. The bond refund means rejected proposals aren't completely catastrophic for creators, but the additional fee lost still represents real cost that discourages frivolous proposals.

If a proposal expires without resolution, perhaps because voting didn't reach quorum or the creator withdrew it or the time period elapsed, both the bond and the additional creation fee refund to the creator in full. The proposal tax remains with the team. The creator's only loss is the proposal tax. This forgiveness for expired proposals recognizes that expiration isn't a community rejection but rather a process incompletion, and creators shouldn't be heavily penalized for proposals that simply didn't progress.

**Economic Incentives**: The proposal tax being a percentage rather than fixed amount creates scaling costs that align with market ambition. Creators proposing markets with small investments pay small taxes. Creators proposing markets with large investments pay proportionally larger taxes. This prevents spam of small low-quality proposals while not creating a barrier for serious creators who are investing substantially.

The refundable bond on rejection protects creators from complete financial ruin if their proposals aren't approved. A creator who put up 100,000 BASED bond plus 50,000 BASED additional fee with 1,500 BASED tax totaling 151,500 BASED investment would lose only 51,500 BASED on rejection rather than the full 151,500 BASED. This 66% protection through bond refunds encourages creators to submit proposals even when community approval isn't certain, because the downside is limited. Without bond refunds on rejection, only creators with perfect confidence would submit proposals, reducing platform activity.

The additional creation fee loss on rejection creates accountability. Creators who pay large additional fees to unlock high percentages must genuinely believe their markets will be approved and successful. If they're wrong and the community rejects the proposal, they bear real costs. This ensures additional fees aren't paid frivolously but represent genuine conviction in market quality.

### Fee Extraction and Distribution

When prediction markets generate trading volume through users placing bets, fees get extracted from this volume and distributed to multiple destinations. Understanding exactly how this extraction works is critical to comprehending the platform's economics.

**Fee Calculation**: All fees are small percentages of the total trading volume that accumulate in the market pool. When a market generates 10 million BASED tokens in total trading volume, each configured fee percentage applies directly to this 10 million base. If the creator has earned 1.5% creator fees, they receive 150,000 BASED. If the team fee is 1%, the team receives 100,000 BASED. If the treasury fee is 1.5%, the treasury receives 150,000 BASED. If the burn percentage is 0.5%, 50,000 BASED gets burned. These extractions total 450,000 BASED which is 4.5% of the volume. The remaining 9.55 million BASED distributes to winners proportionally based on their positions and the market odds.

**Extraction Timing**: Fees get extracted during the claiming process rather than during betting. When users place bets, their full amounts enter the market pool without any fees deducted. This is important because it means the odds displayed to users accurately reflect the pool composition without needing to account for fee deductions in advance. When the market resolves and enters the finalized state, winners call the claim function. This function calculates their share of the pool, subtracts the total fee percentage from the pool first, distributes the fee portions to each destination, and then pays the winner their net winnings from the remaining pool.

**Fee Destination Details**: The creator fee goes to the market creator's address directly. They don't need to claim this separately; it transfers automatically during the first claim transaction that triggers fee extraction. This immediate receipt of creator fees provides fast gratification for creators and ensures they receive their earnings even if they don't actively return to claim.

The team fee goes to the team wallet address configured in ParameterStorage. This wallet is controlled by the platform owner and funds operational costs, development, marketing, and team compensation. The team fee is the platform's primary revenue stream and should be set high enough to sustain operations while remaining low enough to keep markets attractive.

The treasury fee goes to the rewards treasury wallet address configured in ParameterStorage. This wallet accumulates BASED tokens that will later be distributed to NFT stakers through the Merkle tree distribution system. The treasury fee directly links trading activity to staker rewards, creating a flywheel where more trading generates more staker rewards which incentivizes more staking which increases community commitment which encourages more trading.

The burn percentage doesn't go anywhere; it simply reduces the total supply of BASED tokens by sending them to the zero address or a verifiable burn address. Burning creates deflationary pressure on the token, potentially increasing the value of remaining tokens. This benefits all token holders proportionally. The burn percentage should be set cautiously because burned tokens can never be recovered and excessive burning could reduce liquidity.

**Special Market Fee Structures**: Normal markets use the standard fee configuration with creator, team, treasury, and burn percentages. Special markets like crowdfunding or charity markets can use individual parameter overrides to route fees differently. A charity market might have 0% creator fees, 0.5% team fees, 0% treasury fees, 0% burn, and 99.5% beneficiary fees going to the designated charity address. This extreme fee structure makes the market effectively a donation mechanism dressed as a prediction market, where almost all volume flows to the charitable cause.

A crowdfunding market might have 1% creator fees so the creator has some incentive, 0.5% team fees, 0% treasury fees, 0% burn, and 98.5% beneficiary fees going to the project being funded. Backers understand that betting on the project means mostly supporting it financially rather than seeking profit, but the small potential to win creates engagement that pure donation lacks.

These special markets require individual parameter overrides set during market creation. The proposal description for such markets must explain the fee structure and justify the high beneficiary percentage. Community voting evaluates whether the beneficiary and cause are legitimate and deserving of special consideration. This social review layer prevents abuse of special market mechanics while enabling genuine charitable and crowdfunding use cases.

### Total Fee Caps and Parameter Design

To prevent markets from becoming unattractive due to excessive fee burden, the platform implements fee caps through careful parameter design rather than dynamic enforcement. This design-time prevention is simpler and more reliable than runtime checking.

**The Design Principle**: The maximum possible creator fee percentage that can be unlocked through any combination of bonds and additional creation fees, plus the sum of all platform fee percentages, should never exceed the desired total fee ceiling. This ceiling represents the maximum percentage of volume that can be extracted as fees before markets become uneconomical for traders.

**Implementation Approach**: Assume you want a 5% total fee ceiling. You determine that platform fees need to total 3% consisting of 1% team fee, 1.5% treasury fee, and 0.5% burn percentage. This leaves 2% available for creator fees. You then configure your bond and additional fee formulas such that the maximum achievable creator fee is exactly 2%. Even if a creator puts up the absolute maximum bond and pays the absolute maximum additional fee, they can only reach 2% creator fees. Therefore, 2% creator fees plus 3% platform fees equals 5% total, exactly at the ceiling.

**Parameter Configuration Example**: Bonds range from 5,000 BASED for 0.1% to 100,000 BASED for 1% creator fees. Additional fees range from 0 BASED adding 0% to 100,000 BASED adding 1% more. Maximum total creator fees equal 2%. Platform fees are fixed at 3%. Total fees can only reach 5% maximum. Markets remain attractive to traders because fee burden never exceeds this threshold.

**Adjustment Flexibility**: If you later find that 5% total fees are too high and discourage trading, you can reduce platform fees to 2.5% and creator maximums to 2.5% for a new 5% total, or reduce both proportionally to reach a 4% total ceiling. All adjustments happen through ParameterStorage updates that affect future markets. Existing markets maintain their configured fees because they're independent contract instances.

**Special Market Considerations**: Special markets with beneficiaries might have different total fee structures where beneficiary percentages replace platform fees. A charity market might have 99.5% beneficiary fees, 0.5% team fees, and 0% creator fees for 100% total extraction. This is acceptable for charity markets because participants enter knowing it's a donation mechanism. These special configurations are set as individual overrides rather than global parameters.

### Reward Distribution Economics

NFT stakers earn rewards from two primary sources - daily TECH token emissions and market trading fees in BASED tokens. Understanding how these rewards accumulate and distribute is essential for comprehending the staker value proposition.

**Daily TECH Token Emissions**: The platform allocates a specific daily budget of TECH tokens to be distributed among all stakers proportional to their staking weight. Staking weight combines two factors - the number of NFTs staked and the rarity tier of each NFT. A user staking 5 Common NFTs has lower weight than a user staking 5 Mythic NFTs due to rarity multipliers.

The rarity multipliers are configured parameters: Common tier gets 1x, Rare tier gets 1.25x, Epic tier gets 1.75x, Legendary tier gets 3x, and Mythic tier gets 5x. If a user stakes 3 Common NFTs, 1 Rare NFT, and 1 Epic NFT, their total weight is (3 × 1) + (1 × 1.25) + (1 × 1.75) = 3 + 1.25 + 1.75 = 6 weight units.

The distribution script calculates each staker's percentage of the total weight across all stakers, then allocates the daily TECH emission proportionally. If the daily emission is 10,000 TECH tokens and the total weight across all stakers is 50,000 weight units, and a user has 100 weight units, they receive (100 / 50,000) × 10,000 = 20 TECH tokens for that day.

**Market Fee BASED Token Distributions**: When markets resolve and extract fees, the treasury fee percentage flows to the rewards treasury wallet in BASED tokens. The distribution script tracks how much BASED has accumulated in the treasury since the last distribution, then allocates it among all stakers proportional to their staking weight using the same weight calculation as TECH emissions.

If 500,000 BASED tokens accumulated in the treasury over the week, and a user's weight is 100 out of 50,000 total, they receive (100 / 50,000) × 500,000 = 1,000 BASED tokens for that period. Their Merkle leaf would contain both their TECH allocation for the week and their BASED allocation for the week.

**Staking Duration Considerations**: Rewards accrue based on time staked during the distribution period. If a user stakes their NFTs halfway through a weekly distribution period, they receive credit for half the week's emissions. The distribution script tracks staking timestamps and calculates pro-rated rewards based on actual staking duration. This prevents users from staking just before distributions to claim full rewards without bearing the full lockup period.

**Minimum Staking Period**: A 24-hour minimum staking period prevents gaming where users stake and immediately unstake. Only NFTs staked for at least 24 hours qualify for reward accumulation during a distribution period. This minimum doesn't prevent unstaking; users can unstake anytime. It simply means their rewards for that period might be reduced or zero if they didn't meet the minimum for that period's calculation window.

**Claiming Mechanics**: Users accumulate unclaimed rewards across multiple distribution periods. The RewardDistributor contract stores Merkle roots for each period, and the backend maintains corresponding distribution data. When a user visits the claiming interface, the frontend queries which periods have unclaimed rewards for that user, sums the amounts, and displays the total. Users click claim once and provide proofs for all unclaimed periods, receiving all accumulated TECH and BASED tokens in a single transaction.

---

## 5. SMART CONTRACT SPECIFICATIONS

This section provides detailed technical specifications for every smart contract in the KEKTECH 2.0 system. Each contract includes purpose, state variables, functions, events, access control, and implementation notes.

### Registry Contract

**Purpose**: Serves as the central directory for all contracts in the system, enabling upgradeable architecture through address indirection.

**State Variables**:
- `mapping(bytes32 => address) private contracts` - Maps contract identifiers to current addresses
- `mapping(address => bool) private authorizedUpdaters` - Addresses allowed to update contract addresses
- `address public owner` - Contract owner with ultimate authority

**Core Functions**:

```solidity
function getContract(bytes32 identifier) external view returns (address)
```
Returns the current address for a contract identifier. All contracts call this function when they need to interact with other contracts. The identifier is generated as `keccak256("CONTRACT_NAME")` for consistency. If no address is registered, returns zero address which calling contracts should handle appropriately.

```solidity
function setContract(bytes32 identifier, address contractAddress) external onlyOwner
```
Updates the address for a contract identifier. Can only be called by owner. Emits ContractUpdated event with identifier, old address, and new address. This function is how contract upgrades get registered with the system. When a new version of ParameterStorage deploys, owner calls this function to update its address.

```solidity
function authorizeUpdater(address updater) external onlyOwner
```
Grants permission for an address to update contract registrations. Allows delegating update authority to trusted multisig or governance contracts without giving full owner control. Updaters can call setContract but cannot authorize other updaters or change ownership.

**Events**:
- `event ContractUpdated(bytes32 indexed identifier, address indexed oldAddress, address indexed newAddress)` - Emitted when a contract address changes
- `event UpdaterAuthorized(address indexed updater)` - Emitted when new updater is authorized
- `event UpdaterRevoked(address indexed updater)` - Emitted when updater permission is revoked

**Access Control**:
- Owner role: Can set contract addresses, authorize/revoke updaters, transfer ownership
- Authorized updater role: Can set contract addresses
- Public: Can query contract addresses (read-only)

**Implementation Notes**: The Registry is one of the few contracts that should never need upgrading because its logic is minimal and stable. If Registry does need replacement, all other contracts would need updates to point to the new Registry address, making it operationally complex. The Registry should be thoroughly audited before deployment and treated as immutable infrastructure.

### ParameterStorage Contract

**Purpose**: Stores all configurable numeric parameters for the system, organized by category and parameter name. Supports global defaults with market-specific overrides.

**State Variables**:
- `mapping(bytes32 => mapping(bytes32 => uint256)) private globalParameters` - Global default values by category and name
- `mapping(address => mapping(bytes32 => uint256)) private marketOverrides` - Market-specific parameter overrides
- `mapping(bytes32 => mapping(bytes32 => uint256)) private minValues` - Minimum allowed values per parameter
- `mapping(bytes32 => mapping(bytes32 => uint256)) private maxValues` - Maximum allowed values per parameter
- `mapping(bytes32 => mapping(bytes32 => uint256)) private maxChangePercent` - Maximum percent change per update
- `address public owner` - Contract owner
- `IRegistry public registry` - Reference to Registry contract

**Core Functions**:

```solidity
function getParameter(bytes32 category, bytes32 name) external view returns (uint256)
```
Returns parameter value using global default. Called by contracts that don't need market-specific overrides. For example, the proposal system queries for "GOVERNANCE/VOTING_PERIOD_DAYS" and receives the global default.

```solidity
function getParameterForMarket(address market, bytes32 category, bytes32 name) external view returns (uint256)
```
Returns parameter value for specific market. First checks if market has an override for this parameter. If yes, returns override. If no, returns global default. This function enables the global-with-overrides pattern where special markets can have custom parameters without affecting normal markets.

```solidity
function setParameter(bytes32 category, bytes32 name, uint256 value) external onlyOwner
```
Updates a global parameter value. Validates that value is within min/max bounds and doesn't exceed maximum change percentage from current value. Emits ParameterUpdated event. This is how the team tunes platform economics after launch based on observed behavior.

```solidity
function setMarketOverride(address market, bytes32 category, bytes32 name, uint256 value) external onlyOwner
```
Sets a market-specific parameter override. Validates value against bounds. The override applies only to the specified market address. Used for special markets like crowdfunding or charity markets that need custom fee structures.

```solidity
function removeMarketOverride(address market, bytes32 category, bytes32 name) external onlyOwner
```
Removes a market-specific override, causing the market to revert to using global defaults for that parameter. Useful if a special market no longer needs custom parameters or if an override was set incorrectly.

```solidity
function initializeParameters() external onlyOwner
```
One-time function called after deployment to populate initial parameter values. Sets all the default values for fees, bond ranges, reward rates, time periods, and other parameters. Should only be callable once to prevent accidental resets.

**Events**:
- `event ParameterUpdated(bytes32 indexed category, bytes32 indexed name, uint256 oldValue, uint256 newValue)` - Emitted when global parameter changes
- `event MarketOverrideSet(address indexed market, bytes32 indexed category, bytes32 indexed name, uint256 value)` - Emitted when market override is set
- `event MarketOverrideRemoved(address indexed market, bytes32 indexed category, bytes32 indexed name)` - Emitted when override is removed

**Parameter Categories and Names**:

MARKET_CREATION category:
- MIN_BOND_AMOUNT - Minimum bond for proposals
- MAX_BOND_AMOUNT - Maximum bond for proposals
- BOND_MIN_CREATOR_FEE_BPS - Creator fee for minimum bond (basis points)
- BOND_MAX_CREATOR_FEE_BPS - Creator fee for maximum bond (basis points)
- MAX_ADDITIONAL_FEE - Maximum additional creation fee
- ADDITIONAL_FEE_PER_BPS - BASED tokens per 0.01% creator fee boost
- PROPOSAL_TAX_BPS - Proposal submission tax as percentage of total
- MAX_TOTAL_FEE_BPS - Maximum total fee percentage

FEE_STRUCTURE category:
- TEAM_FEE_BPS - Team fee percentage (basis points)
- TREASURY_FEE_BPS - Treasury fee percentage
- BURN_FEE_BPS - Burn percentage
- SPECIAL_MARKET_BENEFICIARY_BPS - Beneficiary percentage for special markets

GOVERNANCE category:
- VOTING_PERIOD_DAYS - How long proposals stay open for voting
- MIN_VOTING_PERIOD_DAYS - Minimum configurable voting period
- MAX_VOTING_PERIOD_DAYS - Maximum configurable voting period
- APPROVAL_THRESHOLD_BPS - Weighted likes needed for approval (basis points)
- TIERED_VOTING_ENABLED - Boolean flag to enable/disable tiered voting
- TIER1_MIN_NFTS - Minimum NFTs for tier 1 voting power
- TIER1_VOTING_POWER - Voting power for tier 1
- TIER2_MIN_NFTS - Minimum NFTs for tier 2
- TIER2_VOTING_POWER - Voting power for tier 2
- TIER3_MIN_NFTS - Minimum NFTs for tier 3
- TIER3_VOTING_POWER - Voting power for tier 3

STAKING category:
- MIN_STAKING_PERIOD_HOURS - Minimum hours staked before earning rewards
- COMMON_RARITY_MULTIPLIER_BPS - Common tier multiplier (10000 = 1x)
- RARE_RARITY_MULTIPLIER_BPS - Rare tier multiplier
- EPIC_RARITY_MULTIPLIER_BPS - Epic tier multiplier
- LEGENDARY_RARITY_MULTIPLIER_BPS - Legendary tier multiplier
- MYTHIC_RARITY_MULTIPLIER_BPS - Mythic tier multiplier

MARKET_RESOLUTION category:
- FINALIZATION_PERIOD_HOURS - Hours before auto-finalization (48)
- RESOLUTION_ENABLED - Toggle for resolution features

**Implementation Notes**: All percentage values are stored in basis points where 10000 equals 100%. This avoids decimal precision issues in Solidity. The contract should validate all parameter updates to ensure values make economic sense and prevent administrative errors from breaking the platform.

### FlexibleMarketFactory Contract

**Purpose**: Deploys prediction market contracts using the factory pattern with CREATE2 for deterministic addresses. Manages market type templates and coordinates with the proposal system.

**State Variables**:
- `IRegistry public immutable registry` - Reference to Registry
- `mapping(uint256 => address) public marketTemplates` - Market type enum to implementation address
- `address[] public allMarkets` - Array of all created markets
- `mapping(address => address[]) public creatorMarkets` - Markets created by each address
- `mapping(uint256 => address) public proposalToMarket` - Proposal ID to market address mapping
- `uint256 public nextMarketId` - Counter for market IDs
- `bool public paused` - Emergency pause flag
- `address public owner` - Owner address

**Market Types Enum**:
```solidity
enum MarketType {
    STANDARD,        // Binary YES/NO markets
    MULTI_OUTCOME,   // Multiple outcome markets (3-5 options)
    CROWDFUNDING,    // Markets with beneficiary addresses
    DUEL,            // Head-to-head betting (future)
    NFT_BATTLE       // NFT collection battles (future)
}
```

**Core Functions**:

```solidity
function registerMarketTemplate(uint256 marketType, address implementation) external onlyOwner
```
Registers or updates the implementation contract address for a market type. When adding new market types in the future, deploy the new implementation contract first, then register it with this function. The market type enum value maps to the implementation address.

```solidity
function createMarketFromProposal(uint256 proposalId, address creator, MarketType marketType, bytes calldata marketData, uint256 creatorFeeBPS, address specialBeneficiary) external returns (address market)
```
Called by ProposalSystem when a proposal is approved. Reads platform fee parameters from ParameterStorage, validates total fees don't exceed cap, deploys a new market contract using CREATE2 cloning the appropriate template, initializes the market with provided parameters, transfers bonds to BondManager, transfers additional creation fees to treasury, records the market address in all relevant mappings, emits MarketCreated event. Returns the new market address.

```solidity
function getMarketsForCreator(address creator) external view returns (address[] memory)
```
Returns array of all markets created by a specific address. Used by frontend to display a creator's market history and by the claiming interface to show unclaimed bonds.

```solidity
function getMarketCount() external view returns (uint256)
```
Returns total number of markets created. Useful for pagination and statistics.

**Events**:
- `event MarketCreated(address indexed market, address indexed creator, uint256 indexed marketType, string question, uint256 endTime, uint256 creatorFeeBPS, address specialBeneficiary)` - Comprehensive event with all market parameters
- `event MarketTemplateRegistered(uint256 indexed marketType, address indexed implementation)` - Emitted when templates are registered
- `event FactoryPaused()` - Emitted when factory is paused
- `event FactoryUnpaused()` - Emitted when factory is unpaused

**Access Control**:
- Owner: Can register templates, pause/unpause factory
- ProposalSystem contract: Can call createMarketFromProposal
- Public: Can query market lists (read-only)

**Implementation Notes**: The factory uses minimal proxy pattern (EIP-1167) for gas-efficient market deployment. Each market type needs a thoroughly tested implementation contract before registration. The factory should validate that implementation addresses are contracts and not EOAs. The CREATE2 salt should incorporate the market ID for deterministic addresses.

### PredictionMarket Contract (Standard Binary Markets)

**Purpose**: Implements binary YES/NO prediction markets where users bet on one of two outcomes. Handles bet placement, market resolution, fee extraction, and winner payouts.

**State Variables**:
- `IRegistry public immutable registry` - Registry reference
- `address public creator` - Market creator address
- `string public question` - Market question text
- `uint256 public endTime` - When betting closes
- `uint256 public creatorFeeBPS` - Creator's earned fee percentage
- `uint256 public resolutionTime` - When market was resolved (0 if unresolved)
- `uint256 public finalizationTime` - When market can finalize (resolutionTime + 48 hours)
- `bool public resolved` - Whether market is resolved
- `bool public finalized` - Whether market is finalized
- `bool public outcome` - Winning outcome (true = YES, false = NO)
- `bool public refunded` - Whether market was refunded due to dispute
- `mapping(address => mapping(bool => uint256)) public positions` - User positions per outcome
- `uint256 public totalYes` - Total BASED bet on YES
- `uint256 public totalNo` - Total BASED bet on NO
- `mapping(address => bool) public hasClaimed` - Tracks who claimed
- `bool public feesExtracted` - Prevents double extraction

**Core Functions**:

```solidity
function placeBet(bool outcome) external payable nonReentrant
```
Accepts BASED tokens via msg.value and records a bet on the specified outcome. Requires current time is before endTime. Validates msg.value is greater than zero. Updates user's position for that outcome, increments total for that outcome, emits BetPlaced event. Users can bet on both outcomes if desired, enabling hedging strategies.

```solidity
function resolve(bool winningOutcome) external onlyResolver nonReentrant
```
Sets the market's winning outcome. Requires current time is after endTime. Requires market is not already resolved. Sets resolved to true, sets outcome to winningOutcome, sets resolutionTime to current timestamp, sets finalizationTime to current timestamp plus 48 hours, emits MarketResolved event. After this, the market enters pending finalization state where emergency overrides are available.

```solidity
function finalize() external nonReentrant
```
Finalizes the market after the 48-hour window. Requires current time is greater than or equal to finalizationTime. Requires market is resolved but not finalized. Sets finalized to true, emits MarketFinalized event. After finalization, winners can claim and emergency overrides are no longer available.

```solidity
function emergencyReverse(bool newOutcome) external onlyOwner nonReentrant
```
Emergency function callable during pending finalization period. Requires market is resolved but not finalized. Changes outcome to newOutcome, resets resolutionTime to current timestamp, resets finalizationTime to current timestamp plus 48 hours effectively restarting the window, emits EmergencyReverse event. Used if community feedback reveals the initial resolution was wrong.

```solidity
function emergencyRefund() external onlyOwner nonReentrant
```
Emergency function callable during pending finalization period. Requires market is resolved but not finalized. Sets refunded to true, prevents finalization, emits EmergencyRefund event. After refund is triggered, users can claim their original bet amounts back as if the market never happened. Used in cases of fundamental market problems or irresolvable disputes.

```solidity
function claim() external nonReentrant
```
Allows winners to claim their winnings or all users to claim refunds if market was refunded. If refunded, returns user's combined positions across both outcomes. If finalized, calculates user's share of winning pool, extracts fees on first claim, transfers net winnings to user. Marks hasClaimed as true. Emits Claimed event with amount. This function contains the fee extraction logic that applies all percentage fees to the volume.

**Fee Extraction Logic** (within claim function):
```solidity
if (!feesExtracted) {
    uint256 totalVolume = totalYes + totalNo;
    uint256 creatorFee = (totalVolume * creatorFeeBPS) / 10000;
    uint256 teamFee = (totalVolume * teamFeeBPS) / 10000;
    uint256 treasuryFee = (totalVolume * treasuryFeeBPS) / 10000;
    uint256 burnFee = (totalVolume * burnFeeBPS) / 10000;
    
    // Transfer fees
    (bool sent1,) = creator.call{value: creatorFee}("");
    (bool sent2,) = teamWallet.call{value: teamFee}("");
    (bool sent3,) = treasuryWallet.call{value: treasuryFee}("");
    if (burnFee > 0) {
        (bool sent4,) = BURN_ADDRESS.call{value: burnFee}("");
    }
    
    feesExtracted = true;
    emit FeesExtracted(creatorFee, teamFee, treasuryFee, burnFee);
}

// Calculate winner's share after fees
uint256 totalFees = creatorFee + teamFee + treasuryFee + burnFee;
uint256 netPool = totalVolume - totalFees;
uint256 winningPool = outcome ? totalYes : totalNo;
uint256 userWinnings = (positions[msg.sender][outcome] * netPool) / winningPool;
```

**Events**:
- `event BetPlaced(address indexed user, bool indexed outcome, uint256 amount, uint256 timestamp)` - Emitted when user bets
- `event MarketResolved(bool indexed outcome, address indexed resolver, uint256 timestamp)` - Emitted when resolved
- `event MarketFinalized(uint256 timestamp)` - Emitted when finalized
- `event EmergencyReverse(bool newOutcome, uint256 timestamp)` - Emitted on resolution reversal
- `event EmergencyRefund(uint256 timestamp)` - Emitted when refund is triggered
- `event Claimed(address indexed user, uint256 amount)` - Emitted when user claims
- `event FeesExtracted(uint256 creatorFee, uint256 teamFee, uint256 treasuryFee, uint256 burnFee)` - Emitted on first claim

**Access Control**:
- Owner: Can call emergency functions during pending period
- Resolver role: Can call resolve function
- Public: Can bet, can claim if eligible

**Implementation Notes**: The contract should prevent reentrancy on all state-changing functions. Fee extraction happens atomically with the first claim to prevent race conditions. The contract should handle edge cases like markets with zero volume or markets where one side has zero bets. Refund logic should be tested thoroughly to ensure users can reclaim funds even if one side had no bets.

### MultiOutcomeMarket Contract

**Purpose**: Implements prediction markets with multiple possible outcomes (3-5 options). Users can bet on multiple outcomes simultaneously for hedging strategies.

**State Variables**: Similar to PredictionMarket but with arrays/mappings for multiple outcomes
- `string[] public outcomes` - Array of outcome descriptions (length 3-5)
- `mapping(address => mapping(uint256 => uint256)) public positions` - User position per outcome index
- `uint256[] public outcomeTotals` - Total BASED bet per outcome
- `uint256 public winningOutcomeIndex` - Index of winning outcome (type uint256 instead of bool)

**Core Functions**: Similar to PredictionMarket with outcome parameter as uint256 index instead of bool
- `placeBet(uint256 outcomeIndex)` - Bet on specific outcome index
- `resolve(uint256 winningOutcomeIndex)` - Set winning outcome index
- `claim()` - Calculate net winnings across all positions

**Implementation Notes**: The claim logic is more complex because users might have positions on multiple outcomes including the winner. The contract calculates their winning position payout minus their losing position costs, resulting in net winnings that could be positive, negative, or zero. Users with net negative (more spent on losers than won) receive zero. Users with net positive receive their net amount after fees.

---

## Section 4: Market Proposal System (Refined Unified Architecture)

### 4.1 Unified Proposal Economics

The proposal system merges bond-based and fee-based market creation into a **single unified flow** with two independent economic levers that creators control.

#### 4.1.1 Three Components of Proposal Cost

Every market proposal consists of three mandatory/optional payments:

**1. Proposal Submission Tax** (Mandatory, Never Refunded):
- Percentage of total proposal value (bond + additional fee)
- Default: 1% (configurable 0.5%-2%)
- Goes to team wallet immediately upon submission
- Purpose: Platform revenue, spam prevention
- Formula: `tax = (bondAmount + additionalFee) * taxPercent`

**2. Bond Amount** (Mandatory, Refundable Security):
- Range: 4,200 - 69,000 BASED tokens (configurable)
- Unlocks base creator fee: 0.1% - 0.69%
- Refunded when: Proposal rejected, expired, or market resolves successfully
- Held in: ProposalSystem contract during voting
- Transferred to: BondManager when approved
- Purpose: Collateral proving creator commitment

**3. Additional Creation Fee** (Optional, Non-Refundable Investment):
- Range: 0 - 231,000 BASED tokens (configurable)
- Unlocks bonus creator fee: +0.1% per 10,000 BASED
- Maximum bonus: +2.31% (combined with max bond = 3% total)
- Goes to: Rewards treasury when approved or rejected
- Refunded when: Proposal expires
- Purpose: Boost creator earning potential

#### 4.1.2 Two-Lever Creator Incentive System

**Lever 1: Bond Amount → Base Creator Fee %**

Linear relationship between bond size and base creator fee percentage:

```javascript
// Configuration in ParameterStorage
{
  minBondAmount: 4_200 * 1e18,     // 4,200 BASED
  maxBondAmount: 69_000 * 1e18,    // 69,000 BASED
  minCreatorFeePercent: 10,        // 0.10% (basis points)
  maxCreatorFeePercent: 69         // 0.69%
}

// Calculation (linear interpolation)
bondRange = maxBond - minBond  // 64,800 BASED
feeRange = maxFee - minFee      // 0.59%

bondPosition = (userBond - minBond) / bondRange  // 0.0 to 1.0
creatorFeeFromBond = minFee + (bondPosition * feeRange)

// Example: 30,000 BASED bond
// = 0.10% + ((30,000 - 4,200) / 64,800) * 0.59%
// = 0.10% + 0.398 * 0.59%
// ≈ 0.335% creator fee
```

**Lever 2: Additional Creation Fee → Bonus Creator Fee %**

Fixed increments: Every 10,000 BASED adds 0.1% to creator fee

```javascript
// Configuration
{
  feePerIncrement: 10,               // 0.10% per 10k BASED
  incrementSize: 10_000 * 1e18,      // 10,000 BASED
  maxAdditionalFeeAmount: 231_000 * 1e18,  // 231,000 BASED
  maxAdditionalFeePercent: 231       // +2.31% maximum bonus
}

// Calculation
bonusPercent = (additionalFeeAmount / incrementSize) * feePerIncrement

// Example: 50,000 BASED additional fee
// = (50,000 / 10,000) * 0.10%
// = 5 * 0.10%
// = 0.50% bonus creator fee
```

**Combined Total**:
```javascript
totalCreatorFee = creatorFeeFromBond + bonusFromAdditionalFee

// Maximum possible: 0.69% (bond) + 2.31% (additional) = 3.00%
// Capped at: 3.00% (absoluteMaxCreatorFee parameter)
```

#### 4.1.3 Proposal Outcome Scenarios

**Scenario 1: APPROVED**
```
Creator pays:
  - Bond (e.g., 30,000 BASED) → Locked in BondManager
  - Additional Fee (e.g., 50,000 BASED) → Rewards Treasury
  - Proposal Tax (e.g., 800 BASED) → Team Wallet
  Total upfront: 80,800 BASED

Creator earns: 0.84% of market trading volume

Later (after market resolves):
  - Creator can claim bond back: +30,000 BASED refund
  - Creator receives market fees at 0.84%

Total cost: 50,800 BASED (additional fee + tax)
```

**Scenario 2: REJECTED**
```
Creator pays:
  - Bond (e.g., 30,000 BASED) → Refunded immediately
  - Additional Fee (e.g., 50,000 BASED) → Rewards Treasury (LOST)
  - Proposal Tax (e.g., 800 BASED) → Team Wallet (LOST)
  Total upfront: 80,800 BASED

Refund: 30,000 BASED (bond only)

Total loss: 50,800 BASED (additional fee + tax)
```

**Scenario 3: EXPIRED**
```
Creator pays:
  - Bond (e.g., 30,000 BASED) → Refunded
  - Additional Fee (e.g., 50,000 BASED) → Refunded
  - Proposal Tax (e.g., 800 BASED) → Team Wallet (LOST)
  Total upfront: 80,800 BASED

Refund: 80,000 BASED (bond + additional fee)

Total loss: 800 BASED (tax only - minimal penalty)
```

#### 4.1.4 Strategic Implications

**Conservative Strategy** (Low Risk):
- Minimum bond: 4,200 BASED → 0.1% creator fee
- No additional fee
- Total cost: ~42 BASED tax
- Risk if rejected: Just 42 BASED
- Best for: Testing ideas, uncertain volume

**Moderate Strategy** (Balanced):
- Medium bond: 30,000 BASED → 0.34% creator fee
- Medium additional: 50,000 BASED → +0.50% bonus
- Total creator fee: 0.84%
- Total cost: 80,800 BASED upfront
- Risk if rejected: 50,800 BASED
- Break-even volume: ~9.6M BASED
- Best for: Confident markets

**Aggressive Strategy** (High Risk/Reward):
- Maximum bond: 69,000 BASED → 0.69% creator fee
- Maximum additional: 231,000 BASED → +2.31% bonus
- Total creator fee: 3.00% (hits cap)
- Total cost: 303,000 BASED upfront
- Risk if rejected: 234,000 BASED
- Break-even volume: ~10.1M BASED
- Profit at 20M volume: 600k fees - 234k cost = 366k profit
- Best for: Blockbuster events (major sports, elections)

### 4.2 Voting Mechanism

#### 4.2.1 Tiered Voting Power (NFT-Based)

**Only staked KEKTECH NFTs grant voting power**. Users must actively stake NFTs to participate in governance.

**Voting Weight Tiers** (Configurable):
```javascript
// ParameterStorage configuration
{
  tieredVotingEnabled: true,     // Toggle for tier system

  // Tier thresholds (staked NFT count → voting weight)
  tier1_threshold: 1,    tier1_weight: 1,   // 1-9 NFTs = 1 vote
  tier2_threshold: 10,   tier2_weight: 2,   // 10-49 NFTs = 2 votes
  tier3_threshold: 50,   tier3_weight: 5,   // 50-99 NFTs = 5 votes
  tier4_threshold: 100,  tier4_weight: 7    // 100+ NFTs = 7 votes
}

// Voting weight calculation
function calculateVotingWeight(address voter) returns (uint256) {
    if (!tieredVotingEnabled) {
        return stakedCount > 0 ? 1 : 0;  // Democratic mode
    }

    uint256 stakedCount = nftStaking.balanceOf(voter);

    if (stakedCount >= 100) return 7;
    if (stakedCount >= 50) return 5;
    if (stakedCount >= 10) return 2;
    if (stakedCount >= 1) return 1;
    return 0;  // No stake = no vote
}
```

**Benefits**:
- Logarithmic scaling (not linear) prevents whale dominance
- Requires active participation (staking) not just ownership
- Adjustable parameters for optimization
- Toggle allows switching to democratic 1-vote-per-wallet mode

#### 4.2.2 Voting Period & Thresholds

**Default Voting Duration**: 7 days (configurable 1-30 days)

**Approval Thresholds**:
```javascript
{
  // Normal markets
  normalMarketThreshold: 6000,        // 60% weighted approval
  normalMarketMinVotes: 10,           // Minimum 10 total votes

  // Special markets (charity/crowdfunding)
  specialMarketThreshold: 7500,       // 75% weighted approval
  specialMarketMinVotes: 20,          // Minimum 20 total votes

  // Higher scrutiny for high-fee beneficiary markets
}
```

**Voting Flow**:
```solidity
function voteOnProposal(uint256 proposalId, bool approve) external {
    require(!hasVoted[proposalId][msg.sender], "Already voted");
    require(block.timestamp < proposals[proposalId].deadline, "Voting closed");

    uint256 weight = calculateVotingWeight(msg.sender);
    require(weight > 0, "Stake NFTs to vote");

    if (approve) {
        proposals[proposalId].weightedLikes += weight;
    } else {
        proposals[proposalId].weightedDislikes += weight;
    }

    hasVoted[proposalId][msg.sender] = true;
    emit VoteCast(proposalId, msg.sender, approve, weight);
}
```

### 4.3 Special Market Proposals

#### 4.3.1 Special Market Designation

**Requirements for Special Markets**:
- Beneficiary address specified (not zero address)
- Beneficiary fee percentage ≥ 30%
- Description ≥ 100 characters (enforced on-chain hash)
- Higher approval threshold (75% vs 60%)

**Special Market Types**:

**Crowdfunding**:
- Beneficiary fee: 85-95% of trading volume
- Creator fee: 0.5-1% (reduced incentive)
- Team fee: 0.5-1%
- Description must explain project and fund usage

**Charity**:
- Beneficiary fee: 95-100%
- All other fees: 0% or minimal
- Beneficiary must be verified organization
- Description must include charity details

**Validation**:
```solidity
function createSpecialMarketProposal(
    address beneficiaryAddress,
    uint16 beneficiaryPercent,
    string calldata description,
    ...
) external {
    require(beneficiaryAddress != address(0), "Invalid beneficiary");
    require(beneficiaryPercent >= 30, "Use normal market");
    require(bytes(description).length >= 100, "Description too short");
    require(bondAmount >= minSpecialMarketBond, "Insufficient bond");

    // Store with special market flag
    proposals[nextId] = Proposal({
        isSpecialMarket: true,
        beneficiaryAddress: beneficiaryAddress,
        beneficiaryPercent: beneficiaryPercent,
        descriptionHash: keccak256(bytes(description)),
        ...
    });
}
```

---

## Section 5: NFT Staking System (Refined)

### 5.1 Batch Staking Implementation

#### 5.1.1 Batch Stake Function

Users can stake up to 150 NFTs in a single transaction (gas limit protection):

```solidity
function batchStake(uint256[] calldata tokenIds) external nonReentrant {
    require(tokenIds.length > 0 && tokenIds.length <= 150, "Invalid batch size");

    uint256 totalWeight = 0;

    for (uint256 i = 0; i < tokenIds.length; i++) {
        uint256 tokenId = tokenIds[i];
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");

        // Transfer NFT
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        // Get rarity weight
        uint256 weight = rarityRegistry.getRarityWeight(tokenId);
        totalWeight += weight;

        // Record stake
        stakes[msg.sender][tokenId] = Stake({
            stakedAt: block.timestamp,
            rarityWeight: weight,
            lastClaimTime: 0  // Rewards start after 24h
        });

        emit NFTStaked(msg.sender, tokenId, weight);
    }

    // Update global weights
    userStakingWeight[msg.sender] += totalWeight;
    globalStakingWeight += totalWeight;

    emit BatchStakeCompleted(msg.sender, tokenIds.length, totalWeight);
}
```

#### 5.1.2 Batch Unstake Function

No unstaking lock period - immediate unstake available:

```solidity
function batchUnstake(uint256[] calldata tokenIds) external nonReentrant {
    require(tokenIds.length > 0 && tokenIds.length <= 150, "Invalid batch size");

    uint256 totalWeight = 0;

    for (uint256 i = 0; i < tokenIds.length; i++) {
        uint256 tokenId = tokenIds[i];
        Stake memory stake = stakes[msg.sender][tokenId];
        require(stake.stakedAt > 0, "Not staked");

        totalWeight += stake.rarityWeight;

        // Return NFT
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        // Clear stake record
        delete stakes[msg.sender][tokenId];

        emit NFTUnstaked(msg.sender, tokenId);
    }

    // Update global weights
    userStakingWeight[msg.sender] -= totalWeight;
    globalStakingWeight -= totalWeight;

    emit BatchUnstakeCompleted(msg.sender, tokenIds.length, totalWeight);
}
```

**Frontend Integration**:
```jsx
// User selects multiple NFTs from wallet
const selectedNFTs = [1, 5, 23, 42, 100];

// Single transaction stakes all
await nftStaking.batchStake(selectedNFTs);

// Shows success: "Staked 5 NFTs with total weight: 675"
```

### 5.2 Rarity Tier System

#### 5.2.1 KEKTECH Collection Distribution

Total NFTs: 4,200

**Tier Breakdown**:
```javascript
{
  Common: {
    count: 3280,
    percentage: 78.1%,
    multiplier: 1.00x,
    dailyRate: 3 TECH tokens
  },
  Rare: {
    count: 670,
    percentage: 16.0%,
    multiplier: 1.25x,
    dailyRate: 3.75 TECH tokens
  },
  Epic: {
    count: 195,
    percentage: 4.6%,
    multiplier: 1.75x,
    dailyRate: 5.25 TECH tokens
  },
  Legendary: {
    count: 42,
    percentage: 1.0%,
    multiplier: 3.00x,
    dailyRate: 9 TECH tokens
  },
  Mythic: {
    count: 13,
    percentage: 0.3%,
    multiplier: 5.00x,
    dailyRate: 15 TECH tokens
  }
}
```

**Adjustable Multipliers** (ParameterStorage):
```solidity
mapping(uint8 => uint256) public rarityMultipliers;

// Basis points (100 = 1.00x)
rarityMultipliers[0] = 100;   // Common
rarityMultipliers[1] = 125;   // Rare
rarityMultipliers[2] = 175;   // Epic
rarityMultipliers[3] = 300;   // Legendary
rarityMultipliers[4] = 500;   // Mythic

// Team can adjust via updateRarityMultiplier(tier, newMultiplier)
```

#### 5.2.2 NFTRarityRegistry (Gas-Optimized)

**Storage Strategy**: Only store non-Common NFTs (saves ~65M gas)

```solidity
contract NFTRarityRegistry {
    uint8 public constant DEFAULT_TIER = 0;  // Common

    // Only stores 920 mappings (Rare+Epic+Legendary+Mythic)
    // Common (3,280) use default tier
    mapping(uint256 => uint8) public nftTier;

    function getRarityTier(uint256 tokenId) public view returns (uint8) {
        uint8 tier = nftTier[tokenId];
        return tier == 0 ? DEFAULT_TIER : tier;
    }

    function getRarityWeight(uint256 tokenId) public view returns (uint256) {
        uint8 tier = getRarityTier(tokenId);
        return paramStorage.getRarityMultiplier(tier);
    }

    // Batch registration (deployment)
    function batchRegisterTier(uint256[] calldata tokenIds, uint8 tier)
        external onlyOwner
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftTier[tokenIds[i]] = tier;
        }
        emit TierBatchRegistered(tokenIds.length, tier);
    }
}
```

**Deployment Process**:
1. Team provides JSON file with all NFT rarities
2. Script filters to extract non-Common tiers (920 NFTs)
3. Batch registration in groups of 100 NFTs per transaction
4. Total: ~10 transactions vs 4,200 if storing all

### 5.3 Reward Accrual Rules

#### 5.3.1 24-Hour Delay Before Rewards

No rewards accrue for first 24 hours after staking (prevents gaming):

```solidity
function calculatePendingRewards(address user) public view returns (uint256) {
    uint256 totalRewards = 0;
    uint256[] memory stakedTokenIds = getUserStakedNFTs(user);

    for (uint256 i = 0; i < stakedTokenIds.length; i++) {
        Stake memory stake = stakes[user][stakedTokenIds[i]];

        // No rewards for first 24 hours
        if (block.timestamp < stake.stakedAt + 24 hours) {
            continue;
        }

        // Calculate eligible time (excluding first 24h)
        uint256 rewardStartTime = stake.stakedAt + 24 hours;
        uint256 eligibleTime = block.timestamp - rewardStartTime;

        // Apply rarity multiplier
        uint256 dailyRate = getDailyBaseRate();  // e.g., 3 TECH per day
        uint256 rewards = (eligibleTime * dailyRate * stake.rarityWeight)
                         / (1 days * 100);  // Divide by 100 for multiplier basis

        totalRewards += rewards;
    }

    return totalRewards;
}
```

**Daily Base Rate** (Placeholder Example):
```javascript
{
  dailyBaseRate: 3 * 1e18,  // 3 TECH tokens per day (for 1.0x multiplier)

  // Adjustable via ParameterStorage
  // Team can increase/decrease based on tokenomics
}
```

**Reward Examples**:
- Common NFT staked 7 days: 3 × 7 × 1.0 = 21 TECH
- Rare NFT staked 7 days: 3 × 7 × 1.25 = 26.25 TECH
- Legendary NFT staked 30 days: 3 × 30 × 3.0 = 270 TECH
- Mythic NFT staked 30 days: 3 × 30 × 5.0 = 450 TECH

---

## Section 6: Merkle Tree Reward Distribution (Dual-Token)

### 6.1 Architecture Overview

The reward system distributes **both TECH and BASED tokens** through a unified Merkle tree, allowing users to claim both in a single transaction.

**Token Sources**:

**TECH Tokens**:
- Daily emissions from treasury wallet
- Distributed proportionally by staking weight
- Formula: `userTECH = (userWeight / globalWeight) * weeklyTECHPool`

**BASED Tokens**:
- Trading fees from prediction markets
- Accumulated in rewards treasury
- Formula: `userBASED = (userWeight / globalWeight) * weeklyBASEDPool`

### 6.2 Weekly Distribution Cycle

**Schedule**: Every Monday 00:00 UTC (configurable)

**Off-Chain Script Process**:
```javascript
// 1. Query staking data
const stakers = await getAllStakers();
const globalWeight = await nftStaking.globalStakingWeight();

// 2. Calculate reward pools
const weeklyTECHPool = 7 * dailyEmissionRate * totalStakedNFTs;
const weeklyBASEDPool = await treasuryWallet.getBalance(BASED_TOKEN);

// 3. Calculate each staker's share
const distributions = [];
for (const staker of stakers) {
    const userWeight = await nftStaking.userStakingWeight(staker);
    const proportion = userWeight / globalWeight;

    distributions.push({
        address: staker,
        techAmount: Math.floor(weeklyTECHPool * proportion),
        basedAmount: Math.floor(weeklyBASEDPool * proportion),
        periodId: currentPeriod + 1
    });
}

// 4. Generate Merkle tree
const merkleTree = generateMerkleTree(distributions);

// 5. Publish root on-chain
await rewardDistributor.publishDistribution(
    currentPeriod + 1,
    merkleTree.root,
    totalTECH,
    totalBASED
);

// 6. Upload data to VPS + IPFS
await uploadDistributionData(distributions, merkleTree);
```

### 6.3 Multi-Period Claim Accumulation

Users don't need to claim every week. Rewards accumulate across periods:

**Example**:
```
Week 1: Alice earns 420 TECH + 17 BASED (doesn't claim)
Week 2: Alice earns 380 TECH + 15 BASED (doesn't claim)
Week 3: Alice earns 410 TECH + 16 BASED (doesn't claim)
Week 4: Alice earns 390 TECH + 14 BASED (claims all)

Total claim: 1,600 TECH + 62 BASED in ONE transaction
```

**Claim Function**:
```solidity
struct ClaimData {
    uint256 periodId;
    uint256 techAmount;
    uint256 basedAmount;
    bytes32[] merkleProof;
}

function claimMultiplePeriods(ClaimData[] calldata claims) external nonReentrant {
    uint256 totalTECH = 0;
    uint256 totalBASED = 0;

    for (uint256 i = 0; i < claims.length; i++) {
        require(!hasClaimed[claims[i].periodId][msg.sender], "Already claimed");

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(
            msg.sender,
            claims[i].techAmount,
            claims[i].basedAmount,
            claims[i].periodId
        ));

        bytes32 root = distributions[claims[i].periodId].merkleRoot;
        require(MerkleProof.verify(claims[i].merkleProof, root, leaf), "Invalid proof");

        hasClaimed[claims[i].periodId][msg.sender] = true;

        totalTECH += claims[i].techAmount;
        totalBASED += claims[i].basedAmount;

        emit RewardsClaimed(msg.sender, claims[i].periodId,
                          claims[i].techAmount, claims[i].basedAmount);
    }

    // Transfer both tokens
    require(techToken.transfer(msg.sender, totalTECH), "TECH transfer failed");
    require(basedToken.transfer(msg.sender, totalBASED), "BASED transfer failed");
}
```

### 6.4 Data Hosting (Dual Strategy)

**Primary: VPS Server**
- API endpoint: `https://api.kektech.xyz/distributions/{periodId}`
- Fast access for frontend
- Includes pre-computed Merkle proofs for each user

**Secondary: IPFS**
- Decentralized backup
- Censorship resistance
- Hash stored on-chain in DistributionPublished event

**API Response**:
```json
{
  "periodId": 12,
  "publishedAt": "2025-10-27T00:00:00Z",
  "totalTECHDistributed": "5040000000000000000000",
  "totalBASEDDistributed": "125000000000000000000",
  "merkleRoot": "0x7f3b...",
  "ipfsHash": "Qm...",

  "rewards": {
    "0xAlice...": {
      "techAmount": "6300000000000000000",
      "basedAmount": "150000000000000000",
      "proof": ["0xabc...", "0xdef...", "0x123..."]
    }
  }
}
```

---

## Section 7: Market Resolution & 48-Hour Finalization

### 7.1 Resolution States

**Market Lifecycle**:
```
Active → Closed (endTime reached)
  ↓
Closed → PendingFinalization (team resolves)
  ↓
PendingFinalization → Finalized (auto after 48h)
  OR
PendingFinalization → EmergencyRefunded (team override)
```

### 7.2 48-Hour Auto-Finalization

**Initial Resolution**:
```solidity
function resolveMarket(bool outcome) external onlyResolver {
    require(state == MarketState.Closed, "Not closed");

    winningOutcome = outcome;
    state = MarketState.PendingFinalization;
    finalizationTime = block.timestamp + 48 hours;

    emit MarketResolved(address(this), outcome, finalizationTime);
}
```

**Automatic Finalization** (Anyone can call after 48h):
```solidity
function finalizeMarket() external {
    require(state == MarketState.PendingFinalization, "Not pending");
    require(block.timestamp >= finalizationTime, "48h not elapsed");

    state = MarketState.Finalized;
    _distributeFees();

    emit MarketFinalized(address(this), winningOutcome);
}
```

**Community Review Period Benefits**:
- Users comment on resolution accuracy
- Team monitors for disputes
- No payouts during review (safety)
- Automatic progression reduces operational burden

### 7.3 Emergency Override Powers

**Emergency Reverse** (Change outcome during 48h):
```solidity
function emergencyReverseResolution(bool newOutcome) external onlyOwner {
    require(state == MarketState.PendingFinalization, "Not pending");
    require(block.timestamp < finalizationTime, "Window expired");

    winningOutcome = newOutcome;
    finalizationTime = block.timestamp + 48 hours;  // Restart window

    emit ResolutionReversed(address(this), newOutcome, finalizationTime);
}
```

**Emergency Refund** (Cancel market during 48h):
```solidity
function emergencyRefundMarket() external onlyOwner {
    require(state == MarketState.PendingFinalization, "Not pending");
    require(block.timestamp < finalizationTime, "Window expired");

    state = MarketState.EmergencyRefunded;

    emit MarketRefunded(address(this));
}

// Users claim full bet amounts back
function claimRefund() external nonReentrant {
    require(state == MarketState.EmergencyRefunded, "No refund");

    UserPosition memory pos = userPositions[msg.sender];
    require(pos.amount > 0 && !pos.refunded, "Not eligible");

    userPositions[msg.sender].refunded = true;
    IERC20(basedToken).transfer(msg.sender, pos.amount);

    emit RefundClaimed(msg.sender, pos.amount);
}
```

---

## Section 8: Bond Management System

### 8.1 Bond Lifecycle

**When Proposal Approved**:
```solidity
// ProposalSystem contract
function approveProposal(uint256 proposalId) internal {
    Proposal storage prop = proposals[proposalId];

    // Transfer bond to BondManager
    IERC20(basedToken).transfer(
        address(bondManager),
        prop.bondAmount
    );

    // Lock bond for this market
    bondManager.lockBond(
        marketAddress,
        prop.creator,
        prop.bondAmount
    );
}
```

**When Market Resolves**:
Bonds remain locked until creator claims them

**Creator Claims Bond Back**:

**Frontend UI**:
```jsx
// BondClaimInterface.tsx
function BondClaimInterface({ userAddress }) {
  const [claimableBonds, setClaimableBonds] = useState([]);

  useEffect(() => {
    async function fetchClaimableBonds() {
      // Query factory for user's created markets
      const markets = await factory.getMarketsByCreator(userAddress);

      const claimable = [];
      for (const market of markets) {
        const state = await market.state();
        const hasClaimed = await bondManager.bondClaimed(market.address);

        if (state === MarketState.Finalized && !hasClaimed) {
          const bondAmount = await bondManager.bondAmounts(market.address);
          claimable.push({
            marketAddress: market.address,
            bondAmount: bondAmount,
            question: await market.question()
          });
        }
      }

      setClaimableBonds(claimable);
    }

    fetchClaimableBonds();
  }, [userAddress]);

  async function claimAllBonds() {
    const marketAddresses = claimableBonds.map(b => b.marketAddress);
    const tx = await bondManager.claimBonds(marketAddresses);
    await tx.wait();

    toast.success(`Claimed ${claimableBonds.length} bonds!`);
  }

  return (
    <div>
      <h2>Claimable Bonds ({claimableBonds.length})</h2>

      {claimableBonds.map(bond => (
        <div key={bond.marketAddress}>
          <p>{bond.question}</p>
          <p>{formatBASED(bond.bondAmount)} BASED</p>
        </div>
      ))}

      {claimableBonds.length > 0 && (
        <button onClick={claimAllBonds}>
          Claim All Bonds
        </button>
      )}
    </div>
  );
}
```

**Smart Contract Functions**:
```solidity
// BondManager.sol
function claimBonds(address[] calldata marketAddresses) external nonReentrant {
    uint256 totalRefund = 0;

    for (uint256 i = 0; i < marketAddresses.length; i++) {
        address market = marketAddresses[i];

        require(marketCreators[market] == msg.sender, "Not creator");
        require(!bondClaimed[market], "Already claimed");

        // Verify market is finalized
        require(IMarket(market).state() == MarketState.Finalized, "Not finalized");

        uint256 bondAmount = bondAmounts[market];
        bondClaimed[market] = true;
        totalRefund += bondAmount;

        emit BondClaimed(market, msg.sender, bondAmount);
    }

    IERC20(basedToken).transfer(msg.sender, totalRefund);
}

// Convenience function - claim all eligible bonds
function claimAllBonds() external nonReentrant {
    address[] memory userMarkets = getUserMarkets(msg.sender);

    uint256 totalRefund = 0;
    for (uint256 i = 0; i < userMarkets.length; i++) {
        address market = userMarkets[i];

        if (bondClaimed[market]) continue;
        if (IMarket(market).state() != MarketState.Finalized) continue;

        uint256 bondAmount = bondAmounts[market];
        bondClaimed[market] = true;
        totalRefund += bondAmount;

        emit BondClaimed(market, msg.sender, bondAmount);
    }

    require(totalRefund > 0, "No bonds to claim");
    IERC20(basedToken).transfer(msg.sender, totalRefund);
}
```

---

## Section 9: Parameter Management (Global + Individual Overrides)

### 9.1 Hierarchical Parameter System

**Architecture**: Global defaults with market-specific overrides

**Inheritance Pattern**:
```
Global Parameters (ParameterStorage)
    ↓
    Applied to all markets by default
    ↓
Market-Specific Overrides (Optional)
    ↓
    Only certain markets have custom values
    ↓
Parameter Lookup: Check override first, fallback to global
```

### 9.2 Implementation

**ParameterStorage Contract**:
```solidity
contract ParameterStorage {
    // Global defaults
    mapping(bytes32 => uint256) public globalParams;

    // Market-specific overrides
    mapping(address => mapping(bytes32 => uint256)) public marketOverrides;
    mapping(address => bool) public hasMarketOverrides;

    // Parameter lookup with inheritance
    function getParameter(address market, bytes32 key)
        public view returns (uint256)
    {
        if (hasMarketOverrides[market]) {
            uint256 override = marketOverrides[market][key];
            if (override > 0) {
                return override;
            }
        }

        // Fallback to global default
        return globalParams[key];
    }

    // Admin functions
    function setGlobalParameter(bytes32 key, uint256 value)
        external onlyOwner
    {
        globalParams[key] = value;
        emit GlobalParameterUpdated(key, value);
    }

    function setMarketOverride(address market, bytes32 key, uint256 value)
        external onlyOwner
    {
        marketOverrides[market][key] = value;
        hasMarketOverrides[market] = true;
        emit MarketOverrideSet(market, key, value);
    }

    function removeMarketOverride(address market, bytes32 key)
        external onlyOwner
    {
        delete marketOverrides[market][key];
        emit MarketOverrideRemoved(market, key);
    }
}
```

**Use Cases**:

**Normal Markets** (Use Global Defaults):
```javascript
// All normal markets automatically use these
{
  teamFeePercent: 100,       // 1%
  treasuryFeePercent: 150,   // 1.5%
  burnFeePercent: 50          // 0.5%
}
```

**Crowdfunding Market** (Individual Override):
```javascript
// Specific market 0xABC... has custom fees
{
  teamFeePercent: 50,              // 0.5% (override)
  treasuryFeePercent: 0,           // 0% (override)
  burnFeePercent: 0,               // 0% (override)
  beneficiaryFeePercent: 8500,     // 85% (override)
  beneficiaryAddress: "0xStartup..."  // (override)
}
```

**Experimental Market** (Testing Higher Fees):
```javascript
// Market 0xDEF... testing 7% total fees
{
  teamFeePercent: 200,       // 2% (override)
  treasuryFeePercent: 300,   // 3% (override)
  burnFeePercent: 200         // 2% (override)
  // Creator fee still from bond/additional fee
}
```

### 9.3 Admin Interface

**Team Dashboard** (Frontend):
```jsx
// ParameterManagementDashboard.tsx
function ParameterManagementDashboard() {
  const [globalParams, setGlobalParams] = useState({});
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketOverrides, setMarketOverrides] = useState({});

  async function updateGlobalParameter(key, value) {
    await paramStorage.setGlobalParameter(
      ethers.utils.formatBytes32String(key),
      value
    );
    toast.success(`Global ${key} updated to ${value}`);
  }

  async function setMarketOverride(marketAddr, key, value) {
    await paramStorage.setMarketOverride(
      marketAddr,
      ethers.utils.formatBytes32String(key),
      value
    );
    toast.success(`Override set for market ${marketAddr}`);
  }

  return (
    <div>
      <h2>Global Parameters</h2>
      <table>
        <tr>
          <td>Team Fee %</td>
          <td>{globalParams.teamFeePercent / 100}%</td>
          <td><button onClick={() => showEditModal('teamFeePercent')}>
            Edit
          </button></td>
        </tr>
        {/* ... more parameters */}
      </table>

      <h2>Market-Specific Overrides</h2>
      <select onChange={(e) => setSelectedMarket(e.target.value)}>
        <option>Select Market</option>
        {/* List of markets */}
      </select>

      {selectedMarket && (
        <div>
          <h3>Overrides for {selectedMarket}</h3>
          <button onClick={() => addOverride(selectedMarket)}>
            + Add Override
          </button>
          {/* List existing overrides with edit/remove options */}
        </div>
      )}
    </div>
  );
}
```

---

## Section 10: Comprehensive Event Architecture

### 10.1 Event Design Principles

**All significant state changes emit events** for:
- Frontend real-time updates
- Off-chain indexing/analytics
- Audit trail/transparency
- Subgraph integration (The Graph)

### 10.2 Events by Contract

**FlexibleMarketFactory**:
```solidity
event MarketCreated(
    address indexed marketAddress,
    address indexed creator,
    MarketType indexed marketType,
    string question,
    uint256 endTime,
    uint16 creatorFeeBPS,
    uint256 timestamp
);

event MarketTypeRegistered(
    MarketType indexed marketType,
    address implementation,
    uint256 timestamp
);
```

**ProposalSystem**:
```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    address indexed creator,
    uint256 bondAmount,
    uint256 additionalFee,
    uint16 creatorFeePercent,
    bool isSpecialMarket,
    uint256 deadline
);

event VoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    bool approve,
    uint256 weight,
    uint256 timestamp
);

event ProposalApproved(
    uint256 indexed proposalId,
    address indexed marketAddress,
    uint16 creatorFeePercent
);

event ProposalRejected(
    uint256 indexed proposalId,
    uint256 timestamp
);

event ProposalExpired(
    uint256 indexed proposalId,
    uint256 timestamp
);
```

**PredictionMarket**:
```solidity
event BetPlaced(
    address indexed user,
    bool indexed outcome,
    uint256 amount,
    uint256 timestamp
);

event MarketResolved(
    bool indexed outcome,
    address indexed resolver,
    uint256 finalizationTime
);

event MarketFinalized(
    uint256 timestamp
);

event ResolutionReversed(
    bool newOutcome,
    uint256 newFinalizationTime
);

event MarketRefunded(
    uint256 timestamp
);

event WinningsClaimed(
    address indexed user,
    uint256 amount
);

event FeesExtracted(
    uint256 creatorFee,
    uint256 teamFee,
    uint256 treasuryFee,
    uint256 burnFee
);
```

**EnhancedNFTStaking**:
```solidity
event NFTStaked(
    address indexed user,
    uint256 indexed tokenId,
    uint256 rarityWeight,
    uint256 timestamp
);

event BatchStakeCompleted(
    address indexed user,
    uint256 count,
    uint256 totalWeight
);

event NFTUnstaked(
    address indexed user,
    uint256 indexed tokenId,
    uint256 timestamp
);

event BatchUnstakeCompleted(
    address indexed user,
    uint256 count,
    uint256 totalWeight
);
```

**RewardDistributor**:
```solidity
event DistributionPublished(
    uint256 indexed periodId,
    bytes32 merkleRoot,
    uint256 totalTECH,
    uint256 totalBASED,
    string ipfsHash
);

event RewardsClaimed(
    address indexed user,
    uint256 indexed periodId,
    uint256 techAmount,
    uint256 basedAmount
);
```

**BondManager**:
```solidity
event BondLocked(
    address indexed market,
    address indexed creator,
    uint256 amount
);

event BondClaimed(
    address indexed market,
    address indexed creator,
    uint256 amount
);
```

**ParameterStorage**:
```solidity
event GlobalParameterUpdated(
    bytes32 indexed key,
    uint256 value
);

event MarketOverrideSet(
    address indexed market,
    bytes32 indexed key,
    uint256 value
);

event MarketOverrideRemoved(
    address indexed market,
    bytes32 indexed key
);
```

### 10.3 Frontend Integration (Event Listening)

**Real-Time Market Updates**:
```javascript
// market-events.js
const marketContract = new ethers.Contract(marketAddr, MARKET_ABI, provider);

// Listen for new bets
marketContract.on("BetPlaced", (user, outcome, amount, timestamp) => {
  updateMarketUI({
    user: user,
    side: outcome ? "YES" : "NO",
    amount: ethers.utils.formatEther(amount),
    time: new Date(timestamp * 1000)
  });

  showToast(`New ${outcome ? "YES" : "NO"} bet: ${formatBASED(amount)} BASED`);
});

// Listen for resolution
marketContract.on("MarketResolved", (outcome, resolver, finalizationTime) => {
  showBanner({
    type: "pending",
    message: `Market resolved: ${outcome ? "YES" : "NO"}`,
    finalizesAt: new Date(finalizationTime * 1000)
  });
});

// Listen for finalization
marketContract.on("MarketFinalized", (timestamp) => {
  showBanner({
    type: "finalized",
    message: "Market finalized - claim your winnings!",
    action: "Claim Now"
  });
});
```

**Proposal Voting Updates**:
```javascript
// proposal-events.js
proposalSystem.on("VoteCast", (proposalId, voter, approve, weight) => {
  if (proposalId.toNumber() === currentProposalId) {
    updateVoteCount(approve, weight);

    if (voter.toLowerCase() === userAddress.toLowerCase()) {
      showToast(`Your ${approve ? "LIKE" : "DISLIKE"} vote recorded (weight: ${weight})`);
    }
  }
});
```

**Staking Notifications**:
```javascript
// staking-events.js
nftStaking.on("BatchStakeCompleted", (user, count, totalWeight) => {
  if (user.toLowerCase() === userAddress.toLowerCase()) {
    showToast(`Successfully staked ${count} NFTs (weight: ${totalWeight})`);
    refreshStakingUI();
  }
});
```

---

## Section 11: Modular Role-Based Access Control

### 11.1 Role Architecture

**Principle of Least Privilege**: Each role has exactly the permissions needed, nothing more.

**Role Definitions**:
```solidity
// AccessControl roles (OpenZeppelin)
bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
bytes32 public constant PARAMETER_MANAGER_ROLE = keccak256("PARAMETER_MANAGER_ROLE");
bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
bytes32 public constant DISTRIBUTION_MANAGER_ROLE = keccak256("DISTRIBUTION_MANAGER_ROLE");
```

**Permission Matrix**:

| Role | Can Resolve Markets | Can Adjust Parameters | Can Emergency Override | Can Publish Distributions | Can Grant/Revoke Roles |
|------|-------------------|---------------------|---------------------|------------------------|----------------------|
| OWNER | ✓ | ✓ | ✓ | ✓ | ✓ (all roles) |
| RESOLVER | ✓ | ✗ | ✗ | ✗ | ✗ |
| PARAMETER_MANAGER | ✗ | ✓ | ✗ | ✗ | ✗ |
| EMERGENCY | ✗ | ✗ | ✓ | ✗ | ✗ |
| DISTRIBUTION_MANAGER | ✗ | ✗ | ✗ | ✓ | ✗ |

### 11.2 Implementation

**Base Access Control**:
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PredictionMarket is AccessControl {
    constructor() {
        // Deploy deployer as owner
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
    }

    function resolveMarket(bool outcome)
        external
        onlyRole(RESOLVER_ROLE)
    {
        // Resolution logic
    }

    function emergencyReverseResolution(bool newOutcome)
        external
        onlyRole(EMERGENCY_ROLE)
    {
        // Emergency logic
    }
}
```

**Role Management Functions** (Only OWNER can call):
```solidity
function grantResolverRole(address account) external onlyRole(OWNER_ROLE) {
    grantRole(RESOLVER_ROLE, account);
    emit RoleGranted(RESOLVER_ROLE, account, msg.sender);
}

function revokeResolverRole(address account) external onlyRole(OWNER_ROLE) {
    revokeRole(RESOLVER_ROLE, account);
    emit RoleRevoked(RESOLVER_ROLE, account, msg.sender);
}

// Similar functions for other roles
```

**Admin Dashboard** (Frontend):
```jsx
// RoleManagement.tsx
function RoleManagementDashboard() {
  const [roleHolders, setRoleHolders] = useState({
    resolvers: [],
    paramManagers: [],
    emergencyResponders: [],
    distributionManagers: []
  });

  async function grantRole(role, address) {
    await predictionMarket.grantResolverRole(address);
    toast.success(`Granted ${role} role to ${address}`);
    refreshRoleHolders();
  }

  async function revokeRole(role, address) {
    await predictionMarket.revokeResolverRole(address);
    toast.success(`Revoked ${role} role from ${address}`);
    refreshRoleHolders();
  }

  return (
    <div>
      <h2>Role Management</h2>

      <section>
        <h3>Resolvers</h3>
        {roleHolders.resolvers.map(addr => (
          <div key={addr}>
            <span>{addr}</span>
            <button onClick={() => revokeRole('resolver', addr)}>
              Revoke
            </button>
          </div>
        ))}
        <button onClick={() => showGrantModal('resolver')}>
          + Add Resolver
        </button>
      </section>

      {/* Similar sections for other roles */}
    </div>
  );
}
```

### 11.3 Security Considerations

**Role Separation Benefits**:
- Compromised resolver key cannot adjust parameters or steal funds
- Compromised parameter manager cannot resolve markets incorrectly
- Emergency responder can only act during pending periods
- Distribution manager can only publish reward roots (no fund access)

**Owner Role Protection**:
- Only owner can grant/revoke roles
- Owner role should use multisig wallet (Gnosis Safe recommended)
- Consider timelock for critical owner actions (future upgrade)

---

## Section 12: Comment System (Off-Chain with Optional Signatures)

### 12.1 Architecture

**Hybrid Approach**: Off-chain storage with on-chain signature verification (optional, toggleable per section)

**Technology Stack**:
- Frontend: Next.js + React
- Backend: Node.js + PostgreSQL
- Authentication: Wallet connection + Twitter OAuth

### 12.2 Database Schema

```sql
-- comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    market_address VARCHAR(42) NOT NULL,
    proposal_id INTEGER,
    user_address VARCHAR(42) NOT NULL,
    twitter_handle VARCHAR(50),
    content TEXT NOT NULL,
    signature VARCHAR(132),  -- Optional wallet signature
    created_at TIMESTAMP DEFAULT NOW(),
    parent_comment_id INTEGER REFERENCES comments(id),

    INDEX idx_market (market_address),
    INDEX idx_proposal (proposal_id),
    INDEX idx_user (user_address)
);

-- likes table
CREATE TABLE comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id),
    user_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(comment_id, user_address)
);
```

### 12.3 Signature Toggle System

**Configuration**:
```javascript
// Backend config
const SIGNATURE_REQUIREMENTS = {
  general_comments: false,           // No signature needed
  proposal_comments: false,          // No signature needed
  pending_resolution_comments: true, // SIGNATURE REQUIRED
  governance_votes: true             // SIGNATURE REQUIRED
};

// Admin can toggle via API:
// PUT /api/admin/signature-settings
// { section: "proposal_comments", required: true }
```

**Comment Submission** (With Signature):
```javascript
// Frontend: comment-submit.js
async function submitComment(marketAddress, content) {
  // Check if signature required for this section
  const requiresSignature = await fetch(
    `/api/signature-requirements/${section}`
  );

  let signature = null;
  if (requiresSignature) {
    // Create message
    const message = `Commenting on ${marketAddress}: ${content} at ${Date.now()}`;

    // Request signature from wallet
    signature = await signer.signMessage(message);
  }

  // Submit comment
  await fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({
      marketAddress,
      content,
      signature,
      timestamp: Date.now()
    })
  });
}
```

**Backend Verification**:
```javascript
// Backend: comment-handler.js
async function handleCommentSubmission(req, res) {
  const { marketAddress, content, signature, timestamp } = req.body;
  const userAddress = req.session.walletAddress;

  // Check if signature required
  const section = determineSection(marketAddress);
  const requiresSignature = SIGNATURE_REQUIREMENTS[section];

  if (requiresSignature) {
    // Verify signature
    const message = `Commenting on ${marketAddress}: ${content} at ${timestamp}`;
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
  }

  // Store comment in database
  await db.query(
    'INSERT INTO comments (market_address, user_address, content, signature) VALUES ($1, $2, $3, $4)',
    [marketAddress, userAddress, content, signature]
  );

  res.json({ success: true });
}
```

**Benefits**:
- Flexible security (toggle per section)
- Casual sections: no friction
- Critical sections: cryptographic proof
- Admin control over requirements
- Future-proof for on-chain migration

---

## Section 13: Frontend Integration Guide

### 13.1 Technology Stack

**Core Framework**: Next.js 15 (App Router)
**Web3 Library**: Wagmi v2 + Viem
**Wallet Connection**: RainbowKit / ConnectKit
**State Management**: Zustand
**Styling**: Tailwind CSS
**API Calls**: React Query (TanStack Query)

### 13.2 Key Frontend Components

**Market List**:
```tsx
// app/markets/page.tsx
export default function MarketsPage() {
  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const marketAddresses = await factory.getAllMarkets();

      // Fetch details for each market
      return Promise.all(
        marketAddresses.map(async (addr) => {
          const market = new ethers.Contract(addr, MARKET_ABI, provider);
          return {
            address: addr,
            question: await market.question(),
            endTime: await market.endTime(),
            state: await market.state(),
            totalYes: await market.totalYes(),
            totalNo: await market.totalNo()
          };
        })
      );
    }
  });

  return (
    <div>
      <h1>Prediction Markets</h1>
      {markets?.map(market => (
        <MarketCard key={market.address} market={market} />
      ))}
    </div>
  );
}
```

**Betting Interface**:
```tsx
// components/BettingInterface.tsx
export function BettingInterface({ marketAddress }) {
  const [outcome, setOutcome] = useState(true);  // YES/NO
  const [amount, setAmount] = useState('');

  const { writeAsync: placeBet } = useContractWrite({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'bet',
  });

  async function handleBet() {
    const tx = await placeBet({
      args: [outcome],
      value: ethers.utils.parseEther(amount)
    });

    await tx.wait();
    toast.success('Bet placed successfully!');
  }

  return (
    <div>
      <div>
        <button
          onClick={() => setOutcome(true)}
          className={outcome ? 'bg-green-500' : 'bg-gray-500'}
        >
          YES
        </button>
        <button
          onClick={() => setOutcome(false)}
          className={!outcome ? 'bg-red-500' : 'bg-gray-500'}
        >
          NO
        </button>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in BASED"
      />

      <button onClick={handleBet}>
        Place Bet
      </button>
    </div>
  );
}
```

**Staking Dashboard**:
```tsx
// app/staking/page.tsx
export default function StakingPage() {
  const { address } = useAccount();
  const [selectedNFTs, setSelectedNFTs] = useState([]);

  // Fetch user's NFTs
  const { data: userNFTs } = useQuery({
    queryKey: ['userNFTs', address],
    queryFn: async () => {
      const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
      const balance = await nftContract.balanceOf(address);

      const tokens = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        tokens.push(tokenId.toNumber());
      }

      return tokens;
    },
    enabled: !!address
  });

  // Batch stake
  const { writeAsync: batchStake } = useContractWrite({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'batchStake'
  });

  async function handleStake() {
    const tx = await batchStake({
      args: [selectedNFTs]
    });

    await tx.wait();
    toast.success(`Staked ${selectedNFTs.length} NFTs!`);
  }

  return (
    <div>
      <h1>Stake Your NFTs</h1>

      <div className="grid grid-cols-5 gap-4">
        {userNFTs?.map(tokenId => (
          <NFTCard
            key={tokenId}
            tokenId={tokenId}
            selected={selectedNFTs.includes(tokenId)}
            onToggle={() => toggleSelection(tokenId)}
          />
        ))}
      </div>

      <button
        onClick={handleStake}
        disabled={selectedNFTs.length === 0}
      >
        Stake {selectedNFTs.length} NFTs
      </button>
    </div>
  );
}
```

**Rewards Claim Interface**:
```tsx
// components/RewardsClaim.tsx
export function RewardsClaim() {
  const { address } = useAccount();
  const [claimableRewards, setClaimableRewards] = useState(null);

  useEffect(() => {
    async function fetchClaimable() {
      const currentPeriod = await rewardDistributor.currentPeriod();
      const lastClaimed = await rewardDistributor.userLastClaimedPeriod(address);

      const rewards = [];
      let totalTECH = 0;
      let totalBASED = 0;

      for (let period = lastClaimed + 1; period <= currentPeriod; period++) {
        const data = await fetch(`/api/distributions/${period}`);
        const json = await data.json();

        if (json.rewards[address]) {
          rewards.push({
            periodId: period,
            techAmount: json.rewards[address].techAmount,
            basedAmount: json.rewards[address].basedAmount,
            proof: json.rewards[address].proof
          });

          totalTECH += parseFloat(json.rewards[address].techAmount);
          totalBASED += parseFloat(json.rewards[address].basedAmount);
        }
      }

      setClaimableRewards({ rewards, totalTECH, totalBASED });
    }

    fetchClaimable();
  }, [address]);

  const { writeAsync: claimRewards } = useContractWrite({
    address: REWARD_DISTRIBUTOR_ADDRESS,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'claimMultiplePeriods'
  });

  async function handleClaim() {
    const tx = await claimRewards({
      args: [claimableRewards.rewards]
    });

    await tx.wait();
    toast.success('Rewards claimed!');
  }

  return (
    <div>
      <h2>Claimable Rewards</h2>

      {claimableRewards && (
        <div>
          <p>{formatTECH(claimableRewards.totalTECH)} TECH</p>
          <p>{formatBASED(claimableRewards.totalBASED)} BASED</p>
          <p>Across {claimableRewards.rewards.length} periods</p>

          <button onClick={handleClaim}>
            Claim Rewards
          </button>
        </div>
      )}
    </div>
  );
}
```

### 13.3 Real-Time Updates (WebSocket)

**Event Streaming**:
```typescript
// lib/event-stream.ts
export function useMarketEvents(marketAddress: string) {
  useEffect(() => {
    const market = new ethers.Contract(marketAddress, MARKET_ABI, provider);

    // Listen for bets
    market.on('BetPlaced', (user, outcome, amount, timestamp) => {
      // Update UI
      queryClient.invalidateQueries(['market', marketAddress]);

      // Show toast
      toast.info(`New bet: ${outcome ? 'YES' : 'NO'} ${formatBASED(amount)}`);
    });

    // Listen for resolution
    market.on('MarketResolved', (outcome, resolver, finalizationTime) => {
      queryClient.invalidateQueries(['market', marketAddress]);
      toast.success(`Market resolved: ${outcome ? 'YES' : 'NO'}`);
    });

    // Cleanup
    return () => {
      market.removeAllListeners();
    };
  }, [marketAddress]);
}
```

---

## Section 14: Testing Strategy

### 14.1 Testing Levels

**Unit Tests** (Individual contract functions):
- Test each function in isolation
- Mock external dependencies
- Target: 90%+ coverage

**Integration Tests** (Contract interactions):
- Test full workflows (propose → vote → create → bet → resolve → claim)
- Test multi-contract interactions
- Test parameter inheritance and overrides

**End-to-End Tests** (Full system):
- Deploy all contracts to local testnet
- Execute real user journeys
- Test frontend + smart contract integration

### 14.2 Test Scenarios

**Proposal System**:
```javascript
describe('ProposalSystem', () => {
  it('should accept proposal with bond + additional fee', async () => {
    // Create proposal
    await proposalSystem.createProposal(
      bondAmount: 30_000e18,
      additionalFee: 50_000e18,
      ...
    );

    // Verify tax sent to team
    expect(await basedToken.balanceOf(teamWallet)).to.equal(800e18);

    // Verify funds held in contract
    expect(await basedToken.balanceOf(proposalSystem.address))
      .to.equal(80_000e18);
  });

  it('should refund bond but not fee on rejection', async () => {
    // Create and reject proposal
    await proposalSystem.createProposal(...);
    await proposalSystem.rejectProposal(proposalId);

    // Verify refund
    const creatorBalance = await basedToken.balanceOf(creator);
    expect(creatorBalance).to.equal(initialBalance - 50_800e18);
  });

  it('should create market with correct creator fee', async () => {
    // Approve proposal
    await proposalSystem.approveProposal(proposalId);

    // Verify market created
    const marketAddress = await factory.markets(0);
    const market = await ethers.getContractAt('PredictionMarket', marketAddress);

    // Verify creator fee matches calculation
    expect(await market.creatorFeeBPS()).to.equal(84);  // 0.84%
  });
});
```

**Market Resolution**:
```javascript
describe('48-Hour Finalization', () => {
  it('should enter pending state after resolution', async () => {
    await market.resolveMarket(true);

    expect(await market.state()).to.equal(MarketState.PendingFinalization);
    expect(await market.finalizationTime())
      .to.equal(block.timestamp + 48 * 3600);
  });

  it('should auto-finalize after 48 hours', async () => {
    await market.resolveMarket(true);

    // Fast-forward time
    await ethers.provider.send('evm_increaseTime', [48 * 3600]);
    await ethers.provider.send('evm_mine');

    // Anyone can finalize
    await market.connect(randomUser).finalizeMarket();

    expect(await market.state()).to.equal(MarketState.Finalized);
  });

  it('should allow emergency reverse during pending period', async () => {
    await market.resolveMarket(true);

    // Team reverses decision
    await market.emergencyReverseResolution(false);

    expect(await market.winningOutcome()).to.equal(false);
    expect(await market.state()).to.equal(MarketState.PendingFinalization);
  });

  it('should prevent reversal after finalization', async () => {
    await market.resolveMarket(true);

    // Fast-forward and finalize
    await ethers.provider.send('evm_increaseTime', [48 * 3600]);
    await market.finalizeMarket();

    // Attempt reverse (should fail)
    await expect(
      market.emergencyReverseResolution(false)
    ).to.be.revertedWith('Not in pending state');
  });
});
```

**NFT Staking**:
```javascript
describe('BatchStaking', () => {
  it('should stake multiple NFTs in one transaction', async () => {
    const tokenIds = [1, 5, 23, 42, 100];

    await nftStaking.batchStake(tokenIds);

    // Verify all staked
    for (const tokenId of tokenIds) {
      const stake = await nftStaking.stakes(user.address, tokenId);
      expect(stake.stakedAt).to.be.gt(0);
    }

    // Verify total weight
    const totalWeight = await nftStaking.userStakingWeight(user.address);
    expect(totalWeight).to.equal(expectedWeight);
  });

  it('should enforce 24-hour reward delay', async () => {
    await nftStaking.batchStake([1]);

    // Check immediately
    let pending = await nftStaking.calculatePendingRewards(user.address);
    expect(pending).to.equal(0);

    // Fast-forward 12 hours (still no rewards)
    await ethers.provider.send('evm_increaseTime', [12 * 3600]);
    pending = await nftStaking.calculatePendingRewards(user.address);
    expect(pending).to.equal(0);

    // Fast-forward past 24 hours
    await ethers.provider.send('evm_increaseTime', [13 * 3600]);
    pending = await nftStaking.calculatePendingRewards(user.address);
    expect(pending).to.be.gt(0);  // Now has rewards
  });

  it('should apply rarity multipliers correctly', async () => {
    // Stake Common (1x), Rare (1.25x), Mythic (5x)
    await nftStaking.batchStake([1, 500, 10]);  // Assume these tiers

    // Fast-forward 7 days
    await ethers.provider.send('evm_increaseTime', [7 * 24 * 3600]);

    const pending = await nftStaking.calculatePendingRewards(user.address);

    // Expected: (3 * 1.0 + 3 * 1.25 + 3 * 5.0) * 7 days
    const expected = (3 + 3.75 + 15) * 7;
    expect(ethers.utils.formatEther(pending)).to.be.closeTo(expected, 0.01);
  });
});
```

**Merkle Claim**:
```javascript
describe('MerkleRewardDistribution', () => {
  it('should verify valid proof and transfer both tokens', async () => {
    const userReward = {
      address: user.address,
      techAmount: ethers.utils.parseEther('420'),
      basedAmount: ethers.utils.parseEther('17'),
      periodId: 1
    };

    const tree = generateMerkleTree([userReward, ...otherRewards]);
    const proof = tree.getProof(userReward);

    // Publish root
    await rewardDistributor.publishDistribution(1, tree.root, totalTECH, totalBASED);

    // Claim
    await rewardDistributor.claimMultiplePeriods([{
      periodId: 1,
      techAmount: userReward.techAmount,
      basedAmount: userReward.basedAmount,
      merkleProof: proof
    }]);

    // Verify transfers
    expect(await techToken.balanceOf(user.address)).to.equal(userReward.techAmount);
    expect(await basedToken.balanceOf(user.address)).to.equal(userReward.basedAmount);
  });

  it('should allow claiming multiple periods at once', async () => {
    // Publish 3 periods
    await rewardDistributor.publishDistribution(1, root1, ...);
    await rewardDistributor.publishDistribution(2, root2, ...);
    await rewardDistributor.publishDistribution(3, root3, ...);

    // Claim all at once
    await rewardDistributor.claimMultiplePeriods([
      { periodId: 1, techAmount: 420e18, basedAmount: 17e18, proof: proof1 },
      { periodId: 2, techAmount: 380e18, basedAmount: 15e18, proof: proof2 },
      { periodId: 3, techAmount: 410e18, basedAmount: 16e18, proof: proof3 }
    ]);

    // Verify total
    expect(await techToken.balanceOf(user.address))
      .to.equal(ethers.utils.parseEther('1210'));  // 420 + 380 + 410
  });
});
```

### 14.3 Test Coverage Targets

**Unit Tests**: 90%+ line coverage
**Integration Tests**: All critical paths covered
**E2E Tests**: All user journeys tested

**Tools**:
- Hardhat (testing framework)
- Chai (assertions)
- ethers.js (Web3 library)
- Solidity-coverage (coverage reports)

---

## Section 15: Deployment Plan

### 15.1 Deployment Sequence

**Phase 1: Core Infrastructure** (Week 1)
1. Deploy Registry contract
2. Deploy ParameterStorage contract
3. Set initial global parameters
4. Deploy NFTRarityRegistry
5. Batch register NFT tiers (10 transactions)

**Phase 2: Market System** (Week 1-2)
6. Deploy PredictionMarket implementation (template)
7. Deploy MultiOutcomeMarket implementation (template)
8. Deploy FlexibleMarketFactory
9. Register market type templates in factory
10. Deploy ProposalSystem
11. Link ProposalSystem to Factory

**Phase 3: NFT & Rewards** (Week 2)
12. Deploy EnhancedNFTStaking contract
13. Deploy RewardDistributor contract
14. Deploy BondManager contract
15. Set up reward treasury wallet (multisig recommended)
16. Fund treasury with initial TECH tokens

**Phase 4: Configuration** (Week 2)
17. Set all ParameterStorage global defaults
18. Grant roles (resolver, emergency, distribution manager)
19. Configure proposal voting parameters
20. Test parameter override system with dummy market

**Phase 5: Testing** (Week 3)
21. Deploy to Based testnet
22. Create test proposals
23. Conduct full user journey tests
24. Stake test NFTs and verify reward calculations
25. Test emergency override functions
26. Verify event emissions

**Phase 6: Mainnet Deployment** (Week 4)
27. Deploy all contracts to Based mainnet
28. Verify contracts on Based Explorer
29. Set up VPS server for reward calculations
30. Configure cron job for weekly distributions
31. Deploy frontend to private Vercel domain
32. Conduct private testing phase (team only)

**Phase 7: Public Launch** (Week 5-6)
33. Create first official proposals
34. Invite community beta testers
35. Monitor for issues
36. Deploy frontend to public domain (kektech.xyz)
37. Announce public launch

### 15.2 Deployment Scripts

**Master Deployment Script**:
```javascript
// scripts/deploy-all.js
async function main() {
  console.log('Starting KEKTECH 2.0 deployment...');

  // 1. Core contracts
  const Registry = await ethers.getContractFactory('Registry');
  const registry = await Registry.deploy();
  await registry.deployed();
  console.log('Registry:', registry.address);

  const ParameterStorage = await ethers.getContractFactory('ParameterStorage');
  const paramStorage = await ParameterStorage.deploy();
  await paramStorage.deployed();
  console.log('ParameterStorage:', paramStorage.address);

  // 2. NFT system
  const NFTRarityRegistry = await ethers.getContractFactory('NFTRarityRegistry');
  const rarityRegistry = await NFTRarityRegistry.deploy(
    NFT_CONTRACT_ADDRESS,
    paramStorage.address
  );
  await rarityRegistry.deployed();
  console.log('NFTRarityRegistry:', rarityRegistry.address);

  // 3. Market implementations
  const PredictionMarket = await ethers.getContractFactory('PredictionMarket');
  const marketImpl = await PredictionMarket.deploy();
  await marketImpl.deployed();
  console.log('PredictionMarket template:', marketImpl.address);

  const MultiOutcomeMarket = await ethers.getContractFactory('MultiOutcomeMarket');
  const multiOutcomeImpl = await MultiOutcomeMarket.deploy();
  await multiOutcomeImpl.deployed();
  console.log('MultiOutcomeMarket template:', multiOutcomeImpl.address);

  // 4. Factory
  const FlexibleMarketFactory = await ethers.getContractFactory('FlexibleMarketFactory');
  const factory = await FlexibleMarketFactory.deploy(
    registry.address,
    paramStorage.address
  );
  await factory.deployed();
  console.log('FlexibleMarketFactory:', factory.address);

  // Register market types
  await factory.registerMarketType(0, marketImpl.address);  // STANDARD
  await factory.registerMarketType(1, multiOutcomeImpl.address);  // MULTI_OUTCOME
  console.log('Market types registered');

  // 5. Proposal system
  const ProposalSystem = await ethers.getContractFactory('ProposalSystem');
  const proposalSystem = await ProposalSystem.deploy(
    factory.address,
    paramStorage.address,
    BASED_TOKEN_ADDRESS
  );
  await proposalSystem.deployed();
  console.log('ProposalSystem:', proposalSystem.address);

  // 6. Staking & rewards
  const EnhancedNFTStaking = await ethers.getContractFactory('EnhancedNFTStaking');
  const nftStaking = await EnhancedNFTStaking.deploy(
    NFT_CONTRACT_ADDRESS,
    rarityRegistry.address,
    paramStorage.address
  );
  await nftStaking.deployed();
  console.log('EnhancedNFTStaking:', nftStaking.address);

  const RewardDistributor = await ethers.getContractFactory('RewardDistributor');
  const rewardDistributor = await RewardDistributor.deploy(
    TECH_TOKEN_ADDRESS,
    BASED_TOKEN_ADDRESS
  );
  await rewardDistributor.deployed();
  console.log('RewardDistributor:', rewardDistributor.address);

  const BondManager = await ethers.getContractFactory('BondManager');
  const bondManager = await BondManager.deploy(BASED_TOKEN_ADDRESS);
  await bondManager.deployed();
  console.log('BondManager:', bondManager.address);

  // 7. Configure parameters
  console.log('Setting initial parameters...');
  await setGlobalParameters(paramStorage);
  await setRarityMultipliers(paramStorage);
  await grantRoles(factory, proposalSystem, rewardDistributor);

  // 8. Save addresses
  const addresses = {
    registry: registry.address,
    paramStorage: paramStorage.address,
    rarityRegistry: rarityRegistry.address,
    factory: factory.address,
    proposalSystem: proposalSystem.address,
    nftStaking: nftStaking.address,
    rewardDistributor: rewardDistributor.address,
    bondManager: bondManager.address,
    marketImpl: marketImpl.address,
    multiOutcomeImpl: multiOutcomeImpl.address
  };

  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );

  console.log('Deployment complete! Addresses saved to deployed-addresses.json');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

---

## Section 16: Risk Mitigation & Security

### 16.1 Smart Contract Risks

**Reentrancy**:
- Mitigation: OpenZeppelin's `ReentrancyGuard` on all state-changing functions
- Pattern: Checks-Effects-Interactions order

**Integer Overflow/Underflow**:
- Mitigation: Solidity 0.8+ has built-in overflow protection
- Additional: Safe math checks in fee calculations

**Access Control**:
- Mitigation: OpenZeppelin's `AccessControl` for role management
- Principle of least privilege
- Owner uses multisig wallet

**Front-Running**:
- Risk: Users see pending bets and front-run with larger bets
- Mitigation: Unavoidable in public mempool, but market odds adjust automatically
- Future: Consider commit-reveal schemes for high-value markets

**Oracle Manipulation**:
- Risk: Off-chain reward calculation script compromised
- Mitigation: Read-only data queries, no fund control
- Merkle proofs provide cryptographic verification
- Dual hosting (VPS + IPFS) for data availability

### 16.2 Economic Risks

**Low Liquidity Markets**:
- Risk: Markets with low volume have poor odds
- Mitigation: Proposal system filters low-quality markets
- Minimum bond requirement ensures creator commitment

**Creator Fee Gaming**:
- Risk: Creators create markets with max fees then bet themselves
- Mitigation: High upfront cost (231k BASED for max fees)
- Community voting filters suspicious proposals
- 48-hour finalization provides dispute window

**Reward Sustainability**:
- Risk: Daily TECH emissions deplete treasury
- Mitigation: Adjustable emission rates via ParameterStorage
- Trading fees replenish treasury
- Team monitors treasury balance weekly

### 16.3 Operational Risks

**Reward Script Failure**:
- Risk: Weekly distribution script fails to run
- Mitigation: PM2 process manager with auto-restart
- Email alerts on failure
- Manual fallback procedure documented

**Key Management**:
- Risk: Owner/resolver private keys compromised
- Mitigation: Use hardware wallets (Ledger/Trezor)
- Multisig for owner role (Gnosis Safe)
- Separate keys for different roles

**Frontend Downtime**:
- Risk: Vercel/VPS hosting failures
- Mitigation: Smart contracts remain accessible via Etherscan
- Frontend code open-source (users can run locally)
- IPFS hosting as fallback

### 16.4 Emergency Procedures

**Critical Bug Discovered**:
1. Pause affected contracts (if pause function exists)
2. Deploy fixed version
3. Update registry to point to new version
4. Communicate with users via Discord/Twitter
5. Compensate affected users from team treasury

**Market Resolution Dispute**:
1. Monitor comments during 48-hour period
2. If legitimate dispute, use `emergencyReverseResolution` or `emergencyRefundMarket`
3. Document decision rationale
4. Learn for future resolution process improvements

**Reward Distribution Error**:
1. Identify affected period
2. Calculate correct rewards off-chain
3. Publish new Merkle root for corrected period
4. Notify users to claim from new root
5. Old root remains valid (double-claim prevented by on-chain tracking)

---

## Section 17: Future Enhancements (Post-MVP)

### 17.1 Advanced Market Types

**Duel Markets** (Phase 3):
- Two users bet against each other directly
- Winner-take-all after fees
- Reputation system for duel participants

**NFT Battle Markets** (Phase 3):
- Communities bet on which NFT collection will outperform
- Metrics: floor price change, volume, etc.
- Cross-chain integration with price oracles

**Conditional Markets** (Phase 4):
- Markets with dependencies ("If A happens, will B happen?")
- Cascading resolution logic
- More complex payout calculations

### 17.2 Governance Evolution

**Full DAO** (Phase 4):
- Token-weighted voting on parameters
- Proposal creation by any token holder
- Timelock for critical changes
- Treasury management via governance

### 17.3 Scaling Solutions

**Layer 2 Integration** (Phase 5):
- Deploy markets on L2 for lower gas costs
- Bridge for cross-chain NFT staking
- Optimistic rollup or ZK-rollup depending on ecosystem

**Batch Operations** (Phase 3):
- Batch claim multiple market winnings
- Batch bond claims (already designed)
- Gas optimization for frequent users

### 17.4 AI Integration

**AI Market Resolution** (Phase 6):
- AI agent monitors public data sources
- Suggests resolutions with confidence scores
- Human oversight still required
- Reduces team operational burden

**Automated Market Creation** (Phase 6):
- AI detects trending topics
- Generates market proposals automatically
- Community still votes on approval

### 17.5 Social Features

**Reputation System** (Phase 3):
- Track prediction accuracy per user
- Leaderboard for top predictors
- Reputation NFTs/badges
- Reputation affects voting weight

**Creator Tiers** (Phase 4):
- Successful creators get fee discounts
- Reduced bond requirements for proven creators
- Verified creator badges

**Referral Program** (Phase 3):
- Users earn rewards for referrals
- Multi-level referral structure
- Tracked via on-chain or off-chain system

---

## Section 18: Conclusion & Next Steps

### 18.1 Summary

KEKTECH 2.0 represents a sophisticated prediction market platform with:
- **Unified Proposal Economics**: Two-lever system (bond + additional fee) for flexible creator incentives
- **NFT-Weighted Governance**: Only staked NFTs grant voting power with tier-based weights
- **Dual-Token Rewards**: TECH and BASED distributed via Merkle trees
- **48-Hour Auto-Finalization**: Community review period with team override powers
- **Comprehensive Parameter Control**: Global defaults + individual market overrides
- **Gas-Optimized NFT Staking**: Batch operations supporting up to 150 NFTs per transaction
- **Modular Role System**: Granular permissions for team scaling
- **Event-Driven Architecture**: Complete audit trail for analytics and transparency

### 18.2 Implementation Timeline

**Week 1-2**: Smart contract development and unit testing
**Week 3**: Integration testing and testnet deployment
**Week 4**: Mainnet deployment and private testing
**Week 5-6**: Public beta and launch
**Month 2-3**: Monitor, optimize, gather feedback
**Month 4+**: Implement Phase 2/3 features based on learnings

### 18.3 Success Criteria

**Technical Metrics**:
- 99.9% smart contract uptime
- <2% failed transactions due to contract errors
- <5 minute average reward claim time
- Zero critical security vulnerabilities

**Usage Metrics**:
- 100+ active markets within first month
- 500+ unique wallet addresses participating
- 10,000+ BASED in daily trading volume
- 50%+ of NFT collection staked

**Community Metrics**:
- 80%+ proposal approval rate (indicates good quality)
- <5% markets requiring emergency override (indicates good resolution process)
- 20+ active community members voting on proposals
- <24 hour average response time to disputes

### 18.4 Final Notes

This master plan document serves as the **single source of truth** for KEKTECH 2.0 development. All specifications, parameters, formulas, and implementation details have been carefully refined through extensive discussion to ensure:

**Flexibility**: All critical parameters adjustable without redeployment
**Simplicity**: Unified proposal system reduces cognitive load
**Security**: Multi-layered access control and emergency procedures
**Scalability**: Batch operations and off-chain calculations for efficiency
**Transparency**: Comprehensive event emissions and public data

The platform is designed to evolve with the community while maintaining stability and security. The phased implementation approach allows for iterative learning and optimization based on real-world usage patterns.

---

**Document Version**: 1.0
**Last Updated**: October 23, 2025
**Status**: Final Refined Specification

**Prepared For**: KEKTECH 2.0 Development Team
**Prepared By**: Project Planning Team (Claude + Human Collaboration)

---

*End of Master Plan Document*