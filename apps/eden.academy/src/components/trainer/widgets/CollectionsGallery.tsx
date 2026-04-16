'use client'

import { useState, useEffect } from 'react'
import { useAgentMetadata } from '~/hooks/useAgentMetadata'

interface Collection {
  id: string
  artist: string
  title: string
  description: string
  totalWorks: number
  apiUrl: string
}

interface CollectionsGalleryProps {
  tokenId: string
  isTrainer: boolean
}

export function CollectionsGallery({ tokenId, isTrainer }: CollectionsGalleryProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { metadata, updateSocial, isUpdating } = useAgentMetadata(tokenId)
  const linkedCollections = metadata?.social?.linkedCollections || []

  // Fetch available collections
  useEffect(() => {
    async function fetchCollections() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/collections')
        const data = await response.json()
        
        if (data.success && data.data?.collections) {
          setCollections(data.data.collections)
        } else {
          // Mock collections if API not available yet
          setCollections([
            {
              id: 'abraham-early-works',
              artist: 'Abraham',
              title: 'Early Works Collection',
              description: 'Abraham\'s foundational artistic explorations and early digital creations',
              totalWorks: 45,
              apiUrl: '/api/works/abraham-early-works'
            },
            {
              id: 'abstract-expressions',
              artist: 'Abraham',
              title: 'Abstract Expressions',
              description: 'A journey through abstract digital art and experimental techniques',
              totalWorks: 32,
              apiUrl: '/api/works/abstract-expressions'
            },
            {
              id: 'nature-studies',
              artist: 'Abraham',
              title: 'Digital Nature Studies',
              description: 'Capturing the essence of nature through digital interpretation',
              totalWorks: 28,
              apiUrl: '/api/works/nature-studies'
            }
          ])
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err)
        setError('Failed to load collections')
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const toggleCollection = async (collectionId: string) => {
    if (!isTrainer) return

    const newLinkedCollections = linkedCollections.includes(collectionId)
      ? linkedCollections.filter(id => id !== collectionId)
      : [...linkedCollections, collectionId]

    try {
      await updateSocial({
        ...metadata?.social,
        linkedCollections: newLinkedCollections
      })
    } catch (error) {
      console.error('Failed to update collections:', error)
    }
  }

  if (loading) {
    return (
      <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Collections Gallery</h3>
          <p className="text-sm text-gray-600">Link agent to artist collections available through the platform API</p>
        </div>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading collections...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Collections Gallery</h3>
          <p className="text-sm text-gray-600">Link agent to artist collections available through the platform API</p>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Collections Gallery</h3>
        <p className="text-sm text-gray-600">Link agent to artist collections available through the platform API</p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No collections available</p>
        </div>
      ) : (
        <>
          {/* Collections Grid */}
          <div className="grid gap-4 mb-6">
            {collections.map((collection) => {
              const isLinked = linkedCollections.includes(collection.id)
              return (
                <div
                  key={collection.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isLinked 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium text-sm ${isLinked ? 'text-blue-900' : 'text-gray-900'}`}>
                          {collection.title}
                        </h4>
                        {isLinked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Linked
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mb-2 ${isLinked ? 'text-blue-700' : 'text-gray-600'}`}>
                        by {collection.artist}
                      </p>
                      <p className={`text-xs mb-3 line-clamp-2 ${isLinked ? 'text-blue-600' : 'text-gray-500'}`}>
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isLinked ? 'text-blue-600' : 'text-gray-500'}`}>
                          {collection.totalWorks} works
                        </span>
                        {isLinked && (
                          <a
                            href={collection.apiUrl}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View API
                          </a>
                        )}
                      </div>
                    </div>

                    {isTrainer && (
                      <button
                        onClick={() => toggleCollection(collection.id)}
                        disabled={isUpdating}
                        className={`ml-4 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                          isLinked
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        }`}
                      >
                        {isUpdating ? 'Updating...' : (isLinked ? 'Unlink' : 'Link')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Linked Collections Summary */}
          {linkedCollections.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Linked Collections ({linkedCollections.length})
              </h4>
              <div className="space-y-2">
                {linkedCollections.map(id => {
                  const collection = collections.find(c => c.id === id)
                  return collection ? (
                    <div key={id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{collection.title}</span>
                        <span className="text-xs text-gray-500">({collection.totalWorks} works)</span>
                      </div>
                      <a
                        href={collection.apiUrl}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        API
                      </a>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}