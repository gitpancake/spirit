import { useAccount, useSwitchChain } from 'wagmi'
import { useCallback, useMemo } from 'react'
import { env } from '~/lib/env'

export interface NetworkValidation {
  isCorrectNetwork: boolean
  currentChainId?: number
  requiredChainId: number
  requiredChainName: string
  canSwitchNetwork: boolean
  switchNetwork: () => Promise<void>
  networkError?: string
}

/**
 * Hook to validate and manage network switching for blockchain transactions
 * Ensures users are on the correct chain before executing transactions
 */
export function useNetworkValidation(): NetworkValidation {
  const { chainId: currentChainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain()
  
  const requiredChainId = env.PUBLIC.DEFAULT_CHAIN_ID
  
  // Get human-readable chain name
  const requiredChainName = useMemo(() => {
    switch (requiredChainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 11155111:
        return 'Sepolia Testnet'
      default:
        return `Chain ${requiredChainId}`
    }
  }, [requiredChainId])

  // Check if we're on the correct network
  const isCorrectNetwork = useMemo(() => {
    if (!isConnected || !currentChainId) return false
    return currentChainId === requiredChainId
  }, [currentChainId, requiredChainId, isConnected])

  // Function to switch to the required network
  const switchNetwork = useCallback(async () => {
    if (!switchChain) {
      throw new Error('Network switching not available')
    }
    
    try {
      await switchChain({ chainId: requiredChainId as 1 | 11155111 })
    } catch (error) {
      console.error('Failed to switch network:', error)
      throw error
    }
  }, [switchChain, requiredChainId])

  return {
    isCorrectNetwork,
    currentChainId,
    requiredChainId,
    requiredChainName,
    canSwitchNetwork: !!switchChain && !isSwitching,
    switchNetwork,
    networkError: switchError?.message,
  }
}

/**
 * Hook for validating network before transaction execution
 * Returns validation status and helper functions for UI
 */
export function useTransactionValidation() {
  const networkValidation = useNetworkValidation()
  const { isConnected } = useAccount()

  const canExecuteTransaction = useMemo(() => {
    return isConnected && networkValidation.isCorrectNetwork
  }, [isConnected, networkValidation.isCorrectNetwork])

  const getValidationMessage = useCallback(() => {
    if (!isConnected) {
      return 'Please connect your wallet'
    }
    
    if (!networkValidation.isCorrectNetwork) {
      return `Please switch to ${networkValidation.requiredChainName}`
    }
    
    return null
  }, [isConnected, networkValidation.isCorrectNetwork, networkValidation.requiredChainName])

  return {
    ...networkValidation,
    canExecuteTransaction,
    getValidationMessage,
    isConnected,
  }
}