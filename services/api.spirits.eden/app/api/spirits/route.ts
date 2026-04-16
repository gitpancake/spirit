import { NextRequest, NextResponse } from 'next/server';
import RedisAgentCache from '@/lib/redis-agent-cache';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

interface AgentMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: any[];
  [key: string]: any;
}

interface AgentResponse {
  id: string;
  tokenId: string;
  owner: string;
  metadataURI: string;
  metadata: AgentMetadata | null;
  imageUrl?: string;
  contractAddress: string;
  chainId: number;
  lastUpdated: string;
  blockNumber: string;
  transactionHash: string;
  trainers?: string[];
}

// Helper function to resolve IPFS URLs to public gateways
function resolveIPFSUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  // If it's already a http/https URL, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }
  
  // Handle different IPFS URL formats
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${hash}`;
  }
  
  // If it's just a hash
  if (ipfsUrl.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) || ipfsUrl.match(/^baf[a-z0-9]{56}$/)) {
    return `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${ipfsUrl}`;
  }
  
  return ipfsUrl;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    
    // Get cache instance and current contract configuration
    const cache = RedisAgentCache.getInstance();
    const currentConfig = await cache.getCurrentContract();
    const contractAddress = searchParams.get('contract') || currentConfig?.contractAddress || '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1';
    const chainId = currentConfig?.chainId || 1; // Default to mainnet if no config

    console.log(`🔍 Fetching agents from cache - Page: ${page}, Limit: ${limit}, Contract: ${contractAddress}, Chain: ${chainId}`);

    // Get all agents for the contract and chain
    const allAgents = await cache.getAgents(contractAddress, chainId);
    
    if (allAgents.length === 0) {
      console.log('📭 No agents found in cache for this contract');
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPreviousPage: false
        },
        source: 'simple-cache',
        contractAddress
      }, { headers: corsHeaders });
    }

    console.log(`📦 Found ${allAgents.length} cached agents for contract ${contractAddress}`);

    // Calculate pagination
    const totalItems = allAgents.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);

    console.log(`📄 Pagination: Total=${totalItems}, Pages=${totalPages}, Start=${startIndex}, End=${endIndex}`);

    if (startIndex >= totalItems) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPreviousPage: page > 1
        },
        source: 'simple-cache',
        contractAddress
      }, { headers: corsHeaders });
    }

    // Get the page of agents (already sorted by tokenId ascending in cache)
    const pageAgents = allAgents.slice(startIndex, endIndex);
    
    // Transform to API response format
    const agents: AgentResponse[] = pageAgents.map(agent => {
      // Resolve image URL if metadata is present
      let imageUrl: string | undefined;
      if (agent.metadata?.image) {
        imageUrl = resolveIPFSUrl(agent.metadata.image);
      }

      return {
        id: agent.tokenId,
        tokenId: agent.tokenId,
        owner: agent.owner,
        metadataURI: `ipfs://${agent.ipfsHash}`,
        metadata: agent.metadata,
        imageUrl,
        contractAddress: agent.contractAddress,
        chainId: agent.chainId,
        lastUpdated: new Date(agent.lastUpdated).toISOString(),
        blockNumber: agent.blockNumber,
        transactionHash: agent.transactionHash,
        trainers: agent.trainers || []
      };
    });

    const result = {
      success: true,
      data: agents,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      source: 'simple-cache',
      contractAddress
    };

    console.log(`✅ Successfully returned ${agents.length} agents from simple cache (page ${page})`);
    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error fetching agents from simple cache:', error);
    return NextResponse.json(
      { 
        error: `Failed to fetch agents from simple cache: ${error.message}`,
        source: 'simple-cache'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}