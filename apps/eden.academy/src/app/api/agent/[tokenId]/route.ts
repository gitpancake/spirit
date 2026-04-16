import { NextRequest, NextResponse } from 'next/server'

interface AgentResponse {
  success: boolean
  data?: unknown
  error?: string
}

interface RouteParams {
  params: Promise<{
    tokenId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AgentResponse>> {
  try {
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const { tokenId } = await params

    if (!tokenId) {
      return NextResponse.json({
        success: false,
        error: 'Token ID is required'
      }, { status: 400 })
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to Eden API at:', `${apiUrl}/api/spirits/${tokenId}`)
    
    const response = await fetch(`${apiUrl}/api/spirits/${tokenId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.EDEN_API_KEY,
      },
    })

    console.log('Eden API response status:', response.status)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Agent not found'
        }, { status: 404 })
      }
      
      const errorText = await response.text()
      console.error('Eden API error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch agent: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    // Extract the actual spirit data - the external API already wraps it properly
    const spiritData = result.data || result
    
    return NextResponse.json({
      success: true,
      data: spiritData
    })

  } catch (error) {
    console.error('Agent fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}