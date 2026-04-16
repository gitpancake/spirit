import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { env } from './env'

// Use single RPC_URL - points to Sepolia RPC for development, Mainnet RPC for production
const RPC_URL = env.PUBLIC.RPC_URL

// Simple: development = Sepolia, production = Mainnet
const isDevelopment = process.env.NODE_ENV === 'development'

export const config = createConfig({
  chains: isDevelopment ? [sepolia] : [mainnet],
  transports: {
    [sepolia.id]: http(RPC_URL),
    [mainnet.id]: http(RPC_URL),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}