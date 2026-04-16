# Environment Variables Migration & Cleanup

## Overview

This document outlines the environment variable refactoring completed to follow Next.js best practices, improve type safety, and centralize configuration management.

## Changes Made

### 1. Created Centralized Environment Configuration

**`src/lib/env.ts`** - Type-safe environment variable management with:
- Separated public (client-side) and private (server-side) variables
- Default values and validation
- TypeScript type safety
- Runtime validation on app startup

### 2. Updated Code to Use New Environment System

**Files Updated:**
- `src/lib/api.ts` - API base URL configuration
- `src/components/providers.tsx` - Privy app ID
- `src/lib/wagmi.ts` - RPC URLs for wagmi configuration
- `src/lib/contracts.ts` - Contract addresses and chain configuration
- `src/app/api/eden/[...path]/route.ts` - Eden API key
- `src/app/layout.tsx` - Added environment validation import

### 3. Environment Variable Cleanup

**✅ Required & Active:**
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy authentication
- `PRIVY_APP_SECRET` - Server-side Privy auth
- `NEXT_PUBLIC_API_URL` - Main API endpoint
- `NEXT_PUBLIC_BASE_URL` - App base URL for internal API calls
- `NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS` - Smart contract address
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID` - Default blockchain network
- `NEXT_PUBLIC_ETHEREUM_RPC_URL` - Ethereum mainnet RPC
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` - Ethereum testnet RPC
- `NEXT_PUBLIC_EDEN_IMAGE_HOST` - Eden CDN for images
- `EDEN_API_KEY` - Eden API authentication
- `PINATA_JWT` - IPFS file storage
- `KV_REST_API_URL` - Upstash Redis URL
- `KV_REST_API_TOKEN` - Upstash Redis token
- `KV_REST_API_READ_ONLY_TOKEN` - Upstash Redis readonly
- `NEXT_PUBLIC_ANALYTICS_ID` - Analytics integration

**❌ Removed/Unused:**
- `NEXT_PUBLIC_BASE_RPC_URL` - Not used in codebase
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` - Not used in codebase
- `REDIS_URL` - Duplicate of KV configuration

### 4. Updated .env Files

**`.env.example`** - Reorganized with:
- Clear sections (Required vs Optional)
- Better documentation
- Development setup notes
- Security reminders

**`.env.local`** - Added missing variables:
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111`

## Benefits

### Type Safety
- All environment variables are now typed
- Compile-time validation of environment access
- Prevents runtime errors from undefined variables

### Centralized Management  
- Single source of truth for all environment configuration
- Easy to add new variables or change defaults
- Clear separation between public/private variables

### Runtime Validation
- Environment validation runs at app startup
- Clear error messages for missing required variables
- Warnings for optional but recommended variables

### Developer Experience
- Better IntelliSense/autocomplete for environment variables
- Easier debugging with clear error messages
- Organized .env.example with documentation

## Usage Examples

### Old Way (Direct process.env access):
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

### New Way (Centralized env object):
```typescript
import { env } from '~/lib/env'
const apiUrl = env.PUBLIC.API_URL
```

## Migration Checklist

- [x] Created `src/lib/env.ts` with type-safe configuration
- [x] Created `src/lib/init.ts` for startup validation
- [x] Updated all direct `process.env` references to use new `env` object
- [x] Updated `.env.example` with better organization and documentation
- [x] Added missing environment variables to `.env.local`
- [x] Removed unused environment variable references
- [x] Tested build successfully
- [x] Validated runtime startup works

## Next Steps

1. **Consider environment-specific configs** - Different settings for dev/staging/prod
2. **Add more validation** - Validate URLs, check API connectivity on startup
3. **Environment variable encryption** - For sensitive values in production
4. **Documentation** - Update README with environment setup instructions

## Security Notes

- All `NEXT_PUBLIC_*` variables are exposed to the client-side
- Private variables (API keys, secrets) are server-side only
- Never commit `.env.local` to version control
- Use environment-specific values in production