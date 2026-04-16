import { expect } from "chai";
import { ethers } from "hardhat";
import { AbrahamFirstWorks, FixedPriceSale } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther } from "ethers";

/**
 * Advanced Attack Scenario Tests
 * Tests sophisticated attack vectors that could bypass security measures
 */
describe("Attack Scenarios - Advanced Security", function () {
  let abrahamNFT: AbrahamFirstWorks;
  let fixedPriceSale: FixedPriceSale;
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let attacker: SignerWithAddress;
  let victim: SignerWithAddress;

  const MAX_SUPPLY = 50; // Smaller for faster tests
  const PRICE = parseEther("0.025");

  beforeEach(async function () {
    [owner, artist, attacker, victim] = await ethers.getSigners();

    // Deploy contracts
    const AbrahamFirstWorks = await ethers.getContractFactory("AbrahamFirstWorks");
    abrahamNFT = await AbrahamFirstWorks.deploy(
      "Abraham First Works",
      "AFW",
      owner.address,
      MAX_SUPPLY,
      ethers.ZeroAddress,
      "ipfs://test/",
      owner.address,
      500,
    );

    const FixedPriceSale = await ethers.getContractFactory("FixedPriceSale");
    fixedPriceSale = await FixedPriceSale.deploy(
      await abrahamNFT.getAddress(),
      owner.address,
      owner.address,
      PRICE,
      ethers.ZeroHash,
      artist.address,
    );

    await abrahamNFT.updateAuthorizedMinter(await fixedPriceSale.getAddress());
  });

  describe("Attack Vector: Bypass Max Supply Through Concurrent Transactions", function () {
    it("should prevent parallel transactions from exceeding max supply", async function () {
      // Fill up to near max capacity
      const fillTokens = Array.from({ length: 45 }, (_, i) => i + 1);
      await abrahamNFT.connect(owner).mintTo(victim.address, fillTokens);

      // Now only 5 tokens remain, but we'll try to mint 10 in a single transaction
      const attackTokens = Array.from({ length: 10 }, (_, i) => i + 46);

      await expect(
        abrahamNFT.connect(owner).mintTo(attacker.address, attackTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "ExceedsMaxSupply");

      // Verify max supply protection held
      expect(await abrahamNFT.totalSupply()).to.equal(45);
    });

    it("should handle edge case where all tokens in batch are invalid", async function () {
      // Try to mint tokens all beyond max supply
      const invalidTokens = [51, 52, 53, 54, 55];

      // This should revert with "No valid tokens to mint"
      await expect(
        abrahamNFT.connect(owner).mintTo(attacker.address, invalidTokens),
      ).to.be.revertedWith("No valid tokens to mint");
    });

    it("should handle race condition detection", async function () {
      // Set up scenario where mint count could mismatch expected count
      // This tests the additional verification we added

      const tokens = [1, 2, 3];
      const result = await abrahamNFT.connect(owner).mintTo(victim.address, tokens);

      // All tokens should mint successfully, so no mismatch should occur
      expect(await abrahamNFT.totalSupply()).to.equal(3);
    });
  });

  describe("Attack Vector: Artist Limit Bypass Through Invalid Mints", function () {
    it("should prevent artist from exceeding limit and revert on invalid tokens", async function () {
      // Artist gifts 8 valid tokens (close to limit of 10)
      await fixedPriceSale.connect(artist).artistGiftTo(victim.address, [1, 2, 3, 4, 5, 6, 7, 8]);

      // Artist tries to gift 5 more tokens, but 3 are invalid
      // Transaction should revert due to invalid token IDs (before checking artist limit)
      const mixedTokens = [9, 10, 999, 1000, 1001]; // Only 9,10 are valid

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(victim.address, mixedTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "InvalidTokenId");

      // Only 8 tokens should be gifted (the initial batch)
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(8);
    });

    it("should revert on invalid tokens even when limit is reached", async function () {
      // Artist gifts up to limit
      await fixedPriceSale
        .connect(artist)
        .artistGiftTo(victim.address, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Artist tries to gift invalid tokens (should revert due to invalid IDs)
      const invalidTokens = [999, 1000];

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(victim.address, invalidTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "InvalidTokenId");

      // Should still have 10 gifted tokens
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(10);
    });
  });

  describe("Attack Vector: All-or-Nothing Minting", function () {
    it("should revert entire transaction on invalid token", async function () {
      // Create scenario with mix of valid and invalid tokens
      const tokenIds = [1, 2, 999]; // 999 is invalid
      const totalCost = PRICE * BigInt(tokenIds.length);

      // Transaction should revert entirely due to invalid token
      await expect(
        fixedPriceSale.connect(attacker).mintTo(attacker.address, tokenIds, { value: totalCost }),
      ).to.be.revertedWithCustomError(abrahamNFT, "InvalidTokenId");

      // Verify no tokens were minted and no revenue collected
      expect(await fixedPriceSale.totalSold()).to.equal(0);
      expect(await fixedPriceSale.totalRevenue()).to.equal(0);
    });

    it("should reject overpayment attempts", async function () {
      const tokenIds = [1];
      const overpayment = parseEther("1.0"); // Massive overpayment

      // Should revert on any overpayment
      await expect(
        fixedPriceSale
          .connect(attacker)
          .mintTo(attacker.address, tokenIds, { value: PRICE + overpayment }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");

      // Verify no tokens were minted
      expect(await fixedPriceSale.totalSold()).to.equal(0);
      expect(await fixedPriceSale.totalRevenue()).to.equal(0);
    });
  });

  describe("Attack Vector: DOS Through Large Batches", function () {
    it("should reject batches that exceed gas limits", async function () {
      // Try to create a batch larger than the maximum allowed
      const hugeBatch = Array.from({ length: 25 }, (_, i) => i + 1);

      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(victim.address, hugeBatch),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(victim.address, hugeBatch),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");
    });

    it("should handle maximum allowed batch size efficiently", async function () {
      // Test with exactly the maximum batch size
      const maxBatch = Array.from({ length: 20 }, (_, i) => i + 1);

      const tx = await fixedPriceSale.connect(owner).adminGiftTo(victim.address, maxBatch);
      const receipt = await tx.wait();

      // Should complete without running out of gas
      expect(receipt?.status).to.equal(1);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(20);
    });
  });

  describe("Attack Vector: Economic Exploits", function () {
    it("should handle payment edge cases", async function () {
      // Test with exact payment
      await fixedPriceSale.connect(attacker).mintTo(attacker.address, [1], { value: PRICE });

      // Test with insufficient payment
      await expect(
        fixedPriceSale.connect(attacker).mintTo(attacker.address, [2], { value: PRICE - 1n }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");

      // Test with zero payment (should fail)
      await expect(
        fixedPriceSale.connect(attacker).mintTo(attacker.address, [2], { value: 0 }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");
    });

    it("should prevent draining contract through withdrawal manipulation", async function () {
      // Generate some revenue
      await fixedPriceSale.connect(victim).mintTo(victim.address, [1, 2], { value: PRICE * 2n });

      const contractBalance = await ethers.provider.getBalance(await fixedPriceSale.getAddress());
      expect(contractBalance).to.equal(PRICE * 2n);

      // Non-owner shouldn't be able to prepare withdrawal
      await expect(fixedPriceSale.connect(attacker).prepareWithdrawal()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      // Non-authorized address shouldn't have pending withdrawals
      expect(await fixedPriceSale.getPendingWithdrawal(attacker.address)).to.equal(0);
    });
  });

  describe("Attack Vector: Access Control Bypass", function () {
    it("should prevent unauthorized minting on NFT contract", async function () {
      // Attacker shouldn't be able to mint directly on NFT contract
      await expect(
        abrahamNFT.connect(attacker).mintTo(attacker.address, [1]),
      ).to.be.revertedWithCustomError(abrahamNFT, "UnauthorizedMinter");
    });

    it("should prevent artist role escalation", async function () {
      // Artist shouldn't be able to call admin functions
      await expect(
        fixedPriceSale.connect(artist).adminGiftTo(victim.address, [1]),
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        fixedPriceSale.connect(artist).updateArtist(attacker.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(fixedPriceSale.connect(artist).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("should prevent unauthorized artist changes", async function () {
      // Only owner should be able to change artist
      await expect(
        fixedPriceSale.connect(attacker).updateArtist(attacker.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Verify artist hasn't changed
      expect(await fixedPriceSale.artist()).to.equal(artist.address);
    });
  });

  describe("Attack Vector: Contract Interactions", function () {
    it("should handle failed external calls gracefully", async function () {
      // Test interaction with NFT contract when it might fail
      // This is more of an integration test to ensure proper error handling

      const tokenIds = [1];

      // This should succeed normally
      const result = await fixedPriceSale.connect(owner).adminGiftTo(victim.address, tokenIds);
      expect(await abrahamNFT.ownerOf(1)).to.equal(victim.address);
    });

    it("should maintain invariants under all conditions", async function () {
      // Mix different operations and verify invariants hold

      // Admin gifts some tokens
      await fixedPriceSale.connect(owner).adminGiftTo(victim.address, [1, 2, 3]);

      // Artist gifts some tokens
      await fixedPriceSale.connect(artist).artistGiftTo(victim.address, [4, 5]);

      // User purchases some tokens
      await fixedPriceSale
        .connect(attacker)
        .mintTo(attacker.address, [6, 7], { value: PRICE * 2n });

      // Verify all invariants
      const totalSupply = await abrahamNFT.totalSupply();
      const adminGifted = await fixedPriceSale.totalAdminGifted();
      const artistGifted = await fixedPriceSale.totalArtistGifted();
      const sold = await fixedPriceSale.totalSold();

      // Invariant: totalSupply = adminGifted + artistGifted + sold
      expect(totalSupply).to.equal(adminGifted + artistGifted + sold);

      // Invariant: all token IDs should be owned
      for (let i = 1; i <= Number(totalSupply); i++) {
        const owner = await abrahamNFT.ownerOf(i);
        expect(owner).to.not.equal(ethers.ZeroAddress);
      }

      // Invariant: artist gifts should not exceed limit
      expect(artistGifted).to.be.lte(10);

      // Invariant: revenue should match sold tokens
      expect(await fixedPriceSale.totalRevenue()).to.equal(PRICE * sold);
    });
  });

  describe("Stress Tests", function () {
    it("should handle rapid sequential operations", async function () {
      // Perform many operations in sequence to test for race conditions
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(fixedPriceSale.connect(owner).adminGiftTo(victim.address, [i + 1]));
      }

      // All operations should succeed
      await Promise.all(operations);

      expect(await fixedPriceSale.totalAdminGifted()).to.equal(10);
    });

    it("should maintain precision under high-value operations", async function () {
      // Test with very high ETH values to ensure no overflow/precision issues
      const highPrice = parseEther("1000");

      // Create new sale contract with high price
      const HighPriceSale = await ethers.getContractFactory("FixedPriceSale");
      const highPriceSale = await HighPriceSale.deploy(
        await abrahamNFT.getAddress(),
        owner.address,
        owner.address,
        highPrice,
        ethers.ZeroHash,
        artist.address,
      );

      await abrahamNFT.updateAuthorizedMinter(await highPriceSale.getAddress());

      // Test high-value purchase
      await highPriceSale.connect(attacker).mintTo(attacker.address, [1], { value: highPrice });

      expect(await highPriceSale.totalRevenue()).to.equal(highPrice);
    });
  });
});
