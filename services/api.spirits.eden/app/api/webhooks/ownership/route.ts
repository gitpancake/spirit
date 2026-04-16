import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import RedisAgentCache from '@/lib/redis-agent-cache';

interface OwnershipUpdatePayload {
  tokenId: string;
  contractAddress: string;
  chainId: number;
  owner?: string;
  trainers?: string[];
  blockNumber: string;
  transactionHash: string;
  action: 'set_owner' | 'add_trainer' | 'remove_trainer' | 'set_trainers';
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

    const payload: OwnershipUpdatePayload = JSON.parse(body);
    
    console.log(`📨 Ownership webhook: ${payload.action} for token ${payload.tokenId}`);

    // Validate required fields
    if (!payload.tokenId || !payload.contractAddress || !payload.chainId || !payload.action) {
      return NextResponse.json({ 
        error: 'Missing required fields: tokenId, contractAddress, chainId, action' 
      }, { status: 400 });
    }

    const cache = RedisAgentCache.getInstance();

    // Check if contract configuration changed and invalidate cache if needed
    const cacheInvalidated = await cache.setCurrentContract(payload.contractAddress, payload.chainId);
    if (cacheInvalidated) {
      console.log(`🔄 Cache invalidated due to contract change to ${payload.contractAddress} (Chain ${payload.chainId})`);
    }

    switch (payload.action) {
      case 'set_owner':
        if (!payload.owner) {
          return NextResponse.json({ error: 'owner required for set_owner action' }, { status: 400 });
        }
        
        console.log(`👤 Setting owner for token ${payload.tokenId}: ${payload.owner}`);
        
        // Get existing agent or create new entry
        const existingAgent = await cache.getAgent(payload.contractAddress, payload.tokenId, payload.chainId);
        if (existingAgent) {
          await cache.setToken({
            ...existingAgent,
            owner: payload.owner,
            blockNumber: payload.blockNumber,
            transactionHash: payload.transactionHash
          });
        } else {
          // Create new agent entry with minimal data
          await cache.setToken({
            contractAddress: payload.contractAddress,
            tokenId: payload.tokenId,
            ipfsHash: '', // Will be updated when metadata webhook comes
            owner: payload.owner,
            trainers: [],
            metadata: null,
            chainId: payload.chainId,
            blockNumber: payload.blockNumber,
            transactionHash: payload.transactionHash
          });
        }
        break;

      case 'add_trainer':
        if (!payload.trainers || payload.trainers.length !== 1) {
          return NextResponse.json({ error: 'Single trainer required for add_trainer action' }, { status: 400 });
        }
        
        console.log(`👥 Adding trainer ${payload.trainers[0]} to token ${payload.tokenId}`);
        await cache.addTrainer(
          payload.contractAddress,
          payload.tokenId,
          payload.trainers[0],
          payload.chainId,
          payload.blockNumber,
          payload.transactionHash
        );
        break;

      case 'remove_trainer':
        if (!payload.trainers || payload.trainers.length !== 1) {
          return NextResponse.json({ error: 'Single trainer required for remove_trainer action' }, { status: 400 });
        }
        
        console.log(`👥 Removing trainer ${payload.trainers[0]} from token ${payload.tokenId}`);
        await cache.removeTrainer(
          payload.contractAddress,
          payload.tokenId,
          payload.trainers[0],
          payload.chainId,
          payload.blockNumber,
          payload.transactionHash
        );
        break;

      case 'set_trainers':
        if (!payload.trainers) {
          return NextResponse.json({ error: 'trainers array required for set_trainers action' }, { status: 400 });
        }
        
        console.log(`👥 Setting trainers for token ${payload.tokenId}: [${payload.trainers.join(', ')}]`);
        
        const agent = await cache.getAgent(payload.contractAddress, payload.tokenId, payload.chainId);
        if (agent) {
          await cache.setToken({
            ...agent,
            trainers: payload.trainers,
            blockNumber: payload.blockNumber,
            transactionHash: payload.transactionHash
          });
        } else {
          // Create new agent entry
          await cache.setToken({
            contractAddress: payload.contractAddress,
            tokenId: payload.tokenId,
            ipfsHash: '',
            owner: 'Unknown', // Will be updated when ownership info comes
            trainers: payload.trainers,
            metadata: null,
            chainId: payload.chainId,
            blockNumber: payload.blockNumber,
            transactionHash: payload.transactionHash
          });
        }
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${payload.action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${payload.action} for token ${payload.tokenId}`,
      tokenId: payload.tokenId,
      action: payload.action,
      contractAddress: payload.contractAddress
    });

  } catch (error: any) {
    console.error('❌ Ownership webhook processing error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}