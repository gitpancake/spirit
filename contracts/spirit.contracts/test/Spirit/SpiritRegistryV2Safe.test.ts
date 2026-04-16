import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  SpiritIdentityRegistryV2, 
  SpiritValidationRegistry,
  SpiritReputationRegistry,
  SpiritRegistryController 
} from "../../typechain-types";

describe("Spirit Registry V2 - Safe Multisig Integration", function () {
  let identityRegistry: SpiritIdentityRegistryV2;
  let validationRegistry: SpiritValidationRegistry;
  let reputationRegistry: SpiritReputationRegistry;
  let controller: SpiritRegistryController;
  
  let owner: SignerWithAddress;
  let agentEOA: SignerWithAddress;
  let artistAddress: SignerWithAddress;
  let safeAddress: SignerWithAddress;
  let validator: SignerWithAddress;
  let user: SignerWithAddress;

  const METADATA_URI = "ipfs://QmTestAgentMetadata";
  const VALIDATION_URI = "ipfs://QmTestValidation";
  const REPUTATION_URI = "ipfs://QmTestReputation";

  beforeEach(async function () {
    [owner, agentEOA, artistAddress, safeAddress, validator, user] = await ethers.getSigners();

    // Deploy Identity Registry V2
    const IdentityFactory = await ethers.getContractFactory("SpiritIdentityRegistryV2");
    identityRegistry = await IdentityFactory.deploy(owner.address);
    await identityRegistry.waitForDeployment();

    // Deploy Validation Registry
    const ValidationFactory = await ethers.getContractFactory("SpiritValidationRegistry");
    validationRegistry = await ValidationFactory.deploy(
      await identityRegistry.getAddress(),
      owner.address
    );
    await validationRegistry.waitForDeployment();

    // Deploy Reputation Registry
    const ReputationFactory = await ethers.getContractFactory("SpiritReputationRegistry");
    reputationRegistry = await ReputationFactory.deploy(
      await identityRegistry.getAddress(),
      owner.address
    );
    await reputationRegistry.waitForDeployment();

    // Deploy Controller (without Safe factory for testing)
    const ControllerFactory = await ethers.getContractFactory("SpiritRegistryController");
    controller = await ControllerFactory.deploy(
      await identityRegistry.getAddress(),
      await validationRegistry.getAddress(),
      await reputationRegistry.getAddress(),
      ethers.ZeroAddress, // No Safe factory in test
      owner.address
    );
    await controller.waitForDeployment();
  });

  describe("Identity Registry V2 - Safe Support", function () {
    it("Should register agent with Safe multisig as NFT owner", async function () {
      const tx = await identityRegistry.connect(owner).registerAgent(
        agentEOA.address,
        artistAddress.address,
        safeAddress.address,
        METADATA_URI
      );

      const receipt = await tx.wait();
      const agentId = 1;

      // Verify NFT ownership
      expect(await identityRegistry.ownerOf(agentId)).to.equal(safeAddress.address);

      // Verify identity data
      const identity = await identityRegistry.getAgentIdentityV2(agentId);
      expect(identity.agentEOA).to.equal(agentEOA.address);
      expect(identity.artistAddress).to.equal(artistAddress.address);
      expect(identity.safeAddress).to.equal(safeAddress.address);
      expect(identity.registrationURI).to.equal(METADATA_URI);
      expect(identity.isActive).to.be.true;
      expect(identity.nonce).to.equal(0);

      // Check event emission
      await expect(tx)
        .to.emit(identityRegistry, "AgentRegisteredV2")
        .withArgs(agentId, agentEOA.address, artistAddress.address, safeAddress.address, METADATA_URI);
    });

    it("Should maintain backwards compatibility with legacy registration", async function () {
      // Call legacy registration (3 params)
      const tx = await identityRegistry.connect(owner)["registerAgent(address,address,string)"](
        agentEOA.address,
        artistAddress.address,
        METADATA_URI
      );

      const agentId = 1;
      
      // NFT should be owned by artist (legacy behavior)
      expect(await identityRegistry.ownerOf(agentId)).to.equal(artistAddress.address);
      
      // Legacy getAgentIdentity should work
      const identity = await identityRegistry.getAgentIdentity(agentId);
      expect(identity.agentEOA).to.equal(agentEOA.address);
      expect(identity.artistAddress).to.equal(artistAddress.address);
    });
  });

  describe("EIP-712 Signature Verification", function () {
    let agentId: number;
    let domain: any;
    let types: any;

    beforeEach(async function () {
      // Register an agent
      await identityRegistry.connect(owner).registerAgent(
        agentEOA.address,
        artistAddress.address,
        safeAddress.address,
        METADATA_URI
      );
      agentId = 1;

      // EIP-712 domain
      domain = {
        name: "SpiritIdentityRegistry",
        version: "2.0.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await identityRegistry.getAddress()
      };

      // EIP-712 types
      types = {
        AgentClaim: [
          { name: "agentId", type: "uint256" },
          { name: "statement", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ],
        AgentVerification: [
          { name: "agentId", type: "uint256" },
          { name: "agentEOA", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      };
    });

    it("Should verify agent claim with EIP-712 signature", async function () {
      const statement = "I am an AI agent trained by this artist";
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await identityRegistry.getAgentNonce(agentId);

      // Create EIP-712 signature
      const message = {
        agentId: agentId,
        statement: statement,
        timestamp: timestamp,
        nonce: nonce
      };

      const signature = await agentEOA.signTypedData(domain, types, message);

      // Verify the claim
      const isValid = await identityRegistry.verifyAgentClaim(
        agentId,
        statement,
        timestamp,
        signature
      );

      expect(isValid).to.be.true;

      // Nonce should be incremented
      expect(await identityRegistry.getAgentNonce(agentId)).to.equal(nonce + 1n);
    });

    it("Should verify agent control with EIP-712", async function () {
      const nonce = await identityRegistry.getAgentNonce(agentId);

      // Create verification signature
      const message = {
        agentId: agentId,
        agentEOA: agentEOA.address,
        nonce: nonce
      };

      const signature = await agentEOA.signTypedData(
        domain, 
        { AgentVerification: types.AgentVerification },
        message
      );

      // Verify agent control
      const isValid = await identityRegistry.verifyAgentControl(agentId, signature);
      expect(isValid).to.be.true;

      // Nonce should be incremented
      expect(await identityRegistry.getAgentNonce(agentId)).to.equal(nonce + 1n);
    });

    it("Should reject signature from wrong signer", async function () {
      const statement = "Fake claim";
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await identityRegistry.getAgentNonce(agentId);

      const message = {
        agentId: agentId,
        statement: statement,
        timestamp: timestamp,
        nonce: nonce
      };

      // Sign with wrong account
      const signature = await artistAddress.signTypedData(domain, types, message);

      const isValid = await identityRegistry.verifyAgentClaim(
        agentId,
        statement,
        timestamp,
        signature
      );

      expect(isValid).to.be.false;
      
      // Nonce should NOT be incremented
      expect(await identityRegistry.getAgentNonce(agentId)).to.equal(nonce);
    });

    it("Should verify basic message signature", async function () {
      const message = "Hello, I am an AI agent";
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
      const signature = await agentEOA.signMessage(ethers.getBytes(messageHash));

      const isValid = await identityRegistry.verifyAgentSignature(
        agentId,
        messageHash,
        signature
      );

      expect(isValid).to.be.true;
    });
  });

  describe("Registry Controller", function () {
    it("Should setup new agent across all registries", async function () {
      const config = {
        agentEOA: agentEOA.address,
        artistAddress: artistAddress.address,
        safeAddress: safeAddress.address,
        registrationURI: METADATA_URI,
        validationURI: VALIDATION_URI,
        initialRepURI: REPUTATION_URI,
        initialScore: 75,
        deploySafe: false,
        requestValidation: true,
        seedReputation: true
      };

      const tx = await controller.connect(owner).setupNewAgent(config);
      const receipt = await tx.wait();

      // Get the result from the transaction
      const agentId = 1;

      // Verify identity registration
      expect(await identityRegistry.ownerOf(agentId)).to.equal(safeAddress.address);
      
      const identity = await identityRegistry.getAgentIdentityV2(agentId);
      expect(identity.agentEOA).to.equal(agentEOA.address);
      expect(identity.safeAddress).to.equal(safeAddress.address);

      // Verify validation request created
      const validations = await validationRegistry.getAgentValidations(agentId);
      expect(validations.length).to.equal(1);
      expect(validations[0].validatorAddress).to.equal(artistAddress.address);

      // Verify reputation seeded
      const repSummary = await reputationRegistry.getSummary(
        agentId,
        [],
        ethers.ZeroHash,
        ethers.ZeroHash
      );
      expect(repSummary.totalFeedbackCount).to.equal(1);
      expect(repSummary.averageScore).to.equal(75);

      // Check event
      await expect(tx)
        .to.emit(controller, "AgentSetupCompleted")
        .withArgs(agentId, agentEOA.address, safeAddress.address, true, true);
    });

    it("Should perform quick setup with minimal configuration", async function () {
      const tx = await controller.connect(owner).quickSetup(
        agentEOA.address,
        artistAddress.address,
        METADATA_URI,
        false // Don't deploy Safe
      );

      const receipt = await tx.wait();
      
      // Verify agent was created
      expect(await identityRegistry.totalAgents()).to.equal(1);
      
      const agentId = 1;
      const identity = await identityRegistry.getAgentIdentityV2(agentId);
      expect(identity.agentEOA).to.equal(agentEOA.address);
      expect(identity.artistAddress).to.equal(artistAddress.address);
    });

    it("Should allow authorized operators to setup agents", async function () {
      // Authorize an operator
      await controller.connect(owner).setSetupOperator(user.address, true);
      expect(await controller.isSetupOperator(user.address)).to.be.true;

      // Operator can now setup agents
      const config = {
        agentEOA: agentEOA.address,
        artistAddress: artistAddress.address,
        safeAddress: safeAddress.address,
        registrationURI: METADATA_URI,
        validationURI: "",
        initialRepURI: "",
        initialScore: 0,
        deploySafe: false,
        requestValidation: false,
        seedReputation: false
      };

      await expect(controller.connect(user).setupNewAgent(config))
        .to.not.be.reverted;
    });

    it("Should reject unauthorized setup attempts", async function () {
      const config = {
        agentEOA: agentEOA.address,
        artistAddress: artistAddress.address,
        safeAddress: safeAddress.address,
        registrationURI: METADATA_URI,
        validationURI: "",
        initialRepURI: "",
        initialScore: 0,
        deploySafe: false,
        requestValidation: false,
        seedReputation: false
      };

      await expect(controller.connect(user).setupNewAgent(config))
        .to.be.revertedWith("Unauthorized");
    });
  });

  describe("Graduation and Management", function () {
    let agentId: number;

    beforeEach(async function () {
      await identityRegistry.connect(owner).registerAgent(
        agentEOA.address,
        artistAddress.address,
        safeAddress.address,
        METADATA_URI
      );
      agentId = 1;
    });

    it("Should graduate an agent", async function () {
      expect(await identityRegistry.hasGraduated(agentId)).to.be.false;

      await identityRegistry.connect(owner).graduateAgent(agentId);

      expect(await identityRegistry.hasGraduated(agentId)).to.be.true;
      expect(await identityRegistry.totalGraduated()).to.equal(1);
    });

    it("Should deactivate and reactivate an agent", async function () {
      expect(await identityRegistry.isAgentActive(agentId)).to.be.true;

      await identityRegistry.connect(owner).deactivateAgent(agentId);
      expect(await identityRegistry.isAgentActive(agentId)).to.be.false;

      await identityRegistry.connect(owner).reactivateAgent(agentId);
      expect(await identityRegistry.isAgentActive(agentId)).to.be.true;
    });

    it("Should update agent EOA and reset nonce", async function () {
      // Increment nonce first
      const nonce = await identityRegistry.getAgentNonce(agentId);
      const message = {
        agentId: agentId,
        agentEOA: agentEOA.address,
        nonce: nonce
      };

      const domain = {
        name: "SpiritIdentityRegistry",
        version: "2.0.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await identityRegistry.getAddress()
      };

      const types = {
        AgentVerification: [
          { name: "agentId", type: "uint256" },
          { name: "agentEOA", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const signature = await agentEOA.signTypedData(domain, types, message);
      await identityRegistry.verifyAgentControl(agentId, signature);

      expect(await identityRegistry.getAgentNonce(agentId)).to.equal(1);

      // Update EOA
      await identityRegistry.connect(owner).updateAgentEOA(agentId, user.address);

      // Nonce should be reset
      expect(await identityRegistry.getAgentNonce(agentId)).to.equal(0);
      expect(await identityRegistry.getAgentEOA(agentId)).to.equal(user.address);
    });
  });
});