// GET /api/eden/users/[id]/creations
// Proxy to Eden API: GET https://api.eden.art/v2/users/{userId}/creations

import { NextRequest } from 'next/server';
import { 
  handleOptions,
  makeEdenRequest,
  createSuccessResponse,
  createErrorResponse,
  parseQueryParams,
  createUrlWithParams,
  getErrorMessage
} from '@/lib/eden-proxy-utils';
import { CreationsQuery, CreationsResponse } from '@/lib/eden-proxy-types';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;

    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      return createErrorResponse('Invalid user ID', 400);
    }

    // Parse query parameters
    const queryParams = parseQueryParams<CreationsQuery>(request, {
      page: 1,
      limit: 50,
    });

    // Validate limits
    if (queryParams.limit && (queryParams.limit < 1 || queryParams.limit > 100)) {
      return createErrorResponse('Limit must be between 1 and 100', 400);
    }

    if (queryParams.page && queryParams.page < 1) {
      return createErrorResponse('Page must be 1 or greater', 400);
    }

    // Create endpoint with query parameters
    const endpoint = createUrlWithParams(`/users/${userId}/creations`, queryParams);

    // Make request to Eden API
    const { response, duration } = await makeEdenRequest(
      endpoint,
      {
        method: 'GET',
      },
      request
    );

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        responseData.error || 'Failed to get user creations'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with user creations
    return createSuccessResponse<CreationsResponse>(responseData);

  } catch (error: any) {
    console.error('❌ User creations error:', error);
    return createErrorResponse(
      error.message || 'Failed to get user creations',
      500
    );
  }
}