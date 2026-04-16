import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AbrahamAuction, AbrahamCovenant } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AbrahamAuction", function () {
  let auction: AbrahamAuction;
  let covenant: AbrahamCovenant;
  let owner: SignerWithAddress;
  let payoutAddress: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let bidder3: SignerWithAddress;

  const AUCTION_DURATION = 3600; // 1 hour
  const MIN_BID = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, payoutAddress, bidder1, bidder2, bidder3] = await ethers.getSigners();

    // Deploy AbrahamCovenant first
    const CovenantFactory = await ethers.getContractFactory("AbrahamCovenant");
    covenant = (await CovenantFactory.deploy(
      "Abraham Covenant",
      "ABRAHAM",
      owner.address,
      owner.address, // abraham (recipient)
      20, // maxSupply
      6, // daysOfWork
    )) as unknown as AbrahamCovenant;
    await covenant.waitForDeployment();

    // Deploy AbrahamAuction
    const AuctionFactory = await ethers.getContractFactory("AbrahamAuction");
    auction = (await AuctionFactory.deploy(
      await covenant.getAddress(),
      owner.address,
      payoutAddress.address,
    )) as unknown as AbrahamAuction;
    await auction.waitForDeployment();

    // Start the covenant (use block.timestamp for immediate start)
    const startTime = await time.latest();
    await covenant.connect(owner).startCovenant(startTime);

    // Mint some NFTs by committing daily work (owner is abraham)
    // Note: Contract uses 60-second intervals, so we advance time before each commit (except first)
    for (let i = 0; i < 6; i++) {
      if (i > 0) {
        // Advance time by 60 seconds to move to next interval
        await time.increase(60);
      }
      await covenant.connect(owner).commitDailyWork(`ipfs://token${i}.json`);
    }

    // Set auction contract as sales mechanic and approve it to transfer NFTs
    await covenant.connect(owner).updateSalesMechanic(await auction.getAddress());
    await covenant.connect(owner).setMechanicOperator(true);
  });

  describe("Deployment", function () {
    it("Should set the correct NFT contract", async function () {
      expect(await auction.nftContract()).to.equal(await covenant.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });

    it("Should set the correct payout address", async function () {
      expect(await auction.payoutAddress()).to.equal(payoutAddress.address);
    });

    it("Should set correct initial values", async function () {
      expect(await auction.extensionWindow()).to.equal(300); // 5 minutes
      expect(await auction.extensionDuration()).to.equal(300); // 5 minutes
    });
  });

  describe("Auction Creation", function () {
    it("Should create an auction successfully", async function () {
      const startTime = 0; // Starts immediately
      const tx = await auction
        .connect(owner)
        .createAuction(0, startTime, AUCTION_DURATION, ethers.parseEther("1"));

      const timestamp = await time.latest();
      await expect(tx)
        .to.emit(auction, "AuctionCreated")
        .withArgs(1, 0, timestamp, timestamp + AUCTION_DURATION, ethers.parseEther("1"));

      const auctionData = await auction.getAuction(1);
      expect(auctionData.tokenId).to.equal(0);
      expect(auctionData.exists).to.be.true;
    });

    it("Should create multiple auctions in batch", async function () {
      const startTime = 0;
      // Note: Tokens 0-5 exist from beforeEach setup
      const tx = await auction
        .connect(owner)
        .batchCreateAuctions([1, 2, 3], startTime, AUCTION_DURATION, ethers.parseEther("1"));

      await expect(tx).to.emit(auction, "BatchAuctionsCreated");

      expect(await auction.tokenToAuction(1)).to.equal(1);
      expect(await auction.tokenToAuction(2)).to.equal(2);
      expect(await auction.tokenToAuction(3)).to.equal(3);
    });

    it("Should revert if not owner", async function () {
      await expect(
        auction.connect(bidder1).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });

    it("Should revert if token already has auction", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("1"));

      await expect(
        auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(auction, "AuctionAlreadyExists");
    });

    it("Should revert for non-existent token", async function () {
      // Token 999 doesn't exist (only 0-5 were minted)
      // ownerOf will revert with ERC721NonexistentToken from OpenZeppelin
      await expect(
        auction.connect(owner).createAuction(999, 0, AUCTION_DURATION, ethers.parseEther("1")),
      ).to.be.reverted;
    });

    it("Should revert for non-existent token in batch", async function () {
      // Try to create auctions for mix of valid and invalid tokens
      // ownerOf will revert with ERC721NonexistentToken from OpenZeppelin
      await expect(
        auction
          .connect(owner)
          .batchCreateAuctions([1, 999, 2], 0, AUCTION_DURATION, ethers.parseEther("1")),
      ).to.be.reverted;
    });
  });

  describe("Automatic Refunds", function () {
    beforeEach(async function () {
      // Create an auction
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
    });

    it("Should automatically refund previous bidder when outbid (EOA)", async function () {
      // Bidder1 places first bid
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });

      const bidder1BalanceBefore = await ethers.provider.getBalance(bidder1.address);

      // Bidder2 outbids
      const tx = await auction.connect(bidder2).bid(1, { value: ethers.parseEther("0.7") });

      // Check that BidRefunded event was emitted
      await expect(tx)
        .to.emit(auction, "BidRefunded")
        .withArgs(1, bidder1.address, ethers.parseEther("0.6"));

      // Bidder1 should have received refund automatically
      const bidder1BalanceAfter = await ethers.provider.getBalance(bidder1.address);
      expect(bidder1BalanceAfter - bidder1BalanceBefore).to.equal(ethers.parseEther("0.6"));

      // Bidder1 should have no pending withdrawals
      expect(await auction.pendingWithdrawals(bidder1.address)).to.equal(0);
    });

    it("Should handle multiple refunds in succession", async function () {
      // Bidder1 bids
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });

      const bidder1BalanceBefore = await ethers.provider.getBalance(bidder1.address);

      // Bidder2 outbids
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("0.7") });

      const bidder2BalanceBefore = await ethers.provider.getBalance(bidder2.address);

      // Bidder3 outbids
      await auction.connect(bidder3).bid(1, { value: ethers.parseEther("0.8") });

      // Both should have received automatic refunds
      expect((await ethers.provider.getBalance(bidder1.address)) - bidder1BalanceBefore).to.equal(
        ethers.parseEther("0.6"),
      );
      expect((await ethers.provider.getBalance(bidder2.address)) - bidder2BalanceBefore).to.equal(
        ethers.parseEther("0.7"),
      );

      // Neither should have pending withdrawals
      expect(await auction.pendingWithdrawals(bidder1.address)).to.equal(0);
      expect(await auction.pendingWithdrawals(bidder2.address)).to.equal(0);
    });

    it("Should fallback to withdrawal pattern if refund fails", async function () {
      // Deploy a contract that rejects ETH
      const RejectETHFactory = await ethers.getContractFactory("RejectETH");
      const rejectETH = await RejectETHFactory.deploy();
      await rejectETH.waitForDeployment();

      // Have the reject contract place a bid
      await rejectETH.placeBid(await auction.getAddress(), 1, { value: ethers.parseEther("0.6") });

      // Bidder1 outbids - automatic refund should fail
      const tx = await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.7") });

      // Check that BidRefundFailed event was emitted
      await expect(tx)
        .to.emit(auction, "BidRefundFailed")
        .withArgs(1, await rejectETH.getAddress(), ethers.parseEther("0.6"));

      // Contract should have pending withdrawal
      expect(await auction.pendingWithdrawals(await rejectETH.getAddress())).to.equal(
        ethers.parseEther("0.6"),
      );

      // Contract can manually withdraw
      await rejectETH.withdrawFrom(await auction.getAddress());
      expect(await auction.pendingWithdrawals(await rejectETH.getAddress())).to.equal(0);
    });
  });

  describe("Bid History", function () {
    beforeEach(async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
    });

    it("Should record all bids in history", async function () {
      // Place multiple bids
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("0.7") });
      await auction.connect(bidder3).bid(1, { value: ethers.parseEther("0.8") });

      // Check history length
      expect(await auction.getBidHistoryLength(1)).to.equal(3);

      // Get all bids
      const history = await auction.getBidHistory(1, 0, 3);
      expect(history.length).to.equal(3);
      expect(history[0].bidder).to.equal(bidder1.address);
      expect(history[0].amount).to.equal(ethers.parseEther("0.6"));
      expect(history[1].bidder).to.equal(bidder2.address);
      expect(history[1].amount).to.equal(ethers.parseEther("0.7"));
      expect(history[2].bidder).to.equal(bidder3.address);
      expect(history[2].amount).to.equal(ethers.parseEther("0.8"));
    });

    it("Should emit BidHistoryUpdated event", async function () {
      const tx = await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });
      const timestamp = await time.latest();

      await expect(tx)
        .to.emit(auction, "BidHistoryUpdated")
        .withArgs(1, bidder1.address, ethers.parseEther("0.6"), timestamp);
    });

    it("Should get recent bid history", async function () {
      // Place 5 bids
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("0.7") });
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.8") });
      await auction.connect(bidder3).bid(1, { value: ethers.parseEther("0.9") });
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("1.0") });

      // Get last 3 bids
      const recent = await auction.getRecentBidHistory(1, 3);
      expect(recent.length).to.equal(3);
      expect(recent[0].amount).to.equal(ethers.parseEther("0.8"));
      expect(recent[1].amount).to.equal(ethers.parseEther("0.9"));
      expect(recent[2].amount).to.equal(ethers.parseEther("1.0"));
    });

    it("Should get bid history for multiple auctions in batch", async function () {
      // Create second auction (token 1 instead of token 0)
      await auction.connect(owner).createAuction(1, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // Bid on both auctions
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });
      await auction.connect(bidder2).bid(2, { value: ethers.parseEther("0.7") });

      // Get batch history
      const histories = await auction.getRecentBidHistoryBatch([1, 2], 10);
      expect(histories.length).to.equal(2);
      expect(histories[0].length).to.equal(1);
      expect(histories[0][0].amount).to.equal(ethers.parseEther("0.6"));
      expect(histories[1].length).to.equal(1);
      expect(histories[1][0].amount).to.equal(ethers.parseEther("0.7"));
    });
  });

  describe("Owner Emergency Withdrawal", function () {
    let rejectETHAddress: string;

    beforeEach(async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // Deploy contract that rejects ETH
      const RejectETHFactory = await ethers.getContractFactory("RejectETH");
      const rejectETH = await RejectETHFactory.deploy();
      await rejectETH.waitForDeployment();
      rejectETHAddress = await rejectETH.getAddress();

      // Have reject contract bid and get outbid
      await rejectETH.placeBid(await auction.getAddress(), 1, { value: ethers.parseEther("0.6") });
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.7") });

      // Contract should have pending withdrawal
      expect(await auction.pendingWithdrawals(rejectETHAddress)).to.equal(ethers.parseEther("0.6"));
    });

    it("Should allow owner to withdraw for user when paused", async function () {
      // Pause contract
      await auction.connect(owner).pause();

      const payoutBalanceBefore = await ethers.provider.getBalance(payoutAddress.address);

      // Owner withdraws for contract
      const tx = await auction.connect(owner).ownerWithdrawFor(rejectETHAddress);

      await expect(tx)
        .to.emit(auction, "OwnerWithdrewFor")
        .withArgs(rejectETHAddress, payoutAddress.address, ethers.parseEther("0.6"));

      // Payout address should have received funds
      const payoutBalanceAfter = await ethers.provider.getBalance(payoutAddress.address);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(ethers.parseEther("0.6"));

      // Contract should have no pending withdrawal
      expect(await auction.pendingWithdrawals(rejectETHAddress)).to.equal(0);
    });

    it("Should revert if not paused", async function () {
      await expect(
        auction.connect(owner).ownerWithdrawFor(rejectETHAddress),
      ).to.be.revertedWithCustomError(auction, "ExpectedPause");
    });

    it("Should revert if not owner", async function () {
      await auction.connect(owner).pause();

      await expect(
        auction.connect(bidder1).ownerWithdrawFor(rejectETHAddress),
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });

    it("Should revert if no funds to withdraw", async function () {
      await auction.connect(owner).pause();

      await expect(
        auction.connect(owner).ownerWithdrawFor(bidder1.address),
      ).to.be.revertedWithCustomError(auction, "NoFundsToWithdraw");
    });
  });

  describe("Settlement", function () {
    beforeEach(async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });
    });

    it("Should settle auction and transfer NFT to winner", async function () {
      // Fast forward past auction end
      await time.increase(AUCTION_DURATION + 1);

      // Settle auction
      const tx = await auction.connect(bidder2).settleAuction(1);

      await expect(tx)
        .to.emit(auction, "AuctionSettled")
        .withArgs(1, 0, bidder1.address, ethers.parseEther("0.6"));

      // Check NFT was transferred
      expect(await covenant.ownerOf(0)).to.equal(bidder1.address);

      // Check auction is settled
      const auctionData = await auction.getAuction(1);
      expect(auctionData.settled).to.be.true;
    });

    it("Should automatically send proceeds to payout address on settlement", async function () {
      const payoutBalanceBefore = await ethers.provider.getBalance(payoutAddress.address);

      await time.increase(AUCTION_DURATION + 1);
      await auction.connect(bidder2).settleAuction(1);

      const payoutBalanceAfter = await ethers.provider.getBalance(payoutAddress.address);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(ethers.parseEther("0.6"));

      // Should have no realized proceeds left to withdraw
      expect(await auction.realizedProceeds()).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should prevent self-outbidding", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });

      await expect(
        auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.7") }),
      ).to.be.revertedWithCustomError(auction, "AlreadyHighestBidder");
    });

    it("Should enforce minimum bid increment", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("1.0") });

      // 5% increment required, so 1.05 ETH minimum
      await expect(
        auction.connect(bidder2).bid(1, { value: ethers.parseEther("1.02") }),
      ).to.be.revertedWithCustomError(auction, "BidTooLow");

      // Should work with proper increment
      await expect(auction.connect(bidder2).bid(1, { value: ethers.parseEther("1.05") })).to.not.be
        .reverted;
    });

    it("Should extend auction when bid in extension window", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // Fast forward to last 5 minutes
      await time.increase(AUCTION_DURATION - 250);

      // Bid should trigger extension
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("0.6") });

      const auctionData = await auction.getAuction(1);
      const currentTime = await time.latest();
      expect(auctionData.endTime).to.be.greaterThan(currentTime + 250);
    });
  });

  describe("Escrow Accounting (Security)", function () {
    it("Should track escrowed bids correctly", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // First bid should add to escrow
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("1.0") });
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.0"));

      // Second bid should add delta to escrow
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("1.1") });
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.1"));

      // Third bid should update escrow correctly
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("1.2") });
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.2"));
    });

    it("Should prevent withdrawing escrowed bids before settlement", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("2.0") });

      // Owner should not be able to withdraw active bid
      expect(await auction.realizedProceeds()).to.equal(0);
      await expect(auction.connect(owner).withdrawProceeds()).to.be.revertedWithCustomError(
        auction,
        "NoFundsToWithdraw",
      );
    });

    it("Should move funds from escrow and send to payout on settlement", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      const bidAmount = ethers.parseEther("2.0");
      await auction.connect(bidder1).bid(1, { value: bidAmount });

      // Check escrow before settlement
      expect(await auction.escrowedActiveBids()).to.equal(bidAmount);
      expect(await auction.realizedProceeds()).to.equal(0);

      // Get payout balance before settlement
      const payoutBalanceBefore = await ethers.provider.getBalance(payoutAddress.address);

      // Settle auction
      await time.increase(AUCTION_DURATION + 1);
      await auction.connect(bidder1).settleAuction(1);

      // Check funds removed from escrow and sent to payout address
      expect(await auction.escrowedActiveBids()).to.equal(0);
      expect(await auction.realizedProceeds()).to.equal(0);
      const payoutBalanceAfter = await ethers.provider.getBalance(payoutAddress.address);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(bidAmount);
    });

    it("Should automatically send proceeds on settlement", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      const bidAmount = ethers.parseEther("2.5");
      await auction.connect(bidder1).bid(1, { value: bidAmount });

      // Get payout balance before settlement
      const payoutBalanceBefore = await ethers.provider.getBalance(payoutAddress.address);

      // Settle auction
      await time.increase(AUCTION_DURATION + 1);
      await auction.connect(bidder1).settleAuction(1);

      // Proceeds should be automatically sent to payout address
      const payoutBalanceAfter = await ethers.provider.getBalance(payoutAddress.address);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(bidAmount);
      expect(await auction.realizedProceeds()).to.equal(0);
    });

    it("Should handle multiple auctions with separate escrow tracking", async function () {
      // Create two auctions
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(owner).createAuction(1, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // Bid on both
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("1.0") });
      await auction.connect(bidder2).bid(2, { value: ethers.parseEther("1.5") });

      // Total escrow should be sum of both bids
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("2.5"));

      // Get payout balance before settlements
      const payoutBalanceBefore = await ethers.provider.getBalance(payoutAddress.address);

      // Settle first auction
      await time.increase(AUCTION_DURATION + 1);
      await auction.connect(bidder1).settleAuction(1);

      // First auction proceeds sent, second still escrowed
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.5"));
      expect(await auction.realizedProceeds()).to.equal(0);

      // Settle second auction
      await auction.connect(bidder2).settleAuction(2);

      // All proceeds should be sent to payout address
      expect(await auction.escrowedActiveBids()).to.equal(0);
      expect(await auction.realizedProceeds()).to.equal(0);
      const payoutBalanceAfter = await ethers.provider.getBalance(payoutAddress.address);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(ethers.parseEther("2.5"));
    });

    it("Should update getBalanceInfo() with escrow tracking", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("2.0") });

      const info = await auction.getBalanceInfo();
      expect(info.escrowedBids).to.equal(ethers.parseEther("2.0"));
      expect(info.realizedAmount).to.equal(0);
      expect(info.totalBalance).to.equal(ethers.parseEther("2.0"));

      // Settle and check again - funds sent automatically to payout address
      await time.increase(AUCTION_DURATION + 1);
      await auction.connect(bidder1).settleAuction(1);

      const infoAfter = await auction.getBalanceInfo();
      expect(infoAfter.escrowedBids).to.equal(0);
      expect(infoAfter.realizedAmount).to.equal(0); // Sent to payout, not held in contract
    });

    it("Should handle outbid scenarios correctly in escrow", async function () {
      await auction.connect(owner).createAuction(0, 0, AUCTION_DURATION, ethers.parseEther("0.5"));

      // First bid
      await auction.connect(bidder1).bid(1, { value: ethers.parseEther("1.0") });
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.0"));

      // Outbid - previous bidder gets auto-refund, escrow increases by delta
      const bidder1BalanceBefore = await ethers.provider.getBalance(bidder1.address);
      await auction.connect(bidder2).bid(1, { value: ethers.parseEther("1.5") });

      // Check bidder1 got refund (approximately, accounting for gas)
      const bidder1BalanceAfter = await ethers.provider.getBalance(bidder1.address);
      expect(bidder1BalanceAfter - bidder1BalanceBefore).to.be.closeTo(
        ethers.parseEther("1.0"),
        ethers.parseEther("0.001"),
      );

      // Escrow should only have the new highest bid
      expect(await auction.escrowedActiveBids()).to.equal(ethers.parseEther("1.5"));
    });
  });
});
