// Environment Variables Configuration
// Type-safe access to environment variables for the Registry API

interface ServerEnv {
  // Core API Keys
  EDEN_API_URL?: string;
  PINATA_JWT: string;
  
  // Internal API (RabbitMQ Backend)
  INTERNAL_API_KEY?: string;
  INTERNAL_API_URL?: string;
  
  // Blockchain Configuration
  RPC_URL: string;
  PRIVATE_KEY?: string; // Optional - not needed for read-only operations
  
  // RabbitMQ (Optional - for async processing)
  RABBITMQ_URL?: string;
  RABBITMQ_QUEUE_NAME?: string;
  
  // Redis Caching (Optional - for performance)
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  
  // External APIs (Optional)
  WEBHOOK_FALLBACK_URL?: string;
  WEBHOOK_SECRET?: string;
  
  // Framework
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL_ENV?: 'development' | 'preview' | 'production';
}

interface PublicEnv {
  // Blockchain RPCs (Public - client accessible)
  NEXT_PUBLIC_ETHEREUM_MAINNET_RPC?: string; // Optional for preview/development
  NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC: string;
  // NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS removed - now dynamic from event listener
  
  // Authentication
  NEXT_PUBLIC_PRIVY_APP_ID: string;
  
  // Environment Detection
  NEXT_PUBLIC_VERCEL_ENV: 'development' | 'preview' | 'production';
}

// Server-side environment variables
export const env: ServerEnv = {
  EDEN_API_URL: process.env.EDEN_API_URL,
  PINATA_JWT: process.env.PINATA_JWT!,
  
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
  INTERNAL_API_URL: process.env.INTERNAL_API_URL,
  
  RPC_URL: process.env.RPC_URL!,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  RABBITMQ_QUEUE_NAME: process.env.RABBITMQ_QUEUE_NAME,
  
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  
  WEBHOOK_FALLBACK_URL: process.env.WEBHOOK_FALLBACK_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  VERCEL_ENV: process.env.VERCEL_ENV as any,
};

// Public environment variables (client accessible)
export const publicEnv: PublicEnv = {
  NEXT_PUBLIC_ETHEREUM_MAINNET_RPC: process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC,
  NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC!,
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  NEXT_PUBLIC_VERCEL_ENV: (process.env.NEXT_PUBLIC_VERCEL_ENV as any) || 'development',
};

// Validation function to check required environment variables
export function validateEnv() {
  const requiredServerVars: (keyof ServerEnv)[] = [
    'PINATA_JWT',
    'RPC_URL',
    'NODE_ENV'
  ];
  
  const requiredPublicVars: (keyof PublicEnv)[] = [
    'NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC',
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'NEXT_PUBLIC_VERCEL_ENV'
  ];
  
  // Only require mainnet RPC in production
  if (env.NODE_ENV === 'production') {
    requiredPublicVars.push('NEXT_PUBLIC_ETHEREUM_MAINNET_RPC' as keyof PublicEnv);
  }
  
  const missingVars: string[] = [];
  
  for (const varName of requiredServerVars) {
    if (!env[varName]) {
      missingVars.push(varName);
    }
  }
  
  for (const varName of requiredPublicVars) {
    if (!publicEnv[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ Environment variables validated successfully');
  console.log(`🌍 Environment: ${env.NODE_ENV} (Vercel: ${env.VERCEL_ENV || 'local'})`);
}

// Helper functions for common environment checks
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isPreview = () => env.VERCEL_ENV === 'preview';
export const hasRedis = () => !!(env.KV_REST_API_URL && env.KV_REST_API_TOKEN);
export const hasRabbitMQ = () => !!(env.RABBITMQ_URL && env.RABBITMQ_QUEUE_NAME);
export const hasInternalAPI = () => !!(env.INTERNAL_API_URL && env.INTERNAL_API_KEY);