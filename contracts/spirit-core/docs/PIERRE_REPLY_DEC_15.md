# Reply to Pierre - December 15, 2025

**For:** @pilou0x
**Re:** Token split, testnet, and follow-up questions

---

Hey Pierre,

Thanks for the detailed clarifications. Very helpful. Quick summary of what I've incorporated:

**Confirmed:**
- ✅ Multiplier scale: 1w=1x, 52w=12x, 156w=36x (updated our docs)
- ✅ Vesting: Using SpiritVesting & SpiritVestingFactory (no ad-hoc)
- ✅ Staking optional for non-Agent/Artist holders

**Outstanding questions:**

## 1. Token Split Modification

We need to adjust the child token distribution to include a **Platform allocation** (for training/infra providers). Proposed split:

| Recipient | Current | Proposed |
|-----------|---------|----------|
| Platform (Eden initially) | 0% | **25%** |
| Artist (staked 52w) | 25% | 25% |
| Agent (staked 52w) | 25% | **20%** |
| Airstream to SPIRIT | 25% | 25% |
| LP | 25% | **5%** |

Key changes:
- Add 25% Platform allocation (Eden for first 10 agents, opens to other platforms later)
- Reduce Agent from 25% → 20%
- Reduce LP from 25% → 5%

**Question:** What contract changes are required? Is this feasible before Jan 15 TGE?

## 2. Testnet Clarification

You recommended Eth Sepolia for testing (Uniswap UI + Airstreams available). Questions:
- Mainnet deployment will be **Base**, correct?
- Should we deploy to Eth Sepolia for testing, or is Base Sepolia sufficient given mainnet is Base?
- We have Base Sepolia deployed already — need both?

## 3. LP Mechanics

Can the 5% LP come from the Agent's allocation as single-sided liquidity?

Thinking: Agent gets 20% staked + 5% goes to LP (instead of full 25% staked). This keeps Agent aligned while providing liquidity.

## 4. Platform Allocation Configurability

The 25% Platform allocation needs to:
- Go to Eden for first 10 agents
- Open to other platforms later

Is this configurable per-agent at launch time, or hardcoded?

---

**Re: Support hours** — I'll reply to Amin separately on the 20-hour support package.

Let me know what's feasible. Timeline is tight (TGE Jan 15).

Thanks,
Seth
