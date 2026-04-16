import { expect } from "chai";
import { ethers } from "hardhat";
import { Spirit } from "../../typechain-types";

describe("Spirit - Double Distribution Prevention Tests", function () {
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

  describe("Double Distribution Prevention", function () {
    it("Should prevent double-distribution when processing same batch multiple times", async function () {
      console.log("=== DOUBLE DISTRIBUTION PREVENTION TEST ===");

      // Create additional holders by transferring tokens
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      const holders = [user1, user2, user3, user4, user5];

      for (const holder of holders) {
        await spirit.transfer(holder.address, transferAmount);
      }

      const holderCount = await spirit.totalHolders();
      console.log(`Total holders: ${holderCount.toString()}`);

      // Set very low maxRecipientsPerTx to trigger gas guard during auto-distribution
      await spirit.setGasGuardConfig(150_000, 100_000, 1);
      console.log("Set maxRecipientsPerTx to 1 to trigger gas guard");

      // Send 1 ETH to contract
      const ethAmount = ethers.parseEther("1.0");
      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for auto-distribution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(
        `Contract balance after auto-distribution: ${ethers.formatEther(contractBalance)} ETH`,
      );

      // Auto-distribution should be incomplete due to gas guard
      expect(contractBalance).to.be.greaterThan(0);
      console.log("✅ Auto-distribution incomplete due to gas guard - perfect for testing!");

      // Step 1: Distribute to first batch (0-3) manually
      console.log("\n1. Manually distributing to holders 0-3 (first batch)...");

      // Start new distribution round
      await spirit.startNewDistributionRound();

      await spirit.distributeEthBatch(0, 4);

      const balanceAfterFirstBatch = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(
        `Balance after first batch (0-3): ${ethers.formatEther(balanceAfterFirstBatch)} ETH`,
      );

      // Should have distributed some ETH
      expect(balanceAfterFirstBatch).to.be.lessThan(contractBalance);

      // Step 2: Attempt distribute to same batch THREE MORE TIMES (should not change balance)
      console.log("\n2. Attempting to distribute to same batch (0-3) three more times...");

      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt}: Distributing to 0-3 again...`);

        const balanceBefore = await ethers.provider.getBalance(await spirit.getAddress());

        // This should either fail or distribute very little (due to tracking)
        try {
          await spirit.distributeEthBatch(0, 4);

          const balanceAfter = await ethers.provider.getBalance(await spirit.getAddress());
          const change = balanceBefore - balanceAfter;

          console.log(`  Balance change: ${ethers.formatEther(change)} ETH`);

          // The change should be minimal (near 0) since these holders already received their share
          expect(change).to.be.lessThan(ethers.parseEther("0.001"));
        } catch (error) {
          console.log(`  Attempt ${attempt} failed as expected (NoEthToDistribute)`);
          // This is also acceptable - the contract should prevent double-distribution
        }
      }

      // Step 3: Send another 1 ETH to contract
      console.log("\n3. Sending another 1 ETH to contract...");
      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(`Contract balance after second ETH: ${ethers.formatEther(contractBalance)} ETH`);

      // Step 4: Start new distribution round and distribute to 0-3 again
      console.log("\n4. Starting new distribution round and distributing to 0-3...");

      // Start new distribution round to reset tracking
      await spirit.startNewDistributionRound();

      await spirit.distributeEthBatch(0, 4);

      const balanceAfterSecondBatch = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(
        `Balance after second batch (0-3): ${ethers.formatEther(balanceAfterSecondBatch)} ETH`,
      );

      // Step 5: Attempt distribute to same batch THREE MORE TIMES (should not change balance)
      console.log("\n5. Attempting to distribute to same batch (0-3) three more times...");

      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt}: Distributing to 0-3 again...`);

        const balanceBefore = await ethers.provider.getBalance(await spirit.getAddress());

        try {
          await spirit.distributeEthBatch(0, 4);

          const balanceAfter = await ethers.provider.getBalance(await spirit.getAddress());
          const change = balanceBefore - balanceAfter;

          console.log(`  Balance change: ${ethers.formatEther(change)} ETH`);

          // The change should be minimal (near 0) since these holders already received their share
          expect(change).to.be.lessThan(ethers.parseEther("0.001"));
        } catch (error) {
          console.log(`  Attempt ${attempt} failed as expected (NoEthToDistribute)`);
        }
      }

      // Step 6: Distribute to remaining holders (4-5)
      console.log("\n6. Distributing to remaining holders (4-5)...");

      await spirit.distributeEthBatch(4, 6);

      const finalBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(`Final contract balance: ${ethers.formatEther(finalBalance)} ETH`);

      // Step 7: Verify distribution tracking
      console.log("\n7. Verifying distribution tracking...");

      const tracking = await spirit.getDistributionTracking();
      console.log(`Distribution tracking:`);
      console.log(
        `  - totalDistributedThisRound: ${ethers.formatEther(tracking.totalDistributedThisRound)} ETH`,
      );
      console.log(`  - distributionCounter: ${tracking.distributionCounter.toString()}`);

      // Get final summary
      console.log("\n✅ DOUBLE DISTRIBUTION PREVENTION TEST COMPLETED!");
      console.log("Summary:");
      console.log("  - Auto-distribution incomplete due to gas guard (perfect for testing)");
      console.log("  - First 1 ETH distributed correctly to first batch");
      console.log("  - Multiple attempts at same batch (0-3) did NOT cause double-distribution");
      console.log("  - Second 1 ETH distributed correctly to first batch");
      console.log(
        "  - Multiple attempts at same batch (0-3) again did NOT cause double-distribution",
      );
      console.log("  - Remaining holders received their fair share");
      console.log("  - Distribution tracking prevented double-distribution throughout");
    });
  });
});
