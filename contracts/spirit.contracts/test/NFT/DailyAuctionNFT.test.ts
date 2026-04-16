import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { DailyAuctionNFT } from "../../typechain-types";

describe("DailyAuctionNFT", function () {
  let dailyAuctionNFT: DailyAuctionNFT;
  let owner: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let bidder3: SignerWithAddress;

  const NAME = "Daily Auction NFT";
  const SYMBOL = "DAILY";
  let DURATION: bigint; // on-chain AUCTION_DURATION (seconds)
  let REST: bigint; // on-chain REST_DURATION (seconds)
  const PAYOUT_ADDRESS = "0xCdE24fe2E87C0e5D56CD0B0604f9E8b725797f54";
  const MAX_AUCTIONS = 24n;

  beforeEach(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const DailyAuctionNFTFactory = await ethers.getContractFactory(
      "contracts/NFT/DailyAuctionNFT.sol:DailyAuctionNFT",
    );
    dailyAuctionNFT = (await DailyAuctionNFTFactory.deploy(
      NAME,
      SYMBOL,
      owner.address, // owner address
      PAYOUT_ADDRESS,
      MAX_AUCTIONS,
      5 * 60, // auctionDuration seconds
      24 * 60 * 60, // restDuration seconds
      6, // restInterval
    )) as unknown as DailyAuctionNFT;
    await (dailyAuctionNFT as any).waitForDeployment();
    DURATION = await dailyAuctionNFT.AUCTION_DURATION();
    REST = await dailyAuctionNFT.REST_DURATION();
    // Pre-configure tokenURIs for all auctions to allow auctions to start seamlessly (from tokenId 0)
    for (let i = 0n; i < MAX_AUCTIONS; i++) {
      await dailyAuctionNFT.connect(owner).setTokenURI(Number(i), `ipfs://preset/${i}.json`);
    }
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await dailyAuctionNFT.name()).to.equal(NAME);
      expect(await dailyAuctionNFT.symbol()).to.equal(SYMBOL);
    });

    it("Should set the correct configuration", async function () {
      expect(await dailyAuctionNFT.AUCTION_DURATION()).to.equal(DURATION);
      expect(await dailyAuctionNFT.payoutAddress()).to.equal(PAYOUT_ADDRESS);
      expect(await dailyAuctionNFT.MAX_AUCTIONS()).to.equal(MAX_AUCTIONS);
      expect(await dailyAuctionNFT.auctionActive()).to.equal(false);
    });

    it("Should start dormant and allow owner to start genesis auction once", async function () {
      // Initially dormant
      expect(await dailyAuctionNFT.auctionActive()).to.equal(false);
      expect(await dailyAuctionNFT.getTotalAuctionCount()).to.equal(0);

      // Owner starts genesis
      await dailyAuctionNFT.connect(owner).startGenesisAuction();

      expect(await dailyAuctionNFT.auctionActive()).to.equal(true);
      expect(await dailyAuctionNFT.currentAuctionId()).to.equal(1);

      // Second call should revert
      await expect(dailyAuctionNFT.connect(owner).startGenesisAuction()).to.be.reverted;
    });

    it("Should start with an active auction after genesis", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();

      expect(await dailyAuctionNFT.auctionActive()).to.be.true;
      expect(await dailyAuctionNFT.currentAuctionId()).to.equal(1);

      // Check that first auction has correct duration
      const auction = await dailyAuctionNFT.getCurrentAuction();
      const duration = auction.endTime - auction.startTime;
      expect(duration).to.equal(DURATION);
    });
  });

  describe("Timing System", function () {
    it("Should use immutable durations from deployment", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const auction = await dailyAuctionNFT.getCurrentAuction();
      const duration = auction.endTime - auction.startTime;
      expect(duration).to.equal(DURATION);
      expect(DURATION).to.equal(5n * 60n);
      expect(REST).to.equal(24n * 60n * 60n);
    });

    it("Should start next auction at settlement time with settler as initial highest bidder (0)", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      // Fast forward to after auction end
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);

      const tx = await dailyAuctionNFT.connect(bidder2).settleAuction();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const auction2 = await dailyAuctionNFT.getCurrentAuction();
      expect(auction2.startTime).to.equal(block!.timestamp);
      expect(auction2.highestBidder).to.equal(bidder2.address);
      expect(auction2.highestBid).to.equal(0);
    });

    it("Should schedule next auction with startTime = settleTime + restDuration after 6th settlement", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();

      // Run through 6 auctions
      for (let i = 0; i < 6; i++) {
        const bidAmount = ethers.parseEther("0.01");
        await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });
        await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
        await network.provider.send("evm_mine", []);
        // On the 6th settle, we'll capture the block timestamp
        if (i < 5) {
          await dailyAuctionNFT.connect(bidder2).settleAuction();
        }
      }

      // Now do the 6th settlement (i == 5)
      const tx = await dailyAuctionNFT.connect(bidder2).settleAuction();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      // A new auction should have been created with startTime = block.timestamp + restDuration
      const nextAuction = await dailyAuctionNFT.getCurrentAuction();
      expect(nextAuction.startTime).to.equal(BigInt(block!.timestamp) + REST);
      expect(nextAuction.highestBidder).to.equal(bidder2.address);
      expect(nextAuction.highestBid).to.equal(0);

      // Bids should be blocked until start
      await expect(
        dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") }),
      ).to.be.revertedWithCustomError(dailyAuctionNFT, "AuctionNotStarted");

      // Fast forward to start and bidding should work
      const secondsToStart = Number(nextAuction.startTime - BigInt(block!.timestamp));
      await network.provider.send("evm_increaseTime", [secondsToStart + 1]);
      await network.provider.send("evm_mine", []);
      await expect(dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") }))
        .to.emit(dailyAuctionNFT, "BidPlaced")
        .withArgs(nextAuction.auctionId, bidder1.address, ethers.parseEther("0.1"));
    });
  });

  describe("Bidding", function () {
    it("Should accept bids during active auction", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      await expect(dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount }))
        .to.emit(dailyAuctionNFT, "BidPlaced")
        .withArgs(1, bidder1.address, bidAmount);

      const auction = await dailyAuctionNFT.getCurrentAuction();
      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(bidAmount);
    });

    it("Should reject bids after auction expires until settled", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      // Fast forward past auction end
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);

      const bidAmount = ethers.parseEther("0.1");
      await expect(dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount })).to.be.reverted;

      // Now settle and bid on next auction
      await dailyAuctionNFT.connect(bidder3).settleAuction();
      await expect(dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount }))
        .to.emit(dailyAuctionNFT, "BidPlaced")
        .withArgs(2, bidder1.address, bidAmount);
    });

    it("Should automatically refund previous bidder", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bid1Amount = ethers.parseEther("0.1");
      const bid2Amount = ethers.parseEther("0.2");

      // First bid
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bid1Amount });

      // Second bid should refund first bidder
      await expect(dailyAuctionNFT.connect(bidder2).placeBid({ value: bid2Amount }))
        .to.emit(dailyAuctionNFT, "BidRefunded")
        .withArgs(1, bidder1.address, bid1Amount);
    });

    it("Should require explicit settlement before next auction starts", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bid1Amount = ethers.parseEther("0.1");

      // Place bid on first auction
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bid1Amount });

      // Fast forward past auction end
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);

      // Settle
      await expect(dailyAuctionNFT.connect(bidder2).settleAuction())
        .to.emit(dailyAuctionNFT, "AuctionSettled")
        .withArgs(1, bidder1.address, bid1Amount, 0);

      // Should be on auction #2 now
      expect(await dailyAuctionNFT.currentAuctionId()).to.equal(2);
    });
  });

  describe("NFT Settlement and Minting", function () {
    it("Should mint NFT to winner upon settlement", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      // Place bid
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });

      // Fast forward past auction end
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);

      // Settle triggers mint
      await expect(dailyAuctionNFT.connect(bidder3).settleAuction())
        .to.emit(dailyAuctionNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, bidder1.address, 0);

      expect(await dailyAuctionNFT.ownerOf(0)).to.equal(bidder1.address);
    });

    it("Should allow winner to be owner after settlement (no claim function)", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      // Place bid
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });

      // Fast forward past auction end and settle
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);
      await dailyAuctionNFT.connect(bidder3).settleAuction();

      expect(await dailyAuctionNFT.ownerOf(0)).to.equal(bidder1.address);
    });

    it("Should not expose any claim function (mint occurs during settlement)", async function () {
      expect((dailyAuctionNFT as any).claimNFT).to.equal(undefined);
      expect((dailyAuctionNFT as any).claimNFTByAuctionId).to.equal(undefined);
    });
  });

  describe("Settlement Functions", function () {
    it("Should allow anyone to settle expired auction and start next with settler as initial highest bidder", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      // Place bid
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });

      // Fast forward past auction end
      await network.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await network.provider.send("evm_mine", []);

      // Anyone can settle
      await expect(dailyAuctionNFT.connect(bidder3).settleAuction())
        .to.emit(dailyAuctionNFT, "AuctionSettled")
        .withArgs(1, bidder1.address, bidAmount, 0);

      // Should start new auction
      expect(await dailyAuctionNFT.currentAuctionId()).to.equal(2);

      const auction2 = await dailyAuctionNFT.getCurrentAuction();
      expect(auction2.highestBidder).to.equal(bidder3.address);
      expect(auction2.highestBid).to.equal(0);
    });

    it("Should check if auction can be settled", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      // Current auction should not be settleable yet
      expect(await dailyAuctionNFT.canSettleAuction()).to.be.false;

      // Fast forward past auction end
      await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await ethers.provider.send("evm_mine", []);

      // Now it should be settleable
      expect(await dailyAuctionNFT.canSettleAuction()).to.be.true;
    });
  });

  describe("Payout System", function () {
    it("Should send auction proceeds to payout address", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");
      const payoutBalanceBefore = await ethers.provider.getBalance(PAYOUT_ADDRESS);

      // Place bid
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });

      // Fast forward and settle
      await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await ethers.provider.send("evm_mine", []);

      await dailyAuctionNFT.connect(bidder3).settleAuction();

      const payoutBalanceAfter = await ethers.provider.getBalance(PAYOUT_ADDRESS);
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(bidAmount);
    });
  });

  describe("Winner View", function () {
    it("Should return true for the winner only after auction ends", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      // place bid by bidder1
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });

      // before end
      expect(await dailyAuctionNFT.isWinner(bidder1.address)).to.equal(false);

      // advance time to end
      await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await ethers.provider.send("evm_mine", []);

      // now winner should be true for bidder1, false for others
      expect(await dailyAuctionNFT.isWinner(bidder1.address)).to.equal(true);
      expect(await dailyAuctionNFT.isWinner(bidder2.address)).to.equal(false);

      // settle does not change winner result for just-finished auction id (still current until next created)
      await dailyAuctionNFT.connect(bidder3).settleAuction();
      // After settlement, currentAuctionId has advanced; winner refers to new auction (not ended), so false
      expect(await dailyAuctionNFT.isWinner(bidder1.address)).to.equal(false);
    });
  });

  describe("NFT Metadata", function () {
    it("Should return correct tokenURI after NFT is minted", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount = ethers.parseEther("0.1");

      // Place bid and settle
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });
      await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await ethers.provider.send("evm_mine", []);
      await dailyAuctionNFT.connect(bidder3).settleAuction();

      // tokenURI was preset pre-mint; should be readable now
      const tokenURI = await dailyAuctionNFT.tokenURI(0);
      expect(tokenURI).to.equal("ipfs://preset/0.json");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple auctions correctly with rest day insertion", async function () {
      await dailyAuctionNFT.connect(owner).startGenesisAuction();
      const bidAmount1 = ethers.parseEther("0.1");
      const bidAmount2 = ethers.parseEther("0.2");

      // First auction
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount1 });
      await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
      await ethers.provider.send("evm_mine", []);

      // Start second auction by settling, then place bid
      await dailyAuctionNFT.connect(bidder3).settleAuction();
      await dailyAuctionNFT.connect(bidder2).placeBid({ value: bidAmount2 });

      // Check both auctions exist
      expect(await dailyAuctionNFT.getTotalAuctionCount()).to.equal(2);
      const auctionIds = await dailyAuctionNFT.getAuctionIds(0, 10);
      expect(auctionIds.length).to.equal(2);
      expect(auctionIds[0]).to.equal(1);
      expect(auctionIds[1]).to.equal(2);

      // Check current auction is #2
      expect(await dailyAuctionNFT.currentAuctionId()).to.equal(2);

      // Winner of first auction should own NFT after settlement
      expect(await dailyAuctionNFT.ownerOf(0)).to.equal(bidder1.address);
    });

    it("Should stop creating auctions permanently after reaching maxAuctions", async function () {
      // Start genesis
      await dailyAuctionNFT.connect(owner).startGenesisAuction();

      // Run through MAX_AUCTIONS auctions
      for (let i = 0n; i < MAX_AUCTIONS; i++) {
        // Ensure the auction has started (handle rest windows)
        const currentAuction = await dailyAuctionNFT.getCurrentAuction();
        const latestBlock = await ethers.provider.getBlock("latest");
        const nowTs = BigInt(latestBlock!.timestamp);
        if (currentAuction.startTime > nowTs) {
          const secondsToStart = Number(currentAuction.startTime - nowTs);
          await ethers.provider.send("evm_increaseTime", [secondsToStart + 1]);
          await ethers.provider.send("evm_mine", []);
        }

        // place a small bid to ensure a winner exists
        await dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("0.001") });
        await ethers.provider.send("evm_increaseTime", [Number(DURATION) + 1]);
        await ethers.provider.send("evm_mine", []);
        await dailyAuctionNFT.connect(bidder2).settleAuction();
      }

      // After settling MAX_AUCTIONS, auctionActive should be false and creating new should be blocked
      expect(await dailyAuctionNFT.auctionActive()).to.equal(false);
      expect(await dailyAuctionNFT.getTotalAuctionCount()).to.equal(Number(MAX_AUCTIONS));
      // genesis-only function cannot be called again; expect the existing revert
      await expect(dailyAuctionNFT.connect(owner).startGenesisAuction()).to.be.reverted;
    });
  });
});
