# Spirit Protocol — V1 Architecture

**Version**: 1.0.0
**Last Updated**: December 9, 2025
**Audit Status**: Audited by 0xSimao (November 28, 2025) — All issues resolved
**Network**: Base L2 (Chain ID: 8453)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Contract Architecture](#2-contract-architecture)
3. [Token Distribution Model](#3-token-distribution-model)
4. [Staking System](#4-staking-system)
5. [Vesting System](#5-vesting-system)
6. [Uniswap V4 Integration](#6-uniswap-v4-integration)
7. [Airstream Distribution](#7-airstream-distribution)
8. [Access Control](#8-access-control)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Contract Constants Reference](#10-contract-constants-reference)
11. [External Dependencies](#11-external-dependencies)

---

## 1. System Overview

Spirit Protocol is a decentralized token distribution system built on Superfluid Protocol's real-time streaming infrastructure. The system enables autonomous AI agents and their associated artists to receive token-based rewards through a staking mechanism.

### Core Principles

1. **SPIRIT Token**: The ecosystem's primary token (1B supply) that flows as rewards to stakers
2. **Child Tokens**: Per-agent tokens (1B each) that users stake to earn SPIRIT rewards
3. **Superfluid Streaming**: Real-time reward distribution via Superfluid GDA pools
4. **Uniswap V4 Liquidity**: Single-sided liquidity provision for each token pair

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPIRIT PROTOCOL V1                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │   SPIRIT    │    │  SpiritFactory  │    │ RewardController │   │
│  │   Token     │◄───│   (Admin Only)  │───►│  (Distributor)   │   │
│  │   (1B)      │    └────────┬────────┘    └────────┬─────────┘   │
│  └─────────────┘             │                      │              │
│         │                    │                      │              │
│         │                    ▼                      ▼              │
│         │         ┌──────────────────────────────────────┐        │
│         │         │         Per-Agent Infrastructure     │        │
│         │         │  ┌───────────┐  ┌───────────────────┐│        │
│         │         │  │  CHILD    │  │   StakingPool     ││        │
│         │         │  │  Token    │──│   (GDA Pool)      ││        │
│         │         │  │  (1B)     │  │                   ││        │
│         │         │  └───────────┘  └───────────────────┘│        │
│         │         │  ┌───────────┐  ┌───────────────────┐│        │
│         ▼         │  │ Uniswap   │  │    Airstream      ││        │
│    ┌─────────┐    │  │ V4 Pool   │  │  (Merkle Drop)    ││        │
│    │Treasury │    │  │(CHILD/SP) │  │                   ││        │
│    │(Multisig)│   │  └───────────┘  └───────────────────┘│        │
│    └─────────┘    └──────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contract Architecture

### 2.1 Core Contracts

| Contract | Lines | Description |
|----------|-------|-------------|
| `SpiritToken.sol` | 34 | Main SPIRIT token (Superfluid SuperToken) |
| `ChildSuperToken.sol` | 34 | Per-agent token template (Superfluid SuperToken) |
| `SpiritFactory.sol` | 414 | Creates child tokens with full infrastructure |
| `StakingPool.sol` | 355 | Stake CHILD tokens, earn SPIRIT rewards |
| `RewardController.sol` | 140 | Routes SPIRIT rewards to staking pools |
| `SpiritVestingFactory.sol` | 158 | Creates vesting schedules for team/investors |
| `SpiritVesting.sol` | 117 | Individual vesting contract instance |

### 2.2 Contract Relationships

```
                    ┌─────────────────────┐
                    │    SpiritFactory    │
                    │   (DEFAULT_ADMIN)   │
                    └──────────┬──────────┘
                               │ creates
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐
   │ ChildSuperToken │ │   StakingPool   │ │   Airstream  │
   │    (proxy)      │ │  (BeaconProxy)  │ │  (External)  │
   └────────┬────────┘ └────────┬────────┘ └──────────────┘
            │                   │
            │                   │ receives SPIRIT from
            ▼                   ▼
   ┌─────────────────┐ ┌─────────────────┐
   │   Uniswap V4    │ │RewardController │
   │     Pool        │ │  (DISTRIBUTOR)  │
   └─────────────────┘ └─────────────────┘
```

### 2.3 Proxy Patterns

| Contract | Pattern | Upgrade Authority |
|----------|---------|-------------------|
| SpiritToken | CustomSuperTokenBase + UUPSProxy | Superfluid SuperTokenFactory |
| ChildSuperToken | CustomSuperTokenBase + UUPSProxy | Superfluid SuperTokenFactory |
| SpiritFactory | ERC1967Proxy | DEFAULT_ADMIN_ROLE |
| RewardController | ERC1967Proxy | DEFAULT_ADMIN_ROLE |
| StakingPool | BeaconProxy | UpgradeableBeacon owner |

---

## 3. Token Distribution Model

### 3.1 SPIRIT Token (1,000,000,000 total)

| Bucket | Allocation | % | Vesting |
|--------|------------|---|---------|
| Community (Programmatic) | 300,000,000 | 30% | None (airstream) |
| Treasury | 250,000,000 | 25% | Various |
| Eden Incubation (Existing) | 200,000,000 | 20% | 12m cliff + 36m linear |
| Eden Incubation (Reserve) | 50,000,000 | 5% | 12m cliff + 36m linear |
| Protocol Team | 100,000,000 | 10% | 12m cliff + 36m linear |
| Community Upfront | 100,000,000 | 10% | 12m cliff + 36m linear |

#### Treasury Sub-Allocations (250M)

| Sub-Bucket | Amount | % of Total |
|------------|--------|------------|
| Available for OTC Sales | 110,000,000 | 11.0% |
| LP (Uniswap V4) | 50,000,000 | 5.0% |
| Pre-sale | 50,000,000 | 5.0% |
| Aerodrome Ignition | 10,000,000 | 1.0% |
| Braindrops Holders | 10,000,000 | 1.0% |
| Bright Moments Citizens | 10,000,000 | 1.0% |
| Superfluid DAO | 5,000,000 | 0.5% |
| Superfluid Stakers | 5,000,000 | 0.5% |

**Note**: Superfluid allocations (5M DAO + 5M stakers) are part of the 250M Treasury bucket, not separate buckets.

#### At Deploy

```
┌────────────────────────────────────────────────────────────────┐
│                    SPIRIT DEPLOY DISTRIBUTION                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐                                          │
│  │    SPIRIT/ETH   │  50,000,000 (5%)                         │
│  │  Uniswap V4 LP  │  Single-sided, sent to treasury position │
│  └─────────────────┘                                          │
│                                                                │
│  ┌─────────────────┐                                          │
│  │    Treasury     │  950,000,000 (95%)                       │
│  │    (Multisig)   │  For vesting, operations, distributions  │
│  └─────────────────┘                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Data Sources**: See `/config/tokenomics.json` and `/config/vesting_schedule.csv`

### 3.2 CHILD Token (1,000,000,000 per agent)

```
┌────────────────────────────────────────────────────────────────┐
│                    CHILD TOKEN DISTRIBUTION                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐                                          │
│  │     Artist      │  250,000,000 (25%)                       │
│  │  (52-week lock) │  Staked automatically at creation        │
│  └─────────────────┘                                          │
│                                                                │
│  ┌─────────────────┐                                          │
│  │     Agent       │  250,000,000 (25%)                       │
│  │  (52-week lock) │  Staked automatically at creation        │
│  └─────────────────┘                                          │
│                                                                │
│  ┌─────────────────┐                                          │
│  │   Uniswap V4    │  250,000,000 (25%)                       │
│  │ CHILD/SPIRIT LP │  Single-sided liquidity provision        │
│  └─────────────────┘                                          │
│                                                                │
│  ┌─────────────────┐                                          │
│  │    Airstream    │  250,000,000 (25%)                       │
│  │  (Merkle Drop)  │  52-week streaming distribution          │
│  └─────────────────┘                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Special Allocation Override

The `createChild()` function supports a `specialAllocation` parameter that reduces liquidity supply:

```solidity
// Default: 250M to LP, 0 to special
// With specialAllocation of 50M: 200M to LP, 50M to admin
uint256 liquidityAmount = DEFAULT_LIQUIDITY_SUPPLY - specialAllocation;
```

---

## 4. Staking System

### 4.1 Overview

Users stake CHILD tokens in the StakingPool to earn SPIRIT rewards. Longer lock periods yield higher multipliers on reward shares.

### 4.2 Staking Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `MINIMUM_STAKE_AMOUNT` | 1 ether (1 CHILD) | Minimum tokens to stake |
| `MINIMUM_LOCKING_PERIOD` | 1 week | Shortest lock period |
| `MAXIMUM_LOCKING_PERIOD` | 156 weeks (3 years) | Longest lock period |
| `STREAM_OUT_DURATION` | 1 week | Reward flow refresh interval |
| `MIN_MULTIPLIER` | 10,000 (1x) | Multiplier at 1 week lock |
| `MAX_MULTIPLIER` | 360,000 (36x) | Multiplier at 3 year lock |
| `STAKEHOLDER_LOCKING_PERIOD` | 52 weeks | Artist/Agent lock period |
| `STAKEHOLDER_AMOUNT` | 250,000,000 ether | Artist/Agent stake amount |

### 4.3 Multiplier Calculation

The multiplier scales linearly from 1x (1 week) to 36x (156 weeks):

```solidity
function calculateMultiplier(uint256 lockingPeriod) public pure returns (uint256 multiplier) {
    multiplier = MIN_MULTIPLIER + ((lockingPeriod - MINIMUM_LOCKING_PERIOD) * MULTIPLIER_RANGE) / TIME_RANGE;
}

// Where:
// TIME_RANGE = MAXIMUM_LOCKING_PERIOD - MINIMUM_LOCKING_PERIOD = 155 weeks
// MULTIPLIER_RANGE = MAX_MULTIPLIER - MIN_MULTIPLIER = 350,000
```

### 4.4 Multiplier Table

| Lock Period | Multiplier | Units per 1M CHILD |
|-------------|------------|---------------------|
| 1 week | 1x (10,000) | 1,000,000 |
| 13 weeks (3 months) | ~3.7x | 3,700,000 |
| 26 weeks (6 months) | ~6.4x | 6,400,000 |
| 52 weeks (1 year) | ~12.6x | 12,600,000 |
| 104 weeks (2 years) | ~24.3x | 24,300,000 |
| 156 weeks (3 years) | 36x | 36,000,000 |

### 4.5 GDA Pool Distribution

```
┌────────────────────────────────────────────────────────────────┐
│                SUPERFLUID GDA POOL DISTRIBUTION                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   RewardController                                             │
│        │                                                       │
│        │ distributeRewards(child, amount)                      │
│        ▼                                                       │
│   ┌─────────────┐                                              │
│   │StakingPool  │                                              │
│   │  receives   │                                              │
│   │   SPIRIT    │                                              │
│   └──────┬──────┘                                              │
│          │                                                     │
│          │ refreshDistributionFlow()                           │
│          ▼                                                     │
│   ┌──────────────────────────────────────┐                    │
│   │        Superfluid GDA Pool           │                    │
│   │  ┌──────────────────────────────┐    │                    │
│   │  │ Total Units = Sum of all     │    │                    │
│   │  │ staker units (amount * mult) │    │                    │
│   │  └──────────────────────────────┘    │                    │
│   │                                      │                    │
│   │  flowRate = balance / STREAM_OUT_DURATION (1 week)        │
│   │                                      │                    │
│   │  staker_flow = flowRate * (staker_units / total_units)    │
│   └──────────────────────────────────────┘                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.6 Staking Functions

| Function | Description |
|----------|-------------|
| `stake(amount, lockingPeriod)` | Initial stake with lock period |
| `increaseStake(amount)` | Add tokens to existing stake |
| `extendLockingPeriod(newPeriod)` | Extend lock after expiry |
| `unstake(amount)` | Withdraw after lock expires |
| `refreshDistributionFlow()` | Update reward stream (RewardController only) |
| `terminateDistributionFlow(recipient)` | End distribution (RewardController only) |

---

## 5. Vesting System

### 5.1 Overview

SpiritVestingFactory creates individual vesting contracts for team members, investors, and operations using Superfluid's VestingSchedulerV3.

### 5.2 Vesting Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    VESTING SCHEDULE FLOW                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Treasury (multisig)                                          │
│        │                                                       │
│        │ approve + createSpiritVestingContract()               │
│        ▼                                                       │
│   ┌─────────────────────┐                                      │
│   │SpiritVestingFactory │                                      │
│   └──────────┬──────────┘                                      │
│              │ deploys                                         │
│              ▼                                                 │
│   ┌─────────────────────┐    ┌─────────────────────────┐      │
│   │   SpiritVesting     │───►│ VestingSchedulerV3      │      │
│   │   (per recipient)   │    │ (Superfluid External)   │      │
│   └─────────────────────┘    └─────────────────────────┘      │
│              │                                                 │
│              │ cliffDate: one-time transfer                    │
│              │ post-cliff: continuous stream                   │
│              ▼                                                 │
│   ┌─────────────────────┐                                      │
│   │     Recipient       │                                      │
│   │     Wallet          │                                      │
│   └─────────────────────┘                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Vesting Parameters

| Parameter | Description |
|-----------|-------------|
| `recipient` | Address receiving vested tokens |
| `amount` | Total tokens to vest |
| `cliffAmount` | Tokens released at cliff date |
| `cliffDate` | When cliff amount is released |
| `endDate` | When streaming ends |
| `flowRate` | `(amount - cliffAmount) / (endDate - cliffDate)` |

### 5.4 Vesting Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `cancelVesting()` | Treasury only | Stop flow, return remaining to treasury |
| `balanceOf(recipient)` | View | Check unvested balance |
| `setTreasury(newTreasury)` | Treasury only | Update treasury address |

---

## 6. Uniswap V4 Integration

### 6.1 Pool Configuration

| Parameter | SPIRIT/ETH | CHILD/SPIRIT |
|-----------|------------|--------------|
| Fee | 1% (10,000) | 1% (10,000) |
| Tick Spacing | 200 | 200 |
| Initial Tick | 184,200 | Provided at creation |
| Hooks | None | None |

### 6.2 Single-Sided Liquidity

The protocol uses single-sided liquidity provision:

```
┌────────────────────────────────────────────────────────────────┐
│              SINGLE-SIDED LIQUIDITY PROVISION                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   For SPIRIT/ETH pool:                                         │
│   - 250M SPIRIT deposited single-sided                         │
│   - Position minted from current tick to MAX_TICK              │
│   - Position sent to treasury                                  │
│                                                                │
│   For CHILD/SPIRIT pools:                                      │
│   - 250M CHILD deposited single-sided                          │
│   - Position minted from current tick to MAX_TICK (or MIN)     │
│   - Position sent to admin (SpiritFactory caller)              │
│                                                                │
│   Currency ordering:                                           │
│   - currency0 = lower address                                  │
│   - currency1 = higher address                                 │
│   - Tick direction depends on which token is currency0         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.3 Permit2 Integration

All Uniswap V4 interactions use Permit2 for token approvals:

```solidity
function _approvePermit2(address childToken, uint256 amount) internal {
    ISuperToken(childToken).approve(address(PERMIT2), amount);
    IPermit2(PERMIT2).approve(
        childToken,
        address(POSITION_MANAGER),
        uint160(amount),
        uint48(block.timestamp + 60)
    );
}
```

---

## 7. Airstream Distribution

### 7.1 Overview

Each CHILD token has an associated Airstream for merkle-based token distribution over 52 weeks.

### 7.2 Airstream Configuration

| Parameter | Value |
|-----------|-------|
| `totalAmount` | 250,000,000 CHILD |
| `duration` | 52 weeks |
| `claimingWindow.startDate` | Creation timestamp |
| `claimingWindow.duration` | 52 weeks |
| `claimingWindow.treasury` | Admin (caller) |
| `initialRewardPPM` | 0 |
| `feePPM` | 0 |

### 7.3 Airstream Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                    AIRSTREAM LIFECYCLE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. CREATION                                                   │
│     SpiritFactory.createChild() deploys Airstream              │
│     - Merkle root provided at creation                         │
│     - 250M CHILD approved and transferred                      │
│     - AirstreamController stored in factory mapping            │
│                                                                │
│  2. CLAIMING (52 weeks)                                        │
│     Users with valid merkle proofs can claim                   │
│     - Claims stream over remaining duration                    │
│     - Early claimers get longer streams                        │
│                                                                │
│  3. TERMINATION (Admin only)                                   │
│     SpiritFactory.terminateAirstream(childToken)               │
│     - Pauses airstream                                         │
│     - Withdraws remaining tokens                               │
│     - Transfers to admin                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Access Control

### 8.1 Role Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                      ACCESS CONTROL                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SpiritFactory                                                 │
│  ├── DEFAULT_ADMIN_ROLE (Multisig)                            │
│  │   ├── createChild()                                         │
│  │   ├── terminateAirstream()                                  │
│  │   └── upgradeTo()                                           │
│                                                                │
│  RewardController                                              │
│  ├── DEFAULT_ADMIN_ROLE (Multisig)                            │
│  │   └── upgradeTo()                                           │
│  ├── FACTORY_ROLE (SpiritFactory)                             │
│  │   └── setStakingPool()                                      │
│  └── DISTRIBUTOR_ROLE (Multisig/Bot)                          │
│      ├── distributeRewards()                                   │
│      └── terminateDistribution()                               │
│                                                                │
│  StakingPool                                                   │
│  └── onlyRewardController                                      │
│      ├── refreshDistributionFlow()                             │
│      └── terminateDistributionFlow()                           │
│                                                                │
│  SpiritVestingFactory                                          │
│  └── onlyTreasury                                              │
│      ├── createSpiritVestingContract()                         │
│      └── setTreasury()                                         │
│                                                                │
│  SpiritVesting                                                 │
│  └── onlyAdmin (reads treasury from factory)                   │
│      └── cancelVesting()                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Role Assignments

| Role | Assigned To | Purpose |
|------|-------------|---------|
| DEFAULT_ADMIN_ROLE | Multisig | Protocol governance |
| FACTORY_ROLE | SpiritFactory proxy | Register staking pools |
| DISTRIBUTOR_ROLE | Multisig or automation bot | Distribute rewards |
| Treasury | Multisig | Vesting management |

---

## 9. Data Flow Diagrams

### 9.1 Child Token Creation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                  CHILD TOKEN CREATION FLOW                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Admin (Multisig)                                              │
│       │                                                        │
│       │ createChild(name, symbol, artist, agent, merkle, ...)  │
│       ▼                                                        │
│  ┌─────────────┐                                               │
│  │SpiritFactory│                                               │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ├──► 1. Deploy ChildSuperToken (1B supply to factory)  │
│         │                                                      │
│         ├──► 2. Deploy StakingPool (BeaconProxy)               │
│         │       └── Initialize with artist + agent stakes      │
│         │       └── 250M each, 52-week lock                    │
│         │                                                      │
│         ├──► 3. Register StakingPool in RewardController       │
│         │                                                      │
│         ├──► 4. Create Uniswap V4 pool (CHILD/SPIRIT)          │
│         │       └── Initialize at provided sqrtPriceX96        │
│         │       └── Mint single-sided 250M CHILD position      │
│         │                                                      │
│         ├──► 5. Create Airstream (250M over 52 weeks)          │
│         │       └── Merkle root for claim eligibility          │
│         │                                                      │
│         └──► 6. Transfer any remaining balance to admin        │
│                                                                │
│  Emits: ChildTokenCreated(child, stakingPool, artist, agent)   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Reward Distribution Flow

```
┌────────────────────────────────────────────────────────────────┐
│                  REWARD DISTRIBUTION FLOW                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Distributor (Bot/Multisig)                                    │
│       │                                                        │
│       │ 1. SPIRIT.approve(rewardController, amount)            │
│       │ 2. distributeRewards(childAddress, amount)             │
│       ▼                                                        │
│  ┌────────────────┐                                            │
│  │RewardController│                                            │
│  └───────┬────────┘                                            │
│          │                                                     │
│          │ SPIRIT.transferFrom(distributor, stakingPool)       │
│          │ stakingPool.refreshDistributionFlow()               │
│          ▼                                                     │
│  ┌────────────────┐                                            │
│  │  StakingPool   │                                            │
│  └───────┬────────┘                                            │
│          │                                                     │
│          │ flowRate = balance / STREAM_OUT_DURATION            │
│          │ SPIRIT.distributeFlow(pool, flowRate)               │
│          ▼                                                     │
│  ┌────────────────────────────────────────┐                   │
│  │         Superfluid GDA Pool            │                   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐        │                   │
│  │  │Staker1│ │Staker2│ │Staker3│ ...    │                   │
│  │  │  100  │ │  200  │ │  50   │ units  │                   │
│  │  └───┬───┘ └───┬───┘ └───┬───┘        │                   │
│  │      │         │         │             │                   │
│  │      ▼         ▼         ▼             │                   │
│  │   28.6%     57.1%     14.3% of flow    │                   │
│  └────────────────────────────────────────┘                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 9.3 Staking User Journey

```
┌────────────────────────────────────────────────────────────────┐
│                    STAKING USER JOURNEY                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  User                                                          │
│    │                                                           │
│    │ 1. Acquire CHILD tokens (buy on Uniswap or claim Airstr) │
│    │                                                           │
│    │ 2. CHILD.approve(stakingPool, amount)                     │
│    │                                                           │
│    │ 3. stakingPool.stake(amount, lockingPeriod)               │
│    │    └── Calculates multiplier based on lock period         │
│    │    └── units = (amount * multiplier) / (10000 * 1e18)     │
│    │    └── Updates GDA pool member units                      │
│    │    └── Transfers CHILD to staking pool                    │
│    │                                                           │
│    │ 4. [OPTIONAL] stakingPool.increaseStake(additionalAmount) │
│    │    └── Must already have active stake                     │
│    │    └── Uses current remaining lock period multiplier      │
│    │                                                           │
│    │ 5. [AFTER LOCK EXPIRES] stakingPool.extendLockingPeriod() │
│    │    └── Can only extend after lock expires                 │
│    │    └── Gets new multiplier for new period                 │
│    │                                                           │
│    │ 6. [AFTER LOCK EXPIRES] stakingPool.unstake(amount)       │
│    │    └── Proportionally reduces units                       │
│    │    └── Returns CHILD tokens                               │
│    │                                                           │
│    │ Throughout: Continuously receive SPIRIT via Superfluid    │
│    ▼                                                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 10. Contract Constants Reference

### 10.1 SpiritFactory Constants

```solidity
uint256 public constant CHILD_TOTAL_SUPPLY = 1_000_000_000 ether;     // 1B
uint256 public constant DEFAULT_LIQUIDITY_SUPPLY = 250_000_000 ether; // 250M
uint96 public constant AIRSTREAM_SUPPLY = 250_000_000 ether;          // 250M
uint64 public constant AIRSTREAM_DURATION = 52 weeks;                  // 1 year
uint24 public constant DEFAULT_POOL_FEE = 10_000;                      // 1%
int24 public constant DEFAULT_TICK_SPACING = 200;
```

### 10.2 StakingPool Constants

```solidity
uint256 public constant MINIMUM_STAKE_AMOUNT = 1 ether;                // 1 CHILD
uint256 public constant MINIMUM_LOCKING_PERIOD = 1 weeks;
uint256 public constant MAXIMUM_LOCKING_PERIOD = 156 weeks;            // 3 years
uint256 public constant STREAM_OUT_DURATION = 1 weeks;
uint256 public constant MIN_MULTIPLIER = 10_000;                       // 1x
uint256 public constant MAX_MULTIPLIER = 360_000;                      // 36x
uint256 public constant MULTIPLIER_RANGE = 350_000;                    // 36x - 1x
uint256 public constant TIME_RANGE = 155 weeks;                        // 156 - 1
uint256 public constant STAKEHOLDER_LOCKING_PERIOD = 52 weeks;         // 1 year
uint256 private constant _STAKEHOLDER_AMOUNT = 250_000_000 ether;      // 250M
uint256 private constant _DOWNSCALER = 1e18;
```

---

## 11. External Dependencies

### 11.1 Superfluid Protocol

| Contract | Address (Base) | Purpose |
|----------|----------------|---------|
| SuperTokenFactory | `0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3` | Create SuperTokens |
| VestingSchedulerV3 | `0x6Bf35A170056eDf9aEba159dce4a640cfCef9312` | Team vesting |
| GDA (via SuperToken) | Internal | Reward distribution |

### 11.2 Uniswap V4

| Contract | Address (Base) | Purpose |
|----------|----------------|---------|
| PoolManager | `0x498581fF718922c3f8e6A244956aF099B2652b2b` | Pool state management |
| PositionManager | `0x7C5f5A4bBd8fD63184577525326123B519429bDc` | LP position management |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Token approvals |

### 11.3 Airstream

| Contract | Address (Base) | Purpose |
|----------|----------------|---------|
| AirstreamFactory | `0xAB82062c4A9E4DF736238bcfA9fea15eb763bf69` | Create airstreams |

---

## Appendix A: Audit Summary

**Auditor**: 0xSimao
**Date**: November 28, 2025
**Report**: [GitHub](https://github.com/0xSimao-audits/reports/blob/main/2025-11-28-spirit-protocol.pdf)

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| C-1 | Critical | Wrong rounding in StakingPool::unstake() | Fixed (PR #5) |
| H-1 | High | SuperTokens vulnerable to frontrunning | Fixed (PR #6) |
| H-2 | High | Uniswap v4 pool initialization frontrun | Fixed (PR #8) |
| M-1 | Medium | SpiritFactory cannot stop Airstream | Fixed (PR #7) |
| L-1 | Low | StakingPool missing rewards end logic | Fixed (PR #4) |
| I-1 | Info | VestingFactory mapping overwrites | Fixed (PR #2) |
| I-2 | Info | setTreasury could be 2-factor | Acknowledged |

All critical, high, and medium severity issues have been resolved.

---

## Appendix B: Contract Addresses (Testnet)

### Ethereum Sepolia

| Contract | Address |
|----------|---------|
| SPIRIT Multisig | `0x3139DB2845810C4DE0727A5D5Aa24146C086eE1A` |
| SPIRIT Token | `0xC280291AD69712e3dbD39965A90BAff1683D2De5` |
| RewardController | `0xdd27Ce16F1B59818c6A4C428F8BDD5d3BA652539` |
| StakingPool Beacon | `0xF66A9999ea07825232CeEa4F75711715934333D1` |
| SpiritFactory | `0x28F0BC53b52208c8286A4C663680C2eD99d18982` |
| SpiritVestingFactory | `0x511cE8Dd17dAa368bEBF7E21CC4E00E1a9510319` |

### Base Sepolia

| Contract | Address |
|----------|---------|
| SPIRIT Multisig | `0x3139DB2845810C4DE0727A5D5Aa24146C086eE1A` |
| SPIRIT Token | `0xc7e9de362C6eA2Cc03863ECe330622146Ff1c18B` |
| RewardController | `0x1390A073a765D0e0D21a382F4F6F0289b69BE33C` |
| StakingPool Beacon | `0x6A96aC9BAF36F8e8b6237eb402d07451217C7540` |
| SpiritFactory | `0x879d67000C938142F472fB8f2ee0b6601E2cE3C6` |
| SpiritVestingFactory | `0x94bea63d6eC10AF980bf8C7aEFeE04665D355AFe` |
