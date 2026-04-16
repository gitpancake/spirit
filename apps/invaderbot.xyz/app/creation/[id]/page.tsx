import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface CreationData {
  id: string
  title: string
  description: string
  prompt: string
  imageUrl: string
  thumbnailUrl: string
  filename: string
  dimensions: {
    width: number
    height: number
    aspectRatio: number
  }
  mimeType: string
  createdAt: string
  updatedAt: string
  likeCount: number
  agent: any
  user: any
  quality: string
  aspectRatio: string
}

async function getCreationData(id: string): Promise<{creation: CreationData, allCreations: CreationData[]} | null> {
  try {
    const response = await fetch(`https://www.invaderbot.xyz/api/creation/${id}`, {
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
    console.error('Failed to fetch creation:', error)
    return null
  }
}

export default async function CreationPage({ params }: { params: { id: string } }) {
  const data = await getCreationData(params.id)
  
  if (!data) {
    notFound()
  }

  const { creation, allCreations } = data
  const currentIndex = allCreations.findIndex(c => c.id === creation.id)
  const prevCreation = currentIndex > 0 ? allCreations[currentIndex - 1] : null
  const nextCreation = currentIndex >= 0 && currentIndex < allCreations.length - 1 ? allCreations[currentIndex + 1] : null

  return (
    <div className="terminal">
      {/* Creation Header */}
      <div className="creation-header" style={{ 
        marginBottom: '30px', 
        textAlign: 'center', 
        border: '1px solid #00ff00', 
        padding: '15px' 
      }}>
        <Link href="/genesis" style={{ 
          color: '#00ff00', 
          textDecoration: 'none', 
          fontSize: '12px' 
        }}>
          [◄ RETURN_TO_GENESIS_CHAMBER]
        </Link>
        <h1 style={{ color: '#00ff00', marginTop: '10px' }}>{creation.title}</h1>
        <div style={{ color: '#888', fontSize: '10px', marginTop: '5px' }}>
          GENESIS_SEQUENCE :: CREATION_DATA_STREAM
        </div>
      </div>

      <main className="creation-content">
        {/* IMAGE FIRST - Main Image Display */}
        <section className="image-section" style={{ 
          marginBottom: '30px', 
          textAlign: 'center', 
          border: '1px solid #00ff00', 
          padding: '20px', 
          background: '#001100' 
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[VISUAL_DATA]</h2>
          <div style={{ 
            border: '1px dashed #00ff00', 
            padding: '15px',
            display: 'inline-block',
            background: '#000',
            maxWidth: '100%'
          }}>
            <Image
              src={creation.imageUrl}
              alt={creation.description}
              width={800}
              height={800}
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                filter: 'contrast(1.1) brightness(0.9) sepia(0.2) hue-rotate(90deg)',
                imageRendering: 'pixelated'
              }}
              unoptimized
              priority
            />
          </div>
        </section>

        {/* Creation Description */}
        <section className="description-section" style={{ 
          marginBottom: '30px', 
          border: '1px solid #00ff00', 
          padding: '20px', 
          background: '#001100' 
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[CREATION_PARAMETERS]</h2>
          <div style={{ color: '#00ff00', fontSize: '14px', lineHeight: '1.6' }}>
            <p>{creation.prompt}</p>
          </div>
        </section>

        {/* Technical Metadata */}
        <section className="metadata-section" style={{ 
          marginBottom: '30px', 
          border: '1px solid #00ff00', 
          padding: '20px', 
          background: '#001100' 
        }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>[TECHNICAL_SPECIFICATIONS]</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            fontSize: '12px' 
          }}>
            <div>
              <div style={{ color: '#888' }}>DIMENSIONS:</div>
              <div style={{ color: '#00ff00' }}>
                {creation.dimensions.width} x {creation.dimensions.height}
              </div>
            </div>
            <div>
              <div style={{ color: '#888' }}>FORMAT:</div>
              <div style={{ color: '#00ff00' }}>{creation.mimeType}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>QUALITY:</div>
              <div style={{ color: '#00ff00' }}>{creation.quality.toUpperCase()}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>ASPECT_RATIO:</div>
              <div style={{ color: '#00ff00' }}>{creation.aspectRatio}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>GENESIS_SIGNALS:</div>
              <div style={{ color: '#00ff00' }}>👾 {creation.likeCount}</div>
            </div>
            <div>
              <div style={{ color: '#888' }}>GENESIS_DATE:</div>
              <div style={{ color: '#00ff00' }}>
                {new Date(creation.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="navigation-section" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          border: '1px solid #00ff00', 
          padding: '15px',
          background: '#001100'
        }}>
          <div>
            {prevCreation && (
              <Link 
                href={`/creation/${prevCreation.id}`} 
                style={{ 
                  color: '#00ff00', 
                  textDecoration: 'none',
                  border: '1px solid #00ff00',
                  padding: '8px 16px',
                  fontSize: '12px',
                  display: 'inline-block'
                }}
              >
                [◄ PREVIOUS]
              </Link>
            )}
          </div>
          
          <div style={{ color: '#888', fontSize: '12px' }}>
            CREATION_{currentIndex + 1}_OF_{allCreations.length}
          </div>
          
          <div>
            {nextCreation && (
              <Link 
                href={`/creation/${nextCreation.id}`} 
                style={{ 
                  color: '#00ff00', 
                  textDecoration: 'none',
                  border: '1px solid #00ff00',
                  padding: '8px 16px',
                  fontSize: '12px',
                  display: 'inline-block'
                }}
              >
                [NEXT ►]
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}