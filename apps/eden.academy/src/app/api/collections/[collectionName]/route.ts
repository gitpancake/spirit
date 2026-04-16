import { NextRequest, NextResponse } from 'next/server'

interface CollectionResponse {
  success: boolean
  data?: unknown
  error?: string
}

interface RouteParams {
  params: Promise<{
    collectionName: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<CollectionResponse>> {
  try {
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const { collectionName } = await params

    if (!collectionName) {
      return NextResponse.json({
        success: false,
        error: 'Collection name is required'
      }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const queryParam = queryString ? `?${queryString}` : ''

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to API at:', `${apiUrl}/works/${collectionName}${queryParam}`)
    
    const response = await fetch(`${apiUrl}/works/${collectionName}${queryParam}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.EDEN_API_KEY,
      },
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Collection not found'
        }, { status: 404 })
      }
      
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch collection: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Collection fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}