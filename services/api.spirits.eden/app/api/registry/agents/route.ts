import { NextRequest } from 'next/server';
import { getContract } from '@/lib/contract';
import { ApiResponse, Agent } from '@/lib/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Validate RPC URL
    if (!process.env.RPC_URL) {
      const response: ApiResponse = { 
        success: false, 
        error: 'RPC_URL not configured' 
      };
      return Response.json(response, { status: 500 });
    }

    const contract = await getContract();
    
    // Get all agent IDs
    const agentIds: string[] = await contract.read.getAllRegisteredAgents();

    // Fetch details for each agent
    const agents: Agent[] = await Promise.all(
      agentIds.map(async (agentId: string) => {
        try {
          const tokenId = await contract.read.getTokenIdByAgentId([agentId]);
          const owner = await contract.read.ownerOf([tokenId]);
          const metadataURI = await contract.read.tokenURI([tokenId]);

          return {
            tokenId: tokenId.toString(),
            agentId,
            owner,
            metadataURI
          };
        } catch (error) {
          // If individual agent lookup fails, log but continue
          console.error(`Failed to fetch details for agent ${agentId}:`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed lookups
    const validAgents = agents.filter((agent): agent is Agent => agent !== null);

    const response: ApiResponse<Agent[]> = {
      success: true,
      data: validAgents
    };

    return Response.json(response);

  } catch (error: any) {
    console.error('Get agents error:', error);
    
    let errorMessage = 'Failed to fetch agents';
    let statusCode = 500;

    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = `Contract call failed: ${error.reason || error.message}`;
      statusCode = 400;
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network connection error';
      statusCode = 503;
    }

    const response: ApiResponse = { 
      success: false, 
      error: errorMessage 
    };

    return Response.json(response, { status: statusCode });
  }
}

// Optional: Add POST endpoint to create new agents (alias for mint)
export async function POST(request: NextRequest): Promise<Response> {
  // Redirect to mint endpoint for consistency
  const mintUrl = new URL('/api/registry/mint', request.url);
  return Response.redirect(mintUrl, 307);
}