'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Image from 'next/image'
import WalletButton from '@/components/wallet-button'

// Authorized curator addresses
const AUTHORIZED_CURATORS = [
  '0x5D6D8518A1d564c85ea5c41d1dc0deca70F2301C', // Gene
  '0xF7425fB026f9297fCc57B14ace187215442586a2', 
  '0xda3c325aB45b30AeB476B026FE6A777443cA04f3'
]

interface Artwork {
  id: string
  title: string
  description?: string | null
  createdDate: string
  archiveNumber: number
  originalFilename: string
  media: {
    primary: {
      url: string
      thumbnailUrl: string
      format: string
      ipfsHash: string
    }
  }
  metadata: {
    source: string
    collection: string
    artist: string
    tags: string[]
    archived: boolean
  }
}

interface CuratorState {
  approved: Artwork[]
  rejected: Artwork[]
  pending: Artwork[]
}

const STORAGE_KEY = 'abraham-curator-state'

export default function CuratorPage() {
  const { ready, authenticated, user } = usePrivy()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [curatorState, setCuratorState] = useState<CuratorState>({
    approved: [],
    rejected: [],
    pending: []
  })
  const [showDebug, setShowDebug] = useState(false)

  // Get wallet address from user
  const address = user?.wallet?.address

  // Check if user is authorized
  const isAuthorized = authenticated && address && 
    AUTHORIZED_CURATORS.some(addr => addr.toLowerCase() === address.toLowerCase())

  // Load curator state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCuratorState(parsed)
      } catch (error) {
        console.error('Failed to parse curator state:', error)
      }
    }
  }, [])

  // Save curator state to localStorage
  const saveCuratorState = useCallback((newState: CuratorState) => {
    setCuratorState(newState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  }, [])

  // Fetch artworks
  const fetchArtworks = useCallback(async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const offset = (page - 1) * 25
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://test.api.eden-academy.xyz'
      const response = await fetch(`${apiUrl}/api/collections/abraham-early-works?offset=${offset}&limit=25`)
      const data = await response.json()
      
      if (data.success) {
        const newArtworks = data.data?.works || data.data || []
        const pagination = data.data?.pagination
        
        // Update pagination state
        setHasMorePages(pagination?.hasNextPage || newArtworks.length === 25)
        setCurrentPage(page)
        
        // Update pending list with new artworks that haven't been curated
        setCuratorState(prev => {
          const approvedIds = new Set(prev.approved.map(a => a.id))
          const rejectedIds = new Set(prev.rejected.map(a => a.id))
          const newPending = newArtworks.filter((artwork: Artwork) => 
            !approvedIds.has(artwork.id) && !rejectedIds.has(artwork.id)
          )
          
          return {
            ...prev,
            pending: page === 1 ? newPending : [...prev.pending, ...newPending]
          }
        })
      } else {
        console.error('API returned error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      fetchArtworks()
    }
  }, [isAuthorized, fetchArtworks])

  const handleApprove = useCallback(() => {
    const currentArtwork = curatorState.pending[currentIndex]
    if (!currentArtwork) return

    const newState = {
      ...curatorState,
      approved: [...curatorState.approved, currentArtwork],
      pending: curatorState.pending.filter((_, i) => i !== currentIndex)
    }
    saveCuratorState(newState)

    // Move to next artwork or stay at same index if we removed the last item
    if (currentIndex >= newState.pending.length && newState.pending.length > 0) {
      setCurrentIndex(Math.max(0, newState.pending.length - 1))
    }
  }, [curatorState, currentIndex, saveCuratorState])

  const handleReject = useCallback(() => {
    const currentArtwork = curatorState.pending[currentIndex]
    if (!currentArtwork) return

    const newState = {
      ...curatorState,
      rejected: [...curatorState.rejected, currentArtwork],
      pending: curatorState.pending.filter((_, i) => i !== currentIndex)
    }
    saveCuratorState(newState)

    // Move to next artwork or stay at same index if we removed the last item
    if (currentIndex >= newState.pending.length && newState.pending.length > 0) {
      setCurrentIndex(Math.max(0, newState.pending.length - 1))
    }
  }, [curatorState, currentIndex, saveCuratorState])

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    const nextIndex = Math.min(curatorState.pending.length - 1, currentIndex + 1)
    setCurrentIndex(nextIndex)
    
    // If we're near the end and there are more pages, load more
    if (nextIndex >= curatorState.pending.length - 3 && hasMorePages && !loadingMore) {
      fetchArtworks(currentPage + 1)
    }
  }, [curatorState.pending.length, currentIndex, hasMorePages, loadingMore, currentPage, fetchArtworks])

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight">
                Abraham Early Works Curator
              </h1>
              <WalletButton />
            </div>
          </div>
        </nav>
        
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 mb-4">Curator Access</h1>
            <p className="text-gray-600">Please connect your wallet to access the curator interface.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight">
                Abraham Early Works Curator
              </h1>
              <WalletButton />
            </div>
          </div>
        </nav>
        
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 mb-4">Unauthorized Access</h1>
            <p className="text-gray-600">Your wallet address is not authorized to access this curator interface.</p>
            <p className="text-xs text-gray-400 mt-2">Connected: {address}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight">
                Abraham Early Works Curator
              </h1>
              <WalletButton />
            </div>
          </div>
        </nav>
        
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Abraham&apos;s early works...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentArtwork = curatorState.pending[currentIndex]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight">
              Abraham Early Works Curator
            </h1>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Status Bar */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{curatorState.approved.length}</span> approved •{' '}
              <span className="font-medium text-red-600">{curatorState.rejected.length}</span> rejected •{' '}
              <span className="font-medium text-gray-900">{curatorState.pending.length}</span> pending
              {loadingMore && <span className="text-blue-600"> • loading more...</span>}
            </div>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approved Works */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Approved Works ({curatorState.approved.length})
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {curatorState.approved.length === 0 ? (
                    <p className="text-gray-500 text-sm">No approved works yet</p>
                  ) : (
                    <div className="space-y-2">
                      {curatorState.approved.map((work) => (
                        <div key={work.id} className="text-sm">
                          <span className="font-medium">{work.title}</span>
                          <span className="text-gray-500 ml-2">({work.originalFilename})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected Works */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Rejected Works ({curatorState.rejected.length})
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {curatorState.rejected.length === 0 ? (
                    <p className="text-gray-500 text-sm">No rejected works yet</p>
                  ) : (
                    <div className="space-y-2">
                      {curatorState.rejected.map((work) => (
                        <div key={work.id} className="text-sm">
                          <span className="font-medium">{work.title}</span>
                          <span className="text-gray-500 ml-2">({work.originalFilename})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Curator Interface */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {curatorState.pending.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-light text-gray-900 mb-4">All Works Curated!</h2>
            <p className="text-gray-600">
              You have reviewed all {curatorState.approved.length + curatorState.rejected.length} artworks.
            </p>
            <div className="mt-6 text-lg">
              <span className="text-green-600 font-medium">{curatorState.approved.length} approved</span> •{' '}
              <span className="text-red-600 font-medium">{curatorState.rejected.length} rejected</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Display */}
            <div>
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                {currentArtwork.media?.primary?.url ? (
                  <Image
                    src={currentArtwork.media.primary.url}
                    alt={currentArtwork.title || 'Artwork'}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><div class="text-center"><svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p>Image not available</p></div></div>'
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No image available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-600">
                  {currentIndex + 1} of {curatorState.pending.length}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === curatorState.pending.length - 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Metadata and Actions */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-light text-gray-900 mb-2">{currentArtwork.title}</h2>
                {currentArtwork.description && (
                  <p className="text-gray-600 mb-4">{currentArtwork.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  <div><span className="font-medium">Filename:</span> {currentArtwork.originalFilename}</div>
                  <div><span className="font-medium">Archive #:</span> {currentArtwork.archiveNumber}</div>
                  <div><span className="font-medium">Created:</span> {currentArtwork.createdDate}</div>
                  <div><span className="font-medium">Artist:</span> {currentArtwork.metadata.artist}</div>
                  <div><span className="font-medium">Collection:</span> {currentArtwork.metadata.collection}</div>
                  <div><span className="font-medium">Tags:</span> {currentArtwork.metadata.tags.join(', ')}</div>
                </div>
              </div>

              {/* Full Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Full Metadata</h3>
                <div className="bg-white border border-gray-200 rounded p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(currentArtwork, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white px-6 py-3 text-lg font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 text-white px-6 py-3 text-lg font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}