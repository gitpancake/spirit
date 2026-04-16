import { expect } from "chai";
import { ethers } from "hardhat";

describe("PureSuperToken + DistributionPool Integration", function () {
  let pureSuperToken: any;
  let distributionPool: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy PureSuperToken
    const PureSuperToken = await ethers.getContractFactory("PureSuperToken");
    pureSuperToken = await PureSuperToken.deploy();

    // Deploy DistributionPool
    const DistributionPool = await ethers.getContractFactory("DistributionPool");
    distributionPool = await DistributionPool.deploy(
      await pureSuperToken.getAddress(), // token address
      owner.address, // initialOwner
    );
  });

  describe("Deployment", function () {
    it("Should deploy both contracts correctly", async function () {
      expect(await pureSuperToken.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await distributionPool.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set correct metadata URI", async function () {
      expect(await pureSuperToken.metadataURI()).to.equal("ipfs://QmTestMetadataURI");
    });

    it("Should set correct token in distribution pool", async function () {
      expect(await distributionPool.token()).to.equal(await pureSuperToken.getAddress());
    });
  });

  describe("Token Initialization", function () {
    it("Should initialize token with correct parameters", async function () {
      await pureSuperToken.initializeCustom("Test Token", "TEST", owner.address);

      expect(await pureSuperToken.isInitialized()).to.equal(true);
      expect(await pureSuperToken.name()).to.equal("Test Token");
      expect(await pureSuperToken.symbol()).to.equal("TEST");
      expect(await pureSuperToken.totalSupply()).to.equal(ethers.parseEther("1000000000"));
      expect(await pureSuperToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000000000"),
      );
    });

    it("Should not allow re-initialization", async function () {
      await pureSuperToken.initializeCustom("Test Token", "TEST", owner.address);

      await expect(
        pureSuperToken.initializeCustom("Another Token", "ANOTHER", user1.address),
      ).to.be.revertedWithCustomError(pureSuperToken, "AlreadyInitialized");
    });
  });

  describe("Distribution Pool Setup", function () {
    beforeEach(async function () {
      // Initialize the token first
      await pureSuperToken.initializeCustom("Test Token", "TEST", owner.address);
    });

    it("Should create distribution pool", async function () {
      await distributionPool.createDistributionPool();

      expect(await distributionPool.isPoolCreated()).to.equal(true);
      expect(await distributionPool.getDistributionPool()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should not allow pool creation twice", async function () {
      await distributionPool.createDistributionPool();

      await expect(distributionPool.createDistributionPool()).to.be.revertedWithCustomError(
        distributionPool,
        "PoolAlreadyExists",
      );
    });
  });

  describe("Revenue Distribution", function () {
    beforeEach(async function () {
      // Initialize the token
      await pureSuperToken.initializeCustom("Test Token", "TEST", owner.address);

      // Create distribution pool
      await distributionPool.createDistributionPool();

      // Transfer some tokens to users for testing
      await pureSuperToken.transfer(user1.address, ethers.parseEther("100000000"));
      await pureSuperToken.transfer(user2.address, ethers.parseEther("200000000"));
      await pureSuperToken.transfer(user3.address, ethers.parseEther("300000000"));
    });

    it("Should receive and track ETH revenue", async function () {
      const ethAmount = ethers.parseEther("1.0");

      await distributionPool.distributeRevenue({ value: ethAmount });

      expect(await distributionPool.getTotalEthReceived()).to.equal(ethAmount);
      expect(await distributionPool.getTotalEthDistributed()).to.equal(ethAmount);
    });

    it("Should handle direct ETH transfers", async function () {
      const ethAmount = ethers.parseEther("0.5");

      await user1.sendTransaction({
        to: await distributionPool.getAddress(),
        value: ethAmount,
      });

      expect(await distributionPool.getTotalEthReceived()).to.equal(ethAmount);
      expect(await distributionPool.getTotalEthDistributed()).to.equal(ethAmount);
    });

    it("Should not distribute without pool", async function () {
      // Deploy a new pool without creating the distribution pool
      const DistributionPool = await ethers.getContractFactory("DistributionPool");
      const newPool = await DistributionPool.deploy(
        await pureSuperToken.getAddress(),
        owner.address,
      );

      const ethAmount = ethers.parseEther("1.0");

      await expect(newPool.distributeRevenue({ value: ethAmount })).to.be.revertedWithCustomError(
        newPool,
        "NoDistributionPool",
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update metadata URI", async function () {
      const newURI = "ipfs://QmNewMetadataURI";
      await pureSuperToken.updateMetadataURI(newURI);

      expect(await pureSuperToken.metadataURI()).to.equal(newURI);
    });

    it("Should not allow non-owner to update metadata URI", async function () {
      const newURI = "ipfs://QmNewMetadataURI";

      await expect(
        pureSuperToken.connect(user1).updateMetadataURI(newURI),
      ).to.be.revertedWithCustomError(pureSuperToken, "CallerNotOwner");
    });

    it("Should allow owner to pause/unpause", async function () {
      await pureSuperToken.pause();
      expect(await pureSuperToken.paused()).to.equal(true);

      await pureSuperToken.unpause();
      expect(await pureSuperToken.paused()).to.equal(false);
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      await pureSuperToken.initializeCustom("Test Token", "TEST", owner.address);
    });

    it("Should allow normal transfers when not paused", async function () {
      const transferAmount = ethers.parseEther("1000000");

      await pureSuperToken.transfer(user1.address, transferAmount);
      expect(await pureSuperToken.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("Should not allow transfers when paused", async function () {
      await pureSuperToken.pause();

      const transferAmount = ethers.parseEther("1000000");

      await expect(
        pureSuperToken.transfer(user1.address, transferAmount),
      ).to.be.revertedWithCustomError(pureSuperToken, "PausableEnforced");
    });

    it("Should not allow transfers before initialization", async function () {
      const transferAmount = ethers.parseEther("1000000");

      await expect(
        pureSuperToken.transfer(user1.address, transferAmount),
      ).to.be.revertedWithCustomError(pureSuperToken, "NotInitialized");
    });
  });
});
