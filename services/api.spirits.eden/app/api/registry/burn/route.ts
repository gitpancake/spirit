import { NextRequest } from 'next/server';
import { BurnSchema } from '@/lib/validation';
import { verifySignedMessage, checkAuthorization, validateMessageTimestamp } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = BurnSchema.parse(body);
    const { tokenId, signature, message, signer } = validatedData;

    // Validate message timestamp to prevent replay attacks
    if (!validateMessageTimestamp(message)) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Message expired or invalid timestamp' 
      };
      return Response.json(response, { status: 400 });
    }

    // Verify signature
    if (!await verifySignedMessage(message, signature, signer)) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Invalid signature' 
      };
      return Response.json(response, { status: 401 });
    }

    // Check authorization
    if (!await checkAuthorization(signer, 'burn')) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Unauthorized: Only treasury can burn tokens' 
      };
      return Response.json(response, { status: 403 });
    }

    // Validate environment variables
    if (!process.env.PRIVATE_KEY || !process.env.RPC_URL) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Server configuration error' 
      };
      return Response.json(response, { status: 500 });
    }

    // Get agent info before burning
    const readContract = getContract();
    let agentId = '';
    try {
      agentId = await readContract.getAgentId(tokenId);
    } catch (error) {
      const response: ApiResponse = { 
        success: false, 
        error: 'Token does not exist' 
      };
      return Response.json(response, { status: 404 });
    }

    // Direct contract writes are no longer supported
    const response: ApiResponse = { 
      success: false,
      error: 'Direct contract writes are no longer supported. Please use the internal API service.',
      data: null
    };
    return Response.json(response, { status: 501 });

  } catch (error: any) {
    console.error('Burn error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.name === 'ZodError') {
      errorMessage = `Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`;
      statusCode = 400;
    } else if (error.code === 'CALL_EXCEPTION') {
      errorMessage = `Contract call failed: ${error.reason || error.message}`;
      statusCode = 400;
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for transaction';
      statusCode = 400;
    }

    const response: ApiResponse = { 
      success: false, 
      error: errorMessage 
    };

    return Response.json(response, { status: statusCode });
  }
}