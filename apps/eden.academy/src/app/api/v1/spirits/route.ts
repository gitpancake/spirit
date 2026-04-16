import { NextRequest, NextResponse } from 'next/server'

// Basic Gateway API v1 for spirit management
// This provides local endpoints for spirit CRUD operations

export async function GET() {
  // GET /api/v1/spirits - List spirits
  try {
    // For MVP, return empty list
    // In full implementation, this would query local database
    return NextResponse.json({
      success: true,
      data: {
        spirits: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    })
  } catch (error) {
    console.error('Error fetching spirits:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // POST /api/v1/spirits - Create new spirit draft
  try {
    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name is required' 
        },
        { status: 400 }
      )
    }

    // For MVP, return mock spirit ID
    // In full implementation, this would create database record
    const spiritId = crypto.randomUUID()

    return NextResponse.json({
      success: true,
      data: {
        spirit_id: spiritId,
        status: 'DRAFT',
        created_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating spirit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}