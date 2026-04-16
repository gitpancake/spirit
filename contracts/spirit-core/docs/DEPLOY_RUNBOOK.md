# Spirit Protocol — Deployment Runbook

**Version**: 1.0.0
**Last Updated**: December 9, 2025
**Network**: Base L2 (Chain ID: 8453)
**Audit Status**: All issues resolved

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Network Configuration](#3-network-configuration)
4. [Deployment Sequence](#4-deployment-sequence)
5. [Post-Deployment Configuration](#5-post-deployment-configuration)
6. [Agent Token Creation](#6-agent-token-creation)
7. [Vesting Schedule Creation](#7-vesting-schedule-creation)
8. [Reward Distribution Operations](#8-reward-distribution-operations)
9. [UI Integration Endpoints](#9-ui-integration-endpoints)
10. [Verification Checklist](#10-verification-checklist)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

```bash
# Foundry (latest)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version  # >= 0.2.0
cast --version
anvil --version
```

### 1.2 Required Accounts

| Account | Purpose | Requirements |
|---------|---------|--------------|
| Deployer | Deploy contracts | ETH for gas (0.1 ETH recommended) |
| Admin/Multisig | Protocol governance | Safe multisig on Base |
| Treasury | Hold SPIRIT tokens | Same as Admin or separate |
| Distributor | Distribute rewards | EOA or automation bot |

### 1.3 Required Keys/Secrets

```bash
# .env file (DO NOT COMMIT)
DEPLOYER_PRIVATE_KEY=0x...      # Or use keystore
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=...            # For verification
```

### 1.4 External Contract Addresses (Base Mainnet)

```bash
# Superfluid
SUPER_TOKEN_FACTORY=0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3
VESTING_SCHEDULER_V3=0x6Bf35A170056eDf9aEba159dce4a640cfCef9312

# Uniswap V4
POOL_MANAGER=0x498581fF718922c3f8e6A244956aF099B2652b2b
POSITION_MANAGER=0x7C5f5A4bBd8fD63184577525326123B519429bDc
PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3

# Airstream
AIRSTREAM_FACTORY=0xAB82062c4A9E4DF736238bcfA9fea15eb763bf69
```

---

## 2. Environment Setup

### 2.1 Clone Repository

```bash
git clone https://github.com/spirit-protocol/spirit-contracts-core.git
cd spirit-contracts-core
```

### 2.2 Install Dependencies

```bash
forge install
```

### 2.3 Build Contracts

```bash
forge build
```

### 2.4 Run Tests

```bash
# All tests
forge test

# Verbose output
forge test -vvv

# Gas report
forge test --gas-report
```

### 2.5 Configure Keystore (Recommended)

```bash
# Import deployer key into encrypted keystore
cast wallet import MAINNET_DEPLOYER --interactive

# Verify
cast wallet list
```

---

## 3. Network Configuration

### 3.1 Update NetworkConfig.sol

Edit `script/config/NetworkConfig.sol` to set mainnet addresses:

```solidity
function getBaseMainnetConfig() internal pure returns (SpiritDeploymentConfig memory) {
    return SpiritDeploymentConfig({
        // Role Settings - UPDATE THESE
        admin: 0xYOUR_MULTISIG_ADDRESS,
        treasury: 0xYOUR_TREASURY_ADDRESS,
        distributor: 0xYOUR_DISTRIBUTOR_ADDRESS,

        // External Contracts (DO NOT CHANGE)
        vestingScheduler: 0x6Bf35A170056eDf9aEba159dce4a640cfCef9312,
        superTokenFactory: 0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3,
        positionManager: 0x7C5f5A4bBd8fD63184577525326123B519429bDc,
        poolManager: 0x498581fF718922c3f8e6A244956aF099B2652b2b,
        permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3,
        airstreamFactory: 0xAB82062c4A9E4DF736238bcfA9fea15eb763bf69,

        // Token Settings
        spiritTokenName: "Spirit Token",
        spiritTokenSymbol: "SPIRIT",
        spiritTokenSupply: 1_000_000_000 ether,
        spiritTokenLiquiditySupply: 250_000_000 ether,

        // Pool Settings
        spiritInitialTick: 184_200,  // Adjust based on desired initial price
        spiritPoolFee: 10_000,       // 1%
        spiritTickSpacing: 200
    });
}
```

### 3.2 Initial Price Calculation

The `spiritInitialTick` determines the initial SPIRIT/ETH price:

```python
# Python helper for tick calculation
import math

def tick_to_price(tick):
    return 1.0001 ** tick

def price_to_tick(price):
    return int(math.log(price) / math.log(1.0001))

# Example: 1 ETH = 100,000 SPIRIT
# Price of SPIRIT in ETH = 1/100000 = 0.00001
# tick = price_to_tick(0.00001) ≈ -115129 (if SPIRIT is token0)
# tick = price_to_tick(100000) ≈ 115129 (if SPIRIT is token1)

# Note: Actual tick depends on token ordering (lower address = token0)
```

---

## 4. Deployment Sequence

### 4.1 Dry Run (Simulation)

```bash
# Simulate deployment without broadcasting
forge script script/Deploy.s.sol:DeploySpirit \
    --rpc-url $BASE_RPC_URL \
    --account MAINNET_DEPLOYER
```

### 4.2 Production Deployment

```bash
# Deploy with verification
forge script script/Deploy.s.sol:DeploySpirit \
    --rpc-url $BASE_RPC_URL \
    --account MAINNET_DEPLOYER \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY
```

### 4.3 Deployment Order (Automated by Script)

The deployment script executes in this order:

```
1. SpiritToken
   └── Deploy CustomSuperTokenBase proxy
   └── Initialize with 1B supply to deployer

2. SpiritVestingFactory
   └── Deploy with VestingSchedulerV3 reference
   └── Set treasury address

3. SPIRIT/ETH Uniswap V4 Pool
   └── Create pool with initial tick
   └── Mint 250M SPIRIT single-sided position
   └── Position sent to treasury

4. Transfer SPIRIT to Treasury
   └── All remaining SPIRIT (750M) to treasury

5. RewardController
   └── Deploy logic contract
   └── Deploy ERC1967Proxy
   └── Initialize with admin roles

6. StakingPool Beacon
   └── Deploy logic contract
   └── Deploy UpgradeableBeacon
   └── Set beacon owner to admin

7. SpiritFactory
   └── Deploy logic contract with all references
   └── Deploy ERC1967Proxy
   └── Initialize with admin

8. Grant FACTORY_ROLE
   └── RewardController grants FACTORY_ROLE to SpiritFactory

9. Revoke Deployer Admin
   └── RewardController revokes DEFAULT_ADMIN_ROLE from deployer
```

### 4.4 Expected Output

```
===> DEPLOYMENT CONFIGURATION
 --- Admin address                 : 0x...
 --- Treasury address              : 0x...
 --- Distributor address           : 0x...
 --- Super Token Factory           : 0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3
 --- UniswapV4 Position Manager    : 0x7C5f5A4bBd8fD63184577525326123B519429bDc
 --- UniswapV4 Pool Manager        : 0x498581fF718922c3f8e6A244956aF099B2652b2b
 --- Permit2 address               : 0x000000000022D473030F116dDEE9F6B43aC78BA3
 --- Spirit Token Name             : Spirit Token
 --- Spirit Token Symbol           : SPIRIT
 --- Spirit Token Supply           : 1000000000
 --- SPIRIT/ETH Initial Tick       : 184200
 --- SPIRIT/ETH Tick Spacing       : 200
 --- SPIRIT/ETH Pool Fee           : 10000

===> DEPLOYING SPIRIT PROTOCOL
 --- Chain ID          :    8453
 --- Deployer address  :    0x...
 --- Deployer balance  :    X ETH

===> DEPLOYMENT RESULTS
 --- Spirit Token              : 0x...
 --- Reward Controller         : 0x...
 --- Staking Pool              : 0x...
 --- Spirit Factory            : 0x...
 --- Spirit Vesting Factory    : 0x...
```

### 4.5 Record Deployed Addresses

After deployment, update `DEPLOYMENT.md` with:

```markdown
## BASE MAINNET

### Contract Addresses

| Contract               | Address |
| ---------------------- | ------- |
| SPIRIT Multisig        | `0x...` |
| SPIRIT Token           | `0x...` |
| Reward Controller      | `0x...` |
| Staking Pool (Beacon)  | `0x...` |
| Spirit Factory         | `0x...` |
| Spirit Vesting Factory | `0x...` |
```

---

## 5. Post-Deployment Configuration

### 5.1 Verify Contracts on BaseScan

If automatic verification failed:

```bash
# Verify SpiritToken
forge verify-contract \
    --chain-id 8453 \
    --watch \
    0xSPIRIT_TOKEN_ADDRESS \
    src/token/SpiritToken.sol:SpiritToken

# Verify SpiritFactory (with constructor args)
forge verify-contract \
    --chain-id 8453 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address,address,address,address,address,address,address,address)" \
        0xBEACON 0xSPIRIT 0xREWARD_CTRL 0xSUPER_FACTORY 0xPOS_MGR 0xPOOL_MGR 0xPERMIT2 0xAIRSTREAM) \
    0xSPIRIT_FACTORY_ADDRESS \
    src/factory/SpiritFactory.sol:SpiritFactory
```

### 5.2 Verify Role Configuration

```bash
# Check RewardController roles
cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    $(cast keccak "DEFAULT_ADMIN_ROLE") $ADMIN_ADDRESS \
    --rpc-url $BASE_RPC_URL

cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    $(cast keccak "FACTORY_ROLE") $SPIRIT_FACTORY \
    --rpc-url $BASE_RPC_URL

cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    $(cast keccak "DISTRIBUTOR_ROLE") $DISTRIBUTOR_ADDRESS \
    --rpc-url $BASE_RPC_URL
```

### 5.3 Verify Token Supply

```bash
# Check SPIRIT total supply
cast call $SPIRIT_TOKEN "totalSupply()" --rpc-url $BASE_RPC_URL
# Expected: 1000000000000000000000000000 (1B * 10^18)

# Check treasury balance
cast call $SPIRIT_TOKEN "balanceOf(address)" $TREASURY --rpc-url $BASE_RPC_URL
# Expected: 750000000000000000000000000 (750M * 10^18)
```

### 5.4 Grant DISTRIBUTOR_ROLE (If Not Done)

If distributor needs to be added after deployment:

```bash
# From admin multisig
cast send $REWARD_CONTROLLER "grantRole(bytes32,address)" \
    $(cast keccak "DISTRIBUTOR_ROLE") $DISTRIBUTOR_ADDRESS \
    --account ADMIN
```

---

## 6. Agent Token Creation

### 6.1 Prepare Merkle Tree

Before creating an agent token, generate the merkle root for airstream distribution:

```javascript
// merkle-tree-generator.js
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

// Format: [address, amount]
const values = [
    ["0xHolder1...", "1000000000000000000000000"], // 1M tokens
    ["0xHolder2...", "500000000000000000000000"],  // 500K tokens
    // ... more holders
];

const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
console.log("Merkle Root:", tree.root);
console.log("Tree:", JSON.stringify(tree.dump()));
```

### 6.2 Calculate Initial Price

Determine the initial CHILD/SPIRIT price (sqrtPriceX96):

```javascript
// Calculate sqrtPriceX96 for initial price
// Price = (sqrtPriceX96 / 2^96)^2

const ethers = require("ethers");

function priceToSqrtPriceX96(price) {
    // price = SPIRIT per CHILD (e.g., 0.001 means 1 CHILD = 0.001 SPIRIT)
    const sqrtPrice = Math.sqrt(price);
    const Q96 = ethers.BigNumber.from(2).pow(96);
    return Q96.mul(Math.floor(sqrtPrice * 1e18)).div(1e18);
}

// Example: 1 CHILD = 0.01 SPIRIT
const sqrtPriceX96 = priceToSqrtPriceX96(0.01);
console.log("sqrtPriceX96:", sqrtPriceX96.toString());
```

### 6.3 Create Agent Token (Admin Only)

```bash
# From admin multisig
cast send $SPIRIT_FACTORY "createChild(string,string,address,address,bytes32,bytes32,uint160)" \
    "Agent Name Token" \
    "AGENT" \
    $ARTIST_ADDRESS \
    $AGENT_ADDRESS \
    $MERKLE_ROOT \
    $SALT \
    $SQRT_PRICE_X96 \
    --account ADMIN \
    --rpc-url $BASE_RPC_URL
```

### 6.4 With Special Allocation

If some liquidity should go to admin instead of Uniswap:

```bash
# Creates child with 200M to LP, 50M to admin
cast send $SPIRIT_FACTORY "createChild(string,string,address,address,uint256,bytes32,bytes32,uint160)" \
    "Agent Name Token" \
    "AGENT" \
    $ARTIST_ADDRESS \
    $AGENT_ADDRESS \
    "50000000000000000000000000" \
    $MERKLE_ROOT \
    $SALT \
    $SQRT_PRICE_X96 \
    --account ADMIN \
    --rpc-url $BASE_RPC_URL
```

### 6.5 Verify Creation

```bash
# Get event logs for ChildTokenCreated
cast logs \
    --from-block $DEPLOY_BLOCK \
    --address $SPIRIT_FACTORY \
    "ChildTokenCreated(address,address,address,address,bytes32)" \
    --rpc-url $BASE_RPC_URL
```

---

## 7. Vesting Schedule Creation

### 7.1 Approve Tokens for Vesting Factory

```bash
# From treasury, approve tokens for vesting
cast send $SPIRIT_TOKEN "approve(address,uint256)" \
    $SPIRIT_VESTING_FACTORY \
    "100000000000000000000000000" \
    --account TREASURY \
    --rpc-url $BASE_RPC_URL
```

### 7.2 Create Vesting Schedule

```bash
# Parameters:
# - recipient: who receives tokens
# - amount: total tokens to vest
# - cliffAmount: tokens released at cliff
# - cliffDate: timestamp when cliff occurs
# - endDate: timestamp when vesting ends

cast send $SPIRIT_VESTING_FACTORY "createSpiritVestingContract(address,uint256,uint256,uint32,uint32)" \
    $RECIPIENT_ADDRESS \
    "10000000000000000000000000" \
    "1000000000000000000000000" \
    $CLIFF_TIMESTAMP \
    $END_TIMESTAMP \
    --account TREASURY \
    --rpc-url $BASE_RPC_URL
```

### 7.3 Example: 12-Month Cliff, 24-Month Vesting

```bash
# Calculate timestamps
NOW=$(date +%s)
CLIFF=$(($NOW + 31536000))  # +1 year
END=$(($NOW + 94608000))    # +3 years

# Create vesting: 10M total, 2M cliff, rest streaming
cast send $SPIRIT_VESTING_FACTORY "createSpiritVestingContract(address,uint256,uint256,uint32,uint32)" \
    $RECIPIENT \
    "10000000000000000000000000" \
    "2000000000000000000000000" \
    $CLIFF \
    $END \
    --account TREASURY \
    --rpc-url $BASE_RPC_URL
```

### 7.4 Query Vesting Contract

```bash
# Get vesting contract for recipient
cast call $SPIRIT_VESTING_FACTORY "spiritVestings(address)" $RECIPIENT --rpc-url $BASE_RPC_URL

# Check unvested balance
cast call $SPIRIT_VESTING_FACTORY "balanceOf(address)" $RECIPIENT --rpc-url $BASE_RPC_URL
```

### 7.5 Vesting Schedule from CSV

The complete vesting schedule is defined in `/config/vesting_schedule.csv`.

**Vesting Pattern** (12m cliff + 36m linear):
- Cliff Date: TGE + 12 months
- End Date: TGE + 48 months
- Cliff Amount: 20% of total allocation

**Buckets with Vesting**:
| Bucket | Total | Recipients |
|--------|-------|------------|
| Eden Existing | 200,000,000 | 8 rows |
| Eden Reserve | 50,000,000 | 1 placeholder |
| Protocol Team | 100,000,000 | 2 rows |
| Community Upfront | 100,000,000 | 24 rows |

**Buckets WITHOUT Vesting** (do not create vesting contracts):
- Community Programmatic (300M) — uses airstream mechanism
- Treasury sub-allocations (OTC, LP, Presale, Aerodrome, Braindrops, Bright Moments, Superfluid)

**Process**:
```bash
# 1. Set TGE timestamp
TGE=1738368000  # Example: Feb 1, 2026

# 2. Calculate dates
CLIFF=$(($TGE + 31536000))  # TGE + 12 months
END=$(($TGE + 126230400))   # TGE + 48 months

# 3. Approve full vesting amount
cast send $SPIRIT_TOKEN "approve(address,uint256)" \
    $SPIRIT_VESTING_FACTORY \
    "450000000000000000000000000" \
    --account TREASURY

# 4. Create each vesting from CSV (example)
# Gene: 75M total, 15M cliff (20%)
cast send $SPIRIT_VESTING_FACTORY "createSpiritVestingContract(address,uint256,uint256,uint32,uint32)" \
    $GENE_ADDRESS \
    "75000000000000000000000000" \
    "15000000000000000000000000" \
    $CLIFF \
    $END \
    --account TREASURY
```

---

## 7.6 Post-Deploy Treasury Transfers

After deploy, treasury (950M) must be allocated per tokenomics.json:

**Direct Transfers** (no vesting):
```bash
# Superfluid DAO (5M)
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $SUPERFLUID_DAO_ADDRESS \
    "5000000000000000000000000" \
    --account TREASURY

# Braindrops holders distribution (10M to distributor)
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $BRAINDROPS_DISTRIBUTOR \
    "10000000000000000000000000" \
    --account TREASURY

# Bright Moments citizens (10M)
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $BRIGHT_MOMENTS_DISTRIBUTOR \
    "10000000000000000000000000" \
    --account TREASURY

# Aerodrome ignition (10M)
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $AERODROME_ADDRESS \
    "10000000000000000000000000" \
    --account TREASURY
```

**Note**: OTC (110M), Presale (50M), and Superfluid Stakers (5M) remain in treasury for operational use.

---

## 8. Reward Distribution Operations

### 8.1 Approve SPIRIT for Distribution

```bash
# Distributor approves RewardController to spend SPIRIT
cast send $SPIRIT_TOKEN "approve(address,uint256)" \
    $REWARD_CONTROLLER \
    "1000000000000000000000000" \
    --account DISTRIBUTOR \
    --rpc-url $BASE_RPC_URL
```

### 8.2 Distribute Rewards

```bash
# Distribute 1M SPIRIT to AGENT stakers
cast send $REWARD_CONTROLLER "distributeRewards(address,uint256)" \
    $CHILD_TOKEN_ADDRESS \
    "1000000000000000000000000" \
    --account DISTRIBUTOR \
    --rpc-url $BASE_RPC_URL
```

### 8.3 Check Staking Pool Status

```bash
# Get staking pool for child token
STAKING_POOL=$(cast call $REWARD_CONTROLLER "stakingPools(address)" $CHILD_TOKEN --rpc-url $BASE_RPC_URL)

# Check SPIRIT balance in pool
cast call $SPIRIT_TOKEN "balanceOf(address)" $STAKING_POOL --rpc-url $BASE_RPC_URL

# Get distribution pool address
cast call $STAKING_POOL "distributionPool()" --rpc-url $BASE_RPC_URL
```

### 8.4 Terminate Distribution (Emergency)

```bash
# Stop rewards to a staking pool
cast send $REWARD_CONTROLLER "terminateDistribution(address)" \
    $CHILD_TOKEN_ADDRESS \
    --account DISTRIBUTOR \
    --rpc-url $BASE_RPC_URL
```

---

## 9. UI Integration Endpoints

### 9.1 User Staking Flow

```javascript
// Frontend integration pseudocode

// 1. Get staking pool for agent
const stakingPool = await rewardController.stakingPools(childToken);

// 2. Check approval
const allowance = await childToken.allowance(user, stakingPool);
if (allowance < amount) {
    await childToken.approve(stakingPool, ethers.constants.MaxUint256);
}

// 3. Stake tokens
// Parameters: amount (uint256), lockingPeriod (uint256 in seconds)
await stakingPool.stake(amount, lockingPeriod);

// 4. Check staking info
const info = await stakingPool.getStakingInfo(user);
// Returns: { stakedAmount, lockedUntil }

// 5. Get GDA pool info for real-time rewards
const gdaPool = await stakingPool.distributionPool();
const units = await gdaPool.getUnits(user);
const flowRate = await gdaPool.getMemberFlowRate(user);
```

### 9.2 Calculate Expected Rewards

```javascript
// Calculate user's share of weekly distribution
async function calculateExpectedRewards(stakingPool, user) {
    const gdaPool = await stakingPool.distributionPool();

    const userUnits = await gdaPool.getUnits(user);
    const totalUnits = await gdaPool.getTotalUnits();

    const poolBalance = await spirit.balanceOf(stakingPool.address);
    const STREAM_OUT_DURATION = 7 * 24 * 60 * 60; // 1 week in seconds

    const weeklyFlowRate = poolBalance / STREAM_OUT_DURATION;
    const userShare = (userUnits * weeklyFlowRate) / totalUnits;

    return {
        weeklyRewards: userShare,
        hourlyRewards: userShare / (7 * 24),
        dailyRewards: userShare / 7
    };
}
```

### 9.3 Read Contract ABIs

Key function signatures for UI:

```solidity
// StakingPool
function stake(uint256 amount, uint256 lockingPeriod) external;
function increaseStake(uint256 amount) external;
function extendLockingPeriod(uint256 newLockingPeriod) external;
function unstake(uint256 amount) external;
function getStakingInfo(address staker) external view returns (StakingInfo memory);
function calculateMultiplier(uint256 lockingPeriod) external pure returns (uint256);
function distributionPool() external view returns (ISuperfluidPool);
function child() external view returns (ISuperToken);
function SPIRIT() external view returns (ISuperToken);

// RewardController
function stakingPools(address child) external view returns (IStakingPool);
function distributeRewards(address child, uint256 amount) external;

// SpiritVestingFactory
function balanceOf(address vestingReceiver) external view returns (uint256);
function spiritVestings(address recipient) external view returns (address);

// SpiritFactory
function createChild(...) external returns (ISuperToken, IStakingPool, address, address);
```

### 9.4 Event Monitoring

```javascript
// Key events to monitor

// StakingPool events
stakingPool.on("Staked", (staker, amount, lockingPeriod) => { ... });
stakingPool.on("IncreasedStake", (staker, amount) => { ... });
stakingPool.on("ExtendedLockingPeriod", (staker, lockEndDate) => { ... });
stakingPool.on("Unstaked", (staker, amount) => { ... });

// SpiritFactory events
spiritFactory.on("ChildTokenCreated", (child, stakingPool, artist, agent, merkleRoot) => { ... });

// Superfluid GDA events (for real-time reward tracking)
gdaPool.on("MemberUnitsUpdated", (token, member, oldUnits, newUnits) => { ... });
```

---

## 10. Verification Checklist

### 10.1 Pre-Launch Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on BaseScan
- [ ] Admin roles assigned to multisig
- [ ] Deployer admin role revoked from RewardController
- [ ] SPIRIT token total supply is 1B
- [ ] Treasury received 750M SPIRIT
- [ ] SPIRIT/ETH LP position created (250M)
- [ ] LP position owned by treasury
- [ ] VestingFactory treasury set correctly

### 10.2 First Agent Token Checklist

- [ ] Merkle tree generated with correct allocations
- [ ] Artist address confirmed
- [ ] Agent address confirmed
- [ ] Initial price calculated correctly
- [ ] createChild() transaction successful
- [ ] ChildSuperToken deployed (1B supply)
- [ ] StakingPool deployed and initialized
- [ ] Artist staked 250M (52-week lock)
- [ ] Agent staked 250M (52-week lock)
- [ ] CHILD/SPIRIT Uniswap pool created
- [ ] 250M CHILD in liquidity position
- [ ] Airstream created with merkle root
- [ ] 250M CHILD in airstream
- [ ] StakingPool registered in RewardController

### 10.3 Ongoing Operations Checklist

- [ ] Weekly reward distributions scheduled
- [ ] Distributor has sufficient SPIRIT balance
- [ ] RewardController approval set
- [ ] Staking pool flow rates refreshed
- [ ] Airstream claims being processed
- [ ] Vesting schedules on track

---

## 11. Troubleshooting

### 11.1 Deployment Failures

**Issue**: Transaction reverts during deployment
```bash
# Check gas estimation
forge script script/Deploy.s.sol:DeploySpirit \
    --rpc-url $BASE_RPC_URL \
    -vvvv

# Check specific error
cast call --trace <failed_tx_hash> --rpc-url $BASE_RPC_URL
```

**Issue**: Insufficient gas
```bash
# Increase gas limit
forge script ... --gas-limit 30000000
```

### 11.2 Token Creation Failures

**Issue**: CHILD_TOKEN_ALREADY_DEPLOYED
- Use a different salt value for CREATE2

**Issue**: POOL_INITIALIZATION_FAILED
- Pool may already exist at that address
- Check if tokens are in correct order (currency0 < currency1)
- Verify sqrtPriceX96 is valid

**Issue**: INVALID_SPECIAL_ALLOCATION
- specialAllocation must be < 250M (DEFAULT_LIQUIDITY_SUPPLY)

### 11.3 Staking Issues

**Issue**: ALREADY_STAKED
- User already has active stake
- Use increaseStake() instead

**Issue**: TOKENS_STILL_LOCKED
- Wait until lockedUntil timestamp passes
- Check: `stakingPool.getStakingInfo(user).lockedUntil`

**Issue**: INVALID_LOCKING_PERIOD
- Must be between 1 week and 156 weeks

### 11.4 Reward Distribution Issues

**Issue**: STAKING_POOL_NOT_FOUND
- Child token not registered
- Check: `rewardController.stakingPools(childToken)`

**Issue**: INVALID_AMOUNT
- Amount must be > 0

**Issue**: Transfer fails
- Ensure distributor has approved RewardController
- Check distributor SPIRIT balance

### 11.5 Vesting Issues

**Issue**: RECIPIENT_ALREADY_HAS_VESTING_CONTRACT
- Each recipient can only have one vesting schedule
- Check existing: `vestingFactory.spiritVestings(recipient)`

**Issue**: FORBIDDEN (on createVesting)
- Only treasury can create vesting schedules
- Ensure msg.sender == treasury

### 11.6 Common Cast Commands

```bash
# Decode error
cast 4byte-decode <error_selector>

# Get transaction trace
cast run <tx_hash> --rpc-url $BASE_RPC_URL

# Decode calldata
cast calldata-decode "function(args)" <calldata>

# Get storage slot
cast storage <address> <slot> --rpc-url $BASE_RPC_URL

# Estimate gas
cast estimate <address> "function(args)" --rpc-url $BASE_RPC_URL
```

---

## Appendix A: Gas Estimates

| Operation | Estimated Gas |
|-----------|---------------|
| Full Protocol Deployment | ~8.5M gas |
| Create Child Token | ~3M gas |
| Create Vesting Schedule | ~500K gas |
| Stake Tokens | ~200K gas |
| Increase Stake | ~150K gas |
| Unstake Tokens | ~180K gas |
| Distribute Rewards | ~200K gas |

---

## Appendix B: Quick Reference

### Contract Roles

```solidity
DEFAULT_ADMIN_ROLE = 0x00
FACTORY_ROLE = keccak256("FACTORY_ROLE")
DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE")
```

### Key Constants

```solidity
CHILD_TOTAL_SUPPLY = 1_000_000_000 ether
DEFAULT_LIQUIDITY_SUPPLY = 250_000_000 ether
AIRSTREAM_SUPPLY = 250_000_000 ether
AIRSTREAM_DURATION = 52 weeks
MINIMUM_STAKE_AMOUNT = 1 ether
MINIMUM_LOCKING_PERIOD = 1 weeks
MAXIMUM_LOCKING_PERIOD = 156 weeks
STAKEHOLDER_AMOUNT = 250_000_000 ether
STAKEHOLDER_LOCKING_PERIOD = 52 weeks
MIN_MULTIPLIER = 10_000  // 1x
MAX_MULTIPLIER = 360_000 // 36x
```

### Useful Cast Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias spirit-balance='cast call $SPIRIT_TOKEN "balanceOf(address)"'
alias spirit-supply='cast call $SPIRIT_TOKEN "totalSupply()"'
alias staking-info='cast call $STAKING_POOL "getStakingInfo(address)"'
```

---

## Appendix C: Network Config Reference (Base)

### C.1 Configuration Template

The network configuration template is located at:
```
config/network/base.template.json
```

Copy and fill in the required values before deployment.

### C.2 Field Reference Table

#### Addresses (MUST FILL)

| Field | Type | Safe to Modify | Description |
|-------|------|----------------|-------------|
| `admin` | address | YES | Protocol admin multisig. Receives DEFAULT_ADMIN_ROLE on all contracts. Use Safe 2-of-3 minimum. |
| `treasury` | address | YES | Fee recipient. Receives protocol fees, cancelled vesting tokens, LP positions. |
| `distributor` | address | YES | Airstream distributor. Authorized to trigger merkle-based token distributions. Can be EOA. |

#### External Contracts (DO NOT MODIFY)

| Field | Type | Base Mainnet Address | Source |
|-------|------|---------------------|--------|
| `vestingScheduler` | address | `0x5AaB2FB7a0D67DD0b5d40D4A4AE96b7f8Af89E81` | Superfluid |
| `superTokenFactory` | address | `0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3` | Superfluid |
| `positionManager` | address | `0x7C5f5A4bBd8fD63184577525326123B519429bDc` | Uniswap V4 |
| `poolManager` | address | `0x498581fF718922c3f8e6A244956aF099B2652b2b` | Uniswap V4 |
| `permit2` | address | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Uniswap |
| `airstreamFactory` | address | `0x4D69F16cFfc6db4e1E7FF1f49e47a7f4bE4E4776` | Superfluid |

#### Token Parameters

| Field | Type | Default | Safe to Modify | Description |
|-------|------|---------|----------------|-------------|
| `spiritTokenName` | string | "SPIRIT" | YES | ERC20 token name |
| `spiritTokenSymbol` | string | "SPIRIT" | YES | ERC20 token symbol |
| `spiritTokenSupply` | uint256 | 1B (1e27 wei) | YES | Total supply in wei (18 decimals) |
| `spiritTokenLiquiditySupply` | uint256 | 250M (2.5e26 wei) | YES | Tokens allocated to Uniswap V4 LP |

#### Uniswap V4 Parameters

| Field | Type | Default | Safe to Modify | Description |
|-------|------|---------|----------------|-------------|
| `spiritPoolFee` | uint24 | 10000 (1%) | YES | Pool swap fee in hundredths of a bip |
| `spiritInitialTick` | int24 | 0 | YES | Initial price tick. Calculate based on desired launch price. |
| `spiritTickSpacing` | int24 | 200 | NO | Must match pool fee tier. 200 is correct for 1%. |

### C.3 Hardcoded Constants (READ ONLY)

These values are compiled into the contracts and cannot be changed via configuration:

#### StakingPool.sol

| Constant | Value | Description |
|----------|-------|-------------|
| `MINIMUM_STAKE_AMOUNT` | 1 ether | Minimum tokens required to stake |
| `MINIMUM_LOCKING_PERIOD` | 1 week | Shortest allowed lock duration |
| `MAXIMUM_LOCKING_PERIOD` | 156 weeks (3 years) | Longest allowed lock duration |
| `MIN_MULTIPLIER` | 10000 (1×) | Multiplier at minimum lock |
| `MAX_MULTIPLIER` | 360000 (36×) | Multiplier at maximum lock |
| `STAKEHOLDER_LOCKING_PERIOD` | 52 weeks | Lock for artist/agent stakes |

#### SpiritFactory.sol

| Constant | Value | Description |
|----------|-------|-------------|
| `CHILD_TOTAL_SUPPLY` | 1B (1e27) | Total supply per child/agent token |
| `DEFAULT_LIQUIDITY_SUPPLY` | 250M (25%) | Child token LP allocation |
| `AIRSTREAM_SUPPLY` | 250M (25%) | Child token airstream allocation |
| `AIRSTREAM_DURATION` | 52 weeks | Airstream vesting duration |
| `DEFAULT_POOL_FEE` | 10000 (1%) | Child token Uniswap pool fee |
| `DEFAULT_TICK_SPACING` | 200 | Child token Uniswap tick spacing |

### C.4 Pre-Deployment Validation Checklist

Before running the deploy script:

- [ ] **admin** is a deployed Safe multisig with 2+ signers
- [ ] **treasury** address is confirmed and accessible
- [ ] **distributor** address is confirmed (can be EOA for ops speed)
- [ ] All three addresses are NOT address(0)
- [ ] All three addresses are NOT the deployer address
- [ ] **spiritTokenSupply** is 1B or custom amount confirmed
- [ ] **spiritTokenLiquiditySupply** is <= spiritTokenSupply
- [ ] **spiritInitialTick** is calculated for desired launch price
- [ ] External contract addresses match current Base mainnet deployments
- [ ] Deployer wallet has sufficient ETH for gas (~0.1 ETH recommended)
- [ ] Repository is on correct commit/tag for deployment

### C.5 Using the Template

```bash
# 1. Copy template to active config
cp config/network/base.template.json config/network/base.json

# 2. Edit with your addresses
# Replace all address(0) values in addresses_to_fill section

# 3. Validate JSON
cat config/network/base.json | jq .

# 4. Update NetworkConfig.sol with values from base.json
# (Manual step - copy values into getBaseMainnetConfig())

# 5. Run deployment
forge script script/Deploy.s.sol:DeploySpirit \
    --rpc-url $BASE_RPC_URL \
    --account MAINNET_DEPLOYER \
    --broadcast \
    --verify
```
