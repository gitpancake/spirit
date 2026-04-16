// GET /api/eden/sessions/[id]
// Proxy to Eden API: GET https://api.eden.art/v2/sessions/{id}

import { NextRequest } from 'next/server';
import { 
  handleOptions,
  makeEdenRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage
} from '@/lib/eden-proxy-utils';
import { Session } from '@/lib/eden-proxy-types';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate session ID
    if (!id || typeof id !== 'string') {
      return createErrorResponse('Invalid session ID', 400);
    }

    // Make request to Eden API
    const { response, duration } = await makeEdenRequest(
      `/sessions/${id}`,
      {
        method: 'GET',
      },
      request
    );

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        responseData.error || 'Failed to get session'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with session data
    return createSuccessResponse<Session>(responseData);

  } catch (error: any) {
    console.error('❌ Session get error:', error);
    return createErrorResponse(
      error.message || 'Failed to get session',
      500
    );
  }
}