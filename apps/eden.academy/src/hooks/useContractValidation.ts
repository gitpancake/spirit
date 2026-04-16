'use client'

import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { getContractConfig, getDefaultChainId } from '~/lib/contracts'
import type { Agent } from '~/lib/api'

interface ContractValidationResult {
  isValid: boolean
  localAddress: string
  apiAddress?: string
  error?: string
  loading: boolean
}

interface UseContractValidationProps {
  agent: Agent | null
}

export function useContractValidation({ agent }: UseContractValidationProps): ContractValidationResult {
  const chainId = useChainId()
  const [result, setResult] = useState<ContractValidationResult>({
    isValid: true,
    localAddress: '',
    loading: true
  })

  useEffect(() => {
    if (!agent) {
      setResult({
        isValid: true,
        localAddress: '',
        loading: false
      })
      return
    }

    const contractConfig = getContractConfig(chainId || getDefaultChainId())
    
    if (!contractConfig) {
      setResult({
        isValid: false,
        localAddress: '',
        error: 'Contract configuration not found for current chain',
        loading: false
      })
      return
    }

    const localAddress = contractConfig.address.toLowerCase()
    const apiAddress = agent.contractAddress?.toLowerCase()

    // If API doesn't provide contract address, we can't validate but assume it's okay
    if (!apiAddress) {
      setResult({
        isValid: true,
        localAddress: contractConfig.address,
        loading: false
      })
      return
    }

    // Compare addresses
    const isValid = localAddress === apiAddress

    setResult({
      isValid,
      localAddress: contractConfig.address,
      apiAddress: agent.contractAddress,
      error: isValid ? undefined : `Contract address mismatch: Local (${contractConfig.address}) vs API (${agent.contractAddress})`,
      loading: false
    })
  }, [agent, chainId])

  return result
}