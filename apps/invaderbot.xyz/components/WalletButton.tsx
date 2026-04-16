'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        alignItems: 'center'
      }}>
        <div style={{
          color: '#00ff00',
          fontSize: '9px',
          fontFamily: 'monospace',
          padding: '5px 10px',
          border: '1px solid #00ff00',
          background: '#001100'
        }}>
          [WALLET_CONNECTED] :: {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          style={{
            background: 'none',
            border: '1px solid #666',
            color: '#666',
            fontSize: '8px',
            padding: '3px 6px',
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          [DISCONNECT]
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => open()}
      style={{
        background: 'none',
        border: '1px solid #00ff00',
        color: '#00ff00',
        fontSize: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontFamily: 'monospace'
      }}
    >
      [CONNECT_WALLET] ►
    </button>
  )
}