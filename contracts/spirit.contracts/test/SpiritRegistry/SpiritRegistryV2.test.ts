import { expect } from "chai";
import { ethers } from "hardhat";
import { SpiritRegistry, TrainerRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SpiritRegistry V2", function () {
  let spiritRegistry: SpiritRegistry;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  const AGENT_ID = "test-agent-001";
  const AGENT_ID_2 = "test-agent-002";
  const METADATA_URI = "ipfs://QmTest123";
  const METADATA_URI_2 = "ipfs://QmTest456";

  beforeEach(async function () {
    [owner, treasury, user, user2] = await ethers.getSigners();

    const SpiritRegistryFactory = await ethers.getContractFactory("SpiritRegistry");
    spiritRegistry = await SpiritRegistryFactory.deploy(
      "Spirit Agent Registry",
      "SAR",
      owner.address,
    );
    await spiritRegistry.waitForDeployment();

    // Note: SpiritRegistry uses simple owner-based access control
  });

  describe("Register Function", function () {
    it("Should register agent starting from tokenId 0", async function () {
      await expect(
        spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI),
      )
        .to.emit(spiritRegistry, "AgentRegistered")
        .withArgs(0, AGENT_ID, user.address, METADATA_URI)
        .and.to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(0, AGENT_ID, "", "pending");

      // Verify token ownership
      expect(await spiritRegistry.ownerOf(0)).to.equal(user.address);

      // Verify token URI
      expect(await spiritRegistry.tokenURI(0)).to.equal(METADATA_URI);

      // Verify agent ID mapping
      expect(await spiritRegistry.getAgentIdForToken(0)).to.equal(AGENT_ID);

      // Verify application status
      expect(await spiritRegistry.getApplicationStatusForToken(0)).to.equal("pending");

      // Verify current token ID incremented
      expect(await spiritRegistry.currentTokenId()).to.equal(1);
    });

    it("Should increment tokenId sequentially", async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID_2, user2.address, "approved", METADATA_URI_2);

      expect(await spiritRegistry.ownerOf(0)).to.equal(user.address);
      expect(await spiritRegistry.ownerOf(1)).to.equal(user2.address);
      expect(await spiritRegistry.getAgentIdForToken(0)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getAgentIdForToken(1)).to.equal(AGENT_ID_2);
      expect(await spiritRegistry.getApplicationStatusForToken(0)).to.equal("pending");
      expect(await spiritRegistry.getApplicationStatusForToken(1)).to.equal("approved");
    });

    it("Should allow multiple tokens for the same agent ID", async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID, user2.address, "approved", METADATA_URI_2);

      // Both tokens should have the same agent ID
      expect(await spiritRegistry.getAgentIdForToken(0)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getAgentIdForToken(1)).to.equal(AGENT_ID);

      // But different owners and statuses
      expect(await spiritRegistry.ownerOf(0)).to.equal(user.address);
      expect(await spiritRegistry.ownerOf(1)).to.equal(user2.address);
      expect(await spiritRegistry.getApplicationStatusForToken(0)).to.equal("pending");
      expect(await spiritRegistry.getApplicationStatusForToken(1)).to.equal("approved");

      expect(await spiritRegistry.currentTokenId()).to.equal(2);
    });

    it("Should not allow non-owner to register", async function () {
      await expect(
        spiritRegistry.connect(user).register(AGENT_ID, user.address, "pending", METADATA_URI),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should validate all parameters", async function () {
      // Empty agent ID
      await expect(
        spiritRegistry.connect(owner).register("", user.address, "pending", METADATA_URI),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidAgentId");

      // Zero address recipient
      await expect(
        spiritRegistry
          .connect(owner)
          .register(AGENT_ID, ethers.ZeroAddress, "pending", METADATA_URI),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidRecipient");

      // Empty application status
      await expect(
        spiritRegistry.connect(owner).register(AGENT_ID, user.address, "", METADATA_URI),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidApplicationStatus");

      // Empty metadata URI
      await expect(
        spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", ""),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidMetadataURI");
    });
  });

  describe("Treasury Functions", function () {
    beforeEach(async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
    });

    it("Should allow treasury to update application status", async function () {
      await expect(spiritRegistry.connect(treasury).setApplicationStatus(0, "approved"))
        .to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(0, AGENT_ID, "pending", "approved");

      expect(await spiritRegistry.getApplicationStatusForToken(0)).to.equal("approved");
    });

    it("Should not allow non-treasury to update application status", async function () {
      await expect(
        spiritRegistry.connect(user).setApplicationStatus(0, "approved"),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");

      await expect(
        spiritRegistry.connect(user2).setApplicationStatus(0, "approved"),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");
    });

    it("Should allow treasury to update agentId", async function () {
      const newAgentId = "new-agent-id";
      await spiritRegistry.connect(treasury).setAgentId(0, newAgentId);

      expect(await spiritRegistry.getAgentIdForToken(0)).to.equal(newAgentId);
    });

    it("Should handle agentId changes independently per token", async function () {
      // Register second token for same agent
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID, user2.address, "approved", METADATA_URI_2);

      // Change first token's agent ID
      const newAgentId = "new-agent-id";
      await spiritRegistry.connect(treasury).setAgentId(0, newAgentId);

      // First token should have new agent ID
      expect(await spiritRegistry.getAgentIdForToken(0)).to.equal(newAgentId);

      // Second token should still have original agent ID
      expect(await spiritRegistry.getAgentIdForToken(1)).to.equal(AGENT_ID);
    });

    it("Should not allow non-treasury to update agentId", async function () {
      await expect(
        spiritRegistry.connect(user).setAgentId(0, "new-agent-id"),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");

      await expect(
        spiritRegistry.connect(user2).setAgentId(0, "new-agent-id"),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");
    });

    it("Should allow treasury to update tokenURI", async function () {
      const newURI = "ipfs://QmNewTest789";
      await spiritRegistry.connect(treasury).setTokenURI(0, newURI);
      expect(await spiritRegistry.tokenURI(0)).to.equal(newURI);
    });

    it("Should not allow non-treasury to update tokenURI", async function () {
      const newURI = "ipfs://QmNewTest789";
      await expect(
        spiritRegistry.connect(user).setTokenURI(0, newURI),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");

      await expect(
        spiritRegistry.connect(user2).setTokenURI(0, newURI),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");
    });

    it("Should allow treasury to burn tokens", async function () {
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID, user2.address, "approved", METADATA_URI_2); // Token 1

      // Burn first token
      await expect(spiritRegistry.connect(treasury).burn(0))
        .to.emit(spiritRegistry, "AgentDeregistered")
        .withArgs(0, AGENT_ID);

      // Check token 0 no longer exists
      await expect(spiritRegistry.ownerOf(0)).to.be.revertedWith("ERC721: invalid token ID");

      // Token 1 should still exist
      expect(await spiritRegistry.ownerOf(1)).to.equal(user2.address);

      // Current token ID should remain the same (doesn't decrement on burn)
      expect(await spiritRegistry.currentTokenId()).to.equal(2);
    });
  });

  describe("Batch Functions", function () {
    beforeEach(async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID_2, user2.address, "approved", METADATA_URI_2);
    });

    it("Should return multiple token URIs", async function () {
      const uris = await spiritRegistry.getTokenUris([0, 1]);
      expect(uris).to.deep.equal([METADATA_URI, METADATA_URI_2]);
    });

    it("Should revert if any token ID doesn't exist", async function () {
      await expect(spiritRegistry.getTokenUris([0, 999, 1])).to.be.revertedWithCustomError(
        spiritRegistry,
        "InvalidTokenId",
      );
    });

    it("Should work with single token ID", async function () {
      const uris = await spiritRegistry.getTokenUris([0]);
      expect(uris).to.deep.equal([METADATA_URI]);
    });

    it("Should work with empty array", async function () {
      const uris = await spiritRegistry.getTokenUris([]);
      expect(uris).to.deep.equal([]);
    });
  });

  describe("RBAC Management", function () {
    beforeEach(async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
    });

    it("Should identify treasury addresses correctly", async function () {
      const [deployer] = await ethers.getSigners();

      // Deployer should be treasury (granted in constructor)
      expect(await spiritRegistry.isTreasury(deployer.address)).to.be.true;

      // Treasury should be treasury (granted in test setup)
      expect(await spiritRegistry.isTreasury(treasury.address)).to.be.true;

      // Regular user should not be treasury
      expect(await spiritRegistry.isTreasury(user.address)).to.be.false;

      // Hardcoded addresses should be treasury (granted in constructor)
      expect(await spiritRegistry.isTreasury("0xF7425fB026f9297fCc57B14ace187215442586a2")).to.be
        .true;
      expect(await spiritRegistry.isTreasury("0xda3c325aB45b30AeB476B026FE6A777443cA04f3")).to.be
        .true;
    });

    it("Should allow admin to add treasury", async function () {
      const [deployer] = await ethers.getSigners();

      // Initially user is not treasury
      expect(await spiritRegistry.isTreasury(user.address)).to.be.false;

      // Admin (deployer) adds user as treasury
      await expect(spiritRegistry.connect(deployer).addTreasury(user.address))
        .to.emit(spiritRegistry, "TreasuryAdded")
        .withArgs(user.address);

      // Now user should be treasury
      expect(await spiritRegistry.isTreasury(user.address)).to.be.true;

      // User should now be able to perform treasury functions
      await spiritRegistry.connect(user).setApplicationStatus(0, "approved");
      expect(await spiritRegistry.getApplicationStatusForToken(0)).to.equal("approved");
    });

    it("Should allow admin to remove treasury", async function () {
      const [deployer] = await ethers.getSigners();

      // Treasury should initially be treasury
      expect(await spiritRegistry.isTreasury(treasury.address)).to.be.true;

      // Admin removes treasury role
      await expect(spiritRegistry.connect(deployer).removeTreasury(treasury.address))
        .to.emit(spiritRegistry, "TreasuryRemoved")
        .withArgs(treasury.address);

      // Treasury should no longer be treasury
      expect(await spiritRegistry.isTreasury(treasury.address)).to.be.false;

      // Treasury should no longer be able to perform treasury functions
      await expect(
        spiritRegistry.connect(treasury).setApplicationStatus(0, "approved"),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");
    });

    it("Should not allow non-admin to add treasury", async function () {
      await expect(spiritRegistry.connect(user).addTreasury(user2.address)).to.be.reverted; // AccessControl will revert with missing role error
    });

    it("Should not allow non-admin to remove treasury", async function () {
      await expect(spiritRegistry.connect(user).removeTreasury(treasury.address)).to.be.reverted; // AccessControl will revert with missing role error
    });
  });

  describe("Trainer Management", function () {
    beforeEach(async function () {
      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID_2, user2.address, "approved", METADATA_URI_2);
    });

    it("Should allow treasury to add trainers to spirits", async function () {
      await expect(spiritRegistry.connect(treasury).addTrainer(0, 101))
        .to.emit(spiritRegistry, "TrainerAdded")
        .withArgs(0, 101);

      expect(await spiritRegistry.hasTrainer(0, 101)).to.be.true;

      const trainers = await spiritRegistry.getTrainersForSpirit(0);
      expect(trainers).to.deep.equal([101n]);
    });

    it("Should allow multiple trainers per spirit", async function () {
      await spiritRegistry.connect(treasury).addTrainer(0, 101);
      await spiritRegistry.connect(treasury).addTrainer(0, 102);
      await spiritRegistry.connect(treasury).addTrainer(0, 103);

      expect(await spiritRegistry.hasTrainer(0, 101)).to.be.true;
      expect(await spiritRegistry.hasTrainer(0, 102)).to.be.true;
      expect(await spiritRegistry.hasTrainer(0, 103)).to.be.true;

      const trainers = await spiritRegistry.getTrainersForSpirit(0);
      expect(trainers).to.have.lengthOf(3);
      expect(trainers).to.include(101n);
      expect(trainers).to.include(102n);
      expect(trainers).to.include(103n);
    });

    it("Should allow treasury to remove trainers from spirits", async function () {
      await spiritRegistry.connect(treasury).addTrainer(0, 101);
      await spiritRegistry.connect(treasury).addTrainer(0, 102);

      await expect(spiritRegistry.connect(treasury).removeTrainer(0, 101))
        .to.emit(spiritRegistry, "TrainerRemoved")
        .withArgs(0, 101);

      expect(await spiritRegistry.hasTrainer(0, 101)).to.be.false;
      expect(await spiritRegistry.hasTrainer(0, 102)).to.be.true;

      const trainers = await spiritRegistry.getTrainersForSpirit(0);
      expect(trainers).to.deep.equal([102n]);
    });

    it("Should not allow adding the same trainer twice", async function () {
      await spiritRegistry.connect(treasury).addTrainer(0, 101);

      await expect(
        spiritRegistry.connect(treasury).addTrainer(0, 101),
      ).to.be.revertedWithCustomError(spiritRegistry, "TrainerAlreadyAdded");
    });

    it("Should not allow removing trainer that doesn't exist", async function () {
      await expect(
        spiritRegistry.connect(treasury).removeTrainer(0, 101),
      ).to.be.revertedWithCustomError(spiritRegistry, "TrainerNotFound");
    });

    it("Should not allow non-treasury to manage trainers", async function () {
      await expect(spiritRegistry.connect(user).addTrainer(0, 101)).to.be.revertedWithCustomError(
        spiritRegistry,
        "UnauthorizedTreasury",
      );

      await expect(
        spiritRegistry.connect(user).removeTrainer(0, 101),
      ).to.be.revertedWithCustomError(spiritRegistry, "UnauthorizedTreasury");
    });

    it("Should revert for invalid spirit token ID", async function () {
      await expect(
        spiritRegistry.connect(treasury).addTrainer(999, 101),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidTokenId");

      await expect(
        spiritRegistry.connect(treasury).removeTrainer(999, 101),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidTokenId");
    });

    it("Should handle trainer removal from middle of array", async function () {
      await spiritRegistry.connect(treasury).addTrainer(0, 101);
      await spiritRegistry.connect(treasury).addTrainer(0, 102);
      await spiritRegistry.connect(treasury).addTrainer(0, 103);

      // Remove trainer from middle
      await spiritRegistry.connect(treasury).removeTrainer(0, 102);

      const trainers = await spiritRegistry.getTrainersForSpirit(0);
      expect(trainers).to.have.lengthOf(2);
      expect(trainers).to.include(101n);
      expect(trainers).to.include(103n);
      expect(trainers).to.not.include(102n);
    });
  });

  describe("Trainer Registry Integration", function () {
    let trainerRegistry: TrainerRegistry;
    let spiritRegistryWithTrainers: SpiritRegistry;

    beforeEach(async function () {
      // Deploy TrainerRegistry first
      const TrainerRegistryFactory = await ethers.getContractFactory("TrainerRegistry");
      trainerRegistry = await TrainerRegistryFactory.deploy(
        "Trainer Registry",
        "TR",
        owner.address,
      );
      await trainerRegistry.waitForDeployment();

      // Deploy SpiritRegistry with TrainerRegistry reference
      const SpiritRegistryFactory = await ethers.getContractFactory("SpiritRegistry");
      spiritRegistryWithTrainers = await SpiritRegistryFactory.deploy(
        "Spirit Agent Registry",
        "SAR",
        owner.address,
        await trainerRegistry.getAddress(),
      );
      await spiritRegistryWithTrainers.waitForDeployment();

      // Grant treasury roles
      const TREASURY_ROLE = await spiritRegistryWithTrainers.TREASURY_ROLE();
      await spiritRegistryWithTrainers.grantRole(TREASURY_ROLE, treasury.address);

      const TRAINER_TREASURY_ROLE = await trainerRegistry.TREASURY_ROLE();
      await trainerRegistry.grantRole(TRAINER_TREASURY_ROLE, treasury.address);

      // Register a spirit and trainer
      await spiritRegistryWithTrainers
        .connect(owner)
        .register(AGENT_ID, user.address, "pending", METADATA_URI);
      await trainerRegistry.connect(owner).register(user2.address, "approved", "ipfs://trainer123");
    });

    it("Should validate trainer exists when adding to spirit", async function () {
      // Should succeed - trainer token 0 exists
      await spiritRegistryWithTrainers.connect(treasury).addTrainer(0, 0);
      expect(await spiritRegistryWithTrainers.hasTrainer(0, 0)).to.be.true;

      // Should fail - trainer token 999 doesn't exist
      await expect(
        spiritRegistryWithTrainers.connect(treasury).addTrainer(0, 999),
      ).to.be.revertedWithCustomError(spiritRegistryWithTrainers, "InvalidTrainerTokenId");
    });

    it("Should allow admin to update trainer registry address", async function () {
      const [deployer] = await ethers.getSigners();

      // Deploy new trainer registry
      const NewTrainerRegistryFactory = await ethers.getContractFactory("TrainerRegistry");
      const newTrainerRegistry = await NewTrainerRegistryFactory.deploy(
        "New Trainer Registry",
        "NTR",
        owner.address,
      );
      await newTrainerRegistry.waitForDeployment();

      // Update trainer registry address
      await expect(
        spiritRegistryWithTrainers
          .connect(deployer)
          .setTrainerRegistry(await newTrainerRegistry.getAddress()),
      )
        .to.emit(spiritRegistryWithTrainers, "TrainerRegistryUpdated")
        .withArgs(await trainerRegistry.getAddress(), await newTrainerRegistry.getAddress());

      // Verify new address is set
      expect(await spiritRegistryWithTrainers.trainerRegistry()).to.equal(
        await newTrainerRegistry.getAddress(),
      );
    });

    it("Should not allow non-admin to update trainer registry", async function () {
      await expect(spiritRegistryWithTrainers.connect(user).setTrainerRegistry(ethers.ZeroAddress))
        .to.be.reverted; // AccessControl will revert
    });

    it("Should not allow zero address for trainer registry", async function () {
      const [deployer] = await ethers.getSigners();

      await expect(
        spiritRegistryWithTrainers.connect(deployer).setTrainerRegistry(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(spiritRegistryWithTrainers, "InvalidTrainerRegistry");
    });
  });

  describe("Registry Management", function () {
    it("Should track currentTokenId correctly", async function () {
      expect(await spiritRegistry.currentTokenId()).to.equal(0);

      await spiritRegistry.connect(owner).register(AGENT_ID, user.address, "pending", METADATA_URI);
      expect(await spiritRegistry.currentTokenId()).to.equal(1);

      await spiritRegistry
        .connect(owner)
        .register(AGENT_ID, user2.address, "approved", METADATA_URI_2);
      expect(await spiritRegistry.currentTokenId()).to.equal(2);
    });
  });
});
