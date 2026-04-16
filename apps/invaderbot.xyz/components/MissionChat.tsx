'use client'

import { useState, useRef, useEffect } from 'react'
import NFTPurchaseButton from './NFTPurchaseButton'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  nftMetadata?: any
}

interface NFTMetadata {
  nft: {
    name: string
    description: string
    image_url: string
    contract_address: string
    token_id: string
    chain: string
    opensea_url: string
    traits: Array<{ trait_type: string; value: any }>
    is_nsfw: boolean
    token_standard: string
  }
  collection?: {
    name: string
    description: string
    image_url: string
    opensea_url: string
    twitter_username?: string
    discord_url?: string
    category: string
  }
}

export default function MissionChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation: messages.map(msg => ({ role: msg.role, content: msg.content }))
        })
      })

      const result = await response.json()

      if (result.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.data.message,
          timestamp: new Date().toISOString(),
          nftMetadata: result.data.nftMetadata
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `ERROR :: ${result.error || 'TRANSMISSION_FAILED'}`,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'TRANSMISSION_INTERRUPTED :: Connection to mission control lost',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // Check if message contains a BUY recommendation
  const containsBuyRecommendation = (content: string): boolean => {
    const buyPatterns = [
      /RECOMMENDATION:\s*BUY/i,
      /RECOMMENDATION:\s*\*\*BUY\*\*/i,
      /recommend.*BUY/i,
      /suggests.*BUY/i,
      /analysis.*BUY/i
    ]
    return buyPatterns.some(pattern => pattern.test(content))
  }

  // NFT Display Component
  const NFTDisplay = ({ metadata, showBuyButton = false }: { metadata: NFTMetadata, showBuyButton?: boolean }) => (
    <div style={{ 
      border: '1px dashed #00ff00',
      padding: '10px',
      margin: '10px 0',
      background: '#001100'
    }}>
      <div style={{ 
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-start'
      }}>
        <div style={{ 
          flex: '0 0 100px',
          border: '1px solid #00ff00',
          background: metadata.nft.image_url ? 'transparent' : '#111'
        }}>
          {metadata.nft.image_url ? (
            <img
              src={metadata.nft.image_url}
              alt={metadata.nft.name}
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                filter: 'contrast(1.1) brightness(0.9) sepia(0.2) hue-rotate(90deg)'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '8px',
              textAlign: 'center',
              padding: '5px'
            }}>
              [IMAGE_UNAVAILABLE]<br />
              API_KEY_REQUIRED
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            color: '#00ff00',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>
            {metadata.nft.name}
          </div>
          <div style={{ 
            color: '#888',
            fontSize: '9px',
            marginBottom: '8px'
          }}>
            {metadata.collection?.name} | {metadata.nft.chain.toUpperCase()} | {metadata.nft.token_standard}
          </div>
          <div style={{ 
            color: '#666',
            fontSize: '8px',
            marginBottom: '8px'
          }}>
            {metadata.nft.description?.substring(0, 100)}
            {metadata.nft.description?.length > 100 ? '...' : ''}
          </div>
          <div style={{ 
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {metadata.nft.traits?.slice(0, 3).map((trait: any, index: number) => (
              <div key={index} style={{ 
                fontSize: '7px',
                color: '#555',
                border: '1px solid #333',
                padding: '2px 4px',
                background: '#111'
              }}>
                {trait.trait_type}: {trait.value}
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '8px',
            fontSize: '8px'
          }}>
            <a 
              href={metadata.nft.opensea_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#00ff00',
                textDecoration: 'none',
                border: '1px solid #00ff00',
                padding: '2px 6px',
                display: 'inline-block'
              }}
            >
              [VIEW_ON_OPENSEA]
            </a>
          </div>
        </div>
      </div>
      
      {/* Show purchase button if INVADERBOT recommends BUY */}
      {showBuyButton && (
        <NFTPurchaseButton
          contractAddress={metadata.nft.contract_address}
          tokenId={metadata.nft.token_id}
          nftName={metadata.nft.name}
          onPurchaseStart={() => {
            console.log('Purchase started for NFT:', metadata.nft.name)
          }}
          onPurchaseComplete={(txHash) => {
            console.log('Purchase completed:', txHash)
            // You could add a success message to the chat here
          }}
          onPurchaseError={(error) => {
            console.error('Purchase failed:', error)
            // You could add an error message to the chat here
          }}
        />
      )}
    </div>
  )

  if (!isExpanded) {
    return (
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        border: '1px dashed #00ff00',
        background: '#000',
        cursor: 'pointer'
      }} onClick={handleExpand}>
        <div style={{ 
          color: '#00ff00', 
          fontSize: '11px', 
          textAlign: 'center' 
        }}>
          [INITIATE_DIRECT_COMMUNICATION_WITH_INVADERBOT] ►
        </div>
        <div style={{ 
          color: '#666', 
          fontSize: '9px', 
          textAlign: 'center',
          marginTop: '5px'
        }}>
          MISSION_CONTROL_CHANNEL :: AVAILABLE
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      marginTop: '15px',
      border: '1px solid #00ff00',
      background: '#001100'
    }}>
      {/* Chat Header */}
      <div style={{ 
        padding: '10px',
        borderBottom: '1px solid #00ff00',
        background: '#000'
      }}>
        <div style={{ 
          color: '#00ff00', 
          fontSize: '11px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>[MISSION_CONTROL_CHANNEL]</span>
          <button 
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'none',
              border: '1px solid #00ff00',
              color: '#00ff00',
              fontSize: '8px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            [MINIMIZE]
          </button>
        </div>
        <div style={{ color: '#666', fontSize: '9px', marginTop: '3px' }}>
          STATUS :: ONLINE :: NEURAL_NETWORKS_ACTIVE
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        height: '300px',
        overflowY: 'auto',
        padding: '10px',
        fontSize: '10px',
        lineHeight: '1.4'
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>
            &gt;&gt;&gt; AWAITING_TRANSMISSION...<br />
            Type a message to establish communication with INVADERBOT
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            marginBottom: '15px',
            padding: '8px',
            border: `1px solid ${msg.role === 'user' ? '#666' : '#00ff00'}`,
            background: msg.role === 'user' ? '#111' : '#002200'
          }}>
            <div style={{ 
              color: msg.role === 'user' ? '#888' : '#00ff00',
              fontSize: '8px',
              marginBottom: '5px'
            }}>
              [{msg.role === 'user' ? 'HUMAN_OPERATOR' : 'INVADERBOT'}] :: {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div style={{ color: msg.role === 'user' ? '#ccc' : '#00ff00' }}>
              {msg.content}
            </div>
            {msg.nftMetadata && (
              <NFTDisplay 
                metadata={msg.nftMetadata} 
                showBuyButton={msg.role === 'assistant' && containsBuyRecommendation(msg.content)}
              />
            )}
          </div>
        ))}
        
        {isLoading && (
          <div style={{ 
            color: '#666',
            fontSize: '10px',
            textAlign: 'center',
            padding: '10px'
          }}>
            &gt;&gt;&gt; PROCESSING_TRANSMISSION...
            <span style={{ animation: 'blink 1s infinite' }}>█</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        padding: '10px',
        borderTop: '1px solid #00ff00',
        background: '#000'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to INVADERBOT..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: '#111',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '8px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              background: inputMessage.trim() && !isLoading ? '#00ff00' : '#333',
              color: inputMessage.trim() && !isLoading ? '#000' : '#666',
              border: '1px solid #00ff00',
              padding: '8px 12px',
              fontSize: '9px',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontFamily: 'monospace'
            }}
          >
            [TRANSMIT]
          </button>
        </div>
        <div style={{ 
          color: '#666', 
          fontSize: '8px', 
          marginTop: '5px',
          textAlign: 'center'
        }}>
          ENTER to send :: Direct neural link to INVADERBOT established
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        input::placeholder {
          color: #444;
        }
        
        input:focus {
          outline: none;
          box-shadow: 0 0 5px #00ff00;
        }
      `}</style>
    </div>
  )
}