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
        error: 'No contract configuration found',
        message: 'Event listener has not started or sent startup notification yet'
      }, { status: 404, headers: corsHeaders });
    }
    
    // Get some basic stats about the cached data
    const stats = await cache.getStats();
    const contractStats = stats.memory.contracts[currentConfig.contractAddress] || {
      tokenCount: 0,
      tokenIds: []
    };
    
    return NextResponse.json({
      success: true,
      data: {
        contractAddress: currentConfig.contractAddress,
        chainId: currentConfig.chainId,
        network: getNetworkName(currentConfig.chainId),
        stats: {
          totalAgents: contractStats.tokenCount,
          lastTokenId: contractStats.tokenIds.length > 0 ? 
            Math.max(...contractStats.tokenIds.map(id => parseInt(id))) : null,
          cacheStatus: stats.redis.status
        }
      },
      metadata: {
        source: 'redis-cache',
        description: 'Current active contract configuration from event listener',
        lastUpdated: new Date().toISOString()
      }
    }, { 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60, s-maxage=300', // Cache for 1 minute, CDN for 5 minutes
      }
    });
    
  } catch (error: any) {
    console.error('❌ Contract config API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

function getNetworkName(chainId: number): string {
  const networks: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    8453: 'Base Mainnet',
    84532: 'Base Sepolia',
    10: 'Optimism Mainnet',
    420: 'Optimism Goerli'
  };
  
  return networks[chainId] || `Chain ${chainId}`;
}