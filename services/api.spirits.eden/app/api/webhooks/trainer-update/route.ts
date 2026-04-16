import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import SimpleAgentCache from '@/lib/simple-agent-cache';

interface TrainerWebhookPayload {
  event: 'trainer_added' | 'trainer_removed';
  data: {
    tokenId: string;
    trainer: string;
  };
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

// Expected contract address
const EXPECTED_CONTRACT_ADDRESS = '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1';

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

async function handleTrainerAdded(payload: TrainerWebhookPayload) {
  const { tokenId, trainer } = payload.data;
  const { contractAddress } = payload.metadata;
  
  console.log(`👨‍🏫 Trainer added: Token ${tokenId}, Trainer: ${trainer}`);
  
  // For now, just log the trainer event
  // In the future, you could extend SimpleAgentCache to support trainers
  console.log(`✅ Logged trainer addition for token ${tokenId}: ${trainer}`);
}

async function handleTrainerRemoved(payload: TrainerWebhookPayload) {
  const { tokenId, trainer } = payload.data;
  const { contractAddress } = payload.metadata;
  
  console.log(`👨‍🏫 Trainer removed: Token ${tokenId}, Trainer: ${trainer}`);
  
  // For now, just log the trainer event
  // In the future, you could extend SimpleAgentCache to support trainers
  console.log(`✅ Logged trainer removal for token ${tokenId}: ${trainer}`);
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

    const payload: TrainerWebhookPayload = JSON.parse(body);
    
    // Validate contract address
    if (payload.metadata.contractAddress.toLowerCase() !== EXPECTED_CONTRACT_ADDRESS.toLowerCase()) {
      console.warn(`⚠️ Received trainer event from unexpected contract: ${payload.metadata.contractAddress}`);
      return NextResponse.json({ 
        error: 'Contract address mismatch',
        expected: EXPECTED_CONTRACT_ADDRESS,
        received: payload.metadata.contractAddress
      }, { status: 400 });
    }

    // Process the event based on type
    switch (payload.event) {
      case 'trainer_added':
        await handleTrainerAdded(payload);
        break;
        
      case 'trainer_removed':
        await handleTrainerRemoved(payload);
        break;
        
      default:
        console.warn(`⚠️ Unknown trainer event type: ${payload.event}`);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${payload.event} for token ${payload.data.tokenId}`,
      trainer: {
        tokenId: payload.data.tokenId,
        trainer: payload.data.trainer,
        action: payload.event === 'trainer_added' ? 'added' : 'removed'
      }
    });

  } catch (error: any) {
    console.error('❌ Trainer webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}