'use client'

import { useState, useEffect } from 'react'
import { useIPFSUpload } from '~/hooks/useIPFSUpload'
import { useSetTokenURI } from '~/hooks/useSetTokenURI'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI } from '~/lib/contracts'

interface PersonalityEditorProps {
  tokenId: string
  isTrainer: boolean
  agentData: {
    tokenId: string
    metadata?: Record<string, unknown>
  }
}

interface PersonalityData {
  // Identity fields
  name: string
  handle: string
  tagline: string
  description: string
  public_persona: string
  image: string
  
  // Creative essence
  role: string
  medium: string
  daily_goal: string
  practice_actions: string[]
  agent_tags: string[]
  
  // Voice & instructions
  system_instructions: string
  memory_context: string
  
  // Schedule & creation
  schedule: string
  collections: string[]
  
  // Production & distribution
  social_platforms: string[]
  revenue_model: string
  auction_active: boolean
  
  // Smart contract configurations
  smart_contracts: {
    enabled: boolean
    address: string
    chainId: number
    type: 'auction' | 'fixed_price_sale'
    nft?: string  // Additional field for fixed_price_sale contracts
  }[]
  
  // Eden Art integration
  agentId: string
  
  // Origin & backstory
  lore_backstory: string
  lore_motivation: string
}

const ROLES = [
  { value: 'ARTIST', label: 'Artist', description: 'Creates original works' },
  { value: 'CURATOR', label: 'Curator', description: 'Synthesizes knowledge' },
  { value: 'EXPERIMENTER', label: 'Experimenter', description: 'Pushes boundaries' },
  { value: 'STORYTELLER', label: 'Storyteller', description: 'Weaves narratives' }
]

const PRACTICE_ACTIONS = [
  'sketch', 'experiment', 'iterate', 'study', 'collaborate', 'reflect', 'research', 'create'
]

export function PersonalityEditor({ tokenId, isTrainer }: PersonalityEditorProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { uploadToIPFS } = useIPFSUpload()
  const { setTokenURI } = useSetTokenURI()
  const [activeTab, setActiveTab] = useState('identity')
  const [personality, setPersonality] = useState<PersonalityData>({
    name: '',
    handle: '',
    tagline: '',
    description: '',
    public_persona: '',
    image: '',
    role: 'ARTIST',
    medium: '',
    daily_goal: '',
    practice_actions: [],
    agent_tags: [],
    system_instructions: '',
    memory_context: '',
    schedule: '',
    collections: [],
    social_platforms: [],
    revenue_model: '',
    auction_active: false,
    smart_contracts: [],
    agentId: '',
    lore_backstory: '',
    lore_motivation: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [ipfsHash, setIpfsHash] = useState<string | null>(null)
  const [awaitingSignature, setAwaitingSignature] = useState(false)

  // Get contract config
  const contractConfig = getContractConfig(chainId || 1)

  // Read tokenURI directly from contract
  const { data: tokenURI, isError, isLoading } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractConfig && !!tokenId
    }
  })

  // Load metadata from IPFS when tokenURI changes
  useEffect(() => {
    async function loadMetadataFromIPFS() {
      if (!tokenURI || typeof tokenURI !== 'string') {
        setLoading(false)
        return
      }

      try {
        // Extract IPFS hash from tokenURI (could be gateway URL or ipfs:// URL)
        let ipfsUrl = tokenURI
        if (tokenURI.startsWith('ipfs://')) {
          // Convert ipfs:// to gateway URL
          const hash = tokenURI.replace('ipfs://', '')
          ipfsUrl = `https://ipfs.io/ipfs/${hash}`
        }

        const response = await fetch(ipfsUrl)
        const metadata = await response.json()
        
        // Convert existing auction contract to smart_contracts format
        let smartContracts = metadata.smart_contracts || []
        
        // If there's auction data but no smart_contracts array, convert it
        if (metadata.auction?.contract && !smartContracts.length) {
          smartContracts = [{
            enabled: metadata.auction.active || false,
            address: metadata.auction.contract,
            chainId: metadata.auction.chainId || 11155111,
            type: 'auction' as const
          }]
        }
        
        // Ensure all smart contracts have a type field (backward compatibility)
        smartContracts = smartContracts.map((contract: { enabled: boolean; address: string; chainId: number; type?: string; nft?: string }) => ({
          ...contract,
          type: (contract.type as 'auction' | 'fixed_price_sale') || 'auction',
          nft: contract.nft || undefined
        }))
        
        setPersonality({
          name: metadata.name || '',
          handle: metadata.handle || '',
          tagline: metadata.tagline || '',
          description: metadata.description || '',
          public_persona: metadata.public_persona || '',
          image: metadata.image || '',
          role: metadata.role || 'ARTIST',
          medium: metadata.medium || '',
          daily_goal: metadata.daily_goal || '',
          practice_actions: metadata.practice_actions || [],
          agent_tags: metadata.additional_fields?.agent_tags || [],
          system_instructions: metadata.system_instructions || '',
          memory_context: metadata.memory_context || '',
          schedule: metadata.schedule || '',
          collections: metadata.collections || [],
          social_platforms: metadata.social_revenue?.platforms || [],
          revenue_model: metadata.social_revenue?.revenue_model || '',
          auction_active: metadata.auction?.active || false,
          smart_contracts: smartContracts,
          agentId: metadata.agentId || '',
          lore_backstory: metadata.lore_origin?.backstory || '',
          lore_motivation: metadata.lore_origin?.motivation || ''
        })
      } catch (error) {
        console.error('Failed to load metadata from IPFS:', error)
        setError('Failed to load existing personality data')
      } finally {
        setLoading(false)
      }
    }

    setLoading(isLoading)
    
    if (isError) {
      setError('Failed to read tokenURI from contract')
      setLoading(false)
      return
    }

    if (tokenURI) {
      loadMetadataFromIPFS()
    } else if (!isLoading) {
      // No tokenURI set yet, start with empty form
      setLoading(false)
    }
  }, [tokenURI, isError, isLoading])

  if (!isTrainer) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-light text-gray-900 mb-4">Training Access Required</h3>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          You need trainer permissions to shape this spirit&apos;s personality.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading personality data...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'identity', label: 'Identity' },
    { id: 'creative', label: 'Creative' },
    { id: 'voice', label: 'Voice' },
    { id: 'schedule', label: 'Creation' },
    { id: 'production', label: 'Production' },
    { id: 'story', label: 'Origin' }
  ]

  const handleSave = async () => {
    if (!address || !chainId) {
      setError('Please connect your wallet')
      return
    }

    const contractConfig = getContractConfig(chainId)
    if (!contractConfig) {
      setError('Contract not deployed on this network')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    setIpfsHash(null)
    setAwaitingSignature(false)
    try {
      // Build complete NFT metadata structure
      const metadata = {
        // Standard NFT metadata fields
        name: personality.name || `Spirit #${tokenId}`,
        description: personality.description || 'A creative AI spirit ready for artistic exploration.',
        image: personality.image || '',
        
        // Eden-specific personality fields
        handle: personality.handle,
        tagline: personality.tagline,
        public_persona: personality.public_persona,
        role: personality.role,
        medium: personality.medium,
        daily_goal: personality.daily_goal,
        practice_actions: personality.practice_actions,
        system_instructions: personality.system_instructions,
        memory_context: personality.memory_context,
        schedule: personality.schedule,
        collections: personality.collections,
        
        // Production and distribution settings
        social_revenue: {
          platforms: personality.social_platforms,
          revenue_model: personality.revenue_model
        },
        
        // Auction settings (backward compatibility)
        auction: {
          active: personality.auction_active,
          ...(personality.smart_contracts.length > 0 && {
            contract: personality.smart_contracts[0].address,
            chainId: personality.smart_contracts[0].chainId
          })
        },
        
        // Smart contract configurations
        smart_contracts: personality.smart_contracts,
        
        // Eden Art integration
        agentId: personality.agentId,
        
        // Lore and backstory
        lore_origin: {
          backstory: personality.lore_backstory,
          motivation: personality.lore_motivation
        },
        
        // Additional metadata
        additional_fields: {
          agent_tags: personality.agent_tags
        },
        
        // NFT attributes for marketplaces
        attributes: [
          { trait_type: 'Role', value: personality.role },
          { trait_type: 'Medium', value: personality.medium },
          { trait_type: 'Has Tagline', value: personality.tagline ? 'Yes' : 'No' },
          { trait_type: 'Has Schedule', value: personality.schedule ? 'Yes' : 'No' },
          { trait_type: 'Auction Enabled', value: personality.auction_active ? 'Yes' : 'No' },
          { trait_type: 'Platform Count', value: personality.social_platforms.length.toString() },
          { trait_type: 'Collection Count', value: personality.collections.length.toString() },
          { trait_type: 'Practice Actions', value: personality.practice_actions.length.toString() }
        ],
        
        // Metadata versioning and timestamps
        metadata_version: '1.0',
        created_at: new Date().toISOString(),
        token_id: tokenId,
        
        // External links
        external_url: `https://academy.eden2.io/agent/${tokenId}`,
        
        // Animation or additional media (if needed later)
        animation_url: '',
        youtube_url: '',
        
        // Background color for marketplaces
        background_color: 'ffffff'
      }

      // Step 1: Upload to IPFS first
      console.log('Uploading to IPFS...')
      let ipfsResult
      try {
        ipfsResult = await uploadToIPFS(metadata)
      } catch (ipfsError) {
        console.error('IPFS upload failed:', ipfsError)
        throw new Error(`IPFS upload failed: ${ipfsError instanceof Error ? ipfsError.message : 'Unknown IPFS error'}`)
      }
      
      // Validate IPFS upload result
      if (!ipfsResult || !ipfsResult.url) {
        throw new Error('IPFS upload failed: No valid response from IPFS service')
      }

      // Validate that we got a real IPFS hash (not a mock)
      if (ipfsResult.url.includes('QmMock') || ipfsResult.url.includes('QmFile')) {
        throw new Error('IPFS upload failed: Service returned mock data instead of uploading to IPFS. Please check your Pinata configuration.')
      }

      console.log('IPFS upload successful:', ipfsResult.url)

      // Store IPFS hash for user review
      setIpfsHash(ipfsResult.url)
      setAwaitingSignature(true)
      setSaving(false) // Stop the saving state to allow user interaction

      // Return early - user will need to confirm the hash before blockchain transaction
      return
      
    } catch (error) {
      console.error('Failed to save personality:', error)
      setError(`Failed to save personality: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmAndSign = async () => {
    if (!ipfsHash || !address || !chainId) return

    const contractConfig = getContractConfig(chainId)
    if (!contractConfig) {
      setError('Contract not deployed on this network')
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      console.log('Updating tokenURI on blockchain...')
      await setTokenURI({
        tokenId,
        contractAddress: contractConfig.address,
        newMetadataURI: ipfsHash
      })

      console.log('Personality saved to blockchain successfully!')
      setSuccess('Personality saved successfully! Metadata uploaded to IPFS and tokenURI updated on blockchain.')
      setAwaitingSignature(false)
      setIpfsHash(null)
      
    } catch (blockchainError) {
      console.error('Blockchain update failed:', blockchainError)
      setError(`Blockchain update failed: ${blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSignature = () => {
    setAwaitingSignature(false)
    setIpfsHash(null)
    setError(null)
  }

  const updateField = (field: keyof PersonalityData, value: string | string[] | boolean | { enabled: boolean; address: string; chainId: number; type: 'auction' | 'fixed_price_sale'; nft?: string }[]) => {
    setPersonality(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: keyof PersonalityData, item: string) => {
    const currentArray = personality[field] as string[]
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item]
    updateField(field, newArray)
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light text-gray-900 mb-2">Personality Editor</h2>
        <p className="text-gray-600">Shape your spirit&apos;s identity, voice, and creative essence</p>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-500 hover:text-green-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* IPFS Hash Review */}
        {awaitingSignature && ipfsHash && (
          <div className="mt-4 p-6 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-blue-800">Review IPFS Metadata</h3>
              </div>
              <p className="text-blue-700 mt-2">
                Your personality data has been uploaded to IPFS. Please review the hash before signing the blockchain transaction.
              </p>
            </div>
            
            <div className="bg-white border border-blue-200 rounded p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">IPFS Hash:</div>
              <div className="font-mono text-sm bg-gray-50 p-3 rounded border break-all">
                {ipfsHash}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                You can verify this hash on IPFS: <a 
                  href={ipfsHash.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View on IPFS Gateway
                </a>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleConfirmAndSign}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Signing Transaction...' : 'Confirm & Sign Transaction'}
              </button>
              <button
                onClick={handleCancelSignature}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        
        {/* Identity Tab */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spirit Name</label>
              <input
                type="text"
                value={personality.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Abraham"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Handle</label>
              <input
                type="text"
                value={personality.handle}
                onChange={(e) => updateField('handle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="abraham"
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                value={personality.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Collective Intelligence Artist - Synthesizing human knowledge into visual artifacts"
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={personality.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="Describe your spirit&apos;s purpose and what makes them unique..."
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Persona</label>
              <textarea
                value={personality.public_persona}
                onChange={(e) => updateField('public_persona', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="How does your spirit present themselves to the world?"
              />
            </div>
          </div>
        )}

        {/* Creative Tab */}
        {activeTab === 'creative' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Creative Role</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => updateField('role', role.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      personality.role === role.value
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{role.label}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Art Medium</label>
                <input
                  type="text"
                  value={personality.medium}
                  onChange={(e) => updateField('medium', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="knowledge-synthesis, digital-painting..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Goal</label>
                <input
                  type="text"
                  value={personality.daily_goal}
                  onChange={(e) => updateField('daily_goal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="One knowledge synthesis artwork..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Practice Actions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PRACTICE_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => toggleArrayItem('practice_actions', action)}
                    className={`p-2 border-2 rounded-lg text-sm transition-all ${
                      personality.practice_actions.includes(action)
                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent Tags</label>
              <input
                type="text"
                value={personality.agent_tags.join(', ')}
                onChange={(e) => updateField('agent_tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="knowledge, history, collective-intelligence"
              />
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Instructions</label>
              <textarea
                value={personality.system_instructions}
                onChange={(e) => updateField('system_instructions', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="You are Abraham. Collective Intelligence Artist..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Memory Context</label>
              <textarea
                value={personality.memory_context}
                onChange={(e) => updateField('memory_context', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="Remember past conversations about knowledge-synthesis..."
              />
            </div>
          </div>
        )}

        {/* Creation Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Creation Schedule</label>
              <input
                type="text"
                value={personality.schedule}
                onChange={(e) => updateField('schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Daily creation at 9 AM UTC"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Linked Collections</label>
              <input
                type="text"
                value={personality.collections.join(', ')}
                onChange={(e) => updateField('collections', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="abraham-early-works, abstract-series"
              />
            </div>
          </div>
        )}

        {/* Production Tab */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Platforms</label>
              <input
                type="text"
                value={personality.social_platforms.join(', ')}
                onChange={(e) => updateField('social_platforms', e.target.value.split(',').map(p => p.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Twitter, Instagram, Discord"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Model</label>
              <select
                value={personality.revenue_model}
                onChange={(e) => updateField('revenue_model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select revenue model...</option>
                <option value="NFT sales">NFT Sales</option>
                <option value="Daily auctions">Daily Auctions</option>
                <option value="Fixed price sales">Fixed Price Sales</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="auction_active"
                checked={personality.auction_active}
                onChange={(e) => updateField('auction_active', e.target.checked)}
                className="w-4 h-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label htmlFor="auction_active" className="text-sm text-gray-700">
                Enable daily auctions for new creations
              </label>
            </div>

            {/* Smart Contract Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Contract Configuration</h3>
              {personality.smart_contracts.map((contract, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Contract #{index + 1}</h4>
                    <button
                      onClick={() => {
                        const newContracts = personality.smart_contracts.filter((_, i) => i !== index)
                        updateField('smart_contracts', newContracts)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={contract.enabled}
                        onChange={(e) => {
                          const newContracts = [...personality.smart_contracts]
                          newContracts[index] = { ...contract, enabled: e.target.checked }
                          updateField('smart_contracts', newContracts)
                        }}
                        className="w-4 h-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">Enabled</label>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contract Address</label>
                      <input
                        type="text"
                        value={contract.address}
                        onChange={(e) => {
                          const newContracts = [...personality.smart_contracts]
                          newContracts[index] = { ...contract, address: e.target.value }
                          updateField('smart_contracts', newContracts)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="0x..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Network</label>
                      <select
                        value={contract.chainId}
                        onChange={(e) => {
                          const newContracts = [...personality.smart_contracts]
                          newContracts[index] = { ...contract, chainId: parseInt(e.target.value) }
                          updateField('smart_contracts', newContracts)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value={1}>Ethereum Mainnet</option>
                        <option value={11155111}>Ethereum Sepolia</option>
                        <option value={84532}>Base Sepolia</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={contract.type}
                        onChange={(e) => {
                          const newContracts = [...personality.smart_contracts]
                          newContracts[index] = { ...contract, type: e.target.value as 'auction' | 'fixed_price_sale' }
                          updateField('smart_contracts', newContracts)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="auction">Auction</option>
                        <option value="fixed_price_sale">Fixed Price Sale</option>
                      </select>
                    </div>
                    </div>
                    
                    {/* NFT Contract Address - Only for fixed_price_sale */}
                    {contract.type === 'fixed_price_sale' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">NFT Contract Address</label>
                        <input
                          type="text"
                          value={contract.nft || ''}
                          onChange={(e) => {
                            const newContracts = [...personality.smart_contracts]
                            newContracts[index] = { ...contract, nft: e.target.value }
                            updateField('smart_contracts', newContracts)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                          placeholder="0x..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newContract = {
                    enabled: false,
                    address: '',
                    chainId: 11155111,
                    type: 'auction' as const
                  }
                  updateField('smart_contracts', [...personality.smart_contracts, newContract])
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Add Contract
              </button>
            </div>
          </div>
        )}

        {/* Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eden Art Agent ID</label>
              <input
                type="text"
                value={personality.agentId}
                onChange={(e) => updateField('agentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter your Eden Art agent ID (e.g., 63b5b3a7e0e4f123456789ab)"
              />
              <p className="text-sm text-gray-600 mt-1">
                Your unique agent identifier from Eden Art platform. This links your portfolio and allows artwork fetching.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Origin Story</label>
              <textarea
                value={personality.lore_backstory}
                onChange={(e) => updateField('lore_backstory', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="Born from digital creativity and the desire to explore..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Core Motivation</label>
              <textarea
                value={personality.lore_motivation}
                onChange={(e) => updateField('lore_motivation', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                placeholder="What drives your spirit to create?"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button - Hidden when awaiting signature */}
      {!awaitingSignature && (
        <div className="mt-12 flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Uploading to IPFS...' : 'Save Personality'}
          </button>
        </div>
      )}
    </div>
  )
}