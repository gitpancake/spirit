const NEYNAR_API_BASE = 'https://api.neynar.com/v2'
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
const INVADERBOT_FID = process.env.INVADERBOT_FID

export interface NeynarCast {
  hash: string
  parent_hash: string | null
  parent_url: string | null
  root_parent_url: string | null
  parent_author: {
    fid: number
  } | null
  author: {
    object: string
    fid: number
    custody_address: string
    username: string
    display_name: string
    pfp_url: string
    profile: {
      bio: {
        text: string
        mentioned_profiles: any[]
      }
    }
    follower_count: number
    following_count: number
    verifications: string[]
    verified_addresses: {
      eth_addresses: string[]
      sol_addresses: string[]
    }
    active_status: string
    power_badge: boolean
  }
  text: string
  timestamp: string
  embeds: Array<{
    url?: string
    cast_id?: {
      fid: number
      hash: string
    }
  }>
  reactions: {
    likes_count: number
    recasts_count: number
    likes: Array<{
      fid: number
      fname: string
    }>
    recasts: Array<{
      fid: number
      fname: string
    }>
  }
  replies: {
    count: number
  }
  channel: {
    object: string
    id: string
    name: string
    description: string
    image_url: string
    lead: {
      object: string
      fid: number
      username: string
      display_name: string
      pfp_url: string
    }
    created_at: number
    follower_count: number
  } | null
  mentioned_profiles: any[]
}

export interface NeynarResponse {
  casts: NeynarCast[]
  next: {
    cursor: string | null
  }
}

export async function fetchInvaderbotCasts(limit: number = 25): Promise<NeynarCast[]> {
  if (!NEYNAR_API_KEY || !INVADERBOT_FID) {
    throw new Error('Missing Neynar API key or Invaderbot FID')
  }

  try {
    const response = await fetch(
      `${NEYNAR_API_BASE}/farcaster/feed/user/casts?fid=${INVADERBOT_FID}&limit=${limit}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`)
    }

    const data: NeynarResponse = await response.json()
    const allCasts = data.casts || []
    
    // Filter casts to only include those from 2025-08-01 14:34:09 onwards (first transmission)
    const firstTransmissionDate = new Date('2025-08-01T14:34:09Z')
    const filteredCasts = allCasts.filter(cast => {
      const castDate = new Date(cast.timestamp)
      return castDate >= firstTransmissionDate
    })
    
    return filteredCasts
  } catch (error: any) {
    // Suppress verbose proxy/network errors, only log essential info
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching invaderbot casts:', errorMsg)
    }
    throw new Error('Failed to fetch casts from Neynar API')
  }
}

export async function fetchCastById(castId: string): Promise<NeynarCast | null> {
  if (!NEYNAR_API_KEY) {
    throw new Error('Missing Neynar API key')
  }

  try {
    console.log('Fetching cast from Neynar API with ID:', castId)
    const response = await fetch(
      `${NEYNAR_API_BASE}/farcaster/cast?identifier=${castId}&type=hash`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    )

    console.log('Neynar API response status:', response.status)

    if (response.status === 404) {
      console.log('Cast not found in Neynar API')
      return null
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Neynar API error details:', errorText)
      throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Neynar API response received:', data ? 'Success' : 'No data')
    return data.cast || null
  } catch (error: any) {
    // Suppress verbose proxy/network errors, only log essential info
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching cast by ID:', castId, errorMsg)
    }
    throw new Error(`Failed to fetch cast ${castId}`)
  }
}

export async function getTodaysCasts(): Promise<NeynarCast[]> {
  try {
    const allCasts = await fetchInvaderbotCasts(50) // Fetch more to filter by today
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    return allCasts.filter(cast => {
      const castDate = new Date(cast.timestamp)
      return castDate >= todayStart
    })
  } catch (error: any) {
    // Suppress verbose proxy/network errors, only log essential info
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching today\'s casts:', errorMsg)
    }
    throw new Error('Failed to fetch today\'s casts')
  }
}

export async function getLatestCast(): Promise<NeynarCast | null> {
  try {
    const casts = await fetchInvaderbotCasts(1)
    return casts[0] || null
  } catch (error: any) {
    // Suppress verbose proxy/network errors, only log essential info
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching latest cast:', errorMsg)
    }
    throw new Error('Failed to fetch latest cast')
  }
}

export function formatCastForDisplay(cast: NeynarCast) {
  return {
    id: cast.hash,
    title: `TRANSMISSION_${new Date(cast.timestamp).toISOString().slice(0, 10)}`,
    content: cast.text,
    timestamp: cast.timestamp,
    date: new Date(cast.timestamp).toLocaleDateString(),
    likes: cast.reactions.likes_count,
    recasts: cast.reactions.recasts_count,
    replies: cast.replies.count,
    author: cast.author.display_name,
    username: cast.author.username,
    featured: cast.reactions.likes_count > 5 || cast.reactions.recasts_count > 3,
    embeds: cast.embeds || []
  }
}

export function getImageEmbeds(cast: NeynarCast): string[] {
  return cast.embeds
    .filter(embed => embed.url)
    .map(embed => embed.url!)
    .filter(url => {
      const lowercaseUrl = url.toLowerCase()
      return lowercaseUrl.includes('.jpg') || 
             lowercaseUrl.includes('.jpeg') || 
             lowercaseUrl.includes('.png') || 
             lowercaseUrl.includes('.gif') ||
             lowercaseUrl.includes('.webp')
    })
}