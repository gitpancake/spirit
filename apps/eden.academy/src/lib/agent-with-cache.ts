/* eslint-disable @typescript-eslint/no-explicit-any */
import { Agent, AgentsResponse } from './api'

interface EnhancedAgent extends Agent {
  tokenURI?: string
  onChainMetadata?: any
  metadataSource: 'api' | 'ipfs' | 'cached'
}

export async function fetchAgentWithCache(tokenId: string): Promise<EnhancedAgent | null> {
  try {
    // Call the external API directly - no need for local caching since API handles it
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3022'
        : 'https://www.eden-academy.xyz'
    
    const response = await fetch(`${baseUrl}/api/agent/${tokenId}`)
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Agent with tokenId ${tokenId} not found`)
        return null
      }
      throw new Error(`Failed to fetch agent ${tokenId} from API: ${response.status}`)
    }
    
    const agentResponse = await response.json()
    const agent = agentResponse.data || agentResponse // Handle both wrapped and direct response formats
    
    if (!agent) {
      console.log(`Agent with tokenId ${tokenId} not found in API response`)
      return null
    }

    // The external API provides complete metadata with caching handled server-side
    const enhancedAgent: EnhancedAgent = {
      ...agent,
      metadataSource: 'api', // The API provides the complete metadata with its own caching
    }

    console.log(`Fetched agent ${tokenId} from external API`)

    return enhancedAgent

  } catch (error) {
    console.error(`Error fetching agent ${tokenId}:`, error)
    return null
  }
}

export async function fetchAllAgentsWithCache(): Promise<EnhancedAgent[]> {
  try {
    // Call external API directly - it handles all caching and optimization
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3022'
        : 'https://www.eden-academy.xyz'
    
    const response = await fetch(`${baseUrl}/api/agents`)
    if (!response.ok) {
      throw new Error('Failed to fetch agents from external API')
    }
    const agentsResponse: AgentsResponse = await response.json()
    const agents = agentsResponse.data

    // The external API provides complete metadata with its own caching layer
    const enhancedAgents: EnhancedAgent[] = agents.map(agent => ({
      ...agent,
      metadataSource: 'api' as const
    }))

    console.log(`Fetched ${enhancedAgents.length} agents from external API`)

    return enhancedAgents

  } catch (error) {
    console.error('Error fetching agents:', error)
    throw error
  }
}

// Cache utility functions are no longer needed since external API handles all caching
export function getCacheStats() {
  return {
    note: 'Caching handled by external API service - no local cache needed'
  }
}

export function clearCache() {
  console.log('No local cache to clear - external API handles all caching')
}