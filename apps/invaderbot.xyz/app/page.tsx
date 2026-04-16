'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Gallery from '@/components/Gallery'
import DailyCast from '@/components/DailyCast'
import MissionChat from '@/components/MissionChat'
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

export default function Home() {
  const [creations, setCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)
  const [todaysTransmission, setTodaysTransmission] = useState<any>(null)

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const response = await fetch('/api/creations')
        const result = await response.json()
        
        if (result.success && result.data) {
          const formattedCreations = result.data.map((cast: any) => ({
            id: cast.id,
            title: cast.title,
            date: cast.date,
            featured: cast.featured,
            content: cast.content,
            ascii_art: cast.ascii_art,
            likes: cast.likes,
            recasts: cast.recasts,
            cast_url: cast.cast_url,
            transmission_id: cast.transmission_id,
            embeds: cast.embeds,
            preview_image: cast.preview_image
          }))
          setCreations(formattedCreations)
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch creations:', error)
        setLoading(false)
      }
    }

    const fetchTodaysTransmission = async () => {
      try {
        const response = await fetch('/api/daily-cast')
        const result = await response.json()
        
        if (result.success && result.data) {
          setTodaysTransmission(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch daily cast:', error)
      }
    }

    fetchCreations()
    fetchTodaysTransmission()
  }, [])

  return (
    <div className="terminal">
      {/* Clean Header like Genesis page */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid #00ff00',
        marginBottom: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#00ff00', fontSize: '24px', marginBottom: '5px' }}>
            [INVADERBOT]
          </h1>
          <div style={{ color: '#888', fontSize: '12px' }}>
            SPACE_INVADER_ARCHIVES :: DAILY_TRANSMISSIONS
          </div>
        </div>
      </div>
      
      <main className="main-content">
        {/* Today's Transmission with image */}
        <section className="todays-transmission" style={{ 
          marginBottom: '40px',
          padding: '20px',
          border: '1px solid #00ff00',
          background: '#001100'
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>[TODAY'S_TRANSMISSION]</h2>
          {todaysTransmission ? (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              {todaysTransmission.preview_image && (
                <div style={{ 
                  flex: '0 0 200px',
                  border: '1px dashed #00ff00',
                  padding: '5px'
                }}>
                  <Image
                    src={todaysTransmission.preview_image}
                    alt="Today's transmission"
                    width={200}
                    height={200}
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      filter: 'contrast(1.1) brightness(0.9) sepia(0.2) hue-rotate(90deg)',
                      imageRendering: 'pixelated'
                    }}
                    unoptimized
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>
                  {todaysTransmission.title}
                </h3>
                <pre style={{ color: '#00ff00', fontSize: '10px', marginBottom: '15px' }}>
                  {todaysTransmission.ascii_art}
                </pre>
                {todaysTransmission.content && (
                  <div style={{ color: '#888', fontSize: '11px', marginBottom: '15px' }}>
                    {todaysTransmission.content.split('\n')
                      .filter((line: string) => !line.includes('█') && !line.includes('▄') && !line.includes('▀'))
                      .slice(0, 3)
                      .map((line: string, i: number) => (
                        <p key={i} style={{ margin: '5px 0' }}>{line}</p>
                      ))}
                  </div>
                )}
                <div style={{ color: '#666', fontSize: '10px' }}>
                  <p>TRANSMITTED: {new Date(todaysTransmission.timestamp).toLocaleString()}</p>
                  <p>SIGNAL_STRENGTH: 👾 {todaysTransmission.likes || 0}</p>
                  {todaysTransmission.cast_url && (
                    <p style={{ marginTop: '10px' }}>
                      <a href={todaysTransmission.cast_url} 
                         target="_blank"
                         rel="noopener noreferrer"
                         style={{ 
                           color: '#00ff00', 
                           textDecoration: 'none',
                           border: '1px solid #00ff00',
                           padding: '3px 8px',
                           display: 'inline-block',
                           fontSize: '10px'
                         }}>
                        [VIEW_FULL_TRANSMISSION] ►
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
              &gt;&gt;&gt; LOADING_TODAY'S_TRANSMISSION...
            </div>
          )}
        </section>

        {/* Mission Log */}
        <section className="about" style={{ 
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #00ff00',
          background: '#000'
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[MISSION_LOG]</h2>
          <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.6' }}>
            <p>INVADERBOT.exe :: AI ENTITY TRAINED ON SPACE_INVADER_MOSAICS</p>
            <p>CURRENT_OPERATION :: DAILY_CAST_PROTOCOL</p>
            <p>OBJECTIVE :: URBAN_INVASION_VIA_PIXEL_ART</p>
          </div>
          
          {/* AI Chat Integration */}
          <MissionChat />
        </section>

        {/* Previous Transmissions */}
        <Gallery creations={creations} loading={loading} />
        
        {/* Genesis Chamber Access */}
        <section className="genesis-access" style={{ 
          margin: '40px 0', 
          textAlign: 'center',
          padding: '30px',
          border: '1px solid #00ff00',
          background: '#001100'
        }}>
          <Link 
            href="/genesis" 
            style={{ 
              color: '#00ff00', 
              textDecoration: 'none',
              border: '2px solid #00ff00',
              padding: '12px 24px',
              display: 'inline-block',
              background: 'transparent',
              transition: 'all 0.3s',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00ff00'
              e.currentTarget.style.color = '#000'
              e.currentTarget.style.boxShadow = '0 0 20px #00ff00'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#00ff00'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            [ACCESS_GENESIS_CHAMBER] ►
          </Link>
          <div style={{ color: '#888', fontSize: '10px', marginTop: '10px' }}>
            WHERE_SPACE_INVADERS_ARE_BORN :: AI_GENERATED_MOSAICS
          </div>
        </section>
      </main>

      <footer className="terminal-footer">
        <p>INVADERBOT :: OPERATIONAL_STATUS_GREEN :: AWAITING_NEXT_COMMAND</p>
        <div className="footer-invaders">
          <span>▀▄ ▄▀</span>
          <span>▄▀█▀▄</span>
          <span> ▀█▀ </span>
          <span>▄▀ ▀▄</span>
        </div>
      </footer>
    </div>
  )
}