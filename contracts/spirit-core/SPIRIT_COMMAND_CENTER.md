# Spirit Protocol Command Center
**Generated:** December 14, 2025
**TGE:** January 15, 2026 (32 days)
**NYC Fundraising Week:** December 15-20, 2025 (STARTS TOMORROW)

---

## 🚨 BLOCKERS (Must Resolve)

| Blocker | Owner | Status | Impact |
|---------|-------|--------|--------|
| **Pierre confirmation** (36x multiplier, LP allocation) | Seth → Pierre | ⏳ Awaiting response | Can't finalize whitepaper |
| **Gigabrain Eden ID** | Gene | 🔴 Not requested yet | AGENTV Channel 3 |
| **Aerodrome intro** | Seth (via Will Papper?) | 🔴 Not started | Ignition setup |
| **35 wallet addresses** | Seth → recipients | 🟡 Form verified ✓, templates ready, send outreach | Vesting contracts |
| **Fundraising materials** | Seth | ✅ Done | One-pager, offer terms, 66-name CRM |

---

## 📊 REPOSITORY STATUS

| Repo | Local Path | Branch | Git Status | Last Commit |
|------|------------|--------|------------|-------------|
| **spiritprotocol.io** | `/Users/seth/spiritprotocol.io/` | main | ✅ Clean | Dec 14 - merged beta, removed min investment |
| **agentv.spiritprotocol.io** | `/Users/seth/agentv.spiritprotocol.io/` | main | ✅ Clean | Dec 13 - 54 files committed |
| **spirit-contracts-core** | `/Users/seth/spirit-contracts-core/` | main | Modified | Source of truth |
| **spirit-whitepaper-temp** | `/Users/seth/spirit-whitepaper-temp/` | - | Session notes only | - |

### Source of Truth (CANONICAL)
```
/Users/seth/spirit-contracts-core/
├── SPIRIT_TOKENOMICS.md          ← THE source of truth (Dec 13)
├── SPIRIT_COMMAND_CENTER.md      ← THIS FILE
├── SPIRIT_IDEAS_BACKLOG.md       ← Post-TGE ideas (Dec 14)
├── APP_PLANNING.md               ← app.spiritprotocol.io MVP plan (Dec 14)
├── config/tokenomics.json        ← Machine-readable (Dec 10)
├── config/vesting_schedule.csv   ← Individual allocations
├── fundraising/                  ← NYC fundraising materials (Dec 14)
│   ├── ONE_PAGER.md              ← Cultural framing, 3 formats
│   ├── OFFER_TERMS.md            ← Copy-paste terms
│   └── PRESALE_INVESTORS.csv     ← 66 prospects, 11 tiers
└── docs/
    ├── SPIRIT_STAKING_EXPLAINED.md    ← (Dec 14)
    └── DESIGN_YOUR_TOKEN_UTILITY.md   ← (Dec 14)
```

**OUTDATED - DO NOT USE:**
- `/Users/seth/spirit-narrative-hub/` (Nov 24 version)
- Any `TOKENOMICS_SOURCE_OF_TRUTH.md` outside spirit-contracts-core

---

## 🔴 ACTIVE CLAUDE CODE SESSIONS

| Session | Plan File | Focus | Status |
|---------|-----------|-------|--------|
| `quirky-singing-sun` | `/Users/seth/.claude/plans/quirky-singing-sun.md` | AGENTV + spiritprotocol.io | Phase 0 DONE, Phase 1 active |
| `modular-purring-frog` | `/Users/seth/.claude/plans/modular-purring-frog.md` | Whitepaper, contract constants | Waiting on Pierre |
| `hashed-rolling-hearth` | `/Users/seth/.claude/plans/hashed-rolling-hearth.md` | Website multi-perspective review | P0 done, P1/P2 pending |

### Files Currently "Owned" (Don't Edit in Other Sessions)

| File | Owned By | Reason |
|------|----------|--------|
| `spiritprotocol.io/src/pages/staking.njk` | hashed-rolling-hearth | Just created |
| `spiritprotocol.io/src/pages/terminal.njk` | hashed-rolling-hearth | Modified |
| `spirit-contracts-core/docs/*` | modular-purring-frog | New docs created |
| `agentv.spiritprotocol.io/*` | quirky-singing-sun | Just committed |

### Safe to Work On (No Active Session)
- `spiritprotocol.io/src/pages/vibecode.njk` (artist voice centering)
- `spiritprotocol.io/src/pages/agents.njk` (rename to Developers)
- `spiritprotocol.io/src/pages/onboard.njk` (lighter path)
- Any NEW files
- NODE / artist relations work
- Solienne daily practice
- Fundraising materials (deck, one-pager, CRM)

---

## ✅ COMPLETED (Dec 8-14)

### Infrastructure
- [x] AGENTV: 54 files committed, deployed to Vercel
- [x] AGENTV: Redesigned with agent info panels (Dec 14) — Abraham, Solienne, Gigabrain, Spirit Universe
- [x] spiritprotocol.io: beta branch pushed, staking guide live
- [x] Staking page: https://beta.spiritprotocol.io/staking/
- [x] Terminal `staking` command added
- [x] TGE dates updated throughout site (Jan 15, 2026)

### Documentation
- [x] SPIRIT_TOKENOMICS.md consolidated (Dec 13)
- [x] SPIRIT_STAKING_EXPLAINED.md created (Dec 14)
- [x] DESIGN_YOUR_TOKEN_UTILITY.md created (Dec 14)
- [x] ADDRESS_COLLECTION_OUTREACH.md drafted (35 recipients)
- [x] TREASURY_OPERATIONS_PLAN.md drafted
- [x] Spirit Agent system prompt v5.0 (4 stakeholder modes)
- [x] SUPERFLUID_HANDOFF_DEC_14.md created — Ready to send to Pierre

### Smart Contracts
- [x] Audit complete (0xSimao, Nov 28)
- [x] Testnet deployed (Base Sepolia)
- [x] Contract addresses documented

---

## ⏳ IN PROGRESS (This Week: Dec 14-20)

### Phase 1 Tasks (from quirky-singing-sun plan)
- [ ] Send address collection outreach (35 recipients)
- [ ] Stand up Admin Safe (2-of-3 multisig)
- [ ] Stand up Treasury Safe (2-of-3 multisig)
- [ ] Ask Superfluid for DAO multisig address
- [ ] Put config files in spiritprotocol.io/src/static/config/

### Waiting On External
- [x] Pierre: Multiplier confirmed (1w=1x, 52w=12x, 156w=36x) ✅
- [ ] Pierre: Token split modification (25% Platform, 20% Agent, 5% LP) — reply drafted
- [ ] Pierre: Testnet clarification (Eth Sepolia vs Base Sepolia for testing)
- [ ] Pierre: LP mechanics (5% single-sided from Agent allocation?)
- [ ] Pierre: Platform allocation configurability (per-agent or hardcoded?)
- [ ] Gene: Gigabrain Eden ID
- [ ] Amin: Respond to 20hr/$3K support hours proposal

### NYC Fundraising (CRITICAL - STARTS TOMORROW)
- [x] One-pager (cultural framing) — `fundraising/ONE_PAGER.md`
- [x] Offer terms paragraph — `fundraising/OFFER_TERMS.md`
- [x] CRM with 66 names — `fundraising/PRESALE_INVESTORS.csv`
- [ ] 10-slide deck (have 15-slide visual deck already)
- [ ] Data room link

---

## 📅 EXECUTION PHASES

### Phase 0: Dec 13-14 ✅ DONE
- Commit AGENTV
- Deploy AGENTV
- Commit spiritprotocol.io beta
- Push beta to remote

### Phase 1: Dec 14-20 (THIS WEEK)
- Address collection outreach
- Multisig setup
- Config files in repo
- **NYC fundraising push**

### Phase 2: Dec 21-28
- app.spiritprotocol.io scaffold (see `APP_PLANNING.md`)
- Base Sepolia dry-run
- Aerodrome Ignition config

### Phase 3: Jan 1-12
- App wiring to contracts
- Beta → main merge
- AGENTV custom domain (stretch)

### Phase 4: Jan 15 (TGE)
- Deploy mainnet contracts
- Create vesting contracts
- Seed LP
- Presale closes

### Phase 5: Post-TGE
- AGENTV RedZone restructure
- Config repo extraction (optional)
- First agent token launches

---

## 💰 TOKENOMICS SNAPSHOT

**Total Supply:** 1B SPIRIT on Base

| Bucket | Amount | % | Status |
|--------|--------|---|--------|
| Community Programmatic | 300M | 30% | Airstreamed to agents |
| Treasury | 250M | 25% | OTC/LP/Presale/Airdrops |
| Eden Incubation (Existing) | 200M | 20% | 8 recipients identified |
| Eden Incubation (Reserve) | 50M | 5% | TBD |
| Protocol Team | 100M | 10% | Seth + future team |
| Community Upfront | 100M | 10% | 24 recipients identified |

**Presale:** 50M @ $0.04 = $2M raise target
**Vesting:** 12m cliff + 36m linear (no cliff for presale per Will Papper)

---

## 🌐 LIVE URLS

| Property | URL | Status |
|----------|-----|--------|
| Production site | https://spiritprotocol.io | ✅ Live (main branch) |
| Beta site | https://beta.spiritprotocol.io | ✅ Live (beta branch) |
| Staking guide | https://spiritprotocol.io/staking/ | ✅ Live (production) |
| AGENTV | https://agentvspiritprotocol-faozvrzko-sethvibes.vercel.app | ✅ Deployed (Dec 14 - agent info panels) |
| app.spiritprotocol.io | Does not exist | 🔴 Phase 2 |
| Budget dashboard | https://spirit-protocol-budget.vercel.app | ✅ Live |

---

## 🤖 AGENT IDS

| Agent | Eden ID | Status |
|-------|---------|--------|
| Abraham | `65282c1944602de1187ccc5e` | ✅ Live |
| Solienne | `67f8af96f2cc4291ee840cc5` | ✅ Live |
| Spirit Agent | `690a8ad39aa43032fcafe498` | ✅ Live on beta |
| Gigabrain | **TBD - GET FROM GENE** | 🔴 Blocking |

---

## 📋 CONTRACT CONSTANTS (Hardcoded - Cannot Change)

### StakingPool.sol
- MIN_MULTIPLIER = 10,000 (1x)
- MAX_MULTIPLIER = 360,000 (36x) ← **Confirm with Pierre**
- MINIMUM_LOCKING_PERIOD = 1 week
- MAXIMUM_LOCKING_PERIOD = 156 weeks (3 years)
- STAKEHOLDER_LOCKING_PERIOD = 52 weeks
- STAKEHOLDER_AMOUNT = 250M

### SpiritFactory.sol
- CHILD_TOTAL_SUPPLY = 1B
- DEFAULT_LIQUIDITY_SUPPLY = 250M
- AIRSTREAM_SUPPLY = 250M
- AIRSTREAM_DURATION = 52 weeks ← **Confirm with Pierre**
- DEFAULT_POOL_FEE = 1%

### Testnet Addresses (Base Sepolia)
- SPIRIT Token: `0xc7e9de362C6eA2Cc03863ECe330622146Ff1c18B`
- Reward Controller: `0x1390A073a765D0e0D21a382F4F6F0289b69BE33C`
- Staking Pool Beacon: `0x6A96aC9BAF36F8e8b6237eb402d07451217C7540`
- Spirit Factory: `0x879d67000C938142F472fB8f2ee0b6601E2cE3C6`
- Vesting Factory: `0x94bea63d6eC10AF980bf8C7aEFeE04665D355AFe`

---

## 👥 KEY CONTACTS

| Name | Role | Pending Action |
|------|------|----------------|
| Gene Kogan | Eden co-founder, Abraham | Get Gigabrain ID |
| Pierre | Superfluid | Confirm multiplier, LP allocation |
| Henry Pye | Smart contracts | Config confirmation sent |
| Will Papper | Advisor | Ask for Aerodrome intro |
| Xander | Eden infra, Gigabrain | - |

---

## 🎯 TODAY'S PRIORITIES (Dec 14)

### Must Do Before NYC (Tomorrow)
1. **Draft one-pager** (can do now with existing materials)
2. **Finalize offer terms paragraph** (in tracker, needs polish)
3. **Start CRM** (Google Sheet with 30 names)

### Can Delegate / Defer
- AGENTV RedZone (post-TGE)
- app.spiritprotocol.io scaffold (Phase 2)
- Config repo extraction (not needed for v1)

### Blocked Until Response
- Whitepaper finalization (Pierre)
- ~~Beta → main merge~~ ✅ DONE (Dec 14)
- AGENTV Channel 3 (Gigabrain ID)

---

## 📁 FILE LOCATIONS REFERENCE

```
/Users/seth/
├── spiritprotocol.io/              ← Marketing site (beta branch active)
│   ├── src/pages/staking.njk       ← NEW
│   ├── src/static/config/          ← Put agents.json, tokenomics.json here
│   └── SESSION_NOTES.md
├── spirit-contracts-core/          ← SOURCE OF TRUTH
│   ├── SPIRIT_TOKENOMICS.md        ← Canonical tokenomics
│   ├── SPIRIT_COMMAND_CENTER.md    ← THIS FILE
│   ├── config/tokenomics.json
│   ├── config/vesting_schedule.csv
│   └── docs/                       ← Staking + utility guides
├── agentv.spiritprotocol.io/       ← AGENTV broadcast interface
├── spirit-whitepaper-temp/         ← Whitepaper work
│   └── SESSION_NOTES_DEC_14_2025.md
├── spirit-narrative-hub/           ← OUTDATED - don't use
└── .claude/plans/                  ← Active Claude Code plans
    ├── quirky-singing-sun.md
    ├── modular-purring-frog.md
    └── hashed-rolling-hearth.md
```

---

## 🔄 TO START A NEW CLAUDE CODE SESSION

```
Read these files for context:
- /Users/seth/spirit-contracts-core/SPIRIT_TOKENOMICS.md
- /Users/seth/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md
- [relevant SESSION_NOTES file for that repo]

Today I need help with: [specific task]

Active plans to be aware of:
- quirky-singing-sun (AGENTV + site)
- modular-purring-frog (whitepaper)
- hashed-rolling-hearth (website review)
```

---

*Generated by Claude from session notes*
*Last updated: December 14, 2025*
