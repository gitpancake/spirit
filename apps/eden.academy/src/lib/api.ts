export interface Agent {
  id: string
  tokenId: string
  owner: string
  metadataURI: string
  metadata: {
    name: string
    handle: string
    artist_wallet: string
    agentId: string
    description: string
    role: string
    public_persona: string
    tagline: string
    image: string
    system_instructions: string
    memory_context: string
    schedule: string
    medium: string
    daily_goal: string
    practice_actions: string[]
    technical_details: {
      model: string
      capabilities: string[]
    }
    social_revenue: {
      platforms: string[]
      revenue_model: string
    }
    lore_origin: {
      backstory: string
      motivation: string
    }
    auction?: {
      active: boolean
      contract: string
      chainId: number
    }
    smart_contracts?: {
      enabled: boolean
      address: string
      chainId: number
      type: 'auction' | 'fixed_price_sale'
      nft?: string  // Additional field for fixed_price_sale contracts
    }[]
    additional_fields: {
      genesis_cohort?: boolean
      migrated_from?: string
      original_agent_id?: string
      migration_date?: string
      agent_tags: string[]
    }
    collections?: string[]
  }
  imageUrl: string
  contractAddress: string
  chainId: number
  lastUpdated: string
  blockNumber: string
  transactionHash: string
  trainers: string[]
}

export interface CollectionWork {
  id: string
  title: string
  description?: string | null
  archiveNumber: number
  createdDate: string
  originalFilename: string
  ipfsHash: string
  imageUrl: string
  thumbnailUrl: string
  fullUrl: string
  metadata: {
    source: string
    archived: boolean
    format: string
    tags?: string[]
  }
}

export interface Collection {
  id: string
  artist: {
    name: string
    username: string
    futureUrl: string
  }
  title: string
  description: string
  totalWorks: number
  tags: string[]
}

export interface CollectionResponse {
  success: boolean
  data: {
    collection: Collection
    works: CollectionWork[]
  }
}

export interface AgentsResponse {
  success: boolean
  data: Agent[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export async function fetchAgents(): Promise<AgentsResponse> {
  try {
    const response = await fetch('/api/agents')
    if (!response.ok) {
      throw new Error('Failed to fetch agents')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching agents:', error)
    throw error
  }
}

export async function fetchWork(workName: string, offset = 0, limit = 20): Promise<CollectionResponse> {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString()
    })
    const response = await fetch(`/api/works/${workName}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch work: ${workName}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching work ${workName}:`, error)
    throw error
  }
}

export function getIpfsImageUrl(ipfsUrl: string): string {
  if (!ipfsUrl) {
    return ''
  }
  
  // If it's already a valid HTTP(S) URL, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl
  }
  
  // Handle ipfs:// protocol URLs
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '')
    return `https://gateway.pinata.cloud/ipfs/${hash}`
  }
  
  // Handle bare IPFS hashes (no protocol)
  if (ipfsUrl.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`
  }
  
  // If none of the above, return empty string
  return ''
}

