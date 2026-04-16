import { expect } from "chai";
import { ethers } from "hardhat";
import { SpiritRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SpiritRegistry Application Status", function () {
  let spiritRegistry: SpiritRegistry;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user: SignerWithAddress;

  const AGENT_ID = "test-agent-001";
  const METADATA_URI = "ipfs://QmTest123";

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

  describe("Application Status Functionality", function () {
    let tokenId: number;

    beforeEach(async function () {
      // Mint an agent first
      await spiritRegistry.connect(treasury).mint(user.address, AGENT_ID, METADATA_URI);
      tokenId = 1; // First token will have ID 1
    });

    it("Should initialize agent status as 'pending' upon minting", async function () {
      const status = await spiritRegistry.getApplicationStatus(tokenId);
      expect(status).to.equal("pending");
    });

    it("Should allow owner to set application status", async function () {
      await expect(spiritRegistry.connect(owner).setApplicationStatus(tokenId, "approved"))
        .to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(tokenId, AGENT_ID, "pending", "approved");

      const status = await spiritRegistry.getApplicationStatus(tokenId);
      expect(status).to.equal("approved");
    });

    it("Should allow owner to set application status by agentId", async function () {
      await expect(
        spiritRegistry.connect(owner).setApplicationStatusByAgentId(AGENT_ID, "approved"),
      )
        .to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .withArgs(tokenId, AGENT_ID, "pending", "approved");

      const status = await spiritRegistry.getApplicationStatusByAgentId(AGENT_ID);
      expect(status).to.equal("approved");
    });

    it("Should not allow non-owner to set application status", async function () {
      await expect(
        spiritRegistry.connect(user).setApplicationStatus(tokenId, "approved"),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow setting status for non-existent token", async function () {
      await expect(
        spiritRegistry.connect(owner).setApplicationStatus(999, "approved"),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidTokenId");
    });

    it("Should not allow empty status string", async function () {
      await expect(
        spiritRegistry.connect(owner).setApplicationStatus(tokenId, ""),
      ).to.be.revertedWithCustomError(spiritRegistry, "InvalidApplicationStatus");
    });

    it("Should return correct agents by status", async function () {
      // Mint another agent
      const AGENT_ID_2 = "test-agent-002";
      await spiritRegistry.connect(treasury).mint(user.address, AGENT_ID_2, METADATA_URI);
      const tokenId2 = 2;

      // Set different statuses using tokenId
      await spiritRegistry.connect(owner).setApplicationStatus(tokenId, "approved");
      await spiritRegistry.connect(owner).setApplicationStatus(tokenId2, "rejected");

      const pendingTokens = await spiritRegistry.getTokenIdsByStatus("pending");
      const approvedTokens = await spiritRegistry.getTokenIdsByStatus("approved");
      const rejectedTokens = await spiritRegistry.getTokenIdsByStatus("rejected");

      expect(pendingTokens).to.have.lengthOf(0);
      expect(approvedTokens).to.have.lengthOf(1);
      expect(approvedTokens[0]).to.equal(tokenId);
      expect(rejectedTokens).to.have.lengthOf(1);
      expect(rejectedTokens[0]).to.equal(tokenId2);

      // Test backward compatibility with agentId filtering
      const approvedAgents = await spiritRegistry.getAgentsByStatus("approved");
      expect(approvedAgents).to.have.lengthOf(1);
      expect(approvedAgents[0]).to.equal(AGENT_ID);
    });

    it("Should support batch status updates", async function () {
      // Mint additional agents
      const AGENT_ID_2 = "test-agent-002";
      const AGENT_ID_3 = "test-agent-003";

      await spiritRegistry.connect(treasury).mint(user.address, AGENT_ID_2, METADATA_URI);
      await spiritRegistry.connect(treasury).mint(user.address, AGENT_ID_3, METADATA_URI);

      const tokenId2 = 2;
      const tokenId3 = 3;

      // Batch update statuses using tokenIds
      await expect(
        spiritRegistry
          .connect(owner)
          .batchSetApplicationStatus(
            [tokenId, tokenId2, tokenId3],
            ["approved", "approved", "rejected"],
          ),
      )
        .to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .and.to.emit(spiritRegistry, "ApplicationStatusUpdated")
        .and.to.emit(spiritRegistry, "ApplicationStatusUpdated");

      expect(await spiritRegistry.getApplicationStatus(tokenId)).to.equal("approved");
      expect(await spiritRegistry.getApplicationStatus(tokenId2)).to.equal("approved");
      expect(await spiritRegistry.getApplicationStatus(tokenId3)).to.equal("rejected");
    });

    it("Should clean up application status when agent is burned", async function () {
      // Burn the agent
      await spiritRegistry.connect(treasury).burn(tokenId);

      // Status should be cleaned up - trying to access should fail
      await expect(spiritRegistry.getApplicationStatus(tokenId)).to.be.revertedWithCustomError(
        spiritRegistry,
        "InvalidTokenId",
      );
    });

    it("Should handle various status strings correctly", async function () {
      const statuses = ["pending", "approved", "rejected", "active", "suspended", "under-review"];

      for (const status of statuses) {
        await spiritRegistry.connect(owner).setApplicationStatus(tokenId, status);
        expect(await spiritRegistry.getApplicationStatus(tokenId)).to.equal(status);
      }
    });
  });
});
