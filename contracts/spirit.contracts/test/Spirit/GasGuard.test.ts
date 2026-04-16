import { expect } from "chai";
import { ethers } from "hardhat";
import { Spirit } from "../../typechain-types";

describe("Spirit - Gas Guard Tests", function () {
  let spirit: Spirit;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;
  let user5: any;

  const METADATA_URI = "https://api.eden.xyz/metadata/spirit";

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const SpiritFactory = await ethers.getContractFactory("Spirit");
    spirit = await SpiritFactory.deploy(
      owner.address, // initialOwner
      user5.address, // edenPlatformWallet
      owner.address, // treasury
      user4.address, // reserve
      user3.address, // community
      METADATA_URI,
    );

    await spirit.waitForDeployment();
  });

  describe("Gas Guard Configuration", function () {
    it("Should have default gas guard configuration", async function () {
      console.log("=== GAS GUARD CONFIGURATION TEST ===");

      const config = await spirit.getGasGuardConfig();
      console.log("Gas guard configuration:");
      console.log("  - maxGasPerTransfer:", config.maxGasPerTransfer.toString());
      console.log("  - minGasLeft:", config.minGasLeft.toString());
      console.log("  - maxRecipientsPerTx:", config.maxRecipientsPerTx.toString());

      // Verify default values
      expect(config.maxGasPerTransfer).to.equal(150_000); // Base: ERC-20 ~150k, ETH ~100k
      expect(config.minGasLeft).to.equal(100_000); // Minimum gas to continue
      expect(config.maxRecipientsPerTx).to.equal(50); // Conservative batch size

      console.log("✅ Default gas guard configuration is correct");
    });

    it("Should allow owner to update gas guard configuration", async function () {
      console.log("=== GAS GUARD CONFIGURATION UPDATE TEST ===");

      const newMaxGasPerTransfer = 200_000;
      const newMinGasLeft = 150_000;
      const newMaxRecipientsPerTx = 75;

      console.log("Updating gas guard configuration...");
      await spirit.setGasGuardConfig(newMaxGasPerTransfer, newMinGasLeft, newMaxRecipientsPerTx);

      const config = await spirit.getGasGuardConfig();
      console.log("Updated configuration:");
      console.log("  - maxGasPerTransfer:", config.maxGasPerTransfer.toString());
      console.log("  - minGasLeft:", config.minGasLeft.toString());
      console.log("  - maxRecipientsPerTx:", config.maxRecipientsPerTx.toString());

      expect(config.maxGasPerTransfer).to.equal(newMaxGasPerTransfer);
      expect(config.minGasLeft).to.equal(newMinGasLeft);
      expect(config.maxRecipientsPerTx).to.equal(newMaxRecipientsPerTx);

      console.log("✅ Gas guard configuration updated successfully");
    });

    it("Should revert when non-owner tries to update gas guard configuration", async function () {
      console.log("=== GAS GUARD CONFIGURATION PERMISSION TEST ===");

      const newConfig = [200_000, 150_000, 75];

      console.log("Non-owner attempting to update gas guard configuration...");
      await expect(
        spirit.connect(user1).setGasGuardConfig(newConfig[0], newConfig[1], newConfig[2]),
      ).to.be.revertedWithCustomError(spirit, "OwnableUnauthorizedAccount");

      console.log("✅ Non-owner correctly blocked from updating gas guard configuration");
    });
  });

  describe("Gas Guard During ETH Distribution", function () {
    it("Should respect maxRecipientsPerTx limit", async function () {
      console.log("=== MAX RECIPIENTS PER TX TEST ===");

      // Create many holders by transferring tokens
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      const holders = [user1, user2, user3, user4, user5];

      for (const holder of holders) {
        await spirit.transfer(holder.address, transferAmount);
      }

      const holderCount = await spirit.totalHolders();
      console.log("Total holders:", holderCount.toString());

      // Set a very low maxRecipientsPerTx to trigger gas guard
      await spirit.setGasGuardConfig(150_000, 100_000, 2);

      const config = await spirit.getGasGuardConfig();
      console.log("Set maxRecipientsPerTx to:", config.maxRecipientsPerTx.toString());

      // Send ETH to trigger auto-distribution
      const ethAmount = ethers.parseEther("0.1");
      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for auto-distribution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check contract balance - should still have some ETH due to gas guard
      const contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after auto-distribution:", ethers.formatEther(contractBalance));

      // Should have some ETH remaining due to gas guard limiting recipients
      expect(contractBalance).to.be.greaterThan(0);

      console.log("✅ Gas guard correctly limited recipients per transaction");
    });

    it("Should emit GasGuardTriggered event when limit reached", async function () {
      console.log("=== GAS GUARD EVENT EMISSION TEST ===");

      // Create many holders
      const transferAmount = ethers.parseEther("1000000");
      const holders = [user1, user2, user3, user4, user5];

      for (const holder of holders) {
        await spirit.transfer(holder.address, transferAmount);
      }

      // Set very low maxRecipientsPerTx
      await spirit.setGasGuardConfig(150_000, 100_000, 1);

      // Send ETH to trigger auto-distribution
      const ethAmount = ethers.parseEther("0.1");
      const tx = await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for transaction
      await tx.wait();

      // Check for GasGuardTriggered event
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      const logs = receipt?.logs || [];

      let gasGuardEventFound = false;
      for (const log of logs) {
        try {
          const parsedLog = spirit.interface.parseLog(log);
          if (parsedLog?.name === "GasGuardTriggered") {
            gasGuardEventFound = true;
            console.log("GasGuardTriggered event found:", parsedLog.args);
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }

      expect(gasGuardEventFound).to.be.true;
      console.log("✅ GasGuardTriggered event emitted correctly");
    });
  });

  describe("Gas Guard During ERC-20 Distribution", function () {
    it("Should respect gas limits during ERC-20 distribution", async function () {
      console.log("=== ERC-20 GAS GUARD TEST ===");

      // Deploy mock ERC-20 token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockToken = await MockERC20.deploy("Mock Token", "MTK");
      await mockToken.waitForDeployment();

      // Add token support
      await spirit.setTokenSupport(await mockToken.getAddress(), true);

      // Mint tokens to contract
      const tokenAmount = ethers.parseEther("1000000");
      await mockToken.mint(await spirit.getAddress(), tokenAmount);

      // Create holders
      const transferAmount = ethers.parseEther("1000000");
      const holders = [user1, user2, user3, user4, user5];

      for (const holder of holders) {
        await spirit.transfer(holder.address, transferAmount);
      }

      // Set low maxRecipientsPerTx
      await spirit.setGasGuardConfig(150_000, 100_000, 2);

      // Distribute ERC-20 tokens
      const holderCount = await spirit.totalHolders();
      console.log("Distributing ERC-20 tokens to", holderCount.toString(), "holders...");

      await spirit.distributeERC20Batch(await mockToken.getAddress(), 0, Number(holderCount));

      // Check contract token balance
      const contractTokenBalance = await mockToken.balanceOf(await spirit.getAddress());
      console.log(
        "Contract token balance after distribution:",
        ethers.formatEther(contractTokenBalance),
      );

      // Should have some tokens remaining due to gas guard
      expect(contractTokenBalance).to.be.greaterThan(0);

      console.log("✅ Gas guard correctly limited ERC-20 distribution");
    });
  });

  describe("Gas Guard DoS Prevention", function () {
    it("Should prevent DoS via heavy fallback functions", async function () {
      console.log("=== DOS PREVENTION TEST ===");

      // Deploy a contract with a heavy fallback function
      const HeavyFallbackContract = await ethers.getContractFactory("UltraFailingContract");
      const heavyContract = await HeavyFallbackContract.deploy();
      await heavyContract.waitForDeployment();

      // Add the heavy contract as a holder
      const transferAmount = ethers.parseEther("1000000");
      await spirit.transfer(await heavyContract.getAddress(), transferAmount);

      const holderCount = await spirit.totalHolders();
      console.log(
        "Added heavy fallback contract as holder. Total holders:",
        holderCount.toString(),
      );

      // Set conservative gas limits
      await spirit.setGasGuardConfig(100_000, 200_000, 10);

      // Send ETH to trigger auto-distribution
      const ethAmount = ethers.parseEther("0.1");
      const tx = await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for transaction
      await tx.wait();

      // Check contract balance
      const contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after distribution:", ethers.formatEther(contractBalance));

      // Distribution should complete without OOG, even with heavy fallback
      expect(contractBalance).to.be.lessThan(ethAmount);

      console.log("✅ Gas guard prevented DoS via heavy fallback function");
    });
  });

  describe("Off-Chain Batching Support", function () {
    it("Should provide information for off-chain batch sizing", async function () {
      console.log("=== OFF-CHAIN BATCHING SUPPORT TEST ===");

      // Create many holders
      const transferAmount = ethers.parseEther("1000000");
      const holders = [user1, user2, user3, user4, user5];

      for (const holder of holders) {
        await spirit.transfer(holder.address, transferAmount);
      }

      const holderCount = await spirit.totalHolders();
      console.log("Total holders:", holderCount.toString());

      // Get gas guard config for off-chain batching
      const config = await spirit.getGasGuardConfig();
      console.log("Gas guard config for off-chain batching:");
      console.log("  - maxGasPerTransfer:", config.maxGasPerTransfer.toString());
      console.log("  - minGasLeft:", config.minGasLeft.toString());
      console.log("  - maxRecipientsPerTx:", config.maxRecipientsPerTx.toString());

      // Calculate recommended batch size for off-chain batching
      const recommendedBatchSize = Math.min(
        Number(config.maxRecipientsPerTx),
        Math.floor(Number(config.maxGasPerTransfer) / 150_000), // Base: ~150k gas per transfer
      );

      console.log("Recommended off-chain batch size:", recommendedBatchSize);

      // Verify the recommendation is reasonable
      expect(recommendedBatchSize).to.be.greaterThan(0);
      expect(recommendedBatchSize).to.be.lessThanOrEqual(Number(config.maxRecipientsPerTx));

      console.log("✅ Gas guard configuration provides useful info for off-chain batching");
    });
  });
});
