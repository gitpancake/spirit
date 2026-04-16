import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.KV_REST_API_URL?.trim();
  const redisToken = process.env.KV_REST_API_TOKEN?.trim();
  
  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis configuration not found, Redis caching disabled');
    return null;
  }

  // Validate Redis URL format
  if (!redisUrl.startsWith('https://')) {
    console.error('❌ Invalid Redis URL format. Must start with https://');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error);
      return null;
    }
  }

  return redis;
}

// Helper functions for IPFS metadata caching
export async function getCachedMetadata(ipfsHash: string): Promise<any | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get(`ipfs:${ipfsHash}`);
    if (cached) {
      console.log(`✅ Redis cache hit for IPFS hash: ${ipfsHash}`);
      return cached;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Redis get error:', error.message);
    return null;
  }
}

export async function setCachedMetadata(ipfsHash: string, metadata: any, ttlSeconds: number = 3600): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    if (ttlSeconds === 0) {
      // Use SET for permanent storage (no TTL)
      await redis.set(`ipfs:${ipfsHash}`, JSON.stringify(metadata));
      console.log(`✅ Permanently cached metadata for IPFS hash: ${ipfsHash} (no expiry)`);
    } else {
      // Use SETEX for TTL-based storage
      await redis.setex(`ipfs:${ipfsHash}`, ttlSeconds, JSON.stringify(metadata));
      console.log(`✅ Cached metadata for IPFS hash: ${ipfsHash} (TTL: ${ttlSeconds}s)`);
    }
  } catch (error: any) {
    console.error('❌ Redis set error:', error.message);
  }
}

// Helper to extract IPFS hash from various URL formats
export function extractIPFSHash(ipfsUrl: string): string | null {
  if (!ipfsUrl) return null;
  
  // Handle ipfs:// URLs
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', '');
  }
  
  // Handle gateway URLs like https://gateway.pinata.cloud/ipfs/QmXXX
  const gatewayMatch = ipfsUrl.match(/\/ipfs\/([^\/\?]+)/);
  if (gatewayMatch) {
    return gatewayMatch[1];
  }
  
  // If it's just a hash
  if (ipfsUrl.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) || ipfsUrl.match(/^baf[a-z0-9]{56}$/)) {
    return ipfsUrl;
  }
  
  return null;
}

// Clear all IPFS cache entries (for admin use)
export async function clearIPFSCache(): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    const keys = await redis.keys('ipfs:*');
    if (keys.length === 0) return 0;
    
    await redis.del(...keys);
    console.log(`🗑️ Cleared ${keys.length} IPFS cache entries from Redis`);
    return keys.length;
  } catch (error: any) {
    console.error('❌ Redis clear error:', error.message);
    return 0;
  }
}