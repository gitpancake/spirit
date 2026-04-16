import { expect } from "chai";
import { ethers } from "hardhat";
import { TrainerRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrainerRegistry", function () {
  let trainerRegistry: TrainerRegistry;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  const METADATA_URI = "ipfs://QmTrainer123";
  const METADATA_URI_2 = "ipfs://QmTrainer456";

  beforeEach(async function () {
    [owner, treasury, user, user2] = await ethers.getSigners();

    const TrainerRegistryFactory = await ethers.getContractFactory("TrainerRegistry");
    trainerRegistry = await TrainerRegistryFactory.deploy("Trainer Registry", "TR", owner.address);
    await trainerRegistry.waitForDeployment();

    // Grant treasury role to treasury address for testing
    const TREASURY_ROLE = await trainerRegistry.TREASURY_ROLE();
    await trainerRegistry.grantRole(TREASURY_ROLE, treasury.address);
  });

  describe("Register Function", function () {
    it("Should register trainer starting from tokenId 0", async function () {
      await expect(trainerRegistry.connect(owner).register(user.address, "pending", METADATA_URI))
        .to.emit(trainerRegistry, "TrainerRegistered")
        .withArgs(0, user.address, METADATA_URI)
        .and.to.emit(trainerRegistry, "ApplicationStatusUpdated")
        .withArgs(0, "", "pending");

      // Verify token ownership
      expect(await trainerRegistry.ownerOf(0)).to.equal(user.address);

      // Verify token URI
      expect(await trainerRegistry.tokenURI(0)).to.equal(METADATA_URI);

      // Verify application status
      expect(await trainerRegistry.getApplicationStatusForToken(0)).to.equal("pending");

      // Verify current token ID incremented
      expect(await trainerRegistry.currentTokenId()).to.equal(1);
    });

    it("Should increment tokenId sequentially", async function () {
      await trainerRegistry.connect(owner).register(user.address, "pending", METADATA_URI);
      await trainerRegistry.connect(owner).register(user2.address, "approved", METADATA_URI_2);

      expect(await trainerRegistry.ownerOf(0)).to.equal(user.address);
      expect(await trainerRegistry.ownerOf(1)).to.equal(user2.address);
      expect(await trainerRegistry.getApplicationStatusForToken(0)).to.equal("pending");
      expect(await trainerRegistry.getApplicationStatusForToken(1)).to.equal("approved");
    });

    it("Should not allow non-owner to register", async function () {
      await expect(
        trainerRegistry.connect(user).register(user.address, "pending", METADATA_URI),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should validate all parameters", async function () {
      // Zero address recipient
      await expect(
        trainerRegistry.connect(owner).register(ethers.ZeroAddress, "pending", METADATA_URI),
      ).to.be.revertedWithCustomError(trainerRegistry, "InvalidRecipient");

      // Empty application status
      await expect(
        trainerRegistry.connect(owner).register(user.address, "", METADATA_URI),
      ).to.be.revertedWithCustomError(trainerRegistry, "InvalidApplicationStatus");

      // Empty metadata URI
      await expect(
        trainerRegistry.connect(owner).register(user.address, "pending", ""),
      ).to.be.revertedWithCustomError(trainerRegistry, "InvalidMetadataURI");
    });
  });

  describe("Treasury Functions", function () {
    beforeEach(async function () {
      await trainerRegistry.connect(owner).register(user.address, "pending", METADATA_URI);
    });

    it("Should allow treasury to update application status", async function () {
      await expect(trainerRegistry.connect(treasury).setApplicationStatus(0, "approved"))
        .to.emit(trainerRegistry, "ApplicationStatusUpdated")
        .withArgs(0, "pending", "approved");

      expect(await trainerRegistry.getApplicationStatusForToken(0)).to.equal("approved");
    });

    it("Should allow treasury to update tokenURI", async function () {
      const newURI = "ipfs://QmNewTrainer789";
      await trainerRegistry.connect(treasury).setTokenURI(0, newURI);
      expect(await trainerRegistry.tokenURI(0)).to.equal(newURI);
    });

    it("Should allow treasury to burn tokens", async function () {
      await expect(trainerRegistry.connect(treasury).burn(0))
        .to.emit(trainerRegistry, "TrainerDeregistered")
        .withArgs(0);

      // Check token 0 no longer exists
      await expect(trainerRegistry.ownerOf(0)).to.be.revertedWith("ERC721: invalid token ID");

      // Current token ID should remain the same (doesn't decrement on burn)
      expect(await trainerRegistry.currentTokenId()).to.equal(1);
    });

    it("Should not allow non-treasury to perform treasury functions", async function () {
      await expect(
        trainerRegistry.connect(user).setApplicationStatus(0, "approved"),
      ).to.be.revertedWithCustomError(trainerRegistry, "UnauthorizedTreasury");

      await expect(
        trainerRegistry.connect(user).setTokenURI(0, "ipfs://new"),
      ).to.be.revertedWithCustomError(trainerRegistry, "UnauthorizedTreasury");

      await expect(trainerRegistry.connect(user).burn(0)).to.be.revertedWithCustomError(
        trainerRegistry,
        "UnauthorizedTreasury",
      );
    });
  });

  describe("Batch Functions", function () {
    beforeEach(async function () {
      await trainerRegistry.connect(owner).register(user.address, "pending", METADATA_URI);
      await trainerRegistry.connect(owner).register(user2.address, "approved", METADATA_URI_2);
    });

    it("Should return multiple token URIs", async function () {
      const uris = await trainerRegistry.getTokenUris([0, 1]);
      expect(uris).to.deep.equal([METADATA_URI, METADATA_URI_2]);
    });

    it("Should revert if any token ID doesn't exist", async function () {
      await expect(trainerRegistry.getTokenUris([0, 999, 1])).to.be.revertedWithCustomError(
        trainerRegistry,
        "InvalidTokenId",
      );
    });
  });

  describe("RBAC Management", function () {
    it("Should identify treasury addresses correctly", async function () {
      const [deployer] = await ethers.getSigners();

      // Deployer should be treasury (granted in constructor)
      expect(await trainerRegistry.isTreasury(deployer.address)).to.be.true;

      // Treasury should be treasury (granted in test setup)
      expect(await trainerRegistry.isTreasury(treasury.address)).to.be.true;

      // Regular user should not be treasury
      expect(await trainerRegistry.isTreasury(user.address)).to.be.false;

      // Hardcoded addresses should be treasury (granted in constructor)
      expect(await trainerRegistry.isTreasury("0xF7425fB026f9297fCc57B14ace187215442586a2")).to.be
        .true;
      expect(await trainerRegistry.isTreasury("0xda3c325aB45b30AeB476B026FE6A777443cA04f3")).to.be
        .true;
    });

    it("Should allow admin to add and remove treasury", async function () {
      const [deployer] = await ethers.getSigners();

      // Add user as treasury
      await expect(trainerRegistry.connect(deployer).addTreasury(user.address))
        .to.emit(trainerRegistry, "TreasuryAdded")
        .withArgs(user.address);

      expect(await trainerRegistry.isTreasury(user.address)).to.be.true;

      // Remove user as treasury
      await expect(trainerRegistry.connect(deployer).removeTreasury(user.address))
        .to.emit(trainerRegistry, "TreasuryRemoved")
        .withArgs(user.address);

      expect(await trainerRegistry.isTreasury(user.address)).to.be.false;
    });
  });

  describe("Registry Management", function () {
    it("Should track currentTokenId correctly", async function () {
      expect(await trainerRegistry.currentTokenId()).to.equal(0);

      await trainerRegistry.connect(owner).register(user.address, "pending", METADATA_URI);
      expect(await trainerRegistry.currentTokenId()).to.equal(1);

      await trainerRegistry.connect(owner).register(user2.address, "approved", METADATA_URI_2);
      expect(await trainerRegistry.currentTokenId()).to.equal(2);
    });
  });
});
