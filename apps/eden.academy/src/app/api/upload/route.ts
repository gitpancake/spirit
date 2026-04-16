import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max size is 10MB.' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error('Pinata upload error:', errorText)
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 })
    }

    const pinataData = await pinataResponse.json()
    
    return NextResponse.json({
      success: true,
      ipfsHash: pinataData.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`,
      size: file.size,
      timestamp: pinataData.Timestamp
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}