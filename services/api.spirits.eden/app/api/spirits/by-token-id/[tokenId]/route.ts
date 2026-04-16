import { NextRequest, NextResponse } from 'next/server';

// This is an alias endpoint that redirects to the main agent endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  // Redirect to the main agent endpoint
  const { tokenId } = params;
  const url = new URL(request.url);
  const redirectUrl = new URL(`/api/spirit/${tokenId}`, url.origin);
  
  // Preserve query parameters
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  
  return NextResponse.redirect(redirectUrl, 301);
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}