'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { PresetType, PRESET_CONFIGS, SpiritDraft, saveSpiritDraft } from '~/lib/spirits'
import { useToastContext } from '~/components/ToastProvider'

export default function SelectPresetPage() {
  const router = useRouter()
  const toast = useToastContext()
  const { address } = useAccount()
  const { login, authenticated } = usePrivy()
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null)
  const [mode, setMode] = useState<'quick' | 'guided'>('guided')
  const [generating, setGenerating] = useState(false)

  const handleContinue = async () => {
    if (!selectedPreset) return
    
    // Check if wallet is connected
    if (!authenticated || !address) {
      toast.warning('Connect wallet to continue', {
        message: 'You need to connect your wallet to create a spirit.'
      })
      return
    }

    if (mode === 'quick') {
      // Generate AI-powered quick start
      setGenerating(true)
      
      try {
        const response = await fetch('/api/v1/spirits/generate-quick-start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preset: selectedPreset
          })
        })

        const result = await response.json()

        if (result.success) {
          // Create draft with AI-generated data
          const draft: SpiritDraft = {
            identity: result.data.spirit.identity,
            practice: result.data.spirit.practice,
            integrations: PRESET_CONFIGS[selectedPreset].defaultSkills,
            status: 'DRAFT',
            created_at: new Date().toISOString()
          }

          // Save to localStorage
          saveSpiritDraft(draft)

          // Show success toast
          toast.success('Spirit generated successfully!', {
            message: `Meet ${result.data.spirit.identity.name} - ready for review.`
          })

          // Skip to preview page since everything is pre-filled
          router.push(`/academy/create/preview?preset=${selectedPreset}&mode=${mode}`)
        } else {
          throw new Error(result.error || 'Failed to generate spirit')
        }
      } catch (error) {
        console.error('Quick start generation failed:', error)
        // Show toast and fallback to guided mode
        toast.warning('Quick start failed. Switching to guided mode.', {
          message: 'We\'ll walk you through the setup step by step.'
        })
        handleGuidedMode()
      } finally {
        setGenerating(false)
      }
    } else {
      handleGuidedMode()
    }
  }

  const handleGuidedMode = () => {
    // Initialize empty draft for guided mode
    const draft: SpiritDraft = {
      identity: {
        name: '',
        tagline: '',
      },
      status: 'DRAFT',
      created_at: new Date().toISOString()
    }

    // Save to localStorage
    saveSpiritDraft(draft)

    // Navigate to identity page with preset context
    router.push(`/academy/create/identity?preset=${selectedPreset}&mode=${mode}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Step 1 of 6</span>
          <Link href="/academy" className="hover:text-gray-900 transition-colors">
            ← Back to Academy
          </Link>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full" style={{ width: '16.67%' }}></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
          Choose Your Path
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Select the type of AI spirit you want to create. Each path comes with specialized 
          tools and practice patterns designed for different creative disciplines.
        </p>
      </div>

      {/* Mode selector */}
      <div className="mb-12 text-center">
        <div className="inline-flex bg-gray-50 rounded-lg p-1">
          {(['quick', 'guided'] as const).map((modeOption) => (
            <button
              key={modeOption}
              onClick={() => setMode(modeOption)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === modeOption
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {modeOption === 'quick' && 'Quick Start'}
              {modeOption === 'guided' && 'Guided Setup'}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          {mode === 'quick' 
            ? 'AI-generated spirit with smart defaults based on your chosen path'
            : 'Step-by-step setup with full customization control'
          }
        </p>
      </div>

      {/* Preset options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {(Object.keys(PRESET_CONFIGS) as PresetType[]).map((preset) => {
          const config = PRESET_CONFIGS[preset]
          const isSelected = selectedPreset === preset

          return (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={`text-left p-8 border-2 rounded-lg transition-all hover:border-gray-300 ${
                isSelected 
                  ? 'border-gray-900 bg-gray-50' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-4xl mb-4">{config.icon}</div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">{config.title}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{config.description}</p>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Example Practices:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {config.examples.map((example, index) => (
                    <li key={index}>• {example}</li>
                  ))}
                </ul>
              </div>

              {isSelected && (
                <div className="mt-4 flex items-center text-sm font-medium text-gray-900">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mr-2"></div>
                  Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Continue button */}
      <div className="flex justify-between items-center">
        <Link 
          href="/academy"
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Cancel
        </Link>
        
        {!authenticated || !address ? (
          <button
            onClick={login}
            className="bg-gray-900 text-white px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Connect Wallet →
          </button>
        ) : (
          <button
            onClick={handleContinue}
            disabled={!selectedPreset || generating}
            className={`px-8 py-3 text-lg font-medium transition-colors ${
              selectedPreset && !generating
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Spirit...
              </span>
            ) : (
              `Continue →`
            )}
          </button>
        )}
      </div>
    </div>
  )
}