'use client'

import React from 'react'
import { useAllAgents } from '~/hooks/useAgents'
import AgentCard from './AgentCard'
import EmptySlot from './EmptySlot'

const TOTAL_COHORT_SLOTS = 10

function AcademyCohort() {
  const { agents, loading, error, refetch } = useAllAgents()

  if (loading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Unable to load artists</p>
        <button 
          onClick={refetch} 
          className="text-gray-900 hover:text-gray-600 transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  // Create array with agents + empty slots to fill 10 total
  const emptySlotCount = Math.max(0, TOTAL_COHORT_SLOTS - agents.length)
  const emptySlots = Array.from({ length: emptySlotCount }, (_, index) => index + agents.length + 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
      
      {emptySlots.map((slotNumber) => (
        <EmptySlot key={`empty-${slotNumber}`} slotNumber={slotNumber} />
      ))}
    </div>
  )
}

export default React.memo(AcademyCohort)