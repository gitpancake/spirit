import { NextResponse } from 'next/server';
import { getActiveCollections } from '@/lib/collections/registry';

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

// GET /api/collections - List all available collections
export async function GET() {
  try {
    const collections = getActiveCollections()
      .map(c => ({
        id: c.id,
        artist: c.artist,
        title: c.metadata.title,
        description: c.metadata.description,
        totalWorks: c.metadata.totalWorks,
        dateRange: c.metadata.dateRange,
        tags: c.metadata.tags,
        lastUpdated: c.data.lastUpdated,
        migrationStatus: c.migration.targetDomain ? {
          targetDomain: c.migration.targetDomain,
          targetDate: c.migration.targetDate
        } : null,
        apiUrl: `/api/collections/${c.id}`
      }));

    console.log(`📋 Served collections list: ${collections.length} active collections`);

    return NextResponse.json({
      success: true,
      data: {
        collections,
        total: collections.length,
        metadata: {
          description: 'Artist collections registry - Unified API for serving artist work collections',
          version: '1.0.0',
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Collections list API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch collections',
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
    error: 'Method not allowed - Collections are managed through registry configuration',
    statusCode: 405
  }, { 
    status: 405, 
    headers: corsHeaders 
  });
}