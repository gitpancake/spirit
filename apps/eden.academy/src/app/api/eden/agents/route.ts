import { NextRequest, NextResponse } from 'next/server'

interface CreateAgentRequest {
  name: string
  key: string
  description: string
  image: string
  persona?: string
  isPersonaPublic?: boolean
  greeting?: string
  knowledge?: string
  voice?: string
  suggestions?: Array<{
    label: string
    prompt: string
  }>
  tools?: Record<string, boolean>
  llm_settings?: {
    model_profile?: 'low' | 'medium' | 'high'
    thinking_policy?: 'auto' | 'off' | 'always'
    thinking_effort_cap?: 'low' | 'medium' | 'high'
    thinking_effort_instructions?: string
  }
  models?: Array<{
    lora: string
    use_when?: string
  }>
}

interface CreateAgentResponse {
  success: boolean
  data?: {
    agentId: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateAgentResponse>> {
  try {
    console.log('Agent creation API called')
    
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      console.error('EDEN_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const body = await request.json() as CreateAgentRequest
    console.log('Received agent data:', body)

    // Validate required fields
    if (!body.name || !body.key || !body.description || !body.image) {
      console.error('Missing required fields:', { name: !!body.name, key: !!body.key, description: !!body.description, image: !!body.image })
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, key, description, image'
      }, { status: 400 })
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to Eden API at:', `${apiUrl}/api/eden/agents`)
    console.log('Using Eden API key:', process.env.EDEN_API_KEY ? 'KEY_SET' : 'KEY_NOT_SET')
    
    const response = await fetch(`${apiUrl}/api/eden/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.EDEN_API_KEY,
      },
      body: JSON.stringify(body)
    })

    console.log('Eden API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eden API error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to create agent: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        agentId: result.agentId
      }
    })

  } catch (error) {
    console.error('Agent creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}