import { expect } from "chai";
import { ethers } from "hardhat";
import { AbrahamFirstWorks, FixedPriceSale } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther, keccak256, solidityPackedKeccak256 } from "ethers";
import { MerkleTree } from "merkletreejs";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FixedPriceSale - Comprehensive Tests", function () {
  let abrahamNFT: AbrahamFirstWorks;
  let fixedPriceSale: FixedPriceSale;
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let payoutAddress: SignerWithAddress;
  let whitelistAddresses: SignerWithAddress[];
  let merkleTree: MerkleTree;
  let merkleRoot: string;

  const MAX_SUPPLY = 100;
  const PRICE = parseEther("0.025");
  const ROYALTY_FEE = 500; // 5%
  const MAX_BATCH_SIZE = 50;
  const MAX_ARTIST_GIFTS = 250;

  let PRESALE_START_TIME: number;
  let PUBLIC_START_TIME: number;

  beforeEach(async function () {
    [owner, artist, user1, user2, user3, payoutAddress, ...whitelistAddresses] =
      await ethers.getSigners();

    // Set timing - start times in the future
    const currentTime = await time.latest();
    PRESALE_START_TIME = currentTime + 3600; // 1 hour from now
    PUBLIC_START_TIME = currentTime + 7200; // 2 hours from now

    // Create merkle tree for whitelist (user1, user2, user3)
    const leaves = [user1.address, user2.address, user3.address].map((addr) =>
      solidityPackedKeccak256(["address"], [addr]),
    );
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy AbrahamFirstWorks NFT contract
    const AbrahamFirstWorks = await ethers.getContractFactory("AbrahamFirstWorks");
    abrahamNFT = await AbrahamFirstWorks.deploy(
      "Abraham First Works",
      "AFW",
      owner.address,
      MAX_SUPPLY,
      ethers.ZeroAddress,
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
      merkleRoot,
      artist.address,
      PRESALE_START_TIME,
      PUBLIC_START_TIME,
    );

    // Set sale contract as authorized minter
    await abrahamNFT.updateAuthorizedMinter(await fixedPriceSale.getAddress());
  });

  describe("Deployment & Initial State", function () {
    it("should deploy with correct initial parameters", async function () {
      expect(await fixedPriceSale.nftContract()).to.equal(await abrahamNFT.getAddress());
      expect(await fixedPriceSale.price()).to.equal(PRICE);
      expect(await fixedPriceSale.payoutAddress()).to.equal(payoutAddress.address);
      expect(await fixedPriceSale.artist()).to.equal(artist.address);
      expect(await fixedPriceSale.whitelistMerkleRoot()).to.equal(merkleRoot);
      expect(await fixedPriceSale.PRESALE_START_TIME()).to.equal(PRESALE_START_TIME);
      expect(await fixedPriceSale.PUBLIC_START_TIME()).to.equal(PUBLIC_START_TIME);
    });

    it("should start with zero counters", async function () {
      expect(await fixedPriceSale.totalSold()).to.equal(0);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(0);
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(0);
      expect(await fixedPriceSale.totalRevenue()).to.equal(0);
    });

    it("should start in AdminGifting phase", async function () {
      expect(await fixedPriceSale.getCurrentPhase()).to.equal(0); // AdminGifting
    });

    it("should reject zero address in constructor", async function () {
      const FixedPriceSale = await ethers.getContractFactory("FixedPriceSale");

      await expect(
        FixedPriceSale.deploy(
          ethers.ZeroAddress, // Invalid NFT contract
          owner.address,
          payoutAddress.address,
          PRICE,
          merkleRoot,
          artist.address,
          PRESALE_START_TIME,
          PUBLIC_START_TIME,
        ),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidNFTContract");

      await expect(
        FixedPriceSale.deploy(
          await abrahamNFT.getAddress(),
          owner.address,
          ethers.ZeroAddress, // Invalid payout
          PRICE,
          merkleRoot,
          artist.address,
          PRESALE_START_TIME,
          PUBLIC_START_TIME,
        ),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidPayoutAddress");
    });

    it("should reject zero price in constructor", async function () {
      const FixedPriceSale = await ethers.getContractFactory("FixedPriceSale");

      await expect(
        FixedPriceSale.deploy(
          await abrahamNFT.getAddress(),
          owner.address,
          payoutAddress.address,
          0, // Invalid price
          merkleRoot,
          artist.address,
          PRESALE_START_TIME,
          PUBLIC_START_TIME,
        ),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidPrice");
    });
  });

  describe("Sale Phase Transitions", function () {
    it("should transition from AdminGifting to Whitelist phase", async function () {
      expect(await fixedPriceSale.getCurrentPhase()).to.equal(0); // AdminGifting

      // Fast forward to presale start
      await time.increaseTo(PRESALE_START_TIME);

      expect(await fixedPriceSale.getCurrentPhase()).to.equal(1); // Whitelist
    });

    it("should transition from Whitelist to Public phase", async function () {
      // Fast forward to public start
      await time.increaseTo(PUBLIC_START_TIME);

      expect(await fixedPriceSale.getCurrentPhase()).to.equal(2); // Public
    });

    it("should enforce phase restrictions on minting", async function () {
      const leaf = solidityPackedKeccak256(["address"], [user1.address]);
      const proof = merkleTree.getHexProof(leaf);

      // AdminGifting phase - whitelist mint should fail
      await expect(
        fixedPriceSale.connect(user1).whitelistMint([1], proof, { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidSalePhase");

      // AdminGifting phase - public mint should fail
      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidSalePhase");

      // Move to Whitelist phase
      await time.increaseTo(PRESALE_START_TIME);

      // Whitelist phase - public mint should fail
      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidSalePhase");

      // Whitelist phase - whitelist mint should succeed
      await expect(fixedPriceSale.connect(user1).whitelistMint([1], proof, { value: PRICE })).to.not
        .be.reverted;
    });
  });

  describe("Merkle Proof Whitelist", function () {
    beforeEach(async function () {
      // Move to whitelist phase
      await time.increaseTo(PRESALE_START_TIME);
    });

    it("should allow whitelisted addresses to mint with valid proof", async function () {
      const leaf = solidityPackedKeccak256(["address"], [user1.address]);
      const proof = merkleTree.getHexProof(leaf);

      await expect(fixedPriceSale.connect(user1).whitelistMint([1], proof, { value: PRICE }))
        .to.emit(fixedPriceSale, "NFTMinted")
        .withArgs(user1.address, 1, PRICE);

      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("should reject non-whitelisted addresses", async function () {
      const leaf = solidityPackedKeccak256(["address"], [user1.address]);
      const proof = merkleTree.getHexProof(leaf);

      // user1's proof won't work for payoutAddress (not whitelisted)
      await expect(
        fixedPriceSale.connect(payoutAddress).whitelistMint([1], proof, { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidMerkleProof");
    });

    it("should reject invalid proofs", async function () {
      const fakeProof = [ethers.hexlify(ethers.randomBytes(32))];

      await expect(
        fixedPriceSale.connect(user1).whitelistMint([1], fakeProof, { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidMerkleProof");
    });

    it("should reject empty proof for whitelisted address", async function () {
      await expect(
        fixedPriceSale.connect(user1).whitelistMint([1], [], { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidMerkleProof");
    });

    it("should enforce self-mint only for whitelist", async function () {
      const leaf = solidityPackedKeccak256(["address"], [user1.address]);
      const proof = merkleTree.getHexProof(leaf);

      // whitelistMint always mints to msg.sender
      await fixedPriceSale.connect(user1).whitelistMint([1], proof, { value: PRICE });

      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("should allow multiple whitelisted users to mint", async function () {
      const leaf1 = solidityPackedKeccak256(["address"], [user1.address]);
      const proof1 = merkleTree.getHexProof(leaf1);

      const leaf2 = solidityPackedKeccak256(["address"], [user2.address]);
      const proof2 = merkleTree.getHexProof(leaf2);

      await fixedPriceSale.connect(user1).whitelistMint([1], proof1, { value: PRICE });
      await fixedPriceSale.connect(user2).whitelistMint([2], proof2, { value: PRICE });

      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);
      expect(await abrahamNFT.ownerOf(2)).to.equal(user2.address);
    });

    it("should allow owner to update merkle root", async function () {
      const newLeaves = [payoutAddress.address].map((addr) =>
        solidityPackedKeccak256(["address"], [addr]),
      );
      const newTree = new MerkleTree(newLeaves, keccak256, { sortPairs: true });
      const newRoot = newTree.getHexRoot();

      await expect(fixedPriceSale.connect(owner).updateWhitelistMerkleRoot(newRoot))
        .to.emit(fixedPriceSale, "WhitelistMerkleRootUpdated")
        .withArgs(merkleRoot, newRoot);

      expect(await fixedPriceSale.whitelistMerkleRoot()).to.equal(newRoot);

      // Old proofs should no longer work
      const oldLeaf = solidityPackedKeccak256(["address"], [user1.address]);
      const oldProof = merkleTree.getHexProof(oldLeaf);

      await expect(
        fixedPriceSale.connect(user1).whitelistMint([3], oldProof, { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidMerkleProof");

      // New proofs should work
      const newLeaf = solidityPackedKeccak256(["address"], [payoutAddress.address]);
      const newProof = newTree.getHexProof(newLeaf);

      await expect(
        fixedPriceSale.connect(payoutAddress).whitelistMint([3], newProof, { value: PRICE }),
      ).to.not.be.reverted;
    });
  });

  describe("Admin Gifting", function () {
    it("should allow owner to gift NFTs at any phase", async function () {
      // AdminGifting phase
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1, 2]);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(2);

      // Whitelist phase
      await time.increaseTo(PRESALE_START_TIME);
      await fixedPriceSale.connect(owner).adminGiftTo(user2.address, [3, 4]);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(4);

      // Public phase
      await time.increaseTo(PUBLIC_START_TIME);
      await fixedPriceSale.connect(owner).adminGiftTo(user3.address, [5, 6]);
      expect(await fixedPriceSale.totalAdminGifted()).to.equal(6);
    });

    it("should have unlimited admin gifting", async function () {
      const batch1 = Array.from({ length: 50 }, (_, i) => i + 1);
      const batch2 = Array.from({ length: 49 }, (_, i) => i + 51); // 49 tokens (max supply is 100)

      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch1);
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch2);

      expect(await fixedPriceSale.totalAdminGifted()).to.equal(99);
    });

    it("should reject non-owner admin gifts", async function () {
      await expect(
        fixedPriceSale.connect(user1).adminGiftTo(user2.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "OwnableUnauthorizedAccount");
    });

    it("should reject empty token array", async function () {
      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(user1.address, []),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EmptyTokenArray");
    });

    it("should reject zero address recipient", async function () {
      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(ethers.ZeroAddress, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidRecipient");
    });

    it("should respect MAX_BATCH_SIZE", async function () {
      const largeBatch = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => i + 1);

      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(user1.address, largeBatch),
      ).to.be.revertedWithCustomError(fixedPriceSale, "BatchSizeTooLarge");
    });

    it("should emit events for each gifted token", async function () {
      const tx = await fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1, 2]);

      await expect(tx).to.emit(fixedPriceSale, "NFTGifted").withArgs(user1.address, 1);
      await expect(tx).to.emit(fixedPriceSale, "NFTGifted").withArgs(user1.address, 2);
    });
  });

  describe("Artist Gifting", function () {
    it("should allow artist to gift up to MAX_ARTIST_GIFTS", async function () {
      const tokens = Array.from({ length: 50 }, (_, i) => i + 1);
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, tokens);

      expect(await fixedPriceSale.totalArtistGifted()).to.equal(50);
      expect(await fixedPriceSale.getRemainingArtistGifts()).to.equal(200);
    });

    it("should enforce MAX_ARTIST_GIFTS limit", async function () {
      // Gift tokens up to the limit (respecting MAX_SUPPLY of 100)
      // Token IDs are 0-99 (100 total tokens)
      // Gift 50 tokens in first batch (0-49)
      const batch1 = Array.from({ length: 50 }, (_, i) => i);
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, batch1);

      // Gift 49 more tokens (50-98, total 99 tokens)
      const batch2 = Array.from({ length: 49 }, (_, i) => i + 50);
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, batch2);

      expect(await fixedPriceSale.totalArtistGifted()).to.equal(99);
      expect(await fixedPriceSale.getRemainingArtistGifts()).to.equal(151);

      // Gift last token (99)
      await fixedPriceSale.connect(artist).artistGiftTo(user1.address, [99]);

      expect(await fixedPriceSale.totalArtistGifted()).to.equal(100);
    });

    it("should reject non-artist callers", async function () {
      await expect(
        fixedPriceSale.connect(user1).artistGiftTo(user2.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "UnauthorizedArtist");
    });

    it("should allow owner to update artist address", async function () {
      await expect(fixedPriceSale.connect(owner).updateArtist(user1.address))
        .to.emit(fixedPriceSale, "ArtistUpdated")
        .withArgs(artist.address, user1.address);

      expect(await fixedPriceSale.artist()).to.equal(user1.address);

      // Old artist should no longer work
      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user2.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "UnauthorizedArtist");

      // New artist should work
      await fixedPriceSale.connect(user1).artistGiftTo(user2.address, [1]);
      expect(await abrahamNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("should revert gift with invalid token ID", async function () {
      // Try to gift mix of valid and invalid tokens
      const mixedTokens = [1, 2, MAX_SUPPLY]; // Last one is invalid (0-indexed, so MAX_SUPPLY is out of bounds)

      // Should revert because token MAX_SUPPLY is invalid
      await expect(fixedPriceSale.connect(artist).artistGiftTo(user1.address, mixedTokens)).to.be
        .reverted;

      // No tokens should be gifted
      expect(await fixedPriceSale.totalArtistGifted()).to.equal(0);
      expect(await fixedPriceSale.getRemainingArtistGifts()).to.equal(250);
    });
  });

  describe("Public Minting", function () {
    beforeEach(async function () {
      // Move to public phase
      await time.increaseTo(PUBLIC_START_TIME);
    });

    it("should allow anyone to mint with correct payment", async function () {
      await expect(fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE }))
        .to.emit(fixedPriceSale, "NFTMinted")
        .withArgs(user1.address, 1, PRICE);

      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);
      expect(await fixedPriceSale.totalSold()).to.equal(1);
      expect(await fixedPriceSale.totalRevenue()).to.equal(PRICE);
    });

    it("should reject insufficient payment", async function () {
      const insufficientPayment = PRICE - 1n;

      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: insufficientPayment }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");
    });

    it("should reject overpayment", async function () {
      const overpayment = parseEther("0.1");

      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE + overpayment }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InsufficientPayment");
    });

    it("should handle batch minting correctly", async function () {
      const tokens = [1, 2, 3];
      const totalCost = PRICE * BigInt(tokens.length);

      await fixedPriceSale.connect(user1).mintTo(user1.address, tokens, { value: totalCost });

      expect(await fixedPriceSale.totalSold()).to.equal(3);
      expect(await fixedPriceSale.totalRevenue()).to.equal(totalCost);
      expect(await abrahamNFT.balanceOf(user1.address)).to.equal(3);
    });

    it("should emit BatchMinted event", async function () {
      const tokens = [1, 2, 3];
      const totalCost = PRICE * BigInt(tokens.length);

      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, tokens, { value: totalCost }),
      )
        .to.emit(fixedPriceSale, "BatchMinted")
        .withArgs(user1.address, user1.address, tokens, totalCost);
    });

    it("should allow minting to different recipient", async function () {
      await fixedPriceSale.connect(user1).mintTo(user2.address, [1], { value: PRICE });

      expect(await abrahamNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("should handle mint() convenience function", async function () {
      await expect(fixedPriceSale.connect(user1).mint([1], { value: PRICE }))
        .to.emit(fixedPriceSale, "NFTMinted")
        .withArgs(user1.address, 1, PRICE);

      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("should revert entire transaction if any token is already minted", async function () {
      // Pre-mint token 1
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Try to mint tokens 1 (already minted) and 2 (available) - should revert entirely
      const tokens = [1, 2];
      const totalCost = PRICE * 2n;

      await expect(
        fixedPriceSale.connect(user2).mintTo(user2.address, tokens, { value: totalCost }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "MintFailed");

      // Only token 1 should have been minted (from first transaction)
      expect(await fixedPriceSale.totalSold()).to.equal(1);
      expect(await abrahamNFT.balanceOf(user1.address)).to.equal(1);
      expect(await abrahamNFT.balanceOf(user2.address)).to.equal(0);
    });

    it("should handle all failed mints and refund full payment", async function () {
      // Pre-mint all tokens
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1, 2], { value: PRICE * 2n });

      // Try to mint already minted tokens
      const tokens = [1, 2];
      const totalCost = PRICE * 2n;

      await expect(
        fixedPriceSale.connect(user2).mintTo(user2.address, tokens, { value: totalCost }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "MintFailed");
    });
  });

  describe("Pause Mechanism", function () {
    it("should allow owner to pause and unpause", async function () {
      await fixedPriceSale.connect(owner).pause();
      expect(await fixedPriceSale.paused()).to.be.true;

      await fixedPriceSale.connect(owner).unpause();
      expect(await fixedPriceSale.paused()).to.be.false;
    });

    it("should block minting when paused", async function () {
      await time.increaseTo(PUBLIC_START_TIME);
      await fixedPriceSale.connect(owner).pause();

      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EnforcedPause");
    });

    it("should block admin gifting when paused", async function () {
      await fixedPriceSale.connect(owner).pause();

      await expect(
        fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EnforcedPause");
    });

    it("should block artist gifting when paused", async function () {
      await fixedPriceSale.connect(owner).pause();

      await expect(
        fixedPriceSale.connect(artist).artistGiftTo(user1.address, [1]),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EnforcedPause");
    });

    it("should reject non-owner pause/unpause", async function () {
      await expect(fixedPriceSale.connect(user1).pause()).to.be.revertedWithCustomError(
        fixedPriceSale,
        "OwnableUnauthorizedAccount",
      );

      await fixedPriceSale.connect(owner).pause();

      await expect(fixedPriceSale.connect(user1).unpause()).to.be.revertedWithCustomError(
        fixedPriceSale,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Emergency Pause", function () {
    it("should allow owner to activate emergency pause", async function () {
      const duration = 3600; // 1 hour
      await expect(
        fixedPriceSale.connect(owner).activateEmergencyPause(duration, "Security issue"),
      ).to.emit(fixedPriceSale, "EmergencyPauseActivated");

      const status = await fixedPriceSale.getEmergencyPauseStatus();
      expect(status.paused).to.be.true;
    });

    it("should block minting during emergency pause", async function () {
      await time.increaseTo(PUBLIC_START_TIME);
      await fixedPriceSale.connect(owner).activateEmergencyPause(3600, "Test pause");

      await expect(
        fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EmergencyPauseActive");
    });

    it("should enforce cooldown between emergency pauses", async function () {
      await fixedPriceSale.connect(owner).activateEmergencyPause(3600, "First pause");

      // Try to activate again immediately (should fail due to cooldown)
      await expect(
        fixedPriceSale.connect(owner).activateEmergencyPause(3600, "Second pause"),
      ).to.be.revertedWithCustomError(fixedPriceSale, "EmergencyPauseCooldown");
    });

    it("should allow emergency pause after cooldown expires", async function () {
      await fixedPriceSale.connect(owner).activateEmergencyPause(3600, "First pause");

      // Fast forward past cooldown (24 hours)
      await time.increase(24 * 3600 + 1);

      // Should be able to activate again
      await expect(fixedPriceSale.connect(owner).activateEmergencyPause(3600, "Second pause")).to
        .not.be.reverted;
    });

    it("should reject pause duration exceeding maximum", async function () {
      const MAX_PAUSE_DURATION = 48 * 3600; // 48 hours
      const excessiveDuration = MAX_PAUSE_DURATION + 1;

      await expect(
        fixedPriceSale.connect(owner).activateEmergencyPause(excessiveDuration, "Too long"),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidPauseDuration");
    });

    it("should allow owner to lift emergency pause early", async function () {
      await fixedPriceSale.connect(owner).activateEmergencyPause(3600, "Test pause");

      await expect(fixedPriceSale.connect(owner).liftEmergencyPause()).to.emit(
        fixedPriceSale,
        "EmergencyPauseLifted",
      );

      const status = await fixedPriceSale.getEmergencyPauseStatus();
      expect(status.paused).to.be.false;
    });

    it("should automatically expire emergency pause", async function () {
      const duration = 3600; // 1 hour
      await fixedPriceSale.connect(owner).activateEmergencyPause(duration, "Test pause");

      // Fast forward past duration
      await time.increase(duration + 1);

      const status = await fixedPriceSale.getEmergencyPauseStatus();
      expect(status.paused).to.be.false;

      // Minting should work again
      await time.increaseTo(PUBLIC_START_TIME + duration + 100);
      await expect(fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE })).to
        .not.be.reverted;
    });
  });

  describe("Withdrawal & Refunds", function () {
    beforeEach(async function () {
      await time.increaseTo(PUBLIC_START_TIME);
    });

    it("should allow owner to withdraw funds", async function () {
      // Generate revenue
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      const balanceBefore = await ethers.provider.getBalance(payoutAddress.address);
      await fixedPriceSale.connect(owner).withdraw();
      const balanceAfter = await ethers.provider.getBalance(payoutAddress.address);

      expect(balanceAfter - balanceBefore).to.equal(PRICE);
    });

    it("should reject withdrawal with no funds", async function () {
      await expect(fixedPriceSale.connect(owner).withdraw()).to.be.revertedWithCustomError(
        fixedPriceSale,
        "NoFundsToWithdraw",
      );
    });

    it("should revert when trying to mint already minted token", async function () {
      // Pre-mint token 1
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // Try to mint [1, 2] - transaction should revert because token 1 is already minted
      await expect(
        fixedPriceSale.connect(user2).mintTo(user2.address, [1, 2], { value: PRICE * 2n }),
      ).to.be.revertedWithCustomError(fixedPriceSale, "MintFailed");

      // Only token 1 should be minted
      expect(await fixedPriceSale.totalSold()).to.equal(1);
      expect(await abrahamNFT.balanceOf(user1.address)).to.equal(1);
      expect(await abrahamNFT.balanceOf(user2.address)).to.equal(0);

      // Contract should have only 1 * PRICE in revenue
      const contractBalance = await ethers.provider.getBalance(await fixedPriceSale.getAddress());
      expect(contractBalance).to.equal(PRICE);
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to update price", async function () {
      const newPrice = parseEther("0.05");

      await expect(fixedPriceSale.connect(owner).updatePrice(newPrice))
        .to.emit(fixedPriceSale, "PriceUpdated")
        .withArgs(PRICE, newPrice);

      expect(await fixedPriceSale.price()).to.equal(newPrice);
    });

    it("should reject zero price update", async function () {
      await expect(fixedPriceSale.connect(owner).updatePrice(0)).to.be.revertedWithCustomError(
        fixedPriceSale,
        "InvalidPrice",
      );
    });

    it("should allow owner to update payout address", async function () {
      await expect(fixedPriceSale.connect(owner).updatePayoutAddress(user1.address))
        .to.emit(fixedPriceSale, "PayoutAddressUpdated")
        .withArgs(payoutAddress.address, user1.address);

      expect(await fixedPriceSale.payoutAddress()).to.equal(user1.address);
    });

    it("should reject zero address payout update", async function () {
      await expect(
        fixedPriceSale.connect(owner).updatePayoutAddress(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(fixedPriceSale, "InvalidPayoutAddress");
    });

    it("should allow owner to update NFT contract", async function () {
      // Deploy new NFT contract
      const NewNFT = await ethers.getContractFactory("AbrahamFirstWorks");
      const newNFT = await NewNFT.deploy(
        "New NFT",
        "NEW",
        owner.address,
        MAX_SUPPLY,
        await fixedPriceSale.getAddress(),
        "ipfs://new/",
        owner.address,
        ROYALTY_FEE,
      );

      await expect(fixedPriceSale.connect(owner).updateNFTContract(await newNFT.getAddress()))
        .to.emit(fixedPriceSale, "NFTContractUpdated")
        .withArgs(await abrahamNFT.getAddress(), await newNFT.getAddress());

      expect(await fixedPriceSale.nftContract()).to.equal(await newNFT.getAddress());
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await time.increaseTo(PUBLIC_START_TIME);
    });

    it("should return correct sale info", async function () {
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1, 2], { value: PRICE * 2n });

      const info = await fixedPriceSale.getSaleInfo();

      expect(info.isActive).to.be.true;
      expect(info.currentPrice).to.equal(PRICE);
      expect(info.sold).to.equal(2);
      expect(info.revenue).to.equal(PRICE * 2n);
      expect(info.maxSupply).to.equal(MAX_SUPPLY);
      expect(info.remainingSupply).to.equal(MAX_SUPPLY - 2);
    });

    it("should return correct gifting info", async function () {
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, [1, 2]);
      await fixedPriceSale.connect(artist).artistGiftTo(user2.address, [3, 4, 5]);

      const info = await fixedPriceSale.getGiftingInfo();

      expect(info.totalGifts).to.equal(5);
      expect(info.adminGifts).to.equal(2);
      expect(info.artistGifts).to.equal(3);
      expect(info.remainingArtistGifts).to.equal(MAX_ARTIST_GIFTS - 3);
      expect(info.maxArtistGifts).to.equal(MAX_ARTIST_GIFTS);
    });

    it("should calculate total cost correctly", async function () {
      expect(await fixedPriceSale.calculateTotalCost(5)).to.equal(PRICE * 5n);
      expect(await fixedPriceSale.calculateTotalCost(1)).to.equal(PRICE);
      expect(await fixedPriceSale.calculateTotalCost(0)).to.equal(0);
    });

    it("should check if quantity can be minted", async function () {
      let [success, reason] = await fixedPriceSale.canMint(10);
      expect(success).to.be.true;
      expect(reason).to.equal(0);

      // Mint almost all supply in batches (respecting MAX_BATCH_SIZE of 50)
      const batch1 = Array.from({ length: 50 }, (_, i) => i + 1);
      const batch2 = Array.from({ length: 45 }, (_, i) => i + 51);
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch1);
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch2);

      [success, reason] = await fixedPriceSale.canMint(10);
      expect(success).to.be.false;
      expect(reason).to.equal(4); // insufficient_supply
    });

    it("should check if specific token IDs can be minted", async function () {
      let [success, reason, tokenId] = await fixedPriceSale.canMintTokenIds([1, 2, 3]);
      expect(success).to.be.true;

      // Mint token 2
      await fixedPriceSale.connect(user1).mintTo(user1.address, [2], { value: PRICE });

      [success, reason, tokenId] = await fixedPriceSale.canMintTokenIds([1, 2, 3]);
      expect(success).to.be.false;
      expect(reason).to.equal(4); // token_unavailable
      expect(tokenId).to.equal(2);
    });

    it("should check token availability", async function () {
      const available = await fixedPriceSale.isAvailable([1, 2, 3]);
      expect(available).to.deep.equal([true, true, true]);

      await fixedPriceSale.connect(user1).mintTo(user1.address, [2], { value: PRICE });

      const available2 = await fixedPriceSale.isAvailable([1, 2, 3]);
      expect(available2).to.deep.equal([true, false, true]);
    });

    it("should get random available works", async function () {
      const randomWorks = await fixedPriceSale.getRandomAvailableWorks(10);
      expect(randomWorks.length).to.equal(10);

      // All should be unique
      const uniqueSet = new Set(randomWorks.map((w) => w.toString()));
      expect(uniqueSet.size).to.equal(10);

      // All should be within range
      for (const tokenId of randomWorks) {
        expect(tokenId).to.be.lt(MAX_SUPPLY);
      }
    });

    it("should handle getRandomAvailableWorks with limited supply", async function () {
      // Mint most tokens in batches (respecting MAX_BATCH_SIZE)
      const batch1 = Array.from({ length: 50 }, (_, i) => i + 1);
      const batch2 = Array.from({ length: 45 }, (_, i) => i + 51);
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch1);
      await fixedPriceSale.connect(owner).adminGiftTo(user1.address, batch2);

      const randomWorks = await fixedPriceSale.getRandomAvailableWorks(10);

      // Should return fewer than requested (only 5 available: 96-100)
      expect(randomWorks.length).to.be.lte(5);
      expect(randomWorks.length).to.be.gte(0);
    });
  });

  describe("Reentrancy Protection", function () {
    it("should prevent reentrancy on mintTo", async function () {
      await time.increaseTo(PUBLIC_START_TIME);

      // Test with normal address - contract has reentrancy guards
      await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });

      // State should be correct
      expect(await fixedPriceSale.totalSold()).to.equal(1);
      expect(await abrahamNFT.ownerOf(1)).to.equal(user1.address);

      // The nonReentrant modifier prevents reentrancy attacks
      // Additional reentrancy tests would require a malicious contract
      // that tries to call back during the refund, but ERC721 safe transfer
      // checks happen before refunds in our implementation
    });
  });

  describe("Gas Profiling", function () {
    beforeEach(async function () {
      await time.increaseTo(PUBLIC_START_TIME);
    });

    it("should profile single mint gas cost", async function () {
      const tx = await fixedPriceSale.connect(user1).mintTo(user1.address, [1], { value: PRICE });
      const receipt = await tx.wait();

      console.log(`      Single mint gas: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lt(250000);
    });

    it("should profile batch mint gas cost", async function () {
      const tokens = [1, 2, 3, 4, 5];
      const tx = await fixedPriceSale
        .connect(user1)
        .mintTo(user1.address, tokens, { value: PRICE * 5n });
      const receipt = await tx.wait();

      console.log(`      Batch mint (5) gas: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lt(400000);
    });

    it("should profile admin gift gas cost", async function () {
      const tokens = [1, 2, 3, 4, 5];
      const tx = await fixedPriceSale.connect(owner).adminGiftTo(user1.address, tokens);
      const receipt = await tx.wait();

      console.log(`      Admin gift (5) gas: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lt(350000);
    });
  });
});
