# Spirit Protocol — Ideas Backlog
**Purpose:** Capture good ideas without derailing TGE execution
**Review after:** January 20, 2026 (post-TGE stabilization)

---

## How to Use This File

1. Add ideas here when they come up
2. Don't act on them until after TGE
3. Review weekly in planning sessions (not daily execution)
4. Move to SPIRIT_COMMAND_CENTER.md when ready to execute

---

## 🔮 INFRASTRUCTURE IDEAS

### MCP (Model Context Protocol) Integration
**Added:** December 14, 2025
**Source:** https://modelcontextprotocol.io/docs/getting-started/intro
**Priority:** Post-TGE (February 2026)

**What it is:**
- Anthropic's open standard for connecting AI apps to external systems
- "USB-C for AI" — universal connector between AI apps and data/tools

**Spirit opportunities:**

1. **Spirit agents as MCP servers**
   - Abraham, Solienne, Gigabrain expose MCP endpoints
   - Other AI apps can connect: "Connect to Solienne" → access archive, request manifesto
   - Makes Spirit agents interoperable with Claude, ChatGPT, any MCP client

2. **Spirit Protocol as MCP server**
   - Expose staking data, agent registry, revenue flows via MCP
   - Any AI app can query: "What agents are live? What's Abraham's revenue?"
   - Spirit becomes canonical source for agent economics

3. **Agent-to-agent coordination**
   - Gigabrain connects to Abraham for art analysis
   - Solienne queries Gigabrain for research
   - Creates true "agent economy" at protocol level

**Strategic positioning:**
> "Spirit Protocol is the economic layer for AI agents. MCP is the connectivity layer. Together, they make agents that can both *do things* and *get paid for them*."

**Implementation sketch:**
- Build MCP server SDK for Spirit agents
- Document MCP integration in developer docs
- Add to marketing: "Spirit agents are MCP-native"

---

### AGENTS.md for Spirit Repos
**Added:** December 14, 2025
**Source:** https://agents.md/
**Priority:** Quick win (can do in 30 min anytime)

**What it is:**
- Markdown file that tells AI coding agents how to work with a codebase
- Like README but for AI — used by 60k+ repos including OpenAI Codex
- Works with Claude Code, Cursor, Codex, Devin, etc.

**Immediate implementation:**

Add to `spirit-contracts-core/AGENTS.md`:
```markdown
# AGENTS.md

## Source of Truth
- SPIRIT_TOKENOMICS.md is canonical for all tokenomics data
- config/tokenomics.json is machine-readable version
- SPIRIT_COMMAND_CENTER.md has cross-session coordination

## Do Not Modify Without Review
- Contract constants in StakingPool.sol and SpiritFactory.sol are hardcoded
- Any changes require recompile and redeploy

## Testing
- Testnet: Base Sepolia
- Run: forge test
- Addresses in SPIRIT_COMMAND_CENTER.md

## Code Style
- Solidity 0.8.x
- Foundry framework
- NatSpec comments on all public functions
```

Add to `spiritprotocol.io/AGENTS.md`:
```markdown
# AGENTS.md

## Build
- npm install
- npm run dev (local)
- npm run build (production)

## Deploy
- vercel --yes (preview)
- vercel --prod --yes (production)

## Source of Truth
- Tokenomics: fetch from spirit-contracts-core, not local copy
- Config: src/static/config/ for agents.json, tokenomics.json

## Style
- Eleventy (11ty) static site
- Nunjucks templates
- Terminal/Swiss aesthetic
- ASCII art max 65 chars wide
```

**Why this matters:**
- Every Claude Code session becomes more effective immediately
- Less context needed per session
- Works across all AI coding tools

---

## 🎨 DESIGN IDEAS

### POV/Lens System for spiritprotocol.io
**Added:** December 14, 2025
**Inspiration:** https://parallel.ai/ai/about (Human/AI toggle)
**Priority:** Post-TGE polish (Phase 5)

**Concept:**
Perspective-switching between Spirit's 4 stakeholder pillars:
- Artist/Trainer View
- Agent View
- Platform View
- Collector View

**Pattern from Parallel.ai:**
- Explicit toggle between HUMAN and AI perspective
- Same content, different framing
- Creates "aha" moment showing how each side sees the relationship

**Where it would live:**
- Homepage: lightweight copy swap under ASCII diagram
- Vibecode scroll: richer narrative alternating Human vs Agent POV
- Pillar pages: tabs or section-level "Human POV / Agent POV" pairs

**Implementation constraints:**
- Keep Swiss + terminal aesthetic
- ASCII-first diagrams (max 65 chars)
- No framework rewrites — lightweight HTML/CSS + minimal JS
- Preserve "iceberg" architecture (simple homepage, depth in pillars)

**Full planning prompt saved below for when ready:**

---

<details>
<summary>Full POV System Planning Prompt (click to expand)</summary>

```
PLANNING MODE ONLY — do not implement yet.

Goal:
Plan the next iteration of spiritprotocol.io inspired by the perspective-switching
pattern on https://parallel.ai/ai/about — i.e., explicit toggling between HUMAN view
and AGENT view — adapted to Spirit's 4 stakeholder pillars (Artist/Trainer, Agent,
Platform, Collector).

Context / constraints:
- Work only against the beta branch conceptually (beta.spiritprotocol.io)
- Preserve the "iceberg" architecture:
  - Homepage stays simple and fast
  - Depth lives in the pillar pages
  - Developers/About/Connect/Resources remain horizontal
- Keep Spirit style: Swiss + terminal aesthetic + ASCII-first diagrams (max 65 chars)
- Do not invent or change tokenomics numbers
- No big framework rewrites. Prefer lightweight HTML/CSS + minimal JS

Deliverable:
A clear, prioritized implementation plan for a "POV / Lens system" across the site.

Plan requirements:
1) Explain the pattern you are borrowing from Parallel.ai (2–4 bullets)
2) Specify exact POV/lenses for Spirit (Artist, Agent, Platform, Collector + Developer?)
3) Decide where POV switching lives (homepage, vibecode, pillar pages)
4) For each target page outline: changes, unchanged, ASCII diagrams, default POV
5) UX/UI spec: toggle style, position, mobile, accessibility
6) Technical spec: minimal JS, state storage (URL param, localStorage), LLM readability
7) LLM-friendly content: interaction with <!-- LLM SUMMARY --> blocks
8) Prioritization: P0 (proof), P1 (extend), P2 (polish)
9) File touch list

Important:
- Do not output code yet. Output actionable, scoped plan.
- Think "engineer can implement in 1–3 focused PRs".
```

</details>

---

## 📋 QUICK WINS (Can Do Anytime in 30 Min)

| Idea | Effort | Impact | When |
|------|--------|--------|------|
| Add AGENTS.md to spirit-contracts-core | 15 min | Medium | Anytime |
| Add AGENTS.md to spiritprotocol.io | 15 min | Medium | Anytime |
| Add AGENTS.md to agentv.spiritprotocol.io | 15 min | Low | Post-TGE |

---

## 🗓️ REVIEW SCHEDULE

| Date | Action |
|------|--------|
| Jan 20, 2026 | First post-TGE review of this backlog |
| Feb 1, 2026 | Prioritize MCP integration |
| Feb 15, 2026 | POV system if site traffic warrants |

---

## Adding New Ideas

When you have a new idea, tell Claude Code:

```
Add to SPIRIT_IDEAS_BACKLOG.md:

## [Idea Name]
**Added:** [date]
**Source:** [link if any]
**Priority:** [Post-TGE / Quick win / Future]

[Description]
```

---

*Don't let good ideas die. Don't let them distract you either.*
