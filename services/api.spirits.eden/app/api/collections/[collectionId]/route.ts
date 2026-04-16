import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/collections/registry';
import { StandardWork } from '@/lib/collections/types';
import { getCachedCollection, setCachedCollection } from '@/lib/cache';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { collectionId } = await params;
  
  try {
    const collection = getCollection(collectionId);
    
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found',
        availableCollections: Object.keys(require('@/lib/collections/registry').COLLECTIONS)
      }, { status: 404, headers: corsHeaders });
    }

    // Handle migration redirects
    if (collection.migration.redirectAfter && collection.migration.targetDomain) {
      return NextResponse.json({
        success: false,
        error: 'Collection has migrated',
        migratedTo: collection.migration.targetDomain,
        contact: collection.migration.contactInfo
      }, { status: 301, headers: corsHeaders });
    }

    // Parse pagination and work_id filter
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('work_id');
    
    // If requesting specific work by ID, handle that first
    if (workId) {
      console.log(`🎨 Collection ${collectionId}: requesting work_id=${workId}`);
      
      const specificWork = await getSpecificWork(collection, workId);
      if (!specificWork) {
        return NextResponse.json({
          success: false,
          error: `Work with ID "${workId}" not found in collection "${collectionId}"`
        }, { status: 404, headers: corsHeaders });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          collection: {
            id: collection.id,
            artist: collection.artist,
            title: collection.metadata.title,
            description: collection.metadata.description,
            totalWorks: await getDynamicTotalCount(collection),
            tags: collection.metadata.tags
          },
          work: specificWork
        }
      }, { headers: corsHeaders });
    }
    
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    const limit = Math.min(
      collection.display.maxLimit, 
      Math.max(1, parseInt(searchParams.get('limit') || collection.display.defaultLimit.toString()))
    );

    console.log(`🎨 Collection ${collectionId} request: offset=${offset}, limit=${limit}`);

    // Load and process works
    const works = await loadCollectionWorks(collection, offset, limit);

    const response = {
      success: true,
      data: {
        collection: {
          id: collection.id,
          artist: collection.artist,
          title: collection.metadata.title,
          description: collection.metadata.description,
          totalWorks: works.totalCount,
          tags: collection.metadata.tags
        },
        works: works.items,
        pagination: {
          offset,
          limit,
          total: works.totalCount,
          hasMore: (offset + limit) < works.totalCount,
          nextOffset: (offset + limit) < works.totalCount ? offset + limit : null,
          nextUrl: (offset + limit) < works.totalCount ? 
            `/api/collections/${collectionId}?offset=${offset + limit}&limit=${limit}` : null
        },
        migration: collection.migration.targetDomain ? {
          targetDomain: collection.migration.targetDomain,
          targetDate: collection.migration.targetDate,
          message: `This collection will migrate to ${collection.migration.targetDomain}`
        } : null
      }
    };

    console.log(`✅ Served ${works.items.length} works from collection ${collectionId} (${offset}-${offset + works.items.length - 1}/${works.totalCount})`);

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error: any) {
    console.error(`❌ Collections API error for ${collectionId}:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch collection',
      statusCode: 500
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function loadCollectionWorks(collection: any, offset: number, limit: number) {
  const cacheKey = `collection_${collection.id}_${offset}_${limit}`;
  
  // Check cache first
  let cached = getCachedCollection(cacheKey);
  if (cached) {
    console.log(`💨 Using cached collection data: ${collection.id}`);
    return cached;
  }

  // Load works based on data type
  let rawWorks = [];
  
  if (collection.data.type === 'embedded') {
    // For Abraham's works, we need to import the JSON data
    if (collection.id === 'abraham-early-works') {
      const abrahamWorksData = await import('../../works/abraham-early-works/abraham-early-works.json');
      rawWorks = (abrahamWorksData.default || abrahamWorksData).tokens;
    }
  } else if (collection.data.type === 'external') {
    const response = await fetch(collection.data.source);
    rawWorks = await response.json();
  }

  // Sort according to collection preferences
  if (collection.display.sortOrder === 'reverse-chronological') {
    rawWorks.reverse();
  } else if (collection.display.sortOrder === 'archive-number') {
    rawWorks.sort((a: any, b: any) => parseInt(a.archive_number) - parseInt(b.archive_number));
  }

  // Slice for pagination
  const slicedWorks = rawWorks.slice(offset, offset + limit);
  
  // Transform to standard format
  const standardizedWorks = slicedWorks.map((work: any) => standardizeWork(work, collection));
  
  const result = { 
    items: standardizedWorks,
    totalCount: rawWorks.length 
  };
  
  // Cache for 1 hour
  setCachedCollection(cacheKey, result, 3600);
  console.log(`📦 Cached collection data: ${collection.id}`);
  
  return result;
}

async function getSpecificWork(collection: any, workId: string): Promise<StandardWork | null> {
  // Load all works for the collection
  let rawWorks = [];
  
  if (collection.data.type === 'embedded') {
    // For Abraham's works, we need to import the JSON data
    if (collection.id === 'abraham-early-works') {
      const abrahamWorksData = await import('../../works/abraham-early-works/abraham-early-works.json');
      rawWorks = (abrahamWorksData.default || abrahamWorksData).tokens;
    }
  } else if (collection.data.type === 'external') {
    const response = await fetch(collection.data.source);
    rawWorks = await response.json();
  }

  // Find specific work by ID (handle both old and new format)
  const work = rawWorks.find((w: any) => 
    w.work_id === workId || 
    w.id === workId || 
    (w.tokenId !== undefined && w.tokenId.toString() === workId)
  );
  
  if (!work) {
    return null;
  }

  return standardizeWork(work, collection);
}

async function getDynamicTotalCount(collection: any): Promise<number> {
  // For collections with embedded data, count the actual tokens
  if (collection.data.type === 'embedded') {
    if (collection.id === 'abraham-early-works') {
      const abrahamWorksData = await import('../../works/abraham-early-works/abraham-early-works.json');
      return (abrahamWorksData.default || abrahamWorksData).tokens.length;
    }
  } else if (collection.data.type === 'external') {
    const response = await fetch(collection.data.source);
    const data = await response.json();
    return Array.isArray(data) ? data.length : data.tokens?.length || 0;
  }
  
  // Fallback to hardcoded value if we can't count dynamically
  return collection.metadata.totalWorks;
}

function standardizeWork(rawWork: any, collection: any): StandardWork {
  // Handle both old structure (work_id, ipfs_hash, etc.) and new NFT structure (tokenId, ipfsHash, etc.)
  const isNewFormat = rawWork.tokenId !== undefined;
  
  const format = isNewFormat ? 
    rawWork.filename?.split('.').pop()?.toLowerCase() || 'jpg' :
    rawWork.original_filename?.split('.').pop()?.toLowerCase() || 'jpg';
  
  const ipfsHash = isNewFormat ? rawWork.ipfsHash : rawWork.ipfs_hash;
  const imageUrl = isNewFormat ? rawWork.httpUrl : `https://ipfs.io/ipfs/${ipfsHash}`;
  
  return {
    id: isNewFormat ? rawWork.tokenId.toString() : (rawWork.work_id || rawWork.id),
    title: isNewFormat ? rawWork.name : rawWork.title,
    description: rawWork.description || null,
    createdDate: rawWork.created_date || rawWork.createdAt || null,
    archiveNumber: isNewFormat ? null : (rawWork.archive_number ? parseInt(rawWork.archive_number) : null),
    originalFilename: isNewFormat ? rawWork.filename : rawWork.original_filename,
    media: {
      primary: {
        url: imageUrl,
        thumbnailUrl: `${imageUrl}?w=${collection.display.thumbnailSize}`,
        format,
        ipfsHash: ipfsHash
      }
    },
    metadata: {
      source: collection.metadata.source,
      collection: collection.id,
      artist: collection.artist.name,
      tags: collection.metadata.tags,
      archived: true,
      ...(isNewFormat && rawWork.attributes ? { attributes: rawWork.attributes } : {})
    }
  };
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