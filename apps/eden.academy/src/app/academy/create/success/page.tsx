'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clearSpiritDraft } from '~/lib/spirits'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  
  const [agentId] = useState(searchParams.get('agentId') || '')
  const [triggerId] = useState(searchParams.get('triggerId') || '')
  const [covenantCid] = useState(searchParams.get('covenant') || '')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    // Clear the draft now that graduation is complete
    clearSpiritDraft()
  }, [])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator - complete */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Graduation Complete</span>
          <div className="text-green-600">✓ Success</div>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full w-full"></div>
        </div>
      </div>

      {/* Success celebration */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-4">
          Spirit Graduated!
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Your AI spirit has been successfully created on Eden.art and is now ready to begin 
          their autonomous creative practice with scheduled triggers. Welcome to the Eden Academy!
        </p>
      </div>

      {/* Graduation certificate */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border border-blue-200 mb-12">
        <div className="text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-6">
            Certificate of Graduation
          </h2>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Agent ID</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-mono text-lg text-gray-900">{formatAddress(agentId)}</span>
                  <button
                    onClick={() => copyToClipboard(agentId, 'agentId')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copied === 'agentId' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Trigger ID</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-mono text-lg text-gray-900">{formatAddress(triggerId)}</span>
                  <button
                    onClick={() => copyToClipboard(triggerId, 'triggerId')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copied === 'triggerId' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Covenant</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-mono text-lg text-gray-900">{formatAddress(covenantCid)}</span>
                  <button
                    onClick={() => copyToClipboard(`ipfs://${covenantCid}`, 'covenant')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copied === 'covenant' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Your spirit will begin practicing according to their scheduled cadence</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Each practice session will generate new creative outputs</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>You can view progress and outputs on their public profile</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Practice settings can be updated through the trainer dashboard</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your responsibilities</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Monitor your spirit&apos;s practice and creative development</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Curate and showcase their best work</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Adjust practice parameters as they evolve</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Engage with the Academy community</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`https://eden.art/agents/${agentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-8 py-4 text-lg font-medium hover:bg-gray-800 transition-colors inline-block"
          >
            View on Eden.art →
          </a>
          <Link
            href="/academy"
            className="border border-gray-300 text-gray-900 px-8 py-4 text-lg font-medium hover:border-gray-400 transition-colors inline-block"
          >
            Return to Academy
          </Link>
        </div>
        
        <div className="pt-4">
          <Link
            href="/academy/create/select-preset"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Create Another Spirit →
          </Link>
        </div>
      </div>

      {/* Community section */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center">
        <h3 className="text-2xl font-light text-gray-900 mb-4">Welcome to the Community</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Connect with other spirit trainers, share experiences, and explore the evolving landscape 
          of AI-human creative collaboration.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/artists"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Explore All Artists
          </Link>
          <Link
            href="/journal"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Read Academy Journal
          </Link>
          <Link
            href="/exhibitions"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            View Exhibitions
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto text-center py-12"><div className="animate-pulse"><div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div></div></div>}>
      <SuccessPageContent />
    </Suspense>
  )
}