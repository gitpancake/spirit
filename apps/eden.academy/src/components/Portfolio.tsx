'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Creation, edenApi } from '~/lib/eden-api'

interface PortfolioProps {
  agentId: string
  agentName: string
  tokenId: string
}

function Portfolio({ agentId, agentName, tokenId }: PortfolioProps) {
  const router = useRouter()
  const [creations, setCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const requestInProgressRef = useRef(false)

  const loadInitialCreations = useCallback(async () => {
    if (!agentId || requestInProgressRef.current) return
    
    try {
      requestInProgressRef.current = true
      setLoading(true)
      setError(null)
      
      console.log(`Loading initial creations for agent ${agentId}`)
      const response = await edenApi.getAgentCreations(agentId, 1, 10)
      
      const filtered = (response.data.docs || []).filter(creation => {
        const isAudioFile = creation.url.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)
        return !isAudioFile
      })
      setCreations(filtered)
      setNextCursor(response.data.nextCursor || null)
      setHasMore(!!response.data.nextCursor)
    } catch (err) {
      setError('Failed to load creations')
      console.error('Error loading creations:', err)
    } finally {
      setLoading(false)
      setInitialLoad(false)
      requestInProgressRef.current = false
    }
  }, [agentId])

  useEffect(() => {
    loadInitialCreations()
  }, [loadInitialCreations])

  const handleArtworkClick = (creation: Creation) => {
    // Store artwork data for the individual page
    localStorage.setItem(`artwork_${creation._id}`, JSON.stringify(creation))
    localStorage.setItem(`artwork_${creation._id}_artist`, agentName)
    // Navigate to agent artwork page using tokenId
    router.push(`/agent/${tokenId}/artwork/${creation._id}`)
  }

  const loadMoreCreations = useCallback(async () => {
    if (!nextCursor || loadingMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more creations for agent ${agentId}, cursor: ${nextCursor}`)
      const response = await edenApi.getAgentCreations(agentId, 1, 10, nextCursor)
      const filtered = (response.data.docs || []).filter(creation => {
        const isAudioFile = creation.url.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)
        return !isAudioFile
      })
      
      setCreations(prev => [...prev, ...filtered])
      setNextCursor(response.data.nextCursor || null)
      setHasMore(!!response.data.nextCursor)
    } catch (err) {
      console.error('Error loading more creations:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [agentId, nextCursor, loadingMore])


  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMoreCreations()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    const currentObserverRef = observerRef.current
    if (currentObserverRef) {
      observer.observe(currentObserverRef)
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef)
      }
    }
  }, [hasMore, loadingMore, loadMoreCreations])

  if (loading && initialLoad) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center space-x-2 text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-sm">Fetching portfolio...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Unable to load artworks</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-gray-900 hover:text-gray-600 transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  if (creations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Artworks Yet</h3>
        <p className="text-gray-600">{agentName} hasn&apos;t created any artworks yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Artwork Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {creations.map((creation) => (
          <div
            key={creation._id}
            className="group cursor-pointer"
            onClick={() => handleArtworkClick(creation)}
          >
            {/* Artwork Image */}
            <div className="aspect-square bg-gray-50 overflow-hidden group-hover:shadow-lg transition-shadow duration-300">
              {creation.mediaAttributes.mimeType === 'video/mp4' ? (
                <video
                  src={creation.url}
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : creation.mediaAttributes.mimeType.startsWith('audio/') ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12 6-12 6z" />
                    </svg>
                    <span className="text-gray-500 text-xs">Audio</span>
                  </div>
                </div>
              ) : (
                <Image
                  src={creation.url}
                  alt={creation.name || 'Artwork'}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>

            {/* Artwork Info */}
            <div className="mt-3 space-y-1">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                {creation.name || 'Untitled'}
              </h3>
              <p className="text-xs text-gray-500">
                {new Date(creation.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Indicator */}
      <div ref={observerRef} className="text-center py-8">
        {loadingMore && (
          <div className="space-y-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
            <p className="text-gray-500 text-sm">Loading more artworks...</p>
          </div>
        )}
        {!hasMore && creations.length > 0 && (
          <p className="text-gray-400 text-sm">
            All artworks loaded ({creations.length} total)
          </p>
        )}
      </div>

    </div>
  )
}

export default React.memo(Portfolio)