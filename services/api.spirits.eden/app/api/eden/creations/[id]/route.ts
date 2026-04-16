// GET /api/eden/creations/[id]
// Proxy to Eden API: GET https://api.eden.art/v2/creations/{id}

import { NextRequest } from 'next/server';
import { 
  handleOptions,
  makeEdenRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage
} from '@/lib/eden-proxy-utils';
import { Creation } from '@/lib/eden-proxy-types';

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

    // Validate creation ID
    if (!id || typeof id !== 'string') {
      return createErrorResponse('Invalid creation ID', 400);
    }

    // Make request to Eden API
    const { response, duration } = await makeEdenRequest(
      `/creations/${id}`,
      {
        method: 'GET',
      },
      request
    );

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        responseData.error || 'Failed to get creation'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with creation data
    return createSuccessResponse<Creation>(responseData);

  } catch (error: any) {
    console.error('❌ Creation get error:', error);
    return createErrorResponse(
      error.message || 'Failed to get creation',
      500
    );
  }
}