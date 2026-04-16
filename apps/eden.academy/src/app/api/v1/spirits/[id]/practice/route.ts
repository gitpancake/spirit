import { NextRequest, NextResponse } from 'next/server'

// Practice management for specific spirit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id: spiritId } = resolvedParams
    const body = await request.json()

    // Validate practice payload
    const { type, cadence, time_utc, quantity, output_kind, config_json } = body

    if (!type || !cadence || !time_utc || !output_kind || !config_json) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required practice fields' 
        },
        { status: 400 }
      )
    }

    // For MVP, create covenant and return mock CID
    // In full implementation, this would:
    // 1. Store practice in database
    // 2. Pin covenant JSON to IPFS
    // 3. Return actual IPFS CID

    const covenant = {
      spirit_id: spiritId,
      type,
      cadence,
      time_utc,
      rest_day: body.rest_day,
      quantity,
      output_kind,
      config_json,
      version: '1.0.0',
      created_at: new Date().toISOString()
    }

    // Mock IPFS pinning - in real implementation, use existing IPFS infrastructure
    const mockCid = `Qm${Math.random().toString(36).substring(2, 47)}`

    return NextResponse.json({
      success: true,
      data: {
        cid: mockCid,
        covenant: covenant
      }
    })
  } catch (error) {
    console.error('Error saving practice:', error)
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