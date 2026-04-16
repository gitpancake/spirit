import { NextResponse } from 'next/server';
import RedisAgentCache from '@/lib/redis-agent-cache';

export async function POST() {
  try {
    const cache = RedisAgentCache.getInstance();
    
    console.log('🧪 Testing Redis-backed cache...');
    
    await cache.setToken({
      tokenId: '99',
      ipfsHash: 'bafkreifoyp5tp46issu2ohzko2dva3wqowz2fel5idecwzgvabci5vpuxm',
      owner: '0xtest',
      metadata: { name: 'Test Agent', description: 'Test cache entry' },
      contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1',
      chainId: 11155111,
      blockNumber: '999',
      transactionHash: '0xtest'
    });
    
    const result = await cache.getAgent('0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1', '99', 11155111);
    
    return NextResponse.json({
      success: true,
      cached: result,
      message: 'Redis cache test completed'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}