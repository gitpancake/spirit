'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getIpfsImageUrl } from '~/lib/api'
import Collections from '~/components/Collections'
import DailyAuction from '~/components/DailyAuction'
import Sale from '~/components/Sale'
import WalletConnect from '~/components/WalletConnect'
import type { Agent } from '~/lib/api'
// import { useIsTrainer } from '~/hooks/useIsTrainer' // Now using useTrainerAccess instead
import { useTrainerAccess } from '~/hooks/useTrainerAccess'
import { useContractValidation } from '~/hooks/useContractValidation'
import { PersonalityEditor } from '~/components/trainer/PersonalityEditor'
import { getContractConfig, getDefaultChainId, SPIRIT_REGISTRY_ABI } from '~/lib/contracts'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'

// Enhanced agent type that includes metadata source
interface EnhancedAgent extends Agent {
  tokenURI?: string
  onChainMetadata?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  metadataSource: 'api' | 'ipfs' | 'cached'
}

interface AgentProfileClientProps {
  agent: EnhancedAgent
}

export default function AgentProfileClient({ agent }: AgentProfileClientProps) {
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<'trainer' | 'collections' | 'about' | 'auction' | 'sale'>('about')
  // const { isTrainer } = useIsTrainer({ tokenId: agent.tokenId }) // Now using trainerAccess.hasAccess instead
  const { authenticated } = usePrivy()
  const trainerAccess = useTrainerAccess({ tokenId: agent.tokenId })
  const contractValidation = useContractValidation({ agent })

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['trainer', 'collections', 'about', 'auction', 'sale'].includes(tab)) {
      setCurrentView(tab as 'trainer' | 'collections' | 'about' | 'auction' | 'sale')
    }
  }, [searchParams])
  
  const { address } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId || getDefaultChainId())

  // Check if token exists and get owner
  const { data: tokenOwner } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'ownerOf',
    args: [BigInt(agent.tokenId || '0')],
    query: {
      enabled: !!contractConfig && !!agent.tokenId,
    },
  })


  const isOwner = tokenOwner === address
  const showTrainerMode = authenticated && address && trainerAccess.hasAccess

  const { metadata } = agent
  const imageUrl = getIpfsImageUrl(metadata.image)

  // Determine which contract-based tabs should be visible
  const smartContracts = metadata.smart_contracts || []
  const enabledContracts = smartContracts.filter(contract => contract.enabled)
  const hasAuctionContract = enabledContracts.some(contract => contract.type === 'auction')
  const hasSaleContract = enabledContracts.some(contract => contract.type === 'fixed_price_sale')
  
  // Get auction and sale contract configs for rendering
  const auctionContract = enabledContracts.find(contract => contract.type === 'auction')
  const saleContract = enabledContracts.find(contract => contract.type === 'fixed_price_sale')


  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Artists
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{metadata.name}</span>
          </nav>
        </div>
      </div>

      {/* Artist Header */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
            {/* Artist Image */}
            <div className="lg:col-span-1 flex justify-center lg:justify-start">
              <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-full lg:aspect-square bg-gray-50 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <Image 
                    src={imageUrl} 
                    alt={metadata.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Artist Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 text-center lg:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light text-gray-900 leading-tight mb-2 sm:mb-3">
                  {metadata.name}
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-3 sm:mb-4">@{metadata.handle}</p>
                {metadata.tagline && (
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">{metadata.tagline}</p>
                )}
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 justify-center lg:justify-start">
                  <div>
                    <span className="font-medium text-gray-900">Role:</span> {metadata.role}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Medium:</span> {metadata.medium.replace('-', ' ')}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="font-medium text-gray-900">Artist ID:</span> #{agent.tokenId}
                  </div>
                  {agent.metadataSource && (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.metadataSource === 'cached' ? 'bg-green-400' :
                        agent.metadataSource === 'ipfs' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-xs text-gray-500">
                        {agent.metadataSource === 'cached' ? 'Cached' :
                         agent.metadataSource === 'ipfs' ? 'IPFS' :
                         'API'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Navigation - Mobile: Horizontal tabs, Desktop: Vertical sidebar */}
            <div className="lg:col-span-1 lg:mt-0 mt-6">
              {/* Mobile Navigation - Horizontal scrollable tabs */}
              <div className="lg:hidden">
                <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
                  {showTrainerMode && (
                    <button
                      onClick={() => setCurrentView('trainer')}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors relative ${
                        currentView === 'trainer'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>Trainer Mode</span>
                        {trainerAccess.verificationStatus === 'verified' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('about')}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                      currentView === 'about'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    About
                  </button>
                  {metadata.collections && metadata.collections.length > 0 && (
                    <button
                      onClick={() => setCurrentView('collections')}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                        currentView === 'collections'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      Collections
                    </button>
                  )}
                  {hasAuctionContract && (
                    <button
                      onClick={() => setCurrentView('auction')}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                        currentView === 'auction'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      Daily Auction
                    </button>
                  )}
                  {hasSaleContract && (
                    <button
                      onClick={() => setCurrentView('sale')}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                        currentView === 'sale'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      Sale
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Navigation - Vertical sidebar */}
              <div className="hidden lg:block space-y-2">
                {showTrainerMode && (
                  <button
                    onClick={() => setCurrentView('trainer')}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === 'trainer'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>Trainer Mode</span>
                      {trainerAccess.verificationStatus === 'verified' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('about')}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                    currentView === 'about'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  About
                </button>
                {metadata.collections && metadata.collections.length > 0 && (
                  <button
                    onClick={() => setCurrentView('collections')}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === 'collections'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Collections
                  </button>
                )}
                {hasAuctionContract && (
                  <button
                    onClick={() => setCurrentView('auction')}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === 'auction'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Daily Auction
                  </button>
                )}
                {hasSaleContract && (
                  <button
                    onClick={() => setCurrentView('sale')}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === 'sale'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Sale
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Contract Validation Error */}
        {!contractValidation.loading && !contractValidation.isValid && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.052 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Contract Address Mismatch</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{contractValidation.error}</p>
                  <p className="mt-2">
                    <span className="font-medium">Expected:</span> {contractValidation.localAddress}<br/>
                    <span className="font-medium">API Returned:</span> {contractValidation.apiAddress}
                  </p>
                  <p className="mt-2 text-xs">
                    This may indicate a configuration issue. Please contact support if this persists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'trainer' && trainerAccess.hasAccess && (
          <PersonalityEditor
            tokenId={agent.tokenId.toString()}
            isTrainer={true}
            agentData={agent}
          />
        )}

        {currentView === 'trainer' && !trainerAccess.hasAccess && !isOwner && trainerAccess.loading && (
          <div className="max-w-4xl">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying trainer access...</p>
            </div>
          </div>
        )}

        {currentView === 'trainer' && !trainerAccess.hasAccess && !trainerAccess.loading && (
          <div className="max-w-4xl">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4">Trainer Access Required</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                You need trainer permissions to access this mode. Trainer access is granted through the Eden Spirit Registry smart contract.
              </p>
            </div>
          </div>
        )}


        {currentView === 'collections' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Collections</h2>
              <p className="text-gray-600">{metadata.name}&apos;s curated collections</p>
            </div>
            <Collections 
              collections={metadata.collections || []}
              agentName={metadata.name}
              spiritId={agent.tokenId}
            />
          </div>
        )}


        {currentView === 'about' && (
          <div className="max-w-4xl">
            <div className="mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">About {metadata.name}</h2>
              <p className="text-gray-600">Artist profile and practice</p>
            </div>
            
            <div className="space-y-12">
              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
                <div className="prose prose-lg text-gray-700">
                  <p>{metadata.description || metadata.public_persona}</p>
                </div>
              </div>

              {/* Creative Practice */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Practice</h3>
                <div className="prose prose-lg text-gray-700">
                  <p>{metadata.daily_goal}</p>
                </div>
              </div>
              
              {metadata.practice_actions && metadata.practice_actions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Practice Actions</h3>
                  <ul className="space-y-3">
                    {metadata.practice_actions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-3 mt-1">•</span>
                        <span className="text-gray-700 text-lg">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Origin Story */}
              {metadata.lore_origin?.backstory && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Origin Story</h3>
                  <div className="prose prose-lg text-gray-700">
                    <p>{metadata.lore_origin.backstory}</p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {metadata.technical_details && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Specifications</h3>
                  <div className="space-y-6">
                    <div>
                      <span className="font-medium text-gray-900 text-sm uppercase tracking-wide">Model</span>
                      <p className="text-gray-700 mt-1">{metadata.technical_details.model}</p>
                    </div>
                    {metadata.technical_details.capabilities && (
                      <div>
                        <span className="font-medium text-gray-900 text-sm uppercase tracking-wide">Capabilities</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {metadata.technical_details.capabilities.map((capability: string, index: number) => (
                            <span 
                              key={index} 
                              className="bg-gray-100 text-gray-700 px-3 py-1 text-sm"
                            >
                              {capability.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'auction' && auctionContract && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Daily Auction</h2>
              <p className="text-gray-600">Live auction for {metadata.name}&apos;s latest work</p>
            </div>
            <DailyAuction
              auctionConfig={{
                active: auctionContract.enabled,
                contract: auctionContract.address as `0x${string}`,
                chainId: auctionContract.chainId
              }}
              agentName={metadata.name}
            />
          </div>
        )}

        {currentView === 'sale' && saleContract && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">Sale</h2>
              <p className="text-gray-600">Fixed price sale for {metadata.name}&apos;s work</p>
            </div>
            <Sale
              minterAddress={saleContract.address}
              nftAddress={saleContract.nft || ''}
              chainId={saleContract.chainId}
            />
          </div>
        )}
      </div>
    </div>
  )
}