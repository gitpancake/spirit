'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Creation } from '~/lib/eden-api'
import WalletConnect from '~/components/WalletConnect'

export default function ArtworkPage() {
  const params = useParams()
  const router = useRouter()
  const artworkId = params.artworkId as string
  const tokenId = params.id as string
  const [artwork, setArtwork] = useState<Creation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [artistName, setArtistName] = useState<string>('')

  useEffect(() => {
    async function loadArtwork() {
      try {
        setLoading(true)
        setError(null)
        
        const storedArtwork = localStorage.getItem(`artwork_${artworkId}`)
        const storedArtistName = localStorage.getItem(`artwork_${artworkId}_artist`)
        
        if (storedArtwork) {
          const artworkData = JSON.parse(storedArtwork)
          setArtwork(artworkData)
          if (storedArtistName) {
            setArtistName(storedArtistName)
          }
        } else {
          setError('Artwork not found. Please view artworks through the artist portfolio.')
        }
      } catch (err) {
        setError('Failed to load artwork')
        console.error('Error loading artwork:', err)
      } finally {
        setLoading(false)
      }
    }

    if (artworkId) {
      loadArtwork()
    }
  }, [artworkId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const renderArtwork = () => {
    if (!artwork) return null

    if (artwork.mediaAttributes.mimeType === 'video/mp4') {
      return (
        <video
          src={artwork.url}
          controls
          autoPlay
          muted
          loop
          className="w-full h-full object-contain"
        />
      )
    } else if (artwork.mediaAttributes.mimeType.startsWith('audio/')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12 6-12 6z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {artwork.name || 'Audio Artwork'}
            </h3>
            <audio controls className="w-full max-w-sm">
              <source src={artwork.url} type={artwork.mediaAttributes.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )
    } else {
      return (
        <Image
          src={artwork.url}
          alt={artwork.name || 'Artwork'}
          width={artwork.mediaAttributes.width || 1200}
          height={artwork.mediaAttributes.height || 1200}
          className="w-full h-full object-contain"
          priority
        />
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm">Loading artwork...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.052 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">Artwork Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight"
            >
              Eden Academy
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="border-b border-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link 
              href="/artists"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Artists
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {artistName && (
              <>
                <Link
                  href={`/agent/${tokenId}`}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {artistName}
                </Link>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-gray-900 font-medium">
              #{artworkId.length > 8 ? `${artworkId.slice(0, 4)}...${artworkId.slice(-4)}` : artworkId}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content Container - Desktop Only */}
      <div className="hidden lg:block max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 min-h-screen">
          {/* Artwork Display Area - Takes up most space */}
          <div className="lg:col-span-2 xl:col-span-3 bg-gray-50 flex items-center justify-center relative">
            {/* Navigation arrows for future use */}
            <button className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="max-w-full max-h-full p-12 flex items-center justify-center">
              <div className="max-w-4xl max-h-[80vh] flex items-center justify-center">
                {renderArtwork()}
              </div>
            </div>

            <button className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Details Panel - Right sidebar */}
          <div className="bg-white border-l border-gray-100 flex flex-col">
            {/* Artwork Information */}
            <div className="flex-1 p-8 lg:p-12 space-y-8 overflow-y-auto">
              {/* Date as Title and Artist */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg xl:text-xl font-medium text-gray-900 leading-tight mb-3">
                    {formatDate(artwork.createdAt)}
                  </h1>
                  <p className="text-base text-gray-600 mb-4">
                    by <span className="font-medium text-gray-900">{artistName || 'Unknown Artist'}</span>
                  </p>
                  {artwork.name && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {artwork.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Price/Value placeholder for future marketplace integration */}
              <div className="border-t border-gray-100 pt-6">
                <div className="text-2xl font-light text-gray-900 mb-2">Available</div>
                <p className="text-sm text-gray-500">Contact artist for availability</p>
              </div>


              {/* Technical Details */}
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-600 mb-1">Medium</dt>
                      <dd className="text-sm font-medium text-gray-900 capitalize">
                        {artwork.mediaAttributes.mimeType.split('/')[0]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 mb-1">Format</dt>
                      <dd className="text-sm font-medium text-gray-900 uppercase">
                        {artwork.mediaAttributes.mimeType.split('/')[1]}
                      </dd>
                    </div>
                  </div>
                  
                  {artwork.mediaAttributes.width && artwork.mediaAttributes.height && (
                    <div>
                      <dt className="text-sm text-gray-600 mb-1">Dimensions</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {artwork.mediaAttributes.width} × {artwork.mediaAttributes.height} px
                      </dd>
                    </div>
                  )}
                  
                  {artwork.mediaAttributes.duration && (
                    <div>
                      <dt className="text-sm text-gray-600 mb-1">Duration</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {Math.round(artwork.mediaAttributes.duration)} seconds
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">Created</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatDate(artwork.createdAt)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 p-8 lg:p-12 space-y-3">
              <Link
                href={artwork.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium transition-colors text-center block"
              >
                View Full Resolution
              </Link>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: artwork.name || 'Artwork',
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
                className="w-full border border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 text-sm font-medium transition-colors text-center"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Mobile Only */}
      <div className="block lg:hidden max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="py-8 space-y-8">
          {/* Mobile Artwork Display */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="flex items-center justify-center">
              {renderArtwork()}
            </div>
          </div>

          {/* Mobile Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-lg font-medium text-gray-900 leading-tight mb-3">
                {formatDate(artwork.createdAt)}
              </h1>
              <p className="text-base text-gray-600 mb-4">
                by <span className="font-medium text-gray-900">{artistName || 'Unknown Artist'}</span>
              </p>
              {artwork.name && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {artwork.name}
                </p>
              )}
            </div>


            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Details</h3>
              <div className="bg-gray-50 p-6 space-y-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">Medium</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">
                      {artwork.mediaAttributes.mimeType.split('/')[0]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">Format</dt>
                    <dd className="text-sm font-medium text-gray-900 uppercase">
                      {artwork.mediaAttributes.mimeType.split('/')[1]}
                    </dd>
                  </div>
                </div>
                {artwork.mediaAttributes.width && artwork.mediaAttributes.height && (
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">Dimensions</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {artwork.mediaAttributes.width} × {artwork.mediaAttributes.height} px
                    </dd>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Link
                href={artwork.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium transition-colors text-center block"
              >
                View Full Resolution
              </Link>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: artwork.name || 'Artwork',
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
                className="w-full border border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 text-sm font-medium transition-colors text-center"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}