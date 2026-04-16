'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAgentMetadata } from '~/hooks/useAgentMetadata'
import { useIPFSUpload } from '~/hooks/useIPFSUpload'

interface HeroSectionProps {
  tokenId: string
  isTrainer: boolean
}

export function HeroSection({ tokenId, isTrainer }: HeroSectionProps) {
  const { metadata, updateMetadata, isUpdating } = useAgentMetadata(tokenId)
  const { uploadFile, uploading } = useIPFSUpload()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: metadata?.name || '',
    description: metadata?.description || ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when metadata changes
  useState(() => {
    if (metadata) {
      setFormData({
        name: metadata.name || '',
        description: metadata.description || ''
      })
    }
  })

  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadFile(file)
      await updateMetadata({ image: result.url })
    } catch (error) {
      console.error('Image upload failed:', error)
    }
  }

  const handleSave = async () => {
    try {
      await updateMetadata(formData)
      setEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const getImageUrl = (imageUri: string) => {
    if (imageUri.startsWith('ipfs://')) {
      return `https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${imageUri.replace('ipfs://', '')}`
    }
    return imageUri
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Hero Section</h3>
        <p className="text-sm text-gray-600">Agent name, status, and primary identity</p>
      </div>

      <div className="flex items-start space-x-6">
        {/* Agent Avatar */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {metadata?.image ? (
              <Image
                src={getImageUrl(metadata.image)}
                alt={metadata?.name || 'Agent'}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          
          {isTrainer && (
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                disabled={uploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded border transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Change Image'}
              </button>
            </div>
          )}
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Agent Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Agent Description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {metadata?.name || 'Unnamed Agent'}
                </h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {metadata?.description || 'No description available'}
                </p>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metadata?.training?.status)}`}>
                  {metadata?.training?.status === 'active' && '🟢'}
                  {metadata?.training?.status === 'paused' && '🟡'}
                  {metadata?.training?.status === 'completed' && '🔵'}
                  {!metadata?.training?.status && '⚪'}
                  <span className="ml-1 capitalize">{metadata?.training?.status || 'Unknown'}</span>
                </span>
                
                {metadata?.training?.progress !== undefined && (
                  <span className="text-xs text-gray-500">
                    {metadata.training.progress}% Progress
                  </span>
                )}
              </div>

              {isTrainer && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Configure
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}