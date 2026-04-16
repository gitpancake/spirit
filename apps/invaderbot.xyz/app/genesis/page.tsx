'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'

interface GenesisCreation {
  id: string
  title: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  dimensions: {
    width: number
    height: number
    aspectRatio: number
  } | null
  mimeType: string
  createdAt?: string
  updatedAt?: string
}

interface PaginationInfo {
  total: number
  limit: number
  cursor: string | null
  hasMore: boolean
}

const INVADER_AGENT_ID = 'invader-mosaic-generator'

export default function GenesisPage() {
  const [creations, setCreations] = useState<GenesisCreation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    cursor: null,
    hasMore: true
  })
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchCreations = async (cursor: string | null = null, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      let url = `/api/eden/${INVADER_AGENT_ID}?limit=10`
      if (cursor) {
        url += `&cursor=${cursor}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        if (append) {
          setCreations(prev => [...prev, ...result.data])
        } else {
          setCreations(result.data)
        }
        setPagination(result.pagination)
        setError(null)
      } else {
        setError(result.error || 'GENESIS_CHAMBER_ERROR')
      }
      
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch genesis creations:', error)
      setError('GENESIS_CHAMBER_OFFLINE')
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchCreations()
  }, [])

  const handleLoadMore = () => {
    if (pagination.cursor && !loadingMore) {
      fetchCreations(pagination.cursor, true)
    }
  }

  if (loading && creations.length === 0) {
    return (
      <div className="terminal">
        <Header />
        <div className="loading" style={{ textAlign: 'center', marginTop: '50px' }}>
          &gt;&gt;&gt; ACCESSING_GENESIS_CHAMBER...
        </div>
      </div>
    )
  }

  if (error && creations.length === 0) {
    return (
      <div className="terminal">
        <Header />
        <div className="error-display" style={{ textAlign: 'center', marginTop: '50px', color: '#ff0000' }}>
          <h2>[ERROR]</h2>
          <p>{error}</p>
          <Link href="/" style={{ color: '#00ff00', textDecoration: 'none', marginTop: '20px', display: 'inline-block' }}>
            [RETURN_TO_ARCHIVES]
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal">
      {/* Clean Top Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid #00ff00',
        marginBottom: '30px'
      }}>
        <Link 
          href="/" 
          style={{ 
            color: '#00ff00', 
            textDecoration: 'none', 
            fontSize: '14px',
            border: '1px solid #00ff00',
            padding: '8px 16px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00ff00'
            e.currentTarget.style.color = '#000'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#00ff00'
          }}
        >
          [◄ TRANSMISSIONS]
        </Link>
        
        <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
          <div style={{ color: '#00ff00', fontSize: '16px', marginBottom: '5px' }}>
            [GENESIS_CHAMBER]
          </div>
          <div>
            {pagination.total} TOTAL_CREATIONS :: WHERE_SPACE_INVADERS_ARE_BORN
          </div>
        </div>
        
        <div style={{ width: '120px' }}></div> {/* Spacer for center alignment */}
      </div>

      <main className="genesis-content">
        {/* Genesis Grid */}
        <div className="genesis-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {creations.map((creation, index) => (
            <div 
              key={creation.id} 
              className="genesis-item"
              style={{
                border: '1px solid #00ff00',
                padding: '15px',
                background: '#000',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onClick={() => window.location.href = `/creation/${creation.id}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#001100'
                e.currentTarget.style.boxShadow = '0 0 15px #00ff00'
                e.currentTarget.style.borderColor = '#33ff33'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#00ff00'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
                {creation.title}
              </div>
              
              <div style={{ 
                border: '1px dashed #00ff00', 
                padding: '5px',
                marginBottom: '10px'
              }}>
                <Image
                  src={creation.imageUrl}
                  alt={creation.description}
                  width={250}
                  height={250}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block',
                    filter: 'contrast(1.1) brightness(0.9) sepia(0.2) hue-rotate(90deg)',
                    imageRendering: 'pixelated'
                  }}
                  unoptimized
                />
              </div>
              
              <div style={{ fontSize: '9px', color: '#666' }}>
                {creation.dimensions && (
                  <div>DIMENSIONS: {creation.dimensions.width}x{creation.dimensions.height}</div>
                )}
                <div style={{ color: '#00ff00', marginTop: '5px' }}>
                  [CLICK_TO_ANALYZE]
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {pagination.hasMore && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '40px'
          }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                background: 'transparent',
                border: '1px solid #00ff00',
                color: loadingMore ? '#666' : '#00ff00',
                padding: '10px 20px',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                transition: 'all 0.3s',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.background = '#00ff00'
                  e.currentTarget.style.color = '#000'
                }
              }}
              onMouseLeave={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#00ff00'
                }
              }}
            >
              {loadingMore ? '[LOADING...]' : '[LOAD_MORE]'}
            </button>
          </div>
        )}

        {/* End of Data Indicator */}
        {!pagination.hasMore && creations.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '40px'
          }}>
            <div style={{ color: '#666', fontSize: '11px', textAlign: 'center' }}>
              <div>END_OF_GENESIS_ARCHIVE</div>
              <div style={{ marginTop: '5px', color: '#888' }}>
                {creations.length} TOTAL_LOADED
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  )
}