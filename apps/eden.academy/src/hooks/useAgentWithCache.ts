/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { fetchAgentWithCache, fetchAllAgentsWithCache } from '~/lib/agent-with-cache'

interface UseAgentResult {
  agent: any | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAgentWithCache(tokenId: string | undefined): UseAgentResult {
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgent = useCallback(async () => {
    if (!tokenId) return

    try {
      setLoading(true)
      setError(null)
      
      const enhancedAgent = await fetchAgentWithCache(tokenId)
      
      if (enhancedAgent) {
        setAgent(enhancedAgent)
      } else {
        setError('Agent not found')
      }
    } catch (err) {
      setError('Failed to load agent')
      console.error('Error loading agent:', err)
    } finally {
      setLoading(false)
    }
  }, [tokenId])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  return {
    agent,
    loading,
    error,
    refetch: fetchAgent
  }
}

interface UseAgentsResult {
  agents: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAgentsWithCache(): UseAgentsResult {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const enhancedAgents = await fetchAllAgentsWithCache()
      setAgents(enhancedAgents)
    } catch (err) {
      setError('Failed to load agents')
      console.error('Error loading agents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents
  }
}