import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { env } from '~/lib/env'

export interface SmartWalletCapabilities {
  isSmartWallet: boolean
  canSponsorGas: boolean
  smartWalletAddress?: string
  smartWalletClient?: unknown
}

/**
 * Hook to manage smart wallet functionality and gas sponsorship
 * Provides information about whether the current user has smart wallet capabilities
 * and can use gas sponsorship features
 */
export function useSmartWallet(): SmartWalletCapabilities {
  const { user, authenticated } = usePrivy()
  const { wallets } = useWallets()
  // const { address } = useAccount() // Not used in this hook currently

  const capabilities = useMemo(() => {
    if (!authenticated || !user) {
      return {
        isSmartWallet: false,
        canSponsorGas: false,
      }
    }

    // Check if user has smart wallets in their wallet list
    const smartWallets = wallets.filter(wallet => wallet.walletClientType === 'smart-wallet')
    const hasSmartWallet = smartWallets.length > 0
    const smartWalletAddress = smartWallets[0]?.address

    // Gas sponsorship is available if we have smart wallets and proper configuration
    const hasPaymasterConfig = !!(env.PUBLIC.PAYMASTER_URL && env.PUBLIC.BUNDLER_URL)
    const canSponsorGas = hasSmartWallet && hasPaymasterConfig

    return {
      isSmartWallet: hasSmartWallet,
      canSponsorGas,
      smartWalletAddress,
      smartWalletClient: smartWallets[0], // Return the first smart wallet
    }
  }, [authenticated, user, wallets])

  return capabilities
}

/**
 * Helper hook to determine if a transaction should use gas sponsorship
 * Returns true if smart wallet is available and gas sponsorship is enabled
 */
export function useGasSponsorship() {
  const { canSponsorGas, smartWalletClient } = useSmartWallet()
  
  return {
    shouldSponsorGas: canSponsorGas,
    smartWalletClient,
  }
}

/**
 * Hook to get the appropriate wallet client for transactions
 * Returns smart wallet client if gas sponsorship is available, otherwise regular wallet
 */
export function useWalletClient() {
  const { smartWalletClient, canSponsorGas } = useSmartWallet()
  
  // Return smart wallet client for gas sponsorship, or null to fall back to wagmi
  return canSponsorGas ? smartWalletClient : null
}