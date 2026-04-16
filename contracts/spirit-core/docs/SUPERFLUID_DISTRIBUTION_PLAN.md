# Superfluid Partnership Distribution Plan

**Version**: Draft 1.0
**Status**: AWAITING SUPERFLUID INPUT
**Last Updated**: December 10, 2025

---

## Overview

Spirit Protocol allocates 1% of total supply (10,000,000 SPIRIT) to the Superfluid ecosystem as a strategic partnership allocation. This recognizes Superfluid's role as core infrastructure for Spirit Protocol's vesting and streaming mechanics.

---

## Allocation Breakdown

| Recipient | Amount | % of Total | Mechanism |
|-----------|--------|------------|-----------|
| Superfluid DAO | 5,000,000 | 0.5% | One-time transfer |
| SUP Stakers | 5,000,000 | 0.5% | 1-year stream |
| **Total** | **10,000,000** | **1.0%** | |

---

## Superfluid DAO Allocation (5M)

**Mechanism**: Direct transfer to Superfluid DAO multisig

**Timing**: At TGE (January 15, 2026)

**Purpose**: Infrastructure partner allocation for Superfluid DAO treasury

### Questions for Superfluid Team

1. **Receiving Address**: What is the Superfluid DAO multisig address on Base?
   - Address: `________________________`

2. **Vesting**: Should this be vested or liquid at TGE?
   - Current assumption: Liquid (no vesting)
   - Alternative: Match team vesting (12m cliff + 36m linear)

---

## SUP Stakers Allocation (5M)

**Mechanism**: TBD - Need Superfluid input

**Duration**: 1 year from start date

**Purpose**: Reward existing SUP stakers for ecosystem alignment

### Questions for Superfluid Team

1. **Eligibility Snapshot**
   - When should we snapshot SUP stakers?
   - Option A: At TGE (Jan 15, 2026)
   - Option B: Before announcement (to prevent gaming)
   - Option C: Rolling/continuous eligibility
   - Recommended: `________________________`

2. **Minimum Stake Requirement**
   - Is there a minimum SUP stake to qualify?
   - Option A: Any amount qualifies
   - Option B: Minimum threshold (e.g., 100 SUP)
   - Recommended: `________________________`

3. **Distribution Mechanism**
   - How should SPIRIT flow to stakers?
   - Option A: Superfluid Airstream (merkle-based, claimable)
   - Option B: Direct Superfluid stream to each staker
   - Option C: Stream to SUP staking contract for pro-rata distribution
   - Option D: Superfluid handles distribution (we send 5M to a designated address)
   - Recommended: `________________________`

4. **Stream Start Date**
   - When should the 1-year stream begin?
   - Option A: At TGE (Jan 15, 2026)
   - Option B: After cliff period (Jan 15, 2027)
   - Option C: Custom date
   - Recommended: `________________________`

5. **Pro-Rata Calculation**
   - How is each staker's share calculated?
   - Option A: Proportional to SUP staked at snapshot
   - Option B: Equal distribution to all qualifying stakers
   - Option C: Weighted by stake duration
   - Recommended: `________________________`

6. **Unclaimed Tokens**
   - What happens to unclaimed SPIRIT after stream ends?
   - Option A: Return to Spirit Protocol treasury
   - Option B: Remain claimable indefinitely
   - Option C: Roll into next distribution
   - Recommended: `________________________`

---

## Implementation Options

### Option A: Spirit Protocol Manages Distribution

We create the Airstream using Superfluid's AirstreamFactory:
- Spirit Protocol generates merkle tree from SUP staker snapshot
- Deploy Airstream contract with 5M SPIRIT, 1-year duration
- Stakers claim via Spirit Protocol UI or direct contract interaction

**Pros**: Full control, consistent with other distributions
**Cons**: Need SUP staker data, additional dev work

### Option B: Superfluid Manages Distribution

We transfer 5M SPIRIT to Superfluid-designated address:
- Superfluid team handles snapshot and distribution mechanics
- They know their staker base best
- We provide tokens, they handle logistics

**Pros**: Leverage Superfluid expertise, less work for us
**Cons**: Less visibility, dependency on Superfluid timeline

### Option C: Hybrid Approach

- Superfluid provides snapshot data (addresses + amounts)
- Spirit Protocol creates Airstream from that data
- Both teams verify before launch

**Pros**: Best of both, shared responsibility
**Cons**: Coordination overhead

---

## Proposed Timeline

| Date | Action | Owner |
|------|--------|-------|
| Dec 15, 2025 | Superfluid provides answers to questions above | Superfluid |
| Dec 20, 2025 | Finalize distribution mechanism | Joint |
| Jan 1, 2026 | SUP staker snapshot (if Option A/C) | Superfluid |
| Jan 10, 2026 | Generate merkle tree / prepare distribution | Spirit |
| Jan 15, 2026 | TGE - Transfer 5M to DAO, initiate staker stream | Spirit |

---

## Summary of Decisions Needed from Superfluid

| # | Question | Options | Default if No Response |
|---|----------|---------|------------------------|
| 1 | DAO multisig address | [address] | Block deployment |
| 2 | DAO allocation vesting | Liquid / Vested | Liquid |
| 3 | Staker snapshot date | TGE / Earlier / Rolling | TGE |
| 4 | Minimum stake requirement | Any / Threshold | Any amount |
| 5 | Distribution mechanism | A / B / C / D | Option B (Superfluid manages) |
| 6 | Stream start date | TGE / Cliff / Custom | TGE |
| 7 | Pro-rata calculation | Proportional / Equal / Weighted | Proportional to stake |
| 8 | Unclaimed token handling | Return / Indefinite / Roll | Return to treasury |

---

## Contact

**Spirit Protocol**: Seth Goldstein
**Email**: [to be added]

Please reply with your preferences on the above questions, or schedule a call to discuss.

---

*This document will be updated as decisions are finalized.*
