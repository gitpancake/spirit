// GET /api/works/abraham-early-works
// Serve Abraham's 2,652 early works from IPFS with caching and pagination
// Part of scalable works API - future works will be /api/works/[worksName]

import { NextRequest, NextResponse } from 'next/server';
import { getCachedAbrahamWork, setCachedAbrahamWork } from '@/lib/cache';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Abraham's early works data (embedded for lightweight transfer)
// New format: NFT metadata structure with complete token information
import abrahamEarlyWorks from './abraham-early-works.json';
const ABRAHAM_WORKS = abrahamEarlyWorks.tokens;

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if requesting specific work by ID
    const workId = searchParams.get('work_id');
    
    if (workId) {
      console.log(`🎨 Abraham early works: requesting work_id=${workId}`);
      
      // Find specific work by tokenId
      const work = ABRAHAM_WORKS.find((w: any) => w.tokenId.toString() === workId);
      
      if (!work) {
        return NextResponse.json({
          success: false,
          error: `Work with ID "${workId}" not found`
        }, { status: 404, headers: corsHeaders });
      }
      
      // Transform single work to API format using new structure
      const transformedWork = {
        id: work.tokenId.toString(),
        title: work.name,
        tokenId: work.tokenId,
        description: work.description,
        filename: work.filename,
        ipfsHash: work.ipfsHash,
        imageUrl: work.httpUrl,
        thumbnailUrl: `${work.httpUrl}?w=400`,
        fullUrl: work.httpUrl,
        externalUrl: work.external_url,
        attributes: work.attributes,
        metadata: {
          source: 'abraham_first_works',
          archived: true,
          format: work.filename.split('.').pop()?.toLowerCase() || 'jpg',
          uploadedAt: work.uploadedAt
        }
      };
      
      return NextResponse.json({
        success: true,
        data: {
          work: transformedWork,
          metadata: {
            description: 'Abraham First Works - Individual token',
            source: 'ipfs',
            workId: workId,
            collection: abrahamEarlyWorks.metadata
          }
        }
      }, { headers: corsHeaders });
    }
    
    // Parse pagination parameters for list request
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit = Math.min(25, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

    console.log(`🎨 Abraham early works request: offset=${offset}, limit=${limit}`);

    // Validate offset bounds
    if (offset >= ABRAHAM_WORKS.length) {
      return NextResponse.json({
        success: true,
        data: {
          works: [],
          pagination: {
            offset,
            limit,
            total: ABRAHAM_WORKS.length,
            hasMore: false
          }
        }
      }, { headers: corsHeaders });
    }

    // Get slice of works for this request
    const requestedWorks = ABRAHAM_WORKS.slice(offset, offset + limit);
    const resolvedWorks = [];

    // Process each work with new token structure
    for (const work of requestedWorks) {
      const cacheKey = `abraham_token_${work.tokenId}`;
      
      try {
        // Check cache first
        let resolvedWork = await getCachedAbrahamWork(cacheKey);
        
        if (!resolvedWork) {
          // Create work object using new structure
          resolvedWork = {
            id: work.tokenId.toString(),
            title: work.name,
            tokenId: work.tokenId,
            description: work.description,
            filename: work.filename,
            ipfsHash: work.ipfsHash,
            imageUrl: work.httpUrl,
            thumbnailUrl: `${work.httpUrl}?w=400`,
            fullUrl: work.httpUrl,
            externalUrl: work.external_url,
            attributes: work.attributes,
            metadata: {
              source: 'abraham_first_works',
              archived: true,
              format: work.filename.split('.').pop()?.toLowerCase() || 'jpg',
              uploadedAt: work.uploadedAt
            }
          };

          // Cache the resolved work (expire in 24 hours)
          await setCachedAbrahamWork(cacheKey, resolvedWork, 86400);
          console.log(`📦 Cached Abraham token: ${work.name}`);
        } else {
          console.log(`💨 Using cached Abraham token: ${work.name}`);
        }

        resolvedWorks.push(resolvedWork);

      } catch (error) {
        console.error(`❌ Failed to process token ${work.name}:`, error);
        
        // Include work with minimal data on error
        resolvedWorks.push({
          id: work.tokenId.toString(),
          title: work.name,
          tokenId: work.tokenId,
          filename: work.filename,
          ipfsHash: work.ipfsHash,
          imageUrl: null,
          error: 'Failed to process token'
        });
      }
    }

    const hasMore = (offset + limit) < ABRAHAM_WORKS.length;
    const nextOffset = hasMore ? offset + limit : null;

    const response = {
      success: true,
      data: {
        works: resolvedWorks,
        pagination: {
          offset,
          limit,
          total: ABRAHAM_WORKS.length,
          hasMore,
          nextOffset,
          nextUrl: hasMore ? `/api/works/abraham-early-works?offset=${nextOffset}&limit=${limit}` : null
        },
        metadata: {
          description: "Abraham First Works - Complete NFT collection",
          source: 'ipfs',
          cacheStatus: 'active',
          collection: abrahamEarlyWorks.metadata,
          newApiNote: 'This endpoint is being replaced by the unified collections API. Use /api/collections/abraham-early-works for new integrations.',
          newApiUrl: '/api/collections/abraham-early-works'
        }
      }
    };

    console.log(`✅ Served ${resolvedWorks.length} Abraham works (${offset}-${offset + resolvedWorks.length - 1}/${ABRAHAM_WORKS.length})`);

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Abraham early works error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Abraham early works',
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