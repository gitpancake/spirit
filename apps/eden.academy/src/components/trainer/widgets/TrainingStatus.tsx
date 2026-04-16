'use client'

import { useState } from 'react'
import { useAgentMetadata } from '~/hooks/useAgentMetadata'

interface TrainingStatusProps {
  tokenId: string
  isTrainer: boolean
}

export function TrainingStatus({ tokenId, isTrainer }: TrainingStatusProps) {
  const { metadata, updateTraining, isUpdating } = useAgentMetadata(tokenId)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>(metadata?.training?.status || 'active')
  const [milestones, setMilestones] = useState<string[]>(metadata?.training?.milestones || [])
  const [newMilestone, setNewMilestone] = useState('')

  // Update state when metadata changes
  useState(() => {
    if (metadata?.training) {
      setStatus(metadata.training.status)
      setMilestones(metadata.training.milestones || [])
    }
  })

  const calculateProgress = (status: string): number => {
    switch (status) {
      case 'active': return 50
      case 'paused': return 25
      case 'completed': return 100
      default: return 0
    }
  }

  // const updateTrainingStatus = async (newStatus: typeof status) => {
  //   try {
  //     await updateTraining({
  //       status: newStatus,
  //       progress: calculateProgress(newStatus),
  //       milestones
  //     })
  //     setStatus(newStatus)
  //   } catch (error) {
  //     console.error('Failed to update training status:', error)
  //   }
  // }

  const addMilestone = () => {
    if (newMilestone.trim() && !milestones.includes(newMilestone.trim())) {
      const newMilestones = [...milestones, newMilestone.trim()]
      setMilestones(newMilestones)
      setNewMilestone('')
    }
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      await updateTraining({
        status,
        progress: calculateProgress(status),
        milestones
      })
      setEditing(false)
    } catch (error) {
      console.error('Failed to save training status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'paused': return '⏸️'
      case 'completed': return '✅'
      default: return '⚪'
    }
  }

  const progress = metadata?.training?.progress || calculateProgress(status)

  return (
    <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Training Status</h3>
        <p className="text-sm text-gray-600">Agent training progress and milestones</p>
      </div>

      {editing ? (
        <div className="space-y-6">
          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active - Currently training</option>
              <option value="paused">Paused - Training suspended</option>
              <option value="completed">Completed - Training finished</option>
            </select>
          </div>

          {/* Milestones Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Milestones</label>
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600">🎯</span>
                    <span className="text-sm text-purple-800">{milestone}</span>
                  </div>
                  <button
                    onClick={() => removeMilestone(index)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add milestone..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
                />
                <button
                  onClick={addMilestone}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={isUpdating}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${getStatusColor(status)}`}>
              <span className="mr-2">{getStatusIcon(status)}</span>
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Progress</h4>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Milestones</h4>
            {milestones.length > 0 ? (
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-purple-600">🎯</span>
                    <span className="text-sm text-gray-700">{milestone}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No milestones set</p>
            )}
          </div>

          {/* Training History Summary */}
          {metadata?.training?.dailyPractice && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Training Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Streak:</span>
                  <span className="ml-2 font-medium">{metadata.training.dailyPractice.streak} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="ml-2 font-medium">{metadata.training.dailyPractice.totalHours}h</span>
                </div>
              </div>
              {metadata.training.dailyPractice.lastSession && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Last Session:</span>
                  <span className="ml-2 font-medium">
                    {new Date(metadata.training.dailyPractice.lastSession).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {isTrainer && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Configure
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}