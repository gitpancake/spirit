'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrainingControlPanel } from './TrainingControlPanel'
import { TrainingMetrics } from '../../hooks/useTrainerAccess'

export interface TrainingPermission {
  type: 'basic_training' | 'advanced_training' | 'metadata_update' | 'style_guidance'
  granted: boolean
  description: string
}

interface TrainerModeTabProps {
  agentId: string
  agentName: string
  permissions: TrainingPermission[]
  metrics?: TrainingMetrics
}

type TrainingStatus = 'idle' | 'active' | 'paused'

export function TrainerModeTab({ agentId, agentName, permissions, metrics }: TrainerModeTabProps) {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle')

  return (
    <div className="space-y-6">
      {/* Trainer Access Confirmation Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-lg p-4 lg:p-6"
      >
        <div className="flex items-start space-x-3 lg:space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-medium text-green-800 mb-1">
              Training Access Confirmed
            </h3>
            <p className="text-sm lg:text-base text-green-700 mb-3 lg:mb-4">
              You have trainer privileges for {agentName}. Use this mode to guide their learning and development.
            </p>
            <div className="flex items-center space-x-4 text-xs lg:text-sm text-green-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Trainer Verified</span>
              </div>
              <span>Agent ID: {agentId}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Training Status Overview */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Training Status</p>
              <div className={`w-3 h-3 rounded-full ${
                trainingStatus === 'active' ? 'bg-green-500 animate-pulse' :
                trainingStatus === 'paused' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
            </div>
            <p className="text-xl lg:text-2xl font-semibold text-gray-900 capitalize">
              {trainingStatus}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Training Sessions</p>
              <div className="text-blue-500">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-semibold text-gray-900">
              {metrics.sessionsCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalHours}h total
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
              <div className="text-green-500">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-semibold text-gray-900">
              {metrics.performanceScore}%
            </p>
            {metrics.lastSessionDate && (
              <p className="text-xs text-gray-500 mt-1">
                Last: {new Date(metrics.lastSessionDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Training Control Panel */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base lg:text-lg font-medium text-gray-900">
            Training Controls
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Advanced training tools and configuration options
          </p>
        </div>

        <div className="p-4 lg:p-6">
          <TrainingControlPanel 
            agentId={agentId}
            agentName={agentName}
            permissions={permissions}
            currentStatus={trainingStatus}
            onStatusChange={setTrainingStatus}
          />
        </div>
      </div>

      {/* Training Interface Coming Soon */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 lg:p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
          </svg>
        </div>
        <h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-3">
          Interactive Training Interface Coming Soon
        </h4>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6 text-sm lg:text-base leading-relaxed">
          We&apos;re building powerful training tools that will allow you to shape {agentName}&apos;s learning process,
          monitor progress in real-time, and provide direct feedback on their creative output.
        </p>
        <div className="space-y-3">
          <div className="text-xs lg:text-sm text-gray-500 font-medium">Features in development:</div>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
              Live Training Sessions
            </span>
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
              Feedback System
            </span>
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
              Progress Analytics
            </span>
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
              Style Guidance
            </span>
            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
              Performance Optimization
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}