'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AgentArtworkRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.id as string

  useEffect(() => {
    // Redirect to the agent page with portfolio tab active
    router.replace(`/agent/${tokenId}?tab=portfolio`)
  }, [tokenId, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecting to artist portfolio...</p>
      </div>
    </div>
  )
}