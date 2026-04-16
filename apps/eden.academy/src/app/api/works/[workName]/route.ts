import { NextRequest, NextResponse } from 'next/server'

interface WorkResponse {
  success: boolean
  data?: unknown
  error?: string
}

interface RouteParams {
  params: Promise<{
    workName: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<WorkResponse>> {
  try {
    // Check if Eden API key is configured
    if (!process.env.EDEN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Eden API not configured'
      }, { status: 500 })
    }

    const { workName } = await params

    if (!workName) {
      return NextResponse.json({
        success: false,
        error: 'Work name is required'
      }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const queryParam = queryString ? `?${queryString}` : ''

    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    console.log('Making request to API at:', `${apiUrl}/api/works/${workName}${queryParam}`)
    
    const response = await fetch(`${apiUrl}/api/works/${workName}${queryParam}`, {
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
          error: 'Work not found'
        }, { status: 404 })
      }
      
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch work: ${response.status} ${errorText}`
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Work fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}