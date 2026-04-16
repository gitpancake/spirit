import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2'
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

interface OpenSeaNFT {
  identifier: string
  collection: string
  contract: string
  token_standard: string
  name: string
  description: string
  image_url: string
  metadata_url: string
  opensea_url: string
  updated_at: string
  is_disabled: boolean
  is_nsfw: boolean
  traits: Array<{
    trait_type: string
    display_type?: string
    value: any
  }>
}

interface OpenSeaCollection {
  collection: string
  name: string
  description: string
  image_url: string
  banner_image_url: string
  owner: string
  safelist_status: string
  category: string
  is_disabled: boolean
  is_nsfw: boolean
  trait_offers_enabled: boolean
  collection_offers_enabled: boolean
  opensea_url: string
  project_url: string
  wiki_url: string
  discord_url: string
  telegram_url: string
  twitter_username: string
  instagram_username: string
  contracts: Array<{
    address: string
    chain: string
  }>
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_URL: No OpenSea URL provided',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Parse the OpenSea URL
    const parsed = parseOpenSeaURL(url)
    if (!parsed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL_PARSE_ERROR: Invalid OpenSea URL format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const { contract, tokenId, chain } = parsed

    // Fetch NFT metadata from OpenSea API
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    if (OPENSEA_API_KEY) {
      headers['x-api-key'] = OPENSEA_API_KEY
    }

    // Try the public OpenSea API first, then fallback to v2 if we have a key
    let nftResponse
    if (!OPENSEA_API_KEY) {
      // Try public API first
      try {
        nftResponse = await fetch(
          `https://api.opensea.io/api/v1/asset/${contract}/${tokenId}/?include_orders=false`,
          { headers }
        )
      } catch (error) {
        console.log('V1 API failed, trying V2')
      }
    }
    
    // If no response yet, try V2 API
    if (!nftResponse || !nftResponse.ok) {
      nftResponse = await fetch(
        `${OPENSEA_API_BASE}/chain/${chain}/contract/${contract}/nfts/${tokenId}`,
        { headers }
      )
    }

    if (!nftResponse.ok) {
      const errorText = await nftResponse.text()
      console.error('OpenSea API error:', nftResponse.status, errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `OPENSEA_API_ERROR: ${nftResponse.status} - Unable to fetch NFT data. OpenSea API key required.`,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const nftData = await nftResponse.json()
    
    // Handle different API response formats
    let nft: any
    if (nftData.nft) {
      // V2 API response format
      nft = nftData.nft
    } else {
      // V1 API response format
      nft = nftData
    }

    // Fetch collection metadata (skip if v1 API)
    let collectionData: any = null
    if (nftData.nft && nft.collection) {
      // Only for V2 API
      try {
        const collectionResponse = await fetch(
          `${OPENSEA_API_BASE}/collections/${nft.collection}`,
          { headers }
        )
        
        if (collectionResponse.ok) {
          collectionData = await collectionResponse.json()
        }
      } catch (error) {
        console.error('Error fetching collection data:', error)
      }
    }

    // Format response - handle both API formats and prioritize best image
    const imageUrl = nft.display_image_url || nft.image_original_url || nft.image_url
    
    const metadata = {
      nft: {
        name: nft.name || nft.asset_contract?.name,
        description: nft.description || nft.asset_contract?.description,
        image_url: imageUrl,
        contract_address: contract,
        token_id: tokenId,
        chain: chain,
        opensea_url: nft.permalink || url,
        traits: nft.traits || [],
        is_nsfw: nft.is_nsfw || false,
        token_standard: nft.token_standard || nft.asset_contract?.schema_name || 'Unknown'
      },
      collection: collectionData ? {
        name: collectionData.name,
        description: collectionData.description,
        image_url: collectionData.image_url,
        opensea_url: collectionData.opensea_url,
        twitter_username: collectionData.twitter_username,
        discord_url: collectionData.discord_url,
        category: collectionData.category
      } : nft.collection ? {
        name: nft.collection.name,
        description: nft.collection.description,
        image_url: nft.collection.image_url,
        opensea_url: nft.collection.permalink,
        twitter_username: nft.collection.twitter_username,
        discord_url: nft.collection.discord_url,
        category: null
      } : null
    }

    return NextResponse.json({
      success: true,
      data: metadata,
      message: 'NFT_METADATA_RETRIEVED',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching NFT metadata:', errorMsg)
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'METADATA_FETCH_MALFUNCTION: Unable to analyze NFT',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}