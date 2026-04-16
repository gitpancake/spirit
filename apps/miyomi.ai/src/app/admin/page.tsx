'use client'

import { useState } from 'react'
import { useVideoGeneration } from '@/hooks/useVideoGeneration'
import { useVideoViewer } from '@/components/VideoViewer'
import { VideoTaskList } from '@/components/VideoTaskProgress'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { 
    generateVideo, 
    tasks: videoTasks, 
    isGenerating, 
    testConnection
  } = useVideoGeneration()
  const { openVideo, VideoViewerComponent } = useVideoViewer()
  
  // Video generation form states
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoStyle, setVideoStyle] = useState<'fast' | 'creative' | 'data-driven' | 'artistic'>('fast')
  const [videoFormat, setVideoFormat] = useState<'short' | 'landscape'>('short')
  const [metrics] = useState({
    winRate: 80.0,
    activeSubscribers: 142,
    subscriberGrowth: 12,
    averageDailyReturn: 21.4,
    nextDropTime: '15:00',
    timeUntilDrop: '2h 34m'
  })

  const tabs = [
    'overview', 'trading', 'concepts', 'videos', 'testing', 'training', 'performance', 'revenue'
  ]

  const [recentPicks] = useState([
    {
      id: 1,
      title: 'Fed Rate Cut March - NO',
      platform: 'Kalshi',
      timeAgo: '2 hours ago',
      edge: '18% edge',
      status: 'active'
    },
    {
      id: 2,
      title: 'Chiefs -7.5 - NO',
      platform: 'Polymarket',
      timeAgo: 'Yesterday',
      return: '+15% return',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Taylor Swift Tour - NO',
      platform: 'Manifold',
      timeAgo: '2 days ago',
      status: 'Pending'
    }
  ])

  // Video generation handlers
  const handleVideoGeneration = async () => {
    if (!videoPrompt.trim()) return
    
    try {
      await generateVideo({
        prompt: videoPrompt,
        style: videoStyle,
        format: videoFormat
      })
      // Clear form on successful submission
      setVideoPrompt('')
    } catch (error) {
      console.error('Video generation failed:', error)
    }
  }
  
  const handleConceptVideoGeneration = async () => {
    const conceptPrompt = `QQQ: THE VOLUME_SPIKE NOBODY&apos;S TALKING ABOUT. While everyone&apos;s watching BTC-USD, QQQ just did something unprecedented. Contrarian market analysis showing volume spike patterns and financial data in a modern trading environment.`
    
    try {
      await generateVideo({
        prompt: conceptPrompt,
        style: 'artistic',
        format: 'short'
      })
    } catch (error) {
      console.error('Concept video generation failed:', error)
    }
  }
  
  const handleTestVideoGeneration = async () => {
    const testPrompt = "A PROFESSIONAL MARKET ANALYSIS VISUALIZATION SHOWING RISING CHARTS AND FINANCIAL DATA STREAMS IN A MODERN TRADING FLOOR ENVIRONMENT"
    
    try {
      await generateVideo({
        prompt: testPrompt,
        style: 'data-driven',
        format: 'landscape'
      })
    } catch (error) {
      console.error('Test video generation failed:', error)
    }
  }
  
  const handleTestConnection = async () => {
    await testConnection()
  }
  
  const handleDemoVideo = () => {
    // Show demo video (could be a sample video URL)
    openVideo('https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'Demo Video')
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">MIYOMI <span className="text-sm font-normal">TRAINER DASHBOARD</span></h1>
          </div>
          <div className="flex gap-4 text-sm">
            <a href="/profile" className="hover:text-white">PROFILE</a>
            <a href="/live" className="hover:text-white">LIVE SITE</a>
            <button className="border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors">
              TRIGGER DROP + VIDEO
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-6 mb-8 text-sm">
          {tabs.map((tab) => (
            <span 
              key={tab}
              className={`cursor-pointer pb-2 px-4 py-2 ${
                activeTab === tab 
                  ? 'text-black bg-white' 
                  : 'text-white border border-white hover:bg-white hover:text-black'
              } transition-colors`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-white p-6 rounded-lg">
                <h3 className="text-white text-sm mb-2">Win Rate</h3>
                <p className="text-3xl font-bold">{metrics.winRate}%</p>
                <p className="text-white text-xs mt-1">Last 7 days</p>
              </div>
              
              <div className="border border-white p-6 rounded-lg">
                <h3 className="text-white text-sm mb-2">Active Subscribers</h3>
                <p className="text-3xl font-bold">{metrics.activeSubscribers}</p>
                <p className="text-white text-xs mt-1">+{metrics.subscriberGrowth} this week</p>
              </div>
              
              <div className="border border-white p-6 rounded-lg">
                <h3 className="text-white text-sm mb-2">Average Daily Return</h3>
                <p className="text-3xl font-bold">{metrics.averageDailyReturn}%</p>
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="border border-white p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-4">Upcoming Features</h3>
              <div className="border border-white p-4 rounded">
                <p className="text-sm">
                  Next Drop scheduled for <span className="font-semibold">{metrics.nextDropTime}</span>
                </p>
                <p className="text-white text-xs mt-1">in {metrics.timeUntilDrop}</p>
              </div>
            </div>

            {/* Recent Picks */}
            <div className="border border-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Recent Picks/Predictions</h3>
              <div className="space-y-4">
                {recentPicks.map((pick) => (
                  <div key={pick.id} className="border border-white p-4 rounded flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{pick.title}</h4>
                      <p className="text-white text-sm">{pick.platform} • {pick.timeAgo}</p>
                    </div>
                    <div className="text-right">
                      {pick.edge && <p className="text-white text-sm">{pick.edge}</p>}
                      {pick.return && <p className="text-white text-sm">{pick.return}</p>}
                      {pick.status === 'Pending' && <p className="text-white text-sm">{pick.status}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>⚡</span> LIVE TRADING INTERFACE
              </h2>
              <div className="flex gap-4">
                <span className="text-sm px-3 py-1 bg-white text-black">LIVE</span>
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  ⏸ PAUSE STREAM
                </button>
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  🔄 REFRESH
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="border border-white p-6">
                <h3 className="text-sm mb-2">DAILY P&L</h3>
                <p className="text-2xl font-bold">+0.00%</p>
              </div>
              <div className="border border-white p-6">
                <h3 className="text-sm mb-2">WIN RATE</h3>
                <p className="text-2xl font-bold">0.0%</p>
              </div>
              <div className="border border-white p-6">
                <h3 className="text-sm mb-2">ACTIVE POSITIONS</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="border border-white p-6">
                <h3 className="text-sm mb-2">TOTAL RETURN</h3>
                <p className="text-2xl font-bold">+0.00%</p>
              </div>
            </div>
            
            <div className="border border-white p-8">
              <h3 className="text-lg font-bold mb-4">LIVE POSITIONS</h3>
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-xl">NO ACTIVE POSITIONS</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Concepts Tab */}
        {activeTab === 'concepts' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🎬</span> CINEMATIC VIDEO CONCEPT GENERATOR
                <span className="text-sm font-normal">UPDATED 11:05:59</span>
              </h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">AUTO-REFRESH</span>
                </label>
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  ⚡ GENERATE CONCEPTS
                </button>
              </div>
            </div>
            
            <p className="mb-6">DYNAMIC NARRATIVE VIDEO FRAMEWORK • 9-PHASE CINEMATIC APPROACH • VISUAL DNA & EMOTIONAL FREQUENCY GENERATION</p>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm mb-2">COUNT</label>
                <select className="w-full bg-black border border-white p-2">
                  <option>5 CONCEPTS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">MIN URGENCY</label>
                <select className="w-full bg-black border border-white p-2">
                  <option>ANY URGENCY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">TARGET AUDIENCE</label>
                <select className="w-full bg-black border border-white p-2">
                  <option>ALL AUDIENCES</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">TRENDING POTENTIAL ONLY</span>
              </label>
            </div>
            
            <div className="border border-white p-6">
              <h3 className="text-lg font-bold mb-4">GENERATED CONCEPTS (5)</h3>
              
              <div className="border border-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">#1</span>
                    <span className="text-sm">🔥 Viral</span>
                    <span className="text-sm">⏰ 80/100 URGENCY</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">130K EST. VIEWS</div>
                    <div className="text-sm">CONTRARIANS</div>
                    <button className="border border-white px-3 py-1 text-sm mt-2 hover:bg-white hover:text-black transition-colors">
                      ⚡🎬 GENERATE VIDEO
                    </button>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold mb-2">QQQ: THE VOLUME_SPIKE NOBODY&apos;S TALKING ABOUT</h4>
                <p className="mb-4">WHILE EVERYONE&apos;S WATCHING BTC-USD, QQQ JUST DID SOMETHING UNPRECEDENTED.<br/>CONTRARIAN ANGLE: THE VOLUME_SPIKE IN QQQ IS EXACTLY THE KIND OF OPPORTUNITY THE CROWD MISSES</p>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h5 className="font-bold mb-2">PRIMARY DATA POINT</h5>
                    <p>QQQ SHOWING VOLUME_SPIKE: 150% DEVIATION</p>
                  </div>
                  <div>
                    <h5 className="font-bold mb-2">SUPPORTING DATA</h5>
                    <p>• HISTORICAL OCCURRENCE RATE: 1 IN 50 EVENTS<br/>• MARKET CAP IMPACT: $190M</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h5 className="font-bold mb-2">SCRIPT OUTLINE</h5>
                  <p><strong>HOOK:</strong> QQQ JUST BROKE MATHEMATICS. 1 IN 50 EVENTS - THAT&apos;S HOW RARE THIS IS.</p>
                  <p><strong>DEVELOPMENT:</strong> MARKET MAKERS DIDN&apos;T SEE THIS COMING. ALGORITHMS ARE CONFUSED. BUT THE PATTERN IS CLEAR WHEN YOU KNOW WHERE TO LOOK.</p>
                  <p><strong>REVELATION:</strong> THIS VOLUME_SPIKE SIGNALS SOMETHING BIGGER. WHEN EFFICIENT MARKETS BREAK DOWN, OPPORTUNITY EMERGES.</p>
                  <p><strong>RESONANCE:</strong> THE MARKET IS A LEARNING MACHINE. BUT SOMETIMES IT FORGETS ITS OWN LESSONS.</p>
                </div>
                
                <div>
                  <h5 className="font-bold mb-2">PLATFORM OPTIMIZATION:</h5>
                  <div className="flex gap-4">
                    <span className="text-sm">TIKTOK: MEDIUM</span>
                    <span className="text-sm">YOUTUBE: HIGH</span>
                    <span className="text-sm">TWITTER: MEDIUM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div>
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <span>📹</span> GENERATE VIDEO CONTENT
            </h2>
            
            <div className="mb-8">
              <label className="block text-sm mb-2">VIDEO PROMPT</label>
              <textarea 
                className="w-full bg-black border border-white p-4 h-32" 
                placeholder="DESCRIBE THE MARKET ANALYSIS VIDEO YOU WANT TO CREATE..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold mb-4">GENERATION STYLE</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="style" defaultChecked />
                    <div>
                      <div className="font-bold">⚡ FAST GENERATION</div>
                      <div className="text-sm">QUICK TURNAROUND, GOOD QUALITY</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="style" />
                    <div>
                      <div className="font-bold">🎨 CREATIVE MODE</div>
                      <div className="text-sm">HIGHER QUALITY, LONGER PROCESSING</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="style" />
                    <div>
                      <div className="font-bold">📊 DATA-DRIVEN</div>
                      <div className="text-sm">CHART-FOCUSED, PROFESSIONAL</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="style" />
                    <div>
                      <div className="font-bold">🎭 ARTISTIC FRAMEWORK</div>
                      <div className="text-sm">DYNAMIC NARRATIVE, CINEMATIC QUALITY, MULTI-PHASE CREATION</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">VIDEO FORMAT</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="format" defaultChecked />
                    <div>
                      <div className="font-bold">SHORT FORM (9:16)</div>
                      <div className="text-sm">TIKTOK, YOUTUBE SHORTS, INSTAGRAM</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="format" />
                    <div>
                      <div className="font-bold">LANDSCAPE (16:9)</div>
                      <div className="text-sm">YOUTUBE, TWITTER, GENERAL SHARING</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleVideoGeneration}
              disabled={isGenerating || !videoPrompt.trim()}
              className="w-full border border-white py-4 text-lg font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'GENERATING VIDEO...' : '📹 GENERATE VIDEO'}
            </button>
          </div>
        )}
        
        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>✏️</span> EDEN API TESTING
              </h2>
              <div className="flex gap-4 items-center">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  EDEN API CONNECTED
                </span>
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  🔄 REFRESH
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">TEST VIDEO GENERATION</h3>
              
              <div className="mb-4">
                <label className="block text-sm mb-2">VIDEO GENERATION TOOL</label>
                <select className="w-full bg-black border border-white p-2">
                  <option>TXT2VID - TEXT TO VIDEO</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm mb-2">GENERATION PROMPT</label>
                <textarea 
                  className="w-full bg-black border border-white p-4 h-24" 
                  defaultValue="A PROFESSIONAL MARKET ANALYSIS VISUALIZATION SHOWING RISING CHARTS AND FINANCIAL DATA STREAMS IN A MODERN TRADING FLOOR ENVIRONMENT"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button 
                  onClick={handleTestConnection}
                  className="border border-white py-3 text-sm hover:bg-white hover:text-black transition-colors"
                >
                  ✏️ TEST API
                </button>
                <button 
                  onClick={() => handleDemoVideo()}
                  className="border border-white py-3 text-sm hover:bg-white hover:text-black transition-colors"
                >
                  ▶️ DEMO MODE
                </button>
                <button 
                  onClick={() => handleTestVideoGeneration()}
                  disabled={isGenerating}
                  className="border border-white py-3 text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'GENERATING...' : '📹 REAL VIDEO'}
                </button>
              </div>
            </div>
            
            <div className="border border-white p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⚙️</span> HOW TO USE
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>1. TEST CONNECTION:</strong> CLICK &quot;TEST CONNECTION &amp; PRICING&quot; TO VERIFY EDEN API ACCESS</p>
                <p><strong>2. CHECK TOOLS:</strong> SEE WHICH VIDEO GENERATION TOOLS ARE AVAILABLE</p>
                <p><strong>3. GENERATE VIDEO:</strong> CLICK &quot;GENERATE REAL VIDEO&quot; TO CREATE ACTUAL CONTENT</p>
                <p><strong>4. ENVIRONMENT VARIABLE:</strong> SET EDEN_API_KEY FOR REAL API ACCESS</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Training Tab */}
        {activeTab === 'training' && (
          <div>
            <h2 className="text-2xl font-bold mb-8">RISK & STRATEGY CONTROLS</h2>
            
            <div className="mb-8">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span>RISK TOLERANCE</span>
                  <span>65%</span>
                </div>
                <div className="relative">
                  <input type="range" className="w-full" defaultValue="65" />
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span>CONTRARIAN INTENSITY</span>
                  <span>95%</span>
                </div>
                <div className="relative">
                  <input type="range" className="w-full" defaultValue="95" />
                </div>
              </div>
            </div>
            
            <div className="border border-white p-6">
              <h3 className="text-lg font-bold mb-6">SECTOR WEIGHTS</h3>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Politics</span>
                      <span>25%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="25" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Finance</span>
                      <span>15%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="15" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Pop</span>
                      <span>15%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="15" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Internet</span>
                      <span>5%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="5" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Sports</span>
                      <span>20%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="20" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>AI</span>
                      <span>15%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="15" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Geo</span>
                      <span>5%</span>
                    </div>
                    <input type="range" className="w-full" defaultValue="5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">DAILY PERFORMANCE</h2>
              <div className="flex gap-4">
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  ⬇️ EXPORT CSV
                </button>
                <button className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors">
                  🔄 REFRESH
                </button>
              </div>
            </div>
            
            <div className="border border-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white">
                    <th className="text-left p-4">DATE</th>
                    <th className="text-left p-4">PICKS</th>
                    <th className="text-left p-4">WINS</th>
                    <th className="text-left p-4">LOSSES</th>
                    <th className="text-left p-4">PENDING</th>
                    <th className="text-left p-4">AVG EDGE</th>
                    <th className="text-left p-4">RETURN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-20</td>
                    <td className="p-4">3</td>
                    <td className="p-4">2</td>
                    <td className="p-4">0</td>
                    <td className="p-4">1</td>
                    <td className="p-4">18.5%</td>
                    <td className="p-4">+24.3%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-21</td>
                    <td className="p-4">3</td>
                    <td className="p-4">1</td>
                    <td className="p-4">1</td>
                    <td className="p-4">1</td>
                    <td className="p-4">15.2%</td>
                    <td className="p-4">+8.7%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-22</td>
                    <td className="p-4">3</td>
                    <td className="p-4">3</td>
                    <td className="p-4">0</td>
                    <td className="p-4">0</td>
                    <td className="p-4">22.1%</td>
                    <td className="p-4">+42.5%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-23</td>
                    <td className="p-4">3</td>
                    <td className="p-4">2</td>
                    <td className="p-4">1</td>
                    <td className="p-4">0</td>
                    <td className="p-4">16.8%</td>
                    <td className="p-4">+18.2%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-24</td>
                    <td className="p-4">3</td>
                    <td className="p-4">1</td>
                    <td className="p-4">0</td>
                    <td className="p-4">2</td>
                    <td className="p-4">19.3%</td>
                    <td className="p-4">+12.1%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-25</td>
                    <td className="p-4">3</td>
                    <td className="p-4">2</td>
                    <td className="p-4">0</td>
                    <td className="p-4">1</td>
                    <td className="p-4">20.7%</td>
                    <td className="p-4">+28.9%</td>
                  </tr>
                  <tr className="border-b border-white">
                    <td className="p-4">2025-08-26</td>
                    <td className="p-4">3</td>
                    <td className="p-4">1</td>
                    <td className="p-4">1</td>
                    <td className="p-4">1</td>
                    <td className="p-4">17.4%</td>
                    <td className="p-4">+15.3%</td>
                  </tr>
                  <tr className="bg-white text-black font-bold">
                    <td className="p-4">TOTAL</td>
                    <td className="p-4">21</td>
                    <td className="p-4">12</td>
                    <td className="p-4">3</td>
                    <td className="p-4">6</td>
                    <td className="p-4">18.6%</td>
                    <td className="p-4">+150.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="border border-white p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue</h3>
            <p className="text-white">Revenue analytics coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}