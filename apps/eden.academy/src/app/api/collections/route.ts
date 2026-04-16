import { NextRequest, NextResponse } from 'next/server'

interface CollectionResponse {
  success: boolean
  data?: unknown
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<CollectionResponse>> {
  try {
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to Eden API at:', `${apiUrl}/api/eden/collections`)
    
    const response = await fetch(`${apiUrl}/api/eden/collections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.EDEN_API_KEY,
      },
    })

    console.log('Eden API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eden API error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch collections: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Collections fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}