import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/contract';

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
    // Validate environment
    if (!process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('🔧 Fetching contract state for admin panel...');
    const contract = getContract();

    try {
      // Fetch basic registry state using new ABI functions
      const [
        currentTokenId,
        registryName,
        registrySymbol,
        owner
      ] = await Promise.all([
        contract.read.currentTokenId().catch(() => '0'),
        contract.read.name().catch(() => 'Unknown'),
        contract.read.symbol().catch(() => 'Unknown'),
        contract.read.owner().catch(() => '0x0000000000000000000000000000000000000000')
      ]);

      console.log('📊 Basic registry state fetched, now fetching token details...');

      // Get all token URIs for existing tokens
      const maxTokenId = Number(currentTokenId);
      let tokenURIs: string[] = [];
      
      if (maxTokenId > 0) {
        console.log(`🔍 Scanning ${maxTokenId} tokens for metadata...`);
        const tokenIds = Array.from({ length: maxTokenId }, (_, i) => BigInt(i));
        
        try {
          // Use getTokenUris function to get all URIs at once
          tokenURIs = await contract.read.getTokenUris([tokenIds]);
        } catch (error) {
          console.log('⚠️ Error fetching token URIs, falling back to individual calls:', error);
          // Fallback to individual tokenURI calls
          for (let tokenId = 0; tokenId < maxTokenId; tokenId++) {
            try {
              const uri = await contract.read.tokenURI([BigInt(tokenId)]);
              tokenURIs.push(uri);
            } catch (error) {
              // Token might not exist - skip
              tokenURIs.push('');
            }
          }
        }
      }

      const contractState = {
        currentTokenId: currentTokenId.toString(),
        totalTokensIssued: maxTokenId.toString(),
        name: registryName.toString(),
        symbol: registrySymbol.toString(),
        owner: owner.toString(),
        registeredAgentsCount: tokenURIs.filter(uri => uri && uri.length > 0).length
      };

      console.log('✅ Successfully fetched registry state');
      console.log('📋 State summary:', {
        currentTokenId: contractState.currentTokenId,
        totalTokensIssued: contractState.totalTokensIssued,
        registeredAgentsCount: contractState.registeredAgentsCount
      });

      return NextResponse.json({
        success: true,
        contractState,
        registeredTokens: tokenURIs.filter(uri => uri && uri.length > 0),
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } catch (contractError: any) {
      console.error('❌ Contract interaction error:', contractError);
      return NextResponse.json(
        { error: `Contract error: ${contractError.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error: any) {
    console.error('❌ Error fetching contract state:', error);
    return NextResponse.json(
      { error: `Failed to fetch contract state: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}