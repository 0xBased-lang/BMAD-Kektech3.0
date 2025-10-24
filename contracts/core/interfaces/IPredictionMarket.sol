// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarket
 * @notice Interface for individual prediction market contracts
 * @dev Defines the complete API for binary outcome prediction markets
 */
interface IPredictionMarket {
    // ============================================
    // ENUMS
    // ============================================

    /**
     * @notice Market lifecycle states
     * @dev State machine: CREATED → ACTIVE → RESOLVED/REFUNDING
     */
    enum MarketState {
        CREATED,    // Market created but not yet active
        ACTIVE,     // Accepting bets
        RESOLVED,   // Outcome determined, claims available
        REFUNDING,  // Market cancelled, refunds available
        FINALIZED   // All claims/refunds processed
    }

    /**
     * @notice Outcome types for binary markets
     */
    enum OutcomeType {
        YES,    // Positive outcome
        NO      // Negative outcome
    }

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Represents a single outcome option
     * @param outcomeType The type of outcome (YES or NO)
     * @param totalAmount Total amount bet on this outcome
     */
    struct Outcome {
        OutcomeType outcomeType;
        uint256 totalAmount;
    }

    /**
     * @notice Represents a user's bet
     * @param outcomeIndex Index of the outcome bet on
     * @param amount Amount of tokens bet
     * @param timestamp When the bet was placed
     * @param claimed Whether winnings have been claimed
     */
    struct Bet {
        uint8 outcomeIndex;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new market is created
     * @param creator Address that created the market
     * @param question Market question
     * @param endTime When betting ends
     * @param resolutionTime When resolution occurs
     */
    event MarketCreated(
        address indexed creator,
        string question,
        uint256 endTime,
        uint256 resolutionTime
    );

    /**
     * @notice Emitted when a bet is placed
     * @param user Address placing the bet
     * @param outcomeIndex Outcome bet on
     * @param amount Bet amount (after fees)
     * @param fees Fees collected
     */
    event BetPlaced(
        address indexed user,
        uint8 outcomeIndex,
        uint256 amount,
        uint256 fees
    );

    /**
     * @notice Emitted when market resolution is proposed
     * @param resolver Address proposing resolution
     * @param winningOutcome The proposed winning outcome
     * @param timestamp When proposal was made
     */
    event ResolutionProposed(
        address indexed resolver,
        uint8 winningOutcome,
        uint256 timestamp
    );

    /**
     * @notice Emitted when market resolution is finalized
     * @param winningOutcome The final winning outcome
     * @param totalVolume Total betting volume
     * @param timestamp When finalized
     */
    event MarketResolved(
        uint8 winningOutcome,
        uint256 totalVolume,
        uint256 timestamp
    );

    /**
     * @notice Emitted when resolution is reversed
     * @param previousOutcome The previous winning outcome
     * @param newOutcome The new winning outcome
     * @param reversalCount Current number of reversals
     */
    event ResolutionReversed(
        uint8 previousOutcome,
        uint8 newOutcome,
        uint256 reversalCount
    );

    /**
     * @notice Emitted when market enters refunding state
     * @param reason Reason for refund
     */
    event MarketRefunding(string reason);

    /**
     * @notice Emitted when winnings are claimed
     * @param user Address claiming winnings
     * @param amount Amount claimed
     */
    event WinningsClaimed(address indexed user, uint256 amount);

    /**
     * @notice Emitted when refund is claimed
     * @param user Address claiming refund
     * @param amount Amount refunded
     */
    event RefundClaimed(address indexed user, uint256 amount);

    /**
     * @notice Emitted when creator fees are claimed
     * @param creator Address claiming fees
     * @param amount Amount claimed
     */
    event CreatorFeesClaimed(address indexed creator, uint256 amount);

    /**
     * @notice Emitted when platform fees are claimed
     * @param treasury Address claiming fees
     * @param amount Amount claimed
     */
    event PlatformFeesClaimed(address indexed treasury, uint256 amount);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Place a bet on an outcome
     * @param outcomeIndex Index of outcome to bet on (0 = YES, 1 = NO)
     * @param amount Amount of tokens to bet
     */
    function placeBet(uint8 outcomeIndex, uint256 amount) external;

    /**
     * @notice Propose a resolution for the market
     * @param winningOutcome Index of the winning outcome
     * @dev Can only be called by designated resolver after resolutionTime
     */
    function proposeResolution(uint8 winningOutcome) external;

    /**
     * @notice Finalize the proposed resolution
     * @dev Can only be called after proposal delay period
     */
    function finalizeResolution() external;

    /**
     * @notice Reverse a resolution (max 2 times)
     * @param newOutcome New winning outcome
     * @dev Critical security feature to fix incorrect resolutions
     */
    function reverseResolution(uint8 newOutcome) external;

    /**
     * @notice Claim winnings for resolved market
     * @dev Implements pull payment pattern (Fix #4)
     */
    function claimWinnings() external;

    /**
     * @notice Claim refund for cancelled market
     * @dev Returns original bet amounts
     */
    function claimRefund() external;

    /**
     * @notice Claim accumulated creator fees
     * @dev Pull payment pattern for fee distribution
     */
    function claimCreatorFees() external;

    /**
     * @notice Claim accumulated platform fees
     * @dev Only callable by platform treasury
     */
    function claimPlatformFees() external;

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Calculate additional fee based on volume (Fix #1)
     * @param totalVolume Current total betting volume
     * @param baseFeeBps Base fee in basis points
     * @param platformFeeBps Platform fee in basis points
     * @param creatorFeeBps Creator fee in basis points
     * @return additionalFeeBps Additional fee in basis points
     */
    function calculateAdditionalFee(
        uint256 totalVolume,
        uint256 baseFeeBps,
        uint256 platformFeeBps,
        uint256 creatorFeeBps
    ) external pure returns (uint256 additionalFeeBps);

    /**
     * @notice Calculate user's claimable winnings
     * @param user Address to check
     * @return claimable Amount of tokens claimable
     */
    function calculateClaimableWinnings(address user) external view returns (uint256 claimable);

    /**
     * @notice Calculate user's claimable refund
     * @param user Address to check
     * @return refundable Amount of tokens refundable
     */
    function calculateRefund(address user) external view returns (uint256 refundable);

    /**
     * @notice Get user's betting history
     * @param user Address to query
     * @return bets Array of user's bets
     */
    function getUserBets(address user) external view returns (Bet[] memory bets);

    /**
     * @notice Get outcome details
     * @param outcomeIndex Index of outcome
     * @return outcome Outcome struct
     */
    function getOutcome(uint8 outcomeIndex) external view returns (Outcome memory outcome);

    /**
     * @notice Get market state
     * @return Current market state
     */
    function getMarketState() external view returns (MarketState);

    /**
     * @notice Get total betting volume
     * @return Total volume in tokens
     */
    function getTotalVolume() external view returns (uint256);

    /**
     * @notice Check if grace period is active (Fix #6)
     * @return True if within grace period
     */
    function isInGracePeriod() external view returns (bool);
}
