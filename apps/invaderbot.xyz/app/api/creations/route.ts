import { NextRequest, NextResponse } from 'next/server'
import { fetchInvaderbotCasts, formatCastForDisplay, getImageEmbeds } from '@/lib/neynar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 25

    // Fetch invaderbot's casts from Neynar
    const casts = await fetchInvaderbotCasts(limit)
    
    if (casts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'NO_TRANSMISSIONS_FOUND',
        timestamp: new Date().toISOString()
      })
    }

    // Format casts for display
    const formattedCreations = casts.map((cast, index) => {
      const formatted = formatCastForDisplay(cast)
      const imageEmbeds = getImageEmbeds(cast)
      
      return {
        id: formatted.id,
        title: formatted.title,
        content: formatted.content,
        date: formatted.date,
        timestamp: formatted.timestamp,
        featured: formatted.featured,
        ascii_art: extractAsciiArt(formatted.content),
        location: 'FARCASTER_GRID',
        transmission_id: `TX_${formatted.id.slice(0, 8)}`,
        likes: formatted.likes,
        recasts: formatted.recasts,
        replies: formatted.replies,
        cast_url: `/cast/${formatted.id}`,
        author: formatted.author,
        username: formatted.username,
        embeds: imageEmbeds,
        preview_image: imageEmbeds[0] || null // First image as preview
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedCreations,
      total: formattedCreations.length,
      message: 'ARCHIVES_ACCESSED',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching creations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'TRANSMISSION_ERROR: Unable to access archives',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper function to extract ASCII art from cast content
function extractAsciiArt(content: string): string {
  // Look for ASCII art patterns in the content
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
  
  // Fallback ASCII based on content length
  const variations = [
    `  ▄▄▄
 █████
▄█▄█▄█▄
▀▄▀▄▀▄▀`,
    `    ▄▄▄▄▄
  ▄███████▄
 █████████████
███▄▄███▄▄███`,
    `  ▄▄█▄▄
▄███████▄
███████████
█▄▄▄█▄▄▄█`
  ]
  
  return variations[Math.floor(Math.random() * variations.length)]
}