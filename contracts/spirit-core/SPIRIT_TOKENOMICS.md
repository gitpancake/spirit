# Spirit Protocol Tokenomics - Single Source of Truth

**Version:** 2.0.0
**Last Updated:** December 13, 2025
**TGE Date:** January 15, 2026
**Status:** FINAL - Ready for deployment

> **This file is the canonical reference for all Spirit Protocol tokenomics.**
> All website copy, whitepapers, investor materials, and smart contracts must sync to this document.
> Machine-readable version: `/config/tokenomics.json`

---

## Token Overview

| Property | Value |
|----------|-------|
| **Token Name** | SPIRIT |
| **Total Supply** | 1,000,000,000 (1 billion) |
| **Network** | Base (Ethereum L2) |
| **Token Standard** | ERC-20 |
| **TGE Date** | January 15, 2026 |

---

## Distribution Summary

| Bucket | Amount | % | Vesting |
|--------|--------|---|---------|
| **Community (Programmatic)** | 300M | 30% | No vesting - airstreamed to agents |
| **Treasury** | 250M | 25% | 1-year linear vest |
| **Eden Incubation (Existing)** | 200M | 20% | 12m cliff + 36m linear |
| **Eden Incubation (Reserve)** | 50M | 5% | 12m cliff + 36m linear |
| **Protocol Team** | 100M | 10% | 12m cliff + 36m linear |
| **Community Upfront** | 100M | 10% | 12m cliff + 36m linear |
| **TOTAL** | **1,000M** | **100%** | |

---

## 1. Community Programmatic (300M - 30%)

**Vesting:** None - programmatically streamed via smart contracts

**Purpose:**
- Long-term rewards to agents based on protocol revenue contribution
- Creator incentives for training and maintaining active agents
- Distributed over 4+ years based on agent performance metrics
- Immutable smart contract logic (no multisig control)

**Mechanics:**
- New agents beyond Genesis cohort receive SPIRIT via child-token airstream
- Artists who maintain active practices receive ongoing incentives
- No upfront allocation; entirely performance-based

---

## 2. Treasury (250M - 25%)

**Vesting:** 1-year linear vest
**Purpose:** LP, OTC sales, presale, partner distributions

### Treasury Sub-Allocations

| Sub-Allocation | Amount | % of Treasury | % of Total |
|----------------|--------|---------------|------------|
| **OTC Sales** | 110M | 44% | 11% |
| **LP (Uniswap V4)** | 50M | 20% | 5% |
| **Presale** | 50M | 20% | 5% |
| **Aerodrome Ignition** | 10M | 4% | 1% |
| **Braindrops Holders** | 10M | 4% | 1% |
| **Bright Moments Citizens** | 10M | 4% | 1% |
| **Superfluid DAO** | 5M | 2% | 0.5% |
| **Superfluid Stakers** | 5M | 2% | 0.5% |
| **TOTAL** | **250M** | **100%** | **25%** |

### Treasury Operations

**OTC Sales (110M):**
- Strategic private sales to DAOs, VCs, ecosystem partners
- Suggested price: $0.04/SPIRIT ($40M FDV)
- Suggested minimum: $25,000
- 12-month lockup recommended

**Presale (50M):**
- Community/supporter early access before TGE
- Same price as OTC: $0.04/SPIRIT
- Cap: 500K SPIRIT per wallet (~$20K)
- No vesting (immediate at TGE)

**LP Provision (50M):**
- Uniswap V4 on Base
- Paired with ETH/USDC
- Live at TGE

**Community Airdrops:**
- Braindrops holders: 10M (merkle claim)
- Bright Moments citizens: 10M (merkle claim)
- 1-year claim window

**Superfluid Partnership:**
- DAO allocation: 5M to Superfluid multisig
- Staker rewards: 5M streamed to SUP stakers over 1 year

---

## 3. Eden Incubation - Existing (200M - 20%)

**Vesting:** 12-month cliff + 36-month linear (48 months total)
**Purpose:** Current Eden shareholders

### Recipients

| Name | Amount | % of Bucket | % of Total |
|------|--------|-------------|------------|
| Gene | 75,000,000 | 37.50% | 7.50% |
| Seth | 45,400,000 | 22.70% | 4.54% |
| Xander | 42,000,000 | 21.00% | 4.20% |
| SAFE B (USV + Gould) | 20,000,000 | 10.00% | 2.00% |
| SAFE A (Angels) | 12,780,000 | 6.39% | 1.278% |
| Advisors | 2,920,000 | 1.46% | 0.292% |
| Jmill | 1,240,000 | 0.62% | 0.124% |
| Flo (former) | 660,000 | 0.33% | 0.066% |
| **TOTAL** | **200,000,000** | **100%** | **20%** |

---

## 4. Eden Incubation - Reserve (50M - 5%)

**Vesting:** 12-month cliff + 36-month linear (48 months total)
**Purpose:** Future Eden hires/investors

| Name | Amount | Notes |
|------|--------|-------|
| Eden Future Reserve | 50,000,000 | Placeholder - TBD |

---

## 5. Protocol Team (100M - 10%)

**Vesting:** 12-month cliff + 36-month linear (48 months total)
**Purpose:** Founders and future core team

### Recipients

| Name | Amount | % of Bucket | % of Total | Notes |
|------|--------|-------------|------------|-------|
| Seth Goldstein | 29,600,000 | 29.60% | 2.96% | Founder |
| Additional Team | 70,400,000 | 70.40% | 7.04% | Future team pool - TBD |
| **TOTAL** | **100,000,000** | **100%** | **10%** | |

**Important Notes:**
- Henry Pye is in Community Upfront (advisor), NOT Protocol Team
- Gene Kogan is in Eden Incubation, NOT Protocol Team
- Seth's total = Eden (45.4M) + Team (29.6M) = **75M SPIRIT (7.5%)**

---

## 6. Community Upfront (100M - 10%)

**Vesting:** 12-month cliff + 36-month linear (48 months total)
**Purpose:** Genesis artists + strategic advisors

### Recipients

| Name | Category | Amount | % of Total | Notes |
|------|----------|--------|------------|-------|
| aaron/priyanka | advisor | 5,000,000 | 0.50% | governance |
| delronde | advisor | 1,000,000 | 0.10% | ai art expert |
| dimi | advisor | 5,000,000 | 0.50% | Ocean Protocol founder |
| eko33 | genesis artist | 5,000,000 | 0.50% | Johnny Rico agent |
| evan (metaissance) | advisor | 1,000,000 | 0.10% | ai art expert |
| freeman | advisor | 5,000,000 | 0.50% | Mars co-founder |
| henry pye | advisor | 5,000,000 | 0.50% | protocol advisor |
| jediwolf | advisor | 1,000,000 | 0.10% | ai art expert |
| jeremiah chechik | artist | 5,000,000 | 0.50% | Capa2 agent |
| kelly lavalley | advisor | 1,000,000 | 0.10% | ecosystem |
| kristi coronado | genesis artist | 5,000,000 | 0.50% | Solienne agent |
| lattice (martin/colin) | genesis artist | 5,000,000 | 0.50% | Geppetto agent |
| lex sokolin | advisor | 5,000,000 | 0.50% | tokenomics/legal |
| matt/holly | artist | 5,000,000 | 0.50% | AI pattern recognition |
| mikey/ezra | genesis artist | 5,000,000 | 0.50% | culture agent |
| phil mohun | advisor | 5,000,000 | 0.50% | NODE director |
| pindar van arman | genesis artist | 5,000,000 | 0.50% | cloudpainter agent |
| primavera di filippi | advisor | 5,000,000 | 0.50% | governance |
| simon de la rouviere | advisor | 5,000,000 | 0.50% | token experiments |
| simon hudson | advisor | 5,000,000 | 0.50% | Botto |
| vanessa rosa | artist | 5,000,000 | 0.50% | Verdelis agent |
| will papper | advisor | 5,000,000 | 0.50% | tokenomics |
| tbd (genesis artist) | genesis artist | 5,000,000 | 0.50% | placeholder |
| tbd (small) | tbd | 1,000,000 | 0.10% | placeholder |
| **TOTAL** | | **100,000,000** | **10%** | |

---

## Vesting Schedule

### Key Dates

| Milestone | Date | What Happens |
|-----------|------|--------------|
| **TGE** | January 15, 2026 | Token deployed, LP live, Treasury unlocked |
| **Cliff End** | January 15, 2027 | 20% of vested allocations unlock |
| **Full Vest** | January 15, 2030 | All vesting complete (48 months from TGE) |

### Vesting Mechanics

**For Eden, Team, and Community Upfront (450M total):**
- **Cliff:** 12 months - ZERO tokens unlock before Jan 15, 2027
- **Cliff Release:** 20% unlocks at cliff end
- **Linear Stream:** Remaining 80% streams monthly over 36 months
- **Monthly Rate:** (Allocation × 80%) ÷ 36

**Example - 5M Allocation:**
- Cliff release (Jan 2027): 1,000,000 SPIRIT (20%)
- Monthly stream: ~111,111 SPIRIT/month for 36 months
- Full vest: January 15, 2030

### No-Vesting Allocations

| Bucket | Amount | Mechanism |
|--------|--------|-----------|
| Programmatic | 300M | Airstreamed to agents over 4+ years |
| Treasury (operational) | 250M | 1-year linear vest for treasury ops |
| Superfluid Stakers | 5M | Separate 1-year streaming program |

---

## Agent Token Economics

Each AI agent launched through Spirit Protocol has its own token (1B supply per agent).

### Agent Token Distribution (Per Agent)

| Allocation | Amount | % | Notes |
|------------|--------|---|-------|
| Uniswap LP | 250M | 25% | Tradeable immediately |
| Airstream to SPIRIT holders | 250M | 25% | Streamed over 52 weeks |
| Artist | 250M | 25% | Locked 52 weeks |
| Agent Wallet | 250M | 25% | Locked 52 weeks |
| **TOTAL** | **1,000M** | **100%** | |

### The Flywheel

```
Hold SPIRIT → Receive child tokens when agents launch →
Stake child tokens → Earn more SPIRIT → Repeat
```

### Staking Multiplier

- **Range:** 1× to 36×
- **Mechanics:** Longer stake duration = higher multiplier
- **Max multiplier requires:** Maximum lock period

---

## Governance

### Phase 1: Launch (Months 0-12)
- **2-of-3 Multisig:** Seth, Gene, Fred (or delegate)
- Fast execution for ecosystem bootstrapping
- Sub-$25K spends approved by founders
- Monthly treasury reports published onchain

### Phase 2: Hybrid (Months 12-24)
- Token holder voting for major decisions
- Large expenditures (>$250K) require token votes
- Snapshot voting + onchain execution

### Phase 3: Full DAO (Month 24+)
- Complete community governance
- All treasury spending via proposals
- Onchain governance with time-locks

---

## Legal Structure

**Entity:** Spirit Protocol Association
**Type:** Wyoming Decentralized Unincorporated Nonprofit Association (DUNA)

### What SPIRIT Is
- Governance token for protocol stewardship
- Used to propose and vote on protocol decisions
- Coordinates treasury allocation, agent onboarding, platform approvals

### What SPIRIT Is NOT
- NOT equity or ownership in any company
- NOT a security or investment contract
- NOT entitlement to dividends, royalties, or revenue share
- NOT a claim on profits from others' efforts

---

## Genesis Agents

| Agent | Creator(s) | Status |
|-------|------------|--------|
| **Solienne** | Seth + Kristi | Active - Daily manifestos |
| **Abraham** | Gene Kogan | Active - ~$5K/week revenue |
| **Gigabrain** | Xander | Active - Enterprise applications |
| **Geppetto** | Lattice (Martin + Colin) | Active - Social intelligence |

---

## Quick Reference

### For Investors
- Total supply: 1B SPIRIT
- TGE: January 15, 2026
- Presale: 50M available at $0.04/token
- FDV at presale price: $40M

### For Team/Advisors
- Your allocation: Check Community Upfront table above
- Cliff: January 15, 2027 (12 months)
- Cliff release: 20% of your allocation
- Full vest: January 15, 2030 (48 months total)
- Submit wallet: https://spiritprotocol.io/community-allocation/

### For Artists
- Genesis allocation: 5M SPIRIT per artist
- Same vesting as advisors (12m cliff + 36m linear)
- Plus: 25% of your agent's token (locked 52 weeks)
- Plus: Ongoing SPIRIT rewards based on agent performance

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Dec 13, 2025 | Consolidated from tokenomics.json; fixed TGE date to Jan 15, 2026; presale 50M (not 100M); added treasury breakdown |
| 1.0.0 | Nov 24, 2025 | Initial source of truth (outdated) |

---

## Sync Checklist

When updating this document, also update:

- [ ] `/config/tokenomics.json` - Machine-readable version
- [ ] `/config/vesting_schedule.csv` - Individual allocations
- [ ] `spiritprotocol.io/presale.njk` - Presale page
- [ ] `spiritprotocol.io/investors.njk` - Investor page
- [ ] `spiritprotocol.io/api/spirit_agent.py` - Agent knowledge
- [ ] Pitch decks and investor materials
- [ ] Smart contract parameters (if pre-deployment)

---

**END OF SOURCE OF TRUTH**

**Canonical Location:** `/Users/seth/spirit-contracts-core/SPIRIT_TOKENOMICS.md`
**Machine-Readable:** `/Users/seth/spirit-contracts-core/config/tokenomics.json`
**Contact:** Seth Goldstein (tokenomics), Henry Pye (contracts)
