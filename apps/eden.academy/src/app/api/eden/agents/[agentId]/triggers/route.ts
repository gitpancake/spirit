import { NextRequest, NextResponse } from 'next/server'

interface CreateTriggerRequest {
  instruction: string
  session_type: string
  schedule: string
  session?: Record<string, unknown>
  posting_instructions?: string
}

interface CreateTriggerResponse {
  success: boolean
  data?: {
    triggerId: string
  }
  error?: string
}

interface RouteParams {
  params: Promise<{
    agentId: string
  }>
}

export async function POST(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<CreateTriggerResponse>> {
  try {
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const body = await request.json() as CreateTriggerRequest
    const { agentId } = await params

    // Validate required fields
    if (!body.instruction || !body.session_type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: instruction, session_type'
      }, { status: 400 })
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to Eden API at:', `${apiUrl}/api/eden/agents/${agentId}/triggers`)
    
    const response = await fetch(`${apiUrl}/api/eden/agents/${agentId}/triggers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.EDEN_API_KEY,
      },
      body: JSON.stringify({
        instruction: body.instruction,
        session_type: body.session_type,
        session: body.session,
        schedule: body.schedule,
        posting_instructions: body.posting_instructions,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eden API trigger error:', response.status, errorText)
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Agent not found'
        }, { status: 404 })
      }
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'User not authorized to create triggers for this agent'
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        error: `Failed to create trigger: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        triggerId: result.triggerId
      }
    })

  } catch (error) {
    console.error('Trigger creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}