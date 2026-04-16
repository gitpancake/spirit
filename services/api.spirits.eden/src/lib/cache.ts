// Simple in-memory cache for agent data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    console.log(`🔧 Cache SET: key=${key}, ttl=${ttl}, expiresAt=${new Date(expiresAt).toISOString()}`);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
    
    console.log(`✅ Cache SET complete: size=${this.cache.size}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    };
  }
}

export const agentCache = new SimpleCache();

// Helper functions for specific cache operations - AGENTS
export const getCachedAgentMetadata = (tokenId: number) => 
  agentCache.get<any>(`metadata:${tokenId}`);

export const setCachedAgentMetadata = (tokenId: number, metadata: any, ttl?: number) => 
  agentCache.set(`metadata:${tokenId}`, metadata, ttl);

// Enhanced cache functions that include URI validation
export const getCachedAgentWithURI = (tokenId: number, currentURI: string) => {
  const cached = agentCache.get<any>(`metadata:${tokenId}`);
  if (!cached || !cached.metadataURI) {
    return null;
  }
  
  // Check if the URI has changed - if so, cache is invalid
  if (cached.metadataURI !== currentURI) {
    console.log(`🔄 Token ${tokenId} URI changed from ${cached.metadataURI} to ${currentURI} - invalidating cache`);
    agentCache.delete(`metadata:${tokenId}`);
    return null;
  }
  
  return cached;
};

export const getCachedAgentList = (page: number, limit: number) => 
  agentCache.get<any>(`agents:${page}:${limit}`);

export const setCachedAgentList = (page: number, limit: number, data: any, ttl?: number) => 
  agentCache.set(`agents:${page}:${limit}`, data, ttl);

export const getCachedTotalCount = () => 
  agentCache.get<number>('totalCount');

export const setCachedTotalCount = (count: number, ttl?: number) => 
  agentCache.set('totalCount', count, ttl);

// Helper functions for specific cache operations - TRAINERS
export const getCachedTrainerMetadata = (cacheKey: string) => 
  agentCache.get<any>(`trainer-metadata:${cacheKey}`);

export const setCachedTrainerMetadata = (cacheKey: string, metadata: any, ttl?: number) => 
  agentCache.set(`trainer-metadata:${cacheKey}`, metadata, ttl);

export const getCachedTrainerList = (cacheKey: string, limit: number) => 
  agentCache.get<any>(`trainers:${cacheKey}:${limit}`);

export const setCachedTrainerList = (cacheKey: string, limit: number, data: any, ttl?: number) => 
  agentCache.set(`trainers:${cacheKey}:${limit}`, data, ttl);

export const clearAgentCaches = async (): Promise<{ memoryCleared: number, redisCleared: number }> => {
  // Clear memory cache entries that start with 'agents:', 'metadata:', or 'totalCount'
  const keysToDelete: string[] = [];
  
  for (const [key] of agentCache['cache'].entries()) {
    if (key.startsWith('agents:') || key.startsWith('metadata:') || key === 'totalCount') {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => agentCache.delete(key));
  console.log(`🗑️ Cleared ${keysToDelete.length} agent memory cache entries`);
  
  // Also clear Redis IPFS cache
  let redisCleared = 0;
  try {
    const { clearIPFSCache } = await import('./redis');
    redisCleared = await clearIPFSCache();
  } catch (error: any) {
    console.error('❌ Failed to clear Redis cache:', error.message);
  }
  
  return {
    memoryCleared: keysToDelete.length,
    redisCleared
  };
};

export const clearTrainerCaches = async (): Promise<{ memoryCleared: number, redisCleared: number }> => {
  // Clear memory cache entries that start with 'trainers:' or 'trainer-metadata:'
  const keysToDelete: string[] = [];
  
  for (const [key] of agentCache['cache'].entries()) {
    if (key.startsWith('trainers:') || key.startsWith('trainer-metadata:')) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => agentCache.delete(key));
  console.log(`🗑️ Cleared ${keysToDelete.length} trainer memory cache entries`);
  
  // Also clear Redis IPFS cache
  let redisCleared = 0;
  try {
    const { clearIPFSCache } = await import('./redis');
    redisCleared = await clearIPFSCache();
  } catch (error: any) {
    console.error('❌ Failed to clear Redis cache:', error.message);
  }
  
  return {
    memoryCleared: keysToDelete.length,
    redisCleared
  };
};

// Helper functions for Abraham early works caching
export const getCachedAbrahamWork = (cacheKey: string) => 
  agentCache.get<any>(cacheKey);

export const setCachedAbrahamWork = (cacheKey: string, workData: any, ttlSeconds?: number) => 
  agentCache.set(cacheKey, workData, ttlSeconds ? ttlSeconds * 1000 : undefined); // Convert seconds to milliseconds

// Helper functions for Collections system caching
export const getCachedCollection = (cacheKey: string) => 
  agentCache.get<any>(cacheKey);

export const setCachedCollection = (cacheKey: string, collectionData: any, ttlSeconds?: number) => 
  agentCache.set(cacheKey, collectionData, ttlSeconds ? ttlSeconds * 1000 : undefined); // Convert seconds to milliseconds
