import { NextRequest } from 'next/server';
import { edenApi } from '@/lib/eden-api';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Extract API key from request headers
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return Response.json({
        success: false,
        error: 'X-API-Key header is required for Eden API requests'
      }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    console.log(`🤖 Fetching Eden agents: limit=${limit}, page=${page}`);
    
    // Use centralized Eden API client to get all agents
    const result = await edenApi.getAllAgents(apiKey, { limit, page });

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error,
        details: result.data
      }, { status: result.status, headers: corsHeaders });
    }

    console.log(`✅ Retrieved ${result.data?.docs?.length || 0} Eden agents`);

    // Return success response in our API format
    return Response.json({
      success: true,
      data: result.data
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ General error fetching Eden agents:', error);
    
    return Response.json({
      success: false,
      error: `Failed to fetch Eden agents: ${error.message}`,
      stack: error.stack
    }, { status: 500, headers: corsHeaders });
  }
}

interface CreateAgentRequest {
  name: string;
  key: string;
  description: string;
  image: string;
  models?: Array<{
    lora: string;
    use_when?: string;
  }>;
  persona?: string;
  isPersonaPublic?: boolean;
  greeting?: string;
  knowledge?: string;
  voice?: string;
  suggestions?: Array<{
    label: string;
    prompt: string;
  }>;
  tools?: Record<string, boolean>;
  llm_settings?: {
    model_profile?: 'low' | 'medium' | 'high';
    thinking_policy?: 'auto' | 'off' | 'always';
    thinking_effort_cap?: 'low' | 'medium' | 'high';
    thinking_effort_instructions?: string;
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Extract API key from request headers
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return Response.json({
        success: false,
        error: 'X-API-Key header is required for Eden API requests'
      }, { status: 401, headers: corsHeaders });
    }

    // Parse request body
    const body: CreateAgentRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.key || !body.description || !body.image) {
      return Response.json({
        success: false,
        error: 'Missing required fields: name, key, description, image'
      }, { status: 400, headers: corsHeaders });
    }

    console.log(`🤖 Creating Eden agent: ${body.name} (${body.key})`);

    // Use centralized Eden API client
    const result = await edenApi.createAgent(apiKey, body);

    if (!result.success) {
      // Handle specific case where agent already exists
      if (result.status === 409) {
        return Response.json({
          success: false,
          error: `An agent with key "${body.key}" already exists. Please use a different key or retrieve the existing agent.`,
          existingKey: body.key,
          details: result.data
        }, { status: 409, headers: corsHeaders });
      }

      return Response.json({
        success: false,
        error: result.error,
        details: result.data
      }, { status: result.status, headers: corsHeaders });
    }

    console.log(`✅ Eden agent created: ${result.data?.agentId}`);

    // Return success response in our API format
    return Response.json({
      success: true,
      data: result.data
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error creating Eden agent:', error);
    
    return Response.json({
      success: false,
      error: `Failed to create Eden agent: ${error.message}`
    }, { status: 500, headers: corsHeaders });
  }
}