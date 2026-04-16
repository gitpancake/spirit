import { agentCache } from './cache';
import { getCachedMetadata, setCachedMetadata, extractIPFSHash } from './redis';

interface CacheEntry {
  tokenId: string;
  ipfsHash: string;
  metadata: any;
  owner?: string;
  trainers?: string[];
  contractAddress: string;
  chainId: number;
  lastUpdated: number;
  blockNumber: string;
  transactionHash: string;
}

interface CacheStats {
  memory: {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  };
  redis: {
    connected: boolean;
    ipfsEntries: number;
  };
  contracts: {
    [contractAddress: string]: {
      tokenCount: number;
      chainId: number;
    };
  };
}

export class AgentCacheService {
  private static instance: AgentCacheService;
  private readonly MEMORY_TTL = 86400 * 365 * 1000; // 1 year in milliseconds
  private readonly REDIS_TTL = 0; // Never expires

  public static getInstance(): AgentCacheService {
    if (!AgentCacheService.instance) {
      AgentCacheService.instance = new AgentCacheService();
    }
    return AgentCacheService.instance;
  }

  /**
   * Resolve IPFS hash and cache the metadata
   */
  async resolveAndCacheIPFS(ipfsHash: string, forceRefresh = false): Promise<any> {
    try {
      // Check Redis cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = await getCachedMetadata(ipfsHash);
        if (cached) {
          console.log(`✅ Redis cache hit for IPFS hash: ${ipfsHash}`);
          return cached;
        }
      }

      // Try multiple IPFS gateways in sequence for reliability
      const gateways = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://dweb.link/ipfs/'
      ];
      
      let lastError: Error | null = null;
      
      for (const gateway of gateways) {
        try {
          console.log(`📡 Trying IPFS gateway: ${gateway}${ipfsHash}`);
          
          const response = await fetch(`${gateway}${ipfsHash}`, {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000), // 8 second timeout per gateway
          });

          if (response.ok) {
            const metadata = await response.json();
            console.log(`✅ Successfully fetched metadata from ${gateway}`);
            await setCachedMetadata(ipfsHash, metadata, this.REDIS_TTL);
            return metadata;
          } else {
            lastError = new Error(`Gateway ${gateway} returned ${response.status}: ${response.statusText}`);
            console.warn(`⚠️ Gateway failed: ${lastError.message}`);
          }
        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ Gateway ${gateway} error:`, error.message);
          // Continue to next gateway
        }
      }
      
      // If all gateways failed, throw the last error
      throw lastError || new Error('All IPFS gateways failed');
    } catch (error: any) {
      console.error(`❌ Failed to resolve IPFS hash ${ipfsHash}:`, error.message);
      throw error;
    }
  }

  /**
   * Cache token metadata with IPFS resolution
   */
  async cacheTokenMetadata(params: {
    tokenId: string;
    metadataURI: string;
    owner?: string;
    contractAddress: string;
    chainId: number;
    blockNumber: string;
    transactionHash: string;
    trainers?: string[];
    forceRefresh?: boolean;
  }): Promise<CacheEntry> {
    const { tokenId, metadataURI, owner, contractAddress, chainId, blockNumber, transactionHash, trainers, forceRefresh } = params;
    
    // Extract IPFS hash
    const ipfsHash = extractIPFSHash(metadataURI);
    if (!ipfsHash) {
      throw new Error(`Could not extract IPFS hash from URI: ${metadataURI}`);
    }

    // Try to resolve IPFS metadata, but don't fail if it doesn't work
    let metadata: any = null;
    try {
      metadata = await this.resolveAndCacheIPFS(ipfsHash, forceRefresh);
    } catch (error: any) {
      console.warn(`⚠️ Failed to resolve IPFS metadata for ${ipfsHash}, caching token without metadata:`, error.message);
      // Continue to cache the token even without metadata
    }
    
    // Create cache entry (with or without metadata)
    const cacheEntry: CacheEntry = {
      tokenId,
      ipfsHash,
      metadata,
      owner,
      trainers: trainers || [],
      contractAddress,
      chainId,
      lastUpdated: Date.now(),
      blockNumber,
      transactionHash,
    };

    // Cache in memory
    agentCache.set(`metadata:${tokenId}`, cacheEntry, this.MEMORY_TTL);
    
    // Also create a mapping from IPFS hash to tokens (for efficient lookups)
    const existingTokens = agentCache.get<string[]>(`ipfs:${ipfsHash}:tokens`) || [];
    if (!existingTokens.includes(tokenId)) {
      existingTokens.push(tokenId);
      agentCache.set(`ipfs:${ipfsHash}:tokens`, existingTokens, this.MEMORY_TTL);
    }

    console.log(`✅ Cached token ${tokenId} with IPFS hash ${ipfsHash} for contract ${contractAddress}`);
    return cacheEntry;
  }

  /**
   * Update token metadata with new IPFS hash
   */
  async updateTokenMetadata(params: {
    tokenId: string;
    newMetadataURI: string;
    previousMetadataURI?: string;
    contractAddress: string;
    chainId: number;
    blockNumber: string;
    transactionHash: string;
  }): Promise<CacheEntry> {
    const { tokenId, newMetadataURI, previousMetadataURI, contractAddress, chainId, blockNumber, transactionHash } = params;

    // Get existing cache entry to preserve owner and trainer info
    const existingEntry = agentCache.get<CacheEntry>(`metadata:${tokenId}`);
    const owner = existingEntry?.owner;
    const trainers = existingEntry?.trainers || [];

    // Remove from old IPFS hash mapping if we have previous URI
    if (previousMetadataURI) {
      const previousIpfsHash = extractIPFSHash(previousMetadataURI);
      if (previousIpfsHash) {
        const tokenList = agentCache.get<string[]>(`ipfs:${previousIpfsHash}:tokens`) || [];
        const updatedTokenList = tokenList.filter(t => t !== tokenId);
        
        if (updatedTokenList.length === 0) {
          agentCache.delete(`ipfs:${previousIpfsHash}:tokens`);
        } else {
          agentCache.set(`ipfs:${previousIpfsHash}:tokens`, updatedTokenList, this.MEMORY_TTL);
        }
      }
    }

    // Cache new metadata (force refresh to ensure we get the latest)
    const updatedEntry = await this.cacheTokenMetadata({
      tokenId,
      metadataURI: newMetadataURI,
      owner,
      contractAddress,
      chainId,
      blockNumber,
      transactionHash,
      trainers,
      forceRefresh: true,
    });

    console.log(`🔄 Updated token ${tokenId} metadata: ${previousMetadataURI} → ${newMetadataURI}`);
    return updatedEntry;
  }

  /**
   * Remove token from cache
   */
  removeTokenFromCache(tokenId: string): void {
    const existingEntry = agentCache.get<CacheEntry>(`metadata:${tokenId}`);
    
    if (existingEntry?.ipfsHash) {
      // Remove from IPFS hash mapping
      const tokenList = agentCache.get<string[]>(`ipfs:${existingEntry.ipfsHash}:tokens`) || [];
      const updatedTokenList = tokenList.filter(t => t !== tokenId);
      
      if (updatedTokenList.length === 0) {
        agentCache.delete(`ipfs:${existingEntry.ipfsHash}:tokens`);
      } else {
        agentCache.set(`ipfs:${existingEntry.ipfsHash}:tokens`, updatedTokenList, this.MEMORY_TTL);
      }
    }

    // Remove token metadata
    agentCache.delete(`metadata:${tokenId}`);
    
    console.log(`🗑️ Removed token ${tokenId} from cache`);
  }

  /**
   * Update token ownership
   */
  updateTokenOwnership(tokenId: string, newOwner: string, previousOwner: string, blockNumber: string, transactionHash: string): boolean {
    const existingEntry = agentCache.get<CacheEntry>(`metadata:${tokenId}`);
    
    if (!existingEntry) {
      console.warn(`⚠️ Cannot update ownership: token ${tokenId} not found in cache`);
      return false;
    }

    const updatedEntry: CacheEntry = {
      ...existingEntry,
      owner: newOwner,
      lastUpdated: Date.now(),
      blockNumber,
      transactionHash,
    };

    agentCache.set(`metadata:${tokenId}`, updatedEntry, this.MEMORY_TTL);
    console.log(`✅ Updated ownership for token ${tokenId}: ${previousOwner} → ${newOwner}`);
    return true;
  }

  /**
   * Add trainer to token
   */
  addTrainerToToken(tokenId: string, trainer: string, blockNumber: string, transactionHash: string): boolean {
    const existingEntry = agentCache.get<CacheEntry>(`metadata:${tokenId}`);
    
    if (!existingEntry) {
      console.warn(`⚠️ Cannot add trainer: token ${tokenId} not found in cache`);
      return false;
    }

    const trainers = existingEntry.trainers || [];
    if (!trainers.includes(trainer)) {
      trainers.push(trainer);
      
      const updatedEntry: CacheEntry = {
        ...existingEntry,
        trainers,
        lastUpdated: Date.now(),
        blockNumber,
        transactionHash,
      };

      agentCache.set(`metadata:${tokenId}`, updatedEntry, this.MEMORY_TTL);
      console.log(`✅ Added trainer ${trainer} to token ${tokenId}`);
      return true;
    }

    return false; // Already exists
  }

  /**
   * Remove trainer from token
   */
  removeTrainerFromToken(tokenId: string, trainer: string, blockNumber: string, transactionHash: string): boolean {
    const existingEntry = agentCache.get<CacheEntry>(`metadata:${tokenId}`);
    
    if (!existingEntry) {
      console.warn(`⚠️ Cannot remove trainer: token ${tokenId} not found in cache`);
      return false;
    }

    const trainers = existingEntry.trainers || [];
    const updatedTrainers = trainers.filter(t => t !== trainer);
    
    if (updatedTrainers.length !== trainers.length) {
      const updatedEntry: CacheEntry = {
        ...existingEntry,
        trainers: updatedTrainers,
        lastUpdated: Date.now(),
        blockNumber,
        transactionHash,
      };

      agentCache.set(`metadata:${tokenId}`, updatedEntry, this.MEMORY_TTL);
      console.log(`✅ Removed trainer ${trainer} from token ${tokenId}`);
      return true;
    }

    return false; // Wasn't there to begin with
  }

  /**
   * Get token metadata from cache
   */
  getTokenMetadata(tokenId: string): CacheEntry | null {
    return agentCache.get<CacheEntry>(`metadata:${tokenId}`);
  }

  /**
   * Get tokens that use a specific IPFS hash
   */
  getTokensByIPFSHash(ipfsHash: string): string[] {
    return agentCache.get<string[]>(`ipfs:${ipfsHash}:tokens`) || [];
  }

  /**
   * Clear cache for a specific contract
   */
  async clearContractCache(contractAddress: string): Promise<number> {
    let clearedCount = 0;
    const keysToDelete: string[] = [];
    
    // Find all entries for this contract
    for (const [key, entry] of agentCache['cache'].entries()) {
      if (key.startsWith('metadata:')) {
        const tokenData = entry.data as CacheEntry;
        if (tokenData.contractAddress?.toLowerCase() === contractAddress.toLowerCase()) {
          keysToDelete.push(key);
        }
      }
    }
    
    // Delete the entries
    keysToDelete.forEach(key => {
      agentCache.delete(key);
      clearedCount++;
    });

    // Also clear list caches
    const listKeys = ['totalCount'];
    for (const [key] of agentCache['cache'].entries()) {
      if (key.startsWith('agents:') || key.startsWith('ipfs:')) {
        keysToDelete.push(key);
        agentCache.delete(key);
        clearedCount++;
      }
    }

    console.log(`🗑️ Cleared ${clearedCount} cache entries for contract ${contractAddress}`);
    return clearedCount;
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const memoryStats = agentCache.getStats();
    const contracts: { [contractAddress: string]: { tokenCount: number; chainId: number } } = {};
    
    // Analyze cached tokens by contract
    for (const [key, entry] of agentCache['cache'].entries()) {
      if (key.startsWith('metadata:')) {
        const tokenData = entry.data as CacheEntry;
        if (tokenData.contractAddress) {
          const addr = tokenData.contractAddress.toLowerCase();
          if (!contracts[addr]) {
            contracts[addr] = { tokenCount: 0, chainId: tokenData.chainId };
          }
          contracts[addr].tokenCount++;
        }
      }
    }

    return {
      memory: {
        totalEntries: memoryStats.total,
        validEntries: memoryStats.valid,
        expiredEntries: memoryStats.expired,
      },
      redis: {
        connected: true, // Would check actual Redis connection in production
        ipfsEntries: 0, // Would query Redis in production
      },
      contracts,
    };
  }

  /**
   * Get all cached token IDs
   */
  getAllCachedTokenIds(): string[] {
    const tokenIds: string[] = [];
    
    for (const [key] of agentCache['cache'].entries()) {
      if (key.startsWith('metadata:')) {
        const tokenId = key.replace('metadata:', '');
        tokenIds.push(tokenId);
      }
    }
    
    return tokenIds.sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Get cached tokens for a specific contract
   */
  getTokensByContract(contractAddress: string): CacheEntry[] {
    const tokens: CacheEntry[] = [];
    
    for (const [key, entry] of agentCache['cache'].entries()) {
      if (key.startsWith('metadata:')) {
        const tokenData = entry.data as CacheEntry;
        if (tokenData.contractAddress?.toLowerCase() === contractAddress.toLowerCase()) {
          tokens.push(tokenData);
        }
      }
    }
    
    return tokens;
  }

  /**
   * Get cache entry details for debugging
   */
  getCacheEntryDetails(tokenId: string): { entry: CacheEntry | null; cacheInfo: any } {
    const cacheKey = `metadata:${tokenId}`;
    const entry = agentCache.get<CacheEntry>(cacheKey);
    
    // Get raw cache entry for expiration info
    const rawEntry = agentCache['cache'].get(cacheKey);
    const cacheInfo = rawEntry ? {
      timestamp: new Date(rawEntry.timestamp).toISOString(),
      expiresAt: new Date(rawEntry.expiresAt).toISOString(),
      isExpired: Date.now() > rawEntry.expiresAt
    } : null;
    
    return {
      entry,
      cacheInfo
    };
  }
}