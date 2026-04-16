import { NextRequest } from 'next/server';
import { getContract } from '@/lib/contract';
import { ApiResponse, Agent } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const agentId = params.id;

    if (!agentId) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Agent ID is required' 
      };
      return Response.json(response, { status: 400 });
    }

    // Validate RPC URL
    if (!process.env.RPC_URL) {
      const response: ApiResponse = { 
        success: false, 
        error: 'RPC_URL not configured' 
      };
      return Response.json(response, { status: 500 });
    }

    const contract = await getContract();

    try {
      // Get token ID for this agent
      const tokenId = await contract.read.getTokenIdByAgentId([agentId]);
      
      // Get additional details
      const [owner, metadataURI] = await Promise.all([
        contract.read.ownerOf([tokenId]),
        contract.read.tokenURI([tokenId])
      ]);

      const agent: Agent = {
        tokenId: tokenId.toString(),
        agentId,
        owner,
        metadataURI
      };

      const response: ApiResponse<Agent> = {
        success: true,
        data: agent
      };

      return Response.json(response);

    } catch (contractError: any) {
      // Handle case where agent doesn't exist
      if (contractError.code === 'CALL_EXCEPTION' || 
          contractError.reason?.includes('nonexistent') ||
          contractError.message?.includes('nonexistent')) {
        
        const response: ApiResponse = { 
          success: false, 
          error: 'Agent not found' 
        };
        return Response.json(response, { status: 404 });
      }
      
      throw contractError; // Re-throw if it's a different error
    }

  } catch (error: any) {
    console.error('Get agent error:', error);
    
    let errorMessage = 'Failed to fetch agent';
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

// Optional: Add PUT endpoint to update agent metadata URI
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const agentId = params.id;
    const body = await request.json();
    
    // This would require implementing setTokenURI functionality
    // Redirect to a dedicated setTokenURI endpoint for now
    const setTokenURIUrl = new URL('/api/registry/set-token-uri', request.url);
    
    const response: ApiResponse = { 
      success: false, 
      error: 'Agent metadata updates not implemented yet. Use /api/registry/set-token-uri endpoint.' 
    };
    
    return Response.json(response, { status: 501 });
    
  } catch (error: any) {
    const response: ApiResponse = { 
      success: false, 
      error: 'Method not implemented' 
    };
    return Response.json(response, { status: 501 });
  }
}