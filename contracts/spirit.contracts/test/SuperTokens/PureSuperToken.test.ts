import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { PureSuperToken } from "../typechain-types";

describe("PureSuperToken", function () {
  let pureSuperToken: PureSuperToken;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const PureSuperTokenFactory = await ethers.getContractFactory("PureSuperToken");
    pureSuperToken = await PureSuperTokenFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pureSuperToken.owner()).to.equal(owner.address);
    });

    it("Should not be initialized initially", async function () {
      expect(await pureSuperToken.isInitialized()).to.equal(false);
    });
  });

  describe("Initialization", function () {
    it("Should initialize correctly", async function () {
      await pureSuperToken.initializeCustom(
        ethers.ZeroAddress, // factory
        "Test Token",
        "TEST",
        owner.address, // receiver
      );

      expect(await pureSuperToken.isInitialized()).to.equal(true);
      expect(await pureSuperToken.name()).to.equal("Test Token");
      expect(await pureSuperToken.symbol()).to.equal("TEST");
      expect(await pureSuperToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000000000"),
      );
    });

    it("Should not allow re-initialization", async function () {
      await pureSuperToken.initializeCustom(
        ethers.ZeroAddress,
        "Test Token",
        "TEST",
        owner.address,
      );

      await expect(
        pureSuperToken.initializeCustom(ethers.ZeroAddress, "Test Token 2", "TEST2", owner.address),
      ).to.be.revertedWithCustomError(pureSuperToken, "AlreadyInitialized");
    });
  });

  describe("Token Distribution", function () {
    it("Should have 1 billion total supply", async function () {
      expect(await pureSuperToken.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should have no remaining mintable supply", async function () {
      expect(await pureSuperToken.remainingMintableSupply()).to.equal(0);
    });
  });

  describe("Revenue Distribution", function () {
    it("Should require distribution pool to be created first", async function () {
      const ethAmount = ethers.parseEther("1.0");

      await expect(
        pureSuperToken.distributeRevenue({ value: ethAmount }),
      ).to.be.revertedWithCustomError(pureSuperToken, "NoDistributionPool");
    });

    it("Should create distribution pool", async function () {
      await pureSuperToken.createDistributionPool();

      expect(await pureSuperToken.isDistributionPoolCreated()).to.equal(true);
      expect(await pureSuperToken.distributionPool()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should emit pool creation events", async function () {
      await expect(pureSuperToken.createDistributionPool())
        .to.emit(pureSuperToken, "DistributionPoolCreated")
        .and.to.emit(pureSuperToken, "DistributionPoolConfigured");
    });

    it("Should not allow pool creation twice", async function () {
      await pureSuperToken.createDistributionPool();

      await expect(pureSuperToken.createDistributionPool()).to.be.revertedWithCustomError(
        pureSuperToken,
        "PoolAlreadyExists",
      );
    });

    it("Should receive ETH and track revenue after pool creation", async function () {
      await pureSuperToken.createDistributionPool();

      const ethAmount = ethers.parseEther("1.0");
      await pureSuperToken.distributeRevenue({ value: ethAmount });

      expect(await pureSuperToken.totalEthReceived()).to.equal(ethAmount);
    });

    it("Should emit revenue received events", async function () {
      await pureSuperToken.createDistributionPool();

      const ethAmount = ethers.parseEther("0.5");

      await expect(pureSuperToken.distributeRevenue({ value: ethAmount }))
        .to.emit(pureSuperToken, "EthRevenueReceived")
        .withArgs(owner.address, ethAmount, await time());
    });

    it("Should handle direct ETH transfers after pool creation", async function () {
      await pureSuperToken.createDistributionPool();

      const ethAmount = ethers.parseEther("0.1");

      await owner.sendTransaction({
        to: await pureSuperToken.getAddress(),
        value: ethAmount,
      });

      expect(await pureSuperToken.totalEthReceived()).to.equal(ethAmount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await pureSuperToken.initializeCustom(
        ethers.ZeroAddress,
        "Test Token",
        "TEST",
        owner.address,
      );

      // Transfer some tokens to addr1 for testing burning
      await pureSuperToken.transfer(addr1.address, ethers.parseEther("1000"));
    });

    it("Should allow users to burn their own tokens", async function () {
      await pureSuperToken.connect(addr1).burn(ethers.parseEther("500"));
      expect(await pureSuperToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
      expect(await pureSuperToken.totalBurned()).to.equal(ethers.parseEther("500"));
    });
  });
});
