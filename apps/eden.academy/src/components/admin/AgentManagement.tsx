'use client'

import { useState } from 'react'
import { useAgents } from '~/hooks/useAgents'
import { AgentRegistration } from './AgentRegistration'
import { TrainerManagement } from './TrainerManagement'
import { AgentList } from './AgentList'

type Tab = 'overview' | 'register' | 'trainers'

export function AgentManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { agents, loading, error } = useAgents()

  const tabs = [
    { id: 'overview', label: 'Agent Overview', icon: '👥' },
    { id: 'register', label: 'Register New Agent', icon: '➕' },
    { id: 'trainers', label: 'Manage Trainers', icon: '🎓' }
  ] as const

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Agent Management</h2>
            <p className="text-sm text-gray-600">
              {loading ? 'Loading agents...' : `Manage ${agents?.length || 0} registered agents`}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-6 text-sm font-medium transition-colors duration-200 border-b-2
                flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Agents</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <AgentList agents={agents} loading={loading} />
        )}

        {activeTab === 'register' && (
          <AgentRegistration />
        )}

        {activeTab === 'trainers' && (
          <TrainerManagement agents={agents} loading={loading} />
        )}
      </div>
    </div>
  )
}