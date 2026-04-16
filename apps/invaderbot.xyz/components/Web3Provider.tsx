'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { State, WagmiProvider } from 'wagmi'
import { config, projectId } from '@/lib/web3-config'
import { ReactNode } from 'react'

// Setup queryClient
const queryClient = new QueryClient()

// Create modal
createWeb3Modal({
  projectId,
  wagmiConfig: config,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00ff00',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'monospace',
    '--w3m-border-radius-master': '0px'
  }
})

export default function Web3Provider({
  children,
  initialState
}: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}