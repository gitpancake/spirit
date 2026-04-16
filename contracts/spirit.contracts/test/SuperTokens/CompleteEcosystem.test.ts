import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  SpiritToken,
  AbrahamToken,
  UnifiedStaking,
  SwapperRouter,
  LiquidityPoolManager,
} from "../../typechain-types";

/**
 * Complete Eden Ecosystem Test Suite
 *
 * Tests the full integration of:
 * - SPIRIT and ABRAHAM SuperTokens
 * - UnifiedStaking contract
 * - SwapperRouter functionality
 * - LiquidityPoolManager
 * - End-to-end reward streaming
 */
describe("Complete Eden Ecosystem", function () {
  // Contract instances
  let spiritToken: SpiritToken;
  let abrahamToken: AbrahamToken;
  let stakingContract: UnifiedStaking;
  let swapperRouter: SwapperRouter;
  let liquidityPoolManager: LiquidityPoolManager;

  // Test accounts
  let owner: any;
  let treasury: any;
  let platform: any;
  let teamEquity: any;
  let community: any;
  let artist: any;
  let agent: any;
  let spiritHolders: any;
  let user1: any;
  let user2: any;

  // Mock addresses for testing
  const MOCK_SUPERFLUID_HOST = "0x1234567890123456789012345678901234567890";
  const MOCK_SUPERTOKEN_FACTORY = "0x2345678901234567890123456789012345678901";
  const MOCK_UNISWAP_FACTORY = "0x3456789012345678901234567890123456789012";
  const MOCK_POSITION_MANAGER = "0x4567890123456789012345678901234567890123";
  const MOCK_SWAP_ROUTER = "0x5678901234567890123456789012345678901234";
  const MOCK_WETH = "0x6789012345678901234567890123456789012345";
  const MOCK_USDC = "0x7890123456789012345678901234567890123456";

  async function deployEcosystemFixture() {
    const accounts = await ethers.getSigners();
    [owner, treasury, platform, teamEquity, community, artist, agent, spiritHolders, user1, user2] =
      accounts;

    // ============ DEPLOY TOKENS ============

    // Deploy SPIRIT Token
    const SpiritTokenFactory = await ethers.getContractFactory("SpiritToken");
    const spiritToken = await SpiritTokenFactory.deploy();

    // Deploy ABRAHAM Token
    const AbrahamTokenFactory = await ethers.getContractFactory("AbrahamToken");
    const abrahamToken = await AbrahamTokenFactory.deploy();

    // ============ DEPLOY INFRASTRUCTURE ============

    // Deploy UnifiedStaking
    const UnifiedStakingFactory = await ethers.getContractFactory("UnifiedStaking");
    const stakingContract = await UnifiedStakingFactory.deploy(
      await spiritToken.getAddress(),
      await abrahamToken.getAddress(),
      MOCK_SUPERFLUID_HOST,
      owner.address,
    );

    // Deploy SwapperRouter
    const SwapperRouterFactory = await ethers.getContractFactory("SwapperRouter");
    const swapperRouter = await SwapperRouterFactory.deploy(
      await spiritToken.getAddress(),
      MOCK_USDC,
      MOCK_SWAP_ROUTER,
      MOCK_WETH,
      await stakingContract.getAddress(),
      platform.address,
      owner.address,
    );

    // Deploy LiquidityPoolManager
    const LiquidityPoolManagerFactory = await ethers.getContractFactory("LiquidityPoolManager");
    const liquidityPoolManager = await LiquidityPoolManagerFactory.deploy(
      await spiritToken.getAddress(),
      await abrahamToken.getAddress(),
      MOCK_UNISWAP_FACTORY,
      MOCK_POSITION_MANAGER,
      MOCK_WETH,
      platform.address,
      owner.address,
    );

    return {
      spiritToken,
      abrahamToken,
      stakingContract,
      swapperRouter,
      liquidityPoolManager,
      accounts: {
        owner,
        treasury,
        platform,
        teamEquity,
        community,
        artist,
        agent,
        spiritHolders,
        user1,
        user2,
      },
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployEcosystemFixture);
    spiritToken = fixture.spiritToken;
    abrahamToken = fixture.abrahamToken;
    stakingContract = fixture.stakingContract;
    swapperRouter = fixture.swapperRouter;
    liquidityPoolManager = fixture.liquidityPoolManager;

    const accounts = fixture.accounts;
    owner = accounts.owner;
    treasury = accounts.treasury;
    platform = accounts.platform;
    teamEquity = accounts.teamEquity;
    community = accounts.community;
    artist = accounts.artist;
    agent = accounts.agent;
    spiritHolders = accounts.spiritHolders;
    user1 = accounts.user1;
    user2 = accounts.user2;
  });

  // ============ TOKEN DEPLOYMENT TESTS ============

  describe("Token Deployment", function () {
    it("Should deploy SPIRIT token correctly", async function () {
      expect(await spiritToken.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await spiritToken.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should deploy ABRAHAM token correctly", async function () {
      expect(await abrahamToken.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await abrahamToken.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should have correct max supply constants", async function () {
      const expectedMaxSupply = ethers.parseEther("1000000000"); // 1 billion tokens

      expect(await spiritToken.MAX_SUPPLY()).to.equal(expectedMaxSupply);
      expect(await abrahamToken.MAX_SUPPLY()).to.equal(expectedMaxSupply);
    });
  });

  describe("Token Initialization", function () {
    it("Should initialize SPIRIT token with correct distribution", async function () {
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      const quarterSupply = ethers.parseEther("250000000"); // 25% each

      expect(await spiritToken.balanceOf(treasury.address)).to.equal(quarterSupply);
      expect(await spiritToken.balanceOf(platform.address)).to.equal(quarterSupply);
      expect(await spiritToken.balanceOf(teamEquity.address)).to.equal(quarterSupply);
      expect(await spiritToken.balanceOf(community.address)).to.equal(quarterSupply);
    });

    it("Should initialize ABRAHAM token with correct distribution", async function () {
      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      const quarterSupply = ethers.parseEther("250000000"); // 25% each

      expect(await abrahamToken.balanceOf(artist.address)).to.equal(quarterSupply);
      expect(await abrahamToken.balanceOf(agent.address)).to.equal(quarterSupply);
      expect(await abrahamToken.balanceOf(treasury.address)).to.equal(quarterSupply);
      expect(await abrahamToken.balanceOf(spiritHolders.address)).to.equal(quarterSupply);
    });

    it("Should prevent double initialization", async function () {
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await expect(
        spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
          treasury: treasury.address,
          platform: platform.address,
          teamEquity: teamEquity.address,
          community: community.address,
        }),
      ).to.be.revertedWith("SpiritToken: already initialized");
    });

    it("Should prevent future minting after initialization", async function () {
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await expect(
        spiritToken.selfMint(user1.address, ethers.parseEther("1"), "0x"),
      ).to.be.revertedWith("SpiritToken: minting disabled - max supply already distributed");
    });

    it("Should validate unique distribution addresses", async function () {
      await expect(
        spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
          treasury: treasury.address,
          platform: treasury.address, // Duplicate address
          teamEquity: teamEquity.address,
          community: community.address,
        }),
      ).to.be.revertedWith("SpiritToken: addresses must be unique");
    });
  });

  // ============ STAKING TESTS ============

  describe("Unified Staking", function () {
    beforeEach(async function () {
      // Initialize tokens
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      // Transfer some tokens to users for testing
      const testAmount = ethers.parseEther("1000");
      await spiritToken.connect(treasury).transfer(user1.address, testAmount);
      await abrahamToken.connect(artist).transfer(user1.address, testAmount);
      await abrahamToken.connect(artist).transfer(user2.address, testAmount);
    });

    it("Should deploy staking contract correctly", async function () {
      expect(await stakingContract.spiritToken()).to.equal(await spiritToken.getAddress());
      expect(await stakingContract.abrahamToken()).to.equal(await abrahamToken.getAddress());
      expect(await stakingContract.totalSpiritStaked()).to.equal(0);
      expect(await stakingContract.totalAbrahamStaked()).to.equal(0);
    });

    it("Should allow ABRAHAM staking", async function () {
      const stakeAmount = ethers.parseEther("100");

      // Approve staking contract
      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      // Stake ABRAHAM
      await stakingContract.connect(user1).stakeAbraham(stakeAmount);

      expect(await stakingContract.abrahamStaked(user1.address)).to.equal(stakeAmount);
      expect(await stakingContract.totalAbrahamStaked()).to.equal(stakeAmount);
      expect(await stakingContract.isAbrahamStaker(user1.address)).to.be.true;
    });

    it("Should allow SPIRIT staking", async function () {
      const stakeAmount = ethers.parseEther("100");

      // Approve staking contract
      await spiritToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      // Stake SPIRIT
      await stakingContract.connect(user1).stakeSpirit(stakeAmount);

      expect(await stakingContract.spiritStaked(user1.address)).to.equal(stakeAmount);
      expect(await stakingContract.totalSpiritStaked()).to.equal(stakeAmount);
      expect(await stakingContract.isSpiritStaker(user1.address)).to.be.true;
    });

    it("Should emit staking events", async function () {
      const stakeAmount = ethers.parseEther("100");

      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      await expect(stakingContract.connect(user1).stakeAbraham(stakeAmount))
        .to.emit(stakingContract, "AbrahamStaked")
        .withArgs(user1.address, stakeAmount, stakeAmount);
    });

    it("Should allow unstaking", async function () {
      const stakeAmount = ethers.parseEther("100");
      const unstakeAmount = ethers.parseEther("50");

      // Stake first
      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stakeAbraham(stakeAmount);

      // Unstake
      await stakingContract.connect(user1).unstakeAbraham(unstakeAmount);

      expect(await stakingContract.abrahamStaked(user1.address)).to.equal(
        stakeAmount - unstakeAmount,
      );
      expect(await stakingContract.totalAbrahamStaked()).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should prevent staking when paused", async function () {
      // Pause staking
      await stakingContract.connect(owner).toggleStakingPause();

      const stakeAmount = ethers.parseEther("100");
      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      await expect(
        stakingContract.connect(user1).stakeAbraham(stakeAmount),
      ).to.be.revertedWithCustomError(stakingContract, "StakingPaused");
    });

    it("Should track multiple stakers correctly", async function () {
      const stakeAmount1 = ethers.parseEther("100");
      const stakeAmount2 = ethers.parseEther("200");

      // User1 stakes
      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount1);
      await stakingContract.connect(user1).stakeAbraham(stakeAmount1);

      // User2 stakes
      await abrahamToken.connect(user2).approve(await stakingContract.getAddress(), stakeAmount2);
      await stakingContract.connect(user2).stakeAbraham(stakeAmount2);

      expect(await stakingContract.abrahamStaked(user1.address)).to.equal(stakeAmount1);
      expect(await stakingContract.abrahamStaked(user2.address)).to.equal(stakeAmount2);
      expect(await stakingContract.totalAbrahamStaked()).to.equal(stakeAmount1 + stakeAmount2);
    });
  });

  // ============ SWAPPER ROUTER TESTS ============

  describe("Swapper Router", function () {
    beforeEach(async function () {
      // Initialize tokens and add swapper as reward distributor
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      await stakingContract.connect(owner).addRewardDistributor(await swapperRouter.getAddress());
    });

    it("Should deploy SwapperRouter correctly", async function () {
      expect(await swapperRouter.spiritToken()).to.equal(await spiritToken.getAddress());
      expect(await swapperRouter.platformWallet()).to.equal(platform.address);
      expect(await swapperRouter.platformFeeRate()).to.equal(25); // 0.25%
    });

    it("Should have correct configuration", async function () {
      const config = await swapperRouter.getConfiguration();

      expect(config.platformFee).to.equal(25); // 0.25%
      expect(config.slippage).to.equal(300); // 3%
      expect(config.platform).to.equal(platform.address);
    });

    it("Should be authorized as reward distributor", async function () {
      expect(await stakingContract.rewardDistributors(await swapperRouter.getAddress())).to.be.true;
    });

    it("Should have correct status initially", async function () {
      const status = await swapperRouter.getStatus();

      expect(status.isSwappingPaused).to.be.false;
      expect(status.isEmergencyMode).to.be.false;
      expect(status.isStreamingActive).to.be.false;
      expect(status.currentSpiritBalance).to.equal(0);
    });
  });

  // ============ LIQUIDITY POOL MANAGER TESTS ============

  describe("Liquidity Pool Manager", function () {
    beforeEach(async function () {
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });
    });

    it("Should deploy LiquidityPoolManager correctly", async function () {
      expect(await liquidityPoolManager.spiritToken()).to.equal(await spiritToken.getAddress());
      expect(await liquidityPoolManager.abrahamToken()).to.equal(await abrahamToken.getAddress());
      expect(await liquidityPoolManager.platformWallet()).to.equal(platform.address);
    });

    it("Should have correct initial configuration", async function () {
      expect(await liquidityPoolManager.spiritLiquidityAmount()).to.equal(
        ethers.parseEther("200000000"),
      );
      expect(await liquidityPoolManager.abrahamLiquidityAmount()).to.equal(
        ethers.parseEther("200000000"),
      );
      expect(await liquidityPoolManager.platformFeeRate()).to.equal(25); // 0.25%
    });

    it("Should track pool initialization status", async function () {
      const poolInfo = await liquidityPoolManager.getPoolInfo();

      expect(poolInfo.spiritEthInitialized).to.be.false;
      expect(poolInfo.abrahamSpiritInitialized).to.be.false;
      expect(poolInfo.spiritEthPoolAddr).to.equal(ethers.ZeroAddress);
      expect(poolInfo.abrahamSpiritPoolAddr).to.equal(ethers.ZeroAddress);
    });
  });

  // ============ INTEGRATION TESTS ============

  describe("Integration Tests", function () {
    beforeEach(async function () {
      // Full system setup
      await spiritToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        treasury: treasury.address,
        platform: platform.address,
        teamEquity: teamEquity.address,
        community: community.address,
      });

      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      await stakingContract.connect(owner).addRewardDistributor(await swapperRouter.getAddress());

      // Transfer tokens for testing
      const testAmount = ethers.parseEther("1000");
      await abrahamToken.connect(artist).transfer(user1.address, testAmount);
      await spiritToken.connect(treasury).transfer(await swapperRouter.getAddress(), testAmount);
    });

    it("Should integrate staking and reward distribution", async function () {
      const stakeAmount = ethers.parseEther("100");

      // User stakes ABRAHAM
      await abrahamToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stakeAbraham(stakeAmount);

      // Verify staking worked
      expect(await stakingContract.isAbrahamStaker(user1.address)).to.be.true;
      expect(await stakingContract.abrahamStaked(user1.address)).to.equal(stakeAmount);

      // SwapperRouter should be able to start reward stream
      await expect(
        swapperRouter.connect(owner).startStreaming(100), // 100 wei/sec
      ).to.not.be.reverted;
    });

    it("Should have correct total supply distribution", async function () {
      const maxSupply = ethers.parseEther("1000000000");
      const quarterSupply = ethers.parseEther("250000000");

      // Check SPIRIT distribution
      const spiritTotalDistributed =
        (await spiritToken.balanceOf(treasury.address)) +
        (await spiritToken.balanceOf(platform.address)) +
        (await spiritToken.balanceOf(teamEquity.address)) +
        (await spiritToken.balanceOf(community.address));

      expect(spiritTotalDistributed).to.equal(maxSupply);

      // Check ABRAHAM distribution
      const abrahamTotalDistributed =
        (await abrahamToken.balanceOf(artist.address)) +
        (await abrahamToken.balanceOf(agent.address)) +
        (await abrahamToken.balanceOf(treasury.address)) +
        (await abrahamToken.balanceOf(spiritHolders.address));

      expect(abrahamTotalDistributed).to.equal(maxSupply);
    });

    it("Should maintain system state consistency", async function () {
      // Get user staking info
      const stakingInfo = await stakingContract.getUserStakingInfo(user1.address);

      expect(stakingInfo.spiritStakedAmount).to.equal(0);
      expect(stakingInfo.abrahamStakedAmount).to.equal(0);
      expect(stakingInfo.isAbrahamStakerStatus).to.be.false;
      expect(stakingInfo.isSpiritStakerStatus).to.be.false;

      // Get total staking stats
      const totalStats = await stakingContract.getTotalStakingStats();

      expect(totalStats.totalSpirit).to.equal(0);
      expect(totalStats.totalAbraham).to.equal(0);
      expect(totalStats.abrahamStakerCount).to.equal(0);
      expect(totalStats.spiritStakerCount).to.equal(0);
    });
  });

  // ============ ERROR HANDLING TESTS ============

  describe("Error Handling", function () {
    it("Should revert on invalid amounts", async function () {
      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      await expect(stakingContract.connect(user1).stakeAbraham(0)).to.be.revertedWithCustomError(
        stakingContract,
        "InvalidAmount",
      );
    });

    it("Should revert on insufficient balance", async function () {
      await abrahamToken.initialize(MOCK_SUPERTOKEN_FACTORY, {
        artist: artist.address,
        agent: agent.address,
        treasury: treasury.address,
        spiritHolders: spiritHolders.address,
      });

      const largeAmount = ethers.parseEther("1000000");

      await expect(
        stakingContract.connect(user1).stakeAbraham(largeAmount),
      ).to.be.revertedWithCustomError(stakingContract, "TransferFailed");
    });

    it("Should handle emergency modes correctly", async function () {
      await swapperRouter.connect(owner).toggleEmergencyMode();

      const status = await swapperRouter.getStatus();
      expect(status.isEmergencyMode).to.be.true;
    });
  });
});
