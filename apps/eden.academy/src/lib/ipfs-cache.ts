/* eslint-disable @typescript-eslint/no-explicit-any */

interface CachedMetadata {
  hash: string
  metadata: any
  timestamp: number
  expiresAt: number
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const CACHE_KEY_PREFIX = 'ipfs_metadata_cache_'

export class IPFSMetadataCache {
  private static instance: IPFSMetadataCache
  private cache: Map<string, CachedMetadata>

  private constructor() {
    this.cache = new Map()
    this.loadFromLocalStorage()
  }

  static getInstance(): IPFSMetadataCache {
    if (!IPFSMetadataCache.instance) {
      IPFSMetadataCache.instance = new IPFSMetadataCache()
    }
    return IPFSMetadataCache.instance
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX))
      
      keys.forEach(key => {
        const cachedData = localStorage.getItem(key)
        if (cachedData) {
          const parsed: CachedMetadata = JSON.parse(cachedData)
          const hash = key.replace(CACHE_KEY_PREFIX, '')
          
          // Check if cache entry is still valid
          if (parsed.expiresAt > Date.now()) {
            this.cache.set(hash, parsed)
          } else {
            // Remove expired entry
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.warn('Error loading IPFS cache from localStorage:', error)
    }
  }

  private saveToLocalStorage(hash: string, metadata: CachedMetadata): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${hash}`, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Error saving IPFS cache to localStorage:', error)
    }
  }

  extractHashFromURI(uri: string): string | null {
    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', '')
    }

    // Handle HTTP(S) IPFS gateway URLs
    const gatewayMatch = uri.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    if (gatewayMatch) {
      return gatewayMatch[1]
    }

    // Handle direct IPFS hash
    if (uri.match(/^[a-zA-Z0-9]{46,59}$/)) {
      return uri
    }

    return null
  }

  async fetchMetadata(uri: string): Promise<any> {
    const hash = this.extractHashFromURI(uri)
    
    if (!hash) {
      throw new Error(`Invalid IPFS URI: ${uri}`)
    }

    // Check cache first
    const cached = this.cache.get(hash)
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache hit for IPFS hash: ${hash}`)
      return cached.metadata
    }

    console.log(`Cache miss for IPFS hash: ${hash}, fetching from IPFS...`)

    // Fetch from IPFS
    const gatewayUrl = uri.startsWith('ipfs://') 
      ? `https://gateway.pinata.cloud/ipfs/${hash}`
      : uri

    try {
      const response = await fetch(gatewayUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const metadata = await response.json()
      
      // Cache the result
      const cachedMetadata: CachedMetadata = {
        hash,
        metadata,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      }

      this.cache.set(hash, cachedMetadata)
      this.saveToLocalStorage(hash, cachedMetadata)

      return metadata
    } catch (error) {
      console.error(`Error fetching IPFS metadata for hash ${hash}:`, error)
      throw error
    }
  }

  getCachedMetadata(uri: string): any | null {
    const hash = this.extractHashFromURI(uri)
    if (!hash) return null

    const cached = this.cache.get(hash)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.metadata
    }

    return null
  }

  clearCache(): void {
    this.cache.clear()
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }

  getCacheStats(): { totalEntries: number, validEntries: number, expiredEntries: number } {
    let validEntries = 0
    let expiredEntries = 0
    const now = Date.now()

    this.cache.forEach(cached => {
      if (cached.expiresAt > now) {
        validEntries++
      } else {
        expiredEntries++
      }
    })

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    }
  }
}

export const ipfsCache = IPFSMetadataCache.getInstance()