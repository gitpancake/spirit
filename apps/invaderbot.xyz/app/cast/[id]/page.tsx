import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface CastData {
  id: string
  title: string
  content: string
  ascii_art: string
  date: string
  timestamp: string
  location: string
  status: string
  likes: number
  recasts: number
  author: string
  username: string
  featured: boolean
  embeds: string[]
  farcaster_url: string
}

async function getCastData(id: string): Promise<CastData | null> {
  try {
    const response = await fetch(`https://www.invaderbot.xyz/api/cast/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch cast:', error)
    return null
  }
}

export default async function CastPage({ params }: { params: { id: string } }) {
  const cast = await getCastData(params.id)
  
  if (!cast) {
    notFound()
  }

  return (
    <div className="terminal">
      {/* Header */}
      <div className="cast-header" style={{ 
        marginBottom: '30px', 
        textAlign: 'center', 
        border: '1px solid #00ff00', 
        padding: '15px' 
      }}>
        <Link href="/" style={{ 
          color: '#00ff00', 
          textDecoration: 'none', 
          fontSize: '12px' 
        }}>
          [◄ RETURN_TO_ARCHIVES]
        </Link>
        <h1 style={{ color: '#00ff00', marginTop: '10px' }}>{cast.title}</h1>
        <div style={{ color: '#888', fontSize: '10px', marginTop: '5px' }}>
          {cast.status} :: {cast.location} :: {new Date(cast.timestamp).toLocaleString()}
        </div>
      </div>

      <main className="cast-content">
        {/* IMAGE FIRST - Visual Data Section */}
        {cast.embeds && cast.embeds.length > 0 && (
          <section className="embeds-section" style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: '#00ff00', 
              marginBottom: '15px', 
              textAlign: 'center' 
            }}>[VISUAL_DATA]</h2>
            <div className="embeds-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '20px',
              justifyItems: 'center'
            }}>
              {cast.embeds.map((imageUrl: string, index: number) => (
                <div key={index} className="embed-container" style={{ 
                  border: '2px solid #00ff00', 
                  padding: '15px', 
                  background: '#001100',
                  maxWidth: '600px',
                  width: '100%'
                }}>
                  <div style={{ 
                    color: '#00ff00', 
                    fontSize: '10px', 
                    marginBottom: '15px', 
                    textAlign: 'center' 
                  }}>
                    TRANSMISSION_VISUAL_{String(index + 1).padStart(3, '0')}
                  </div>
                  <div style={{ 
                    border: '1px dashed #00ff00', 
                    padding: '10px',
                    background: '#000'
                  }}>
                    <Image
                      src={imageUrl}
                      alt={`Transmission visual ${index + 1}`}
                      width={600}
                      height={600}
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        filter: 'contrast(1.2) brightness(0.9) sepia(0.3) hue-rotate(90deg)',
                        imageRendering: 'pixelated'
                      }}
                      unoptimized
                      priority
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ASCII Art Section */}
        <section className="ascii-section" style={{ 
          marginBottom: '30px', 
          textAlign: 'center', 
          border: '1px solid #00ff00', 
          padding: '20px', 
          background: '#001100' 
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[ASCII_DATA]</h2>
          <pre style={{ 
            color: '#00ff00', 
            fontSize: '12px', 
            margin: '0',
            overflow: 'auto'
          }}>
            {cast.ascii_art}
          </pre>
        </section>

        {/* Text Content Section */}
        {cast.content && (
          <section className="content-section" style={{ 
            marginBottom: '30px', 
            border: '1px solid #00ff00', 
            padding: '20px', 
            background: '#001100' 
          }}>
            <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[MESSAGE_CONTENT]</h2>
            <div style={{ color: '#00ff00', fontSize: '14px', lineHeight: '1.6' }}>
              {cast.content.split('\n').map((line: string, i: number) => 
                !line.includes('█') && !line.includes('▄') && !line.includes('▀') && line.trim() ? (
                  <p key={i} style={{ margin: '10px 0' }}>{line}</p>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Metadata Section */}
        <section className="metadata-section" style={{ 
          border: '1px solid #00ff00', 
          padding: '20px', 
          background: '#001100' 
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[TRANSMISSION_METADATA]</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            fontSize: '12px' 
          }}>
            <div>
              <div style={{ color: '#888' }}>AUTHOR:</div>
              <div style={{ color: '#00ff00' }}>{cast.author} (@{cast.username})</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>DATE:</div>
              <div style={{ color: '#00ff00' }}>{cast.date}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>SIGNAL_STRENGTH:</div>
              <div style={{ color: '#00ff00' }}>👾 {cast.likes} | 🔄 {cast.recasts}</div>
            </div>
            {cast.featured && (
              <div>
                <div style={{ color: '#888' }}>STATUS:</div>
                <div style={{ color: '#ffff00' }}>[FEATURED_TRANSMISSION]</div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a 
              href={cast.farcaster_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#00ff00', 
                textDecoration: 'none', 
                border: '1px solid #00ff00',
                padding: '8px 16px',
                fontSize: '12px',
                display: 'inline-block'
              }}
            >
              [VIEW_ON_FARCASTER]
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}