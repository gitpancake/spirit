import { NextResponse } from 'next/server';
import { networkConfig, isProduction } from '@/lib/networks';
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

export async function GET() {
  try {
    const environment = isProduction() ? 'production' : 'development';
    
    // Get current contract configuration from cache
    const cache = RedisAgentCache.getInstance();
    const currentConfig = await cache.getCurrentContract();
    
    const networkInfo = {
      environment,
      supportedNetworks: networkConfig.supportedNetworks.map(network => ({
        id: network.id,
        name: network.name,
        network: network.network,
        rpcUrl: network.rpcUrls.default.http[0],
        blockExplorer: network.blockExplorers.default.url,
      })),
      defaultNetwork: {
        id: networkConfig.defaultNetwork.id,
        name: networkConfig.defaultNetwork.name,
        network: networkConfig.defaultNetwork.network,
      },
      ethereumNetwork: {
        id: networkConfig.ethereumNetwork.id,
        name: networkConfig.ethereumNetwork.name,
        network: networkConfig.ethereumNetwork.network,
      },
      contractAddresses: {
        spiritRegistry: currentConfig?.contractAddress || null,
      },
      activeChain: currentConfig?.chainId || null,
    };

    return NextResponse.json(networkInfo, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error fetching network configuration:', error);
    return NextResponse.json(
      { error: `Failed to get network configuration: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}