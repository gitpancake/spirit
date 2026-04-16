import { NextRequest, NextResponse } from 'next/server';
import RedisAgentCache from '@/lib/redis-agent-cache';

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

export async function GET(request: NextRequest) {
  try {
    const cache = RedisAgentCache.getInstance();
    const currentConfig = await cache.getCurrentContract();
    
    if (!currentConfig) {
      return NextResponse.json({
        success: false,
        error: 'No contract address configured',
        contractAddress: null
      }, { status: 404, headers: corsHeaders });
    }
    
    return NextResponse.json({
      success: true,
      contractAddress: currentConfig.contractAddress
    }, { 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error: any) {
    console.error('❌ Contract address API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      contractAddress: null
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}