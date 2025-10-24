// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGovernance
 * @notice Interface for the DAO governance system with spam prevention
 * @dev Implements Fix #7: Comprehensive spam prevention with bonds, cooldowns, and blacklisting
 */
interface IGovernance {
    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    enum ProposalState {
        PENDING,      // Proposal created, voting active
        APPROVED,     // Voting passed, awaiting execution
        REJECTED,     // Voting failed
        EXECUTED,     // Proposal executed
        CANCELED      // Proposal canceled
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Proposal {
        uint256 id;
        address proposer;
        string question;
        string description;
        string category;
        uint256 createdAt;
        uint256 votingEnds;
        uint256 votesFor;
        uint256 votesAgainst;
        ProposalState state;
        bool executed;
    }

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string question,
        uint256 bondAmount
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        ProposalState state,
        uint256 votesFor,
        uint256 votesAgainst
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed marketAddress
    );

    event BondRefunded(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount
    );

    event BondForfeited(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount
    );

    event ProposerBlacklisted(
        address indexed proposer,
        uint256 failedProposals
    );

    event CooldownStarted(
        address indexed proposer,
        uint256 cooldownUntil
    );

    /*//////////////////////////////////////////////////////////////
                             CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new governance proposal
     * @dev Fix #7: Requires 100K BASED bond, checks cooldown and blacklist
     * @param question The market question
     * @param description Detailed description
     * @param category Market category
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        string calldata question,
        string calldata description,
        string calldata category
    ) external returns (uint256 proposalId);

    /**
     * @notice Vote on a proposal
     * @dev Voting power determined by staked NFTs
     * @param proposalId The proposal to vote on
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external;

    /**
     * @notice Finalize a proposal after voting period ends
     * @dev Determines approval/rejection and handles bonds
     * @param proposalId The proposal to finalize
     */
    function finalizeProposal(uint256 proposalId) external;

    /**
     * @notice Execute an approved proposal
     * @dev Creates the market through the factory
     * @param proposalId The proposal to execute
     * @return marketAddress The address of the created market
     */
    function executeProposal(uint256 proposalId) external returns (address marketAddress);

    /*//////////////////////////////////////////////////////////////
                         SPAM PREVENTION (FIX #7)
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if an address is blacklisted
     * @param proposer The address to check
     * @return isBlacklisted True if blacklisted
     */
    function isBlacklisted(address proposer) external view returns (bool);

    /**
     * @notice Get cooldown end time for a proposer
     * @param proposer The address to check
     * @return cooldownEnd Timestamp when cooldown ends (0 if no cooldown)
     */
    function getCooldownEnd(address proposer) external view returns (uint256);

    /**
     * @notice Get failed proposal count for a proposer
     * @param proposer The address to check
     * @return failedCount Number of failed proposals
     */
    function getFailedProposalCount(address proposer) external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get proposal details
     * @param proposalId The proposal ID
     * @return proposal The proposal struct
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    /**
     * @notice Get current proposal count
     * @return count Total number of proposals
     */
    function proposalCount() external view returns (uint256);

    /**
     * @notice Check if an address has voted on a proposal
     * @param proposalId The proposal ID
     * @param voter The voter address
     * @return hasVoted True if already voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);

    /**
     * @notice Get voting power for an address
     * @param voter The voter address
     * @return votingPower The calculated voting power based on staked NFTs
     */
    function getVotingPower(address voter) external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Proposal bond amount (Fix #7)
     */
    function PROPOSAL_BOND() external view returns (uint256);

    /**
     * @notice Cooldown period after rejection (Fix #7)
     */
    function PROPOSAL_COOLDOWN() external view returns (uint256);

    /**
     * @notice Max failed proposals before blacklist (Fix #7)
     */
    function MAX_FAILED_PROPOSALS() external view returns (uint256);

    /**
     * @notice Voting period duration
     */
    function VOTING_PERIOD() external view returns (uint256);

    /**
     * @notice Minimum participation rate for valid proposal
     */
    function MIN_PARTICIPATION_RATE() external view returns (uint256);
}
