import { expect } from "chai";
import { ethers } from "hardhat";
import { WalletRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WalletRegistry", function () {
  let walletRegistry: WalletRegistry;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let treasury1: SignerWithAddress;
  let treasury2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, treasury1, treasury2] = await ethers.getSigners();

    const WalletRegistryFactory = await ethers.getContractFactory("WalletRegistry");
    walletRegistry = await WalletRegistryFactory.deploy();
    await walletRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await walletRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero wallets", async function () {
      const [total, active] = await walletRegistry.getWalletStats();
      expect(total).to.equal(0);
      expect(active).to.equal(0);
    });
  });

  describe("Wallet Management", function () {
    describe("Adding Wallets", function () {
      it("Should allow owner to add a wallet and return tokenId", async function () {
        const tx = walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet for protocol funds",
        );

        await expect(tx).to.emit(walletRegistry, "WalletAdded");

        const [total, active] = await walletRegistry.getWalletStats();
        expect(total).to.equal(1);
        expect(active).to.equal(1);
      });

      it("Should store wallet information correctly", async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet for protocol funds",
        );

        const wallet = await walletRegistry.getWallet(0); // First token ID is 0
        expect(wallet.walletAddress).to.equal(treasury1.address);
        expect(wallet.chainId).to.equal(1);
        expect(wallet.name).to.equal("Main Treasury");
        expect(wallet.description).to.equal("Primary treasury wallet for protocol funds");
        expect(wallet.active).to.be.true;
        expect(wallet.createdAt).to.be.gt(0);
        expect(wallet.updatedAt).to.equal(wallet.createdAt);

        // Test getWalletByAddressAndChain function
        const walletByAddressAndChain = await walletRegistry.getWalletByAddressAndChain(
          treasury1.address,
          1,
        );
        expect(walletByAddressAndChain.walletAddress).to.equal(treasury1.address);
        expect(walletByAddressAndChain.chainId).to.equal(1);
        expect(walletByAddressAndChain.name).to.equal("Main Treasury");

        // Test getTokenIdByAddressAndChain function
        const tokenId = await walletRegistry.getTokenIdByAddressAndChain(treasury1.address, 1);
        expect(tokenId).to.equal(0);
      });

      it("Should not allow duplicate address+chainId combinations", async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet",
        );

        await expect(
          walletRegistry.addWallet(
            treasury1.address,
            1, // Same chainId
            "Backup Treasury",
            "Secondary treasury wallet",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "WalletAlreadyExists");
      });

      it("Should allow same address on different chains", async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury - Mainnet",
          "Primary treasury wallet on mainnet",
        );

        // Should succeed - same address but different chainId
        await expect(
          walletRegistry.addWallet(
            treasury1.address, // Same address
            8453, // Base mainnet
            "Main Treasury - Base",
            "Primary treasury wallet on Base",
          ),
        ).to.not.be.reverted;

        const [total] = await walletRegistry.getWalletStats();
        expect(total).to.equal(2);

        // Verify both wallets exist
        const mainnetWallet = await walletRegistry.getWalletByAddressAndChain(treasury1.address, 1);
        const baseWallet = await walletRegistry.getWalletByAddressAndChain(treasury1.address, 8453);

        expect(mainnetWallet.chainId).to.equal(1);
        expect(baseWallet.chainId).to.equal(8453);
        expect(mainnetWallet.walletAddress).to.equal(baseWallet.walletAddress);
      });

      it("Should not allow zero address", async function () {
        await expect(
          walletRegistry.addWallet(
            ethers.ZeroAddress,
            1, // Valid chainId
            "Invalid Wallet",
            "This should fail",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidWalletAddress");
      });

      it("Should not allow empty name", async function () {
        await expect(
          walletRegistry.addWallet(
            treasury1.address,
            1, // Valid chainId
            "",
            "Valid description",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidName");
      });

      it("Should not allow empty description", async function () {
        await expect(
          walletRegistry.addWallet(
            treasury1.address,
            1, // Valid chainId
            "Valid Name",
            "",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidDescription");
      });

      it("Should not allow invalid chainId", async function () {
        await expect(
          walletRegistry.addWallet(
            treasury1.address,
            0, // Invalid chainId
            "Valid Name",
            "Valid description",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidChainId");
      });

      it("Should not allow non-owner to add wallets", async function () {
        await expect(
          walletRegistry.connect(user).addWallet(
            treasury1.address,
            1, // Valid chainId
            "Main Treasury",
            "Should fail",
          ),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Updating Wallets", function () {
      beforeEach(async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet",
        );
      });

      it("Should allow owner to update wallet", async function () {
        await expect(
          walletRegistry.updateWallet(
            0, // First tokenId
            "Updated Treasury",
            "Updated description",
          ),
        ).to.emit(walletRegistry, "WalletUpdated");

        const wallet = await walletRegistry.getWallet(0);
        expect(wallet.name).to.equal("Updated Treasury");
        expect(wallet.description).to.equal("Updated description");
        expect(wallet.updatedAt).to.be.gt(wallet.createdAt);
      });

      it("Should update wallet information correctly", async function () {
        await walletRegistry.updateWallet(
          0, // First tokenId
          "New Name",
          "Updated description",
        );

        const wallet = await walletRegistry.getWallet(0);
        expect(wallet.name).to.equal("New Name");
        expect(wallet.description).to.equal("Updated description");
        expect(wallet.walletAddress).to.equal(treasury1.address); // Address should remain unchanged
      });

      it("Should allow updating to existing name (multi-chain support)", async function () {
        await walletRegistry.addWallet(
          treasury2.address,
          1, // Same chainId but different address
          "Second Treasury",
          "Another wallet",
        );

        // Should succeed - names can be duplicated
        await expect(
          walletRegistry.updateWallet(
            0, // First tokenId
            "Second Treasury", // Same name as second wallet
            "Trying to use existing name",
          ),
        ).to.not.be.reverted;
      });

      it("Should not allow updating non-existent wallet", async function () {
        await expect(
          walletRegistry.updateWallet(
            999, // Non-existent tokenId
            "Non-existent",
            "Should fail",
          ),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidTokenId");
      });
    });

    describe("Removing Wallets", function () {
      beforeEach(async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet",
        );
        await walletRegistry.addWallet(
          treasury2.address,
          8453, // Base mainnet
          "Backup Treasury",
          "Secondary treasury wallet",
        );
      });

      it("Should allow owner to remove wallet", async function () {
        await expect(walletRegistry.removeWallet(0)) // First tokenId
          .to.emit(walletRegistry, "WalletRemoved");

        const [total, active] = await walletRegistry.getWalletStats();
        expect(total).to.equal(1);
        expect(active).to.equal(1);

        await expect(walletRegistry.getWallet(0)).to.be.revertedWithCustomError(
          walletRegistry,
          "InvalidTokenId",
        );
      });

      it("Should remove from address+chainId mapping", async function () {
        await walletRegistry.removeWallet(0); // First tokenId

        await expect(
          walletRegistry.getWalletByAddressAndChain(treasury1.address, 1),
        ).to.be.revertedWithCustomError(walletRegistry, "InvalidTokenId");
      });

      it("Should not allow removing non-existent wallet", async function () {
        await expect(walletRegistry.removeWallet(999)) // Non-existent tokenId
          .to.be.revertedWithCustomError(walletRegistry, "InvalidTokenId");
      });
    });

    describe("Wallet Status", function () {
      beforeEach(async function () {
        await walletRegistry.addWallet(
          treasury1.address,
          1, // Ethereum mainnet
          "Main Treasury",
          "Primary treasury wallet",
        );
      });

      it("Should allow owner to change wallet status", async function () {
        await expect(walletRegistry.setWalletStatus(0, false)) // First tokenId
          .to.emit(walletRegistry, "WalletStatusChanged");

        const wallet = await walletRegistry.getWallet(0);
        expect(wallet.active).to.be.false;

        const [total, active] = await walletRegistry.getWalletStats();
        expect(total).to.equal(1);
        expect(active).to.equal(0);
      });

      it("Should update active count correctly", async function () {
        // Initially active
        let [, active] = await walletRegistry.getWalletStats();
        expect(active).to.equal(1);

        // Deactivate
        await walletRegistry.setWalletStatus(0, false); // First tokenId
        [, active] = await walletRegistry.getWalletStats();
        expect(active).to.equal(0);

        // Reactivate
        await walletRegistry.setWalletStatus(0, true); // First tokenId
        [, active] = await walletRegistry.getWalletStats();
        expect(active).to.equal(1);
      });
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await walletRegistry.addWallet(
        treasury1.address,
        1, // Ethereum mainnet
        "Main Treasury",
        "Primary treasury wallet",
      );
      await walletRegistry.addWallet(
        treasury2.address,
        8453, // Base mainnet
        "Backup Treasury",
        "Secondary treasury wallet",
      );
      await walletRegistry.setWalletStatus(1, false); // Second tokenId
    });

    describe("Single Wallet Queries", function () {
      it("Should return wallet by tokenId", async function () {
        const wallet = await walletRegistry.getWallet(0); // First tokenId
        expect(wallet.name).to.equal("Main Treasury");
        expect(wallet.active).to.be.true;
      });

      it("Should return wallet by address and chain", async function () {
        const wallet = await walletRegistry.getWalletByAddressAndChain(treasury1.address, 1);
        expect(wallet.name).to.equal("Main Treasury");
        expect(wallet.chainId).to.equal(1);
        expect(wallet.active).to.be.true;
      });

      it("Should return tokenId by address and chain", async function () {
        const tokenId = await walletRegistry.getTokenIdByAddressAndChain(treasury1.address, 1);
        expect(tokenId).to.equal(0);
      });

      it("Should check if wallet exists by tokenId", async function () {
        expect(await walletRegistry.walletExists(0)).to.be.true; // First tokenId
        expect(await walletRegistry.walletExists(999)).to.be.false; // Non-existent tokenId
      });

      it("Should check if wallet exists by address and chain", async function () {
        expect(await walletRegistry.walletExistsByAddressAndChain(treasury1.address, 1)).to.be.true;
        expect(await walletRegistry.walletExistsByAddressAndChain(user.address, 1)).to.be.false;
        expect(await walletRegistry.walletExistsByAddressAndChain(treasury1.address, 999)).to.be
          .false; // Wrong chain
      });

      it("Should return all wallets for a given address", async function () {
        // Add same address on additional chains (treasury1 already exists on chain 1 from beforeEach)
        await walletRegistry.addWallet(treasury1.address, 8453, "Treasury - Base", "Base treasury");
        await walletRegistry.addWallet(
          treasury1.address,
          137,
          "Treasury - Polygon",
          "Polygon treasury",
        );

        const [wallets, tokenIds] = await walletRegistry.getWalletsByAddress(treasury1.address);
        expect(wallets).to.have.lengthOf(3); // 1 from beforeEach + 2 new ones
        expect(tokenIds).to.have.lengthOf(3);

        const chainIds = wallets.map((w) => Number(w.chainId));
        expect(chainIds).to.include(1);
        expect(chainIds).to.include(8453);
        expect(chainIds).to.include(137);
      });
    });

    describe("Batch Queries", function () {
      it("Should return all wallets with tokenIds", async function () {
        const [wallets, tokenIds] = await walletRegistry.getAllWallets();
        expect(wallets).to.have.lengthOf(2);
        expect(tokenIds).to.have.lengthOf(2);

        const names = wallets.map((w) => w.name);
        expect(names).to.include("Main Treasury");
        expect(names).to.include("Backup Treasury");

        expect(Number(tokenIds[0])).to.equal(0); // First tokenId
        expect(Number(tokenIds[1])).to.equal(1); // Second tokenId
      });

      it("Should return only active wallets with tokenIds", async function () {
        const [activeWallets, activeTokenIds] = await walletRegistry.getActiveWallets();
        expect(activeWallets).to.have.lengthOf(1);
        expect(activeTokenIds).to.have.lengthOf(1);
        expect(activeWallets[0].name).to.equal("Main Treasury");
        expect(activeWallets[0].active).to.be.true;
        expect(activeTokenIds[0]).to.equal(0); // First tokenId should be active
      });

      it("Should return correct stats", async function () {
        const [total, active] = await walletRegistry.getWalletStats();
        expect(total).to.equal(2);
        expect(active).to.equal(1);
      });
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple operations correctly", async function () {
      // Add multiple wallets
      await walletRegistry.addWallet(treasury1.address, 1, "Treasury 1", "First treasury");
      await walletRegistry.addWallet(treasury2.address, 8453, "Treasury 2", "Second treasury");
      await walletRegistry.addWallet(user.address, 137, "User Wallet", "User's personal wallet");

      // Update one wallet
      await walletRegistry.updateWallet(0, "Main Treasury", "Updated first treasury"); // First tokenId

      // Deactivate one wallet
      await walletRegistry.setWalletStatus(1, false); // Second tokenId

      // Remove one wallet
      await walletRegistry.removeWallet(2); // Third tokenId

      // Check final state
      const [total, active] = await walletRegistry.getWalletStats();
      expect(total).to.equal(2);
      expect(active).to.equal(1);

      const [allWallets, allTokenIds] = await walletRegistry.getAllWallets();
      expect(allWallets).to.have.lengthOf(2);
      expect(allTokenIds).to.have.lengthOf(2);

      const [activeWallets, activeTokenIds] = await walletRegistry.getActiveWallets();
      expect(activeWallets).to.have.lengthOf(1);
      expect(activeTokenIds).to.have.lengthOf(1);
      expect(activeWallets[0].name).to.equal("Main Treasury");
      expect(activeTokenIds[0]).to.equal(0);
    });

    it("Should handle edge cases with empty registry", async function () {
      const [wallets, tokenIds] = await walletRegistry.getAllWallets();
      expect(wallets).to.have.lengthOf(0);
      expect(tokenIds).to.have.lengthOf(0);

      const [activeWallets, activeTokenIds] = await walletRegistry.getActiveWallets();
      expect(activeWallets).to.have.lengthOf(0);
      expect(activeTokenIds).to.have.lengthOf(0);
    });
  });
});
