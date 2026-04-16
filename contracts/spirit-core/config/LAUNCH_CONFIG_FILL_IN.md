# SPIRIT PROTOCOL - LAUNCH CONFIG

**Fill in this form, then use values to update NetworkConfig.sol and run post-deploy scripts.**

---

## SECTION 1: Deploy Addresses (Required Before `forge script`)

These go into `script/config/NetworkConfig.sol` → `getBaseMainnetConfig()`

```
ADMIN_MULTISIG    = 0x________________________________________
                    ^ Safe multisig (2-of-3 minimum: seth, gene, fred?)

TREASURY          = 0x________________________________________
                    ^ Receives 750M SPIRIT after deploy, LP position, fees
                    ^ Can be same as admin or separate

DISTRIBUTOR       = 0x________________________________________
                    ^ Authorized to call distributeRewards()
                    ^ Can be EOA for speed, or bot address
```

---

## SECTION 2: SPIRIT Token Config

```
TOTAL_SUPPLY      = 1,000,000,000  (1B - standard, probably don't change)

LP_AMOUNT         = ______________  (default 250M, you mentioned 50M)
                    ^ Goes to Uniswap V4 SPIRIT/ETH pool
                    ^ Remaining goes to treasury

TREASURY_RECEIVES = 1B - LP_AMOUNT = ______________ SPIRIT
```

**Example if LP = 50M:**
- LP Pool: 50M SPIRIT
- Treasury: 950M SPIRIT

---

## SECTION 3: Post-Deploy Allocations (Manual Transfers)

After deploy, treasury must transfer SPIRIT to these recipients:

### Superfluid DAO (1% = 10M)

```
SUPERFLUID_DAO_ADDRESS = 0x________________________________________
SUPERFLUID_DAO_AMOUNT  = 10,000,000 SPIRIT (1%)

# Command:
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $SUPERFLUID_DAO_ADDRESS \
    "10000000000000000000000000" \
    --account TREASURY
```

### Other Direct Allocations (if any)

```
# Add rows as needed
RECIPIENT_1 = 0x________________  AMOUNT = ____________ SPIRIT  PURPOSE: ________
RECIPIENT_2 = 0x________________  AMOUNT = ____________ SPIRIT  PURPOSE: ________
```

---

## SECTION 4: Vesting Schedules

These are created post-deploy by calling `SpiritVestingFactory.createSpiritVestingContract()`

### Team Vesting

| Name | Address | Total Amount | Cliff Amount | Cliff Date | End Date |
|------|---------|--------------|--------------|------------|----------|
| Seth | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |
| Gene | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |
| Fred | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |
| _    | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |

### Investor Vesting

| Name/Entity | Address | Total Amount | Cliff Amount | Cliff Date | End Date |
|-------------|---------|--------------|--------------|------------|----------|
| ________    | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |
| ________    | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |

### Advisor Vesting

| Name | Address | Total Amount | Cliff Amount | Cliff Date | End Date |
|------|---------|--------------|--------------|------------|----------|
| Henry | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |
| _____ | 0x_____ | _____ SPIRIT | _____ SPIRIT | YYYY-MM-DD | YYYY-MM-DD |

**Vesting Parameters Explained:**
- `Total Amount`: Full vesting allocation
- `Cliff Amount`: Released immediately at cliff date
- `Cliff Date`: When cliff releases (Unix timestamp in contract)
- `End Date`: When streaming ends (remainder streams linearly cliff→end)

**Example: 12-month cliff, 3-year total vest, 10M allocation, 20% cliff**
- Total: 10,000,000 SPIRIT
- Cliff Amount: 2,000,000 SPIRIT (20%)
- Cliff Date: Dec 10, 2026 (1 year from TGE)
- End Date: Dec 10, 2028 (3 years from TGE)
- Stream: 8M over 2 years = ~10,959 SPIRIT/day after cliff

---

## SECTION 5: Allocation Summary

Fill in to verify totals match 1B:

```
SPIRIT ALLOCATION BREAKDOWN
===========================

LP Pool (Uniswap V4):        ______________ SPIRIT
Superfluid DAO (1%):         ______________ SPIRIT
Team Vesting (total):        ______________ SPIRIT
Investor Vesting (total):    ______________ SPIRIT
Advisor Vesting (total):     ______________ SPIRIT
Other Allocations:           ______________ SPIRIT
Treasury Reserve:            ______________ SPIRIT
                             ──────────────────────
TOTAL:                       1,000,000,000 SPIRIT ✓
```

---

## SECTION 6: Questions for Henry

**Before deploy, confirm with Henry:**

- [ ] Child token streaming is 52 weeks (1 year). You mentioned 1 month. Change needed?
- [ ] Child token supply is 1B with 25/25/25/25 split. Correct?
- [ ] Staking multiplier range is 1× to 36×. Correct?
- [ ] Any other constants that need changing?

**If streaming needs to be 1 month:**
```solidity
// In SpiritFactory.sol, change:
uint64 public constant AIRSTREAM_DURATION = 52 weeks;
// To:
uint64 public constant AIRSTREAM_DURATION = 4 weeks;  // ~1 month
```
This requires recompile + redeploy.

---

## SECTION 7: Launch Day Checklist

### Pre-Deploy
- [ ] All Section 1 addresses filled and verified
- [ ] LP amount decided (Section 2)
- [ ] Allocation math verified (Section 5)
- [ ] Henry confirmed hardcoded constants are correct (Section 6)

### Deploy
- [ ] Run `forge script script/Deploy.s.sol:DeploySpirit --broadcast`
- [ ] Record all deployed addresses
- [ ] Verify contracts on BaseScan

### Post-Deploy (Day 1)
- [ ] Transfer SPIRIT to Superfluid DAO
- [ ] Create all vesting schedules (Section 4)
- [ ] Verify vesting recipients can see balances
- [ ] Test one small stake/unstake cycle

### Post-Deploy (Week 1)
- [ ] Register first agent token (Solienne?)
- [ ] First reward distribution test
- [ ] Monitor Superfluid streams

---

## Quick Commands Reference

```bash
# After filling in this form, update NetworkConfig.sol:
code script/config/NetworkConfig.sol

# Dry run deployment:
forge script script/Deploy.s.sol:DeploySpirit --rpc-url $BASE_RPC_URL

# Real deployment:
forge script script/Deploy.s.sol:DeploySpirit \
    --rpc-url $BASE_RPC_URL \
    --account MAINNET_DEPLOYER \
    --broadcast \
    --verify

# Create vesting (from treasury):
cast send $VESTING_FACTORY "createSpiritVestingContract(address,uint256,uint256,uint32,uint32)" \
    $RECIPIENT \
    $TOTAL_AMOUNT_WEI \
    $CLIFF_AMOUNT_WEI \
    $CLIFF_TIMESTAMP \
    $END_TIMESTAMP \
    --account TREASURY

# Transfer to Superfluid DAO:
cast send $SPIRIT_TOKEN "transfer(address,uint256)" \
    $SUPERFLUID_DAO \
    "10000000000000000000000000" \
    --account TREASURY
```

---

## Timestamp Helper

```bash
# Convert date to Unix timestamp:
date -j -f "%Y-%m-%d" "2026-01-01" "+%s"
# Output: 1735689600

# Common dates:
# Dec 10, 2025 (TGE):      1733788800
# Dec 10, 2026 (TGE + 1y): 1765324800
# Dec 10, 2027 (TGE + 2y): 1796860800
# Dec 10, 2028 (TGE + 3y): 1828483200
```
