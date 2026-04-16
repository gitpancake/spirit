# Henry Config Confirmation - Copy to Telegram

**Send to**: Henry
**Subject**: Spirit Protocol contract config confirmation before Jan 15 TGE

---

## Message to Copy:

```
Hey Henry - quick config check before we finalize for Jan 15 TGE.

Three questions on hardcoded constants in the contracts:

1. **Child token streaming duration**
   Current: 52 weeks (1 year)
   You mentioned 1 month at some point - which is correct?
   Location: SpiritFactory.sol AIRSTREAM_DURATION

2. **Child token supply split**
   Current: 1B with 25/25/25/25
   - 250M → Uniswap LP
   - 250M → Airstream to SPIRIT holders
   - 250M → Artist (locked 52 weeks)
   - 250M → Agent wallet (locked 52 weeks)
   Correct?

3. **Staking multiplier range**
   Current: 1× to 36×
   Correct?

If any of these need changes, we'll need to recompile before mainnet deploy.

Also FYI we have:
- Audit complete (0xSimao, Nov 28)
- Testnet working (Base Sepolia)
- Tokenomics config done
- Now collecting 35 wallet addresses for vesting

Let me know if you need anything else from my side.
```

---

## Context for Seth

**Why these questions matter:**

1. **Airstream duration** - If it's 1 month instead of 52 weeks, the entire child token distribution model changes. 1 month = faster distribution, more liquid market faster. 52 weeks = slower, more aligned with long-term holders.

2. **25/25/25/25 split** - This is the core agent token economics. If the split changes, all documentation and projections need updating.

3. **Multiplier range** - Affects staking incentives. 36× max means long-term stakers get significant bonus.

**If Henry confirms all correct**: No contract changes needed, proceed with address collection.

**If Henry wants changes**: Need to update constants, recompile, redeploy to testnet, verify, then proceed.

---

## Status After Sending

- [ ] Message sent to Henry
- [ ] Henry confirmed streaming duration (52 weeks / 1 month / other)
- [ ] Henry confirmed supply split (25/25/25/25 or different)
- [ ] Henry confirmed multiplier range (1-36× or different)
- [ ] All clear for deployment
