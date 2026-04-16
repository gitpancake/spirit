# Spirit Protocol — Dashboard Wireframes

**Version**: 1.0.0
**Last Updated**: December 9, 2025
**Purpose**: Low-fidelity UI wireframes with contract method mappings

---

## Table of Contents

1. [Information Architecture](#1-information-architecture)
2. [Screen Wireframes](#2-screen-wireframes)
3. [Contract/API Mapping](#3-contractapi-mapping)
4. [MVP vs V2 Scope](#4-mvp-vs-v2-scope)
5. [Superfluid Deeplinks](#5-superfluid-deeplinks)

---

## 1. Information Architecture

### 1.1 Route Structure

```
/                          → Landing (connect wallet CTA)
/dashboard                 → Overview (connected users)
├── /portfolio             → SPIRIT balance, vesting, child tokens
├── /agents                → Browse all registered agents
│   └── /agents/:address   → Single agent detail + staking
├── /staking               → All active stake positions
└── /admin                 → Treasury/factory management (role-gated)
```

### 1.2 User Journeys

**Journey A: SPIRIT Holder**
```
Connect → /dashboard → View SPIRIT balance → Browse /agents → Stake in agent
```

**Journey B: Vesting Recipient**
```
Connect → /portfolio → View vesting schedule → Track cliff/stream progress
```

**Journey C: Staker**
```
Connect → /staking → View all positions → Extend lock / Claim rewards → Unstake
```

**Journey D: Protocol Admin**
```
Connect → /admin → Register new agent → Distribute rewards → Manage treasury
```

### 1.3 The Lizard Brain Loop

The core engagement loop the UI must reinforce:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   HOLD SPIRIT ──► RECEIVE CHILD TOKENS ──► STAKE CHILD ──► EARN    │
│        ▲                                        │                   │
│        └────────────── SPIRIT ◄─────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Screen Wireframes

### 2.1 Dashboard Home (`/dashboard`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  SPIRIT BALANCE  │  │  TOTAL STAKED    │  │  PENDING REWARDS │     │
│  │                  │  │                  │  │                  │     │
│  │  12,450,000      │  │  8,200,000       │  │  45,230          │     │
│  │  SPIRIT          │  │  across 3 agents │  │  SPIRIT          │     │
│  │                  │  │                  │  │                  │     │
│  │  [View Portfolio]│  │  [View Stakes]   │  │  [Claim All]     │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  YOUR AGENT EXPOSURE                                                   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  AGENT         │ STAKED    │ LOCK      │ MULTIPLIER │ REWARDS  │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │  Solienne      │ 5,000,000 │ 52 weeks  │ 18.5×      │ 23,400   │   │
│  │  Abraham       │ 2,200,000 │ 26 weeks  │ 9.2×       │ 15,830   │   │
│  │  Gigabrain     │ 1,000,000 │ 4 weeks   │ 2.1×       │ 6,000    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  [+ Stake in New Agent]                                                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `Spirit.balanceOf(user)` → SPIRIT Balance
- `StakingPool.getStake(user)` for each registered pool → Total Staked
- Superfluid GDA `getMemberFlowRate(user)` → Pending Rewards
- `SpiritFactory.getChildTokens()` → Agent list
- `RewardController.stakingPools(childToken)` → Pool addresses

---

### 2.2 Portfolio (`/portfolio`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│  ◄ Back                                                                │
│                                                                        │
│  MY PORTFOLIO                                                          │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SPIRIT TOKEN                                                    │  │
│  │                                                                  │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │  │
│  │  │  Available  │    │  Vesting    │    │  Staked     │          │  │
│  │  │  4,250,000  │    │  8,000,000  │    │  8,200,000  │          │  │
│  │  │  SPIRIT     │    │  SPIRIT     │    │  SPIRIT     │          │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘          │  │
│  │                                                                  │  │
│  │  Total: 20,450,000 SPIRIT                                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  VESTING SCHEDULE                                               │  │
│  │                                                                  │  │
│  │  Cliff Date:     Jan 1, 2026                                    │  │
│  │  End Date:       Jan 1, 2028                                    │  │
│  │  Cliff Amount:   2,000,000 SPIRIT                               │  │
│  │  Stream Rate:    ~19,230 SPIRIT/week                            │  │
│  │                                                                  │  │
│  │  ████████░░░░░░░░░░░░░░░░░░░░  25% vested                       │  │
│  │                                                                  │  │
│  │  [View on Superfluid Console]                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CHILD TOKEN HOLDINGS                                           │  │
│  │                                                                  │  │
│  │  TOKEN       │ BALANCE     │ SOURCE       │ ACTION              │  │
│  │  ─────────────────────────────────────────────────────────────  │  │
│  │  $SOLIENNE   │ 150,000     │ Airstream    │ [Stake] [Swap]      │  │
│  │  $ABRAHAM    │ 75,000      │ Purchase     │ [Stake] [Swap]      │  │
│  │  $GIGA       │ 25,000      │ Airstream    │ [Stake] [Swap]      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `Spirit.balanceOf(user)` → Available SPIRIT
- `SpiritVestingFactory.balanceOf(user)` → Vesting SPIRIT
- `SpiritVestingFactory.spiritVestings(user)` → Vesting contract address
- `VestingScheduler.getVestingSchedule(...)` → Cliff/end dates
- `ChildToken.balanceOf(user)` for each → Child token balances

---

### 2.3 Agents List (`/agents`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  REGISTERED AGENTS                               [Search: _________]  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  AGENT         │ TOKEN    │ TVL         │ STAKERS │ YOUR STAKE  │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌───┐ Solienne                                                  │  │
│  │  │ S │ $SOLIENNE │ 45.2M    │ 234     │ 5,000,000 ──►          │  │
│  │  └───┘ The autonomous presence                                   │  │
│  │                                                                  │  │
│  │  ┌───┐ Abraham                                                   │  │
│  │  │ A │ $ABRAHAM  │ 32.1M    │ 189     │ 2,200,000 ──►          │  │
│  │  └───┘ Covenant of the autonomous                               │  │
│  │                                                                  │  │
│  │  ┌───┐ Gigabrain                                                 │  │
│  │  │ G │ $GIGA     │ 18.7M    │ 156     │ 1,000,000 ──►          │  │
│  │  └───┘ Agent collective intelligence                            │  │
│  │                                                                  │  │
│  │  ┌───┐ Geppetto                                                  │  │
│  │  │ G │ $GEPPETTO │ 12.4M    │ 98      │ — (not staked) ──►     │  │
│  │  └───┘ Creative production agent                                │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Showing 4 of 12 agents                              [Load More]       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `SpiritFactory.getChildTokens()` → Array of all agents
- `StakingPool.totalStaked()` for each → TVL
- `StakingPool.getStake(user)` for each → User's stake
- GDA pool member count → Stakers count

---

### 2.4 Agent Detail (`/agents/:address`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│  ◄ Back to Agents                                                      │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────┐                                                     │  │
│  │  │         │  SOLIENNE                                           │  │
│  │  │   S     │  $SOLIENNE · 0x7a3d...8f2e                         │  │
│  │  │         │  The autonomous presence                            │  │
│  │  └─────────┘                                                     │  │
│  │                                                                  │  │
│  │  Artist: 0xArtist...  │  Agent: 0xAgent...                      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  TOTAL VALUE     │  │  YOUR STAKE      │  │  PENDING REWARDS │     │
│  │  LOCKED          │  │                  │  │                  │     │
│  │  45,200,000      │  │  5,000,000       │  │  23,400          │     │
│  │  $SOLIENNE       │  │  $SOLIENNE       │  │  SPIRIT          │     │
│  │                  │  │  (18.5× mult)    │  │                  │     │
│  │  234 stakers     │  │  Unlocks: May 1  │  │  +12.5/hour      │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  STAKE $SOLIENNE                                                       │
│                                                                        │
│  Amount: [________________] $SOLIENNE      Balance: 150,000            │
│                                                                        │
│  Lock Period:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 1w    4w    12w    26w    52w    104w    156w                  │   │
│  │  •─────────────────────●───────────────────────                │   │
│  │                       52 weeks                                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Multiplier: 18.5×  │  Projected Weekly Rewards: ~450 SPIRIT          │
│                                                                        │
│  [Approve $SOLIENNE]     [Stake]                                       │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  YOUR POSITION                                                         │
│                                                                        │
│  Staked Amount:     5,000,000 $SOLIENNE                               │
│  Lock End Date:     May 1, 2026 (52 weeks remaining)                  │
│  Current Mult:      18.5×                                              │
│  Units in Pool:     92,500,000                                         │
│                                                                        │
│  [Extend Lock]  [Unstake] (disabled until lock expires)               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `SpiritFactory.childTokens(address)` → Agent metadata
- `StakingPool.totalStaked()` → TVL
- `StakingPool.getStake(user)` → User position
- `StakingPool.calculateMultiplier(lockPeriod)` → Preview multiplier
- `StakingPool.calculateUnits(amount, lockPeriod)` → Preview units
- `ChildToken.balanceOf(user)` → Available to stake
- `ChildToken.approve(stakingPool, amount)` → Approval
- `StakingPool.stake(amount, lockPeriod)` → Stake action
- `StakingPool.extendLock(newPeriod)` → Extend lock
- `StakingPool.unstake()` → Withdraw after lock

---

### 2.5 Staking Overview (`/staking`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  MY STAKING POSITIONS                                                  │
│                                                                        │
│  Total Staked Value: 8,200,000 tokens across 3 agents                 │
│  Total Pending Rewards: 45,230 SPIRIT                                 │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  SOLIENNE                                              [Manage]  │  │
│  │  ───────────────────────────────────────────────────────────    │  │
│  │  Staked:      5,000,000 $SOLIENNE                               │  │
│  │  Lock:        52 weeks (ends May 1, 2026)                       │  │
│  │  Multiplier:  18.5×                                              │  │
│  │  Rewards:     23,400 SPIRIT pending (+12.5/hr)                  │  │
│  │  Status:      ████████████████████░░░░  78% of lock complete    │  │
│  │                                                                  │  │
│  │  ABRAHAM                                               [Manage]  │  │
│  │  ───────────────────────────────────────────────────────────    │  │
│  │  Staked:      2,200,000 $ABRAHAM                                │  │
│  │  Lock:        26 weeks (ends Feb 15, 2026)                      │  │
│  │  Multiplier:  9.2×                                               │  │
│  │  Rewards:     15,830 SPIRIT pending (+8.2/hr)                   │  │
│  │  Status:      ██████████░░░░░░░░░░░░░░  42% of lock complete    │  │
│  │                                                                  │  │
│  │  GIGABRAIN                                             [Manage]  │  │
│  │  ───────────────────────────────────────────────────────────    │  │
│  │  Staked:      1,000,000 $GIGA                                   │  │
│  │  Lock:        4 weeks (ends Dec 20, 2025)                       │  │
│  │  Multiplier:  2.1×                                               │  │
│  │  Rewards:     6,000 SPIRIT pending (+3.1/hr)                    │  │
│  │  Status:      ████████████████████████  UNLOCKED - Can Unstake  │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [Claim All Rewards]                                                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `SpiritFactory.getChildTokens()` → All agents
- `RewardController.stakingPools(childToken)` → Pool for each agent
- `StakingPool.getStake(user)` for each → Position details
- GDA pool `getMemberFlowRate(user)` → Reward rate
- GDA pool `getClaimable(user)` → Pending rewards

---

### 2.6 Admin Panel (`/admin`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SPIRIT PROTOCOL                                    [0x1234...5678] ▼  │
├────────────────────────────────────────────────────────────────────────┤
│  ⚠️  ADMIN PANEL — Requires DEFAULT_ADMIN_ROLE                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  REGISTER NEW AGENT                                              │ │
│  │                                                                  │ │
│  │  Token Name:        [________________________]                   │ │
│  │  Token Symbol:      [________]                                   │ │
│  │  Artist Address:    [0x____________________________________]    │ │
│  │  Agent Address:     [0x____________________________________]    │ │
│  │  Merkle Root:       [0x____________________________________]    │ │
│  │  Salt:              [0x____________________________________]    │ │
│  │  Initial Price:     [________________] SPIRIT per token         │ │
│  │                                                                  │ │
│  │  Special Allocation (optional):                                 │ │
│  │  Admin Tokens:      [________________] (max 250M)               │ │
│  │                                                                  │ │
│  │  [Preview Deployment]    [Create Agent Token]                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  DISTRIBUTE REWARDS                                              │ │
│  │                                                                  │ │
│  │  Select Agent:      [Solienne ▼]                                │ │
│  │  Amount:            [________________] SPIRIT                   │ │
│  │  Distributor Balance: 10,000,000 SPIRIT                         │ │
│  │                                                                  │ │
│  │  [Approve SPIRIT]    [Distribute]                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  VESTING MANAGEMENT                                              │ │
│  │                                                                  │ │
│  │  Create Vesting Schedule:                                       │ │
│  │  Recipient:         [0x____________________________________]    │ │
│  │  Total Amount:      [________________] SPIRIT                   │ │
│  │  Cliff Amount:      [________________] SPIRIT                   │ │
│  │  Cliff Date:        [YYYY-MM-DD]                                │ │
│  │  End Date:          [YYYY-MM-DD]                                │ │
│  │                                                                  │ │
│  │  [Create Vesting Contract]                                      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  TREASURY STATUS                                                 │ │
│  │                                                                  │ │
│  │  SPIRIT Balance:    750,000,000                                 │ │
│  │  LP Position:       250,000,000 (Uniswap V4)                    │ │
│  │  Active Vestings:   15 schedules                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Contract Calls:**
- `RewardController.hasRole(ADMIN_ROLE, user)` → Access check
- `SpiritFactory.createChild(...)` → Register agent
- `RewardController.distributeRewards(childToken, amount)` → Send rewards
- `SpiritVestingFactory.createSpiritVestingContract(...)` → Create vesting
- `Spirit.balanceOf(treasury)` → Treasury balance

---

## 3. Contract/API Mapping

### 3.1 Read Methods (View Functions)

| Screen | Contract | Method | Return Type | Purpose |
|--------|----------|--------|-------------|---------|
| Dashboard | Spirit | `balanceOf(address)` | uint256 | SPIRIT balance |
| Dashboard | Spirit | `totalSupply()` | uint256 | Total supply stats |
| Dashboard | SpiritFactory | `getChildTokens()` | ChildToken[] | All agents list |
| Dashboard | RewardController | `stakingPools(address)` | address | Pool for agent |
| Portfolio | SpiritVestingFactory | `balanceOf(address)` | uint256 | Unvested balance |
| Portfolio | SpiritVestingFactory | `spiritVestings(address)` | address | Vesting contract |
| Portfolio | ChildToken | `balanceOf(address)` | uint256 | Child token balance |
| Agent Detail | StakingPool | `getStake(address)` | Stake struct | User's position |
| Agent Detail | StakingPool | `totalStaked()` | uint256 | Pool TVL |
| Agent Detail | StakingPool | `calculateMultiplier(uint256)` | uint256 | Lock → multiplier |
| Agent Detail | StakingPool | `calculateUnits(uint256,uint256)` | uint256 | Preview units |
| Agent Detail | StakingPool | `distributionPool()` | address | GDA pool |
| Staking | GDA Pool | `getUnits(address)` | uint256 | User's units |
| Staking | GDA Pool | `getMemberFlowRate(address)` | int96 | Reward rate |
| Admin | RewardController | `hasRole(bytes32,address)` | bool | Role check |

### 3.2 Write Methods (State-Changing)

| Screen | Contract | Method | Parameters | Gas Est. |
|--------|----------|--------|------------|----------|
| Agent Detail | ChildToken | `approve(address,uint256)` | spender, amount | 45K |
| Agent Detail | StakingPool | `stake(uint256,uint256)` | amount, lockPeriod | 200K |
| Agent Detail | StakingPool | `increaseStake(uint256)` | amount | 150K |
| Agent Detail | StakingPool | `extendLock(uint256)` | newLockPeriod | 80K |
| Agent Detail | StakingPool | `unstake()` | — | 180K |
| Admin | SpiritFactory | `createChild(...)` | 8 params | 3M |
| Admin | RewardController | `distributeRewards(address,uint256)` | childToken, amount | 200K |
| Admin | SpiritVestingFactory | `createSpiritVestingContract(...)` | 5 params | 500K |
| Admin | SpiritVesting | `cancelVesting()` | — | 150K |

### 3.3 Events to Monitor

```solidity
// StakingPool
event Staked(address indexed staker, uint256 amount, uint256 lockingPeriod);
event IncreasedStake(address indexed staker, uint256 amount);
event ExtendedLockingPeriod(address indexed staker, uint256 lockEndDate);
event Unstaked(address indexed staker, uint256 amount);

// SpiritFactory
event ChildTokenCreated(
    address indexed child,
    address indexed stakingPool,
    address indexed artist,
    address agent,
    bytes32 merkleRoot
);

// RewardController
event RewardsDistributed(address indexed child, uint256 amount);
event DistributionTerminated(address indexed child);
event StakingPoolCreated(address indexed child, address indexed stakingPool);

// SpiritVestingFactory
event SpiritVestingCreated(address indexed recipient, address vestingContract);
event Transfer(address indexed from, address indexed to, uint256 value);

// SpiritVesting
event VestingDeleted(uint256 amount);
```

---

## 4. MVP vs V2 Scope

### 4.1 MVP (Launch)

**Must Have:**
- [ ] Wallet connection (wagmi + RainbowKit)
- [ ] SPIRIT balance display
- [ ] Agent list with TVL
- [ ] Single stake action per agent
- [ ] Unstake action (when unlocked)
- [ ] Vesting balance display (read-only)

**Nice to Have:**
- [ ] Extend lock functionality
- [ ] Increase stake functionality
- [ ] Real-time reward flow display
- [ ] Admin panel (basic)

**Explicitly Excluded:**
- Historical charts
- Multi-position batch operations
- Reward claim tracking UI
- Governance voting
- DEX integration (swaps)

### 4.2 V2 (Post-Launch)

**Phase 2.1 — Enhanced Staking:**
- [ ] Batch unstake all positions
- [ ] Optimal lock period calculator
- [ ] APY estimates based on historical data
- [ ] Position comparison tool

**Phase 2.2 — Reward Tracking:**
- [ ] Claim history log
- [ ] Reward accumulation charts
- [ ] Per-agent reward breakdown
- [ ] Export to CSV

**Phase 2.3 — Governance:**
- [ ] Proposal viewing
- [ ] Vote with staked tokens
- [ ] Delegation UI
- [ ] Governance analytics

**Phase 2.4 — DEX Integration:**
- [ ] Swap SPIRIT ↔ Child tokens
- [ ] LP position management
- [ ] Price charts
- [ ] Trade history

---

## 5. Superfluid Deeplinks

### 5.1 Console Links

```
# View GDA Pool
https://console.superfluid.finance/base-mainnet/pool/{GDA_POOL_ADDRESS}

# View User Streams
https://console.superfluid.finance/base-mainnet/accounts/{USER_ADDRESS}

# View Token
https://console.superfluid.finance/base-mainnet/supertokens/{TOKEN_ADDRESS}
```

### 5.2 API Endpoints

```
# Subgraph (Base Mainnet)
https://base-mainnet.subgraph.x.superfluid.dev/

# Example Query: Get user's GDA memberships
query {
  account(id: "{USER_ADDRESS}") {
    poolMemberships {
      pool {
        id
        totalUnits
      }
      units
    }
  }
}
```

### 5.3 Real-Time Updates

Use Superfluid SDK for real-time balance updates:

```typescript
import { Framework } from "@superfluid-finance/sdk-core";

const sf = await Framework.create({
  chainId: 8453,
  provider: ethersProvider,
});

// Get real-time balance
const balance = await sf.realTimeBalance({
  superToken: SPIRIT_ADDRESS,
  account: userAddress,
});

// Subscribe to flow updates
const poolMember = await sf.loadPoolMember({
  pool: GDA_POOL_ADDRESS,
  member: userAddress,
});
const flowRate = poolMember.flowRate;
```

---

## Appendix: Component Library

### A.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ | App router, server components |
| Wallet | wagmi v2 + RainbowKit | Standard, well-maintained |
| State | TanStack Query | Cache, refetch, real-time |
| Styling | Tailwind CSS | Spirit design system compatibility |
| Charts | Recharts | Simple, React-native |
| Forms | React Hook Form + Zod | Type-safe validation |

### A.2 Key npm Packages

```json
{
  "dependencies": {
    "@superfluid-finance/sdk-core": "^0.7.0",
    "@uniswap/v4-sdk": "^1.0.0",
    "wagmi": "^2.0.0",
    "@rainbow-me/rainbowkit": "^2.0.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### A.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_ALCHEMY_ID=...  # or Infura

# Contract addresses (from deployment)
NEXT_PUBLIC_SPIRIT_TOKEN=0x...
NEXT_PUBLIC_SPIRIT_FACTORY=0x...
NEXT_PUBLIC_REWARD_CONTROLLER=0x...
NEXT_PUBLIC_VESTING_FACTORY=0x...
```
