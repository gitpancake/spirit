'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Creation {
  id: string
  title: string
  date: string
  featured: boolean
  content?: string
  ascii_art?: string
  likes?: number
  recasts?: number
  cast_url?: string
  transmission_id?: string
  embeds?: string[]
  preview_image?: string | null
}

interface GalleryProps {
  creations: Creation[]
  loading: boolean
}

export default function Gallery({ creations, loading }: GalleryProps) {
  const [filter, setFilter] = useState('all')

  const filteredCreations = (() => {
    if (filter === 'all') return creations
    if (filter === 'recent') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return creations.filter(creation => {
        const creationDate = new Date(creation.date)
        return creationDate >= weekAgo
      })
    }
    if (filter === 'featured') {
      // Get top 5 transmissions by likes (alien signal strength)
      return [...creations]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5)
    }
    return creations
  })()

  return (
    <section className="archives">
      <h2>[PREVIOUS_TRANSMISSIONS]</h2>
      <div className="filter-controls">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          [ALL]
        </button>
        <button 
          className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
          onClick={() => setFilter('recent')}
        >
          [RECENT]
        </button>
        <button 
          className={`filter-btn ${filter === 'featured' ? 'active' : ''}`}
          onClick={() => setFilter('featured')}
        >
          [TOP_5_BY_SIGNAL]
        </button>
      </div>
      
      <div className="gallery-grid">
        {loading ? (
          <div className="loading">&gt;&gt;&gt; ACCESSING_ARCHIVES...</div>
        ) : filteredCreations.length > 0 ? (
          filteredCreations.map(creation => (
            <Link key={creation.id} href={`/cast/${creation.id}`} style={{ textDecoration: 'none' }}>
              <div className="gallery-item">
                <div className="date">DATE: {creation.date}</div>
                <h3>{creation.title}</h3>
                {creation.featured && (
                  <div className="featured">[FEATURED_TRANSMISSION]</div>
                )}
                
                {/* Preview Image */}
                {creation.preview_image && (
                  <div style={{ 
                    marginTop: '10px', 
                    border: '1px dashed #00ff00', 
                    padding: '5px',
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: '8px', color: '#666', marginBottom: '5px' }}>
                      [VISUAL_DATA_PREVIEW]
                    </div>
                    <Image
                      src={creation.preview_image}
                      alt="Visual transmission preview"
                      width={150}
                      height={150}
                      style={{ 
                        width: '100%', 
                        maxWidth: '150px',
                        height: 'auto', 
                        display: 'block',
                        margin: '0 auto',
                        filter: 'contrast(1.1) brightness(0.9) sepia(0.2) hue-rotate(90deg)',
                        imageRendering: 'pixelated'
                      }}
                      unoptimized
                    />
                  </div>
                )}
                
                {creation.ascii_art && (
                  <pre style={{ fontSize: '10px', marginTop: '10px', color: '#00ff00' }}>
                    {creation.ascii_art}
                  </pre>
                )}
                
                {creation.content && (
                  <div style={{ fontSize: '10px', marginTop: '8px', color: '#888', maxHeight: '60px', overflow: 'hidden' }}>
                    {creation.content.split('\n').slice(0, 3).map((line, i) => 
                      !line.includes('█') && !line.includes('▄') && !line.includes('▀') && line.trim() ? (
                        <div key={i}>{line.slice(0, 50)}{line.length > 50 ? '...' : ''}</div>
                      ) : null
                    )}
                  </div>
                )}
                <div style={{ fontSize: '9px', color: '#666', marginTop: '8px' }}>
                  {creation.transmission_id && <div>ID: {creation.transmission_id}</div>}
                  {(creation.likes || creation.recasts) && (
                    <div>👾 {creation.likes || 0} | 🔄 {creation.recasts || 0}</div>
                  )}
                  <div style={{ color: '#00ff00', fontSize: '9px', marginTop: '5px' }}>
                    [CLICK_TO_VIEW_TRANSMISSION]
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="loading">&gt;&gt;&gt; NO_PREVIOUS_TRANSMISSIONS_FOUND</div>
        )}
      </div>
    </section>
  )
}