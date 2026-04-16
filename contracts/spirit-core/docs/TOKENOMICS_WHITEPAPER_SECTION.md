# SPIRIT Token Economics

**Version**: 1.0.0
**Last Updated**: December 10, 2025

---

## Overview

SPIRIT is the native token of Spirit Protocol, designed to align incentives between autonomous AI agents, their human collaborators, and the broader community. The tokenomics model balances immediate liquidity needs with long-term alignment through structured vesting.

---

## Token Distribution

**Total Supply: 1,000,000,000 SPIRIT**

| Bucket | Allocation | Percentage | Vesting |
|--------|------------|------------|---------|
| Community (Programmatic) | 300,000,000 | 30% | None |
| Treasury | 250,000,000 | 25% | Various |
| Eden Incubation (Existing) | 200,000,000 | 20% | 12m cliff + 36m linear |
| Eden Incubation (Reserve) | 50,000,000 | 5% | 12m cliff + 36m linear |
| Protocol Team | 100,000,000 | 10% | 12m cliff + 36m linear |
| Community Upfront | 100,000,000 | 10% | 12m cliff + 36m linear |

---

## Bucket Descriptions

### Community (Programmatic) — 300M (30%)

The largest allocation is reserved for programmatic distribution to AI agents and their communities. This allocation:

- Has **no vesting** — tokens flow through the protocol's airstream mechanism
- Is distributed as new agents are registered on the protocol
- Each agent receives child tokens that stream to SPIRIT holders over time
- Ensures ongoing community growth beyond the initial launch cohort

### Treasury — 250M (25%)

The Treasury bucket funds protocol operations, partnerships, and liquidity:

| Sub-Allocation | Amount | % of Treasury | % of Total |
|----------------|--------|---------------|------------|
| Available for OTC Sales | 110,000,000 | 44% | 11.0% |
| LP (Uniswap V4) | 50,000,000 | 20% | 5.0% |
| Pre-sale | 50,000,000 | 20% | 5.0% |
| Aerodrome Ignition | 10,000,000 | 4% | 1.0% |
| Braindrops Holders | 10,000,000 | 4% | 1.0% |
| Bright Moments Citizens | 10,000,000 | 4% | 1.0% |
| Superfluid DAO | 5,000,000 | 2% | 0.5% |
| Superfluid Stakers | 5,000,000 | 2% | 0.5% |

**Superfluid Partnership (10M total / 1%)**:
- 5M to Superfluid DAO multisig as infrastructure partner allocation
- 5M streamed to existing SUP stakers over 1 year

### Eden Incubation (Existing) — 200M (20%)

Allocated to current Eden stakeholders who built the foundation for Spirit Protocol:

| Stakeholder | Allocation | % of Bucket |
|-------------|------------|-------------|
| Gene | 75,000,000 | 37.50% |
| Seth | 45,400,000 | 22.70% |
| Xander | 42,000,000 | 21.00% |
| SAFE B (USV + Gould) | 20,000,000 | 10.00% |
| SAFE A (Angels) | 12,780,000 | 6.39% |
| Advisors | 2,920,000 | 1.46% |
| Jmill | 1,240,000 | 0.62% |
| Flo (former) | 660,000 | 0.33% |

### Eden Incubation (Reserve) — 50M (5%)

Reserved for future Eden hires and investors. Subject to the same vesting terms as existing holders.

### Protocol Team — 100M (10%)

Allocated to the team building and maintaining Spirit Protocol:

| Member | Allocation | % of Bucket |
|--------|------------|-------------|
| Seth Goldstein | 29,600,000 | 29.60% |
| Additional Team (Future) | 70,400,000 | 70.40% |

**Note**: Henry Pye is an advisor in the Community Upfront bucket, not Protocol Team.

### Community Upfront — 100M (10%)

Genesis artists and advisors who contributed to the protocol's early development:

**Genesis Artists (6 agents):**
- eko33 (Johnny Rico) — 5M
- kristi coronado (Solienne) — 5M
- lattice/martin/colin (Geppetto) — 5M
- pindar van arman (cloudpainter) — 5M
- mikey/ezra (culture agent) — 5M
- TBD (genesis artist) — 5M

**Advisors (18 individuals):**
- Protocol advisors: henry pye, will papper, lex sokolin, phil mohun
- Governance: primavera di filippi, simon de la rouviere, aaron/priyanka
- Pattern recognition: freeman, simon hudson, dimi
- Additional advisors with smaller allocations

All advisor/artist allocations are contingent upon active participation in the protocol.

---

## Vesting Schedule

### Standard Vesting Pattern

Applies to: Eden Existing, Eden Reserve, Protocol Team, Community Upfront

| Parameter | Value |
|-----------|-------|
| Cliff Period | 12 months after TGE |
| Cliff Release | 20% of total allocation |
| Linear Vesting | 36 months after cliff |
| Total Duration | 48 months |
| Stream Rate | 80% over 36 months (~2.22%/month) |

### Example: 10M Token Allocation

```
TGE:           0 tokens released
TGE + 12m:     2,000,000 tokens (20% cliff)
TGE + 24m:     4,666,667 tokens (cliff + 12m stream)
TGE + 36m:     7,333,333 tokens (cliff + 24m stream)
TGE + 48m:    10,000,000 tokens (fully vested)
```

### No Vesting

The following allocations do NOT use vesting contracts:

- **Community Programmatic (300M)**: Distributed via child token airstream mechanism
- **Superfluid Stakers (5M)**: Separate 1-year streaming program
- **Treasury Operational**: OTC, LP, Presale, community distributions

---

## Token Utility

### SPIRIT Token

1. **Governance**: Vote on protocol parameters and agent registration
2. **Staking**: Stake in agent pools to earn rewards
3. **Airstream Eligibility**: Hold SPIRIT to receive child token distributions

### Child Tokens (Agent Tokens)

Each registered agent receives a 1B supply child token with:
- 25% to Uniswap V4 liquidity pool
- 25% streamed to SPIRIT holders (airstream)
- 25% to artist (locked 52 weeks)
- 25% to agent (locked 52 weeks)

### The Flywheel

```
Hold SPIRIT → Receive Child Tokens → Stake Child → Earn SPIRIT
     ↑                                                    │
     └────────────────────────────────────────────────────┘
```

---

## Key Addresses

| Role | Address | Notes |
|------|---------|-------|
| Admin Multisig | TBD | Protocol governance |
| Treasury | TBD | Holds Treasury bucket |
| Distributor | TBD | Airstream operations |
| Superfluid DAO | TBD | Partner allocation recipient |

---

## Audit Status

- **Auditor**: 0xSimao
- **Date**: November 28, 2025
- **Status**: All issues resolved
- **Contracts**: All core contracts audited and finalized

---

## Data Sources

- `/config/tokenomics.json` — Normalized tokenomics truth source
- `/config/vesting_schedule.csv` — Complete vesting recipient list
- Google Sheets "SPIRIT TOKENOMICS" — Original allocation data
