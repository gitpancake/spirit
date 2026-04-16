'use client'

import { useEffect, useState } from 'react'

export function useContractAddress() {
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContractAddress() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/config/contract-address')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contract address: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.contractAddress) {
          setContractAddress(data.contractAddress)
        } else {
          throw new Error('Invalid response format or missing contract address')
        }
      } catch (err) {
        console.error('Error fetching contract address:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch contract address')
        setContractAddress(null)
      } finally {
        setLoading(false)
      }
    }

    fetchContractAddress()
  }, [])

  return {
    contractAddress,
    loading,
    error,
    refetch: () => {
      // Reset state and fetch again
      setLoading(true)
      setError(null)
      setContractAddress(null)
      
      fetch('/api/config/contract-address')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setContractAddress(data.contractAddress)
          } else {
            throw new Error('Invalid response format')
          }
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to fetch contract address')
          setContractAddress(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }
}