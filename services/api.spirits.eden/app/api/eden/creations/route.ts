// GET /api/eden/creations
// Proxy to Eden API: GET https://api.eden.art/v2/creations

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

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const queryParams = parseQueryParams<CreationsQuery>(request, {
      limit: 50,
      page: 1,
    });

    // Validate limits
    if (queryParams.limit && (queryParams.limit < 1 || queryParams.limit > 100)) {
      return createErrorResponse('Limit must be between 1 and 100', 400);
    }

    if (queryParams.page && queryParams.page < 1) {
      return createErrorResponse('Page must be 1 or greater', 400);
    }

    // Create endpoint with query parameters
    const endpoint = createUrlWithParams('/creations', queryParams);

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
        responseData.error || 'Failed to get creations'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with creations data
    return createSuccessResponse<CreationsResponse>(responseData);

  } catch (error: any) {
    console.error('❌ Creations list error:', error);
    return createErrorResponse(
      error.message || 'Failed to get creations',
      500
    );
  }
}