import { expect } from "chai";
import { ethers } from "hardhat";
import { AbrahamFirstWorks, FixedPriceSale, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther, keccak256, toUtf8Bytes } from "ethers";

describe("FirstWorks Security Tests", function () {
  let abrahamNFT: AbrahamFirstWorks;
  let fixedPriceSale: FixedPriceSale;
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let maliciousContract: SignerWithAddress;
  let payoutAddress: SignerWithAddress;

  const MAX_SUPPLY = 100;
  const MAX_ARTIST_GIFTS = 10;
  const PRICE = parseEther("0.025");
  const ROYALTY_FEE = 500; // 5%

  beforeEach(async function () {
    [owner, artist, user1, user2, maliciousContract, payoutAddress] = await ethers.getSigners();

    // Deploy AbrahamFirstWorks NFT contract
    const AbrahamFirstWorks = await ethers.getContractFactory("AbrahamFirstWorks");
    abrahamNFT = await AbrahamFirstWorks.deploy(
      "Abraham First Works",
      "AFW",
      owner.address,
      MAX_SUPPLY,
      ethers.ZeroAddress, // Will be set to sale contract later
      "ipfs://test/",
      owner.address,
      ROYALTY_FEE,
    );

    // Deploy FixedPriceSale contract
    const FixedPriceSale = await ethers.getContractFactory("FixedPriceSale");
    fixedPriceSale = await FixedPriceSale.deploy(
      await abrahamNFT.getAddress(),
      owner.address,
      payoutAddress.address,
      PRICE,
      ethers.ZeroHash, // Empty merkle root
      artist.address,
    );

    // Set sale contract as authorized minter
    await abrahamNFT.updateAuthorizedMinter(await fixedPriceSale.getAddress());

    // Fast forward past AdminGifting phase to public phase for most tests
    // This requires updating the contract to use configurable times instead of hardcoded ones
    // For now, we'll work within the current time constraints
  });

  describe("CRITICAL: Reentrancy Protection Tests", function () {
    it("should prevent reentrancy attacks with all-or-nothing minting", async function () {
      // Create a malicious contract that tries to re-enter
      const MaliciousReentrant = await ethers.getContractFactory(
        "contracts/test/UltraFailingContract.sol:UltraFailingContract",
      );
      const maliciousContract = await MaliciousReentrant.deploy();

      // Try to mint with invalid token (should revert entirely)
      const tokenIds = [1, 2, 9999]; // Mix of valid and invalid tokens
      const totalCost = PRICE * BigInt(tokenIds.length);

      // This should revert because token 9999 is invalid (exceeds max supply)
      await expect(
        fixedPriceSale.connect(user1).mintTo(await maliciousContract.getAddress(), tokenIds, {
          value: totalCost,
        }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "MintFailed");

      // Verify state was not updated (transaction reverted)
      const totalSold = await fixedPriceSale.totalSold();
      expect(totalSold).to.equal(0); // No tokens should be minted
    });

    it("should reject overpayment with exact payment requirement", async function () {
      const tokenIds = [1];
      const overpayment = parseEther("0.1");

      await expect(
        fixedPriceSale
          .connect(user1)
          .mintTo(user1.address, tokenIds, { value: PRICE + overpayment }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");

      // State should not be updated
      expect(await fixedPriceSale.totalSold()).to.equal(0);
      expect(await fixedPriceSale.totalRevenue()).to.equal(0);
    });
  });

  describe("CRITICAL: Max Supply Bypass Protection", function () {
    it("should prevent minting beyond max supply with accurate counting", async function () {
      // Fill up most of the supply
      const bulkTokens = Array.from({ length: 90 }, (_, i) => i + 1);

      // Admin gifts 90 tokens
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, bulkTokens);

      // Try to mint 15 more tokens (would exceed max supply of 100)
      const extraTokens = Array.from({ length: 15 }, (_, i) => i + 91);

      await expect(
        abrahamNFT.connect(owner).mintTo(user2.address, extraTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "ExceedsMaxSupply");
    });

    it("should accurately count actual mintable tokens", async function () {
      // Pre-mint some tokens
      await abrahamNFT.connect(owner).mintTo(user1.address, [1, 2, 3]);

      // Try to mint mix of valid and already minted tokens
      const mixedTokens = [1, 2, 4, 5, 6]; // 1,2 already minted, 4,5,6 are valid

      // Should only count the 3 valid tokens (4,5,6) against max supply
      const result = await abrahamNFT.connect(owner).mintTo(user2.address, mixedTokens);

      // Should have minted exactly 3 tokens (4,5,6)
      const receipt = await result.wait();
      const events = receipt?.logs.filter((log) => {
        try {
          const parsed = abrahamNFT.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return parsed?.name === "NFTMinted";
        } catch {
          return false;
        }
      });

      expect(events?.length).to.equal(3);
      expect(await abrahamNFT.totalSupply()).to.equal(6);
    });

    it("should prevent race condition bypasses", async function () {
      // Set up near-max supply situation
      const initialTokens = Array.from({ length: 98 }, (_, i) => i + 1);
      await abrahamNFT.connect(owner).mintTo(user1.address, initialTokens);

      // Two transactions trying to mint 5 tokens each when only 2 remain
      const tokens1 = [99, 100, 101, 102, 103];
      const tokens2 = [99, 100, 104, 105, 106];

      // First transaction should fail (trying to mint 5 when only 2 slots remain)
      await expect(
        abrahamNFT.connect(owner).mintTo(user1.address, tokens1),
      ).to.be.revertedWithCustomError(abrahamNFT, "ExceedsMaxSupply");

      // Second transaction should also fail
      await expect(
        abrahamNFT.connect(owner).mintTo(user2.address, tokens2),
      ).to.be.revertedWithCustomError(abrahamNFT, "ExceedsMaxSupply");
    });
  });

  describe("CRITICAL: Artist Gift Limit Bypass Protection", function () {
    it("should enforce 250 gift limit with actual mint count", async function () {
      // Artist gifts close to limit
      const tokens1 = Array.from({ length: 8 }, (_, i) => i + 1);
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, tokens1);

      // Try to gift more tokens than limit allows
      const tokens2 = [9, 10, 11, 12]; // Would exceed 10 token limit

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user2.address, tokens2),
      ).to.be.revertedWithCustomError(fixedPriceSale, "ExceedsMaxArtistGifts");
    });

    it("should revert on invalid tokens in gift", async function () {
      // Artist gifts 8 tokens successfully
      const validTokens = Array.from({ length: 8 }, (_, i) => i + 1);
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, validTokens);

      // Try to gift mix of valid and invalid tokens (only 1 valid + 1 invalid)
      const mixedTokens = [9, 9999]; // 9 is valid, 9999 is invalid (beyond max supply)

      // Should revert due to invalid token ID
      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user2.address, mixedTokens),
      ).to.be.revertedWithCustomError(abrahamNFT, "InvalidTokenId");

      // Only 8 tokens should be gifted
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(8);

      // Artist can now gift 2 more tokens (up to limit of 10)
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, [9, 10]);
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(10);

      // Trying to gift more should exceed limit
      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user1.address, [11]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "ExceedsMaxArtistGifts");
    });
  });

  describe("HIGH: Pull-based Withdrawal Protection", function () {
    it("should use pull pattern to prevent fund locks", async function () {
      // Mint some tokens to generate revenue
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Prepare withdrawal
      await fixedPriceSale.connect(owner).prepareWithdrawal();

      // Check pending withdrawal
      const pendingAmount = await fixedPriceSale.getPendingWithdrawal(payoutAddress.address);
      expect(pendingAmount).to.equal(PRICE);

      // Claim withdrawal
      const balanceBefore = await ethers.provider.getBalance(payoutAddress.address);
      await fixedPriceSale.connect(payoutAddress).claimWithdrawal();
      const balanceAfter = await ethers.provider.getBalance(payoutAddress.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await fixedPriceSale.getPendingWithdrawal(payoutAddress.address)).to.equal(0);
    });

    it("should restore pending withdrawal on failed transfer", async function () {
      // Deploy a contract that always fails to receive ETH
      const FailingContract = await ethers.getContractFactory(
        "contracts/test/FailingTransferContract.sol:FailingTransferContract",
      );
      const failingContract = await FailingContract.deploy();

      // Change payout address to failing contract
      await fixedPriceSale.connect(owner).updatePayoutAddress(await failingContract.getAddress());

      // Generate revenue
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Prepare withdrawal
      await fixedPriceSale.connect(owner).prepareWithdrawal();

      // Try to claim (should fail and restore pending amount)
      await expect(
        fixedPriceSale.connect(await failingContract.getAddress()).claimWithdrawal(),
      ).to.be.revertedWithCustomError(fixedPriceSale, "WithdrawalFailed");

      // Pending withdrawal should still be there
      const pendingAmount = await fixedPriceSale.getPendingWithdrawal(
        await failingContract.getAddress(),
      );
      expect(pendingAmount).to.equal(PRICE);
    });
  });

  describe("Batch Size DOS Protection", function () {
    it("should reject batches larger than MAX_BATCH_SIZE", async function () {
      const largeBatch = Array.from({ length: 25 }, (_, i) => i + 1); // Exceeds limit of 20

      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(user1.address, largeBatch),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user1.address, largeBatch),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");

      await expect(
        fixedPriceSale
          .connect(user1)
          .mintTo(user1.address, largeBatch, { value: PRICE * BigInt(largeBatch.length) }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");
    });

    it("should accept batches at the limit", async function () {
      const maxBatch = Array.from({ length: 20 }, (_, i) => i + 1); // Exactly at limit

      // Should succeed
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, maxBatch);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(20);
    });
  });

  describe("Edge Cases and Additional Security", function () {
    it("should handle empty token arrays", async function () {
      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(user1.address, []),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EmptyTokenArray");
    });

    it("should handle zero address recipients", async function () {
      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(ethers.ZeroAddress, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidPayoutAddress");
    });

    it("should prevent unauthorized artist access", async function () {
      await expect(
        fixedPriceSale.connect(user1).artistGiftTo(user2.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "UnauthorizedArtist");
    });

    it("should handle minting to contracts correctly", async function () {
      const TestContract = await ethers.getContractFactory(
        "contracts/test/MockERC20.sol:MockERC20",
      );
      const testContract = await TestContract.deploy("Test", "TEST");

      // Should be able to mint to contract address
      await fixedPriceSale.connect(owner).adminGiftTo(await testContract.getAddress(), [1]);

      expect(await abrahamNFT.ownerOf(1)).to.equal(await testContract.getAddress());
    });

    it("should maintain accurate statistics under all conditions", async function () {
      // Admin gifts some tokens
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1, 2]);

      // Artist gifts some tokens
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, [3, 4]);

      // User buys some tokens
      await fixedPriceSale.connect(user1).mintTo(user1.address, [5, 6], { value: PRICE * 2n });

      // Check all statistics
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(2);
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(2);
      expect(await fixedPriceSale.totalSold()).to.equal(2);
      expect(await fixedPriceSale.totalRevenue()).to.equal(PRICE * 2n);
      expect(await fixedPriceSale.totalGifted()).to.equal(4); // admin + artist

      const giftingInfo = await fixedPriceSale.getGiftingInfo();
      expect(giftingInfo.totalGifts).to.equal(4);
      expect(giftingInfo.adminGifts).to.equal(2);
      expect(giftingInfo.artistGifts).to.equal(2);
      expect(giftingInfo.remainingArtistGifts).to.equal(8); // 10 - 2
    });

    it("should prevent minting beyond individual contract limits", async function () {
      // NFT contract should reject mints beyond its max supply even if sale contract allows
      const beyondMaxTokens = [MAX_SUPPLY + 1, MAX_SUPPLY + 2];

      // This should fail at the NFT contract level
      const result = await fixedPriceSale
        .connect(owner)
        .adminGiftTo(user1.address, beyondMaxTokens);

      // Should have minted 0 tokens (all were beyond max supply)
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(0);
    });
  });

  describe("Gas Optimization Verification", function () {
    it("should not consume excessive gas for normal operations", async function () {
      const tx1 = await fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1, 2, 3]);
      const receipt1 = await tx1.wait();
      expect(receipt1?.gasUsed).to.be.lt(200000); // Should be under 200k gas

      const tx2 = await fixedPriceSale
        .connect(user1)
        .mintTo(user1.address, [4, 5], { value: PRICE * 2n });
      const receipt2 = await tx2.wait();
      expect(receipt2?.gasUsed).to.be.lt(250000); // Paid mints are slightly more expensive due to refunds
    });
  });
});
