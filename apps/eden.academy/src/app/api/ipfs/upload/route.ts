import { NextRequest, NextResponse } from 'next/server'
import { env } from '~/lib/env'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Check for Pinata JWT token
    const pinataJWT = env.PRIVATE.PINATA_JWT
    
    if (!pinataJWT) {
      console.warn('Pinata JWT not found, using mock upload')
      // Fallback to mock for development
      const mockHash = 'QmMock' + Math.random().toString(36).substring(7)
      return NextResponse.json({
        success: true,
        hash: mockHash,
        url: `ipfs://${mockHash}`,
        gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${mockHash}`
      })
    }

    console.log('Pinata JWT configured:', pinataJWT ? `${pinataJWT.substring(0, 10)}...` : 'Not found')
    console.log('Uploading metadata to Pinata:', { name: data.name, dataKeys: Object.keys(data) })
    
    // Upload to Pinata using JWT authentication
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `Agent Metadata - ${data.name || 'Unnamed'}`,
          keyvalues: {
            agent_name: data.name || 'unnamed',
            agent_role: data.role || 'unknown',
            upload_type: 'agent_metadata'
          }
        }
      })
    })
    
    if (!pinataResponse.ok) {
      let errorMessage = `HTTP ${pinataResponse.status}: ${pinataResponse.statusText}`
      try {
        const errorData = await pinataResponse.json()
        console.error('Pinata error response:', errorData)
        // Try different possible error message fields
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else {
          // If it's an object, stringify it properly
          errorMessage = `${pinataResponse.status} ${pinataResponse.statusText}: ${JSON.stringify(errorData)}`
        }
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.error('Could not parse Pinata error response:', parseError)
      }
      
      throw new Error(`Pinata upload failed: ${errorMessage}`)
    }
    
    const pinataResult = await pinataResponse.json()
    
    return NextResponse.json({
      success: true,
      hash: pinataResult.IpfsHash,
      url: `ipfs://${pinataResult.IpfsHash}`,
      gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${pinataResult.IpfsHash}`,
      timestamp: pinataResult.Timestamp
    })
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    )
  }
}