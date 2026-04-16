import { NextRequest } from 'next/server';
import { edenApi } from '@/lib/eden-api';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

interface CreateTriggerRequest {
  agentId: string;
  instruction: string;
  session_type: string;
  session?: any;
  schedule?: string;
  posting_instructions?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: agentId } = await params;
    
    if (!agentId) {
      return Response.json({
        success: false,
        error: 'Agent ID is required'
      }, { status: 400, headers: corsHeaders });
    }

    // Parse request body
    const body: CreateTriggerRequest = await request.json();
    
    // Validate required fields
    if (!body.instruction || !body.session_type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: instruction, session_type'
      }, { status: 400, headers: corsHeaders });
    }

    console.log(`⚡ Creating trigger for Eden agent: ${agentId}`);

    // Prepare the request body for Eden API
    const triggerData = {
      agentId: agentId,
      instruction: body.instruction,
      session_type: body.session_type,
      session: body.session,
      schedule: body.schedule,
      posting_instructions: body.posting_instructions,
    };

    // Use centralized Eden API client
    const result = await edenApi.createTrigger(agentId, triggerData);

    if (!result.success) {
      // Handle specific error cases
      let errorMessage = result.error || 'Failed to create trigger';
      
      if (result.status === 404) {
        errorMessage = 'Agent not found';
      } else if (result.status === 401 || result.status === 403) {
        errorMessage = 'User not authorized to create triggers for this agent';
      }

      return Response.json({
        success: false,
        error: errorMessage,
        details: result.data
      }, { status: result.status, headers: corsHeaders });
    }

    console.log(`✅ Trigger created for agent ${agentId}: ${result.data?.triggerId}`);

    // Return success response in our API format
    return Response.json({
      success: true,
      data: result.data
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error creating Eden agent trigger:', error);
    
    return Response.json({
      success: false,
      error: `Failed to create Eden agent trigger: ${error.message}`
    }, { status: 500, headers: corsHeaders });
  }
}