import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DailyAuctionNFT } from "../../typechain-types";

describe("DailyAuctionNFT - Scalability Features", function () {
  let dailyAuctionNFT: DailyAuctionNFT;
  let owner: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let bidder3: SignerWithAddress;

  const NAME = "Daily Auction NFT";
  const SYMBOL = "DAILY";
  const PAYOUT_ADDRESS = "0xCdE24fe2E87C0e5D56CD0B0604f9E8b725797f54";
  const MAX_AUCTIONS = 10n;

  beforeEach(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const DailyAuctionNFTFactory = await ethers.getContractFactory("DailyAuctionNFT");
    dailyAuctionNFT = (await DailyAuctionNFTFactory.deploy(
      NAME,
      SYMBOL,
      owner.address,
      PAYOUT_ADDRESS,
      MAX_AUCTIONS,
      60, // 1 minute auction duration
      120, // 2 minute rest duration
      3, // rest every 3 auctions
    )) as unknown as DailyAuctionNFT;
    await (dailyAuctionNFT as any).waitForDeployment();

    // Pre-configure tokenURIs
    for (let i = 0n; i < MAX_AUCTIONS; i++) {
      await dailyAuctionNFT.connect(owner).setTokenURI(Number(i), `ipfs://test/${i}.json`);
    }

    // Start genesis auction
    await dailyAuctionNFT.connect(owner).startGenesisAuction();
  });

  describe("Paginated Auction ID Retrieval", function () {
    it("Should return empty array when offset is beyond bounds", async function () {
      const result = await dailyAuctionNFT.getAuctionIds(100, 10);
      expect(result.length).to.equal(0);
    });

    it("Should limit results per page and handle pagination correctly", async function () {
      // Create a few auctions by bidding and settling
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("1") });
      await ethers.provider.send("evm_increaseTime", [65]); // Move past auction end
      await dailyAuctionNFT.connect(bidder2).settleAuction(); // Creates auction #2

      await dailyAuctionNFT.connect(bidder2).placeBid({ value: ethers.parseEther("2") });
      await ethers.provider.send("evm_increaseTime", [65]);
      await dailyAuctionNFT.connect(bidder3).settleAuction(); // Creates auction #3

      // Test pagination
      const page1 = await dailyAuctionNFT.getAuctionIds(0, 2);
      expect(page1.length).to.equal(2);
      expect(page1[0]).to.equal(1);
      expect(page1[1]).to.equal(2);

      const page2 = await dailyAuctionNFT.getAuctionIds(2, 2);
      expect(page2.length).to.equal(1);
      expect(page2[0]).to.equal(3);

      // Test total count
      expect(await dailyAuctionNFT.getTotalAuctionCount()).to.equal(3);
    });

    it("Should enforce reasonable limits on page size", async function () {
      await expect(dailyAuctionNFT.getAuctionIds(0, 0)).to.be.revertedWith(
        "Invalid limit: must be 1-100",
      );
      await expect(dailyAuctionNFT.getAuctionIds(0, 101)).to.be.revertedWith(
        "Invalid limit: must be 1-100",
      );
    });
  });

  describe("Paginated Bid Retrieval", function () {
    it("Should handle multiple bids and pagination", async function () {
      // Place multiple bids on current auction
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("1") });
      await dailyAuctionNFT.connect(bidder2).placeBid({ value: ethers.parseEther("2") });
      await dailyAuctionNFT.connect(bidder3).placeBid({ value: ethers.parseEther("3") });

      const currentAuction = await dailyAuctionNFT.currentAuctionId();

      // Test bid count
      expect(await dailyAuctionNFT.getAuctionBidCount(currentAuction)).to.equal(3);

      // Test paginated retrieval
      const page1 = await dailyAuctionNFT.getAuctionBids(currentAuction, 0, 2);
      expect(page1.length).to.equal(2);
      expect(page1[0].bidder).to.equal(bidder1.address);
      expect(page1[1].bidder).to.equal(bidder2.address);

      const page2 = await dailyAuctionNFT.getAuctionBids(currentAuction, 2, 2);
      expect(page2.length).to.equal(1);
      expect(page2[0].bidder).to.equal(bidder3.address);
    });

    it("Should return recent bids in correct order", async function () {
      // Place multiple bids
      await dailyAuctionNFT.connect(bidder1).placeBid({ value: ethers.parseEther("1") });
      await dailyAuctionNFT.connect(bidder2).placeBid({ value: ethers.parseEther("2") });
      await dailyAuctionNFT.connect(bidder3).placeBid({ value: ethers.parseEther("3") });

      const currentAuction = await dailyAuctionNFT.currentAuctionId();

      // Test recent bids (should return most recent first)
      const recentBids = await dailyAuctionNFT.getRecentAuctionBids(currentAuction, 2);
      expect(recentBids.length).to.equal(2);
      expect(recentBids[0].bidder).to.equal(bidder2.address); // Second most recent
      expect(recentBids[1].bidder).to.equal(bidder3.address); // Most recent
    });

    it("Should enforce reasonable limits on bid retrieval", async function () {
      const currentAuction = await dailyAuctionNFT.currentAuctionId();

      await expect(dailyAuctionNFT.getAuctionBids(currentAuction, 0, 0)).to.be.revertedWith(
        "Invalid limit: must be 1-50",
      );
      await expect(dailyAuctionNFT.getAuctionBids(currentAuction, 0, 51)).to.be.revertedWith(
        "Invalid limit: must be 1-50",
      );
      await expect(dailyAuctionNFT.getRecentAuctionBids(currentAuction, 0)).to.be.revertedWith(
        "Invalid count: must be 1-20",
      );
      await expect(dailyAuctionNFT.getRecentAuctionBids(currentAuction, 21)).to.be.revertedWith(
        "Invalid count: must be 1-20",
      );
    });
  });

  describe("Gas Protection in View Functions", function () {
    it("Should handle getCurrentAuctionView with many bids", async function () {
      // Place several bids
      for (let i = 0; i < 5; i++) {
        const bidAmount = ethers.parseEther((i + 1).toString());
        await dailyAuctionNFT.connect(bidder1).placeBid({ value: bidAmount });
      }

      // Should still work efficiently
      const auctionView = await dailyAuctionNFT.getCurrentAuctionView();
      expect(auctionView.totalBids).to.equal(5);
      expect(auctionView.exists).to.equal(true);
    });
  });
});
