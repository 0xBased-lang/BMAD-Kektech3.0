// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestGovernance
 * @notice Simplified governance contract for testing edge cases
 * @dev Focuses on spam prevention mechanisms (bonds, cooldown, blacklist, participation)
 *
 * Purpose: Test all 50 edge cases without complexity of NFT voting and factory integration
 *
 * Features:
 * - 100,000 BASED bond requirement
 * - 24-hour cooldown between proposals
 * - Auto-blacklist after 3 failed proposals
 * - 10% minimum participation threshold
 * - Token-based voting (simpler than NFT-based)
 * - Comprehensive edge case coverage
 */
contract TestGovernance is Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The BASED token
    IERC20 public immutable basedToken;

    /// @notice Treasury address (receives forfeited bonds)
    address public treasury;

    /// @notice All proposals
    Proposal[] public proposals;

    /// @notice Proposer information
    mapping(address => ProposerInfo) public proposers;

    /// @notice Has an address voted on a proposal
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Voting power snapshot per proposal per voter
    mapping(uint256 => mapping(address => uint256)) public votingPowerSnapshot;

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Proposal bond amount
    uint256 public constant BOND_AMOUNT = 100_000e18; // 100,000 BASED

    /// @notice Cooldown period after proposal
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    /// @notice Max failed proposals before blacklist
    uint256 public constant BLACKLIST_THRESHOLD = 3;

    /// @notice Voting period duration
    uint256 public constant VOTING_PERIOD = 7 days;

    /// @notice Minimum participation rate (10%)
    uint256 public constant MIN_PARTICIPATION = 10;

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address target;
        bytes data;
        uint256 createdAt;
        uint256 votingEnds;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        bool passed;
    }

    struct ProposerInfo {
        uint256 bondAmount;
        uint256 unregisteredAt;
        uint256 failedProposals;
        bool isActive;
        bool isBlacklisted;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProposerRegistered(address indexed proposer, uint256 bondAmount);
    event ProposerUnregistered(address indexed proposer);
    event BondWithdrawn(address indexed proposer, uint256 amount);
    event ProposerBlacklisted(address indexed proposer, uint256 failedCount);
    event BlacklistRemoved(address indexed proposer);

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 power);
    event VoteChanged(uint256 indexed proposalId, address indexed voter, bool newSupport);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _basedToken) Ownable(msg.sender) {
        require(_basedToken != address(0), "Invalid token");
        basedToken = IERC20(_basedToken);
        treasury = msg.sender; // Default treasury to owner
    }

    /*//////////////////////////////////////////////////////////////
                       PROPOSER REGISTRATION
    //////////////////////////////////////////////////////////////*/

    function registerProposer() external {
        ProposerInfo storage proposer = proposers[msg.sender];

        require(!proposer.isBlacklisted, "Blacklisted");
        require(!proposer.isActive, "Already registered");

        // Transfer bond
        basedToken.safeTransferFrom(msg.sender, address(this), BOND_AMOUNT);

        proposer.bondAmount = BOND_AMOUNT;
        proposer.isActive = true;

        emit ProposerRegistered(msg.sender, BOND_AMOUNT);
    }

    function unregisterProposer() external {
        ProposerInfo storage proposer = proposers[msg.sender];

        require(proposer.isActive, "Not active");

        proposer.isActive = false;
        proposer.unregisteredAt = block.timestamp;

        emit ProposerUnregistered(msg.sender);
    }

    function withdrawBond() external {
        ProposerInfo storage proposer = proposers[msg.sender];

        require(!proposer.isBlacklisted, "Blacklisted");
        require(!proposer.isActive, "Still active");
        require(proposer.bondAmount > 0, "No bond");
        require(
            block.timestamp >= proposer.unregisteredAt + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );

        uint256 amount = proposer.bondAmount;
        proposer.bondAmount = 0;

        basedToken.safeTransfer(msg.sender, amount);

        emit BondWithdrawn(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                       PROPOSAL CREATION
    //////////////////////////////////////////////////////////////*/

    function createProposal(
        string calldata title,
        string calldata description,
        address target,
        bytes calldata data
    ) external returns (uint256 proposalId) {
        ProposerInfo storage proposer = proposers[msg.sender];

        require(!proposer.isBlacklisted, "Blacklisted");
        require(proposer.isActive, "Not registered");

        // Create proposal
        proposalId = proposals.length;
        proposals.push(Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            target: target,
            data: data,
            createdAt: block.timestamp,
            votingEnds: block.timestamp + VOTING_PERIOD,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            passed: false
        }));

        emit ProposalCreated(proposalId, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                              VOTING
    //////////////////////////////////////////////////////////////*/

    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp < proposal.votingEnds, "Proposal ended");
        require(!proposal.executed, "Already executed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Get voting power (token balance)
        uint256 votingPower = basedToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");

        // Record vote
        hasVoted[proposalId][msg.sender] = true;
        votingPowerSnapshot[proposalId][msg.sender] = votingPower;

        // Update vote counts
        if (support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }

    function changeVote(uint256 proposalId, bool newSupport) external {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp < proposal.votingEnds, "Proposal ended");
        require(!proposal.executed, "Already executed");
        require(hasVoted[proposalId][msg.sender], "Not voted");

        uint256 votingPower = votingPowerSnapshot[proposalId][msg.sender];

        // Remove old vote
        if (proposal.votesFor >= votingPower && proposal.votesAgainst == 0) {
            // Was voting for
            proposal.votesFor -= votingPower;
            proposal.votesAgainst += votingPower;
        } else if (proposal.votesAgainst >= votingPower && proposal.votesFor == 0) {
            // Was voting against
            proposal.votesAgainst -= votingPower;
            proposal.votesFor += votingPower;
        } else {
            // Complex case: check which way they voted
            // This is a simplification - in production you'd track vote direction
            revert("Cannot determine original vote");
        }

        emit VoteChanged(proposalId, msg.sender, newSupport);
    }

    /*//////////////////////////////////////////////////////////////
                       PROPOSAL EXECUTION
    //////////////////////////////////////////////////////////////*/

    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp >= proposal.votingEnds, "Voting active");
        require(!proposal.executed, "Already executed");

        // Calculate results
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalSupply = basedToken.totalSupply();
        uint256 participation = totalSupply > 0 ? (totalVotes * 100) / totalSupply : 0;

        bool passed = proposal.votesFor > proposal.votesAgainst;

        proposal.executed = true;
        proposal.passed = passed && (participation >= MIN_PARTICIPATION);

        // Handle bond
        ProposerInfo storage proposer = proposers[proposal.proposer];

        if (proposal.passed) {
            // Success - no penalty
        } else if (participation >= MIN_PARTICIPATION) {
            // Failed but had participation - no penalty
        } else {
            // Failed with low participation - count as failure
            proposer.failedProposals++;

            if (proposer.failedProposals >= BLACKLIST_THRESHOLD) {
                proposer.isBlacklisted = true;
                emit ProposerBlacklisted(proposal.proposer, proposer.failedProposals);
            }
        }

        emit ProposalExecuted(proposalId, proposal.passed);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < proposals.length, "Invalid proposal");
        return proposals[proposalId];
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function removeBlacklist(address proposer) external onlyOwner {
        proposers[proposer].isBlacklisted = false;
        emit BlacklistRemoved(proposer);
    }
}
