import { expect } from "chai";
import { ethers } from "hardhat";
import { SpiritRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SpiritRegistry", function () {
  let spiritRegistry: SpiritRegistry;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user: SignerWithAddress;

  const AGENT_ID = "test-agent-001";
  const AGENT_ID_2 = "test-agent-002";
  const METADATA_URI = "ipfs://QmTest123";
  const METADATA_URI_2 = "ipfs://QmTest456";

  beforeEach(async function () {
    [owner, treasury, user] = await ethers.getSigners();

    const SpiritRegistryFactory = await ethers.getContractFactory("SpiritRegistry");
    spiritRegistry = await SpiritRegistryFactory.deploy(
      "Spirit Agent Registry",
      "SAR",
      owner.address,
      treasury.address,
    );
    await spiritRegistry.waitForDeployment();
  });

  describe("ApplyForRegistration Function", function () {
    const tokenId = 1;

    it("Should allow owner to apply for agent registration", async function () {
      await expect(
        spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID, METADATA_URI),
      )
        .to.emit(spiritRegistry, "AgentRegistered")
        .withArgs(tokenId, AGENT_ID, owner.address, METADATA_URI)
        .and.to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(tokenId, AGENT_ID, "", "pending");

      // Verify token ownership
      expect(await spiritRegistry.ownerOf(tokenId)).to.equal(owner.address);

      // Verify token URI
      expect(await spiritRegistry.tokenURI(tokenId)).to.equal(METADATA_URI);

      // Verify agent ID mapping
      expect(await spiritRegistry.getAgentId(tokenId)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getTokenIdByAgentId(AGENT_ID)).to.equal(tokenId);

      // Verify application status
      expect(await spiritRegistry.getApplicationStatus(tokenId)).to.equal("pending");

      // Verify agent is registered
      expect(await spiritRegistry.isAgentRegistered(AGENT_ID)).to.be.true;

      // Verify agent is in registered list
      const registeredAgents = await spiritRegistry.getAllRegisteredAgents();
      expect(registeredAgents).to.include(AGENT_ID);
    });

    it("Should not allow non-owner to apply", async function () {
      await expect(
        spiritRegistry.connect(user).applyForRegistration(tokenId, AGENT_ID, METADATA_URI),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow applying with empty agent ID", async function () {
      await expect(
        spiritRegistry.connect(owner).applyForRegistration(tokenId, "", METADATA_URI),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidAgentId");
    });

    it("Should not allow applying with empty metadata URI", async function () {
      await expect(
        spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID, ""),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidMetadataURI");
    });

    it("Should not allow applying with already registered agent ID", async function () {
      await spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID, METADATA_URI);

      await expect(
        spiritRegistry.connect(owner).applyForRegistration(2, AGENT_ID, METADATA_URI_2),
      ).to.be.revertedWithCustomError(spiritRegistry, "AgentAlreadyRegistered");
    });

    it("Should not allow applying with already existing token ID", async function () {
      await spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID, METADATA_URI);

      await expect(
        spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID_2, METADATA_URI_2),
      ).to.be.revertedWithCustomError(spiritRegistry, "TokenAlreadyExists");
    });

    it("Should update currentTokenId when applying with higher token ID", async function () {
      const highTokenId = 100;
      await spiritRegistry.connect(owner).applyForRegistration(highTokenId, AGENT_ID, METADATA_URI);

      expect(await spiritRegistry.totalSupply()).to.equal(highTokenId);
      expect(await spiritRegistry.ownerOf(highTokenId)).to.equal(owner.address);
    });
  });

  describe("ApplyForRegistrationTo Function", function () {
    const tokenId = 1;

    it("Should allow owner to apply for agent registration to specific address", async function () {
      await expect(
        spiritRegistry
          .connect(owner)
          .applyForRegistrationTo(tokenId, AGENT_ID, METADATA_URI, user.address),
      )
        .to.emit(spiritRegistry, "AgentRegistered")
        .withArgs(tokenId, AGENT_ID, user.address, METADATA_URI)
        .and.to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(tokenId, AGENT_ID, "", "pending");

      // Verify token ownership (should be user, not owner)
      expect(await spiritRegistry.ownerOf(tokenId)).to.equal(user.address);

      // Verify token URI
      expect(await spiritRegistry.tokenURI(tokenId)).to.equal(METADATA_URI);

      // Verify agent ID mapping
      expect(await spiritRegistry.getAgentId(tokenId)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getTokenIdByAgentId(AGENT_ID)).to.equal(tokenId);

      // Verify application status
      expect(await spiritRegistry.getApplicationStatus(tokenId)).to.equal("pending");

      // Verify agent is registered
      expect(await spiritRegistry.isAgentRegistered(AGENT_ID)).to.be.true;
    });

    it("Should not allow non-owner to applyTo", async function () {
      await expect(
        spiritRegistry
          .connect(user)
          .applyForRegistrationTo(tokenId, AGENT_ID, METADATA_URI, user.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow applyTo with zero address", async function () {
      await expect(
        spiritRegistry
          .connect(owner)
          .applyForRegistrationTo(tokenId, AGENT_ID, METADATA_URI, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidRecipient");
    });

    it("Should not allow applyTo with empty agent ID", async function () {
      await expect(
        spiritRegistry
          .connect(owner)
          .applyForRegistrationTo(tokenId, "", METADATA_URI, user.address),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidAgentId");
    });

    it("Should not allow applyTo with empty metadata URI", async function () {
      await expect(
        spiritRegistry.connect(owner).applyForRegistrationTo(tokenId, AGENT_ID, "", user.address),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidMetadataURI");
    });

    it("Should update currentTokenId when applyTo with higher token ID", async function () {
      const highTokenId = 200;
      await spiritRegistry
        .connect(owner)
        .applyForRegistrationTo(highTokenId, AGENT_ID, METADATA_URI, user.address);

      expect(await spiritRegistry.totalSupply()).to.equal(highTokenId);
      expect(await spiritRegistry.ownerOf(highTokenId)).to.equal(user.address);
    });
  });

  describe("Token Functions After Minting", function () {
    const tokenId = 1;

    beforeEach(async function () {
      await spiritRegistry.connect(owner).applyForRegistration(tokenId, AGENT_ID, METADATA_URI);
    });

    it("Should return correct owner after minting", async function () {
      expect(await spiritRegistry.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("Should return correct token URI after minting", async function () {
      expect(await spiritRegistry.tokenURI(tokenId)).to.equal(METADATA_URI);
    });

    it("Should allow owner to update token URI", async function () {
      const newURI = "ipfs://QmNewTest789";
      await spiritRegistry.connect(owner).setTokenURI(tokenId, newURI);
      expect(await spiritRegistry.tokenURI(tokenId)).to.equal(newURI);
    });

    it("Should allow owner to update application status", async function () {
      await expect(spiritRegistry.connect(owner).setApplicationStatus(tokenId, "approved"))
        .to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(tokenId, AGENT_ID, "pending", "approved");

      expect(await spiritRegistry.getApplicationStatus(tokenId)).to.equal("approved");
    });

    it("Should maintain agent registry functionality", async function () {
      expect(await spiritRegistry.getAgentId(tokenId)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getTokenIdByAgentId(AGENT_ID)).to.equal(tokenId);
      expect(await spiritRegistry.isAgentRegistered(AGENT_ID)).to.be.true;

      const allAgents = await spiritRegistry.getAllRegisteredAgents();
      expect(allAgents).to.include(AGENT_ID);
      expect(await spiritRegistry.getTotalRegisteredAgents()).to.equal(1);
    });
  });

  describe("Multiple Token Scenarios", function () {
    it("Should handle multiple tokens with different IDs correctly", async function () {
      const tokenId1 = 5;
      const tokenId2 = 10;
      const tokenId3 = 15;

      await spiritRegistry.connect(owner).applyForRegistration(tokenId1, AGENT_ID, METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .applyForRegistrationTo(tokenId2, AGENT_ID_2, METADATA_URI_2, user.address);
      await spiritRegistry
        .connect(owner)
        .applyForRegistration(tokenId3, "test-agent-003", "ipfs://QmTest789");

      // Verify all tokens exist and have correct owners
      expect(await spiritRegistry.ownerOf(tokenId1)).to.equal(owner.address);
      expect(await spiritRegistry.ownerOf(tokenId2)).to.equal(user.address);
      expect(await spiritRegistry.ownerOf(tokenId3)).to.equal(owner.address);

      // Verify all have correct URIs and agent IDs
      expect(await spiritRegistry.tokenURI(tokenId1)).to.equal(METADATA_URI);
      expect(await spiritRegistry.tokenURI(tokenId2)).to.equal(METADATA_URI_2);
      expect(await spiritRegistry.getAgentId(tokenId1)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getAgentId(tokenId2)).to.equal(AGENT_ID_2);

      // Verify totalSupply is updated to highest token ID
      expect(await spiritRegistry.totalSupply()).to.equal(tokenId3);

      // Verify all agents are registered
      expect(await spiritRegistry.getTotalRegisteredAgents()).to.equal(3);
    });

    it("Should handle status filtering correctly", async function () {
      const tokenId1 = 1;
      const tokenId2 = 2;

      await spiritRegistry.connect(owner).applyForRegistration(tokenId1, AGENT_ID, METADATA_URI);
      await spiritRegistry
        .connect(owner)
        .applyForRegistration(tokenId2, AGENT_ID_2, METADATA_URI_2);

      // Set different statuses
      await spiritRegistry.connect(owner).setApplicationStatus(tokenId1, "approved");
      // tokenId2 stays "pending"

      const pendingTokens = await spiritRegistry.getTokenIdsByStatus("pending");
      const approvedTokens = await spiritRegistry.getTokenIdsByStatus("approved");

      expect(pendingTokens).to.have.lengthOf(1);
      expect(pendingTokens[0]).to.equal(tokenId2);
      expect(approvedTokens).to.have.lengthOf(1);
      expect(approvedTokens[0]).to.equal(tokenId1);

      const pendingAgents = await spiritRegistry.getAgentsByStatus("pending");
      const approvedAgents = await spiritRegistry.getAgentsByStatus("approved");

      expect(pendingAgents).to.have.lengthOf(1);
      expect(pendingAgents[0]).to.equal(AGENT_ID_2);
      expect(approvedAgents).to.have.lengthOf(1);
      expect(approvedAgents[0]).to.equal(AGENT_ID);
    });
  });

  describe("Compatibility with Existing Functions", function () {
    it("Should work alongside treasury mint function", async function () {
      // Treasury mint
      await spiritRegistry.connect(treasury).mint(user.address, AGENT_ID, METADATA_URI);

      // Owner apply
      await spiritRegistry.connect(owner).applyForRegistration(2, AGENT_ID_2, METADATA_URI_2);

      // Both should work correctly
      expect(await spiritRegistry.ownerOf(1)).to.equal(user.address);
      expect(await spiritRegistry.ownerOf(2)).to.equal(owner.address);
      expect(await spiritRegistry.getAgentId(1)).to.equal(AGENT_ID);
      expect(await spiritRegistry.getAgentId(2)).to.equal(AGENT_ID_2);
    });
  });
});
