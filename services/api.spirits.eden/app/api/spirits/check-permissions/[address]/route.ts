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

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    
    // Validate address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate environment
    if (!process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`🔍 Checking permissions for address: ${address}${tokenId ? ` for tokenId: ${tokenId}` : ''}`);
    const contract = getContract();

    let isOwner = false;
    let isTokenOwner = false;
    let isTrainer = false;
    
    // Check if address is the contract owner
    const contractOwner = await contract.read.owner();
    isOwner = contractOwner.toLowerCase() === address.toLowerCase();
    
    // Check if address is a trainer for specific tokenId (if provided)
    if (tokenId && !isNaN(Number(tokenId))) {
      try {
        // Check if address owns the specific token
        const tokenOwner = await contract.read.ownerOf([BigInt(tokenId)]);
        isTokenOwner = tokenOwner.toLowerCase() === address.toLowerCase();
        
        // Check if address is a trainer for the specific token
        isTrainer = await contract.read.isTrainer([BigInt(tokenId), address as `0x${string}`]);
      } catch (error) {
        // Token might not exist, that's ok
        console.log(`Token ${tokenId} might not exist:`, error);
      }
    }
    
    console.log(`✅ Permissions for ${address}${tokenId ? ` (tokenId: ${tokenId})` : ''}: owner=${isOwner}, tokenOwner=${isTokenOwner}, trainer=${isTrainer}`);
    
    const response: any = {
      address,
      isOwner,
      // Keep backward compatibility with isTreasury field
      isTreasury: isOwner
    };
    
    if (tokenId) {
      response.tokenId = tokenId;
      response.isTokenOwner = isTokenOwner;
      response.isTrainer = isTrainer;
    }
    
    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error: any) {
    console.error(`❌ Error checking permissions for ${params.address}:`, error);
    return NextResponse.json(
      { error: `Failed to check permissions: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}