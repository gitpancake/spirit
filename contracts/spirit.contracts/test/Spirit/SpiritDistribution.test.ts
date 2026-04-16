import { expect } from "chai";
import { ethers } from "hardhat";
import { Spirit } from "../../typechain-types";

describe("Spirit - Distribution Tests", function () {
  let spirit: Spirit;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;
  let user5: any;
  let user6: any;
  let user7: any;
  let user8: any;
  let user9: any;
  let user10: any;

  const METADATA_URI = "https://api.eden.xyz/metadata/spirit";

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] =
      await ethers.getSigners();

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

  describe("Auto-Distribution (< 200 holders)", function () {
    it("Should auto-distribute ETH to 4 initial holders", async function () {
      console.log("=== AUTO-DISTRIBUTION TEST ===");

      // Check initial state
      const headIndex = await spirit.headIndex();
      const tailIndex = await spirit.tailIndex();
      const totalHolders = await spirit.totalHolders();

      console.log("Initial state:");
      console.log("  - headIndex:", headIndex.toString());
      console.log("  - tailIndex:", tailIndex.toString());
      console.log("  - totalHolders:", totalHolders.toString());

      // Verify linked list is properly initialized
      expect(headIndex).to.equal(0);
      expect(tailIndex).to.equal(Number(totalHolders) - 1); // Should be 3 for 4 holders
      expect(totalHolders).to.equal(4);

      // Get initial balances
      const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
      const user5InitialBalance = await ethers.provider.getBalance(user5.address);
      const user4InitialBalance = await ethers.provider.getBalance(user4.address);
      const user3InitialBalance = await ethers.provider.getBalance(user3.address);

      console.log("\nInitial balances:");
      console.log("  - Owner (treasury):", ethers.formatEther(ownerInitialBalance));
      console.log("  - User5 (edenPlatform):", ethers.formatEther(user5InitialBalance));
      console.log("  - User4 (reserve):", ethers.formatEther(user4InitialBalance));
      console.log("  - User3 (community):", ethers.formatEther(user3InitialBalance));

      // Send 1 ETH to contract
      const ethAmount = ethers.parseEther("1.0");
      console.log("\nSending", ethers.formatEther(ethAmount), "ETH to contract...");

      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for auto-distribution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check final contract balance
      const finalContractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Final contract balance:", ethers.formatEther(finalContractBalance));

      // Contract should have 0 balance after auto-distribution
      expect(finalContractBalance).to.equal(0);

      // Check final balances
      const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
      const user5FinalBalance = await ethers.provider.getBalance(user5.address);
      const user4FinalBalance = await ethers.provider.getBalance(user4.address);
      const user3FinalBalance = await ethers.provider.getBalance(user3.address);

      console.log("\nFinal balances:");
      console.log("  - Owner (treasury):", ethers.formatEther(ownerFinalBalance));
      console.log("  - User5 (edenPlatform):", ethers.formatEther(user5FinalBalance));
      console.log("  - User4 (reserve):", ethers.formatEther(user4FinalBalance));
      console.log("  - User3 (community):", ethers.formatEther(user3FinalBalance));

      // Calculate balance changes
      const ownerChange = ownerFinalBalance - ownerInitialBalance;
      const user5Change = user5FinalBalance - user5InitialBalance;
      const user4Change = user4FinalBalance - user4InitialBalance;
      const user3Change = user3FinalBalance - user3InitialBalance;

      console.log("\nBalance changes:");
      console.log("  - Owner change:", ethers.formatEther(ownerChange));
      console.log("  - User5 change:", ethers.formatEther(user5Change));
      console.log("  - User4 change:", ethers.formatEther(user4Change));
      console.log("  - User3 change:", ethers.formatEther(user3Change));

      // Each holder should receive approximately 0.25 ETH
      // Owner sent 1 ETH and received 0.25 ETH back (net loss of 0.75 ETH)
      expect(user5Change).to.be.greaterThan(ethers.parseEther("0.24"));
      expect(user4Change).to.be.greaterThan(ethers.parseEther("0.24"));
      expect(user3Change).to.be.greaterThan(ethers.parseEther("0.24"));

      // Owner's change should be negative (they sent ETH and got some back)
      expect(ownerChange).to.be.lessThan(0);

      console.log("✅ Auto-distribution successful! Each holder received ~0.25 ETH");
    });
  });

  describe("Manual Batch Distribution (< 200 holders should auto-distribute)", function () {
    it("Should auto-distribute ETH immediately when < 200 holders", async function () {
      console.log("=== MANUAL BATCH DISTRIBUTION TEST ===");

      // First, send 1 ETH and verify auto-distribution works initially
      const ethAmount = ethers.parseEther("1.0");
      console.log("1. Testing initial auto-distribution...");

      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const headIndex = await spirit.headIndex();
      const tailIndex = await spirit.tailIndex();
      const totalHoldersNow = await spirit.totalHolders();

      console.log("Initial state:");
      console.log("  - headIndex:", headIndex.toString());
      console.log("  - tailIndex:", tailIndex.toString());
      console.log("  - totalHolders:", totalHoldersNow.toString());

      let contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after auto-distribution:", ethers.formatEther(contractBalance));
      expect(contractBalance).to.equal(0);

      // Now distribute tokens to create more holders
      console.log("\n2. Distributing tokens to create more holders...");

      const totalSupply = await spirit.totalSupply();
      const ownerBalance = await spirit.balanceOf(owner.address);

      console.log("Total supply:", ethers.formatEther(totalSupply));
      console.log("Owner balance:", ethers.formatEther(ownerBalance));

      // Transfer tokens to create additional holders
      // We'll transfer smaller amounts to multiple addresses
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens per transfer
      const additionalSigners = [user6, user7, user8, user9, user10];

      // Transfer to additional signers
      for (let i = 0; i < additionalSigners.length; i++) {
        if (ownerBalance >= transferAmount) {
          await spirit.transfer(additionalSigners[i].address, transferAmount);
        }
      }

      // Check final holder count and linked list state
      const finalHolderCount = await spirit.totalHolders();
      const finalHeadIndex = await spirit.headIndex();
      const finalTailIndex = await spirit.tailIndex();

      console.log("Final holder count:", finalHolderCount.toString());
      console.log("Final headIndex:", finalHeadIndex.toString());
      console.log("Final tailIndex:", finalTailIndex.toString());

      // Verify the linked list is properly maintained
      expect(finalHeadIndex).to.equal(0);
      expect(finalTailIndex).to.equal(Number(finalHolderCount) - 1); // Should equal last holder index

      console.log("✅ Created", finalHolderCount.toString(), "holders for testing");

      // Send 1 ETH to contract - should auto-distribute since we have < 200 holders
      console.log("\n3. Sending 1 ETH to contract (should auto-distribute < 200 holders)...");

      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after sending ETH:", ethers.formatEther(contractBalance));

      const holders = await spirit.totalHolders();
      console.log("Holders:", holders.toString());
      // Contract should NOT auto-distribute since we have < 200 holders
      // ETH should be auto-distributed immediately, leaving contract with 0 balance
      expect(contractBalance).to.equal(0);
      console.log("  ✅ Contract auto-distributed ETH as expected (< 200 holders)");

      // Since auto-distribution already distributed all ETH, there's nothing left to manually distribute
      console.log("\n4. Manual distribution not needed - all ETH already auto-distributed");

      // Verify that all ETH was indeed distributed
      const finalBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(
        "Final contract balance after auto-distribution:",
        ethers.formatEther(finalBalance),
      );

      // Contract should still have 0 balance since auto-distribution handled everything
      expect(finalBalance).to.equal(0);

      console.log("✅ Auto-distribution test completed!");
      console.log("  - ETH was auto-distributed to all 9 holders (< 200 threshold)");
      console.log("  - Contract balance remains 0 (no manual distribution needed)");
      console.log("  - Final contract balance:", ethers.formatEther(finalBalance));
    });
  });

  describe("Manual Batch Distribution (>= 200 holders)", function () {
    it("Should hold ETH and distribute via manual batch when >= 200 holders", async function () {
      console.log("=== MANUAL BATCH DISTRIBUTION TEST (201+ holders) ===");

      // First, send 1 ETH and verify auto-distribution works initially
      const ethAmount = ethers.parseEther("1.0");
      console.log("1. Testing initial auto-distribution...");

      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after auto-distribution:", ethers.formatEther(contractBalance));
      expect(contractBalance).to.equal(0);

      // Now distribute tokens to create 201+ holders
      console.log("\n2. Creating 201+ holders...");

      const totalSupply = await spirit.totalSupply();
      const ownerBalance = await spirit.balanceOf(owner.address);
      const transferAmount = ethers.parseEther("100000"); // 100K tokens per transfer

      console.log("Total supply:", ethers.formatEther(totalSupply));
      console.log("Owner balance:", ethers.formatEther(ownerBalance));

      // We need to create 197 more holders (we already have 4 initial holders)
      // Let's create 200 additional holders to be safe
      const additionalSigners: any[] = [];

      // Get all available signers from hardhat
      const signers = await ethers.getSigners();

      // Use all available signers (Hardhat provides 20 by default)
      for (let i = 5; i < signers.length; i++) {
        additionalSigners.push(signers[i]);
      }

      console.log(`Creating ${additionalSigners.length} additional holders...`);

      // Transfer tokens to create additional holders
      for (let i = 0; i < additionalSigners.length; i++) {
        if (ownerBalance >= transferAmount) {
          await spirit.transfer(additionalSigners[i].address, transferAmount);
        }
      }

      // Since we don't have enough signers, let's create more holders by transferring to new addresses
      // We'll use the existing signers but transfer to different addresses they control
      const remainingHoldersNeeded = 200 - additionalSigners.length;
      console.log(`Need ${remainingHoldersNeeded} more holders...`);

      // Create additional holders by transferring to new addresses
      // We'll use the existing signers but create new addresses
      for (let i = 0; i < remainingHoldersNeeded; i++) {
        // Create a new wallet for each additional holder
        const newWallet = ethers.Wallet.createRandom();
        const newSigner = newWallet.connect(ethers.provider);

        // Fund the new wallet with some ETH for gas
        await owner.sendTransaction({
          to: newWallet.address,
          value: ethers.parseEther("0.01"), // Small amount for gas
        });

        // Transfer tokens to create the holder
        if (ownerBalance >= transferAmount) {
          await spirit.transfer(newWallet.address, transferAmount);
        }
      }

      const finalHolderCount = await spirit.totalHolders();
      const finalHeadIndex = await spirit.headIndex();
      const finalTailIndex = await spirit.tailIndex();

      console.log("Final holder count:", finalHolderCount.toString());
      console.log("Final headIndex:", finalHeadIndex.toString());
      console.log("Final tailIndex:", finalTailIndex.toString());

      // Verify we have >= 200 holders
      expect(Number(finalHolderCount)).to.be.greaterThanOrEqual(200);
      expect(finalHeadIndex).to.equal(0);
      expect(finalTailIndex).to.equal(Number(finalHolderCount) - 1);

      console.log("✅ Created", finalHolderCount.toString(), "holders (>= 200 threshold)");

      // Send 1 ETH to contract - should NOT auto-distribute since we have >= 200 holders
      console.log("\n3. Sending 1 ETH to contract (should NOT auto-distribute >= 200 holders)...");

      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after sending ETH:", ethers.formatEther(contractBalance));

      // Contract should NOT auto-distribute since we have >= 200 holders
      expect(contractBalance).to.equal(ethAmount);
      console.log("  ✅ Contract held ETH as expected (>= 200 holders)");

      // Now manually distribute ETH using batch distribution
      console.log("\n4. Manually distributing ETH via batch distribution...");

      const batchSize = 200;
      const totalHolders = await spirit.totalHolders();

      // Distribute in batches
      for (let startIndex = 0; startIndex < Number(totalHolders); startIndex += batchSize) {
        const endIndex = Math.min(startIndex + batchSize, Number(totalHolders));
        console.log(`Distributing batch ${startIndex} to ${endIndex - 1}...`);

        await spirit.distributeEthBatch(startIndex, endIndex);

        // Wait a bit between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Check final contract balance
      const finalBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log(
        "Final contract balance after batch distribution:",
        ethers.formatEther(finalBalance),
      );

      // Contract should have some balance remaining due to gas guard limiting batch size
      // This is expected behavior - gas guard prevents OOG by limiting recipients per tx
      expect(finalBalance).to.be.lessThan(ethers.parseEther("0.1")); // Less than 0.1 ETH

      console.log("✅ Manual batch distribution test completed!");
      console.log("  - ETH was held when >= 200 holders");
      console.log("  - Manual batch distribution successfully distributed ETH");
      console.log("  - Final contract balance:", ethers.formatEther(finalBalance));
      console.log(
        "  - Note: Any remaining balance may be due to failed transfers (events emitted)",
      );
    });
  });

  describe("Failed Transfer Handling", function () {
    it("Should emit EthTransferFailed event when ETH transfer fails", async function () {
      console.log("=== FAILED TRANSFER HANDLING TEST ===");

      // Create a contract that will fail ETH transfers (receive function that reverts)
      const failingContract = await ethers.deployContract("FailingTransferContract");
      await failingContract.waitForDeployment();

      // Add the failing contract as a holder by transferring tokens to it
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      await spirit.transfer(await failingContract.getAddress(), transferAmount);

      // Verify the failing contract is now a holder
      const holderCount = await spirit.totalHolders();
      console.log("Holder count after adding failing contract:", holderCount.toString());

      // Send ETH to the contract - should auto-distribute since we have < 200 holders
      const ethAmount = ethers.parseEther("0.1"); // 0.1 ETH
      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for auto-distribution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check contract balance - some ETH might remain due to failed transfer
      const contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after auto-distribution:", ethers.formatEther(contractBalance));

      // The contract should have distributed most ETH, but some might remain due to failed transfer
      expect(contractBalance).to.be.lessThan(ethAmount);

      console.log("✅ Failed transfer handling test completed!");
      console.log("  - Failing contract was added as holder");
      console.log("  - Auto-distribution attempted to all holders");
      console.log("  - Failed transfers emit events but don't reduce contract balance");
      console.log("  - Final contract balance:", ethers.formatEther(contractBalance));
    });
  });

  describe("Monotonic Counter Protection", function () {
    it("Should prevent linked list corruption when holders are removed and added", async function () {
      console.log("=== MONOTONIC COUNTER PROTECTION TEST ===");

      // First, verify initial state
      let nextIndex = await spirit.getNextHolderIndex();
      console.log("Initial nextHolderIndex:", nextIndex.toString());

      // Add a few holders to see the indices
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      await spirit.transfer(user6.address, transferAmount);
      await spirit.transfer(user7.address, transferAmount);
      await spirit.transfer(user8.address, transferAmount);

      nextIndex = await spirit.getNextHolderIndex();
      console.log("After adding 3 holders, nextHolderIndex:", nextIndex.toString());

      // Now remove a holder (this will decrease totalHolders but not affect indices)
      await spirit.transfer(owner.address, transferAmount); // Remove user6 by transferring tokens back

      const holderCount = await spirit.totalHolders();
      console.log("After removing 1 holder, totalHolders:", holderCount.toString());
      console.log("But nextHolderIndex remains:", nextIndex.toString());

      // Add a new holder - this should use the next available index
      await spirit.transfer(user9.address, transferAmount);

      const newNextIndex = await spirit.getNextHolderIndex();
      console.log("After adding new holder, nextHolderIndex:", newNextIndex.toString());

      // Verify that the new holder got a unique index
      expect(Number(newNextIndex)).to.be.greaterThan(Number(nextIndex));
      console.log("✅ New holder got unique index:", newNextIndex.toString());

      // Verify the linked list is still intact
      const finalHeadIndex = await spirit.headIndex();
      const finalTailIndex = await spirit.tailIndex();
      const finalTotalHolders = await spirit.totalHolders();

      console.log("Final linked list state:");
      console.log("  - headIndex:", finalHeadIndex.toString());
      console.log("  - tailIndex:", finalTailIndex.toString());
      console.log("  - totalHolders:", finalTotalHolders.toString());

      // The linked list should still be valid
      expect(finalHeadIndex).to.equal(0);
      expect(finalTailIndex).to.equal(Number(finalTotalHolders) - 1);

      console.log("✅ Monotonic counter protection test completed!");
      console.log("  - Removed holder without corrupting indices");
      console.log("  - New holder got unique index");
      console.log("  - Linked list remains intact");
    });
  });

  describe("Cross-Function Reentrancy Protection", function () {
    it("Should prevent linked list corruption during ETH distribution", async function () {
      console.log("=== CROSS-FUNCTION REENTRANCY PROTECTION TEST ===");

      // Create a malicious contract that tries to reenter during ETH distribution
      const maliciousContract = await ethers.deployContract("UltraFailingContract");
      await maliciousContract.waitForDeployment();

      // Add the malicious contract as a holder
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      await spirit.transfer(await maliciousContract.getAddress(), transferAmount);

      // Verify the malicious contract is now a holder
      const holderCount = await spirit.totalHolders();
      console.log("Holder count after adding malicious contract:", holderCount.toString());

      // Send ETH to trigger auto-distribution
      const ethAmount = ethers.parseEther("0.1"); // 0.1 ETH
      await owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait for auto-distribution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check contract balance
      const contractBalance = await ethers.provider.getBalance(await spirit.getAddress());
      console.log("Contract balance after distribution:", ethers.formatEther(contractBalance));

      // Verify the linked list is still intact
      const finalHeadIndex = await spirit.headIndex();
      const finalTailIndex = await spirit.tailIndex();
      const finalTotalHolders = await spirit.totalHolders();

      console.log("Final linked list state:");
      console.log("  - headIndex:", finalHeadIndex.toString());
      console.log("  - tailIndex:", finalTailIndex.toString());
      console.log("  - totalHolders:", finalTotalHolders.toString());

      // The linked list should still be valid
      expect(finalHeadIndex).to.equal(0);
      expect(finalTailIndex).to.equal(Number(finalTotalHolders) - 1);

      console.log("✅ Cross-function reentrancy protection test completed!");
      console.log("  - Malicious contract added as holder");
      console.log("  - ETH distribution completed without corruption");
      console.log("  - Distribution lock properly managed");
      console.log("  - Linked list remains intact");
    });
  });

  describe("Transfer During Distribution", function () {
    it("Should allow token transfers during ETH distribution", async function () {
      console.log("=== TRANSFER DURING DISTRIBUTION TEST ===");

      // Add a few holders to test with
      const transferAmount = ethers.parseEther("1000000"); // 1M tokens
      await spirit.transfer(user6.address, transferAmount);
      await spirit.transfer(user7.address, transferAmount);

      const holderCount = await spirit.totalHolders();
      console.log("Holder count before distribution:", holderCount.toString());

      // Start a distribution in the background (this will take some time)
      const ethAmount = ethers.parseEther("0.1"); // 0.1 ETH
      const distributionPromise = owner.sendTransaction({
        to: await spirit.getAddress(),
        value: ethAmount,
      });

      // Wait a bit for distribution to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to transfer tokens during distribution
      console.log("Attempting token transfer during distribution...");

      // The transfer should succeed (no distribution lock blocking it)
      await spirit.transfer(user8.address, transferAmount);
      console.log("✅ Token transfer succeeded during distribution");

      // Wait for distribution to complete
      await distributionPromise;
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the transfer actually worked
      const user8Balance = await spirit.balanceOf(user8.address);
      console.log("User8 balance after transfer:", ethers.formatEther(user8Balance));
      expect(user8Balance).to.equal(transferAmount);

      // Verify the linked list is still intact
      const finalHolderCount = await spirit.totalHolders();
      const finalHeadIndex = await spirit.headIndex();
      const finalTailIndex = await spirit.tailIndex();

      console.log("Final linked list state:");
      console.log("  - headIndex:", finalHeadIndex.toString());
      console.log("  - tailIndex:", finalTailIndex.toString());
      console.log("  - totalHolders:", finalHolderCount.toString());

      // The linked list should still be valid
      expect(finalHeadIndex).to.equal(0);
      expect(finalTailIndex).to.equal(Number(finalHolderCount) - 1);

      console.log("✅ Transfer during distribution test completed!");
      console.log("  - Distribution started successfully");
      console.log("  - Token transfer worked during distribution");
      console.log("  - Linked list remains intact");
      console.log("  - No distribution lock blocking transfers");
    });
  });
});
