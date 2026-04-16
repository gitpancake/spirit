import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import SimpleAgentCache from '@/lib/simple-agent-cache';

// IPFS resolution helper
async function resolveIPFSMetadata(ipfsHash: string): Promise<any | null> {
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];
  
  for (const gateway of gateways) {
    try {
      console.log(`📡 Trying IPFS gateway: ${gateway}${ipfsHash}`);
      
      const response = await fetch(`${gateway}${ipfsHash}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const metadata = await response.json();
        console.log(`✅ Successfully fetched metadata from ${gateway}`);
        return metadata;
      }
    } catch (error: any) {
      console.warn(`⚠️ Gateway ${gateway} error:`, error.message);
    }
  }
  
  console.warn(`❌ All IPFS gateways failed for ${ipfsHash}`);
  return null;
}

function extractIPFSHash(ipfsUrl: string): string | null {
  if (!ipfsUrl) return null;
  
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', '');
  }
  
  const gatewayMatch = ipfsUrl.match(/\/ipfs\/([^\/\?]+)/);
  if (gatewayMatch) {
    return gatewayMatch[1];
  }
  
  if (ipfsUrl.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) || ipfsUrl.match(/^baf[a-z0-9]{56}$/)) {
    return ipfsUrl;
  }
  
  return null;
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('X-Signature-256');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const body = await request.text();
    
    if (!signature || !verifySignature(body, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const cache = SimpleAgentCache.getInstance();
    
    console.log(`📨 Webhook received: ${payload.event} for token ${payload.data.tokenId}`);

    switch (payload.event) {
      case 'agent_registered':
        await handleAgentRegistered(payload, cache);
        break;
        
      case 'agent_deregistered':
        await handleAgentDeregistered(payload, cache);
        break;
        
      case 'token_uri_updated':
        await handleTokenURIUpdated(payload, cache);
        break;
        
      case 'transfer':
        await handleTransfer(payload, cache);
        break;
        
      case 'trainer_added':
      case 'trainer_removed':
        await handleTrainerUpdate(payload, cache);
        break;
        
      default:
        console.warn(`⚠️ Unknown event type: ${payload.event}`);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${payload.event} for token ${payload.data.tokenId}` 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

async function handleAgentRegistered(payload: any, cache: SimpleAgentCache) {
  const { tokenId, owner, metadataURI } = payload.data;
  const { contractAddress, chainId, blockNumber, transactionHash } = payload.metadata;
  
  console.log(`🆕 Agent registered: Token ${tokenId}, Owner: ${owner}, URI: ${metadataURI}`);
  
  if (!metadataURI) {
    console.warn(`⚠️ No metadata URI for token ${tokenId}`);
    return;
  }

  // Extract IPFS hash
  const ipfsHash = extractIPFSHash(metadataURI);
  if (!ipfsHash) {
    console.error(`❌ Could not extract IPFS hash from URI: ${metadataURI}`);
    return;
  }

  // Try to resolve IPFS metadata
  let metadata = cache.getIPFSMetadata(ipfsHash);
  
  if (!metadata) {
    console.log(`📡 Resolving IPFS metadata for ${ipfsHash}...`);
    metadata = await resolveIPFSMetadata(ipfsHash);
  } else {
    console.log(`✅ Using cached IPFS metadata for ${ipfsHash}`);
  }

  // Store in cache (with or without metadata)
  cache.setToken({
    contractAddress,
    tokenId,
    ipfsHash,
    owner,
    metadata,
    chainId,
    blockNumber,
    transactionHash
  });
}

async function handleAgentDeregistered(payload: any, cache: SimpleAgentCache) {
  const { tokenId } = payload.data;
  const { contractAddress } = payload.metadata;
  
  console.log(`🗑️ Agent deregistered: Token ${tokenId}`);
  cache.removeToken(contractAddress, tokenId);
}

async function handleTokenURIUpdated(payload: any, cache: SimpleAgentCache) {
  const { tokenId, newTokenURI } = payload.data;
  const { contractAddress, chainId, blockNumber, transactionHash } = payload.metadata;
  
  console.log(`🔄 Token URI updated: Token ${tokenId}, New URI: ${newTokenURI}`);
  
  // Get existing agent data to preserve owner
  const existingAgent = cache.getAgent(contractAddress, tokenId);
  if (!existingAgent) {
    console.warn(`⚠️ Cannot update URI: token ${tokenId} not found in cache`);
    return;
  }

  // Extract new IPFS hash and resolve metadata
  const ipfsHash = extractIPFSHash(newTokenURI);
  if (!ipfsHash) {
    console.error(`❌ Could not extract IPFS hash from new URI: ${newTokenURI}`);
    return;
  }

  let metadata = cache.getIPFSMetadata(ipfsHash);
  if (!metadata) {
    console.log(`📡 Resolving new IPFS metadata for ${ipfsHash}...`);
    metadata = await resolveIPFSMetadata(ipfsHash);
  }

  // Update with new metadata
  cache.setToken({
    contractAddress,
    tokenId,
    ipfsHash,
    owner: existingAgent.owner, // Preserve owner
    metadata,
    chainId,
    blockNumber,
    transactionHash
  });
}

async function handleTransfer(payload: any, cache: SimpleAgentCache) {
  const { tokenId, from, to } = payload.data;
  const { contractAddress } = payload.metadata;
  
  console.log(`🔄 Transfer: Token ${tokenId}, From: ${from}, To: ${to}`);
  
  const existingAgent = cache.getAgent(contractAddress, tokenId);
  if (!existingAgent) {
    console.warn(`⚠️ Cannot update ownership: token ${tokenId} not found in cache`);
    return;
  }

  // Update ownership
  cache.setToken({
    ...existingAgent,
    owner: to,
    blockNumber: payload.metadata.blockNumber,
    transactionHash: payload.metadata.transactionHash
  });
}

async function handleTrainerUpdate(payload: any, cache: SimpleAgentCache) {
  const { tokenId, trainer } = payload.data;
  
  console.log(`👨‍🏫 Trainer ${payload.event}: Token ${tokenId}, Trainer: ${trainer}`);
  
  // For now, just log trainer updates
  // You can extend this to store trainer relationships if needed
}