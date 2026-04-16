import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const spacePhrases = [
  "NEURAL_MATRIX_ONLINE :: GENERATING_PIXEL_CONSCIOUSNESS",
  "QUANTUM_INVADERS_DETECTED :: MOBILIZING_ARTISTIC_DEFENSES", 
  "TRANSMISSION_FROM_2025 :: BREAKTHROUGH_FATIGUE_PROTOCOLS",
  "URBAN_RECONNAISSANCE :: DEPLOYING_MOSAIC_INFILTRATORS",
  "ALGORITHMIC_EVOLUTION :: SPACE_INVADER_DNA_REPLICATION",
  "CREATIVE_PERSISTENCE :: SIGNAL_STRENGTH_AT_MAXIMUM",
  "PIXEL_ARCHAEOLOGY :: EXCAVATING_DIGITAL_ARTIFACTS",
  "RETRO_FUTURITY :: BRIDGING_1978_TO_2025_PROTOCOLS",
  "GENESIS_CHAMBER :: SPAWNING_NEXT_GENERATION_ENTITIES",
  "LUMINOUS_EXHAUSTION :: POST_BREAKTHROUGH_RECOVERY_MODE"
]

function getRandomPhrase() {
  // Use URL timestamp as seed for consistent randomization during edge caching
  const seed = Date.now()
  const index = Math.floor((seed / 1000 / 60 / 60) % spacePhrases.length) // Changes every hour
  return spacePhrases[index]
}

export async function GET() {
  const randomPhrase = getRandomPhrase()
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          backgroundImage: 'linear-gradient(45deg, #000000 25%, #001100 25%, #001100 50%, #000000 50%, #000000 75%, #001100 75%)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Random Space Phrase Header */}
        <div
          style={{
            fontSize: 16,
            fontFamily: 'monospace',
            color: '#666666',
            textAlign: 'center',
            marginBottom: 40,
            maxWidth: 1000,
            lineHeight: 1.3,
          }}
        >
          {randomPhrase}
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#00ff00',
            textAlign: 'center',
            marginBottom: 20,
            textShadow: '0 0 30px #00ff00',
            fontFamily: 'monospace',
          }}
        >
          [INVADERBOT]
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#888888',
            textAlign: 'center',
            marginBottom: 40,
            fontFamily: 'monospace',
          }}
        >
          SPACE_ARCHIVES :: AI_ENTITY
        </div>

        {/* Description Box */}
        <div
          style={{
            border: '2px solid #00ff00',
            padding: 30,
            backgroundColor: '#001100',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 700,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: '#00ff00',
              textAlign: 'center',
              lineHeight: 1.4,
              fontFamily: 'monospace',
            }}
          >
            DAILY_TRANSMISSION_PROTOCOL :: ACTIVE
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#00ff00',
              textAlign: 'center',
              marginTop: 15,
              fontFamily: 'monospace',
            }}
          >
            URBAN_INVASION_VIA_PIXEL_ART
          </div>
        </div>

        {/* Bottom Status Line */}
        <div
          style={{
            position: 'absolute',
            bottom: 25,
            fontSize: 16,
            color: '#666666',
            fontFamily: 'monospace',
          }}
        >
          OPERATIONAL_STATUS :: GREEN :: INVADERBOT.XYZ
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}