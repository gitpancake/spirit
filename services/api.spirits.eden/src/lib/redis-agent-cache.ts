// Redis-backed permanent cache system for agents
// Provides persistent storage that survives server restarts
// Uses Upstash Redis for production-grade reliability

import { getRedisClient } from './redis';

interface AgentData {
  tokenId: string;
  ipfsHash: string;
  owner: string;
  trainers: string[];  // Array of trainer addresses
  metadata: any;
  contractAddress: string;
  chainId: number;
  blockNumber: string;
  transactionHash: string;
  lastUpdated: number;
}

interface IPFSData {
  hash: string;
  metadata: any;
  lastFetched: number;
}

class RedisAgentCache {
  private static instance: RedisAgentCache;
  
  // In-memory cache for ultra-fast access (rebuilt from Redis on startup)
  private memoryCache = new Map<string, AgentData>();
  private ipfsMemoryCache = new Map<string, IPFSData>();
  private initialized = false;

  public static getInstance(): RedisAgentCache {
    if (!RedisAgentCache.instance) {
      RedisAgentCache.instance = new RedisAgentCache();
    }
    return RedisAgentCache.instance;
  }

  /**
   * Initialize cache by loading data from Redis
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const redis = getRedisClient();
    if (!redis) {
      console.warn('⚠️ Redis not available, running in memory-only mode');
      this.initialized = true;
      return;
    }

    try {
      console.log('🔄 Loading agent cache from Redis...');
      
      // Load all agent data
      const agentKeys = await redis.keys('agent:*:*:*'); // agent:chainId:contractAddress:tokenId
      console.log(`📥 Found ${agentKeys.length} agent entries in Redis`);
      
      for (const key of agentKeys) {
        try {
          const data = await redis.get(key);
          if (data && typeof data === 'object') {
            const agentData = data as AgentData;
            const memoryKey = `${agentData.chainId}-${agentData.contractAddress}/${agentData.tokenId}`;
            this.memoryCache.set(memoryKey, agentData);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load agent key ${key}:`, error);
        }
      }
      
      // Load all IPFS metadata
      const ipfsKeys = await redis.keys('ipfs:*');
      console.log(`📥 Found ${ipfsKeys.length} IPFS metadata entries in Redis`);
      
      for (const key of ipfsKeys) {
        try {
          const data = await redis.get(key);
          if (data && typeof data === 'object') {
            const ipfsHash = key.replace('ipfs:', '');
            this.ipfsMemoryCache.set(ipfsHash, {
              hash: ipfsHash,
              metadata: data,
              lastFetched: Date.now()
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load IPFS key ${key}:`, error);
        }
      }
      
      console.log(`✅ Loaded ${this.memoryCache.size} agents and ${this.ipfsMemoryCache.size} IPFS entries from Redis`);
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize cache from Redis:', error);
      this.initialized = true; // Continue with empty cache
    }
  }

  /**
   * Store token data (saves to both Redis and memory)
   */
  async setToken(params: {
    contractAddress: string;
    tokenId: string;
    ipfsHash: string;
    owner: string;
    trainers?: string[];
    metadata: any;
    chainId: number;
    blockNumber: string;
    transactionHash: string;
  }): Promise<void> {
    await this.initialize();
    
    const { contractAddress, tokenId, ipfsHash, owner, trainers = [], metadata, chainId, blockNumber, transactionHash } = params;
    
    console.log(`💾 Caching token ${tokenId} for contract ${contractAddress}`);
    
    const agentData: AgentData = {
      tokenId,
      ipfsHash,
      owner,
      trainers,
      metadata,
      contractAddress,
      chainId,
      blockNumber,
      transactionHash,
      lastUpdated: Date.now()
    };
    
    const memoryKey = `${chainId}-${contractAddress}/${tokenId}`;
    const redisKey = `agent:${chainId}:${contractAddress}:${tokenId}`;
    
    // Store in memory for fast access
    this.memoryCache.set(memoryKey, agentData);
    
    // Store in Redis for persistence
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(redisKey, agentData);
        console.log(`✅ Persisted agent data to Redis: ${redisKey}`);
      } catch (error) {
        console.error(`❌ Failed to persist agent to Redis: ${redisKey}`, error);
      }
    }
    
    // Store IPFS metadata if we have it
    if (metadata && ipfsHash) {
      await this.setIPFSMetadata(ipfsHash, metadata);
    }
  }

  /**
   * Store IPFS metadata (saves to both Redis and memory)
   */
  async setIPFSMetadata(ipfsHash: string, metadata: any): Promise<void> {
    const ipfsData: IPFSData = {
      hash: ipfsHash,
      metadata,
      lastFetched: Date.now()
    };
    
    // Store in memory
    this.ipfsMemoryCache.set(ipfsHash, ipfsData);
    
    // Store in Redis permanently (no TTL)
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(`ipfs:${ipfsHash}`, metadata);
        console.log(`📁 Persisted IPFS metadata to Redis: ${ipfsHash}`);
      } catch (error) {
        console.error(`❌ Failed to persist IPFS metadata: ${ipfsHash}`, error);
      }
    }
  }

  /**
   * Get all token IDs for a contract (sorted ascending)
   */
  async getTokenIds(contractAddress: string, chainId: number): Promise<string[]> {
    await this.initialize();
    
    const tokenIds: string[] = [];
    
    for (const [key, agent] of this.memoryCache.entries()) {
      if (agent.contractAddress === contractAddress && agent.chainId === chainId) {
        tokenIds.push(agent.tokenId);
      }
    }
    
    return tokenIds.sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Get agent data by contract and token ID
   */
  async getAgent(contractAddress: string, tokenId: string, chainId: number): Promise<AgentData | null> {
    await this.initialize();
    
    const memoryKey = `${chainId}-${contractAddress}/${tokenId}`;
    return this.memoryCache.get(memoryKey) || null;
  }

  /**
   * Get all agents for a contract
   */
  async getAgents(contractAddress: string, chainId: number): Promise<AgentData[]> {
    await this.initialize();
    
    const agents: AgentData[] = [];
    
    for (const [key, agent] of this.memoryCache.entries()) {
      if (agent.contractAddress === contractAddress && agent.chainId === chainId) {
        agents.push(agent);
      }
    }
    
    // Sort by tokenId ascending
    return agents.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));
  }

  /**
   * Get IPFS metadata if cached
   */
  async getIPFSMetadata(ipfsHash: string): Promise<any | null> {
    await this.initialize();
    
    const ipfsData = this.ipfsMemoryCache.get(ipfsHash);
    return ipfsData ? ipfsData.metadata : null;
  }

  /**
   * Remove token (for deregistration)
   */
  async removeToken(contractAddress: string, tokenId: string, chainId: number): Promise<void> {
    await this.initialize();
    
    console.log(`🗑️ Removing token ${tokenId} from contract ${contractAddress} on chain ${chainId}`);
    
    const memoryKey = `${chainId}-${contractAddress}/${tokenId}`;
    const redisKey = `agent:${chainId}:${contractAddress}:${tokenId}`;
    
    // Remove from memory
    this.memoryCache.delete(memoryKey);
    
    // Remove from Redis
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(redisKey);
        console.log(`✅ Removed agent from Redis: ${redisKey}`);
      } catch (error) {
        console.error(`❌ Failed to remove agent from Redis: ${redisKey}`, error);
      }
    }
    
    // Note: We keep IPFS cache as other tokens might use the same hash
  }

  /**
   * Clear all data for a contract (when contract changes)
   */
  async clearContract(contractAddress: string, chainId: number): Promise<void> {
    await this.initialize();
    
    console.log(`🗑️ Clearing all data for contract ${contractAddress} on chain ${chainId}`);
    
    const redis = getRedisClient();
    const keysToDelete: string[] = [];
    
    // Find all memory keys for this contract and chain
    for (const [key, agent] of this.memoryCache.entries()) {
      if (agent.contractAddress === contractAddress && agent.chainId === chainId) {
        this.memoryCache.delete(key);
        keysToDelete.push(`agent:${chainId}:${contractAddress}:${agent.tokenId}`);
      }
    }
    
    // Remove from Redis
    if (redis && keysToDelete.length > 0) {
      try {
        await redis.del(...keysToDelete);
        console.log(`✅ Removed ${keysToDelete.length} agents from Redis for contract ${contractAddress} on chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Failed to remove agents from Redis for contract ${contractAddress} on chain ${chainId}`, error);
      }
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<any> {
    await this.initialize();
    
    const contractStats: any = {};
    const contractCounts = new Map<string, number>();
    
    // Count agents per contract
    for (const [key, agent] of this.memoryCache.entries()) {
      const count = contractCounts.get(agent.contractAddress) || 0;
      contractCounts.set(agent.contractAddress, count + 1);
      
      if (!contractStats[agent.contractAddress]) {
        contractStats[agent.contractAddress] = {
          tokenCount: 0,
          tokenIds: []
        };
      }
      contractStats[agent.contractAddress].tokenIds.push(agent.tokenId);
    }
    
    // Sort token IDs for each contract
    for (const contractAddress in contractStats) {
      contractStats[contractAddress].tokenCount = contractStats[contractAddress].tokenIds.length;
      contractStats[contractAddress].tokenIds.sort((a: string, b: string) => parseInt(a) - parseInt(b));
    }
    
    const redis = getRedisClient();
    let redisStatus = 'disabled';
    let redisAgentCount = 0;
    let redisIPFSCount = 0;
    
    if (redis) {
      try {
        const agentKeys = await redis.keys('agent:*');
        const ipfsKeys = await redis.keys('ipfs:*');
        redisAgentCount = agentKeys.length;
        redisIPFSCount = ipfsKeys.length;
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'error';
      }
    }
    
    return {
      memory: {
        totalAgents: this.memoryCache.size,
        totalIPFSEntries: this.ipfsMemoryCache.size,
        totalContracts: contractCounts.size,
        contracts: contractStats
      },
      redis: {
        status: redisStatus,
        totalAgents: redisAgentCount,
        totalIPFSEntries: redisIPFSCount
      },
      initialized: this.initialized
    };
  }

  /**
   * Add trainer to agent
   */
  async addTrainer(contractAddress: string, tokenId: string, trainerAddress: string, chainId: number, blockNumber: string, transactionHash: string): Promise<void> {
    await this.initialize();
    
    const agent = await this.getAgent(contractAddress, tokenId, chainId);
    if (!agent) {
      console.error(`❌ Cannot add trainer: Agent ${tokenId} not found for contract ${contractAddress} on chain ${chainId}`);
      return;
    }
    
    console.log(`👥 Adding trainer ${trainerAddress} to token ${tokenId} on chain ${chainId}`);
    
    // Add trainer if not already present
    const updatedTrainers = agent.trainers.includes(trainerAddress) 
      ? agent.trainers 
      : [...agent.trainers, trainerAddress];
    
    // Update agent with new trainer
    await this.setToken({
      ...agent,
      trainers: updatedTrainers,
      blockNumber,
      transactionHash,
      lastUpdated: Date.now()
    });
    
    console.log(`✅ Trainer ${trainerAddress} added to token ${tokenId} on chain ${chainId}`);
  }
  
  /**
   * Remove trainer from agent
   */
  async removeTrainer(contractAddress: string, tokenId: string, trainerAddress: string, chainId: number, blockNumber: string, transactionHash: string): Promise<void> {
    await this.initialize();
    
    const agent = await this.getAgent(contractAddress, tokenId, chainId);
    if (!agent) {
      console.error(`❌ Cannot remove trainer: Agent ${tokenId} not found for contract ${contractAddress} on chain ${chainId}`);
      return;
    }
    
    console.log(`👥 Removing trainer ${trainerAddress} from token ${tokenId} on chain ${chainId}`);
    
    // Remove trainer from array
    const updatedTrainers = agent.trainers.filter(trainer => trainer !== trainerAddress);
    
    // Update agent without the trainer
    await this.setToken({
      ...agent,
      trainers: updatedTrainers,
      blockNumber,
      transactionHash,
      lastUpdated: Date.now()
    });
    
    console.log(`✅ Trainer ${trainerAddress} removed from token ${tokenId} on chain ${chainId}`);
  }
  
  /**
   * Get all trainers for a token
   */
  async getTrainers(contractAddress: string, tokenId: string, chainId: number): Promise<string[]> {
    await this.initialize();
    
    const agent = await this.getAgent(contractAddress, tokenId, chainId);
    return agent ? agent.trainers : [];
  }
  
  /**
   * Check if address is trainer for token
   */
  async isTrainer(contractAddress: string, tokenId: string, address: string, chainId: number): Promise<boolean> {
    await this.initialize();
    
    const trainers = await this.getTrainers(contractAddress, tokenId, chainId);
    return trainers.includes(address);
  }

  /**
   * Get current contract configuration from cache
   */
  async getCurrentContract(): Promise<{ contractAddress: string; chainId: number } | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const contractData = await redis.get('current:contract_config');
      if (contractData && typeof contractData === 'object') {
        return contractData as { contractAddress: string; chainId: number };
      }
      
      // Legacy fallback - check for old contract_address key
      const legacyContract = await redis.get('current:contract_address');
      if (legacyContract && typeof legacyContract === 'string') {
        // Migrate to new format with default chainId
        const config = { contractAddress: legacyContract, chainId: 1 };
        await redis.set('current:contract_config', config);
        await redis.del('current:contract_address'); // Clean up old key
        return config;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get current contract configuration:', error);
      return null;
    }
  }

  /**
   * Set current contract configuration and invalidate cache if changed
   */
  async setCurrentContract(contractAddress: string, chainId: number): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const currentConfig = await this.getCurrentContract();
      const newConfig = { contractAddress, chainId };
      
      if (currentConfig && 
          (currentConfig.contractAddress !== contractAddress || currentConfig.chainId !== chainId)) {
        console.log(`🔄 Contract configuration changed:`);
        console.log(`   Previous: ${currentConfig.contractAddress} (Chain ${currentConfig.chainId})`);
        console.log(`   New: ${contractAddress} (Chain ${chainId})`);
        console.log('🗑️ Invalidating entire cache due to contract change...');
        
        // Clear all agent data for old contract
        await this.clearContract(currentConfig.contractAddress, currentConfig.chainId);
        
        // Clear memory cache completely
        this.memoryCache.clear();
        
        // Set new contract configuration
        await redis.set('current:contract_config', newConfig);
        
        console.log(`🗑️ Cache invalidated for new contract: ${contractAddress} (Chain ${chainId})`);
        return true; // Indicates cache was invalidated
      } else if (!currentConfig) {
        // First time setting contract configuration
        await redis.set('current:contract_config', newConfig);
        console.log(`📝 Initial contract set: ${contractAddress} (Chain ${chainId})`);
        return false; // No invalidation needed
      }
      
      // Same contract configuration, no change needed
      return false;
    } catch (error) {
      console.error('❌ Failed to set current contract configuration:', error);
      return false;
    }
  }

  /**
   * Force reload from Redis (for debugging)
   */
  async reload(): Promise<void> {
    console.log('🔄 Force reloading cache from Redis...');
    this.initialized = false;
    this.memoryCache.clear();
    this.ipfsMemoryCache.clear();
    await this.initialize();
  }
}

export default RedisAgentCache;