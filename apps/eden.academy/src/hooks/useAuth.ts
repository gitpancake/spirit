'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth'

export function useAuth() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout, 
    linkEmail, 
    linkWallet, 
    unlinkEmail, 
    unlinkWallet 
  } = usePrivy()
  
  const { wallets } = useWallets()

  const connectedWallet = wallets.find(wallet => wallet.connectorType !== 'embedded') || wallets[0]
  const embeddedWallet = wallets.find(wallet => wallet.connectorType === 'embedded')

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    wallets,
    connectedWallet,
    embeddedWallet,
  }
}