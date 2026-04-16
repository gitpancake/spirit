import { NextRequest, NextResponse } from 'next/server'
import { env } from '~/lib/env'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Check for Pinata JWT token
    const pinataJWT = env.PRIVATE.PINATA_JWT
    
    if (!pinataJWT) {
      console.warn('Pinata JWT not found, using mock upload for file')
      // Fallback to mock for development
      const mockHash = 'QmFile' + Math.random().toString(36).substring(7)
      return NextResponse.json({
        success: true,
        hash: mockHash,
        url: `ipfs://${mockHash}`,
        gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${mockHash}`,
        filename: file.name,
        size: file.size,
        type: file.type
      })
    }
    
    // Upload file to Pinata using JWT authentication
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    pinataFormData.append('pinataMetadata', JSON.stringify({
      name: file.name,
      keyvalues: {
        filename: file.name,
        filesize: file.size.toString(),
        filetype: file.type,
        upload_type: 'agent_image'
      }
    }))
    
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: pinataFormData
    })
    
    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.json().catch(() => ({}))
      throw new Error(`Pinata file upload failed: ${errorData.error || pinataResponse.statusText}`)
    }
    
    const pinataResult = await pinataResponse.json()
    
    return NextResponse.json({
      success: true,
      hash: pinataResult.IpfsHash,
      url: `ipfs://${pinataResult.IpfsHash}`,
      gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${pinataResult.IpfsHash}`,
      filename: file.name,
      size: file.size,
      type: file.type,
      timestamp: pinataResult.Timestamp
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'File upload failed' 
      },
      { status: 500 }
    )
  }
}