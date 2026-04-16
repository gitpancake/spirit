import { NextRequest, NextResponse } from 'next/server'
import { fetchCastById, formatCastForDisplay, getImageEmbeds } from '@/lib/neynar'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const castId = params.id
    console.log('Fetching cast with ID:', castId)

    // Validate cast ID format
    if (!castId || castId.length < 10) {
      console.log('Invalid cast ID format:', castId)
      return NextResponse.json({
        success: false,
        error: 'INVALID_TRANSMISSION_ID',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const cast = await fetchCastById(castId)
    console.log('Cast fetch result:', cast ? 'Found' : 'Not found')
    
    if (!cast) {
      return NextResponse.json({
        success: false,
        error: 'TRANSMISSION_NOT_FOUND',
        debug: { castId },
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    const formattedCast = formatCastForDisplay(cast)
    const imageEmbeds = getImageEmbeds(cast)
    console.log('Cast formatted successfully')
    
    const castData = {
      id: formattedCast.id,
      title: formattedCast.title,
      content: formattedCast.content,
      ascii_art: extractAsciiArt(formattedCast.content || ''),
      date: formattedCast.date,
      timestamp: formattedCast.timestamp,
      location: 'FARCASTER_GRID',
      status: 'ARCHIVED_TRANSMISSION',
      likes: formattedCast.likes,
      recasts: formattedCast.recasts,
      author: formattedCast.author,
      username: formattedCast.username,
      featured: formattedCast.featured,
      embeds: imageEmbeds,
      farcaster_url: `https://warpcast.com/${formattedCast.username}/${formattedCast.id.slice(0, 8)}`
    }

    return NextResponse.json({
      success: true,
      data: castData,
      message: 'TRANSMISSION_RETRIEVED',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching cast:', {
      message: error.message,
      stack: error.stack,
      castId: params.id
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'TRANSMISSION_ERROR: Unable to access cast',
        details: error.message,
        castId: params.id,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function extractAsciiArt(content: string): string {
  const lines = content.split('\n')
  const asciiLines = lines.filter(line => 
    line.includes('█') || 
    line.includes('▄') || 
    line.includes('▀') || 
    line.includes('■') ||
    line.includes('●') ||
    line.includes('○') ||
    line.includes('░') ||
    line.includes('▓') ||
    line.includes('▒')
  )
  
  if (asciiLines.length > 2) {
    return asciiLines.join('\n')
  }
  
  return `
    ▄▄▄▄▄
  ▄███████▄
 █████████████
███▄▄███▄▄███
█████████████`
}