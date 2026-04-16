import { NextResponse } from 'next/server';
import { agentCache } from '@/lib/cache';

export async function GET() {
  try {
    const now = Date.now();
    const rawCache: any = {};
    
    console.log(`🔍 Debug: Checking raw cache at ${new Date(now).toISOString()}`);
    
    // Direct access to the cache Map
    for (const [key, entry] of agentCache['cache'].entries()) {
      const isExpired = now > entry.expiresAt;
      rawCache[key] = {
        data: entry.data,
        timestamp: new Date(entry.timestamp).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        isExpired,
        timeToExpire: entry.expiresAt - now
      };
      
      console.log(`🔍 Cache entry: ${key}, expired: ${isExpired}, TTL: ${entry.expiresAt - now}ms`);
    }
    
    // Also test the get method directly
    const testGet = agentCache.get('metadata:0');
    console.log(`🔍 Direct get('metadata:0'):`, testGet);
    
    return NextResponse.json({
      success: true,
      currentTime: new Date(now).toISOString(),
      rawCache,
      totalEntries: agentCache['cache'].size,
      directGetTest: testGet
    });
    
  } catch (error: any) {
    console.error('❌ Raw cache debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}