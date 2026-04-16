import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import RedisAgentCache from '@/lib/redis-agent-cache';

interface BaseWebhookPayload {
  metadata: {
    blockNumber: string;
    blockHash: string;
    transactionHash: string;
    logIndex: number;
    timestamp: number;
    chainId: number;
    contractAddress: string;
  };
}

interface OwnershipTransferPayload extends BaseWebhookPayload {
  event: 'transfer';
  data: {
    tokenId: string;
    from: string;
    to: string;
  };
}

interface TrainerAddedPayload extends BaseWebhookPayload {
  event: 'TrainerAdded';
  data: {
    tokenId: string;
    trainer: string;
  };
}

interface TrainerRemovedPayload extends BaseWebhookPayload {
  event: 'TrainerRemoved';
  data: {
    tokenId: string;
    trainer: string;
  };
}

type WebhookPayload = OwnershipTransferPayload | TrainerAddedPayload | TrainerRemovedPayload;

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

async function handleOwnershipTransfer(payload: OwnershipTransferPayload) {
  const { tokenId, from, to } = payload.data;
  const { contractAddress, blockNumber, transactionHash, chainId } = payload.metadata;
  
  console.log(`🔄 Ownership transfer: Token ${tokenId}, From: ${from}, To: ${to}`);
  
  const cache = RedisAgentCache.getInstance();
  const existingAgent = await cache.getAgent(contractAddress, tokenId, chainId);
  
  if (!existingAgent) {
    console.warn(`⚠️ Cannot update ownership: token ${tokenId} not found in cache`);
    return;
  }

  // Update ownership while preserving all other data
  await cache.setToken({
    ...existingAgent,
    owner: to,
    blockNumber,
    transactionHash
  });
  
  console.log(`✅ Updated ownership for token ${tokenId}: ${from} → ${to}`);
}

async function handleTrainerAdded(payload: TrainerAddedPayload) {
  const { tokenId, trainer } = payload.data;
  const { contractAddress, blockNumber, transactionHash, chainId } = payload.metadata;
  
  console.log(`👥 Adding trainer: Token ${tokenId}, Trainer: ${trainer}`);
  
  const cache = RedisAgentCache.getInstance();
  await cache.addTrainer(contractAddress, tokenId, trainer, chainId, blockNumber, transactionHash);
}

async function handleTrainerRemoved(payload: TrainerRemovedPayload) {
  const { tokenId, trainer } = payload.data;
  const { contractAddress, blockNumber, transactionHash, chainId } = payload.metadata;
  
  console.log(`👥 Removing trainer: Token ${tokenId}, Trainer: ${trainer}`);
  
  const cache = RedisAgentCache.getInstance();
  await cache.removeTrainer(contractAddress, tokenId, trainer, chainId, blockNumber, transactionHash);
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

    const payload: WebhookPayload = JSON.parse(body);
    
    console.log(`📨 Webhook received: ${payload.event} for token ${payload.data.tokenId}`);

    // Process different event types
    switch (payload.event) {
      case 'transfer':
        await handleOwnershipTransfer(payload);
        break;
      case 'TrainerAdded':
        await handleTrainerAdded(payload);
        break;
      case 'TrainerRemoved':
        await handleTrainerRemoved(payload);
        break;
      default:
        console.warn(`⚠️ Unknown event type: ${payload.event}`);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${payload.event} for token ${payload.data.tokenId}`,
      event: payload.event,
      tokenId: payload.data.tokenId,
      data: payload.data
    });

  } catch (error: any) {
    console.error('❌ Ownership webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}