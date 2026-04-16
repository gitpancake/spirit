// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AbrahamCovenant} from "./AbrahamCovenant.sol";

/**
 * @title DailyAuction
 * @author Eden Platform
 * @notice Daily English auction contract for AbrahamCovenant NFTs
 * @dev Implements 24-hour auctions with automatic settlement and secure bid handling
 */
contract DailyAuction is Ownable, ReentrancyGuard, Pausable {
    // ============ Events ============

    event AuctionStarted(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        uint256 startTime,
        uint256 endTime,
        uint256 minBid
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );
    event AuctionSettled(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid
    );
    event AuctionCanceled(uint256 indexed auctionId, uint256 indexed tokenId);
    event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event MinBidUpdated(uint256 previousMinBid, uint256 newMinBid);
    event AuctionDurationUpdated(uint256 previousDuration, uint256 newDuration);
    event PayoutAddressUpdated(address previousAddress, address newAddress);
    event PayoutWithdrawn(address indexed recipient, uint256 amount);

    // ============ Errors ============

    error InvalidNFTContract();
    error InvalidPayoutAddress();
    error InvalidMinBid();
    error InvalidDuration();
    error AuctionNotActive(uint256 auctionId);
    error AuctionNotEnded(uint256 auctionId);
    error AuctionEnded(uint256 auctionId);
    error BidTooLow(uint256 required, uint256 provided);
    error BidIncrementTooLow(uint256 required, uint256 provided);
    error NoBids(uint256 auctionId);
    error RefundFailed(address bidder, uint256 amount);
    error WithdrawalFailed(address recipient, uint256 amount);
    error NoFundsToWithdraw();
    error AuctionAlreadySettled(uint256 auctionId);
    error UnauthorizedTokenId(uint256 tokenId);

    // ============ Structs ============

    struct Auction {
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint256 minBid;
        address highestBidder;
        uint256 highestBid;
        bool settled;
        mapping(address => uint256) bids;
        address[] bidders;
    }

    // ============ State Variables ============

    /// @notice AbrahamCovenant NFT contract instance
    AbrahamCovenant public immutable nftContract;

    /// @notice Current auction ID counter
    uint256 private _auctionIdCounter = 1;

    /// @notice Default minimum bid for new auctions
    uint256 public defaultMinBid;

    /// @notice Default auction duration (24 hours = 86400 seconds)
    uint256 public auctionDuration;

    /// @notice Minimum bid increment percentage (500 = 5%)
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;

    /// @notice Address to receive auction proceeds
    address public payoutAddress;

    /// @notice Mapping of auction ID to auction data
    mapping(uint256 => Auction) public auctions;

    /// @notice Mapping of token ID to active auction ID (0 if none)
    mapping(uint256 => uint256) public tokenToAuction;

    /// @notice Current active auction ID (0 if none)
    uint256 public currentAuctionId;

    // ============ Constructor ============

    /**
     * @notice Initializes the DailyAuction contract
     * @param _nftContract Address of the AbrahamCovenant contract
     * @param _owner Address that will own this contract
     * @param _payoutAddress Address to receive auction proceeds
     * @param _defaultMinBid Default minimum bid for auctions
     * @param _auctionDuration Duration of each auction in seconds
     */
    constructor(
        address _nftContract,
        address _owner,
        address _payoutAddress,
        uint256 _defaultMinBid,
        uint256 _auctionDuration
    ) Ownable(_owner) {
        if (_nftContract == address(0)) revert InvalidNFTContract();
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_defaultMinBid == 0) revert InvalidMinBid();
        if (_auctionDuration == 0) revert InvalidDuration();

        nftContract = AbrahamCovenant(_nftContract);
        payoutAddress = _payoutAddress;
        defaultMinBid = _defaultMinBid;
        auctionDuration = _auctionDuration;

        emit PayoutAddressUpdated(address(0), _payoutAddress);
        emit MinBidUpdated(0, _defaultMinBid);
        emit AuctionDurationUpdated(0, _auctionDuration);
    }

    // ============ External Functions - Auction Management ============

    /**
     * @notice Start a new auction for the next available token
     * @dev Can only be called by owner when no auction is active
     * @param minBid Minimum bid for this auction (0 to use default)
     * @return auctionId The ID of the created auction
     */
    function startAuction(uint256 minBid) external onlyOwner whenNotPaused returns (uint256) {
        if (currentAuctionId != 0) {
            revert AuctionNotEnded(currentAuctionId);
        }

        // Get next token ID to mint
        uint256 tokenId = nftContract.nextTokenId();
        if (nftContract.isMaxSupplyReached()) {
            revert UnauthorizedTokenId(tokenId);
        }

        uint256 auctionId = _auctionIdCounter;
        unchecked {
            _auctionIdCounter = auctionId + 1;
        }

        uint256 actualMinBid = minBid > 0 ? minBid : defaultMinBid;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + auctionDuration;

        Auction storage auction = auctions[auctionId];
        auction.tokenId = tokenId;
        auction.startTime = startTime;
        auction.endTime = endTime;
        auction.minBid = actualMinBid;
        auction.settled = false;

        tokenToAuction[tokenId] = auctionId;
        currentAuctionId = auctionId;

        emit AuctionStarted(auctionId, tokenId, startTime, endTime, actualMinBid);

        return auctionId;
    }

    /**
     * @notice Place a bid on the current auction
     * @dev Refunds previous bid if not highest bidder
     */
    function placeBid() external payable nonReentrant whenNotPaused {
        uint256 auctionId = currentAuctionId;
        if (auctionId == 0) revert AuctionNotActive(0);

        Auction storage auction = auctions[auctionId];

        if (block.timestamp >= auction.endTime) {
            revert AuctionEnded(auctionId);
        }
        if (auction.settled) {
            revert AuctionAlreadySettled(auctionId);
        }

        uint256 bidAmount = msg.value;

        // Check minimum bid
        if (bidAmount < auction.minBid) {
            revert BidTooLow(auction.minBid, bidAmount);
        }

        // Check bid increment
        if (auction.highestBidder != address(0)) {
            uint256 minIncrement = auction.highestBid +
                (auction.highestBid * MIN_BID_INCREMENT_BPS) /
                10000;
            if (bidAmount < minIncrement) {
                revert BidIncrementTooLow(minIncrement, bidAmount);
            }

            // Refund previous highest bidder
            address previousBidder = auction.highestBidder;
            uint256 previousBid = auction.highestBid;

            (bool success, ) = payable(previousBidder).call{value: previousBid}("");
            if (!success) {
                revert RefundFailed(previousBidder, previousBid);
            }

            emit BidRefunded(auctionId, previousBidder, previousBid);
        }

        // Update bid tracking
        if (auction.bids[msg.sender] == 0) {
            auction.bidders.push(msg.sender);
        }
        auction.bids[msg.sender] = bidAmount;

        // Update highest bid
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        emit BidPlaced(auctionId, msg.sender, bidAmount, block.timestamp);
    }

    /**
     * @notice Settle the current auction and mint NFT to winner
     * @dev Can be called by anyone after auction ends
     */
    function settleAuction() external nonReentrant {
        uint256 auctionId = currentAuctionId;
        if (auctionId == 0) revert AuctionNotActive(0);

        Auction storage auction = auctions[auctionId];

        if (block.timestamp < auction.endTime) {
            revert AuctionNotEnded(auctionId);
        }
        if (auction.settled) {
            revert AuctionAlreadySettled(auctionId);
        }

        auction.settled = true;
        currentAuctionId = 0;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT from covenant to winner
            uint256 tokenId = auction.tokenId;
            try nftContract.transferFrom(address(nftContract), auction.highestBidder, tokenId) {
                emit AuctionSettled(auctionId, tokenId, auction.highestBidder, auction.highestBid);
            } catch {
                // If transfer fails, refund the winner
                (bool success, ) = payable(auction.highestBidder).call{value: auction.highestBid}(
                    ""
                );
                if (!success) {
                    revert RefundFailed(auction.highestBidder, auction.highestBid);
                }
                emit BidRefunded(auctionId, auction.highestBidder, auction.highestBid);
            }
        } else {
            // No bids, auction failed
            emit AuctionCanceled(auctionId, auction.tokenId);
        }

        tokenToAuction[auction.tokenId] = 0;
    }

    /**
     * @notice Cancel current auction (emergency only)
     * @dev Refunds all bidders, can only be called by owner
     */
    function cancelAuction() external onlyOwner nonReentrant {
        uint256 auctionId = currentAuctionId;
        if (auctionId == 0) revert AuctionNotActive(0);

        Auction storage auction = auctions[auctionId];
        if (auction.settled) {
            revert AuctionAlreadySettled(auctionId);
        }

        auction.settled = true;
        currentAuctionId = 0;

        // Refund highest bidder if any
        if (auction.highestBidder != address(0)) {
            (bool success, ) = payable(auction.highestBidder).call{value: auction.highestBid}("");
            if (!success) {
                revert RefundFailed(auction.highestBidder, auction.highestBid);
            }
            emit BidRefunded(auctionId, auction.highestBidder, auction.highestBid);
        }

        tokenToAuction[auction.tokenId] = 0;
        emit AuctionCanceled(auctionId, auction.tokenId);
    }

    // ============ External Functions - Owner Only ============

    /**
     * @notice Update the default minimum bid
     * @param newMinBid New default minimum bid
     */
    function updateDefaultMinBid(uint256 newMinBid) external onlyOwner {
        if (newMinBid == 0) revert InvalidMinBid();

        uint256 previousMinBid = defaultMinBid;
        defaultMinBid = newMinBid;

        emit MinBidUpdated(previousMinBid, newMinBid);
    }

    /**
     * @notice Update the auction duration
     * @param newDuration New auction duration in seconds
     */
    function updateAuctionDuration(uint256 newDuration) external onlyOwner {
        if (newDuration == 0) revert InvalidDuration();

        uint256 previousDuration = auctionDuration;
        auctionDuration = newDuration;

        emit AuctionDurationUpdated(previousDuration, newDuration);
    }

    /**
     * @notice Update the payout address
     * @param newPayoutAddress New address to receive auction proceeds
     */
    function updatePayoutAddress(address newPayoutAddress) external onlyOwner {
        if (newPayoutAddress == address(0)) revert InvalidPayoutAddress();

        address previousAddress = payoutAddress;
        payoutAddress = newPayoutAddress;

        emit PayoutAddressUpdated(previousAddress, newPayoutAddress);
    }

    /**
     * @notice Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw contract balance to payout address
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        (bool success, ) = payable(payoutAddress).call{value: balance}("");
        if (!success) revert WithdrawalFailed(payoutAddress, balance);

        emit PayoutWithdrawn(payoutAddress, balance);
    }

    // ============ External View Functions ============

    /**
     * @notice Get current auction information
     * @return auctionId Current auction ID (0 if none)
     * @return tokenId Token ID being auctioned
     * @return startTime Auction start time
     * @return endTime Auction end time
     * @return minBid Minimum bid amount
     * @return highestBidder Current highest bidder
     * @return highestBid Current highest bid
     * @return settled Whether auction is settled
     */
    function getCurrentAuction()
        external
        view
        returns (
            uint256 auctionId,
            uint256 tokenId,
            uint256 startTime,
            uint256 endTime,
            uint256 minBid,
            address highestBidder,
            uint256 highestBid,
            bool settled
        )
    {
        auctionId = currentAuctionId;
        if (auctionId == 0) {
            return (0, 0, 0, 0, 0, address(0), 0, false);
        }

        Auction storage auction = auctions[auctionId];
        return (
            auctionId,
            auction.tokenId,
            auction.startTime,
            auction.endTime,
            auction.minBid,
            auction.highestBidder,
            auction.highestBid,
            auction.settled
        );
    }

    /**
     * @notice Check if current auction is active (running and not settled)
     * @return True if auction is active
     */
    function isAuctionActive() external view returns (bool) {
        if (currentAuctionId == 0) return false;

        Auction storage auction = auctions[currentAuctionId];
        return !auction.settled && block.timestamp < auction.endTime;
    }

    /**
     * @notice Get time remaining in current auction
     * @return Time remaining in seconds (0 if auction ended or no auction)
     */
    function getTimeRemaining() external view returns (uint256) {
        if (currentAuctionId == 0) return 0;

        Auction storage auction = auctions[currentAuctionId];
        if (block.timestamp >= auction.endTime) return 0;

        return auction.endTime - block.timestamp;
    }

    // ============ Receive Functions ============

    /**
     * @notice Prevent accidental ETH sends
     */
    receive() external payable {
        revert("Use placeBid() function");
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Use placeBid() function");
    }
}
