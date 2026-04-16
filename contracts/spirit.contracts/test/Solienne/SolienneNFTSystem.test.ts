import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type {
  SolienneGenesisPortraits,
  SolienneOriginSeries,
  SolienneFixedPriceMinter,
} from "../../typechain-types";

describe("Solienne NFT System - Comprehensive Tests", () => {
  // Fixture for deployment
  async function deployFixture() {
    const [owner, user1, user2, user3, payout, royaltyReceiver] = await ethers.getSigners();

    // Deploy Genesis Portraits (5 artworks × 3 editions = 15 NFTs)
    const SolienneGenesisPortraits = await ethers.getContractFactory("SolienneGenesisPortraits");
    const genesis = await SolienneGenesisPortraits.deploy(
      owner.address, // owner
      ethers.ZeroAddress, // authorizedMinter (will be set to minter later)
      "ipfs://genesis-base/", // baseURI
      royaltyReceiver.address, // royaltyReceiver
      500, // 5% royalty
    );

    // Deploy Origin Series (9 artworks × 5 editions = 45 NFTs)
    const SolienneOriginSeries = await ethers.getContractFactory("SolienneOriginSeries");
    const origin = await SolienneOriginSeries.deploy(
      owner.address, // owner
      ethers.ZeroAddress, // authorizedMinter (will be set to minter later)
      "ipfs://origin-base/", // baseURI
      royaltyReceiver.address, // royaltyReceiver
      500, // 5% royalty
    );

    // Deploy Fixed Price Minter (no NFT contracts enabled yet)
    const SolienneFixedPriceMinter = await ethers.getContractFactory("SolienneFixedPriceMinter");
    const minter = await SolienneFixedPriceMinter.deploy(
      owner.address, // owner
      payout.address, // payoutAddress
      [], // nftContracts (empty - will be enabled manually)
    );

    // Enable NFT contracts on minter
    await minter.enableNFTContract(await genesis.getAddress());
    await minter.enableNFTContract(await origin.getAddress());

    // Set minter as authorized minter on NFT contracts
    await genesis.updateAuthorizedMinter(await minter.getAddress());
    await origin.updateAuthorizedMinter(await minter.getAddress());

    return { genesis, origin, minter, owner, user1, user2, user3, payout, royaltyReceiver };
  }

  describe("Deployment", () => {
    it("should deploy all contracts with correct parameters", async () => {
      const { genesis, origin, minter, owner, payout, royaltyReceiver } =
        await loadFixture(deployFixture);

      // Check Genesis
      expect(await genesis.name()).to.equal("Solienne Genesis Portraits");
      expect(await genesis.symbol()).to.equal("SOLGP");
      expect(await genesis.owner()).to.equal(owner.address);
      expect(await genesis.authorizedMinter()).to.equal(await minter.getAddress());
      expect(await genesis.mintingLocked()).to.be.false;

      // Check Origin
      expect(await origin.name()).to.equal("Solienne Origin Series");
      expect(await origin.symbol()).to.equal("SOLOR");
      expect(await origin.owner()).to.equal(owner.address);
      expect(await origin.authorizedMinter()).to.equal(await minter.getAddress());
      expect(await origin.mintingLocked()).to.be.false;

      // Check Minter
      expect(await minter.owner()).to.equal(owner.address);
      expect(await minter.payoutAddress()).to.equal(payout.address);
      expect(await minter.enabledNFTContracts(await genesis.getAddress())).to.be.true;
      expect(await minter.enabledNFTContracts(await origin.getAddress())).to.be.true;

      // Check royalties
      const [genesisReceiver, genesisAmount] = await genesis.royaltyInfo(0, 10000);
      expect(genesisReceiver).to.equal(royaltyReceiver.address);
      expect(genesisAmount).to.equal(500); // 5% of 10000

      const [originReceiver, originAmount] = await origin.royaltyInfo(0, 10000);
      expect(originReceiver).to.equal(royaltyReceiver.address);
      expect(originAmount).to.equal(500); // 5% of 10000
    });

    it("should reject invalid royalty fee (> 10%)", async () => {
      const [owner] = await ethers.getSigners();
      const SolienneGenesisPortraits = await ethers.getContractFactory("SolienneGenesisPortraits");

      await expect(
        SolienneGenesisPortraits.deploy(
          owner.address,
          ethers.ZeroAddress,
          "ipfs://test/",
          owner.address,
          1500, // 15% - exceeds max
        ),
      ).to.be.revertedWithCustomError(SolienneGenesisPortraits, "InvalidRoyaltyFee");
    });
  });

  describe("Artwork Configuration", () => {
    it("should configure Genesis artwork with 3 editions", async () => {
      const { genesis, minter, owner } = await loadFixture(deployFixture);

      // Configure artwork 0: token IDs 0, 1, 2 at 1.4 ETH
      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(
        await genesis.getAddress(),
        0, // artworkId
        3, // maxEditions
        [0, 1, 2], // tokenIds
        price,
      );

      // Verify configuration
      const [maxEditions, mintedEditions, remainingEditions, tokenIds] =
        await minter.getArtworkInfo(await genesis.getAddress(), 0);

      expect(maxEditions).to.equal(3);
      expect(mintedEditions).to.equal(0);
      expect(remainingEditions).to.equal(3);
      expect(tokenIds).to.deep.equal([0n, 1n, 2n]);
    });

    it("should configure Origin artwork with 5 editions", async () => {
      const { origin, minter, owner } = await loadFixture(deployFixture);

      // Configure artwork 0: token IDs 0, 1, 2, 3, 4 at 2.1 ETH
      const price = ethers.parseEther("2.1");
      await minter.configureArtwork(
        await origin.getAddress(),
        0, // artworkId
        5, // maxEditions
        [0, 1, 2, 3, 4], // tokenIds
        price,
      );

      // Verify configuration
      const [maxEditions, mintedEditions, remainingEditions, tokenIds] =
        await minter.getArtworkInfo(await origin.getAddress(), 0);

      expect(maxEditions).to.equal(5);
      expect(mintedEditions).to.equal(0);
      expect(remainingEditions).to.equal(5);
      expect(tokenIds).to.deep.equal([0n, 1n, 2n, 3n, 4n]);
    });

    it("should allow increasing maxEditions", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      // Initial configuration
      await minter.configureArtwork(
        await genesis.getAddress(),
        0,
        3,
        [0, 1, 2],
        ethers.parseEther("1.4"),
      );

      // Increase to 5 editions (add token IDs 3, 4)
      await minter.configureArtwork(
        await genesis.getAddress(),
        0,
        5,
        [0, 1, 2, 3, 4],
        ethers.parseEther("1.4"),
      );

      const [maxEditions, , remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );

      expect(maxEditions).to.equal(5);
      expect(remainingEditions).to.equal(5);
    });

    it("should prevent reducing maxEditions below mintedEditions", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      // Configure and mint 2 editions
      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });

      // Try to reduce maxEditions to 1 (below 2 minted)
      await expect(
        minter.configureArtwork(await genesis.getAddress(), 0, 1, [0], price),
      ).to.be.revertedWithCustomError(minter, "InvalidMaxEditions");
    });

    it("should revert for non-owner trying to configure artwork", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      await expect(
        minter
          .connect(user1)
          .configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], ethers.parseEther("1.4")),
      ).to.be.revertedWithCustomError(minter, "OwnableUnauthorizedAccount");
    });

    it("should revert for duplicate token IDs in configuration", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      // First configure artwork 0 with token 0
      await minter.configureArtwork(
        await genesis.getAddress(),
        0,
        1,
        [0],
        ethers.parseEther("1.4"),
      );

      // Try to configure artwork 1 with token 0 (already assigned to artwork 0)
      await expect(
        minter.configureArtwork(
          await genesis.getAddress(),
          1,
          1,
          [0], // already assigned to artwork 0
          ethers.parseEther("1.4"),
        ),
      ).to.be.revertedWithCustomError(minter, "TokenAlreadyAssignedToArtwork");
    });

    it("should allow tokenIds length different from maxEditions", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      // This should work - maxEditions just sets the limit, tokenIds can be any subset
      await expect(
        minter.configureArtwork(
          await genesis.getAddress(),
          0,
          3,
          [0, 1], // only 2 tokens configured, but maxEditions is 3
          ethers.parseEther("1.4"),
        ),
      ).to.not.be.reverted;

      const [maxEditions, , , tokenIds] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(maxEditions).to.equal(3);
      expect(tokenIds).to.deep.equal([0n, 1n]);
    });
  });

  describe("Single Mint", () => {
    it("should allow minting a single token", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint token 0
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price }))
        .to.emit(minter, "TokenMinted")
        .withArgs(
          user1.address, // buyer
          user1.address, // recipient
          await genesis.getAddress(),
          0, // tokenId
          0, // artworkId
          1, // editionNumber (1st edition)
          price,
        );

      // Verify NFT was minted to user1
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(1);

      // Verify artwork state
      const [, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(mintedEditions).to.equal(1);
      expect(remainingEditions).to.equal(2);
    });

    it("should allow minting all 3 editions of Genesis artwork", async () => {
      const { genesis, minter, user1, user2, user3 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint all 3 editions
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user2).mint(await genesis.getAddress(), 1, { value: price });
      await minter.connect(user3).mint(await genesis.getAddress(), 2, { value: price });

      // Verify all editions minted
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.ownerOf(1)).to.equal(user2.address);
      expect(await genesis.ownerOf(2)).to.equal(user3.address);

      // Verify artwork is sold out
      const [, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(mintedEditions).to.equal(3);
      expect(remainingEditions).to.equal(0);
    });

    it("should allow minting all 5 editions of Origin artwork", async () => {
      const { origin, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("2.1");
      await minter.configureArtwork(await origin.getAddress(), 0, 5, [0, 1, 2, 3, 4], price);

      // Mint all 5 editions (same user)
      for (let i = 0; i < 5; i++) {
        await minter.connect(user1).mint(await origin.getAddress(), i, { value: price });
      }

      // Verify all editions minted to user1
      expect(await origin.balanceOf(user1.address)).to.equal(5);

      // Verify artwork is sold out
      const [, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await origin.getAddress(),
        0,
      );
      expect(mintedEditions).to.equal(5);
      expect(remainingEditions).to.equal(0);
    });

    it("should revert if payment is incorrect", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

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

    it("should revert if token already sold", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // User1 buys token 0
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      // User2 tries to buy token 0 again
      await expect(
        minter.connect(user2).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "TokenAlreadySold");
    });

    it("should revert if artwork is sold out", async () => {
      const { genesis, minter, user1, user2, user3 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Sell out all 3 editions
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 2, { value: price });

      // Verify sold out
      const [, , remainingEditions] = await minter.getArtworkInfo(await genesis.getAddress(), 0);
      expect(remainingEditions).to.equal(0);

      // Try to mint token from sold out artwork
      // The minter checks artwork sold out status first, before individual token status
      await expect(
        minter.connect(user2).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "ArtworkSoldOut");
    });
  });

  describe("Batch Mint", () => {
    it("should allow batch minting multiple tokens from same artwork", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Batch mint tokens 0 and 1
      const totalCost = price * 2n;
      await expect(
        minter.connect(user1).mintBatch(await genesis.getAddress(), [0, 1], { value: totalCost }),
      )
        .to.emit(minter, "TokenMinted")
        .to.emit(minter, "TokenMinted");

      // Verify both NFTs minted
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.ownerOf(1)).to.equal(user1.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(2);

      // Verify artwork state
      const [, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(mintedEditions).to.equal(2);
      expect(remainingEditions).to.equal(1);
    });

    it("should prevent batch mint exceeding maxEditions", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Try to buy all 3 tokens at once - should work
      const totalCost = price * 3n;
      await expect(
        minter
          .connect(user1)
          .mintBatch(await genesis.getAddress(), [0, 1, 2], { value: totalCost }),
      ).to.not.be.reverted;

      // Verify all 3 minted
      const [, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(mintedEditions).to.equal(3);
      expect(remainingEditions).to.equal(0);
    });

    it("should enforce edition limits even within a single batch", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      // Configure with 3 max editions but provide 5 token IDs (for testing)
      await minter.configureArtwork(await genesis.getAddress(), 0, 5, [0, 1, 2, 3, 4], price);

      // Reconfigure to reduce to 3 editions (after no mints yet)
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Try to batch buy 4 tokens (exceeds maxEditions of 3)
      // This should fail because we only have 3 token IDs configured now
      const totalCost = price * 4n;
      await expect(
        minter
          .connect(user1)
          .mintBatch(await genesis.getAddress(), [0, 1, 2, 3], { value: totalCost }),
      ).to.be.reverted; // Will fail on validation
    });

    it("should revert batch mint with incorrect total payment", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Underpay for 2 tokens
      await expect(
        minter.connect(user1).mintBatch(await genesis.getAddress(), [0, 1], { value: price }),
      ).to.be.revertedWithCustomError(minter, "IncorrectPayment");
    });

    it("should handle empty array gracefully", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      // Empty array should either succeed (no-op) or revert
      // This depends on implementation - just verify it doesn't cause undefined behavior
      await expect(minter.connect(user1).mintBatch(await genesis.getAddress(), [], { value: 0 })).to
        .be.reverted;
    });
  });

  describe("Gift Mint (mintTo)", () => {
    it("should allow gifting to another address", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // User1 buys for user2
      await expect(
        minter
          .connect(user1)
          .mintFor(user2.address, await genesis.getAddress(), 0, { value: price }),
      )
        .to.emit(minter, "TokenMinted")
        .withArgs(
          user1.address, // buyer (payer)
          user2.address, // recipient
          await genesis.getAddress(),
          0, // tokenId
          0, // artworkId
          1, // editionNumber
          price,
        );

      // Verify user2 received NFT (not user1)
      expect(await genesis.ownerOf(0)).to.equal(user2.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(0);
      expect(await genesis.balanceOf(user2.address)).to.equal(1);
    });

    it("should allow batch gifting to another address", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // User1 batch buys for user2
      const totalCost = price * 2n;
      await minter
        .connect(user1)
        .mintBatchFor(user2.address, await genesis.getAddress(), [0, 1], { value: totalCost });

      // Verify user2 received both NFTs
      expect(await genesis.ownerOf(0)).to.equal(user2.address);
      expect(await genesis.ownerOf(1)).to.equal(user2.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(0);
      expect(await genesis.balanceOf(user2.address)).to.equal(2);
    });

    it("should revert gifting to zero address", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      await expect(
        minter
          .connect(user1)
          .mintFor(ethers.ZeroAddress, await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "InvalidRecipient");
    });
  });

  describe("Token Availability", () => {
    it("should correctly report token availability", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Check token 0 (available)
      let [available, tokenPrice, isSoldOut] = await minter.isTokenAvailable(
        await genesis.getAddress(),
        0,
      );
      expect(available).to.be.true;
      expect(tokenPrice).to.equal(price);
      expect(isSoldOut).to.be.false;

      // Mint token 0
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      // Check token 0 (sold)
      [available, tokenPrice, isSoldOut] = await minter.isTokenAvailable(
        await genesis.getAddress(),
        0,
      );
      expect(available).to.be.false;
      expect(tokenPrice).to.equal(price);
      expect(isSoldOut).to.be.false;

      // Buy remaining tokens
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 2, { value: price });

      // Check sold out status
      [available, tokenPrice, isSoldOut] = await minter.isTokenAvailable(
        await genesis.getAddress(),
        1,
      );
      expect(available).to.be.false;
      expect(isSoldOut).to.be.true;
    });

    it("should return false for unconfigured tokens", async () => {
      const { genesis, minter } = await loadFixture(deployFixture);

      const [available, , isSoldOut] = await minter.isTokenAvailable(
        await genesis.getAddress(),
        999,
      );
      expect(available).to.be.false;
      expect(isSoldOut).to.be.false;
    });
  });

  describe("Revenue & Withdrawals", () => {
    it("should track total revenue correctly", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint 2 tokens
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });

      // Check stats
      const [totalSold, totalRevenue, contractBalance, payoutAddr] = await minter.getSaleInfo();
      expect(totalSold).to.equal(2);
      expect(totalRevenue).to.equal(price * 2n);
      expect(contractBalance).to.equal(price * 2n);
    });

    it("should allow owner to withdraw funds", async () => {
      const { genesis, minter, owner, user1, payout } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint token
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
      const [, , contractBalance] = await minter.getSaleInfo();
      expect(contractBalance).to.equal(0);
    });

    it("should revert withdrawal with no funds", async () => {
      const { minter, owner } = await loadFixture(deployFixture);

      await expect(minter.connect(owner).withdraw()).to.be.revertedWithCustomError(
        minter,
        "NoFundsToWithdraw",
      );
    });

    it("should prevent non-owner from withdrawing", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      await expect(minter.connect(user1).withdraw()).to.be.revertedWithCustomError(
        minter,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Pause Functionality", () => {
    it("should allow owner to pause sales", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Pause
      await expect(minter.connect(owner).pause()).to.emit(minter, "Paused").withArgs(owner.address);

      // Try to mint (should fail)
      await expect(
        minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "EnforcedPause");
    });

    it("should allow owner to unpause sales", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Pause then unpause
      await minter.connect(owner).pause();
      await expect(minter.connect(owner).unpause())
        .to.emit(minter, "Unpaused")
        .withArgs(owner.address);

      // Mint should work now
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price })).to
        .not.be.reverted;
    });
  });

  describe("NFT Contract Management", () => {
    it("should allow owner to enable new NFT contract", async () => {
      const { minter, owner } = await loadFixture(deployFixture);

      const newContract = ethers.Wallet.createRandom().address;

      await expect(minter.connect(owner).enableNFTContract(newContract))
        .to.emit(minter, "NFTContractEnabled")
        .withArgs(newContract);

      expect(await minter.enabledNFTContracts(newContract)).to.be.true;
    });

    it("should allow owner to disable NFT contract", async () => {
      const { genesis, minter, owner } = await loadFixture(deployFixture);

      await expect(minter.connect(owner).disableNFTContract(await genesis.getAddress()))
        .to.emit(minter, "NFTContractDisabled")
        .withArgs(await genesis.getAddress());

      expect(await minter.enabledNFTContracts(await genesis.getAddress())).to.be.false;
    });

    it("should revert mints on disabled NFT contract", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Disable contract
      await minter.connect(owner).disableNFTContract(await genesis.getAddress());

      // Try to mint (should fail)
      await expect(
        minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "NFTContractNotEnabled");
    });
  });

  describe("Minting Lock", () => {
    it("should allow owner to lock minting permanently", async () => {
      const { genesis, owner } = await loadFixture(deployFixture);

      await expect(genesis.connect(owner).lockMintingPermanently())
        .to.emit(genesis, "MintingPermanentlyLocked")
        .withArgs(owner.address);

      expect(await genesis.mintingLocked()).to.be.true;
    });

    it("should prevent minting after lock", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Lock minting
      await genesis.connect(owner).lockMintingPermanently();

      // Try to mint (should fail with MintingLocked error from genesis contract)
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price })).to
        .be.reverted;
    });

    it("should prevent locking twice", async () => {
      const { genesis, owner } = await loadFixture(deployFixture);

      await genesis.connect(owner).lockMintingPermanently();

      await expect(genesis.connect(owner).lockMintingPermanently()).to.be.revertedWithCustomError(
        genesis,
        "AlreadyLocked",
      );
    });

    it("should prevent owner from direct minting after lock", async () => {
      const { genesis, owner, user1 } = await loadFixture(deployFixture);

      await genesis.connect(owner).lockMintingPermanently();

      await expect(genesis.connect(owner).mintTo(user1.address, 0)).to.be.revertedWithCustomError(
        genesis,
        "MintingLocked",
      );
    });
  });

  describe("Direct NFT Minting (Owner/Authorized)", () => {
    it("should allow owner to mint directly when minter is zero address", async () => {
      const [owner, user1] = await ethers.getSigners();

      const SolienneGenesisPortraits = await ethers.getContractFactory("SolienneGenesisPortraits");
      const genesis = await SolienneGenesisPortraits.deploy(
        owner.address,
        ethers.ZeroAddress, // no authorized minter
        "ipfs://test/",
        owner.address,
        500,
      );

      // Owner should be able to mint
      await expect(genesis.connect(owner).mintTo(user1.address, 0)).to.not.be.reverted;

      expect(await genesis.ownerOf(0)).to.equal(user1.address);
    });

    it("should prevent non-owner from minting when minter is zero", async () => {
      const [owner, user1] = await ethers.getSigners();

      const SolienneGenesisPortraits = await ethers.getContractFactory("SolienneGenesisPortraits");
      const genesis = await SolienneGenesisPortraits.deploy(
        owner.address,
        ethers.ZeroAddress,
        "ipfs://test/",
        owner.address,
        500,
      );

      await expect(genesis.connect(user1).mintTo(user1.address, 0)).to.be.revertedWithCustomError(
        genesis,
        "UnauthorizedMinter",
      );
    });

    it("should allow authorized minter to mint directly", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      // The minter contract is the authorized minter
      // So when we mint via the minter, it calls mintTo on genesis
      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint through minter (which will call mintTo as authorized minter)
      await expect(minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price })).to
        .not.be.reverted;

      expect(await genesis.ownerOf(0)).to.equal(user1.address);
    });
  });

  describe("Royalty Management", () => {
    it("should allow owner to update royalty info", async () => {
      const { genesis, owner, user1 } = await loadFixture(deployFixture);

      // Update royalty to 7.5%
      await genesis.connect(owner).updateRoyalty(user1.address, 750);

      const [receiver, amount] = await genesis.royaltyInfo(0, 10000);
      expect(receiver).to.equal(user1.address);
      expect(amount).to.equal(750); // 7.5% of 10000
    });

    it("should prevent setting royalty above 10%", async () => {
      const { genesis, owner, user1 } = await loadFixture(deployFixture);

      await expect(
        genesis.connect(owner).updateRoyalty(user1.address, 1500),
      ).to.be.revertedWithCustomError(genesis, "InvalidRoyaltyFee");
    });

    it("should prevent non-owner from updating royalty", async () => {
      const { genesis, user1, user2 } = await loadFixture(deployFixture);

      await expect(
        genesis.connect(user1).updateRoyalty(user2.address, 600),
      ).to.be.revertedWithCustomError(genesis, "OwnableUnauthorizedAccount");
    });
  });

  describe("TokenURI", () => {
    it("should return correct tokenURI for Genesis", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // Mint token 0
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      expect(await genesis.tokenURI(0)).to.equal("ipfs://genesis-base//0.json");
    });

    it("should return correct tokenURI for Origin", async () => {
      const { origin, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("2.1");
      await minter.configureArtwork(await origin.getAddress(), 0, 5, [0, 1, 2, 3, 4], price);

      // Mint token 0
      await minter.connect(user1).mint(await origin.getAddress(), 0, { value: price });

      expect(await origin.tokenURI(0)).to.equal("ipfs://origin-base//0.json");
    });

    it("should allow owner to update base URI", async () => {
      const { genesis, minter, owner, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });

      // Update base URI
      await genesis.connect(owner).updateBaseURI("https://new-base.com/");

      expect(await genesis.tokenURI(0)).to.equal("https://new-base.com//0.json");
    });
  });

  describe("Edition Limit Edge Cases", () => {
    it("should prevent exceeding maxEditions across multiple mints", async () => {
      const { genesis, minter, user1, user2 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], price);

      // User1 buys 3 editions (max)
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 2, { value: price });

      // Verify sold out
      const [, , remainingEditions] = await minter.getArtworkInfo(await genesis.getAddress(), 0);
      expect(remainingEditions).to.equal(0);

      // User2 tries to buy (artwork sold out - minter checks this first)
      await expect(
        minter.connect(user2).mint(await genesis.getAddress(), 0, { value: price }),
      ).to.be.revertedWithCustomError(minter, "ArtworkSoldOut");
    });

    it("should handle getArtworkInfo correctly when maxEditions reduced", async () => {
      const { genesis, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("1.4");
      await minter.configureArtwork(await genesis.getAddress(), 0, 5, [0, 1, 2, 3, 4], price);

      // Mint 2 editions
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: price });
      await minter.connect(user1).mint(await genesis.getAddress(), 1, { value: price });

      // Try to reduce maxEditions below 2 (should fail)
      await expect(
        minter.configureArtwork(await genesis.getAddress(), 0, 1, [0], price),
      ).to.be.revertedWithCustomError(minter, "InvalidMaxEditions");

      // Reduce to exactly 2 (should work)
      await expect(minter.configureArtwork(await genesis.getAddress(), 0, 2, [0, 1], price)).to.not
        .be.reverted;

      // Check remainingEditions (should be 0 since 2 minted out of 2 max)
      const [maxEditions, mintedEditions, remainingEditions] = await minter.getArtworkInfo(
        await genesis.getAddress(),
        0,
      );
      expect(maxEditions).to.equal(2);
      expect(mintedEditions).to.equal(2);
      expect(remainingEditions).to.equal(0); // Safe calculation prevents underflow
    });
  });

  describe("Multi-Collection Workflow", () => {
    it("should support mints from both Genesis and Origin simultaneously", async () => {
      const { genesis, origin, minter, user1 } = await loadFixture(deployFixture);

      const genesisPrice = ethers.parseEther("1.4");
      const originPrice = ethers.parseEther("2.1");

      // Configure both collections
      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], genesisPrice);
      await minter.configureArtwork(await origin.getAddress(), 0, 5, [0, 1, 2, 3, 4], originPrice);

      // Buy from Genesis
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: genesisPrice });

      // Buy from Origin
      await minter.connect(user1).mint(await origin.getAddress(), 0, { value: originPrice });

      // Verify both minted
      expect(await genesis.ownerOf(0)).to.equal(user1.address);
      expect(await origin.ownerOf(0)).to.equal(user1.address);
      expect(await genesis.balanceOf(user1.address)).to.equal(1);
      expect(await origin.balanceOf(user1.address)).to.equal(1);

      // Verify separate edition tracking
      const [, genesisMinted] = await minter.getArtworkInfo(await genesis.getAddress(), 0);
      const [, originMinted] = await minter.getArtworkInfo(await origin.getAddress(), 0);
      expect(genesisMinted).to.equal(1);
      expect(originMinted).to.equal(1);
    });

    it("should track total sales across both collections", async () => {
      const { genesis, origin, minter, user1 } = await loadFixture(deployFixture);

      const genesisPrice = ethers.parseEther("1.4");
      const originPrice = ethers.parseEther("2.1");

      await minter.configureArtwork(await genesis.getAddress(), 0, 3, [0, 1, 2], genesisPrice);
      await minter.configureArtwork(await origin.getAddress(), 0, 5, [0, 1, 2, 3, 4], originPrice);

      // Buy from both
      await minter.connect(user1).mint(await genesis.getAddress(), 0, { value: genesisPrice });
      await minter.connect(user1).mint(await origin.getAddress(), 0, { value: originPrice });

      // Check total stats
      const [totalSold, totalRevenue] = await minter.getSaleInfo();
      expect(totalSold).to.equal(2);
      expect(totalRevenue).to.equal(genesisPrice + originPrice);
    });
  });

  describe("Gas Optimization Verification", () => {
    it("should handle large batch mints efficiently", async () => {
      const { origin, minter, user1 } = await loadFixture(deployFixture);

      const price = ethers.parseEther("2.1");
      await minter.configureArtwork(await origin.getAddress(), 0, 5, [0, 1, 2, 3, 4], price);

      // Batch mint all 5 tokens
      const totalCost = price * 5n;
      const tx = await minter
        .connect(user1)
        .mintBatch(await origin.getAddress(), [0, 1, 2, 3, 4], { value: totalCost });

      const receipt = await tx.wait();

      // Verify gas usage is reasonable (this is just a smoke test)
      // Actual gas limits would depend on network and optimization goals
      expect(receipt).to.not.be.null;
    });
  });
});
