// GET /abraham-early-works/[tokenId]
// Proxy requests to Abraham's token metadata on IPFS
// e.g. /abraham-early-works/0 => https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre/0.json

import { NextRequest, NextResponse } from 'next/server';
import { getCachedAbrahamWork, setCachedAbrahamWork } from '@/lib/cache';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Abraham's NFT metadata base URI
const ABRAHAM_BASE_URI = 'https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre';

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;
    
    // Validate tokenId is a number
    const tokenIdNum = parseInt(tokenId, 10);
    if (isNaN(tokenIdNum) || tokenIdNum < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token ID. Must be a non-negative integer.',
        statusCode: 400
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`🎨 Abraham token metadata request: tokenId=${tokenId}`);

    // Check cache first
    const cacheKey = `abraham_metadata_${tokenId}`;
    let cachedMetadata = await getCachedAbrahamWork(cacheKey);
    
    if (cachedMetadata) {
      console.log(`💨 Using cached Abraham metadata: token ${tokenId}`);
      return NextResponse.json(cachedMetadata, { headers: corsHeaders });
    }

    // Fetch from IPFS
    const metadataUrl = `${ABRAHAM_BASE_URI}/${tokenId}.json`;
    console.log(`🔗 Fetching metadata from: ${metadataUrl}`);
    
    const response = await fetch(metadataUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Eden Registry API'
      },
      // Add timeout for IPFS requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: `Token ${tokenId} not found`,
          statusCode: 404
        }, { 
          status: 404, 
          headers: corsHeaders 
        });
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const metadata = await response.json();
    
    // Add proxy metadata
    const enrichedMetadata = {
      ...metadata,
      _proxy: {
        source: 'ipfs',
        originalUrl: metadataUrl,
        tokenId: tokenIdNum,
        cachedAt: new Date().toISOString()
      }
    };

    // Cache for 24 hours (metadata shouldn't change often)
    await setCachedAbrahamWork(cacheKey, enrichedMetadata, 86400);
    console.log(`📦 Cached Abraham metadata: token ${tokenId}`);

    return NextResponse.json(enrichedMetadata, { headers: corsHeaders });

  } catch (error: any) {
    console.error(`❌ Abraham token metadata error (${params?.tokenId}):`, error.message);
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request timeout - IPFS gateway may be slow',
        statusCode: 504
      }, { 
        status: 504, 
        headers: corsHeaders 
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch token metadata',
      statusCode: 500
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    statusCode: 405
  }, { 
    status: 405, 
    headers: corsHeaders 
  });
}