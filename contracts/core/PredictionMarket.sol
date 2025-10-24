// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPredictionMarket.sol";

/**
 * @title PredictionMarket
 * @notice Individual prediction market contract for binary outcomes
 * @dev Implements ALL 9 core security fixes
 *
 * Security Fixes Implemented:
 * - Fix #1: Linear fee formula (NOT parabolic)
 * - Fix #2: Multiply before divide (precision)
 * - Fix #3: Minimum volume or refund
 * - Fix #4: Pull payment pattern
 * - Fix #5: Maximum 2 resolution reversals
 * - Fix #6: Grace period for betting
 * - Fix #7: Creator cannot bet (conflict of interest prevention)
 * - Fix #8: Timelock protection (factory-level governance)
 * - Fix #9: No betting after proposal (front-running prevention)
 */
contract PredictionMarket is IPredictionMarket, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Core configuration
    address public creator;
    address public factory;
    address public resolver;
    address public platformTreasury;
    IERC20 public basedToken;

    string public question;
    uint256 public endTime;
    uint256 public resolutionTime;
    MarketState public state;

    // Betting pools
    Outcome[] public outcomes;
    mapping(address => Bet[]) public userBets;
    uint256 public totalVolume;

    // Resolution tracking
    uint8 public correctOutcomeIndex;
    uint256 public proposedAt;
    uint256 public reversalCount;

    // Fee configuration
    uint256 public baseFeeBps;
    uint256 public platformFeeBps;
    uint256 public creatorFeeBps;
    uint256 public maxAdditionalFeeBps;

    // Pull payment balances (Fix #4)
    uint256 public claimableCreatorFees;
    uint256 public claimablePlatformFees;
    mapping(address => bool) public hasClaimedWinnings;
    mapping(address => bool) public hasClaimedRefund;

    // Constants (CRITICAL SECURITY PARAMETERS)
    uint256 public constant MINIMUM_VOLUME = 10_000e18;     // Fix #3: 10,000 BASED minimum
    uint256 public constant MAX_REVERSALS = 2;              // Fix #5: Maximum 2 reversals
    uint256 public constant GRACE_PERIOD = 5 minutes;       // Fix #6: 5-minute grace period
    uint256 public constant PROPOSAL_DELAY = 48 hours;      // Delay before finalization

    // Events inherited from IPredictionMarket interface

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Ensures market is in ACTIVE state
     */
    modifier onlyActive() {
        require(state == MarketState.ACTIVE, "Market not active");
        _;
    }

    /**
     * @notice Ensures caller is the designated resolver
     */
    modifier onlyResolver() {
        require(msg.sender == resolver, "Only resolver");
        _;
    }

    /**
     * @notice Ensures caller is the market creator
     */
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }

    /**
     * @notice Ensures caller is NOT the market creator (Fix #7)
     * @dev Prevents conflict of interest - creator cannot bet in own market
     */
    modifier notCreator() {
        require(msg.sender != creator, "Creator cannot bet");
        _;
    }

    /**
     * @notice Ensures caller is the factory contract
     */
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    /**
     * @notice Checks if currently in grace period (Fix #6)
     */
    modifier inGracePeriod() {
        require(
            block.timestamp <= endTime + GRACE_PERIOD,
            "Grace period ended"
        );
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize prediction market
     * @param _creator Market creator address
     * @param _resolver Address authorized to resolve market
     * @param _question Market question
     * @param _endTime When betting ends
     * @param _resolutionTime When resolution can occur
     * @param _basedToken BASED token address
     * @param _platformTreasury Platform treasury address
     * @param _baseFeeBps Base fee in basis points
     * @param _platformFeeBps Platform fee in basis points
     * @param _creatorFeeBps Creator fee in basis points
     * @param _maxAdditionalFeeBps Maximum additional fee in basis points
     */
    constructor(
        address _creator,
        address _resolver,
        string memory _question,
        uint256 _endTime,
        uint256 _resolutionTime,
        address _basedToken,
        address _platformTreasury,
        uint256 _baseFeeBps,
        uint256 _platformFeeBps,
        uint256 _creatorFeeBps,
        uint256 _maxAdditionalFeeBps
    ) {
        require(_creator != address(0), "Invalid creator");
        require(_resolver != address(0), "Invalid resolver");
        require(_basedToken != address(0), "Invalid token");
        require(_platformTreasury != address(0), "Invalid treasury");
        require(_endTime > block.timestamp, "End time in past");
        require(_resolutionTime > _endTime, "Resolution time invalid");
        require(bytes(_question).length > 0, "Empty question");

        // Validate fees (Fix #8 cross-parameter validation)
        uint256 maxTotalFees = _baseFeeBps + _platformFeeBps + _creatorFeeBps + _maxAdditionalFeeBps;
        require(maxTotalFees <= 700, "Total fees exceed 7%");

        creator = _creator;
        factory = msg.sender;
        resolver = _resolver;
        question = _question;
        endTime = _endTime;
        resolutionTime = _resolutionTime;
        basedToken = IERC20(_basedToken);
        platformTreasury = _platformTreasury;

        baseFeeBps = _baseFeeBps;
        platformFeeBps = _platformFeeBps;
        creatorFeeBps = _creatorFeeBps;
        maxAdditionalFeeBps = _maxAdditionalFeeBps;

        // Initialize binary outcomes (YES/NO)
        outcomes.push(Outcome({
            outcomeType: OutcomeType.YES,
            totalAmount: 0
        }));
        outcomes.push(Outcome({
            outcomeType: OutcomeType.NO,
            totalAmount: 0
        }));

        state = MarketState.ACTIVE;

        emit MarketCreated(_creator, _question, _endTime, _resolutionTime);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Place a bet on an outcome
     * @param outcomeIndex Index of outcome to bet on (0 = YES, 1 = NO)
     * @param amount Amount of BASED tokens to bet
     * @dev Implements Fix #6 (grace period), Fix #7 (creator cannot bet), Fix #9 (no betting after proposal)
     */
    function placeBet(uint8 outcomeIndex, uint256 amount)
        external
        override
        nonReentrant
        whenNotPaused
        onlyActive
        inGracePeriod
        notCreator
    {
        require(outcomeIndex < outcomes.length, "Invalid outcome");
        require(amount > 0, "Amount must be positive");
        require(proposedAt == 0, "Resolution already proposed"); // Fix #9: Defense-in-depth

        // Transfer tokens from user
        basedToken.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate and collect fees
        uint256 fees = _collectFees(amount);
        uint256 betAmount = amount - fees;

        // Record bet
        _recordBet(msg.sender, outcomeIndex, betAmount);

        // Update outcome totals
        outcomes[outcomeIndex].totalAmount += betAmount;
        totalVolume += amount;

        emit BetPlaced(msg.sender, outcomeIndex, betAmount, fees);
    }

    /**
     * @notice Propose a resolution for the market
     * @param winningOutcome Index of the winning outcome
     * @dev Only resolver can propose, must be after resolutionTime
     */
    function proposeResolution(uint8 winningOutcome)
        external
        override
        onlyResolver
        whenNotPaused
    {
        require(state == MarketState.ACTIVE, "Market not active");
        require(block.timestamp >= resolutionTime, "Too early to resolve");
        require(winningOutcome < outcomes.length, "Invalid outcome");
        require(proposedAt == 0, "Already proposed");

        // Record proposal
        correctOutcomeIndex = winningOutcome;
        proposedAt = block.timestamp;

        emit ResolutionProposed(msg.sender, winningOutcome, block.timestamp);
    }

    /**
     * @notice Finalize the proposed resolution
     * @dev Implements Fix #3 (minimum volume check)
     */
    function finalizeResolution() external override whenNotPaused {
        require(state == MarketState.ACTIVE, "Market not active");
        require(proposedAt > 0, "No proposed resolution");
        require(
            block.timestamp >= proposedAt + PROPOSAL_DELAY,
            "Proposal delay not passed"
        );

        // FIX #3: Minimum volume check - refund if insufficient
        if (totalVolume < MINIMUM_VOLUME) {
            state = MarketState.REFUNDING;
            emit MarketRefunding("Insufficient volume");
            return;
        }

        // Sufficient volume - finalize resolution
        state = MarketState.RESOLVED;
        emit MarketResolved(correctOutcomeIndex, totalVolume, block.timestamp);
    }

    /**
     * @notice Reverse a resolution (max 2 times)
     * @param newOutcome New winning outcome index
     * @dev Implements Fix #5 (maximum 2 reversals)
     */
    function reverseResolution(uint8 newOutcome)
        external
        override
        onlyResolver
        whenNotPaused
    {
        require(state == MarketState.RESOLVED, "Market not resolved");
        require(newOutcome < outcomes.length, "Invalid outcome");
        require(newOutcome != correctOutcomeIndex, "Same as current outcome");

        // FIX #5: Maximum 2 reversals per market
        require(reversalCount < MAX_REVERSALS, "Max reversals reached");

        uint8 previousOutcome = correctOutcomeIndex;
        correctOutcomeIndex = newOutcome;
        reversalCount++;

        emit ResolutionReversed(previousOutcome, newOutcome, reversalCount);
    }

    /**
     * @notice Claim winnings for resolved market
     * @dev Implements Fix #2 (multiply before divide) and Fix #4 (pull payment)
     */
    function claimWinnings() external override nonReentrant whenNotPaused {
        require(state == MarketState.RESOLVED, "Market not resolved");
        require(!hasClaimedWinnings[msg.sender], "Already claimed");

        Bet[] storage bets = userBets[msg.sender];
        uint256 totalWinnings = 0;
        Outcome storage correctOutcome = outcomes[correctOutcomeIndex];

        require(correctOutcome.totalAmount > 0, "No winning bets");

        // Calculate total pool (all bets)
        uint256 totalPool = 0;
        for (uint256 i = 0; i < outcomes.length; i++) {
            totalPool += outcomes[i].totalAmount;
        }

        // Calculate winnings for each bet
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].outcomeIndex == correctOutcomeIndex && !bets[i].claimed) {
                // FIX #2: Multiply before divide (prevents precision loss)
                uint256 winnings = (bets[i].amount * totalPool) / correctOutcome.totalAmount;
                totalWinnings += winnings;
                bets[i].claimed = true;
            }
        }

        require(totalWinnings > 0, "No winnings to claim");

        hasClaimedWinnings[msg.sender] = true;
        basedToken.safeTransfer(msg.sender, totalWinnings);

        emit WinningsClaimed(msg.sender, totalWinnings);
    }

    /**
     * @notice Claim refund for cancelled market
     * @dev Implements Fix #4 (pull payment)
     */
    function claimRefund() external override nonReentrant whenNotPaused {
        require(state == MarketState.REFUNDING, "Market not refunding");
        require(!hasClaimedRefund[msg.sender], "Already claimed refund");

        Bet[] storage bets = userBets[msg.sender];
        uint256 totalRefund = 0;

        // Sum up all unclaimed bets
        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed) {
                totalRefund += bets[i].amount;
                bets[i].claimed = true;
            }
        }

        require(totalRefund > 0, "No refund to claim");

        hasClaimedRefund[msg.sender] = true;
        basedToken.safeTransfer(msg.sender, totalRefund);

        emit RefundClaimed(msg.sender, totalRefund);
    }

    /**
     * @notice Claim accumulated creator fees
     * @dev Implements Fix #4 (pull payment pattern)
     */
    function claimCreatorFees() external override nonReentrant onlyCreator whenNotPaused {
        uint256 amount = claimableCreatorFees;
        require(amount > 0, "No fees to claim");

        claimableCreatorFees = 0;
        basedToken.safeTransfer(creator, amount);

        emit CreatorFeesClaimed(creator, amount);
    }

    /**
     * @notice Claim accumulated platform fees
     * @dev Implements Fix #4 (pull payment pattern)
     */
    function claimPlatformFees() external override nonReentrant onlyFactory whenNotPaused {
        uint256 amount = claimablePlatformFees;
        require(amount > 0, "No fees to claim");

        claimablePlatformFees = 0;
        basedToken.safeTransfer(platformTreasury, amount);

        emit PlatformFeesClaimed(platformTreasury, amount);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Collect fees from a bet amount
     * @param amount Total bet amount
     * @return totalFees Total fees collected
     * @dev Implements Fix #1 (linear fee formula) and Fix #8 (cross-parameter validation)
     */
    function _collectFees(uint256 amount) internal returns (uint256 totalFees) {
        // Calculate additional fee based on current volume (Fix #1: LINEAR formula)
        uint256 volumeInThousands = totalVolume / 1000e18;
        uint256 additionalBps = volumeInThousands;

        // Cap at maximum
        if (additionalBps > maxAdditionalFeeBps) {
            additionalBps = maxAdditionalFeeBps;
        }

        // Cross-parameter validation (Fix #8)
        uint256 totalFeeBps = baseFeeBps + platformFeeBps + creatorFeeBps + additionalBps;
        require(totalFeeBps <= 700, "Total fees exceed 7%");

        // Calculate individual fee amounts
        uint256 baseFee = (amount * baseFeeBps) / 10000;
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 creatorFee = (amount * creatorFeeBps) / 10000;
        uint256 additionalFee = (amount * additionalBps) / 10000;

        // Accumulate fees for pull payment (Fix #4)
        claimablePlatformFees += platformFee + baseFee + additionalFee;
        claimableCreatorFees += creatorFee;

        totalFees = baseFee + platformFee + creatorFee + additionalFee;
        return totalFees;
    }

    /**
     * @notice Record a bet for a user
     * @param user User address
     * @param outcomeIndex Outcome index
     * @param amount Bet amount (after fees)
     */
    function _recordBet(
        address user,
        uint8 outcomeIndex,
        uint256 amount
    ) internal {
        userBets[user].push(
            Bet({
                outcomeIndex: outcomeIndex,
                amount: amount,
                timestamp: block.timestamp,
                claimed: false
            })
        );
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Calculate additional fee based on volume (Fix #1)
     * @dev LINEAR formula: 1,000 BASED = 1 basis point
     */
    function calculateAdditionalFee(
        uint256 _totalVolume,
        uint256 _baseFeeBps,
        uint256 _platformFeeBps,
        uint256 _creatorFeeBps
    ) public pure override returns (uint256 additionalFeeBps) {
        // FIX #1: LINEAR formula (NOT parabolic)
        // 1,000 BASED = 1 basis point additional fee
        uint256 volumeInThousands = _totalVolume / 1000e18;
        additionalFeeBps = volumeInThousands;

        // Cap at maximum (will be validated in actual calculation)
        // This is a view function, so we can't access maxAdditionalFeeBps
        // The actual implementation will cap appropriately

        return additionalFeeBps;
    }

    /**
     * @notice Calculate user's claimable winnings
     */
    function calculateClaimableWinnings(address user) external view override returns (uint256 claimable) {
        if (state != MarketState.RESOLVED) return 0;
        if (hasClaimedWinnings[user]) return 0;

        Bet[] storage bets = userBets[user];
        uint256 totalWinnings = 0;
        Outcome storage correctOutcome = outcomes[correctOutcomeIndex];

        if (correctOutcome.totalAmount == 0) return 0;

        // Calculate total pool (all bets)
        uint256 totalPool = 0;
        for (uint256 i = 0; i < outcomes.length; i++) {
            totalPool += outcomes[i].totalAmount;
        }

        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].outcomeIndex == correctOutcomeIndex && !bets[i].claimed) {
                // FIX #2: Multiply before divide
                uint256 winnings = (bets[i].amount * totalPool) / correctOutcome.totalAmount;
                totalWinnings += winnings;
            }
        }

        return totalWinnings;
    }

    /**
     * @notice Calculate user's claimable refund
     */
    function calculateRefund(address user) external view override returns (uint256 refundable) {
        if (state != MarketState.REFUNDING) return 0;
        if (hasClaimedRefund[user]) return 0;

        Bet[] storage bets = userBets[user];
        uint256 totalRefund = 0;

        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed) {
                totalRefund += bets[i].amount;
            }
        }

        return totalRefund;
    }

    /**
     * @notice Get user's betting history
     */
    function getUserBets(address user) external view override returns (Bet[] memory bets) {
        return userBets[user];
    }

    /**
     * @notice Get outcome details
     */
    function getOutcome(uint8 outcomeIndex) external view override returns (Outcome memory outcome) {
        require(outcomeIndex < outcomes.length, "Invalid outcome");
        return outcomes[outcomeIndex];
    }

    /**
     * @notice Get market state
     */
    function getMarketState() external view override returns (MarketState) {
        return state;
    }

    /**
     * @notice Get total betting volume
     */
    function getTotalVolume() external view override returns (uint256) {
        return totalVolume;
    }

    /**
     * @notice Check if grace period is active (Fix #6)
     */
    function isInGracePeriod() external view override returns (bool) {
        return block.timestamp <= endTime + GRACE_PERIOD;
    }
}
