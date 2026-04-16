'use client'

import { useState } from 'react'
import { useAgentMetadata } from '~/hooks/useAgentMetadata'

interface MissionStatementProps {
  tokenId: string
  isTrainer: boolean
}

export function MissionStatement({ tokenId, isTrainer }: MissionStatementProps) {
  const { metadata, updateMission, isUpdating } = useAgentMetadata(tokenId)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    statement: metadata?.mission?.statement || '',
    specializations: metadata?.mission?.specializations || [],
    goals: metadata?.mission?.goals || []
  })
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newGoal, setNewGoal] = useState('')

  // Update form data when metadata changes
  useState(() => {
    if (metadata?.mission) {
      setFormData({
        statement: metadata.mission.statement || '',
        specializations: metadata.mission.specializations || [],
        goals: metadata.mission.goals || []
      })
    }
  })

  const handleSave = async () => {
    try {
      await updateMission(formData)
      setEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, newSpecialization.trim()]
      })
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (index: number) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index)
    })
  }

  const addGoal = () => {
    if (newGoal.trim() && !formData.goals.includes(newGoal.trim())) {
      setFormData({
        ...formData,
        goals: [...formData.goals, newGoal.trim()]
      })
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Mission Statement</h3>
        <p className="text-sm text-gray-600">Agent purpose and specialization</p>
      </div>

      {editing ? (
        <div className="space-y-6">
          {/* Mission Statement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
            <textarea
              value={formData.statement}
              onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              placeholder="Describe the agent's mission and purpose..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            <div className="space-y-2">
              {formData.specializations.map((spec, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-blue-800">{spec}</span>
                  <button
                    onClick={() => removeSpecialization(index)}
                    className="text-blue-600 hover:text-blue-800"
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
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="Add specialization..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                />
                <button
                  onClick={addSpecialization}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
            <div className="space-y-2">
              {formData.goals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-green-800">{goal}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-green-600 hover:text-green-800"
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
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add goal..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <button
                  onClick={addGoal}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
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
          {/* Mission Statement Display */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Mission</h4>
            {metadata?.mission?.statement ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {metadata.mission.statement}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">No mission statement defined</p>
            )}
          </div>

          {/* Specializations Display */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Specializations</h4>
            {metadata?.mission?.specializations && metadata.mission.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {metadata.mission.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No specializations defined</p>
            )}
          </div>

          {/* Goals Display */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Goals</h4>
            {metadata?.mission?.goals && metadata.mission.goals.length > 0 ? (
              <div className="space-y-1">
                {metadata.mission.goals.map((goal, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No goals defined</p>
            )}
          </div>

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