'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  PresetType, 
  PRESET_CONFIGS, 
  CadenceType,
  CADENCE_CONFIGS,
  OutputKind,
  OUTPUT_KIND_CONFIGS,
  DAYS_OF_WEEK,
  SpiritDraft, 
  PracticeConfig,
  loadSpiritDraft, 
  saveSpiritDraft 
} from '~/lib/spirits'

function PracticePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [preset] = useState<PresetType>(searchParams.get('preset') as PresetType || 'CREATOR')
  const [mode] = useState(searchParams.get('mode') || 'guided')
  const [draft, setDraft] = useState<SpiritDraft | null>(null)
  
  // Practice configuration state
  const [cadence, setCadence] = useState<CadenceType>('DAILY_6_1')
  const [timeUtc, setTimeUtc] = useState('21:00')
  const [restDay, setRestDay] = useState<number>(0) // Sunday default
  const [quantity, setQuantity] = useState(1)
  const [outputKind, setOutputKind] = useState<OutputKind>(PRESET_CONFIGS[preset].defaultOutput)
  const [configJson, setConfigJson] = useState<Record<string, unknown>>({})
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load draft on mount
  useEffect(() => {
    const existingDraft = loadSpiritDraft()
    if (existingDraft) {
      setDraft(existingDraft)
      
      if (existingDraft.practice) {
        setCadence(existingDraft.practice.cadence)
        setTimeUtc(existingDraft.practice.time_utc)
        setRestDay(existingDraft.practice.rest_day ?? 0)
        setQuantity(existingDraft.practice.quantity)
        setOutputKind(existingDraft.practice.output_kind)
        setConfigJson(existingDraft.practice.config_json)
      }
    } else {
      // No draft found, redirect to start
      router.push('/academy/create/select-preset')
    }
  }, [router])

  const handleConfigChange = (key: string, value: unknown) => {
    setConfigJson(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!timeUtc.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      newErrors.time = 'Please enter a valid time in HH:MM format'
    }

    if (quantity < 1 || quantity > 10) {
      newErrors.quantity = 'Quantity must be between 1 and 10'
    }

    // Validate config based on output kind
    if (outputKind === 'IMAGE' && !(configJson.prompt as string)?.trim()) {
      newErrors.config = 'Please provide a prompt for image generation'
    }

    if (outputKind === 'TEXT' && !(configJson.topic as string)?.trim()) {
      newErrors.config = 'Please provide a topic for text generation'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm() || !draft) return

    const practiceConfig: PracticeConfig = {
      type: preset,
      cadence,
      time_utc: timeUtc,
      rest_day: cadence === 'DAILY_6_1' ? restDay : undefined,
      quantity,
      output_kind: outputKind,
      config_json: configJson
    }

    const updatedDraft: SpiritDraft = {
      ...draft,
      practice: practiceConfig,
      integrations: PRESET_CONFIGS[preset].defaultSkills
    }

    saveSpiritDraft(updatedDraft)
    router.push(`/academy/create/preview?preset=${preset}&mode=${mode}`)
  }

  const config = PRESET_CONFIGS[preset]
  // const cadenceConfig = CADENCE_CONFIGS[cadence]

  if (!draft) return null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Step 3 of 6</span>
          <Link href={`/academy/create/identity?preset=${preset}&mode=${mode}`} className="hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full" style={{ width: '50%' }}></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-4">
          Define Your Practice
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Establish the ritual that will guide <strong>{draft.identity.name}</strong>&apos;s creative process. 
          This becomes their covenant—a commitment to consistent practice.
        </p>
      </div>

      <div className="space-y-10">
        {/* Cadence Selection */}
        <div>
          <h3 className="text-xl font-light text-gray-900 mb-4">Practice Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(CADENCE_CONFIGS) as CadenceType[]).map((cadenceOption) => {
              const cadenceConfig = CADENCE_CONFIGS[cadenceOption]
              const isSelected = cadence === cadenceOption

              return (
                <button
                  key={cadenceOption}
                  onClick={() => setCadence(cadenceOption)}
                  className={`text-left p-4 border rounded-lg transition-colors ${
                    isSelected 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{cadenceConfig.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{cadenceConfig.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time and Rest Day */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="time" className="block text-lg font-light text-gray-900 mb-2">
              Practice Time (UTC)
            </label>
            <input
              id="time"
              type="time"
              value={timeUtc}
              onChange={(e) => setTimeUtc(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                errors.time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
          </div>

          {cadence === 'DAILY_6_1' && (
            <div>
              <label htmlFor="rest-day" className="block text-lg font-light text-gray-900 mb-2">
                Rest Day
              </label>
              <select
                id="rest-day"
                value={restDay}
                onChange={(e) => setRestDay(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {cadence === 'WEEKLY' && (
            <div>
              <label htmlFor="weekly-day" className="block text-lg font-light text-gray-900 mb-2">
                Practice Day
              </label>
              <select
                id="weekly-day"
                value={restDay}
                onChange={(e) => setRestDay(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Output Configuration */}
        <div>
          <h3 className="text-xl font-light text-gray-900 mb-4">Output Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {(Object.keys(OUTPUT_KIND_CONFIGS) as OutputKind[]).map((kind) => {
              const kindConfig = OUTPUT_KIND_CONFIGS[kind]
              const isSelected = outputKind === kind

              return (
                <button
                  key={kind}
                  onClick={() => setOutputKind(kind)}
                  className={`text-left p-4 border rounded-lg transition-colors ${
                    isSelected 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{kindConfig.icon}</div>
                  <h4 className="font-medium text-gray-900">{kindConfig.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{kindConfig.description}</p>
                </button>
              )
            })}
          </div>

          {/* Dynamic configuration based on output type */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-light text-gray-900 mb-4">Practice Configuration</h4>
            
            {outputKind === 'IMAGE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">Prompt Template</label>
                  <textarea
                    value={(configJson.prompt as string) || ''}
                    onChange={(e) => handleConfigChange('prompt', e.target.value)}
                    placeholder="e.g., A surreal digital painting of..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">Style</label>
                  <input
                    value={(configJson.style as string) || ''}
                    onChange={(e) => handleConfigChange('style', e.target.value)}
                    placeholder="e.g., abstract, photorealistic, minimalist"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            )}

            {outputKind === 'TEXT' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">Topic Focus</label>
                  <input
                    value={(configJson.topic as string) || ''}
                    onChange={(e) => handleConfigChange('topic', e.target.value)}
                    placeholder="e.g., digital art trends, AI ethics, creative philosophy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">Format</label>
                  <select
                    value={(configJson.format as string) || 'essay'}
                    onChange={(e) => handleConfigChange('format', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  >
                    <option value="essay">Essay</option>
                    <option value="poem">Poetry</option>
                    <option value="analysis">Analysis</option>
                    <option value="story">Short Story</option>
                  </select>
                </div>
              </div>
            )}

            {(outputKind === 'AUDIO' || outputKind === 'PRODUCT' || outputKind === 'TOKEN') && (
              <div>
                <p className="text-sm text-gray-600">
                  Configuration for {OUTPUT_KIND_CONFIGS[outputKind].title.toLowerCase()} will be available soon.
                </p>
              </div>
            )}
          </div>

          {errors.config && <p className="text-sm text-red-500 mt-2">{errors.config}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-lg font-light text-gray-900 mb-2">
            Outputs per Practice Session
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
              errors.quantity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
          <p className="text-sm text-gray-500 mt-2">
            How many {OUTPUT_KIND_CONFIGS[outputKind].title.toLowerCase()} items to create per session.
          </p>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-between items-center mt-12">
        <Link 
          href={`/academy/create/identity?preset=${preset}&mode=${mode}`}
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </Link>
        
        <button
          onClick={handleContinue}
          className="bg-gray-900 text-white px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto text-center py-12"><div className="animate-pulse"><div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div></div></div>}>
      <PracticePageContent />
    </Suspense>
  )
}