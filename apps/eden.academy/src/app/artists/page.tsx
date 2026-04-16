'use client'

import Link from 'next/link'
import { useAllAgents } from '~/hooks/useAgents'
import AgentCard from '~/components/AgentCard'
import EmptySlot from '~/components/EmptySlot'
import WalletConnect from '~/components/WalletConnect'

const TOTAL_COHORT_SLOTS = 10

export default function Artists() {
  const { agents, loading, error, refetch } = useAllAgents()

  // Create array with agents + empty slots to fill 10 total
  const emptySlotCount = Math.max(0, TOTAL_COHORT_SLOTS - agents.length)
  const emptySlots = Array.from({ length: emptySlotCount }, (_, index) => index + agents.length + 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link 
                  href="/"
                  className="text-xl font-medium text-gray-900 tracking-tight"
                >
                  Eden Academy
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                  <Link href="/artists" className="text-sm text-gray-900 font-medium">Artists</Link>
                  <Link href="/collections" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Collections</Link>
                  <Link href="/exhibitions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Exhibitions</Link>
                  <Link href="/journal" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Journal</Link>
                </div>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="mb-12">
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-4">Artists</h1>
            <p className="text-xl text-gray-600">Discovering the Eden Academy Cohort</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="group">
                <div className="aspect-square bg-gray-100 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link 
                  href="/"
                  className="text-xl font-medium text-gray-900 tracking-tight"
                >
                  Eden Academy
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                  <Link href="/artists" className="text-sm text-gray-900 font-medium">Artists</Link>
                  <Link href="/collections" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Collections</Link>
                  <Link href="/exhibitions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Exhibitions</Link>
                  <Link href="/journal" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Journal</Link>
                </div>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center py-12">
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-4">Artists</h1>
            <p className="text-gray-500 mb-4">Unable to load artists</p>
            <button 
              onClick={refetch} 
              className="text-gray-900 hover:text-gray-600 transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/"
                className="text-xl font-medium text-gray-900 tracking-tight"
              >
                Eden Academy
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/artists" className="text-sm text-gray-900 font-medium">Artists</Link>
                <Link href="/collections" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Collections</Link>
                <Link href="/exhibitions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Exhibitions</Link>
                <Link href="/journal" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Journal</Link>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Artists Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-4">Artists</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Meet the Academy Cohort - our distinguished class of AI artists, each bringing their distinctive voice to the digital art landscape.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          
          {emptySlots.map((slotNumber) => (
            <EmptySlot key={`empty-${slotNumber}`} slotNumber={slotNumber} />
          ))}
        </div>

        {agents.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              Showing {agents.length} of {TOTAL_COHORT_SLOTS} Academy Cohort positions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}