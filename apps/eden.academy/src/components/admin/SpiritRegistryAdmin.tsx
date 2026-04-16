'use client'

import { useState } from 'react'
import { ContractReadSection } from './contract/ContractReadSection'
import { ContractWriteSection } from './contract/ContractWriteSection'
import { TokenManagementSection } from './contract/TokenManagementSection'
import { TrainerManagementSection } from './contract/TrainerManagementSection'
import { OwnershipSection } from './contract/OwnershipSection'
import { TransactionGuard } from '../NetworkValidation'

type Tab = 'overview' | 'tokens' | 'trainers' | 'ownership' | 'write'

export function SpiritRegistryAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('write')

  const tabs = [
    { id: 'write', label: 'Advanced Operations', icon: '⚡', description: 'All write operations and advanced features' },
    { id: 'overview', label: 'Contract Overview', icon: '📋', description: 'Read contract state and information' },
    { id: 'tokens', label: 'Token Management', icon: '🎫', description: 'Register, burn, and manage agent tokens' },
    { id: 'trainers', label: 'Trainer Management', icon: '🎓', description: 'Add, remove and manage trainer permissions' },
    { id: 'ownership', label: 'Ownership & Config', icon: '⚙️', description: 'Contract ownership and configuration' }
  ] as const

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Spirit Registry Contract Admin</h2>
            <p className="text-sm text-gray-600">
              Full administrative interface for the SpiritRegistry smart contract
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-4 px-6 text-sm font-medium transition-colors duration-200 border-b-2
                flex items-center space-x-2 min-w-0
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              title={tab.description}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && <ContractReadSection />}
        {activeTab === 'tokens' && (
          <TransactionGuard>
            <TokenManagementSection />
          </TransactionGuard>
        )}
        {activeTab === 'trainers' && (
          <TransactionGuard>
            <TrainerManagementSection />
          </TransactionGuard>
        )}
        {activeTab === 'ownership' && (
          <TransactionGuard>
            <OwnershipSection />
          </TransactionGuard>
        )}
        {activeTab === 'write' && (
          <TransactionGuard>
            <ContractWriteSection />
          </TransactionGuard>
        )}
      </div>
    </div>
  )
}