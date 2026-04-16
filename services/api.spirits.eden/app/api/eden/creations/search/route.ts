// GET /api/eden/creations/search
// Proxy to Eden API: GET https://api.eden.art/v2/creations/search

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
import { CreationsSearchQuery, CreationsResponse } from '@/lib/eden-proxy-types';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const queryParams = parseQueryParams<CreationsSearchQuery>(request, {
      page: 1,
      limit: 50,
    });

    // Validate required search query
    if (!queryParams.q || typeof queryParams.q !== 'string') {
      return createErrorResponse('Search query parameter "q" is required', 400);
    }

    // Validate limits
    if (queryParams.limit && (queryParams.limit < 1 || queryParams.limit > 100)) {
      return createErrorResponse('Limit must be between 1 and 100', 400);
    }

    if (queryParams.page && queryParams.page < 1) {
      return createErrorResponse('Page must be 1 or greater', 400);
    }

    // Create endpoint with query parameters
    const endpoint = createUrlWithParams('/creations/search', queryParams);

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
        responseData.error || 'Failed to search creations'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with search results
    return createSuccessResponse<CreationsResponse>(responseData);

  } catch (error: any) {
    console.error('❌ Creations search error:', error);
    return createErrorResponse(
      error.message || 'Failed to search creations',
      500
    );
  }
}