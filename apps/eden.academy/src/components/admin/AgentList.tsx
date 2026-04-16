'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Agent, getIpfsImageUrl } from '~/lib/api'

interface AgentListProps {
  agents?: Agent[]
  loading: boolean
}

export function AgentList({ agents, loading }: AgentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'tokenId' | 'name' | 'recent'>('tokenId')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Found</h3>
        <p className="text-gray-600 mb-6">No agents have been registered in the Spirit Registry yet.</p>
      </div>
    )
  }

  const filteredAgents = agents.filter(agent =>
    agent.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.metadata.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.tokenId.toString().includes(searchTerm)
  )

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.metadata.name.localeCompare(b.metadata.name)
      case 'recent':
        return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
      case 'tokenId':
      default:
        return parseInt(a.tokenId) - parseInt(b.tokenId)
    }
  })

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'tokenId' | 'name' | 'recent')}
          >
            <option value="tokenId">Sort by Token ID</option>
            <option value="name">Sort by Name</option>
            <option value="recent">Sort by Recent</option>
          </select>
          
          <div className="text-sm text-gray-600">
            {filteredAgents.length} of {agents.length} agents
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">No agents found matching &quot;{searchTerm}&quot;</p>
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const imageUrl = getIpfsImageUrl(agent.metadata.image)
  
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-12 h-12 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={agent.metadata.name}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {agent.metadata.name}
            </h3>
            <span className="text-xs text-gray-500">#{agent.tokenId}</span>
          </div>
          
          <p className="text-xs text-gray-600 mb-1">@{agent.metadata.handle}</p>
          <p className="text-xs text-gray-500">{agent.metadata.role}</p>
          
          {agent.metadata.additional_fields?.genesis_cohort && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
              Genesis
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Trainers:</span>
          <span className="font-medium">{agent.trainers?.length || 0}</span>
        </div>
        
        <div className="flex space-x-2">
          <Link
            href={`/agent/${agent.tokenId}`}
            className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            View Profile
          </Link>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 transition-colors">
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}