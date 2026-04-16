// POST /api/eden/sessions/send
// Proxy to Eden API: POST https://api.eden.art/v2/sessions

import { NextRequest } from 'next/server';
import { 
  handleOptions,
  makeEdenRequest,
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  getErrorMessage
} from '@/lib/eden-proxy-utils';
import { SendMessageRequest, NewMessage } from '@/lib/eden-proxy-types';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SendMessageRequest = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['sessionId', 'message']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Make request to Eden API
    const { response, duration } = await makeEdenRequest(
      '/sessions',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      request
    );

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        responseData.error || 'Failed to send message'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with new message data
    return createSuccessResponse<NewMessage>(responseData);

  } catch (error: any) {
    console.error('❌ Session send message error:', error);
    return createErrorResponse(
      error.message || 'Failed to send message',
      500
    );
  }
}