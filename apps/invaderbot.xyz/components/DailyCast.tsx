'use client'

import { useState, useEffect } from 'react'

interface DailyCreation {
  title: string
  ascii: string
  timestamp: string
  content?: string
  likes?: number
  recasts?: number
  cast_url?: string
}

export default function DailyCast() {
  const [dailyCreation, setDailyCreation] = useState<DailyCreation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDailyCast = async () => {
      try {
        const response = await fetch('/api/daily-cast')
        const result = await response.json()
        
        if (result.success && result.data) {
          setDailyCreation({
            title: result.data.title,
            ascii: result.data.ascii_art,
            timestamp: new Date(result.data.timestamp).toLocaleString(),
            content: result.data.content,
            likes: result.data.likes,
            recasts: result.data.recasts,
            cast_url: result.data.cast_url
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch daily cast:', error)
        setLoading(false)
      }
    }

    fetchDailyCast()
  }, [])

  return (
    <section className="daily-cast">
      <h2>[TODAY'S_TRANSMISSION]</h2>
      <div className="creation-display">
        {loading ? (
          <div className="loading">&gt;&gt;&gt; LOADING_DAILY_CAST...</div>
        ) : dailyCreation ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>
              {dailyCreation.title}
            </h3>
            <pre style={{ color: '#00ff00', fontSize: '12px' }}>
              {dailyCreation.ascii}
            </pre>
            {dailyCreation.content && (
              <div style={{ color: '#00ff00', fontSize: '12px', marginTop: '15px', maxWidth: '600px', margin: '15px auto 0' }}>
                {dailyCreation.content.split('\n').map((line, i) => 
                  !line.includes('█') && !line.includes('▄') && !line.includes('▀') ? (
                    <p key={i} style={{ margin: '5px 0' }}>{line}</p>
                  ) : null
                )}
              </div>
            )}
            <div style={{ color: '#888', fontSize: '10px', marginTop: '15px' }}>
              <p>TRANSMITTED: {dailyCreation.timestamp}</p>
              {(dailyCreation.likes || dailyCreation.recasts) && (
                <p>
                  SIGNAL_STRENGTH: 👾 {dailyCreation.likes || 0} | 🔄 {dailyCreation.recasts || 0}
                </p>
              )}
              {dailyCreation.cast_url && (
                <p>
                  <a href={dailyCreation.cast_url} 
                     style={{ color: '#00ff00', textDecoration: 'none' }}>
                    [VIEW_FULL_TRANSMISSION]
                  </a>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="loading">&gt;&gt;&gt; NO_TRANSMISSION_DETECTED</div>
        )}
      </div>
    </section>
  )
}