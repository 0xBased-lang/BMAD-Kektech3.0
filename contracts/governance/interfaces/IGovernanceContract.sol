// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGovernanceContract
 * @notice Interface for decentralized governance with economic bonds and spam prevention
 * @dev Implements snapshot-based voting with NFT voting power (Fix #7)
 */
interface IGovernanceContract {
    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Proposal states
     */
    enum ProposalState {
        PENDING,    // Proposal created, voting not yet started
        ACTIVE,     // Voting in progress
        SUCCEEDED,  // Voting succeeded, awaiting execution
        DEFEATED,   // Voting failed
        EXECUTED,   // Proposal executed
        CANCELLED   // Proposal cancelled
    }

    /**
     * @notice Proposal types
     */
    enum ProposalType {
        PARAMETER_UPDATE,   // Update contract parameters
        TREASURY_SPEND,     // Spend from treasury
        UPGRADE,            // Upgrade contract
        EMERGENCY_ACTION    // Emergency action
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Proposal data
     * @param proposer Address that created the proposal
     * @param proposalType Type of proposal
     * @param description Proposal description
     * @param targets Target contracts to call
     * @param values ETH values for calls
     * @param calldatas Call data for each target
     * @param startBlock Block when voting starts
     * @param endBlock Block when voting ends
     * @param snapshotBlock Block for voting power snapshot (Fix #7)
     * @param forVotes Votes in favor
     * @param againstVotes Votes against
     * @param abstainVotes Abstain votes
     * @param state Current proposal state
     * @param bondAmount Bond locked by proposer
     * @param executed Whether proposal was executed
     */
    struct Proposal {
        address proposer;
        ProposalType proposalType;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 snapshotBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        uint256 bondAmount;
        bool executed;
    }

    /**
     * @notice Vote receipt
     * @param hasVoted Whether user has voted
     * @param support Vote direction (0=against, 1=for, 2=abstain)
     * @param votes Number of votes cast
     */
    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new proposal is created
     * @param proposalId ID of the proposal
     * @param proposer Address that created the proposal
     * @param description Proposal description
     * @param startBlock Voting start block
     * @param endBlock Voting end block
     */
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );

    /**
     * @notice Emitted when a vote is cast
     * @param voter Address that voted
     * @param proposalId ID of the proposal
     * @param support Vote direction
     * @param votes Number of votes
     * @param reason Optional vote reason
     */
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes,
        string reason
    );

    /**
     * @notice Emitted when a proposal is executed
     * @param proposalId ID of the proposal
     */
    event ProposalExecuted(uint256 indexed proposalId);

    /**
     * @notice Emitted when a proposal is cancelled
     * @param proposalId ID of the proposal
     */
    event ProposalCancelled(uint256 indexed proposalId);

    /**
     * @notice Emitted when a proposal is defeated
     * @param proposalId ID of the proposal
     * @param bondForfeited Whether bond was forfeited
     */
    event ProposalDefeated(uint256 indexed proposalId, bool bondForfeited);

    /**
     * @notice Emitted when bond is refunded to proposer
     * @param proposalId ID of the proposal
     * @param proposer Address receiving refund
     * @param amount Amount refunded
     */
    event BondRefunded(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount
    );

    /**
     * @notice Emitted when bond is forfeited
     * @param proposalId ID of the proposal
     * @param proposer Address whose bond was forfeited
     * @param amount Amount forfeited
     */
    event BondForfeited(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount
    );

    /**
     * @notice Emitted when a user is blacklisted for spam
     * @param user Address blacklisted
     * @param reason Blacklist reason
     */
    event UserBlacklisted(address indexed user, string reason);

    /**
     * @notice Emitted when a user is removed from blacklist
     * @param user Address removed from blacklist
     */
    event UserWhitelisted(address indexed user);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Create a new proposal
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param calldatas Array of call data
     * @param description Proposal description
     * @param proposalType Type of proposal
     * @return proposalId ID of created proposal
     * @dev Requires bond deposit to prevent spam
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType
    ) external payable returns (uint256 proposalId);

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support Vote direction (0=against, 1=for, 2=abstain)
     * @dev Uses snapshot voting power from snapshotBlock (Fix #7)
     */
    function castVote(uint256 proposalId, uint8 support) external;

    /**
     * @notice Cast a vote with reason
     * @param proposalId ID of the proposal
     * @param support Vote direction
     * @param reason Reason for vote
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external;

    /**
     * @notice Execute a succeeded proposal
     * @param proposalId ID of the proposal
     * @dev Can only be called after voting period ends and proposal succeeded
     */
    function execute(uint256 proposalId) external payable;

    /**
     * @notice Cancel a proposal
     * @param proposalId ID of the proposal
     * @dev Only proposer or admin can cancel
     */
    function cancel(uint256 proposalId) external;

    /**
     * @notice Queue a proposal for execution
     * @param proposalId ID of the proposal
     * @dev For proposals requiring timelock
     */
    function queue(uint256 proposalId) external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get proposal details
     * @param proposalId ID of the proposal
     * @return proposal Complete proposal data
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (Proposal memory proposal);

    /**
     * @notice Get proposal state
     * @param proposalId ID of the proposal
     * @return state Current state
     */
    function getProposalState(uint256 proposalId)
        external
        view
        returns (ProposalState state);

    /**
     * @notice Get vote receipt for a voter
     * @param proposalId ID of the proposal
     * @param voter Address of voter
     * @return receipt Vote receipt
     */
    function getReceipt(uint256 proposalId, address voter)
        external
        view
        returns (Receipt memory receipt);

    /**
     * @notice Get voting power at a specific block (snapshot)
     * @param account Address to check
     * @param blockNumber Block number for snapshot
     * @return votes Voting power at that block
     * @dev Critical for snapshot voting (Fix #7)
     */
    function getVotingPowerAt(address account, uint256 blockNumber)
        external
        view
        returns (uint256 votes);

    /**
     * @notice Get total number of proposals
     * @return count Total proposals
     */
    function getProposalCount() external view returns (uint256 count);

    /**
     * @notice Check if address is blacklisted
     * @param user Address to check
     * @return isBlacklisted True if blacklisted
     */
    function isBlacklisted(address user) external view returns (bool isBlacklisted);

    /**
     * @notice Get required bond amount for proposal type
     * @param proposalType Type of proposal
     * @return bondAmount Required bond in tokens
     */
    function getRequiredBond(ProposalType proposalType)
        external
        view
        returns (uint256 bondAmount);

    /**
     * @notice Get quorum required for proposal
     * @param proposalId ID of the proposal
     * @return quorum Required quorum
     */
    function getQuorum(uint256 proposalId) external view returns (uint256 quorum);

    /**
     * @notice Check if proposal has reached quorum
     * @param proposalId ID of the proposal
     * @return hasQuorum True if quorum reached
     */
    function hasReachedQuorum(uint256 proposalId) external view returns (bool hasQuorum);
}
