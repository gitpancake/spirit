'use client'

import { useState } from 'react'

interface IPFSUploadResult {
  hash: string
  url: string
  gateway: string
}

export function useIPFSUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadToIPFS = async (data: unknown): Promise<IPFSUploadResult> => {
    setUploading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('IPFS upload failed')
      }

      const result = await response.json()
      
      return {
        hash: result.hash,
        url: `ipfs://${result.hash}`,
        gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${result.hash}`
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const uploadFile = async (file: File): Promise<IPFSUploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    
    setUploading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ipfs/upload-file', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const result = await response.json()
      
      return {
        hash: result.hash,
        url: `ipfs://${result.hash}`,
        gateway: `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${result.hash}`
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'File upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadToIPFS,
    uploadFile,
    uploading,
    error
  }
}