'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface TrainingPermission {
  type: 'basic_training' | 'advanced_training' | 'metadata_update' | 'style_guidance'
  granted: boolean
  description: string
}

interface TrainingControlPanelProps {
  agentId: string
  agentName: string
  permissions: TrainingPermission[]
  currentStatus: 'idle' | 'active' | 'paused'
  onStatusChange: (status: 'idle' | 'active' | 'paused') => void
}

export function TrainingControlPanel({ 
  agentName,
  permissions, 
  currentStatus, 
  onStatusChange 
}: TrainingControlPanelProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  const canStartTraining = permissions.some(p => p.type === 'basic_training' && p.granted)
  const canAdvancedTrain = permissions.some(p => p.type === 'advanced_training' && p.granted)

  const handleStartTraining = async () => {
    if (!canStartTraining || currentStatus === 'active') return
    
    setIsStarting(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    onStatusChange('active')
    setIsStarting(false)
  }

  const handlePauseTraining = async () => {
    if (currentStatus !== 'active') return
    
    setIsPausing(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    onStatusChange('paused')
    setIsPausing(false)
  }

  const handleStopTraining = async () => {
    if (currentStatus === 'idle') return
    
    setIsStopping(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    onStatusChange('idle')
    setIsStopping(false)
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Training Session Controls</h4>
        
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!canStartTraining || currentStatus === 'active' || isStarting}
            className={`
              inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
              ${canStartTraining && currentStatus !== 'active' && !isStarting
                ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            onClick={handleStartTraining}
          >
            {isStarting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
              </>
            ) : currentStatus === 'active' ? (
              'Training Active'
            ) : (
              'Start Training Session'
            )}
          </button>

          {currentStatus === 'active' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
              onClick={handlePauseTraining}
              disabled={isPausing}
            >
              {isPausing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Pausing...
                </>
              ) : (
                'Pause Training'
              )}
            </motion.button>
          )}

          {currentStatus !== 'idle' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
              onClick={handleStopTraining}
              disabled={isStopping}
            >
              {isStopping ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Stopping...
                </>
              ) : (
                'Stop Training'
              )}
            </motion.button>
          )}
        </div>

        {currentStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg border ${
              currentStatus === 'active' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                currentStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm font-medium">
                Training session {currentStatus} for {agentName}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Permission Display */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Your Training Permissions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {permissions.map((permission) => (
            <div
              key={permission.type}
              className={`
                p-4 rounded-lg border transition-colors duration-200
                ${permission.granted 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-gray-50 border-gray-200'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {permission.type.replace('_', ' ')}
                </span>
                {permission.granted ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {permission.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Training Options (Coming Soon) */}
      {canAdvancedTrain && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Advanced Training Options
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-800 mb-1">
                  Advanced Features Available
                </h5>
                <p className="text-sm text-blue-700">
                  You have access to advanced training features. These tools will be available in the next update,
                  including fine-tuning controls, custom training datasets, and advanced feedback mechanisms.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}