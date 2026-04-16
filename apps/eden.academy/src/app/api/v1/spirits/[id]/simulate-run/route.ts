import { NextRequest, NextResponse } from 'next/server'

// Simulate practice run for preview
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id: spiritId } = resolvedParams

    // For MVP, return mock preview data
    // In full implementation, this would generate actual preview using AI

    const mockPreviews = {
      IMAGE: {
        preview_work_url: 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 1000),
        type: 'image',
        title: 'Sample AI Generated Artwork',
        description: 'Preview of spirit\'s visual creation capabilities'
      },
      TEXT: {
        preview_work_url: '',
        type: 'text',
        title: 'Sample Written Content',
        description: 'Preview of spirit\'s writing and analysis capabilities',
        content: 'This is a sample of the creative text that your spirit will generate during their practice sessions.'
      },
      AUDIO: {
        preview_work_url: '',
        type: 'audio', 
        title: 'Sample Audio Creation',
        description: 'Preview of spirit\'s audio generation capabilities'
      },
      PRODUCT: {
        preview_work_url: '',
        type: 'product',
        title: 'Sample Digital Product',
        description: 'Preview of spirit\'s product creation capabilities'
      },
      TOKEN: {
        preview_work_url: '',
        type: 'token',
        title: 'Sample Token Analysis', 
        description: 'Preview of spirit\'s market analysis capabilities'
      }
    }

    // Default to IMAGE if no specific type requested
    const previewType = 'IMAGE'
    const preview = mockPreviews[previewType]

    // Calculate next run time (mock)
    const nextRun = new Date()
    nextRun.setDate(nextRun.getDate() + 1) // Tomorrow
    nextRun.setHours(21, 0, 0, 0) // 21:00 UTC

    return NextResponse.json({
      success: true,
      data: {
        ...preview,
        next_run_iso: nextRun.toISOString(),
        spirit_id: spiritId
      }
    })
  } catch (error) {
    console.error('Error simulating run:', error)
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