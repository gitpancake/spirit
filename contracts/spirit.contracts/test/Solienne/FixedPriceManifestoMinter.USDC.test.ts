import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FixedPriceManifestoMinter - USDC Payments", () => {
  // Fixture for deployment
  async function deployFixture() {
    const [owner, user1, user2, payout, distributor] = await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);

    // Deploy SolienneManifesto
    const SolienneManifesto = await ethers.getContractFactory("SolienneManifesto");
    const manifesto = await SolienneManifesto.deploy(
      "Solienne Manifesto",
      "MANIFESTO",
      owner.address,
    );

    // Deploy FixedPriceManifestoMinter with USDC
    const FixedPriceManifestoMinter = await ethers.getContractFactory("FixedPriceManifestoMinter");
    const minter = await FixedPriceManifestoMinter.deploy(
      await manifesto.getAddress(),
      owner.address,
      payout.address,
      await usdc.getAddress(), // USDC token address
    );

    // Setup: Set minter as authorized minter
    // This allows minter to mint NFTs AND create manifestos via createManifestoAndSale()
    await manifesto.updateMinter(await minter.getAddress());

    // Give users USDC
    await usdc.mint(owner.address, ethers.parseUnits("10000", 6)); // $10,000
    await usdc.mint(user1.address, ethers.parseUnits("10000", 6)); // $10,000
    await usdc.mint(user2.address, ethers.parseUnits("10000", 6)); // $10,000
    await usdc.mint(payout.address, ethers.parseUnits("10000", 6)); // $10,000

    return { manifesto, minter, usdc, owner, user1, user2, payout, distributor };
  }

  describe("Deployment", () => {
    it("should set correct USDC token", async () => {
      const { minter, usdc } = await loadFixture(deployFixture);
      expect(await minter.paymentToken()).to.equal(await usdc.getAddress());
    });

    it("should set correct pricing (6 decimals)", async () => {
      const { minter } = await loadFixture(deployFixture);
      expect(await minter.MONTHLY_PRICE()).to.equal(30_000_000n); // 30 USDC
      expect(await minter.YEARLY_PRICE()).to.equal(300_000_000n); // 300 USDC
    });

    it("should revert if payment token is zero address", async () => {
      const { manifesto, owner, payout } = await loadFixture(deployFixture);
      const FixedPriceManifestoMinter = await ethers.getContractFactory(
        "FixedPriceManifestoMinter",
      );

      await expect(
        FixedPriceManifestoMinter.deploy(
          await manifesto.getAddress(),
          owner.address,
          payout.address,
          ethers.ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(FixedPriceManifestoMinter, "InvalidPaymentToken");
    });
  });

  describe("Subscriptions", () => {
    it("should accept USDC for monthly subscription", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Approve USDC
      await usdc.connect(user1).approve(await minter.getAddress(), price);

      // Subscribe
      await expect(minter.connect(user1).subscribe(1))
        .to.emit(minter, "Subscribed")
        .to.emit(usdc, "Transfer"); // USDC transfer event

      // Verify subscription is active
      expect(await minter.isActive(user1.address)).to.be.true;

      // Verify USDC was transferred
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(price);
    });

    it("should accept USDC for yearly subscription", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.YEARLY_PRICE();

      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(2);

      expect(await minter.isActive(user1.address)).to.be.true;
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(price);
    });

    it("should revert if USDC not approved", async () => {
      const { minter, user1 } = await loadFixture(deployFixture);

      // Don't approve USDC
      await expect(minter.connect(user1).subscribe(1)).to.be.reverted;
    });

    it("should handle subscription stacking correctly", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // First subscription
      await usdc.connect(user1).approve(await minter.getAddress(), price * 2n);
      await minter.connect(user1).subscribe(1);

      const sub1 = await minter.subscriptions(user1.address);
      const firstExpiry = sub1.expiresAt;

      // Second subscription (should stack)
      await minter.connect(user1).subscribe(1);

      const sub2 = await minter.subscriptions(user1.address);
      const secondExpiry = sub2.expiresAt;

      // Second expiry should be ~30 days after first
      expect(secondExpiry - firstExpiry).to.be.closeTo(30n * 24n * 60n * 60n, 10n);
    });

    it("should track USDC revenue correctly", async () => {
      const { minter, usdc, user1, user2 } = await loadFixture(deployFixture);
      const monthlyPrice = await minter.MONTHLY_PRICE();
      const yearlyPrice = await minter.YEARLY_PRICE();

      // User1 subscribes monthly
      await usdc.connect(user1).approve(await minter.getAddress(), monthlyPrice);
      await minter.connect(user1).subscribe(1);

      // User2 subscribes yearly
      await usdc.connect(user2).approve(await minter.getAddress(), yearlyPrice);
      await minter.connect(user2).subscribe(2);

      // Check total revenue
      const expectedRevenue = monthlyPrice + yearlyPrice;
      expect(await minter.totalRevenue()).to.equal(expectedRevenue);
    });
  });

  describe("Minting", () => {
    it("should accept USDC for minting", async () => {
      const { minter, manifesto, usdc, user1 } = await loadFixture(deployFixture);

      // Create manifesto and sale (printing press: timestamp = block.timestamp)
      await minter.createManifestoAndSale("ipfs://test");

      // Approve and mint (fixed $5 price)
      const price = await minter.SINGLE_MINT_PRICE();
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await expect(minter.connect(user1).mint(0, 1))
        .to.emit(minter, "ManifestoMinted")
        .to.emit(usdc, "Transfer");

      // Verify user received NFT
      expect(await manifesto.balanceOf(user1.address, 0)).to.equal(1);

      // Verify USDC was transferred
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(price);
    });

    it("should calculate correct total cost for multiple mints", async () => {
      const { minter, manifesto, usdc, user1 } = await loadFixture(deployFixture);

      await minter.createManifestoAndSale("ipfs://test");

      const pricePerToken = await minter.SINGLE_MINT_PRICE(); // $5
      const quantity = 3n;
      const totalCost = pricePerToken * quantity; // $15

      await usdc.connect(user1).approve(await minter.getAddress(), totalCost);
      await minter.connect(user1).mint(0, quantity);

      // Verify correct amount of NFTs
      expect(await manifesto.balanceOf(user1.address, 0)).to.equal(quantity);

      // Verify correct USDC amount transferred
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(totalCost);
    });

    it("should revert if USDC not approved for minting", async () => {
      const { minter, user1 } = await loadFixture(deployFixture);

      await minter.createManifestoAndSale("ipfs://test");

      // Don't approve USDC
      await expect(minter.connect(user1).mint(0, 1)).to.be.reverted;
    });

    it("should work with mintTo function", async () => {
      const { minter, manifesto, usdc, user1, user2 } = await loadFixture(deployFixture);

      await minter.createManifestoAndSale("ipfs://test");

      const price = await minter.SINGLE_MINT_PRICE();

      // User1 pays, user2 receives
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).mintTo(user2.address, 0, 1);

      // Verify user2 received NFT (not user1)
      expect(await manifesto.balanceOf(user2.address, 0)).to.equal(1);
      expect(await manifesto.balanceOf(user1.address, 0)).to.equal(0);
    });
  });

  describe("Withdrawals", () => {
    it("should withdraw USDC to payout address", async () => {
      const { minter, usdc, user1, payout, owner } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // User subscribes
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      const payoutBalanceBefore = await usdc.balanceOf(payout.address);

      // Admin withdraws
      await expect(minter.connect(owner).withdraw())
        .to.emit(minter, "FundsWithdrawn")
        .withArgs(payout.address, price);

      const payoutBalanceAfter = await usdc.balanceOf(payout.address);

      // Verify payout received USDC
      expect(payoutBalanceAfter - payoutBalanceBefore).to.equal(price);

      // Verify contract balance is 0
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(0);
    });

    it("should revert if no USDC to withdraw", async () => {
      const { minter, owner } = await loadFixture(deployFixture);

      await expect(minter.connect(owner).withdraw()).to.be.revertedWithCustomError(
        minter,
        "NoFundsToWithdraw",
      );
    });

    it("should allow multiple withdrawals", async () => {
      const { minter, usdc, user1, payout, owner } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Get initial balance
      const initialBalance = await usdc.balanceOf(payout.address);

      // First subscription and withdrawal
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);
      await minter.connect(owner).withdraw();

      // Second subscription and withdrawal
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);
      await minter.connect(owner).withdraw();

      // Total withdrawn should be 2x price (added to initial balance)
      expect(await usdc.balanceOf(payout.address)).to.equal(initialBalance + price * 2n);
    });
  });

  describe("Statistics", () => {
    it("should return correct minter stats", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      const [minted, revenue, balance] = await minter.getMinterStats();

      expect(minted).to.equal(0); // No NFTs minted yet (subscription doesn't mint)
      expect(revenue).to.equal(price);
      expect(balance).to.equal(price);
    });

    it("should track both subscriptions and mints in stats", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const monthlyPrice = await minter.MONTHLY_PRICE();
      const mintPrice = await minter.SINGLE_MINT_PRICE();

      // Subscribe
      await usdc.connect(user1).approve(await minter.getAddress(), monthlyPrice + mintPrice);
      await minter.connect(user1).subscribe(1);

      // Create sale and mint
      await minter.createManifestoAndSale("ipfs://test");
      await minter.connect(user1).mint(0, 1);

      const [minted, revenue, balance] = await minter.getMinterStats();

      expect(minted).to.equal(1); // 1 NFT minted
      expect(revenue).to.equal(monthlyPrice + mintPrice); // Total revenue
      expect(balance).to.equal(monthlyPrice + mintPrice); // Contract balance
    });
  });

  describe("USDC Decimal Precision", () => {
    it("should handle 6 decimal precision correctly", async () => {
      const { minter } = await loadFixture(deployFixture);

      // Verify prices are in 6 decimals
      const singlePrice = await minter.SINGLE_MINT_PRICE();
      const monthlyPrice = await minter.MONTHLY_PRICE();
      const yearlyPrice = await minter.YEARLY_PRICE();

      expect(singlePrice).to.equal(5_000_000n); // 5 * 10^6
      expect(monthlyPrice).to.equal(30_000_000n); // 30 * 10^6
      expect(yearlyPrice).to.equal(300_000_000n); // 300 * 10^6

      // Verify these equal correct dollar amounts
      expect(ethers.formatUnits(singlePrice, 6)).to.equal("5.0");
      expect(ethers.formatUnits(monthlyPrice, 6)).to.equal("30.0");
      expect(ethers.formatUnits(yearlyPrice, 6)).to.equal("300.0");
    });

    it("should use fixed $5 price for sales", async () => {
      const { minter, manifesto, usdc, user1 } = await loadFixture(deployFixture);

      await minter.createManifestoAndSale("ipfs://test");

      const price = await minter.SINGLE_MINT_PRICE();
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).mint(0, 1);

      // Verify exact amount transferred ($5 USDC)
      expect(await usdc.balanceOf(await minter.getAddress())).to.equal(5_000_000n);
    });
  });

  describe("ETH Rejection", () => {
    it("should not accept ETH payments", async () => {
      const { minter, user1 } = await loadFixture(deployFixture);

      // Try sending ETH directly
      await expect(
        user1.sendTransaction({
          to: await minter.getAddress(),
          value: ethers.parseEther("1"),
        }),
      ).to.be.reverted;
    });
  });

  describe("Subscription Cap", () => {
    it("should cap subscriptions at 10 years", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.YEARLY_PRICE();

      // Subscribe 15 times (should cap at 10 years)
      const subscriptions = 15;
      await usdc.connect(user1).approve(await minter.getAddress(), price * BigInt(subscriptions));

      for (let i = 0; i < subscriptions; i++) {
        await minter.connect(user1).subscribe(2); // Yearly
      }

      const sub = await minter.subscriptions(user1.address);
      const now = await time.latest();
      const maxExpiry = BigInt(now) + 10n * 365n * 24n * 60n * 60n; // 10 years

      // Should be capped at 10 years from now
      expect(sub.expiresAt).to.be.closeTo(maxExpiry, 100n);
    });
  });

  describe("On-Chain Subscriber Indexing", () => {
    it("should track subscriber count correctly", async () => {
      const { minter, usdc, user1, user2 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Initially 0
      expect(await minter.getTotalSubscriberCount()).to.equal(0);

      // User1 subscribes
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);
      expect(await minter.getTotalSubscriberCount()).to.equal(1);

      // User2 subscribes
      await usdc.connect(user2).approve(await minter.getAddress(), price);
      await minter.connect(user2).subscribe(1);
      expect(await minter.getTotalSubscriberCount()).to.equal(2);
    });

    it("should not increment count when same user re-subscribes", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // First subscription
      await usdc.connect(user1).approve(await minter.getAddress(), price * 2n);
      await minter.connect(user1).subscribe(1);
      expect(await minter.getTotalSubscriberCount()).to.equal(1);

      // Re-subscribe (should not increment)
      await minter.connect(user1).subscribe(1);
      expect(await minter.getTotalSubscriberCount()).to.equal(1);
    });

    it("should index subscribers correctly by index", async () => {
      const { minter, usdc, user1, user2 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe both users
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      await usdc.connect(user2).approve(await minter.getAddress(), price);
      await minter.connect(user2).subscribe(1);

      // Check indexing
      expect(await minter.subscriberByIndex(0)).to.equal(user1.address);
      expect(await minter.subscriberByIndex(1)).to.equal(user2.address);
    });

    it("should return all subscribers in batch", async () => {
      const { minter, usdc, user1, user2, owner } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe three users
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      await usdc.connect(user2).approve(await minter.getAddress(), price);
      await minter.connect(user2).subscribe(1);

      await usdc.connect(owner).approve(await minter.getAddress(), price);
      await minter.connect(owner).subscribe(1);

      // Get all subscribers
      const subscribers = await minter.getSubscribersBatch(0, 3);
      expect(subscribers.length).to.equal(3);
      expect(subscribers[0]).to.equal(user1.address);
      expect(subscribers[1]).to.equal(user2.address);
      expect(subscribers[2]).to.equal(owner.address);
    });

    it("should return partial batch of subscribers", async () => {
      const { minter, usdc, user1, user2, owner } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe three users
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      await usdc.connect(user2).approve(await minter.getAddress(), price);
      await minter.connect(user2).subscribe(1);

      await usdc.connect(owner).approve(await minter.getAddress(), price);
      await minter.connect(owner).subscribe(1);

      // Get partial batch (indices 1-2)
      const subscribers = await minter.getSubscribersBatch(1, 3);
      expect(subscribers.length).to.equal(2);
      expect(subscribers[0]).to.equal(user2.address);
      expect(subscribers[1]).to.equal(owner.address);
    });

    it("should filter for active subscribers only", async () => {
      const { minter, usdc, user1, user2 } = await loadFixture(deployFixture);
      const monthlyPrice = await minter.MONTHLY_PRICE();

      // User1 subscribes monthly
      await usdc.connect(user1).approve(await minter.getAddress(), monthlyPrice);
      await minter.connect(user1).subscribe(1);

      // User2 subscribes monthly
      await usdc.connect(user2).approve(await minter.getAddress(), monthlyPrice);
      await minter.connect(user2).subscribe(1);

      // Both should be active
      let [activeSubscribers, count] = await minter.getActiveSubscribersBatch(0, 2);
      expect(count).to.equal(2);
      expect(activeSubscribers.length).to.equal(2);
      expect(activeSubscribers[0]).to.equal(user1.address);
      expect(activeSubscribers[1]).to.equal(user2.address);

      // Fast forward 31 days (both subscriptions expired)
      await time.increase(31 * 24 * 60 * 60);

      // Now no active subscribers
      [activeSubscribers, count] = await minter.getActiveSubscribersBatch(0, 2);
      expect(count).to.equal(0);
      expect(activeSubscribers.length).to.equal(0);
    });

    it("should handle mixed active/inactive subscribers", async () => {
      const { minter, usdc, user1, user2 } = await loadFixture(deployFixture);
      const monthlyPrice = await minter.MONTHLY_PRICE();
      const yearlyPrice = await minter.YEARLY_PRICE();

      // User1 subscribes monthly
      await usdc.connect(user1).approve(await minter.getAddress(), monthlyPrice);
      await minter.connect(user1).subscribe(1);

      // User2 subscribes yearly
      await usdc.connect(user2).approve(await minter.getAddress(), yearlyPrice);
      await minter.connect(user2).subscribe(2);

      // Fast forward 31 days (user1 expired, user2 still active)
      await time.increase(31 * 24 * 60 * 60);

      // Only user2 should be active
      const [activeSubscribers, count] = await minter.getActiveSubscribersBatch(0, 2);
      expect(count).to.equal(1);
      expect(activeSubscribers.length).to.equal(1);
      expect(activeSubscribers[0]).to.equal(user2.address);

      // But getSubscribersBatch should return both
      const allSubscribers = await minter.getSubscribersBatch(0, 2);
      expect(allSubscribers.length).to.equal(2);
    });

    it("should return empty array for invalid ranges", async () => {
      const { minter } = await loadFixture(deployFixture);

      // Empty range
      const subscribers = await minter.getSubscribersBatch(0, 0);
      expect(subscribers.length).to.equal(0);

      // Start >= end
      const subscribers2 = await minter.getSubscribersBatch(5, 2);
      expect(subscribers2.length).to.equal(0);
    });

    it("should handle end index beyond subscriber count", async () => {
      const { minter, usdc, user1 } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe one user
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      // Request batch with end beyond count (should cap at count)
      const subscribers = await minter.getSubscribersBatch(0, 100);
      expect(subscribers.length).to.equal(1);
      expect(subscribers[0]).to.equal(user1.address);
    });

    it("should provide indexed addresses for batch distribution workflows", async () => {
      const { minter, usdc, user1, user2, payout } = await loadFixture(deployFixture);
      const price = await minter.MONTHLY_PRICE();

      // Subscribe users
      await usdc.connect(user1).approve(await minter.getAddress(), price);
      await minter.connect(user1).subscribe(1);

      await usdc.connect(user2).approve(await minter.getAddress(), price);
      await minter.connect(user2).subscribe(1);

      await usdc.connect(payout).approve(await minter.getAddress(), price);
      await minter.connect(payout).subscribe(1);

      // Verify all three are in the index
      expect(await minter.getTotalSubscriberCount()).to.equal(3);

      // Get all subscribers in batches (simulating pagination)
      const batch1 = await minter.getSubscribersBatch(0, 2);
      expect(batch1.length).to.equal(2);
      expect(batch1[0]).to.equal(user1.address);
      expect(batch1[1]).to.equal(user2.address);

      const batch2 = await minter.getSubscribersBatch(2, 3);
      expect(batch2.length).to.equal(1);
      expect(batch2[0]).to.equal(payout.address);

      // Get active subscribers - all three should be active
      const [activeAddresses, activeCount] = await minter.getActiveSubscribersBatch(0, 3);
      expect(activeCount).to.equal(3);
      expect(activeAddresses.length).to.equal(3);
      expect(activeAddresses[0]).to.equal(user1.address);
      expect(activeAddresses[1]).to.equal(user2.address);
      expect(activeAddresses[2]).to.equal(payout.address);

      // Verify these addresses can be used for distribution
      // In a real workflow, you would pass activeAddresses to distributeToSubscribersBatch
      for (let i = 0; i < activeCount; i++) {
        expect(await minter.isActive(activeAddresses[i])).to.be.true;
      }
    });
  });
});
