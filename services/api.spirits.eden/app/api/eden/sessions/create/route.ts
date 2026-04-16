// POST /api/eden/sessions/create
// Proxy to Eden API: POST https://api.eden.art/v2/sessions/create

import { NextRequest } from 'next/server';
import { 
  handleOptions,
  makeEdenRequest,
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  getErrorMessage
} from '@/lib/eden-proxy-utils';
import { CreateSessionRequest, Session } from '@/lib/eden-proxy-types';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateSessionRequest = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['agentId']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Transform request body to match Eden API format
    const edenRequestBody = {
      agent_ids: [body.agentId], // Convert agentId string to agent_ids array
      config: body.config || {}
    };

    // Make request to Eden API
    const { response, duration } = await makeEdenRequest(
      '/sessions/create',
      {
        method: 'POST',
        body: JSON.stringify(edenRequestBody),
      },
      request
    );

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        responseData.error || 'Failed to create session'
      );
      return createErrorResponse(
        errorMessage,
        response.status,
        responseData.message || responseData.details
      );
    }

    // Return success response with session data
    return createSuccessResponse<{ sessionId: string; data: Session }>({
      sessionId: responseData._id,
      data: responseData,
    });

  } catch (error: any) {
    console.error('❌ Session create error:', error);
    return createErrorResponse(
      error.message || 'Failed to create session',
      500
    );
  }
}