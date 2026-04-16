# Spirit Protocol V1 Deployment Timeline

**TGE Target**: January 15, 2026
**Network**: Base Mainnet (Chain ID: 8453)

---

## Key Dates

| Milestone | Date | Notes |
|-----------|------|-------|
| **TGE** | Jan 15, 2026 | Token Generation Event |
| **Cliff Release** | Jan 15, 2027 | 20% of vested tokens unlock |
| **Vesting End** | Jan 15, 2030 | 100% of vested tokens unlocked |

---

## Pre-TGE Checklist (Dec 2025 - Jan 14, 2026)

### Week of Dec 16-22: Infrastructure Setup
- [ ] Create admin multisig (Safe, 2-of-3 minimum)
- [ ] Create treasury multisig (Safe)
- [ ] Set up distributor address (EOA or multisig)
- [ ] Get Superfluid DAO multisig address

### Week of Dec 23-29: Address Collection
- [ ] Collect wallet addresses from all vesting recipients
- [ ] Verify addresses with each recipient (send test txn)
- [ ] Update `vesting_schedule.csv` with real addresses
- [ ] Finalize `base.template.json` with deploy addresses

### Week of Dec 30 - Jan 5: Testnet Deployment
- [ ] Deploy full protocol to Base Sepolia
- [ ] Test vesting schedule creation
- [ ] Test LP pool creation
- [ ] Verify all roles and permissions
- [ ] Run integration tests

### Week of Jan 6-12: Final Prep
- [ ] Audit testnet deployment results
- [ ] Fix any issues found
- [ ] Prepare mainnet deployment scripts
- [ ] Double-check all addresses
- [ ] Prepare announcement materials

### Jan 13-14: Pre-Launch
- [ ] Final team sync
- [ ] Confirm gas budget (ETH on Base)
- [ ] Stage deployment transactions
- [ ] Notify key stakeholders

---

## TGE Day: January 15, 2026

### Deployment Sequence

```
1. Deploy SpiritToken (1B supply)
   └── 50M → LP allocation
   └── 950M → Treasury

2. Deploy StakingPool
   └── Set SPIRIT token
   └── Grant roles to admin

3. Deploy SpiritFactory
   └── Set dependencies (Superfluid, Uniswap V4)
   └── Grant DEPLOYER_ROLE to admin

4. Create Uniswap V4 Pool
   └── SPIRIT/ETH pair
   └── 1% fee tier
   └── Add 50M SPIRIT liquidity

5. Create Vesting Schedules (35 recipients)
   └── Eden Existing (8 recipients)
   └── Eden Reserve (1 placeholder)
   └── Protocol Team (2 recipients)
   └── Community Upfront (24 recipients)

6. Treasury Transfers
   └── 110M → OTC allocation
   └── 50M → Presale allocation
   └── 10M → Aerodrome
   └── 10M → Braindrops
   └── 10M → Bright Moments
   └── 5M → Superfluid DAO
   └── 5M → Superfluid Stakers (streaming)
```

### Post-Deploy Verification

- [ ] Verify total supply = 1,000,000,000
- [ ] Verify LP pool has 50M SPIRIT
- [ ] Verify Treasury received 950M - vested amounts
- [ ] Verify all 35 vesting schedules created
- [ ] Verify admin roles on all contracts
- [ ] Test one small swap on LP

---

## Post-TGE Timeline

### Jan 15, 2026 - Jan 15, 2027 (Cliff Period)
- Vested tokens locked (0% released)
- LP trading active
- Staking pools active
- Child token launches begin

### Jan 15, 2027 (Cliff Release)
- 20% of vested tokens unlock for all recipients
- ~90M tokens become claimable across all vesting buckets:
  - Eden Existing: 40M cliff release
  - Eden Reserve: 10M cliff release
  - Protocol Team: 20M cliff release
  - Community Upfront: 20M cliff release

### Jan 15, 2027 - Jan 15, 2030 (Linear Vesting)
- Remaining 80% streams linearly over 36 months
- ~2.22% per month per recipient
- Recipients can claim accumulated tokens at any time

### Jan 15, 2030 (Vesting Complete)
- 100% of all vested tokens unlocked
- Full 450M vested supply in circulation

---

## Token Distribution at TGE

| Allocation | Amount | Status at TGE |
|------------|--------|---------------|
| Community Programmatic | 300M | Held for airstream (not circulating) |
| Treasury (operational) | 200M | Liquid, held by Treasury |
| LP (Uniswap V4) | 50M | In liquidity pool |
| Vested (locked) | 450M | Locked in vesting contracts |
| **Total** | **1,000M** | |

### Circulating Supply at TGE
- LP: 50M (tradeable)
- Treasury operational: ~200M (held, not circulating)
- **Effective circulating**: 50M (5%)

---

## Addresses (To Be Filled)

```
Admin Multisig:      0x________________________________
Treasury Multisig:   0x________________________________
Distributor:         0x________________________________
Superfluid DAO:      0x________________________________
```

---

## Emergency Procedures

### If deployment fails mid-sequence:
1. DO NOT proceed with partial deployment
2. Document exactly which steps completed
3. Contact team immediately
4. Wait for full team alignment before retry

### If wrong address used:
1. If vesting not started: Can be cancelled and recreated
2. If vesting started: Cannot be changed - recipient owns schedule
3. Document incident for post-mortem

### Gas price spikes:
1. Have 2x expected gas budget ready
2. Can pause between steps if needed
3. Non-urgent steps can wait for lower gas

---

## Contact List

| Role | Name | Contact |
|------|------|---------|
| Protocol Lead | Seth | [to be added] |
| Technical Lead | [TBD] | [to be added] |
| Superfluid Contact | [TBD] | [to be added] |

---

*Last Updated: December 10, 2025*
