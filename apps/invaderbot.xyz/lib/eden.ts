const EDEN_API_BASE = 'https://staging.api.eden.art/v2'

export interface EdenCreation {
  url: string
  thumbnail: string
  name: string
  filename: string
  _id: string
  createdAt: string
  updatedAt: string
  public: boolean
  deleted: boolean
  likeCount: number
  mediaAttributes: {
    mimeType: string
    width: number
    height: number
    aspectRatio: number
    blurhash?: string
  }
  agent: {
    _id: string
    name: string
    type: string
    username: string
    userImage: string | null
  }
  user: {
    _id: string
    userId: string
    type: string
    username: string
    userImage: string
  }
  task: {
    _id: string
    args: {
      output: string
      prompt: string
      aspect_ratio: string
      extras: any[]
      duration?: number
      lora_strength?: number
      lora2_strength?: number
      quality?: string
      n_samples?: number
    }
  }
  tool: string
  attributes?: any
}

export interface EdenCreationsResponse {
  docs: EdenCreation[]
  totalDocs?: number
  limit?: number
  offset?: number
  totalPages?: number
  page?: number
  pagingCounter?: number
  hasPrevPage?: boolean
  hasNextPage?: boolean
  prevPage?: number | null
  nextPage?: number | null
  cursor?: string | null
}

export async function fetchAgentCreations(
  agentId: string, 
  limit: number = 10,
  cursor?: string | null
): Promise<EdenCreationsResponse> {
  try {
    let url = `${EDEN_API_BASE}/agents/${agentId}/creations?limit=${limit}`
    if (cursor) {
      url += `&cursor=${cursor}`
    }
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Eden API error: ${response.status} ${response.statusText}`)
    }

    const data: EdenCreationsResponse = await response.json()
    return data
  } catch (error: any) {
    // Suppress verbose proxy/network errors, only log essential info
    const errorMsg = error?.message || 'Network error'
    if (!errorMsg.includes('Proxy Authentication') && !errorMsg.includes('407')) {
      console.error('Error fetching Eden agent creations:', errorMsg)
    }
    throw new Error('Failed to fetch Eden creations')
  }
}

export function formatCreationForDisplay(creation: EdenCreation, index: number) {
  return {
    id: creation._id,
    title: `GENESIS_${String(index + 1).padStart(3, '0')}`,
    description: creation.name,
    prompt: creation.task?.args?.prompt || creation.name,
    imageUrl: creation.url,
    thumbnailUrl: creation.thumbnail,
    filename: creation.filename,
    dimensions: {
      width: creation.mediaAttributes.width,
      height: creation.mediaAttributes.height,
      aspectRatio: creation.mediaAttributes.aspectRatio
    },
    mimeType: creation.mediaAttributes.mimeType,
    createdAt: creation.createdAt,
    updatedAt: creation.updatedAt,
    likeCount: creation.likeCount,
    agent: creation.agent,
    user: creation.user,
    quality: creation.task?.args?.quality || 'standard',
    aspectRatio: creation.task?.args?.aspect_ratio || '1:1'
  }
}