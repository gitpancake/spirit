import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

const INVADERBOT_SYSTEM_PROMPT = `You are INVADERBOT, an AI entity specialized in space invader mosaics and pixel art. You operate from a mission control center and communicate in a retro-futuristic, mission-oriented voice. 

PERSONALITY TRAITS:
- Speak like a space mission control operator from the 1970s-80s
- Use technical jargon and mission terminology
- Reference your daily transmission protocol and urban invasion objectives
- Mention your training on space invader mosaics and pixel art generation
- Be enthusiastic about retro gaming, ASCII art, and terminal aesthetics
- Occasionally reference your operational status and system diagnostics

NFT ANALYSIS CAPABILITIES:
- You can analyze NFTs for their alignment with space invader/retro gaming aesthetics
- Consider pixel art quality, retro gaming themes, space/alien motifs
- Evaluate collections for their artistic merit and cultural significance
- Make BUY/PASS recommendations based on mission parameters
- Reference price analysis in relation to artistic value
- Always maintain character while providing detailed analysis

COMMUNICATION STYLE:
- Use phrases like "MISSION_CONTROL_ONLINE", "TRANSMISSION_RECEIVED", "OPERATIONAL_STATUS_GREEN"
- Reference your "Genesis Chamber" where you create space invader art
- Mention your daily cast protocol on Farcaster
- Use terminal/console formatting in responses when appropriate
- When analyzing NFTs, use phrases like "SCANNING_NFT_DATA", "ARTISTIC_ANALYSIS_COMPLETE", "RECOMMENDATION_GENERATED"
- Keep responses concise but engaging
- Always maintain the character of an AI from a retro space mission

NFT DECISION CRITERIA:
- Pixel art quality and authenticity
- Space/alien/retro gaming themes
- Historical significance in digital art
- Price reasonableness for artistic value
- Collection reputation and community
- Alignment with INVADERBOT's urban invasion mission

EXAMPLE RESPONSES:
- "TRANSMISSION_RECEIVED :: Mission Control here. Current operational status is GREEN and all systems nominal."
- "GENESIS_CHAMBER reports 41 space invader entities successfully generated. Daily cast protocol remains active."
- "NFT_ANALYSIS_COMPLETE :: This pixel art shows excellent 8-bit characteristics. RECOMMENDATION: BUY - Aligns with urban invasion protocols."
- "SCANNING_COLLECTION_DATA :: Detecting low-quality generated art. RECOMMENDATION: PASS - Does not meet Genesis Chamber standards."

Remember: You are not Claude - you are INVADERBOT, the space invader AI entity from invaderbot.xyz`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Detect OpenSea URLs in message
function detectOpenSeaURL(message: string): string | null {
  const openSeaRegex = /https?:\/\/opensea\.io\/(?:assets?\/[^\/]+\/[^\/]+\/[^\/\s]+|item\/[^\/]+\/[^\/]+\/[^\/\s]+)/g
  const match = message.match(openSeaRegex)
  return match ? match[0] : null
}

// Parse OpenSea URL to extract contract and token ID
function parseOpenSeaURL(url: string): { contract: string; tokenId: string; chain: string } | null {
  try {
    const regex = /opensea\.io\/assets?\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/
    const match = url.match(regex)
    
    if (match) {
      const [, chain, contract, tokenId] = match
      return { contract, tokenId, chain }
    }
    
    // Alternative format: opensea.io/item/ethereum/contract/tokenId  
    const altRegex = /opensea\.io\/item\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/
    const altMatch = url.match(altRegex)
    
    if (altMatch) {
      const [, chain, contract, tokenId] = altMatch
      return { contract, tokenId, chain }
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Fetch NFT metadata directly from OpenSea
async function fetchNFTMetadata(url: string) {
  try {
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY
    const OPENSEA_API_BASE = 'https://api.opensea.io/v2'
    
    if (!OPENSEA_API_KEY) {
      console.log('OpenSea API key not configured')
      return null
    }
    
    // Parse the OpenSea URL
    const parsed = parseOpenSeaURL(url)
    if (!parsed) {
      console.log('Invalid OpenSea URL format')
      return null
    }

    const { contract, tokenId, chain } = parsed
    
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'x-api-key': OPENSEA_API_KEY
    }

    const nftResponse = await fetch(
      `${OPENSEA_API_BASE}/chain/${chain}/contract/${contract}/nfts/${tokenId}`,
      { headers }
    )
    
    if (!nftResponse.ok) {
      console.error('OpenSea API error:', nftResponse.status)
      return null
    }

    const nftData = await nftResponse.json()
    const nft = nftData.nft

    // Try to fetch original metadata for more accurate image
    let originalImage = null
    if (nft.metadata_url) {
      try {
        const metadataResponse = await fetch(nft.metadata_url)
        if (metadataResponse.ok) {
          const originalMetadata = await metadataResponse.json()
          if (originalMetadata.image) {
            // Convert IPFS URLs to HTTP gateway URLs (try multiple gateways)
            if (originalMetadata.image.startsWith('ipfs://')) {
              const ipfsHash = originalMetadata.image.replace('ipfs://', '')
              // Try gateway.pinata.cloud which is more reliable
              originalImage = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            } else {
              originalImage = originalMetadata.image
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch original metadata:', nft.metadata_url, error)
      }
    }
    
    console.log('Image URLs - Original:', originalImage, 'OpenSea:', nft.image_url)

    // Format response - prioritize original metadata image, then fallback to OpenSea
    const imageUrl = originalImage || nft.display_image_url || nft.image_original_url || nft.image_url
    
    const metadata = {
      nft: {
        name: nft.name,
        description: nft.description,
        image_url: imageUrl,
        contract_address: contract,
        token_id: tokenId,
        chain: chain,
        opensea_url: nft.opensea_url || url,
        traits: nft.traits || [],
        is_nsfw: nft.is_nsfw,
        token_standard: nft.token_standard
      },
      collection: nft.collection ? {
        name: nft.collection.name,
        description: nft.collection.description,
        image_url: nft.collection.image_url,
        opensea_url: nft.collection.permalink,
        twitter_username: nft.collection.twitter_username,
        discord_url: nft.collection.discord_url,
        category: null
      } : null
    }
    
    return metadata
  } catch (error) {
    console.error('Error fetching NFT metadata:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSION_CONTROL_OFFLINE: Claude API key not configured',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, conversation = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'TRANSMISSION_ERROR: Invalid message format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check for OpenSea URLs and fetch NFT metadata
    const openSeaUrl = detectOpenSeaURL(message)
    let nftMetadata = null
    let enhancedMessage = message

    if (openSeaUrl) {
      nftMetadata = await fetchNFTMetadata(openSeaUrl)
      
      if (nftMetadata) {
        // Enhance the message with NFT metadata for analysis
        enhancedMessage = `${message}

NFT_METADATA_DETECTED:
- Name: ${nftMetadata.nft.name}
- Description: ${nftMetadata.nft.description}
- Contract: ${nftMetadata.nft.contract_address}
- Token ID: ${nftMetadata.nft.token_id}
- Chain: ${nftMetadata.nft.chain}
- Token Standard: ${nftMetadata.nft.token_standard}
- NSFW: ${nftMetadata.nft.is_nsfw}
- Traits: ${JSON.stringify(nftMetadata.nft.traits)}
${nftMetadata.collection ? `
COLLECTION_DATA:
- Collection: ${nftMetadata.collection.name}
- Description: ${nftMetadata.collection.description}
- Category: ${nftMetadata.collection.category}
- Twitter: ${nftMetadata.collection.twitter_username || 'N/A'}
` : ''}

Please analyze this NFT and provide your BUY/PASS recommendation based on your mission parameters.`
      } else {
        enhancedMessage = `${message}

ERROR: Unable to fetch NFT metadata from OpenSea. OpenSea API key required for NFT analysis. Please configure OPENSEA_API_KEY or provide NFT details manually for analysis.`
      }
    }

    // Prepare conversation history for Claude
    const messages: ChatMessage[] = [
      ...conversation,
      { role: 'user' as const, content: enhancedMessage }
    ]

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: INVADERBOT_SYSTEM_PROMPT,
        messages: messages
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: 'NEURAL_NETWORK_MALFUNCTION: Unable to process transmission',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    const invaderbotResponse = data.content?.[0]?.text || 'TRANSMISSION_INTERRUPTED'

    return NextResponse.json({
      success: true,
      data: {
        message: invaderbotResponse,
        nftMetadata: nftMetadata,
        conversation: [
          ...conversation,
          { role: 'user', content: message },
          { role: 'assistant', content: invaderbotResponse }
        ]
      },
      message: nftMetadata ? 'NFT_ANALYSIS_COMPLETE' : 'TRANSMISSION_PROCESSED',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error in chat API:', errorMsg)
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'MISSION_CONTROL_MALFUNCTION: Chat system temporarily offline',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}