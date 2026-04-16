# spirit

Archived monorepo consolidating Henry's work across the **Spirit Protocol + Eden** agent ecosystem — a research-stage AI-agent platform spanning Solidity contracts, agent registries, autonomous-agent prototypes, and token/distribution infrastructure.

This is a **frozen snapshot** as of 2026-04. Most of these projects were prototypes; some remain active and may be pulled back out into their own repos if they graduate.

## Layout

```
spirit/
├── contracts/           # Solidity — contracts, registries, audits
│   ├── spirit.contracts       (own, early prototype)
│   ├── spirit-core            (fork of spirit-protocol/spirit-contracts-core — audited Superfluid)
│   └── streme-fun-contracts   (fork of streme-fun/streme-contracts — AI agent token launcher w/ Superfluid)
├── services/            # TypeScript services & listeners
│   ├── solienne-distributor   (Base manifesto distribution on SaleConfigured events)
│   ├── eden.contract.cache    (AgentRegistry event listener → webhook delivery, Sepolia)
│   └── api.spirits.eden       (backend API)
└── apps/                # Next.js frontends + agent prototypes
    ├── eden.academy           (onboarding / learning site)
    ├── abraham-curator        (Abraham AI agent curator)
    ├── miyomi.ai              (contrarian-market-analysis agent dashboard, AI video)
    └── invaderbot.xyz         (Spirit agent prototype built on top of the Invaders archive)
```

## Contents — what each was

### Contracts

| Path | Original repo | Visibility | What it is |
|---|---|---|---|
| [`contracts/spirit.contracts/`](./contracts/spirit.contracts) | `gitpancake/spirit.contracts` | private | **Early prototype.** Foundry deployment system for Spirit NFT collections + ERC-8004 AI agent registry. Pre-audit; superseded by `spirit-core`. |
| [`contracts/spirit-core/`](./contracts/spirit-core) | `gitpancake/spirit-core` (fork of `spirit-protocol/spirit-contracts-core`) | public | **Audited.** SPIRIT Solidity smart contracts — Superfluid-based implementation. The canonical reference. |
| [`contracts/streme-fun-contracts/`](./contracts/streme-fun-contracts) | `gitpancake/spirit-contracts` (fork of `streme-fun/streme-contracts`) | public | **Fork of streme-fun.** AI Agent token launcher deploying native streaming tokens (Superfluid) with streaming staking rewards + built-in liquidity. Folder renamed to reflect its actual upstream. |

### Services

| Path | Original repo | Visibility | What it is |
|---|---|---|---|
| [`services/solienne-distributor/`](./services/solienne-distributor) | `gitpancake/solienne-distributor` | private | Listens for `SaleConfigured` events on Base and distributes Solienne Manifesto NFTs to active subscribers automatically. |
| [`services/eden.contract.cache/`](./services/eden.contract.cache) | `gitpancake/eden.contract.cache` | private | Production TypeScript event listener for the AgentRegistry contract on Sepolia — syncs contract state and pushes via secure webhook delivery. |
| [`services/api.spirits.eden/`](./services/api.spirits.eden) | `gitpancake/api.spirits.eden` | private | Backend API for the Spirits / Eden agent network. |

### Apps

| Path | Original repo | Visibility | What it is |
|---|---|---|---|
| [`apps/eden.academy/`](./apps/eden.academy) | `gitpancake/eden.academy` | private | Next.js onboarding / learning site for the Eden ecosystem. |
| [`apps/abraham-curator/`](./apps/abraham-curator) | `gitpancake/abraham-curator` | private | Next.js curator frontend for the Abraham AI agent. |
| [`apps/miyomi.ai/`](./apps/miyomi.ai) | `gitpancake/miyomi.ai` | private | Miyomi — autonomous agent dashboard: contrarian market analysis + AI video generation. |
| [`apps/invaderbot.xyz/`](./apps/invaderbot.xyz) | `gitpancake/invaderbot.xyz` | private | Prototype Spirit agent built on top of the Invaders archive. |

## Why this exists

Each subdirectory was originally its own GitHub repo. Consolidated here so the full agent-ecosystem work is in one place, and the originals were deleted to declutter the org.

Each subdirectory keeps its original `README.md`, `package.json` / `foundry.toml`, and lockfiles intact. Dependencies have drifted; treat as reference material rather than runnable code.

## Relationships at a glance

```
                     ┌───────────────────────────┐
                     │ spirit-protocol/          │
                     │   spirit-contracts-core   │◄──── fork ──── contracts/spirit-core
                     │   (audited, canonical)    │
                     └──────────────┬────────────┘
                                    │
                     supersedes     │
                                    │
          contracts/spirit.contracts (own, early prototype)
                                    │
                                    │          ┌──── fork ──── contracts/streme-fun-contracts
                                    │          │              (AI agent token launcher)
                                    ▼          ▼
                          ┌──────────────────────────┐
                          │ Spirit Protocol          │
                          │   + Eden agent network   │
                          └──────────────────────────┘
                                    │
          ┌─────────────────────────┼──────────────────────────────┐
          ▼                         ▼                              ▼
     services/ (listeners + API)   apps/ (frontends)           apps/ (agents)
     - solienne-distributor        - eden.academy             - abraham-curator
     - eden.contract.cache         - invaderbot.xyz           - miyomi.ai
     - api.spirits.eden
```
