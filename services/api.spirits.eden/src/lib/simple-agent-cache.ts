// Simple, permanent cache system organized by contract address
// Structure:
// - contracts/[contractAddress]/tokens/[tokenId] = ipfsHash
// - ipfs/[ipfsHash] = resolvedMetadata

interface AgentData {
  tokenId: string;
  ipfsHash: string;
  owner: string;
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

class SimpleAgentCache {
  private static instance: SimpleAgentCache;
  
  // Contract-based token storage: contracts/[address]/tokens/[tokenId] = ipfsHash
  private contractTokens = new Map<string, Map<string, string>>(); // contractAddress -> (tokenId -> ipfsHash)
  
  // IPFS metadata cache: ipfsHash -> resolved metadata
  private ipfsCache = new Map<string, IPFSData>();
  
  // Agent data cache: contractAddress/tokenId -> full agent data  
  private agentCache = new Map<string, AgentData>();

  public static getInstance(): SimpleAgentCache {
    if (!SimpleAgentCache.instance) {
      SimpleAgentCache.instance = new SimpleAgentCache();
    }
    return SimpleAgentCache.instance;
  }

  /**
   * Store token data
   */
  setToken(params: {
    contractAddress: string;
    tokenId: string;
    ipfsHash: string;
    owner: string;
    metadata: any;
    chainId: number;
    blockNumber: string;
    transactionHash: string;
  }): void {
    const { contractAddress, tokenId, ipfsHash, owner, metadata, chainId, blockNumber, transactionHash } = params;
    
    console.log(`💾 Caching token ${tokenId} for contract ${contractAddress}`);
    
    // 1. Store contract -> tokenId -> ipfsHash mapping
    if (!this.contractTokens.has(contractAddress)) {
      this.contractTokens.set(contractAddress, new Map());
    }
    this.contractTokens.get(contractAddress)!.set(tokenId, ipfsHash);
    
    // 2. Store IPFS hash -> metadata mapping (if we have metadata)
    if (metadata && ipfsHash) {
      this.ipfsCache.set(ipfsHash, {
        hash: ipfsHash,
        metadata,
        lastFetched: Date.now()
      });
      console.log(`📁 Cached IPFS metadata for ${ipfsHash}`);
    }
    
    // 3. Store full agent data
    const agentKey = `${contractAddress}/${tokenId}`;
    const agentData: AgentData = {
      tokenId,
      ipfsHash,
      owner,
      metadata,
      contractAddress,
      chainId,
      blockNumber,
      transactionHash,
      lastUpdated: Date.now()
    };
    
    this.agentCache.set(agentKey, agentData);
    console.log(`✅ Cached agent data for ${agentKey}`);
  }

  /**
   * Get all token IDs for a contract
   */
  getTokenIds(contractAddress: string): string[] {
    const tokens = this.contractTokens.get(contractAddress);
    if (!tokens) return [];
    
    return Array.from(tokens.keys()).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Get agent data by contract and token ID
   */
  getAgent(contractAddress: string, tokenId: string): AgentData | null {
    const agentKey = `${contractAddress}/${tokenId}`;
    return this.agentCache.get(agentKey) || null;
  }

  /**
   * Get all agents for a contract
   */
  getAgents(contractAddress: string): AgentData[] {
    const tokenIds = this.getTokenIds(contractAddress);
    const agents: AgentData[] = [];
    
    for (const tokenId of tokenIds) {
      const agent = this.getAgent(contractAddress, tokenId);
      if (agent) {
        agents.push(agent);
      }
    }
    
    return agents;
  }

  /**
   * Get IPFS metadata if cached
   */
  getIPFSMetadata(ipfsHash: string): any | null {
    const ipfsData = this.ipfsCache.get(ipfsHash);
    return ipfsData ? ipfsData.metadata : null;
  }

  /**
   * Remove token (for deregistration)
   */
  removeToken(contractAddress: string, tokenId: string): void {
    console.log(`🗑️ Removing token ${tokenId} from contract ${contractAddress}`);
    
    // Remove from contract tokens
    const contractTokensMap = this.contractTokens.get(contractAddress);
    if (contractTokensMap) {
      contractTokensMap.delete(tokenId);
    }
    
    // Remove from agent cache
    const agentKey = `${contractAddress}/${tokenId}`;
    this.agentCache.delete(agentKey);
    
    // Note: We keep IPFS cache as other tokens might use the same hash
  }

  /**
   * Clear all data for a contract (when contract changes)
   */
  clearContract(contractAddress: string): void {
    console.log(`🗑️ Clearing all data for contract ${contractAddress}`);
    
    // Remove contract tokens
    this.contractTokens.delete(contractAddress);
    
    // Remove all agent data for this contract
    for (const [key] of this.agentCache.entries()) {
      if (key.startsWith(`${contractAddress}/`)) {
        this.agentCache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): any {
    const contractStats: any = {};
    
    for (const [contractAddress, tokens] of this.contractTokens.entries()) {
      contractStats[contractAddress] = {
        tokenCount: tokens.size,
        tokenIds: Array.from(tokens.keys()).sort((a, b) => parseInt(a) - parseInt(b))
      };
    }
    
    return {
      totalContracts: this.contractTokens.size,
      totalAgents: this.agentCache.size,
      totalIPFSEntries: this.ipfsCache.size,
      contracts: contractStats
    };
  }
}

export default SimpleAgentCache;