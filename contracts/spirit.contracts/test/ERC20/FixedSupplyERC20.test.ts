import { expect } from "chai";
import { ethers } from "hardhat";
import { FixedSupplyERC20 } from "../../typechain-types";

describe("FixedSupplyERC20", function () {
  let fixedToken: FixedSupplyERC20;
  let deployer: any;
  let user1: any;
  let user2: any;

  const tokenName = "Fixed Supply Token";
  const tokenSymbol = "FIX";
  const initialSupply = ethers.parseEther("500000"); // 500K tokens

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    const FixedSupplyERC20 = await ethers.getContractFactory("FixedSupplyERC20");
    fixedToken = await FixedSupplyERC20.deploy(
      tokenName,
      tokenSymbol,
      initialSupply,
      deployer.address, // initial holder
    );
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await fixedToken.name()).to.equal(tokenName);
      expect(await fixedToken.symbol()).to.equal(tokenSymbol);
    });

    it("Should set the correct initial supply", async function () {
      expect(await fixedToken.totalSupply()).to.equal(initialSupply);
    });

    it("Should assign initial supply to deployer", async function () {
      expect(await fixedToken.balanceOf(deployer.address)).to.equal(initialSupply);
    });

    it("Should have 18 decimals", async function () {
      expect(await fixedToken.decimals()).to.equal(18);
    });
  });

  describe("Standard ERC-20 Functions", function () {
    it("Should allow transfers between users", async function () {
      const transferAmount = ethers.parseEther("1000");
      const initialBalance = await fixedToken.balanceOf(deployer.address);

      await fixedToken.transfer(user1.address, transferAmount);

      expect(await fixedToken.balanceOf(deployer.address)).to.equal(
        initialBalance - transferAmount,
      );
      expect(await fixedToken.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("Should allow approved transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      const initialBalance = await fixedToken.balanceOf(deployer.address);

      // Approve user1 to spend tokens
      await fixedToken.approve(user1.address, transferAmount);

      // User1 transfers tokens from deployer to user2
      await fixedToken.connect(user1).transferFrom(deployer.address, user2.address, transferAmount);

      expect(await fixedToken.balanceOf(deployer.address)).to.equal(
        initialBalance - transferAmount,
      );
      expect(await fixedToken.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await fixedToken.allowance(deployer.address, user1.address)).to.equal(0);
    });

    it("Should revert transfer if insufficient balance", async function () {
      const transferAmount = initialSupply + ethers.parseEther("1");

      await expect(
        fixedToken.transfer(user1.address, transferAmount),
      ).to.be.revertedWithCustomError(fixedToken, "ERC20InsufficientBalance");
    });

    it("Should revert transferFrom if insufficient allowance", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Approve less than transfer amount
      await fixedToken.approve(user1.address, transferAmount - ethers.parseEther("100"));

      await expect(
        fixedToken.connect(user1).transferFrom(deployer.address, user2.address, transferAmount),
      ).to.be.revertedWithCustomError(fixedToken, "ERC20InsufficientAllowance");
    });

    it("Should revert transfer to zero address", async function () {
      await expect(
        fixedToken.transfer(ethers.ZeroAddress, ethers.parseEther("1000")),
      ).to.be.revertedWithCustomError(fixedToken, "ERC20InvalidReceiver");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await fixedToken.balanceOf(deployer.address);

      await fixedToken.burn(burnAmount);

      expect(await fixedToken.balanceOf(deployer.address)).to.equal(initialBalance - burnAmount);
      expect(await fixedToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should revert if burning zero amount", async function () {
      await expect(fixedToken.burn(0)).to.be.revertedWithCustomError(fixedToken, "InvalidAmount");
    });

    it("Should revert if burning more than balance", async function () {
      const burnAmount = initialSupply + ethers.parseEther("1");

      await expect(fixedToken.burn(burnAmount)).to.be.revertedWithCustomError(
        fixedToken,
        "ERC20InsufficientBalance",
      );
    });
  });

  describe("Supply Management", function () {
    it("Should maintain fixed supply characteristics", async function () {
      // Transfer some tokens to users
      await fixedToken.transfer(user1.address, ethers.parseEther("10000"));
      await fixedToken.transfer(user2.address, ethers.parseEther("20000"));

      // Burn some tokens
      await fixedToken.burn(ethers.parseEther("5000"));

      // Total supply should be reduced
      const expectedSupply = initialSupply - ethers.parseEther("5000");
      expect(await fixedToken.totalSupply()).to.equal(expectedSupply);

      // No minting function should exist
      expect(fixedToken.mint).to.be.undefined;
    });

    it("Should allow multiple users to hold tokens", async function () {
      const transfer1 = ethers.parseEther("10000");
      const transfer2 = ethers.parseEther("20000");

      await fixedToken.transfer(user1.address, transfer1);
      await fixedToken.transfer(user2.address, transfer2);

      expect(await fixedToken.balanceOf(user1.address)).to.equal(transfer1);
      expect(await fixedToken.balanceOf(user2.address)).to.equal(transfer2);
      expect(await fixedToken.balanceOf(deployer.address)).to.equal(
        initialSupply - transfer1 - transfer2,
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small amounts", async function () {
      const smallAmount = 1; // 1 wei

      await fixedToken.transfer(user1.address, smallAmount);
      expect(await fixedToken.balanceOf(user1.address)).to.equal(smallAmount);
    });

    it("Should handle maximum uint256 values", async function () {
      const maxAmount = ethers.MaxUint256;

      // This should revert due to insufficient balance
      await expect(fixedToken.transfer(user1.address, maxAmount)).to.be.revertedWithCustomError(
        fixedToken,
        "ERC20InsufficientBalance",
      );
    });

    it("Should maintain consistency after multiple operations", async function () {
      // Transfer tokens to users
      await fixedToken.transfer(user1.address, ethers.parseEther("1000"));
      await fixedToken.transfer(user2.address, ethers.parseEther("2000"));

      // Burn some tokens from deployer
      await fixedToken.burn(ethers.parseEther("500"));

      // Transfer from user1 to user2
      await fixedToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));

      // Verify final balances
      expect(await fixedToken.balanceOf(deployer.address)).to.equal(
        initialSupply - ethers.parseEther("3500"),
      );
      expect(await fixedToken.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
      expect(await fixedToken.balanceOf(user2.address)).to.equal(ethers.parseEther("2500"));
      expect(await fixedToken.totalSupply()).to.equal(initialSupply - ethers.parseEther("500"));
    });
  });
});
