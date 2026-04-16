import { NextResponse } from 'next/server';
import { clearAgentCaches } from '@/lib/cache';

export async function POST() {
  try {
    const result = await clearAgentCaches();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      details: {
        memoryEntriesCleared: result.memoryCleared,
        redisEntriesCleared: result.redisCleared
      }
    });
  } catch (error: any) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json(
      { error: `Failed to clear cache: ${error.message}` },
      { status: 500 }
    );
  }
}