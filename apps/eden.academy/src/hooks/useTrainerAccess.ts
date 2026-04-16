'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useIsTrainer } from './useIsTrainer'

export interface TrainingPermission {
  type: 'basic_training' | 'advanced_training' | 'metadata_update' | 'style_guidance'
  granted: boolean
  description: string
}

export interface TrainingMetrics {
  sessionsCount: number
  totalHours: number
  performanceScore: number
  lastSessionDate: string | null
}

export interface TrainerAccessData {
  hasAccess: boolean
  permissions: TrainingPermission[]
  metrics?: TrainingMetrics
  verificationStatus: 'verified' | 'pending' | 'failed'
}

interface UseTrainerAccessProps {
  tokenId: string | number
}

export function useTrainerAccess({ tokenId }: UseTrainerAccessProps) {
  const { address } = useAccount()
  const { isTrainer, isLoading: isTrainerLoading, error: trainerError } = useIsTrainer({ tokenId })
  const [trainerData, setTrainerData] = useState<TrainerAccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkTrainerAccess = useCallback(async () => {
    if (!address || !tokenId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // For now, we'll use the blockchain result as the primary source
      // In the future, this could be extended to check additional permissions from an API
      if (isTrainer) {
        // Mock training permissions - in a real implementation, these would come from your API
        const permissions: TrainingPermission[] = [
          {
            type: 'basic_training',
            granted: true,
            description: 'Start and stop basic training sessions'
          },
          {
            type: 'advanced_training',
            granted: isTrainer, // Only verified trainers get advanced access
            description: 'Advanced training controls and fine-tuning'
          },
          {
            type: 'style_guidance',
            granted: true,
            description: 'Provide style and artistic guidance'
          },
          {
            type: 'metadata_update',
            granted: false, // This might require special permissions
            description: 'Update agent metadata and profile information'
          }
        ]

        // Mock training metrics - in a real implementation, these would come from your training API
        const metrics: TrainingMetrics = {
          sessionsCount: 12,
          totalHours: 24.5,
          performanceScore: 94.2,
          lastSessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }

        setTrainerData({
          hasAccess: true,
          permissions,
          metrics,
          verificationStatus: 'verified'
        })
      } else {
        setTrainerData({
          hasAccess: false,
          permissions: [],
          verificationStatus: 'failed'
        })
      }
    } catch (err) {
      console.error('Failed to check trainer access:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify trainer access')
      setTrainerData({
        hasAccess: false,
        permissions: [],
        verificationStatus: 'failed'
      })
    } finally {
      setLoading(false)
    }
  }, [address, tokenId, isTrainer])

  useEffect(() => {
    if (!isTrainerLoading) {
      checkTrainerAccess()
    }
  }, [checkTrainerAccess, isTrainerLoading])

  return {
    ...trainerData,
    loading: loading || isTrainerLoading,
    error: error || (trainerError instanceof Error ? trainerError.message : null),
    refetch: checkTrainerAccess,
    // Additional utilities
    canStartTraining: trainerData?.permissions.some(p => p.type === 'basic_training' && p.granted) || false,
    canAdvancedTrain: trainerData?.permissions.some(p => p.type === 'advanced_training' && p.granted) || false,
  }
}