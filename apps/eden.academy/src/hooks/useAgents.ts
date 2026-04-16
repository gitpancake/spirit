import { useState, useEffect, useCallback } from 'react'
import { fetchAgents, Agent, AgentsResponse } from '~/lib/api'

interface UseAgentsOptions {
  autoFetch?: boolean
}

interface UseAgentsReturn {
  agents: Agent[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// Simple in-memory cache to avoid duplicate requests across components
const cache: Map<string, { data: Agent[], timestamp: number }> = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAgents({ 
  autoFetch = true 
}: UseAgentsOptions = {}): UseAgentsReturn {
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = 'all' // Always cache all agents

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check in-memory cache first
      const cached = cache.get(cacheKey)
      const now = Date.now()
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setAllAgents(cached.data)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const response: AgentsResponse = await fetchAgents()
      
      if (response.success) {
        setAllAgents(response.data)
        // Update in-memory cache
        cache.set(cacheKey, { data: response.data, timestamp: now })
      } else {
        setError('Failed to load agents')
      }
    } catch (err) {
      setError('Failed to fetch agents')
      console.error('Error loading agents:', err)
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

  // Return all agents without filtering
  const agents = allAgents

  useEffect(() => {
    if (autoFetch) {
      loadAgents()
    }
  }, [loadAgents, autoFetch])

  return {
    agents,
    loading,
    error,
    refetch: loadAgents
  }
}

// Convenience hooks for common use cases
export function useAllAgents() {
  return useAgents()
}