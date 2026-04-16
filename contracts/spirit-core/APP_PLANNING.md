# app.spiritprotocol.io - MVP Planning

**Created:** December 14, 2025
**Target Launch:** January 15, 2026 (TGE)
**Phase 2 Build Window:** December 21-28, 2025
**Status:** PLANNING (Phase 1 blockers must complete first)

---

## Executive Summary

`app.spiritprotocol.io` is the user-facing dashboard for Spirit Protocol token holders. The Jan 15 MVP is **view-only** - no transactions, just displaying on-chain data.

**MVP Scope:**
1. View staking positions across agent pools
2. View vesting schedules (cliff, stream, claimable)
3. View agent airstream allocations
4. Wallet connection (read-only)

**NOT in MVP:**
- Staking/unstaking transactions
- Claiming vested tokens
- Claiming airstream allocations
- Admin functions

---

## Architecture Decisions

### Framework: Next.js 14 (App Router)

**Why Next.js:**
- Server components for SEO and fast initial load
- App Router for modern routing patterns
- Same stack as solienne.ai (team familiarity)
- Vercel deployment (consistent with spiritprotocol.io)

**Why NOT Vite/React:**
- No SSR out of box
- Need manual routing setup

### Wallet Connection: RainbowKit + wagmi + viem

**Why this stack:**
- RainbowKit: Beautiful wallet modal, multi-wallet support
- wagmi: React hooks for Ethereum, type-safe
- viem: Modern, tree-shakeable, used by wagmi v2
- All three are industry standard for Base apps

### Styling: Tailwind CSS + shadcn/ui

**Why:**
- Matches Spirit Protocol design system (used in spiritprotocol.io)
- shadcn/ui components are unstyled, easy to customize
- Fast iteration for MVP

### Data Fetching: On-chain reads via wagmi hooks

**Why NOT a backend/indexer:**
- MVP is view-only, contract reads are fast
- No historical data needed for v1
- Reduces complexity and cost
- Can add The Graph or custom indexer post-TGE if needed

---

## Contract Addresses (Base Sepolia Testnet)

```typescript
export const contracts = {
  spiritToken: '0xc7e9de362C6eA2Cc03863ECe330622146Ff1c18B',
  rewardController: '0x1390A073a765D0e0D21a382F4F6F0289b69BE33C',
  stakingPoolBeacon: '0x6A96aC9BAF36F8e8b6237eb402d07451217C7540',
  spiritFactory: '0x879d67000C938142F472fB8f2ee0b6601E2cE3C6',
  vestingFactory: '0x94bea63d6eC10AF980bf8C7aEFeE04665D355AFe',
} as const;

// Mainnet addresses TBD at TGE
```

---

## Data Structures to Display

### 1. Staking Position (per agent pool)

**Contract:** `StakingPool.sol`
**Method:** `getStakingInfo(address staker) returns (StakingInfo)`

```typescript
interface StakingInfo {
  stakedAmount: bigint;  // SPIRIT tokens staked
  lockedUntil: bigint;   // Unix timestamp
}

// Derived values to calculate in UI:
interface StakingDisplay {
  stakedAmount: string;       // Formatted (e.g., "10,000 SPIRIT")
  lockedUntil: Date;          // Formatted date
  timeRemaining: string;      // e.g., "45 days"
  multiplier: number;         // 1x to 36x based on lock duration
  isUnlocked: boolean;        // Can unstake?
  childToken: string;         // Agent token symbol
}
```

**Additional reads needed:**
- `calculateMultiplier(lockingPeriod)` - get multiplier for display
- `child()` - get child token address for agent identification

### 2. Vesting Schedule

**Contract:** `SpiritVestingFactory.sol`
**Methods:**
- `spiritVestings(address recipient) returns (address vestingContract)`
- `balanceOf(address vestingReceiver) returns (uint256 unvestedBalance)`

**From SpiritVesting contract (need to read):**
- Cliff date, end date, flow rate, cliff amount

```typescript
interface VestingDisplay {
  totalAllocation: string;    // Original allocation
  unvestedBalance: string;    // Still locked
  cliffDate: Date;            // When 20% unlocks
  cliffAmount: string;        // 20% amount
  endDate: Date;              // Full vest date
  claimableNow: string;       // What can be claimed today
  streamRate: string;         // Monthly rate after cliff
  percentVested: number;      // Progress bar
}
```

### 3. Agent Airstream

**Contract:** `IAirstream` (address from SpiritFactory events)
**Methods:**
- `getAllocation(address account) returns (uint256)` - merkle allocation
- `flowRate()` - current distribution rate
- `distributionToken()` - child token being streamed

```typescript
interface AirstreamDisplay {
  agentName: string;          // e.g., "SOLIENNE"
  allocation: string;         // Your allocation
  claimed: string;            // Already claimed
  claimable: string;          // Can claim now
  streamRate: string;         // Per-second rate
  endDate: Date;              // 52 weeks from launch
  percentComplete: number;    // Progress
}
```

---

## Project Structure

```
app.spiritprotocol.io/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Dashboard home
│   │   ├── staking/
│   │   │   └── page.tsx         # Staking positions view
│   │   ├── vesting/
│   │   │   └── page.tsx         # Vesting schedule view
│   │   └── airstreams/
│   │       └── page.tsx         # Agent airstreams view
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Wallet connect, nav
│   │   │   ├── Sidebar.tsx      # Navigation
│   │   │   └── Footer.tsx
│   │   ├── wallet/
│   │   │   └── ConnectButton.tsx
│   │   ├── staking/
│   │   │   ├── StakingCard.tsx          # Single position
│   │   │   ├── StakingGrid.tsx          # All positions
│   │   │   └── MultiplierBadge.tsx      # 1x-36x display
│   │   ├── vesting/
│   │   │   ├── VestingCard.tsx          # Schedule display
│   │   │   ├── VestingTimeline.tsx      # Visual timeline
│   │   │   └── ClaimableAmount.tsx      # Current claimable
│   │   └── airstreams/
│   │       ├── AirstreamCard.tsx        # Single agent stream
│   │       ├── AirstreamList.tsx        # All agent streams
│   │       └── StreamProgress.tsx       # 52-week progress
│   │
│   ├── lib/
│   │   ├── wagmi.ts             # wagmi config
│   │   ├── contracts.ts         # Contract addresses + ABIs
│   │   ├── utils.ts             # Formatters, helpers
│   │   └── constants.ts         # Chain config, etc.
│   │
│   ├── hooks/
│   │   ├── useStakingPosition.ts
│   │   ├── useVestingSchedule.ts
│   │   ├── useAirstreams.ts
│   │   └── useAgents.ts         # Get all launched agents
│   │
│   └── config/
│       ├── agents.json          # Known agent metadata
│       └── tokenomics.json      # From spirit-contracts-core
│
├── public/
│   └── icons/                   # Agent logos, token icons
│
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local                   # RPC URLs, WalletConnect ID
```

---

## Pages & Components

### 1. Dashboard Home (`/`)

**Purpose:** Overview of user's Spirit Protocol holdings

**Displays:**
- Wallet connection status
- Total SPIRIT balance (wallet + staked + vesting)
- Quick stats: total staked, total vesting, active airstreams
- Links to detailed views

**Components:**
- `<WalletSummary />` - SPIRIT balance breakdown
- `<QuickStats />` - Key metrics cards
- `<RecentActivity />` - (v2: recent claims, stakes)

### 2. Staking View (`/staking`)

**Purpose:** View all staking positions across agent pools

**Displays:**
- List of agent pools with user's position in each
- For each position: staked amount, lock end, multiplier
- Empty state if not staked anywhere

**Components:**
- `<StakingGrid />` - Grid of `<StakingCard />`
- `<StakingCard />` - Single agent pool position
- `<MultiplierBadge />` - Visual 1x-36x indicator
- `<LockCountdown />` - Time until unlock

### 3. Vesting View (`/vesting`)

**Purpose:** View token vesting schedule

**Displays:**
- Total allocation
- Cliff date + amount (20%)
- Linear stream (80% over 36 months)
- Current claimable amount
- Visual timeline

**Components:**
- `<VestingCard />` - Main schedule display
- `<VestingTimeline />` - Visual timeline (cliff → end)
- `<ClaimableAmount />` - Real-time claimable (updates)
- `<VestingBreakdown />` - Table of milestones

### 4. Airstreams View (`/airstreams`)

**Purpose:** View agent token airstream allocations

**Displays:**
- List of agents user has allocations in
- For each: allocation, claimed, claimable, stream rate
- 52-week progress indicator

**Components:**
- `<AirstreamList />` - List of `<AirstreamCard />`
- `<AirstreamCard />` - Single agent airstream
- `<StreamProgress />` - 52-week progress bar
- `<AgentInfo />` - Agent name, logo, token symbol

---

## Data Flow

```
User connects wallet
        │
        ▼
┌───────────────────┐
│  wagmi/RainbowKit │
│  (wallet address) │
└────────┬──────────┘
         │
         ▼
┌───────────────────────────────────────────────────┐
│              Contract Reads (parallel)             │
├───────────────────────────────────────────────────┤
│ 1. SpiritToken.balanceOf(address)                 │
│ 2. VestingFactory.spiritVestings(address)         │
│ 3. VestingFactory.balanceOf(address)              │
│ 4. For each agent pool:                           │
│    - StakingPool.getStakingInfo(address)          │
│ 5. For each airstream:                            │
│    - Airstream.getAllocation(address)             │
└────────┬──────────────────────────────────────────┘
         │
         ▼
┌───────────────────┐
│  React Components │
│  (format & display)│
└───────────────────┘
```

---

## Implementation Phases

### Phase 2A: Project Setup (Dec 21-22)

**Goal:** Scaffold project, configure tooling

- [ ] Create Next.js 14 project with App Router
- [ ] Install dependencies: wagmi, viem, @rainbow-me/rainbowkit
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Configure wagmi for Base Sepolia
- [ ] Set up WalletConnect project ID
- [ ] Create basic layout (Header, Sidebar)
- [ ] Deploy to Vercel (preview)

**Commands:**
```bash
npx create-next-app@latest app.spiritprotocol.io --typescript --tailwind --app --src-dir
cd app.spiritprotocol.io
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
npx shadcn-ui@latest init
```

### Phase 2B: Contract Integration (Dec 23-24)

**Goal:** Wire up contract reads

- [ ] Create contract config (addresses + ABIs)
- [ ] Copy ABIs from spirit-contracts-core/out/
- [ ] Create custom hooks:
  - `useStakingPosition(poolAddress, userAddress)`
  - `useVestingSchedule(userAddress)`
  - `useAirstreams(userAddress)`
- [ ] Test reads against Base Sepolia
- [ ] Add loading/error states

### Phase 2C: UI Components (Dec 25-27)

**Goal:** Build display components

- [ ] Dashboard home page
- [ ] Staking positions grid
- [ ] Vesting timeline
- [ ] Airstream cards
- [ ] Mobile responsive
- [ ] Empty states (no wallet, no positions)

### Phase 2D: Polish & Deploy (Dec 28)

**Goal:** Production ready

- [ ] Add agent metadata (names, logos)
- [ ] Verify all testnet reads work
- [ ] Connect custom domain (app.spiritprotocol.io)
- [ ] Test on mobile
- [ ] Documentation

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0",
    "@rainbow-me/rainbowkit": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_ALCHEMY_KEY=xxx  # or Infura
NEXT_PUBLIC_CHAIN_ID=84532   # Base Sepolia (change to 8453 for mainnet)
```

---

## ABIs Needed

From `spirit-contracts-core/out/`:

1. **IStakingPool.sol/IStakingPool.json**
   - `getStakingInfo(address)`
   - `calculateMultiplier(uint256)`
   - `child()`
   - `SPIRIT()`

2. **ISpiritVestingFactory.sol/ISpiritVestingFactory.json**
   - `spiritVestings(address)`
   - `balanceOf(address)`

3. **ISpiritVesting.sol/ISpiritVesting.json**
   - (read vesting params - may need SpiritVesting.sol ABI)

4. **IAirstream.sol/IAirstream.json**
   - `getAllocation(address)`
   - `flowRate()`
   - `distributionToken()`
   - `pool()`

5. **ISpiritFactory.sol/ISpiritFactory.json**
   - Events: `ChildTokenCreated`
   - (for discovering agent pools)

6. **ISuperToken (Superfluid)**
   - `balanceOf(address)`
   - Standard ERC20 interface

---

## Open Questions

### Must Answer Before Build:

1. **How to discover agent pools?**
   - Option A: Hardcode known pools in config
   - Option B: Index `ChildTokenCreated` events from factory
   - **Recommendation:** Start with hardcoded for MVP, add indexing later

2. **How to get vesting contract details?**
   - VestingFactory only stores address mapping
   - Need to read from individual SpiritVesting contract
   - **Recommendation:** Read directly from Superfluid VestingSchedulerV3

3. **Agent metadata storage?**
   - Agent names, logos, descriptions
   - **Recommendation:** Static JSON in repo for MVP, IPFS later

4. **Network switching?**
   - Testnet (Sepolia) vs Mainnet (Base)
   - **Recommendation:** Environment variable, default to mainnet post-TGE

### Nice to Have (Post-MVP):

- Historical staking data (requires indexer)
- Transaction notifications
- Email alerts for unlock dates
- Portfolio value in USD

---

## Blockers (Must Complete Before Build)

From SPIRIT_COMMAND_CENTER.md Phase 1:

- [ ] **Address collection outreach** - Need vesting recipients to test
- [ ] **Multisig setup** - Admin/Treasury safes for contract config
- [ ] **Config files in spiritprotocol.io** - agents.json, tokenomics.json
- [ ] **Pierre confirmation** - 36x multiplier, airstream duration

---

## Reference

- **Contract source:** `/Users/seth/spirit-contracts-core/`
- **Tokenomics:** `/Users/seth/spirit-contracts-core/SPIRIT_TOKENOMICS.md`
- **Command center:** `/Users/seth/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md`
- **Staking guide:** `/Users/seth/spirit-contracts-core/docs/SPIRIT_STAKING_EXPLAINED.md`
- **spiritprotocol.io (marketing):** `/Users/seth/spiritprotocol.io/`

---

## Success Criteria (Jan 15 TGE)

**MVP Must Have:**
- [ ] User can connect wallet
- [ ] User sees SPIRIT balance
- [ ] User sees staking positions (if any)
- [ ] User sees vesting schedule (if recipient)
- [ ] User sees airstream allocations (if any)
- [ ] Works on desktop and mobile
- [ ] Deployed to app.spiritprotocol.io

**Nice to Have:**
- [ ] Real-time updates (Superfluid streams)
- [ ] Dark mode
- [ ] Transaction history

---

*Generated: December 14, 2025*
*Next review: December 21, 2025 (Phase 2 kickoff)*
