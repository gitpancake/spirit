import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/contract';
import { getMetadataFromPinata } from '@/lib/pinata';
import { getCachedAgentMetadata, setCachedAgentMetadata, agentCache } from '@/lib/cache';

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

interface AgentMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: any[];
  agentId?: string;
  agent_id?: string;
  [key: string]: any;
}

// Helper function to resolve IPFS URLs to public gateways
function resolveIPFSUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }
  
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${hash}`;
  }
  
  if (ipfsUrl.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) || ipfsUrl.match(/^baf[a-z0-9]{56}$/)) {
    return `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${ipfsUrl}`;
  }
  
  return ipfsUrl;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('skipCache') === 'true';

    // Validate agentId
    if (!agentId || agentId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanAgentId = decodeURIComponent(agentId.trim());
    console.log(`🔍 Searching for agent by ID: ${cleanAgentId}`);

    // Check cache for agentId -> tokenId mapping
    const cacheKey = `agentId:${cleanAgentId}`;
    if (!skipCache) {
      const cachedTokenId = agentCache.get<number>(cacheKey);
      if (cachedTokenId !== null) {
        console.log(`✅ Found cached tokenId ${cachedTokenId} for agentId ${cleanAgentId}`);
        
        // Get the full agent data using cached tokenId
        const cachedData = getCachedAgentMetadata(cachedTokenId);
        if (cachedData) {
          const { metadata, owner, metadataURI } = cachedData;
          return NextResponse.json({
            success: true,
            data: {
              tokenId: cachedTokenId,
              owner,
              metadataURI,
              metadata,
              imageUrl: metadata?.image ? resolveIPFSUrl(metadata.image) : undefined,
              agentId: cleanAgentId
            }
          }, { headers: corsHeaders });
        }
      }
    }

    // Validate environment
    if (!process.env.RPC_URL) {
      return NextResponse.json(
        { error: 'RPC_URL not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('📞 Connecting to contract...');
    const contract = await getContract();

    // Get total number of tokens to search through
    const totalTokens = Number(await contract.read.getTotalAuctionCount());
    console.log(`🔄 Searching through ${totalTokens} tokens for agentId: ${cleanAgentId}`);

    if (totalTokens === 0) {
      return NextResponse.json(
        { error: 'No agents found in registry' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Search through all tokens to find matching agentId
    for (let tokenId = 0; tokenId < totalTokens; tokenId++) {
      try {
        console.log(`🔎 Checking token ${tokenId}...`);

        // Check cache first for this token
        let metadata: AgentMetadata | null = null;
        let owner: string;
        let metadataURI: string;

        const cachedData = getCachedAgentMetadata(tokenId);
        if (cachedData && !skipCache) {
          metadata = cachedData.metadata;
          owner = cachedData.owner;
          metadataURI = cachedData.metadataURI;
        } else {
          // Fetch from contract
          try {
            [owner, metadataURI] = await Promise.all([
              contract.read.ownerOf([BigInt(tokenId)]),
              contract.read.tokenURI([BigInt(tokenId)])
            ]);

            // Fetch metadata from IPFS if URI exists
            if (metadataURI) {
              try {
                metadata = await getMetadataFromPinata(metadataURI);
              } catch (metadataError) {
                console.warn(`⚠️ Failed to fetch metadata for token ${tokenId}:`, metadataError.message);
                continue; // Skip this token
              }
            }

            // Cache the fetched data
            setCachedAgentMetadata(tokenId, {
              metadata,
              owner: owner as string,
              metadataURI: metadataURI as string
            }, 10 * 60 * 1000); // 10 minutes
          } catch (contractError) {
            console.warn(`⚠️ Failed to fetch contract data for token ${tokenId}:`, contractError.message);
            continue; // Skip this token
          }
        }

        // Check if this token's metadata contains the matching agentId
        const tokenAgentId = metadata?.agentId || metadata?.agent_id;
        if (tokenAgentId && tokenAgentId.toString().toLowerCase() === cleanAgentId.toLowerCase()) {
          console.log(`✅ Found matching agent! Token ${tokenId} has agentId ${tokenAgentId}`);

          // Cache the agentId -> tokenId mapping
          agentCache.set(cacheKey, tokenId, 15 * 60 * 1000); // 15 minutes

          // Resolve image URL if present
          const imageUrl = metadata?.image ? resolveIPFSUrl(metadata.image) : undefined;

          const result = {
            success: true,
            data: {
              tokenId,
              owner: owner as string,
              metadataURI: metadataURI as string,
              metadata,
              imageUrl,
              agentId: tokenAgentId
            }
          };

          return NextResponse.json(result, { headers: corsHeaders });
        }

        // Also check if agentId matches token name or any attribute
        if (metadata?.name && metadata.name.toLowerCase() === cleanAgentId.toLowerCase()) {
          console.log(`✅ Found matching agent by name! Token ${tokenId} has name ${metadata.name}`);
          
          agentCache.set(cacheKey, tokenId, 15 * 60 * 1000);
          
          const result = {
            success: true,
            data: {
              tokenId,
              owner: owner as string,
              metadataURI: metadataURI as string,
              metadata,
              imageUrl: metadata?.image ? resolveIPFSUrl(metadata.image) : undefined,
              agentId: cleanAgentId
            }
          };

          return NextResponse.json(result, { headers: corsHeaders });
        }

      } catch (error) {
        console.warn(`⚠️ Error processing token ${tokenId}:`, error.message);
        // Continue with next token
      }
    }

    console.log(`❌ No agent found with ID: ${cleanAgentId}`);
    return NextResponse.json(
      { error: `Agent not found with ID: ${cleanAgentId}` },
      { status: 404, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('❌ Error searching for agent by agentId:', error);
    return NextResponse.json(
      { error: `Failed to search for agent: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}