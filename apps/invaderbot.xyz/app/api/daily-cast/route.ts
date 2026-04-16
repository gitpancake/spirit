import { NextRequest, NextResponse } from 'next/server'
import { getTodaysCasts, formatCastForDisplay, getLatestCast } from '@/lib/neynar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const todaysCasts = await getTodaysCasts()
    
    // If no casts today, get the latest cast from any date
    let latestCast
    if (todaysCasts.length === 0) {
      latestCast = await getLatestCast()
      
      if (!latestCast) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'NO_TRANSMISSIONS_AVAILABLE',
          timestamp: new Date().toISOString()
        })
      }
    } else {
      // Get the most recent cast from today
      latestCast = todaysCasts[0]
    }
    const formattedCast = formatCastForDisplay(latestCast)
    
    const dailyCast = {
      id: formattedCast.id,
      title: formattedCast.title,
      content: formattedCast.content,
      ascii_art: extractAsciiArt(formattedCast.content),
      date: formattedCast.date,
      timestamp: formattedCast.timestamp,
      location: 'FARCASTER_GRID',
      status: 'ACTIVE_TRANSMISSION',
      likes: formattedCast.likes,
      recasts: formattedCast.recasts,
      replies: formattedCast.replies,
      cast_url: `/cast/${formattedCast.id}`
    }

    return NextResponse.json({
      success: true,
      data: dailyCast,
      message: 'DAILY_CAST_RETRIEVED',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching daily cast:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'TRANSMISSION_INTERRUPTED: Daily cast unavailable',
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
    line.includes('○')
  )
  
  if (asciiLines.length > 2) {
    return asciiLines.join('\n')
  }
  
  // Fallback ASCII if no art detected
  return `
    ▄▄▄▄▄
  ▄███████▄
 █████████████
███▄▄███▄▄███
█████████████
▄▄█▄█████▄█▄▄
█▄▄▄▄▄▄▄▄▄▄▄█
▄█▄▄▄▄▄▄▄▄▄█▄`
}