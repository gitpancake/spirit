import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type {
  SolienneGenesisPortraits,
  SolienneOriginSeries,
  SolienneFixedPriceMinter,
} from "../../typechain-types";

describe("Solienne NFT System - Simplified Minter", () => {
  // Fixture for deployment
  async function deployFixture() {
    const [owner, user1, user2, user3, payout, royaltyReceiver] = await ethers.getSigners();

    // Deploy Genesis Portraits (15 NFTs: tokens 0-14)
    const SolienneGenesisPortraits = await ethers.getContractFactory("SolienneGenesisPortraits");
    const genesis = await SolienneGenesisPortraits.deploy(
      owner.address,
      ethers.ZeroAddress,
      "ipfs://genesis-base/",
      royaltyReceiver.address,
      500, // 5% royalty
    );

    // Deploy Fixed Price Minter (no NFT contracts enabled yet)
    const SolienneFixedPriceMinter = await ethers.getContractFactory("SolienneFixedPriceMinter");
    const minter = await SolienneFixedPriceMinter.deploy(owner.address, payout.address, []);

    // Enable NFT contracts on minter
    await minter.enableNFTContract(await genesis.getAddress());

    // Set minter as authorized minter on NFT contract
    await genesis.updateAuthorizedMinter(await minter.getAddress());

    return { genesis, minter, owner, user1, user2, user3, payout, royaltyReceiver };
  }

  describe("Deployment", () => {
    it("should deploy with correct parameters", async () => {
      const { genesis, minter, owner, payout } = await loadFixture(deployFixture);

      expect(await minter.owner()).to.equal(owner.address);
      expect(await minter.payoutAddress()).to.equal(payout.address);
      expect(await minter.enabledNFTContracts(await genesis.getAddress())).to.be.true;
      expect(await genesis.authorizedMinter()).to.equal(await minter.getAddress());
    });
  });

  describe("Sale Configuration", () => {
    it("should configure sale for Portrait #1 (tokens 0,1,2)", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await expect(minter.configureSale(await genesis.getAddress(), [0, 1, 2], price))
        .to.emit(minter, "SaleConfigured")
        .withArgs(await genesis.getAddress(), [0, 1, 2], price);

      // Verify prices are set
      expect(await minter.tokenPrices(await genesis.getAddress(), 0)).to.equal(price);
      expect(await minter.tokenPrices(await genesis.getAddress(), 1)).to.equal(price);
      expect(await minter.tokenPrices(await genesis.getAddress(), 2)).to.equal(price);
    });

    it("should configure multiple portraits", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      // Portrait #1: tokens 0,1,2 at 1.4 ETH
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], ethers.parseEther("1.4"));

      // Portrait #2: tokens 3,4,5 at 1.6 ETH
      await minter.configureSale(await genesis.getAddress(), [3, 4, 5], ethers.parseEther("1.6"));

      // Portrait #3: tokens 6,7,8 at 1.8 ETH
      await minter.configureSale(await genesis.getAddress(), [6, 7, 8], ethers.parseEther("1.8"));

      // Verify different prices
      expect(await minter.tokenPrices(await genesis.getAddress(), 0)).to.equal(
        ethers.parseEther("1.4"),
      );
      expect(await minter.tokenPrices(await genesis.getAddress(), 3)).to.equal(
        ethers.parseEther("1.6"),
      );
      expect(await minter.tokenPrices(await genesis.getAddress(), 6)).to.equal(
        ethers.parseEther("1.8"),
      );
    });

    it("should allow setting individual token prices", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      const price = ethers.parseEther("2.5");
      await expect(minter.setTokenPrice(await genesis.getAddress(), 10, price))
        .to.emit(minter, "TokenPriceSet")
        .withArgs(await genesis.getAddress(), 10, price);

      expect(await minter.tokenPrices(await genesis.getAddress(), 10)).to.equal(price);
    });

    it("should allow setting multiple different prices", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      const tokenIds = [0, 1, 2];
      const prices = [ethers.parseEther("1.0"), ethers.parseEther("1.5"), ethers.parseEther("2.0")];

      await minter.setTokenPrices(await genesis.getAddress(), tokenIds, prices);

      expect(await minter.tokenPrices(await genesis.getAddress(), 0)).to.equal(prices[0]);
      expect(await minter.tokenPrices(await genesis.getAddress(), 1)).to.equal(prices[1]);
      expect(await minter.tokenPrices(await genesis.getAddress(), 2)).to.equal(prices[2]);
    });
  });

  describe("Single Minting", () => {
    it("should mint a single token", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Mint token 0
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price }))
        .to.emit(minter, "TokenMinted")
        .withArgs(user1.address, user1.address, await genesis.getAddress(), 0, price);

      // Verify NFT ownership
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(1);

      // Verify stats
      expect(await minter.totalSold()).to.equal(1);
      expect(await minter.totalRevenue()).to.equal(price);
    });

    it("should track remaining tokens correctly", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Check all tokens available
      const [prices1, available1] = await minter.getSaleInfo(await genesis.getAddress(), [0, 1, 2]);
      expect(available1[0]).to.be.true;
      expect(available1[1]).to.be.true;
      expect(available1[2]).to.be.true;

      // Mint token 0
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      // Check remaining: tokens 1 and 2
      const [prices2, available2] = await minter.getSaleInfo(await genesis.getAddress(), [0, 1, 2]);
      expect(available2[0]).to.be.false; // 0 is minted
      expect(available2[1]).to.be.true; // 1 still available
      expect(available2[2]).to.be.true; // 2 still available
    });

    it("should prevent minting already sold token", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // User1 mints token 0
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      // User2 tries to mint token 0 again
      await expect(
        minter.connect(user2).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "TokenAlreadySold");
    });

    it("should prevent minting token not for sale", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      // Token 0 has no price (not configured)
      await expect(
        minter
          .connect(user1)
          .mint(await genesis.getAddress(), 0, { value: ethers.parseEther("1") }),
      ).to.be.revertedWithCustomError(minter, "TokenNotForSale");
    });

    it("should prevent incorrect payment", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Underpay
      await expect(
        minter
          .connect(user1)
          .mint(await genesis.getAddress(), 0, { value: ethers.parseEther("1.0") }),
      ).to.be.revertedWithCustomError(minter, "IncorrectPayment");

      // Overpay
      await expect(
        minter
          .connect(user1)
          .mint(await genesis.getAddress(), 0, { value: ethers.parseEther("2.0") }),
      ).to.be.revertedWithCustomError(minter, "IncorrectPayment");
    });
  });

  describe("Batch Minting", () => {
    it("should mint multiple tokens from same portrait", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Batch mint tokens 0 and 1
      const totalCost = price * 2n;
      await expect(
        minter.connect(user1).mintBatch(await genesis.getAddress(), [0, 1], { value: totalCost }),
      )
        .to.emit(minter, "TokenMinted")
        .to.emit(minter, "TokenMinted");

      // Verify ownership
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.ownerOf(1)).to.equal(user1.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(2);

      // Check remaining: only token 2
      const [prices, available] = await minter.getSaleInfo(await genesis.getAddress(), [0, 1, 2]);
      expect(available[0]).to.be.false;
      expect(available[1]).to.be.false;
      expect(available[2]).to.be.true;
    });

    it("should mint tokens from multiple portraits", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      // Configure two portraits
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], ethers.parseEther("1.4"));
      await minter.configureSale(await genesis.getAddress(), [3, 4, 5], ethers.parseEther("1.6"));

      // Mint one from each
      const totalCost = ethers.parseEther("1.4") + ethers.parseEther("1.6");
      await minter
        .connect(user1)
        .mintBatch(await genesis.getAddress(), [0, 3], { value: totalCost });

      expect(await genesis.balanceOf(user1.address)).to.equal(2);
    });

    it("should calculate total cost correctly", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      await minter.configureSale(await genesis.getAddress(), [0, 1], ethers.parseEther("1.4"));
      await minter.configureSale(await genesis.getAddress(), [2, 3], ethers.parseEther("1.6"));

      const totalCost = await minter.calculateTotalCost(await genesis.getAddress(), [0, 2]);
      expect(totalCost).to.equal(ethers.parseEther("3.0")); // 1.4 + 1.6
    });
  });

  describe("Gift Minting", () => {
    it("should mint to a different recipient", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // User1 pays, user2 receives
      await expect(
        minter
          .connect(user1)
          .mintFor(user2.address, await genesis.getAddress(), 0, { value: price }),
      )
        .to.emit(minter, "TokenMinted")
        .withArgs(user1.address, user2.address, await genesis.getAddress(), 0, price);

      // Verify user2 owns it
      expect(await genesis.ownerOf(0)).to.equal(user2.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(0);
      expect(await genesis.balanceOf(user2.address)).to.equal(1);
    });

    it("should batch mint to a different recipient", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      const totalCost = price * 2n;
      await minter
        .connect(user1)
        .mintBatchFor(user2.address, await genesis.getAddress(), [0, 1], { value: totalCost });

      expect(await genesis.balanceOf(user2.address)).to.equal(2);
    });
  });

  describe("Revenue & Withdrawals", () => {
    it("should track revenue correctly", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      await minter.configureSale(await genesis.getAddress(), [0, 1], ethers.parseEther("1.4"));

      // Mint 2 tokens
      await minter
        .connect(user1)
        .mint(await genesis.getAddress(), 0, { value: ethers.parseEther("1.4") });
      await minter
        .connect(user1)
        .mint(await genesis.getAddress(), 1, { value: ethers.parseEther("1.4") });

      const [totalSold, totalRevenue, balance] = await minter.getMinterStats();
      expect(totalSold).to.equal(2);
      expect(totalRevenue).to.equal(ethers.parseEther("2.8"));
      expect(balance).to.equal(ethers.parseEther("2.8"));
    });

    it("should allow owner to withdraw funds", async () => {
      const { genesis, minter, owner, user1, payout } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Mint a token
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      const payoutBalanceBefore = await ethers.provider.getBalance(payout.address);

      // Withdraw
      await expect(minter.connect(owner).withdraw())
        .to.emit(minter, "FundsWithdrawn")
        .withArgs(payout.address, price);

      const payoutBalanceAfter = await ethers.provider.getBalance(payout.address);

      // Verify payout received funds
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(price);

      // Verify contract balance is 0
      const [, , balance] = await minter.getMinterStats();
      expect(balance).to.equal(0);
    });
  });

  describe("Pause Functionality", () => {
    it("should prevent minting when paused", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], price);

      // Pause
      await minter.connect(owner).pause();

      // Try to mint
      await expect(
        minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "EnforcedPause");

      // Unpause
      await minter.connect(owner).unpause();

      // Now should work
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price })).to
        .not.be.reverted;
    });
  });

  describe("Real-World Scenario: 5 Portraits, 3 Editions Each", () => {
    it("should handle complete Genesis Portraits sale (tokens 0-14)", async () => {
      const { genesis, minter, user1, user2, user3 } = await loadFixture(deployFixture);

      // Configure all 5 portraits (15 tokens total)
      await minter.configureSale(await genesis.getAddress(), [0, 1, 2], ethers.parseEther("1.4")); // Portrait #1
      await minter.configureSale(await genesis.getAddress(), [3, 4, 5], ethers.parseEther("1.6")); // Portrait #2
      await minter.configureSale(await genesis.getAddress(), [6, 7, 8], ethers.parseEther("1.8")); // Portrait #3
      await minter.configureSale(await genesis.getAddress(), [9, 10, 11], ethers.parseEther("2.0")); // Portrait #4
      await minter.configureSale(
        await genesis.getAddress(),
        [12, 13, 14],
        ethers.parseEther("2.2"),
      ); // Portrait #5

      // Check all tokens available
      const tokenIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      const [prices, available] = await minter.getSaleInfo(await genesis.getAddress(), tokenIds);

      // All should be available
      for (let i = 0; i < 15; i++) {
        expect(available[i]).to.be.true;
      }

      // Mint token 0 from Portrait #1
      await minter
        .connect(user1)
        .mint(await genesis.getAddress(), 0, { value: ethers.parseEther("1.4") });

      // Check Portrait #1: 0 sold, 1 and 2 remaining
      const [prices2, available2] = await minter.getSaleInfo(await genesis.getAddress(), [0, 1, 2]);
      expect(available2[0]).to.be.false; // sold
      expect(available2[1]).to.be.true; // available
      expect(available2[2]).to.be.true; // available

      // Mint remaining tokens from Portrait #1
      await minter
        .connect(user2)
        .mint(await genesis.getAddress(), 1, { value: ethers.parseEther("1.4") });
      await minter
        .connect(user3)
        .mint(await genesis.getAddress(), 2, { value: ethers.parseEther("1.4") });

      // Check Portrait #1: all sold
      const [prices3, available3] = await minter.getSaleInfo(await genesis.getAddress(), [0, 1, 2]);
      expect(available3[0]).to.be.false;
      expect(available3[1]).to.be.false;
      expect(available3[2]).to.be.false;

      // Verify stats
      expect(await minter.totalSold()).to.equal(3);
      expect(await minter.totalRevenue()).to.equal(ethers.parseEther("4.2")); // 1.4 * 3
    });
  });
});
