import { NextRequest, NextResponse } from 'next/server';
import { extractIPFSHash } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uri = searchParams.get('uri') || 'ipfs://bafkreifoyp5tp46issu2ohzko2dva3wqowz2fel5idecwzgvabci5vpuxm';
  
  const hash = extractIPFSHash(uri);
  
  return NextResponse.json({
    success: true,
    input: uri,
    extractedHash: hash,
    isValid: !!hash
  });
}