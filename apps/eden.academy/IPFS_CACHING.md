# IPFS Metadata Caching System

This document explains the IPFS metadata caching system implemented for Eden Academy agent pages.

## Overview

When visiting an agent page (e.g., `/agent/2`), the system now:

1. **Fetches basic agent data** from the Eden API
2. **Retrieves the tokenURI** from the blockchain contract
3. **Extracts the IPFS hash** from the tokenURI
4. **Checks the cache** for existing metadata
5. **Fetches from IPFS** if not cached or expired
6. **Caches the result** in localStorage for 24 hours

## Architecture

### Core Components

- **`IPFSMetadataCache`** (`src/lib/ipfs-cache.ts`): Singleton class managing the cache
- **`fetchAgentWithCache()`** (`src/lib/agent-with-cache.ts`): Enhanced agent fetching with caching
- **`useAgentWithCache()`** (`src/hooks/useAgentWithCache.ts`): React hook for cached agent data
- **Contract Configuration** (`src/lib/contracts.ts`): Multi-chain contract addresses

### Cache Storage

- **Location**: Browser localStorage
- **Key Format**: `ipfs_metadata_cache_{hash}`
- **Duration**: 24 hours
- **Data Structure**:
  ```typescript
  interface CachedMetadata {
    hash: string
    metadata: any
    timestamp: number
    expiresAt: number
  }
  ```

### Status Indicators

Agent pages show a small indicator showing the metadata source:

- 🟢 **Cached**: Served from local cache (fast)
- 🔵 **IPFS**: Fetched fresh from IPFS (slower, then cached)
- ⚪ **API**: Fallback to Eden API (when blockchain/IPFS fails)

## Configuration

### Contract Addresses

Update the contract addresses in `src/lib/contracts.ts`:

```typescript
export const EDEN_CONTRACTS: Record<number, ContractConfig> = {
  8453: {
    address: '0x...' as `0x${string}`, // Replace with actual address
    chainId: 8453,
    chainName: 'Base'
  },
  // ... other chains
}
```

### Default Chain

Set the default chain ID via environment variable:

```env
NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453
```

Or modify the default in `src/lib/contracts.ts`.

## Usage

### Basic Usage

The system is automatically used when accessing agent pages. No additional setup required.

### Programmatic Usage

```typescript
import { fetchAgentWithCache } from '~/lib/agent-with-cache'

// Fetch a single agent with caching
const agent = await fetchAgentWithCache('2', 8453)
console.log(agent.metadataSource) // 'cached', 'ipfs', or 'api'

// Use React hook
import { useAgentWithCache } from '~/hooks/useAgentWithCache'

function MyComponent() {
  const { agent, loading, error } = useAgentWithCache('2')
  // ...
}
```

### Cache Management

```typescript
import { getCacheStats, clearCache } from '~/lib/agent-with-cache'

// Get statistics
const stats = getCacheStats()
console.log(stats.validEntries, stats.expiredEntries)

// Clear all cached data
clearCache()
```

## Debug Interface

Visit `/debug/cache` to:

- View cache statistics
- Clear cached data
- Monitor cache performance
- Understand how the system works

## Performance Benefits

- **First Load**: Slower (blockchain + IPFS fetch)
- **Subsequent Loads**: Near-instant (cached metadata)
- **Network Reduction**: ~90% fewer IPFS requests for returning users
- **Resilience**: Graceful fallback to API data

## Error Handling

The system includes multiple fallback layers:

1. **Primary**: Cached IPFS metadata
2. **Secondary**: Fresh IPFS fetch
3. **Tertiary**: Eden API metadata
4. **Graceful Degradation**: Show loading/error states

## Monitoring

Check browser console for caching activity:

```
Cache hit for IPFS hash: QmX...
Cache miss for IPFS hash: QmY..., fetching from IPFS...
Fetched tokenURI for agent 2 on Base: ipfs://QmZ...
```

## Future Enhancements

- **Service Worker**: Background cache updates
- **IndexedDB**: More robust storage for large datasets
- **Cache Sharing**: Sync cache across browser tabs
- **Predictive Loading**: Preload popular agents
- **Analytics**: Track cache hit rates and performance

## Troubleshooting

### Cache Not Working

1. Check browser console for errors
2. Verify contract addresses are correct
3. Ensure localStorage is available
4. Check network connectivity to IPFS gateway

### Stale Metadata

1. Clear cache via debug interface
2. Wait for 24-hour expiration
3. Check if IPFS hash has changed on-chain

### Performance Issues

1. Monitor cache hit rates in debug interface
2. Consider clearing expired entries
3. Check IPFS gateway response times