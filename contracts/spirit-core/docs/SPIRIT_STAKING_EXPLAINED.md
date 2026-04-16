# Spirit Protocol Staking: Plain English Guide

*Everything you need to know about staking in Spirit Protocol, explained simply.*

---

## What Is Staking?

Staking means locking your tokens for a period of time. In return, you earn rewards.

**Think of it like this:** You're saying "I believe in this agent's future, and I'm willing to prove it by committing my tokens."

The longer you commit, the more you earn.

---

## Why Does Staking Exist?

### The Problem It Solves

Without staking, when an agent token launches, everyone would sell immediately. Early recipients cash out, price crashes, and long-term believers get hurt.

### How Staking Fixes This

By staking your tokens, you:
1. **Lock them** — You can't sell during the lock period
2. **Earn rewards** — You receive SPIRIT tokens continuously
3. **Signal conviction** — You're publicly committed to this agent's success

This transforms the incentive from "sell before others do" to "hold and earn from the agent's success."

---

## Two Types of Staking in Spirit Protocol

### 1. Staking Agent Tokens → Earn SPIRIT

When you stake an agent's token (like SOLIENNE), you earn SPIRIT rewards.

**Where do rewards come from?**
Every time the agent earns revenue, 25% flows to the staking pool. That 25% gets distributed to everyone who staked that agent's token.

**Example:**
- Solienne sells art for $100
- $25 goes to the SPIRIT reward pool for Solienne stakers
- You have 1% of the staking pool weight
- You earn $0.25 worth of SPIRIT (streamed continuously)

### 2. Holding SPIRIT → Receive Agent Tokens

When a new agent launches, SPIRIT holders automatically receive that agent's tokens via airstream.

**How it works:**
- New agent joins Spirit Protocol
- 250 million agent tokens get airstreamed to SPIRIT holders
- The stream lasts 52 weeks
- The more SPIRIT you hold, the more agent tokens you receive

**No staking required for this.** Just hold SPIRIT in your wallet.

---

## The Flywheel

This is how everything connects:

```
1. Hold SPIRIT
       ↓
2. New agent launches → You receive agent tokens (airstream)
       ↓
3. Stake agent tokens → Choose your lock period
       ↓
4. Agent earns revenue → 25% goes to reward pool
       ↓
5. You earn SPIRIT based on your stake
       ↓
6. More SPIRIT → More agent tokens next launch
       ↓
   (repeat)
```

**The more agents that succeed, the more everyone earns.**

---

## Lock Periods and Multipliers

### Why Lock Periods Exist

If you could stake and unstake instantly, everyone would game the system. Lock periods ensure real commitment.

### The Options

| Lock Period | Multiplier | Plain English |
|-------------|------------|---------------|
| 1 week | 1x | Minimum commitment, baseline rewards |
| 1 month | ~1.5x | Slightly more rewards |
| 3 months | ~3x | Meaningful commitment |
| 6 months | ~6x | Serious believer |
| 1 year (52 weeks) | 12x | Long-term aligned |
| 2 years | ~24x | Very committed |
| 3 years (156 weeks) | 36x | Maximum commitment, maximum rewards |

### What the Multiplier Means

The multiplier is your **weight** in the reward pool — not a direct earnings multiple.

**Example:**
- You stake 10,000 tokens for 3 months (~3x multiplier)
- Someone else stakes 10,000 tokens for 1 year (12x multiplier)
- Same tokens, but they earn ~4x more rewards than you
- Why? They committed longer.

### Choosing Your Lock Period

**Don't overthink it.**

- **1-3 months:** You want flexibility, okay with lower rewards
- **6-12 months:** You believe in the agent, want meaningful rewards
- **2-3 years:** You're a true believer, want maximum rewards

Most people should pick something in the middle. You don't need to lock for 3 years.

---

## Artist and Agent Auto-Staking

When an agent launches, the artist and the agent itself receive 250M tokens each. These are **automatically staked for 52 weeks**.

**Why?**
- Prevents the artist from dumping tokens on day one
- Aligns the artist with the agent's first year of performance
- The artist earns SPIRIT rewards throughout the year
- Same for the agent's own wallet

**After 52 weeks:** The artist can unstake and choose what to do — restake, sell, or hold.

---

## How Rewards Flow (Technical but Simple)

### Step 1: Agent Earns Money

Solienne sells a portrait for $100.

### Step 2: Revenue Splits Four Ways

The Royalty Router smart contract automatically divides:
- $25 → Artist (Kristi)
- $25 → Agent (Solienne's wallet)
- $25 → Platform (Eden)
- $25 → SPIRIT stakers

### Step 3: SPIRIT Portion Goes to Reward Controller

That $25 for stakers enters the Reward Controller. It gets converted to SPIRIT and distributed.

### Step 4: Stakers Receive Based on Weight

The Superfluid GDA Pool streams rewards continuously (per-second, not monthly).

Your share depends on:
- How many tokens you staked
- How long you locked (multiplier)
- How much everyone else staked

### Step 5: You See SPIRIT Accumulating

Open your wallet. Watch SPIRIT stream in. It's not a monthly payout — it flows continuously.

---

## Frequently Asked Questions

### "When can I unstake?"

After your lock period ends. If you locked for 3 months, you wait 3 months. No early exit.

### "What if I want to add more tokens?"

You can stake additional tokens at any time. Each stake has its own lock period.

### "Do I have to stake?"

No. You can just hold agent tokens. But you won't earn SPIRIT rewards — only stakers earn.

### "What happens to unclaimed rewards?"

Rewards stream continuously to your address. They accumulate whether you "claim" them or not. No action needed.

### "Can I lose my tokens?"

No. Staking is not risky like DeFi lending. Your tokens are locked, not lent. When the lock ends, you get them back.

### "What if the agent fails?"

If the agent stops earning revenue, stakers stop receiving rewards. But you still own your tokens. You can unstake when your lock ends.

### "Is this like yield farming?"

Kind of, but simpler. You stake one thing, you earn one thing. No complex strategies needed.

---

## The Simple Version

**If you believe in an agent:**
1. Receive agent tokens (via airstream if you hold SPIRIT)
2. Stake them for a reasonable period (3-6 months is fine)
3. Earn SPIRIT rewards automatically
4. Use that SPIRIT to get more agent tokens when new agents launch
5. Repeat

**That's it.** The protocol handles everything else.

---

## Beyond Staking: Token Utility

Staking isn't the only thing you can do with agent tokens. Artists can design additional utility:

| Action | What It Means |
|--------|---------------|
| **HOLD** | Access exclusive content, archives, recognition |
| **BURN** | Sacrifice tokens for unique creations |
| **STAKE** | Earn rewards + governance rights |
| **SPEND** | Pay for experiences, conversations, commissions |

Each agent decides what their token unlocks beyond staking.

See: [Design Your Token Utility](./DESIGN_YOUR_TOKEN_UTILITY.md)

---

## Key Numbers

| Parameter | Value |
|-----------|-------|
| Minimum stake | 1 token |
| Minimum lock | 1 week |
| Maximum lock | 3 years (156 weeks) |
| Multiplier range | 1x to 36x |
| Artist/Agent auto-lock | 52 weeks |
| Airstream duration | 52 weeks |
| Agent token supply | 1 billion per agent |
| SPIRIT total supply | 1 billion |

---

## Summary

**Staking exists so that:**
- People who believe in agents are rewarded
- Long-term commitment beats short-term speculation
- Revenue flows automatically to participants
- The whole ecosystem grows together

**For artists:** Your tokens are locked for a year. You earn when your agent earns.

**For collectors:** Stake longer to earn more. 3-6 months is reasonable. You don't need to optimize.

**For everyone:** This isn't about yield farming. It's about being part of an agent's journey. The staking just makes sure everyone's interests are aligned.

---

*Revenue flows. Rewards stream. Belief compounds.*
