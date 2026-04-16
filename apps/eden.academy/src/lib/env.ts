// Environment variable validation and configuration
// This follows Next.js environment variable best practices

export const env = {
  // Public variables (client-side accessible)
  PUBLIC: {
    PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    
    // Contract Configuration
    SPIRIT_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS as `0x${string}` || '0x8EFceDA953e36b1510054f7Bb47A1f1Be51Edf94',
    DEFAULT_CHAIN_ID: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || 11155111, // Sepolia default
    
    // RPC Configuration - Single RPC URL for development/production (REQUIRED)
    RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || '',
    
    // Legacy RPC URLs (keeping for reference)
    ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || '',
    SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '',
    
    // External Services
    EDEN_IMAGE_HOST: process.env.NEXT_PUBLIC_EDEN_IMAGE_HOST || 'https://d14i3advvh2bvd.cloudfront.net/',
    
    // Smart Wallet / Paymaster Configuration
    ALCHEMY_GAS_POLICY_ID: process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID || '',
    BUNDLER_URL: process.env.NEXT_PUBLIC_BUNDLER_URL || '',
    PAYMASTER_URL: process.env.NEXT_PUBLIC_PAYMASTER_URL || '',
    
    // Analytics (optional)
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
  },
  
  // Private variables (server-side only)
  PRIVATE: {
    // Authentication
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET || '',
    
    // AI Services
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    
    // API Configuration
    API_URL: process.env.API_URL || 'http://localhost:3001',
    EDEN_API_KEY: process.env.EDEN_API_KEY || '',
    
    // IPFS/Storage
    PINATA_JWT: process.env.PINATA_JWT || '',
    
    // Database/Cache
    KV_REST_API_URL: process.env.KV_REST_API_URL || '',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || '',
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN || '',
  },
} as const

// Environment validation (runs at startup)
export function validateEnvironment() {
  // Skip validation during build process
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    // During build, NODE_ENV=production but VERCEL_ENV is not set
    return
  }

  const errors: string[] = []
  
  // Required public variables
  if (!env.PUBLIC.PRIVY_APP_ID) {
    errors.push('NEXT_PUBLIC_PRIVY_APP_ID is required')
  }
  
  if (!env.PUBLIC.RPC_URL) {
    errors.push('NEXT_PUBLIC_RPC_URL is required - must be set to appropriate RPC endpoint')
  }
  
  // Required private variables (only check in server context)
  if (typeof window === 'undefined') {
    if (!env.PRIVATE.PRIVY_APP_SECRET) {
      errors.push('PRIVY_APP_SECRET is required for server-side auth')
    }
    
    
    if (!env.PRIVATE.KV_REST_API_URL || !env.PRIVATE.KV_REST_API_TOKEN) {
      console.warn('Redis/KV configuration incomplete - caching may not work')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
}

// Type-safe environment access
export type Environment = typeof env