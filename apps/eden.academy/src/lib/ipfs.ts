// IPFS upload utilities using internal API endpoint
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload to IPFS')
    }

    const data = await response.json()
    return data.ipfsHash
  } catch (error) {
    console.error('IPFS upload error:', error)
    
    // Re-throw error in production so it can be handled by the UI
    throw error
  }
}

export function getIPFSUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`
}