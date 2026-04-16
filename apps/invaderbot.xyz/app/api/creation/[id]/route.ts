import { NextRequest, NextResponse } from 'next/server'
import { fetchAgentCreations, formatCreationForDisplay } from '@/lib/eden'

export const dynamic = 'force-dynamic'

const INVADER_AGENT_ID = 'invader-mosaic-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creationId = params.id
    console.log('Fetching creation with ID:', creationId)

    // Validate creation ID format
    if (!creationId || creationId.length < 10) {
      console.log('Invalid creation ID format:', creationId)
      return NextResponse.json({
        success: false,
        error: 'INVALID_CREATION_ID',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Fetch all creations to find the specific one
    // Note: Eden API might not have direct ID lookup, so we fetch and filter
    const edenResponse = await fetchAgentCreations(INVADER_AGENT_ID, 100)
    
    if (!edenResponse.docs || edenResponse.docs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_CREATIONS_FOUND',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Find the specific creation by ID
    const targetCreation = edenResponse.docs.find(creation => creation._id === creationId)
    
    if (!targetCreation) {
      console.log('Creation not found:', creationId)
      return NextResponse.json({
        success: false,
        error: 'CREATION_NOT_FOUND',
        debug: { creationId, totalCreations: edenResponse.docs.length },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Format the creation
    const formattedCreation = formatCreationForDisplay(targetCreation, 0)
    console.log('Creation formatted successfully')

    // Get all creations for navigation
    const allFormattedCreations = edenResponse.docs.map((creation, index) => 
      formatCreationForDisplay(creation, index)
    )

    return NextResponse.json({
      success: true,
      data: {
        creation: formattedCreation,
        allCreations: allFormattedCreations
      },
      message: 'CREATION_RETRIEVED',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching creation:', {
      message: error.message,
      stack: error.stack,
      creationId: params.id
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'CREATION_ERROR: Unable to access creation data',
        details: error.message,
        creationId: params.id,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}