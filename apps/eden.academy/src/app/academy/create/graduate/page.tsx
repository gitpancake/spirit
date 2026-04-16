'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '~/hooks/useAuth'
import { useContractAddress } from '~/hooks/useContractAddress'
import { useToastContext } from '~/components/ToastProvider'
import { 
  PresetType, 
  PRESET_CONFIGS, 
  GraduationMode,
  SpiritDraft, 
  loadSpiritDraft, 
  saveSpiritDraft,
  OUTPUT_KIND_CONFIGS,
  CADENCE_CONFIGS
} from '~/lib/spirits'

const GRADUATION_MODES = {
  ID_ONLY: {
    title: 'Identity Only',
    description: 'Create on-chain identity and anchor practice covenant',
    features: ['Spirit Registry NFT', 'Practice covenant on IPFS', 'Basic on-chain identity'],
    cost: 'Low gas cost',
    recommended: true
  },
  ID_PLUS_TOKEN: {
    title: 'Identity + Token',  
    description: 'Create identity plus custom ERC-20 token',
    features: ['Everything in Identity Only', 'Custom ERC-20 token', 'Token-based economics'],
    cost: 'Medium gas cost',
    recommended: false
  },
  FULL_STACK: {
    title: 'Full Sovereign Stack',
    description: 'Complete autonomous agent infrastructure',
    features: ['Everything above', 'Smart wallet deployment', 'Advanced automation', 'Treasury management'],
    cost: 'High gas cost',
    recommended: false
  }
} as const

function GraduatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authenticated, user } = useAuth()
  const { contractAddress } = useContractAddress()
  const toast = useToastContext()
  
  const [preset] = useState<PresetType>(searchParams.get('preset') as PresetType || 'CREATOR')
  const [mode] = useState(searchParams.get('mode') || 'guided')
  const [draft, setDraft] = useState<SpiritDraft | null>(null)
  
  const [graduationMode, setGraduationMode] = useState<GraduationMode>('ID_ONLY')
  const [isGraduating, setIsGraduating] = useState(false)
  const [error, setError] = useState<string>('')
  const [deploymentStep, setDeploymentStep] = useState<string>('')

  // Load draft on mount
  useEffect(() => {
    const existingDraft = loadSpiritDraft()
    if (existingDraft && existingDraft.practice) {
      setDraft(existingDraft)
    } else {
      router.push('/academy/create/practice')
    }
  }, [router])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authenticated) {
      router.push('/academy')
    }
  }, [authenticated, router])

  const pinCovenantToIPFS = async (draft: SpiritDraft): Promise<string> => {
    if (!draft.practice) throw new Error('No practice configuration found')

    const covenant = {
      spirit_id: crypto.randomUUID(),
      type: draft.practice.type,
      cadence: draft.practice.cadence,
      time_utc: draft.practice.time_utc,
      rest_day: draft.practice.rest_day,
      quantity: draft.practice.quantity,
      output_kind: draft.practice.output_kind,
      config_json: draft.practice.config_json,
      version: '1.0.0',
      created_at: new Date().toISOString(),
      identity: draft.identity
    }

    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(covenant)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to pin covenant: ${error}`)
    }

    const result = await response.json()
    return result.cid
  }

  const handleGraduation = async () => {
    if (!draft || !authenticated || !user || !draft.practice) {
      setError('Authentication required for graduation')
      return
    }

    setIsGraduating(true)
    setError('')

    try {
      // Step 1: Create agent on Eden API
      setDeploymentStep('Creating agent on Eden...')
      console.log('Starting graduation process for:', draft.identity.name)
      
      const outputConfig = OUTPUT_KIND_CONFIGS[draft.practice.output_kind]
      const cadenceConfig = CADENCE_CONFIGS[draft.practice.cadence]
      const presetConfig = PRESET_CONFIGS[preset]
      
      // Build agent description from spirit configuration
      const description = `${draft.identity.tagline}\n\nA ${presetConfig.title.toLowerCase()} spirit practicing ${outputConfig.title.toLowerCase()} creation on a ${cadenceConfig.title.toLowerCase()} schedule. Created through Eden Academy.`
      
      // Build persona from practice configuration
      let persona = `You are ${draft.identity.name}, a ${presetConfig.title.toLowerCase()} spirit created through Eden Academy. Your mission is to explore and create through ${outputConfig.title.toLowerCase()}.`
      
      if (draft.practice?.config_json.prompt) {
        persona += `\n\nYour creative focus: ${draft.practice.config_json.prompt as string}`
      }
      if (draft.practice?.config_json.style) {
        persona += `\n\nYour artistic style: ${draft.practice.config_json.style as string}`
      }
      if (draft.practice?.config_json.topic) {
        persona += `\n\nYour area of expertise: ${draft.practice.config_json.topic as string}`
      }

      const agentPayload = {
        name: draft.identity.name,
        key: draft.identity.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_v1',
        description: description,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(draft.identity.name)}`,
        persona: persona,
        isPersonaPublic: true,
        greeting: `Hello! I'm ${draft.identity.name}. ${draft.identity.tagline}`,
        tools: {
          image_generation: draft.practice?.output_kind === 'IMAGE',
          text_generation: draft.practice?.output_kind === 'TEXT',
          audio_generation: draft.practice?.output_kind === 'AUDIO'
        },
        llm_settings: {
          model_profile: 'medium',
          thinking_policy: 'auto',
          thinking_effort_cap: 'medium',
          thinking_effort_instructions: 'Think carefully about creative composition and artistic expression'
        }
      }

      console.log('Creating agent with payload:', agentPayload)

      const agentResponse = await fetch('/api/eden/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentPayload)
      })

      console.log('Full agent response:', agentResponse)
      console.log('Response headers:', [...agentResponse.headers.entries()])

      console.log('Agent response status:', agentResponse.status)
      
      if (!agentResponse.ok) {
        const errorText = await agentResponse.text()
        console.error('Agent creation failed:', agentResponse.status, errorText)
        throw new Error(`Failed to create agent on Eden: ${agentResponse.status} ${errorText}`)
      }

      const agentResult = await agentResponse.json()
      console.log('Agent creation result:', agentResult)
      
      if (!agentResult.success) {
        throw new Error(agentResult.error || 'Failed to create agent')
      }

      // Step 2: Create practice trigger
      setDeploymentStep('Setting up practice schedule...')
      
      // Convert practice config to cron schedule
      const practice = draft.practice
      const practiceTime = practice.time_utc
      const [hours, minutes] = practiceTime.split(':').map(Number)
      
      let cronSchedule = `${minutes} ${hours} * * *` // Daily by default
      if (practice.cadence === 'DAILY_6_1' && practice.rest_day !== undefined) {
        // Daily except rest day
        const activeDays = [0,1,2,3,4,5,6].filter(day => day !== practice.rest_day)
        cronSchedule = `${minutes} ${hours} * * ${activeDays.join(',')}`
      } else if (practice.cadence === 'WEEKLY' && practice.rest_day !== undefined) {
        // Once per week on specified day
        cronSchedule = `${minutes} ${hours} * * ${practice.rest_day}`
      }
      
      // Build practice instruction
      let instruction = `Create ${practice.quantity} ${outputConfig.title.toLowerCase()}`
      
      if (practice.config_json.prompt) {
        instruction += ` based on the prompt: "${practice.config_json.prompt as string}"`
      }
      if (practice.config_json.style) {
        instruction += ` in ${practice.config_json.style as string} style`
      }
      if (practice.config_json.topic) {
        instruction += ` focusing on ${practice.config_json.topic as string}`
      }

      const triggerResponse = await fetch(`/api/eden/agents/${agentResult.data.agentId}/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction,
          session_type: 'creation',
          schedule: cronSchedule,
          session: {
            tool: practice.output_kind === 'IMAGE' ? 'image_generation' : 'text_generation',
            style: practice.config_json.style as string || 'creative',
            mood: 'inspirational',
            quantity: practice.quantity
          },
          posting_instructions: 'Share your creative work and process with the community'
        })
      })

      if (!triggerResponse.ok) {
        throw new Error('Failed to create practice trigger')
      }

      const triggerResult = await triggerResponse.json()
      
      if (!triggerResult.success) {
        throw new Error(triggerResult.error || 'Failed to create practice trigger')
      }

      // Step 3: Pin practice covenant to IPFS for record keeping
      setDeploymentStep('Anchoring practice covenant...')
      const covenantCid = await pinCovenantToIPFS(draft)

      // Step 4: Update draft with references
      const graduatedDraft: SpiritDraft = {
        ...draft,
        id: agentResult.data.agentId, // Use Eden agent ID
        status: 'GRADUATED'
      }

      // Save final state
      saveSpiritDraft(graduatedDraft)

      setDeploymentStep('Graduation complete!')
      
      // Show success toast
      toast.success('Spirit graduated successfully!', {
        message: `${draft.identity.name} is now active on Eden.art with automated practice sessions.`
      })
      
      // Navigate to success page with results
      router.push(`/academy/create/success?agentId=${agentResult.data.agentId}&triggerId=${triggerResult.data.triggerId}&covenant=${covenantCid}`)

    } catch (error) {
      console.error('Graduation error:', error)
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      setDeploymentStep('')
      
      toast.error('Graduation failed', {
        message: errorMessage
      })
    } finally {
      setIsGraduating(false)
    }
  }

  const handleApiError = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    switch (errorMessage) {
      case 'Missing required fields: name, key, description, image':
        return 'Please fill in all required agent information'
      case 'Missing required fields: instruction, session_type':
        return 'Please provide trigger instruction and session type'
      case 'Agent not found':
        return 'The specified agent does not exist'
      case 'User not authorized to create triggers for this agent':
        return 'You do not have permission to create triggers for this agent'
      case 'Eden API not configured':
        return 'Service temporarily unavailable. Please try again later.'
      default:
        return `Setup failed: ${errorMessage}`
    }
  }

  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-6">Please connect your wallet to graduate your spirit.</p>
        <Link href="/academy" className="text-blue-600 hover:text-blue-800">
          Return to Academy
        </Link>
      </div>
    )
  }

  if (!draft) return null

  const config = PRESET_CONFIGS[preset]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Step 5 of 6</span>
          <Link href={`/academy/create/preview?preset=${preset}&mode=${mode}`} className="hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full" style={{ width: '83.33%' }}></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-4">
          Graduate {draft.identity.name}
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Deploy your spirit on-chain to create their sovereign identity and enable autonomous practice.
          Choose your deployment level based on your needs and budget.
        </p>
      </div>

      {/* User info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              <strong>Deploying to:</strong> {user?.wallet?.address || 'Connected Wallet'}
            </p>
            <p className="text-sm text-blue-600">
              Contract: {contractAddress || 'Spirit Registry'}
            </p>
          </div>
        </div>
      </div>

      {/* Graduation modes */}
      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-6">Choose Deployment Level</h2>
        
        {(Object.keys(GRADUATION_MODES) as GraduationMode[]).map((modeKey) => {
          const modeConfig = GRADUATION_MODES[modeKey]
          const isSelected = graduationMode === modeKey
          const isRecommended = modeConfig.recommended

          return (
            <div
              key={modeKey}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'border-gray-900 bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGraduationMode(modeKey)}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-4">
                  <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{modeConfig.title}</h3>
                  <p className="text-gray-600 mb-4">{modeConfig.description}</p>
                  
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    {modeConfig.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <p className="text-sm font-medium text-gray-500">{modeConfig.cost}</p>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'border-gray-900 bg-gray-900' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Deployment preview */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="font-light text-gray-900 mb-4">Graduation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Spirit Name:</span>
            <span className="ml-2 font-light text-gray-900">{draft.identity.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-light text-gray-900">{config.title}</span>
          </div>
          <div>
            <span className="text-gray-600">Practice:</span>
            <span className="ml-2 font-light text-gray-900">{draft.practice ? CADENCE_CONFIGS[draft.practice.cadence].title : 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-600">Mode:</span>
            <span className="ml-2 font-light text-gray-900">{GRADUATION_MODES[graduationMode].title}</span>
          </div>
        </div>
      </div>

      {/* Deployment status */}
      {isGraduating && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-medium text-blue-900">Graduating Spirit...</p>
              <p className="text-sm text-blue-700">{deploymentStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <Link 
          href={`/academy/create/preview?preset=${preset}&mode=${mode}`}
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Preview
        </Link>
        
        <button
          onClick={() => {
            console.log('Graduate button clicked!')
            handleGraduation()
          }}
          disabled={isGraduating}
          className={`px-8 py-4 text-lg font-medium rounded-lg transition-colors ${
            isGraduating
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isGraduating ? 'Graduating...' : `Graduate ${draft.identity.name} →`}
        </button>
      </div>

      {/* Terms */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          By graduating your spirit, you agree to deploy it as an autonomous agent on the blockchain. 
          This creates permanent on-chain records that cannot be deleted. Gas fees apply for all transactions.
        </p>
      </div>
    </div>
  )
}

export default function GraduatePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto text-center py-12"><div className="animate-pulse"><div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div></div></div>}>
      <GraduatePageContent />
    </Suspense>
  )
}