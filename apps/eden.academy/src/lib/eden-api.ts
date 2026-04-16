/* eslint-disable @typescript-eslint/no-explicit-any */
// Eden Art API client - now using proxy endpoints
const EDEN_API_BASE = '/api/eden'

export interface EdenApiResponse<T> {
  success: boolean
  data: T
  error?: string
  details?: string
  statusCode?: number
}

export interface EdenCreationsResponse {
  docs: Creation[]
  totalDocs: number
  nextCursor?: string
}

export interface Creation {
  _id: string
  name: string | null
  description?: string
  url: string
  thumbnail: string
  createdAt: string
  updatedAt: string
  mediaAttributes: {
    mimeType: string
    width?: number
    height?: number
    aspectRatio?: number
    duration?: number
    blurhash?: string
  }
  agent?: {
    _id: string
    name: string
    username: string
    userImage: string
  }
  user?: {
    _id: string
    username: string
    userImage: string
  }
  task?: {
    _id: string
    args: any
  }
  tool: string
  public: boolean
  deleted: boolean
  likeCount: number
}

class EdenApiClient {
  private baseUrl: string
  private headers: HeadersInit

  constructor(baseUrl = EDEN_API_BASE) {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<EdenApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed')
      }

      return result
    } catch (error) {
      console.error('Eden API request failed:', error)
      throw error
    }
  }

  // Agent Creations
  async getAgentCreations(agentId: string, page = 1, limit = 50, cursor?: string): Promise<EdenApiResponse<EdenCreationsResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (cursor) {
      params.append('cursor', cursor)
    }
    
    return this.request<EdenCreationsResponse>(`/agents/${agentId}/creations?${params}`)
  }

  // User Creations
  async getUserCreations(userId: string, page = 1, limit = 50): Promise<EdenApiResponse<EdenCreationsResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    return this.request<EdenCreationsResponse>(`/users/${userId}/creations?${params}`)
  }

  // Get single creation
  async getCreation(creationId: string): Promise<EdenApiResponse<Creation>> {
    return this.request<Creation>(`/creations/${creationId}`)
  }

  // Search creations
  async searchCreations(
    query: string, 
    options: {
      page?: number
      limit?: number
      model?: string
      style?: string
      user_id?: string
      agent_id?: string
    } = {}
  ): Promise<EdenApiResponse<EdenCreationsResponse>> {
    const params = new URLSearchParams({
      q: query,
      page: (options.page || 1).toString(),
      limit: (options.limit || 50).toString(),
    })
    
    if (options.model) params.append('model', options.model)
    if (options.style) params.append('style', options.style)
    if (options.user_id) params.append('user_id', options.user_id)
    if (options.agent_id) params.append('agent_id', options.agent_id)
    
    return this.request<EdenCreationsResponse>(`/creations/search?${params}`)
  }
}

// Export singleton instance
export const edenApi = new EdenApiClient()

// Export helper functions for backward compatibility
export async function fetchAgentCreations(agentId: string): Promise<{ success: boolean; data: Creation[] }> {
  const response = await edenApi.getAgentCreations(agentId)
  return {
    success: response.success,
    data: response.data.docs
  }
}