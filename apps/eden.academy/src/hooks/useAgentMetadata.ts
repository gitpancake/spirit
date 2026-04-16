'use client'

import { useState, useEffect } from 'react'
import { useIPFSUpload } from './useIPFSUpload'
import { useSetTokenURI } from './useSetTokenURI'
import { getContractConfig, getDefaultChainId } from '~/lib/contracts'

export interface AgentMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  // Training-specific metadata
  training?: {
    status: 'active' | 'paused' | 'completed'
    progress: number
    milestones: string[]
    dailyPractice: {
      streak: number
      lastSession: string
      totalHours: number
    }
  }
  // Performance metadata
  performance?: {
    responseTime: number
    accuracy: number
    totalInteractions: number
    lastUpdated: string
  }
  // Social metadata
  social?: {
    website?: string
    twitter?: string
    discord?: string
    linkedCollections: string[]
  }
  // Mission statement
  mission?: {
    statement: string
    specializations: string[]
    goals: string[]
  }
  // Auction and sales configuration
  marketplace?: {
    auctionConfig: {
      enabled: boolean
      startPrice: number
      reservePrice: number
      duration: number // hours
    }
    fixedPrice: {
      enabled: boolean
      price: number
      currency: 'ETH' | 'USD'
    }
  }
}

export function useAgentMetadata(tokenId: string) {
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { uploadToIPFS } = useIPFSUpload()
  const { setTokenURI, isPending: isUpdating } = useSetTokenURI()

  // Fetch current metadata
  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/agent/${tokenId}`)
        const data = await response.json()
        
        if (data.success && data.data.metadata) {
          setMetadata(data.data.metadata)
        } else {
          // Initialize with default metadata if none exists
          setMetadata({
            name: 'Unnamed Agent',
            description: 'No description available',
            image: '',
            attributes: [],
            training: {
              status: 'active',
              progress: 0,
              milestones: [],
              dailyPractice: {
                streak: 0,
                lastSession: '',
                totalHours: 0
              }
            },
            performance: {
              responseTime: 0,
              accuracy: 0,
              totalInteractions: 0,
              lastUpdated: new Date().toISOString()
            },
            social: {
              linkedCollections: []
            },
            mission: {
              statement: '',
              specializations: [],
              goals: []
            },
            marketplace: {
              auctionConfig: {
                enabled: false,
                startPrice: 0.01,
                reservePrice: 0.05,
                duration: 24
              },
              fixedPrice: {
                enabled: false,
                price: 0.1,
                currency: 'ETH'
              }
            }
          })
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
      } finally {
        setLoading(false)
      }
    }

    if (tokenId) {
      fetchMetadata()
    }
  }, [tokenId])

  // Update metadata and push to IPFS + blockchain
  const updateMetadata = async (updatedMetadata: Partial<AgentMetadata>) => {
    if (!metadata) {
      throw new Error('No metadata loaded')
    }

    try {
      const newMetadata = { ...metadata, ...updatedMetadata }
      
      // Upload to IPFS
      const ipfsResult = await uploadToIPFS(newMetadata)
      
      // Get contract configuration
      const contractConfig = getContractConfig(getDefaultChainId())
      if (!contractConfig) {
        throw new Error('Contract not configured')
      }
      
      // Update blockchain
      await setTokenURI({
        tokenId,
        contractAddress: contractConfig.address,
        newMetadataURI: ipfsResult.url
      })
      
      // Update local state
      setMetadata(newMetadata)
      
      return ipfsResult
    } catch (error) {
      console.error('Failed to update metadata:', error)
      throw error
    }
  }

  // Helper function to update specific sections
  const updateTraining = async (trainingData: Partial<AgentMetadata['training']>) => {
    const updatedTraining = { 
      status: 'active' as const,
      progress: 0,
      milestones: [],
      dailyPractice: {
        streak: 0,
        lastSession: '',
        totalHours: 0
      },
      ...metadata?.training, 
      ...trainingData 
    }
    return updateMetadata({ training: updatedTraining })
  }

  const updatePerformance = async (performanceData: Partial<AgentMetadata['performance']>) => {
    const updatedPerformance = { 
      responseTime: 0,
      accuracy: 0,
      totalInteractions: 0,
      ...metadata?.performance, 
      ...performanceData,
      lastUpdated: new Date().toISOString()
    }
    return updateMetadata({ performance: updatedPerformance })
  }

  const updateSocial = async (socialData: Partial<AgentMetadata['social']>) => {
    const updatedSocial = { 
      linkedCollections: [],
      ...metadata?.social, 
      ...socialData 
    }
    return updateMetadata({ social: updatedSocial })
  }

  const updateMission = async (missionData: Partial<AgentMetadata['mission']>) => {
    const updatedMission = { 
      statement: '',
      specializations: [],
      goals: [],
      ...metadata?.mission, 
      ...missionData 
    }
    return updateMetadata({ mission: updatedMission })
  }

  const updateMarketplace = async (marketplaceData: Partial<AgentMetadata['marketplace']>) => {
    const updatedMarketplace = { 
      auctionConfig: {
        enabled: false,
        startPrice: 0.01,
        reservePrice: 0.05,
        duration: 24
      },
      fixedPrice: {
        enabled: false,
        price: 0.1,
        currency: 'ETH' as const
      },
      ...metadata?.marketplace, 
      ...marketplaceData 
    }
    return updateMetadata({ marketplace: updatedMarketplace })
  }

  return {
    metadata,
    loading,
    error,
    isUpdating,
    updateMetadata,
    updateTraining,
    updatePerformance,
    updateSocial,
    updateMission,
    updateMarketplace,
    refetch: () => {
      setLoading(true)
      // Re-run the effect by clearing and setting metadata
      setMetadata(null)
    }
  }
}