// GET /api/collections/abraham-early-works/[tokenId]
// Individual token access for Abraham Early Works collection
// e.g. /api/collections/abraham-early-works/0 => specific token metadata

import { NextRequest, NextResponse } from 'next/server';
import { COLLECTIONS } from '@/lib/collections/registry';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Types (copied from main collections route)
interface StandardWork {
  id: string;
  title: string;
  description: string | null;
  createdDate: string | null;
  archiveNumber: number | null;
  originalFilename: string;
  media: {
    primary: {
      url: string;
      thumbnailUrl: string;
      format: string;
      ipfsHash: string;
    };
  };
  metadata: {
    source: string;
    collection: string;
    artist: string;
    tags: string[];
    archived: boolean;
    attributes?: any[];
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const collectionId = 'abraham-early-works';

    console.log(`🎨 Collection ${collectionId}: requesting tokenId=${tokenId}`);

    // Get collection config
    const collection = COLLECTIONS[collectionId];
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: `Collection "${collectionId}" not found`
      }, { status: 404, headers: corsHeaders });
    }

    // Handle collection migration if needed
    if (collection.migration?.status === 'migrated') {
      return NextResponse.json({
        success: false,
        error: `Collection has migrated to ${collection.migration.targetDomain}`,
        migratedTo: collection.migration.targetDomain,
        contact: collection.migration.contactInfo
      }, { status: 301, headers: corsHeaders });
    }

    // Get the specific work
    const specificWork = await getSpecificWork(collection, tokenId);
    if (!specificWork) {
      return NextResponse.json({
        success: false,
        error: `Token "${tokenId}" not found in collection "${collectionId}"`
      }, { status: 404, headers: corsHeaders });
    }

    // Get total count for collection metadata
    const totalCount = await getDynamicTotalCount(collection);

    return NextResponse.json({
      success: true,
      data: {
        collection: {
          id: collection.id,
          artist: collection.artist,
          title: collection.metadata.title,
          description: collection.metadata.description,
          totalWorks: totalCount,
          tags: collection.metadata.tags
        },
        work: specificWork
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    const resolvedParams = await params.catch(() => ({ tokenId: 'unknown' }));
    console.error(`❌ Collections API error for abraham-early-works/${resolvedParams.tokenId}:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch token',
      statusCode: 500
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function getSpecificWork(collection: any, workId: string): Promise<StandardWork | null> {
  // Load all works for the collection
  let rawWorks = [];
  
  if (collection.data.type === 'embedded') {
    // For Abraham's works, we need to import the JSON data
    if (collection.id === 'abraham-early-works') {
      const abrahamWorksData = await import('../../../works/abraham-early-works/abraham-early-works.json');
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
      const abrahamWorksData = await import('../../../works/abraham-early-works/abraham-early-works.json');
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