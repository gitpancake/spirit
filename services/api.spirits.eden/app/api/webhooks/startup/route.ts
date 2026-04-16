import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import RedisAgentCache from '@/lib/redis-agent-cache';

interface StartupPayload {
  contractAddress: string;
  chainId: number;
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
      console.error('❌ Invalid webhook signature for startup');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: StartupPayload = JSON.parse(body);
    
    console.log(`🚀 Startup notification: ${payload.contractAddress} (Chain ${payload.chainId})`);

    // Validate required fields
    if (!payload.contractAddress || !payload.chainId) {
      return NextResponse.json({ 
        error: 'Missing required fields: contractAddress, chainId' 
      }, { status: 400 });
    }

    const cache = RedisAgentCache.getInstance();
    const currentConfig = await cache.getCurrentContract();
    
    if (!currentConfig) {
      // First startup - no existing contract
      await cache.setCurrentContract(payload.contractAddress, payload.chainId);
      
      return NextResponse.json({
        success: true,
        message: 'Initial contract configuration registered',
        contractAddress: payload.contractAddress,
        chainId: payload.chainId,
        cacheStatus: 'initialized'
      });
      
    } else if (currentConfig.contractAddress === payload.contractAddress && currentConfig.chainId === payload.chainId) {
      // Same contract and chain - cache is valid
      console.log(`✅ Cache maintained for ${payload.contractAddress} (Chain ${payload.chainId})`);
      
      return NextResponse.json({
        success: true,
        message: 'Contract configuration verified - cache maintained',
        contractAddress: payload.contractAddress,
        chainId: payload.chainId,
        cacheStatus: 'maintained'
      });
      
    } else {
      // Different contract or chain - invalidate cache
      console.log(`🔄 Contract changed: ${currentConfig.contractAddress} (${currentConfig.chainId}) → ${payload.contractAddress} (${payload.chainId})`);
      
      const cacheInvalidated = await cache.setCurrentContract(payload.contractAddress, payload.chainId);
      
      return NextResponse.json({
        success: true,
        message: 'Contract configuration changed - cache invalidated',
        previousContract: currentConfig.contractAddress,
        previousChainId: currentConfig.chainId,
        newContract: payload.contractAddress,
        newChainId: payload.chainId,
        cacheStatus: 'invalidated'
      });
    }

  } catch (error: any) {
    console.error('❌ Startup webhook processing error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}