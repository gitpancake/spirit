# Solienne Distributor - Agent Guide

## Project Overview

Solienne Distributor is a long-running TypeScript service that automatically distributes NFT manifestos to active subscribers on the Base blockchain. It listens for `SaleConfigured` events emitted by the V2 minter smart contract via Alchemy WebSockets, then calls `distributeToSubscribersBatch()` on-chain to deliver manifestos to all active subscribers aggregated from V1, V2, and V3 contracts.

## Architecture

```
src/
├── index.ts                          # Entry point - orchestrates all services
├── config/
│   ├── env.ts                        # Environment config loading & validation
│   └── logger.ts                     # Pino structured logging setup
├── contracts/
│   └── abi.ts                        # Smart contract ABI definitions (V1, V2/V3)
└── services/
    ├── EventListener.ts              # Alchemy WebSocket event listener
    ├── Distributor.ts                # Distribution logic & contract interactions
    ├── RetryManager.ts               # Exponential backoff retry utility
    └── DistributionTracker.ts        # Redis-based distribution tracking (daily + persistent)
```

### Service Responsibilities

- **`SolienneDistributor`** (`src/index.ts`): Top-level orchestrator. Creates all services, validates wallet setup on startup, runs catch-up distribution for any missed manifestos, registers event handlers, starts the WebSocket listener, and handles graceful shutdown (SIGTERM/SIGINT/uncaught exceptions).

- **`EventListener`** (`src/services/EventListener.ts`): Connects to Alchemy WebSocket API, subscribes to `SaleConfigured(uint256,uint256,uint256,uint256,uint256)` events filtered by the minter contract address, parses logs with ethers.js, and dispatches to registered handlers. Has auto-reconnect logic (max 10 attempts, 5s delay).

- **`Distributor`** (`src/services/Distributor.ts`): Core business logic. Fetches active subscribers from V1, V2, and V3 contracts in parallel (without deduplication -- duplicates are allowed), then calls `distributeToSubscribersBatch()` on the active contract in batches of 200 (matching the contract's `MAX_BATCH_SIZE`). All batches are processed so subscriber counts >200 are fully served. Also provides `getAllManifestoIds()` (enumerates sales across all contracts), `getLatestManifestoId()`, `getBalance()`, and `getGasPrice()` helpers.

- **`RetryManager`** (`src/services/RetryManager.ts`): Static utility providing `retry<T>()` with configurable max retries (default 3), initial delay (default 2000ms), and exponential backoff (2x multiplier). Used for distribution calls.

- **`DistributionTracker`** (`src/services/DistributionTracker.ts`): Redis-backed tracker with two mechanisms: (1) a persistent set `distributed:manifesto_ids` (no TTL) that tracks all manifesto IDs ever distributed, and (2) daily keys `distribution:YYYY-MM-DD` (48h TTL) for quick "did we distribute today" checks. On first deploy, seeds the persistent set with IDs 1 through `LAST_DISTRIBUTED_MANIFESTO_ID`. Fails open (returns false/null on error to allow distribution to proceed).

### Runtime Flow

1. Load and validate environment config (crashes on missing required vars)
2. Initialize provider, wallet, and contract instances (active contract required; V1/other optional)
3. Connect to Redis
4. Validate wallet has ETH balance
5. **Startup catch-up**: seed Redis persistent set (first deploy only), enumerate all manifesto IDs across all contracts, distribute any that aren't in the persistent set
6. Subscribe to `SaleConfigured` events via Alchemy WebSocket
7. On event: extract `manifestoId` -> fetch all subscribers (V1+V2+V3 in parallel) -> distribute in batches -> mark in both Redis persistent set and daily key
8. On shutdown: stop listener, close Redis, exit cleanly

## Tech Stack

- **TypeScript** (strict mode, ES2022 target, CommonJS modules)
- **ethers.js v6** for all Ethereum interactions (provider, wallet, contract calls, ABI parsing)
- **alchemy-sdk** for WebSocket event subscriptions
- **ioredis** for Redis-based distribution tracking
- **pino** for structured JSON logging (with pino-pretty for development)
- **dotenv** for environment configuration

## Key Conventions

- All smart contract addresses are checksummed via `ethers.getAddress()` on load.
- Private keys are validated by constructing an `ethers.Wallet` during config loading.
- Gas configuration supports EIP-1559 (`maxFeePerGas`, `maxPriorityFeePerGas`) specified in gwei.
- V2 is the active minter contract used for events and distribution. V1 and V3 are optional read-only subscriber sources.
- Errors in V1/V3 subscriber fetching are caught and logged; the service continues with whichever contracts succeed.
- The `DistributionTracker` fails open -- if Redis is unreachable, distributions proceed rather than being blocked.
- Logging uses child loggers per component (`createLogger('ComponentName')`).
- The codebase uses `as const` assertions on ABI arrays for type safety.

## Build & Run

```bash
npm run build        # Compile TypeScript -> dist/
npm start            # Run compiled JS (production)
npm run dev          # Run with ts-node (development)
npm run dev:watch    # Run with nodemon auto-reload
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint
npm run format       # Prettier
```

A Husky pre-commit hook runs `npm run build` to catch TypeScript errors before commits.

## Required Environment Variables

| Variable | Description |
|---|---|
| `CHAIN_ID` | `8453` (Base Mainnet) or `84532` (Base Sepolia) |
| `RPC_URL` | Ethereum JSON-RPC endpoint |
| `ALCHEMY_API_KEY` | Alchemy API key for WebSocket subscriptions |
| `REDIS_URL` | Redis connection URL |
| `MINTER_CONTRACT_ADDRESS` | Active minter contract (V2 - events + distribution + subscribers) |
| `DISTRIBUTOR_PRIVATE_KEY` | Wallet private key for sending distribution transactions |

Optional: `SUBSCRIBERS_ADDRESS_V2` (additional subscriber contract), `SUBSCRIBERS_ADDRESS_V1` (legacy subscribers), `LAST_DISTRIBUTED_MANIFESTO_ID` (seed baseline, default 30), `GAS_LIMIT`, `MAX_FEE_PER_GAS`, `MAX_PRIORITY_FEE_PER_GAS`, `LOG_LEVEL`, `LOG_PRETTY`, `NODE_ENV`.

## Smart Contract Versions

- **V1** (`FixedPriceManifestoMinter`): Original contract. Has `manifestoDistributed` on-chain guard and checks `isActive()` during distribution. Used read-only for subscriber fetching and sale enumeration.
- **V2** (`FixedPriceManifestoMinterV2`): Active contract. Checks `isActive()` during distribution. Added `subscribeFor()` for gift subscriptions. Used for events, distribution, and subscriber fetching. Sale IDs start at 10.
- **V3** (`FixedPriceManifestoMinterV3`): Does not check `isActive()` during distribution. Used read-only for subscriber fetching and sale enumeration. Sale IDs start at 10.

## Gotchas & Important Details

- V2's `distributeToSubscribersBatch()` checks `isActive()` on-chain, so inactive subscribers in the list are safely skipped.
- Subscriber lists are combined WITHOUT deduplication. An address subscribed on both V1 and V2 will appear twice and receive multiple copies. This is by design.
- All batches are processed when there are >200 subscribers (multiple transactions of 200 each).
- The `EventListener` exits the process (`process.exit(1)`) if max reconnect attempts (10) are exhausted.
- Redis keys use UTC dates. The 48-hour TTL is a buffer for timezone edge cases.
- On startup, the service enumerates ALL sales across ALL contracts, finds every manifesto ID, checks the persistent Redis set, and distributes any that are missing. On first deploy, IDs 1 through `LAST_DISTRIBUTED_MANIFESTO_ID` (default 30) are seeded as already distributed.
- V1 sale IDs start at 0; V2 and V3 sale IDs start at 10.
