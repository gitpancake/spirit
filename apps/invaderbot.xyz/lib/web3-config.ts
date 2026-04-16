import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId from environment or use provided one
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '5b8a00ae671d7fb3fa12a97d00c92b16'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'INVADERBOT :: NFT Analysis & Purchase',
  description: 'AI-powered NFT analysis with direct purchase capabilities',
  url: 'https://invaderbot.xyz', 
  icons: ['https://invaderbot.xyz/icon.svg']
}

// Create wagmiConfig
const chains = [mainnet, sepolia] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  })
})