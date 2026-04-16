# Claude Code Best Practices for Spirit Protocol

**Purpose:** Optimize Claude Code sessions for Spirit Protocol development  
**Based on:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices  
**Last Updated:** December 14, 2025

---

## Quick Start

Paste this at the start of every Claude Code session:

```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.

<session_config>
- Implement changes rather than suggesting them
- Use parallel tool calls when reading/editing multiple files
- Keep solutions minimal — don't overengineer
- Update SPIRIT_COMMAND_CENTER.md before ending
- Commit work with clear messages
</session_config>

Today I need help with: [specific task]
```

---

## Core Principles

### 1. Be Explicit

Claude 4.x follows instructions precisely. Vague prompts get vague results.

**❌ Vague:**
```
Help me with the website
```

**✅ Explicit:**
```
Audit spiritprotocol.io for investor readiness:
1. Check /presale/ and /investors/ pages load correctly
2. Verify all links work
3. Confirm tokenomics numbers match SPIRIT_TOKENOMICS.md
4. Report any issues found

Do not make changes yet — just report.
```

### 2. Add Context (Explain WHY)

Claude performs better when it understands motivation.

**❌ Without context:**
```
Remove Geppetto from AGENTV
```

**✅ With context:**
```
Remove Geppetto from AGENTV.

Why: Lattice team paused development. Showing inactive agents to investors creates confusion. We only showcase actively-trained agents: Abraham, Solienne, Gigabrain.
```

### 3. Default to Action

Claude 4.x may suggest instead of implement unless told otherwise.

Add to prompts:
```
<default_to_action>
Implement changes rather than only suggesting them. If my intent is unclear, infer the most useful action and proceed. Use tools to discover missing details instead of asking me.
</default_to_action>
```

### 4. Use Parallel Tool Calls

Speed up multi-file work by reading/editing in parallel.

Add to prompts:
```
<use_parallel_tool_calls>
If you need to read or edit multiple files with no dependencies between them, make all calls in parallel. Read 3 files simultaneously rather than sequentially.
</use_parallel_tool_calls>
```

### 5. Avoid Overengineering

Claude 4.x can create unnecessary abstractions. Keep it focused.

Add to prompts:
```
<avoid_overengineering>
Only make changes directly requested or clearly necessary. Keep solutions simple. Don't add features, refactor code, or make "improvements" beyond what's asked. If you create temporary files, clean them up.
</avoid_overengineering>
```

### 6. Control Output Format

Reduce excessive markdown and bullet points.

Add to prompts:
```
<output_format>
Write in clear, flowing prose using complete paragraphs. Reserve markdown for code blocks and simple headings only. Do NOT use bullet points unless explicitly requested.
</output_format>
```

---

## State Management

### Start of Session
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.
```

### End of Session
```
Update SPIRIT_COMMAND_CENTER.md with:
- What was completed
- New blockers discovered
- Files modified

Then commit all changes with a clear message.
```

### Multi-Session Coordination

Spirit Protocol uses these coordination files:

| File | Purpose | Location |
|------|---------|----------|
| `SPIRIT_COMMAND_CENTER.md` | Daily coordination, blockers, status | spirit-contracts-core |
| `SPIRIT_IDEAS_BACKLOG.md` | Post-TGE ideas parking lot | spirit-contracts-core |
| `SESSION_NOTES_*.md` | Per-session logs | Each repo |

---

## Session Templates

### Template: Critical Execution (e.g., Investor Prep)
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.

<default_to_action>
Implement changes rather than suggesting them. Infer intent and proceed.
</default_to_action>

<use_parallel_tool_calls>
Read/edit multiple files in parallel when no dependencies exist.
</use_parallel_tool_calls>

Focus: [specific focus]

Tasks:
1. [task 1]
2. [task 2]
3. [task 3]

Context:
- [relevant context]
- [constraints]

Why this matters: [motivation]

Do NOT touch: [files owned by other sessions]
```

### Template: Exploration/Research
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.

<investigate_before_answering>
Read and understand relevant files before proposing changes. Do not speculate about code you haven't inspected.
</investigate_before_answering>

Focus: [what you're exploring]

Questions:
1. [question 1]
2. [question 2]

After investigation, summarize findings. Do not make changes without confirmation.
```

### Template: Planning Only (No Implementation)
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.

<planning_mode>
This is a PLANNING session. Create documentation only. Do not write code or make changes.
</planning_mode>

Focus: [what you're planning]

Create a PLANNING.md with:
1. Architecture decisions
2. Scope definition
3. Dependencies
4. File structure
5. Timeline

Output: Single planning document. No code.
```

### Template: Bug Fix / Quick Change
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.

<minimal_change>
Make only the specific fix requested. Do not refactor surrounding code or add improvements.
</minimal_change>

Fix: [specific issue]

Location: [file path if known]

Expected behavior: [what it should do]

Current behavior: [what it does now]

After fix: Verify it works, commit with message describing the fix.
```

---

## Spirit Protocol Repo Guide

### Source of Truth
```
~/spirit-contracts-core/
├── SPIRIT_TOKENOMICS.md          ← Canonical tokenomics
├── SPIRIT_COMMAND_CENTER.md      ← Cross-session coordination
├── SPIRIT_IDEAS_BACKLOG.md       ← Post-TGE ideas
├── config/tokenomics.json        ← Machine-readable tokenomics
├── config/vesting_schedule.csv   ← Vesting data
└── docs/                         ← Explanatory docs
```

### Active Repos

| Repo | Purpose | Branch |
|------|---------|--------|
| `spiritprotocol.io` | Marketing site | beta |
| `agentv.spiritprotocol.io` | Agent showcase | main |
| `spirit-contracts-core` | Contracts + config | main |
| `spirit-whitepaper-temp` | Whitepaper drafts | main |

### Files to Avoid (Recently Modified)
Check SPIRIT_COMMAND_CENTER.md for current "Do Not Touch" list.

---

## Common Pitfalls

### 1. Not Reading Context First
Always start with:
```
Read ~/spirit-contracts-core/SPIRIT_COMMAND_CENTER.md for context.
```

### 2. Suggesting Instead of Doing
Add `<default_to_action>` block to prompts.

### 3. Creating Unnecessary Files
Add `<avoid_overengineering>` block. Ask Claude to clean up temp files.

### 4. Editing Files Owned by Other Sessions
Check SPIRIT_COMMAND_CENTER.md for file ownership before editing.

### 5. Not Committing Work
Always end sessions with:
```
Commit all changes with a clear message, then push.
```

### 6. Losing State Between Sessions
Update SPIRIT_COMMAND_CENTER.md before closing any session.

---

## Prompt Snippets

### Force Investigation Before Action
```
<investigate_before_answering>
Never speculate about code you haven't opened. Read relevant files BEFORE answering questions or proposing changes.
</investigate_before_answering>
```

### Encourage Thinking After Tool Use
```
<reflect_on_results>
After receiving tool results, reflect on their quality and determine optimal next steps before proceeding.
</reflect_on_results>
```

### Research Mode
```
<structured_research>
Search for information systematically. Develop competing hypotheses. Track confidence levels. Verify across multiple sources before concluding.
</structured_research>
```

### Verbose Progress Updates
```
<verbose_updates>
After completing each task, provide a quick summary of what you did before moving to the next task.
</verbose_updates>
```

### Minimal Updates (Speed Mode)
```
<minimal_updates>
Work efficiently without verbose summaries. Only report when tasks are complete or when you encounter blockers.
</minimal_updates>
```

---

## TGE Countdown Context

When working on Spirit Protocol, include timeline awareness:

```
Timeline context:
- TGE: January 15, 2026
- NYC fundraising: December 15-20
- Address collection deadline: December 29
- App MVP: December 21-28 (Phase 2)

Prioritize work that unblocks TGE. Park nice-to-haves in SPIRIT_IDEAS_BACKLOG.md.
```

---

## Adding to This File

When you discover new patterns that work well:

```
Add to ~/spirit-contracts-core/CLAUDE_CODE_BEST_PRACTICES.md:

## [New Pattern Name]

[Description of when to use it]

Add to prompts:
```
[prompt snippet]
```
```

---

*Optimized prompts → Better sessions → Faster TGE*
