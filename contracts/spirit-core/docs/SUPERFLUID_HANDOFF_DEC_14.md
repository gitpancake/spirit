# Spirit Protocol → Superfluid Punch-List
**Date:** December 14, 2025
**TGE:** January 15, 2026 (32 days)
**From:** Seth Goldstein

---

## Context

Per our Dec 9 conversation, I've completed the config/vesting/allocation work on my side. This is the punch-list for final confirmation before mainnet.

---

## 1. Base Mainnet Config (Ready)

I've filled the network config. Please confirm these addresses are correct for Base mainnet:

```
Admin address:              [EDEN_ADMIN_SAFE - TBD]
Treasury address:           [EDEN_TREASURY_SAFE - TBD]
Distributor address:        [Same as Treasury]
Super Token Factory:        [Need Base mainnet address]
UniswapV4 Position Manager: [Need Base mainnet address]
UniswapV4 Pool Manager:     [Need Base mainnet address]
Permit2 address:            0x000000000022D473030F116dDEE9F6B43aC78BA3
```

**Question:** Can you provide the canonical Base mainnet addresses for Super Token Factory and UniswapV4 contracts?

---

## 2. Vesting Schedules (Ready)

All vesting schedules are complete. Attached: `vesting_schedule.csv`

**Summary:**
- 35 recipients across 4 buckets
- Cliff: Jan 15, 2027 (12 months post-TGE)
- End: Jan 15, 2030 (48 months total)
- Cliff release: 20% of allocation
- Linear stream: 80% over 36 months

---

## 3. LP Parameters (Ready)

```
SPIRIT/ETH Initial Tick:    184200
SPIRIT/ETH Tick Spacing:    200
SPIRIT/ETH Pool Fee:        10000 (1%)
Initial LP allocation:      50,000,000 SPIRIT (5% of supply)
```

**Question:** Do these match the audited deploy config? Any adjustments for Base mainnet vs testnet?

---

## 4. Superfluid Allocation (Ready)

| Allocation | Amount | % | Mechanism |
|------------|--------|---|-----------|
| Superfluid DAO | 5,000,000 SPIRIT | 0.5% | Direct to DAO multisig at TGE |
| Superfluid Stakers | 5,000,000 SPIRIT | 0.5% | 1-year streaming to SUP stakers |

**Total:** 10,000,000 SPIRIT (1% of 1B supply)

**Action needed:** Please provide the Superfluid DAO multisig address on Base for the 5M direct allocation.

**Question:** For the SUP staker program - do you have existing infrastructure for streaming SPIRIT to SUP stakers, or should we deploy a distribution contract?

---

## 5. Contract Constants (Please Confirm)

These are hardcoded and cannot change post-deployment:

### StakingPool.sol
```
MIN_MULTIPLIER = 10,000 (1x)
MAX_MULTIPLIER = 360,000 (36x)     ← CONFIRM
MINIMUM_LOCKING_PERIOD = 1 week
MAXIMUM_LOCKING_PERIOD = 156 weeks (3 years)
STAKEHOLDER_LOCKING_PERIOD = 52 weeks
STAKEHOLDER_AMOUNT = 250M
```

### SpiritFactory.sol
```
CHILD_TOTAL_SUPPLY = 1B
DEFAULT_LIQUIDITY_SUPPLY = 250M
AIRSTREAM_SUPPLY = 250M
AIRSTREAM_DURATION = 52 weeks      ← CONFIRM
DEFAULT_POOL_FEE = 1%
```

**Critical:** Please confirm MAX_MULTIPLIER (36x) and AIRSTREAM_DURATION (52 weeks) before mainnet deploy.

---

## 6. Testnet Reference (Base Sepolia)

Successfully deployed and tested:

| Contract | Address |
|----------|---------|
| SPIRIT Token | `0xc7e9de362C6eA2Cc03863ECe330622146Ff1c18B` |
| Reward Controller | `0x1390A073a765D0e0D21a382F4F6F0289b69BE33C` |
| Staking Pool Beacon | `0x6A96aC9BAF36F8e8b6237eb402d07451217C7540` |
| Spirit Factory | `0x879d67000C938142F472fB8f2ee0b6601E2cE3C6` |
| Vesting Factory | `0x94bea63d6eC10AF980bf8C7aEFeE04665D355AFe` |
| EDEN Multisig | `0x3139DB2845810C4DE0727A5D5Aa24146C086eE1A` |

---

## 7. Outstanding Items from Dec 9

Per our conversation, still need from Superfluid side:

- [ ] Canonical audited commit/tag
- [ ] Base deploy sequence confirmation (DEPLOYMENT.md looks correct?)
- [ ] Staking/vesting endpoint clarity for Spirit UI
- [ ] 2-3 week post-launch support window confirmation

---

## Timeline

| Date | Milestone |
|------|-----------|
| **Dec 14** | This punch-list sent |
| Dec 15-20 | NYC fundraising (limited availability) |
| Dec 21-28 | Base Sepolia dry-run, final testing |
| **Jan 10** | Hard deadline for constant confirmations |
| **Jan 15** | TGE - Mainnet deploy |

---

## Attachments

1. `config/tokenomics.json` - Machine-readable allocations
2. `config/vesting_schedule.csv` - Individual recipient schedules
3. Audit report reference (0xSimao, Nov 28, 2025)

---

## Summary of What I Need

1. **Superfluid DAO multisig address** (Base) - for 5M TGE transfer
2. **Confirm 36x multiplier** - hardcoded constant
3. **Confirm 52-week airstream** - hardcoded constant
4. **Base mainnet addresses** - Super Token Factory, UniswapV4 contracts
5. **SUP staker program details** - existing infra or new contract?

No changes needed on your side beyond confirmations. Let me know if anything looks off.

—Seth
