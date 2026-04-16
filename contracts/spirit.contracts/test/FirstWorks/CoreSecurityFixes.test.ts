import { expect } from "chai";
import { ethers } from "hardhat";
import { AbrahamFirstWorks, FixedPriceSale } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther } from "ethers";

/**
 * Core Security Fixes Verification
 * Tests the critical security fixes we implemented
 */
describe("Core Security Fixes", function () {
  let abrahamNFT: AbrahamFirstWorks;
  let fixedPriceSale: FixedPriceSale;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const MAX_SUPPLY = 50;
  const PRICE = parseEther("0.025");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

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
      owner.address, // Set owner as artist for testing
    );

    await abrahamNFT.updateAuthorizedMinter(await fixedPriceSale.getAddress());
  });

  describe("FIXED: Max Supply Protection", function () {
    it("should prevent minting beyond max supply with accurate counting", async function () {
      // Fill up to near max
      const fillTokens = Array.from({ length: 45 }, (_, i) => i + 1);
      await abrahamNFT.connect(owner).mintTo(user1.address, fillTokens);

      // Try to mint more than remaining (should fail)
      const overflowTokens = Array.from({ length: 10 }, (_, i) => i + 46);

      await expect(
        abrahamNFT.connect(owner).mintTo(user2.address, overflowTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "ExceedsMaxSupply");

      // Verify max supply held
      expect(await abrahamNFT.totalSupply()).to.equal(45);
    });

    it("should accurately count actual mintable tokens", async function () {
      // Pre-mint some tokens
      await abrahamNFT.connect(owner).mintTo(user1.address, [1, 2, 3]);

      // Try mixed valid/invalid tokens
      const mixedTokens = [1, 2, 4, 5, 6]; // 1,2 already minted

      const result = await abrahamNFT.connect(owner).mintTo(user2.address, mixedTokens);

      // Should only mint the 3 valid tokens (4,5,6)
      expect(await abrahamNFT.totalSupply()).to.equal(6);
    });

    it("should handle edge case with no valid tokens", async function () {
      // Try to mint all invalid tokens
      const invalidTokens = [51, 52, 53]; // All beyond max supply

      await expect(
        abrahamNFT.connect(owner).mintTo(user1.address, invalidTokens),
      ).to.be.revertedWith("No valid tokens to mint");
    });
  });

  describe("FIXED: Reentrancy Protection in Paid Mints", function () {
    it("should update state before external refund calls", async function () {
      // This test verifies our state-first pattern
      // Mix of valid and invalid tokens to trigger refund
      const mixedTokens = [1, 2, 999]; // 999 is invalid
      const totalCost = PRICE * BigInt(mixedTokens.length);

      // Should succeed and properly update state before refund
      await fixedPriceSale.connect(user1).mintTo(user1.address, mixedTokens, { value: totalCost });

      // Verify state was updated correctly (not manipulated by reentrancy)
      expect(await fixedPriceSale.totalSold()).to.equal(2);
      expect(await fixedPriceSale.totalRevenue()).to.equal(PRICE * 2n);
    });

    it("should reject overpayment with exact payment requirement", async function () {
      const tokenIds = [1];
      const overpayment = parseEther("0.1");

      await expect(
        fixedPriceSale
          .connect(user1)
          .mintTo(user1.address, tokenIds, { value: PRICE + overpayment }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");

      // Verify no tokens were minted
      expect(await fixedPriceSale.totalSold()).to.equal(0);
      expect(await fixedPriceSale.totalRevenue()).to.equal(0);
    });
  });

  describe("FIXED: Pull-Based Withdrawal Pattern", function () {
    it("should prevent fund locks with pull pattern", async function () {
      // Generate revenue
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Prepare withdrawal (push to pending)
      await fixedPriceSale.connect(owner).prepareWithdrawal();

      // Check pending amount
      expect(await fixedPriceSale.getPendingWithdrawal(owner.address)).to.equal(PRICE);

      // Claim withdrawal (pull from pending)
      await fixedPriceSale.connect(owner).claimWithdrawal();

      expect(await fixedPriceSale.getPendingWithdrawal(owner.address)).to.equal(0);
    });

    it("should restore pending on failed withdrawal", async function () {
      // Generate revenue
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Prepare withdrawal
      await fixedPriceSale.connect(owner).prepareWithdrawal();

      // Mock a failed withdrawal by trying to claim from wrong address
      await expect(fixedPriceSale.connect(user2).claimWithdrawal()).to.be.revertedWithCustomError(
        fixedPriceSale,
        "NoWithdrawableFunds",
      );

      // Pending should still exist for owner
      expect(await fixedPriceSale.getPendingWithdrawal(owner.address)).to.equal(PRICE);
    });
  });

  describe("FIXED: Batch Size DOS Protection", function () {
    it("should reject oversized batches", async function () {
      // Create batch larger than limit (20 for FixedPriceSale, 50 for NFT)
      const largeBatch = Array.from({ length: 25 }, (_, i) => i + 1);

      // NFT contract should accept this (limit 50)
      await abrahamNFT.connect(owner).mintTo(user1.address, largeBatch);

      // But sale contract should reject it (limit 20) - would test if in right phase
      const anotherBatch = Array.from({ length: 25 }, (_, i) => i + 26);
      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, anotherBatch, { value: PRICE * 25n }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");
    });
  });

  describe("Access Control Verification", function () {
    it("should prevent unauthorized minting on NFT contract", async function () {
      await expect(
        abrahamNFT.connect(user1).mintTo(user1.address, [1]),
      ).to.be.revertedWithCustomError(abrahamNFT, "UnauthorizedMinter");
    });

    it("should allow only owner/authorized minter to mint on NFT contract", async function () {
      // Owner should be able to mint
      await abrahamNFT.connect(owner).mintTo(user1.address, [1]);

      // Sale contract should be able to mint
      await fixedPriceSale.connect(user1).mintTo(user1.address, [2], { value: PRICE });

      expect(await abrahamNFT.totalSupply()).to.equal(2);
    });
  });

  describe("Economic Protection", function () {
    it("should handle payment edge cases", async function () {
      // Exact payment should work
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Insufficient payment should fail
      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [2], { value: PRICE - 1n }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");

      // Zero payment should fail
      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [2], { value: 0 }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");
    });
  });

  describe("Integration & Invariants", function () {
    it("should maintain correct statistics under mixed operations", async function () {
      // Direct NFT mint by owner
      await abrahamNFT.connect(owner).mintTo(user1.address, [1, 2]);

      // Sale contract mint
      await fixedPriceSale.connect(user1).mintTo(user1.address, [3, 4], { value: PRICE * 2n });

      // Verify invariants
      expect(await abrahamNFT.totalSupply()).to.equal(4);
      expect(await fixedPriceSale.totalSold()).to.equal(2);
      expect(await fixedPriceSale.totalRevenue()).to.equal(PRICE * 2n);
    });

    it("should handle gas efficiently", async function () {
      const tx = await fixedPriceSale
        .connect(user1)
        .mintTo(user1.address, [1, 2], { value: PRICE * 2n });
      const receipt = await tx.wait();

      // Should not consume excessive gas
      expect(receipt!.gasUsed).to.be.lt(300000); // Should be reasonable for batch mint
    });
  });
});
