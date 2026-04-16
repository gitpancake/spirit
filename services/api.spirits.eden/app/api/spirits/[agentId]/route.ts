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
  metadataURI: string;
  metadata: AgentMetadata | null;
  imageUrl?: string;
  ownership: {
    owner: string;
    trainers: string[];
  };
  contractAddress: string;
  chainId: number;
  lastUpdated: string;
  blockNumber: string;
  transactionHash: string;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { agentId } = await params;

    // Get cache instance and current contract configuration
    const cache = RedisAgentCache.getInstance();
    const currentConfig = await cache.getCurrentContract();
    const contractAddress = searchParams.get('contract') || currentConfig?.contractAddress || '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1';
    const chainId = currentConfig?.chainId || 1; // Default to mainnet if no config

    console.log(`🔍 Fetching agent ${agentId} from contract ${contractAddress}, Chain: ${chainId}`);

    // Get specific agent
    const agent = await cache.getAgent(contractAddress, agentId, chainId);
    
    if (!agent) {
      console.log(`📭 Agent ${agentId} not found in cache for contract ${contractAddress}`);
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
        tokenId: agentId,
        contractAddress
      }, { status: 404, headers: corsHeaders });
    }

    console.log(`📦 Found cached agent ${agentId} for contract ${contractAddress}`);

    // Resolve image URL if metadata is present
    let imageUrl: string | undefined;
    if (agent.metadata?.image) {
      imageUrl = resolveIPFSUrl(agent.metadata.image);
    }

    const agentResponse: AgentResponse = {
      id: agent.tokenId,
      tokenId: agent.tokenId,
      metadataURI: `ipfs://${agent.ipfsHash}`,
      metadata: agent.metadata,
      imageUrl,
      ownership: {
        owner: agent.owner,
        trainers: agent.trainers || []
      },
      contractAddress: agent.contractAddress,
      chainId: agent.chainId,
      lastUpdated: new Date(agent.lastUpdated).toISOString(),
      blockNumber: agent.blockNumber,
      transactionHash: agent.transactionHash
    };

    const result = {
      success: true,
      data: agentResponse,
      source: 'simple-cache',
      contractAddress
    };

    console.log(`✅ Successfully returned agent ${agentId} from simple cache`);
    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error: any) {
    console.error(`❌ Error fetching agent ${params.agentId} from simple cache:`, error);
    return NextResponse.json(
      { 
        error: `Failed to fetch agent ${params.agentId} from simple cache: ${error.message}`,
        source: 'simple-cache'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}