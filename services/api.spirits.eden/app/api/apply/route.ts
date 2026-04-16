import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

// Ensure Node.js runtime (not Edge) for fetch requests
export const runtime = 'nodejs';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation for required Genesis Registry fields
    if (!body.name || !body.handle || !body.role || !body.public_persona || !body.artist_wallet) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: name, handle, role, public_persona, artist_wallet'
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate artist wallet address
    console.log('🔍 Validating artist wallet:', body.artist_wallet, 'Type:', typeof body.artist_wallet);
    if (!isAddress(body.artist_wallet)) {
      console.log('❌ Address validation failed for:', body.artist_wallet);
      return NextResponse.json(
        { 
          error: `Invalid artist wallet address: ${body.artist_wallet}`
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📝 Received Genesis Registry application:', body.name);
    console.log('🎨 Artist wallet:', body.artist_wallet);

    // Ensure application_type is always set
    if (!body.application_type) {
      body.application_type = "creator";
      console.log('🔧 Added missing application_type: creator');
    }

    // Get internal API configuration
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!internalApiUrl || !apiKey) {
      console.error('❌ Internal API configuration missing');
      return NextResponse.json(
        { error: 'Internal server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('🔄 Proxying request to internal API:', internalApiUrl);

    // Forward the request to the internal Railway API
    try {
      const response = await fetch(`${internalApiUrl}/api/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Internal API error:', response.status, responseData);
        return NextResponse.json(
          { 
            error: responseData.error || 'Internal API request failed',
            details: responseData
          },
          { status: response.status, headers: corsHeaders }
        );
      }

      console.log('✅ Successfully proxied to internal API');
      
      return NextResponse.json(responseData, { 
        status: response.status, 
        headers: corsHeaders 
      });

    } catch (fetchError: any) {
      console.error('❌ Failed to reach internal API:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to internal API',
          message: 'The deployment service is temporarily unavailable'
        },
        { status: 503, headers: corsHeaders }
      );
    }

  } catch (error: any) {
    console.error('❌ Application submission failed:', error);
    return NextResponse.json(
      { error: `Failed to process application: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getContract } = await import('@/lib/contract');
    const { getMetadataFromPinata } = await import('@/lib/pinata');
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    console.log('📋 Fetching applications from AgentRegistry contract...');
    const contract = getContract();
    
    // Get current token ID to know how many tokens to scan
    const currentTokenId = Number(await contract.read.currentTokenId());
    console.log(`📊 Scanning tokens 0 to ${currentTokenId - 1} for applications`);

    const applications = [];

    // Iterate through all token IDs to find registered agents
    for (let tokenId = 0; tokenId < currentTokenId; tokenId++) {
      try {
        // Get agent ID and metadata URI for this token
        const [agentId, metadataURI] = await Promise.all([
          contract.read.getAgentIdForToken([BigInt(tokenId)]) as Promise<string>,
          contract.read.tokenURI([BigInt(tokenId)]) as Promise<string>
        ]);
        
        if (!agentId || agentId.length === 0) {
          continue; // Skip tokens without agent IDs
        }
        
        // Fetch metadata from IPFS
        const metadata = await getMetadataFromPinata(metadataURI);
        
        if (metadata) {
          // Get status from contract or metadata
          let applicationStatus;
          try {
            applicationStatus = await contract.read.getApplicationStatusForToken([BigInt(tokenId)]) as string;
          } catch {
            // Fallback to metadata if contract doesn't have status
            applicationStatus = metadata.application_status || 'PENDING_REVIEW';
          }
          
          // Skip if status filter is applied and doesn't match
          if (status && applicationStatus !== status) {
            continue;
          }

          applications.push({
            id: agentId,
            agentId: agentId,
            tokenId: tokenId.toString(),
            status: applicationStatus,
            metadataURI: metadataURI,
            ...metadata,
            // Map metadata fields to expected format
            agent_name: metadata.agent_name || metadata.name,
            created_at: metadata.application_date
          });
        }
        
      } catch (agentError) {
        console.warn(`⚠️  Failed to fetch data for token ${tokenId}:`, agentError.message);
        // Continue with other tokens even if one fails
      }
    }

    console.log(`✅ Successfully fetched ${applications.length} applications`);

    return NextResponse.json({
      success: true,
      data: applications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error fetching applications from contract:', error);
    return NextResponse.json(
      { error: `Failed to fetch applications: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}