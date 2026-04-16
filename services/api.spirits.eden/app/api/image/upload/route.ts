import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting image/metadata upload to IPFS via Pinata...');

    // Check environment variables
    if (!process.env.PINATA_JWT) {
      console.error('❌ Missing Pinata JWT configuration');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Pinata credentials' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📁 Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
    console.log('🌐 Pinning to InterPlanetary File System...');

    // Upload to Pinata using correct SDK syntax
    const upload = await pinata.upload.public
      .file(file)
      .name(file.name)
      .keyvalues({
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        source: 'spirit-registry'
      });
    
    const result = upload;

    // Debug: Log the full result to see available properties
    console.log('📥 Full upload result:', result);
    console.log('📥 Result keys:', Object.keys(result));
    
    // Try different possible hash property names
    const hash = result.IpfsHash || result.cid || result.hash || result.id;
    console.log('✅ Successfully pinned to IPFS:', hash);

    return NextResponse.json({
      success: true,
      ipfsHash: hash,
      ipfsUrl: `ipfs://${hash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${hash}`,
      fileSize: file.size,
      fileName: file.name,
      fileType: file.type,
      pinataData: result
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}