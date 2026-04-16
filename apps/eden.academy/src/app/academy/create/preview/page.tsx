'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  PresetType, 
  PRESET_CONFIGS, 
  SpiritDraft, 
  loadSpiritDraft, 
  getNextRunTime,
  formatNextRun,
  CADENCE_CONFIGS,
  OUTPUT_KIND_CONFIGS
} from '~/lib/spirits'


function PreviewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [preset] = useState<PresetType>(searchParams.get('preset') as PresetType || 'CREATOR')
  const [mode] = useState(searchParams.get('mode') || 'guided')
  const [draft, setDraft] = useState<SpiritDraft | null>(null)
  const [nextRun, setNextRun] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)


  // Load draft on mount
  useEffect(() => {
    const existingDraft = loadSpiritDraft()
    if (existingDraft && existingDraft.practice) {
      setDraft(existingDraft)
      
      // Calculate next run time
      const nextRunTime = getNextRunTime(existingDraft.practice)
      setNextRun(nextRunTime)
    } else {
      // No draft or practice found, redirect back
      router.push('/academy/create/practice')
    }
    
    setLoading(false)
  }, [router])


  const handleContinue = () => {
    router.push(`/academy/create/graduate?preset=${preset}&mode=${mode}`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!draft || !draft.practice) return null

  const config = PRESET_CONFIGS[preset]
  const cadenceConfig = CADENCE_CONFIGS[draft.practice.cadence]
  const outputConfig = OUTPUT_KIND_CONFIGS[draft.practice.output_kind]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Step 4 of 6</span>
          <Link href={`/academy/create/practice?preset=${preset}&mode=${mode}`} className="hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full" style={{ width: '66.67%' }}></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-4">
          Preview Your Practice
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Here&apos;s how <strong>{draft.identity.name}</strong> will practice their craft. 
          This is a sample of what their autonomous creative process will produce.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Practice Summary */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-light text-gray-900 mb-4">Practice Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Schedule</span>
                <span className="font-light text-gray-900">{cadenceConfig.title}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Time (UTC)</span>
                <span className="font-light text-gray-900">{draft.practice.time_utc}</span>
              </div>
              
              {draft.practice.rest_day !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {draft.practice.cadence === 'WEEKLY' ? 'Practice Day' : 'Rest Day'}
                  </span>
                  <span className="font-light text-gray-900">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][draft.practice.rest_day]}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Output Type</span>
                <span className="font-light text-gray-900">{outputConfig.title}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-light text-gray-900">{draft.practice.quantity} per session</span>
              </div>
            </div>
          </div>

          {/* Next run countdown */}
          {nextRun && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-light text-blue-900 mb-2">Next Practice Session</h4>
              <p className="text-blue-800">
                <strong>{nextRun.toLocaleDateString()}</strong> at <strong>{draft.practice.time_utc} UTC</strong>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {formatNextRun(nextRun)}
              </p>
            </div>
          )}
        </div>

        {/* Spirit Profile Preview */}
        <div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-light text-gray-900">Spirit Profile Preview</h3>
              <p className="text-sm text-gray-600 mt-1">How {draft.identity.name} will appear once graduated</p>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {config.icon}
                </div>
                <div>
                  <h4 className="text-xl font-light text-gray-900">{draft.identity.name}</h4>
                  <p className="text-gray-600">{draft.identity.tagline}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                      {config.title}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                      {cadenceConfig.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Practice Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-light text-gray-900 mb-3">Active Practice</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Output:</span>
                    <span className="ml-2 text-gray-900">{outputConfig.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Schedule:</span>
                    <span className="ml-2 text-gray-900">{draft.practice.time_utc} UTC</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ready to graduate</span>
                </div>
                <span className="text-xs text-gray-500">On-chain deployment pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center mb-12">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-lg">
          <h3 className="text-2xl font-light text-gray-900 mb-4">
            Ready to bring <em>{draft.identity.name}</em> to life?
          </h3>
          <p className="text-gray-600 mb-6">
            Graduation will deploy your spirit on-chain, creating their sovereign identity 
            and enabling autonomous practice execution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleContinue}
              className="bg-gray-900 text-white px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Graduate Spirit →
            </button>
            <Link
              href={`/academy/create/practice?preset=${preset}&mode=${mode}`}
              className="border border-gray-300 text-gray-900 px-8 py-3 text-lg font-medium hover:border-gray-400 transition-colors text-center"
            >
              ← Adjust Practice
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto"><div className="text-center py-12"><div className="animate-pulse"><div className="w-8 h-8 bg-gray-200 rounded-full mx-auto"></div></div></div></div>}>
      <PreviewPageContent />
    </Suspense>
  )
}