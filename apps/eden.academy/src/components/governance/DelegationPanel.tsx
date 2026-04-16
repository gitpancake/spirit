'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { isAddress } from 'viem'
import { delegateToSelf, delegateTo } from '~/lib/governance/actions'

interface DelegationState {
  balance: bigint
  votes: bigint
  delegatee: `0x${string}`
  symbol: string
  decimals: number
}

interface DelegationPanelProps {
  delegationState: DelegationState
  onUpdate: () => void
}

export default function DelegationPanel({ delegationState, onUpdate }: DelegationPanelProps) {
  const { address } = useAccount()
  const config = useConfig()
  
  const [delegateAddress, setDelegateAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDelegatingToSelf = delegationState.delegatee.toLowerCase() === address?.toLowerCase()
  const hasBalance = delegationState.balance > BigInt(0)

  const handleDelegateToSelf = async () => {
    if (!address || loading) return
    
    try {
      setLoading(true)
      setError('')
      await delegateToSelf(config, address)
      setTimeout(onUpdate, 2000) // Wait for transaction to confirm
    } catch (err: any) {
      setError(err.message || 'Failed to delegate to self')
    } finally {
      setLoading(false)
    }
  }

  const handleDelegateTo = async () => {
    if (!address || !delegateAddress || loading) return
    
    if (!isAddress(delegateAddress)) {
      setError('Please enter a valid Ethereum address')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      await delegateTo(config, delegateAddress as `0x${string}`)
      setTimeout(onUpdate, 2000) // Wait for transaction to confirm
      setDelegateAddress('')
    } catch (err: any) {
      setError(err.message || 'Failed to delegate')
    } finally {
      setLoading(false)
    }
  }

  if (!hasBalance) {
    return (
      <div className="bg-white/5 border border-white/10 rounded p-6">
        <h3 className="text-lg font-medium text-white mb-4">Delegation</h3>
        <div className="text-center py-4">
          <p className="text-white/60 text-sm">No {delegationState.symbol} tokens to delegate</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded p-6 space-y-4">
      <h3 className="text-lg font-medium text-white">Delegation</h3>
      
      {/* Current Delegation */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">Delegated to</span>
          <span className="text-white text-xs font-mono">
            {delegationState.delegatee === `0x${'0'.repeat(40)}` 
              ? 'None' 
              : `${delegationState.delegatee.slice(0, 6)}...${delegationState.delegatee.slice(-4)}`
            }
          </span>
        </div>
        {isDelegatingToSelf && (
          <p className="text-green-400 text-xs">✓ Self-delegated</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Self Delegation */}
      <div className="space-y-3">
        <button
          onClick={handleDelegateToSelf}
          disabled={loading || isDelegatingToSelf}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-white/40"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : isDelegatingToSelf ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Self-Delegated</span>
            </>
          ) : (
            <span>Delegate to Self</span>
          )}
        </button>

        {/* Delegate to Another Address */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter address to delegate to..."
            value={delegateAddress}
            onChange={(e) => {
              setDelegateAddress(e.target.value)
              setError('')
            }}
            className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={handleDelegateTo}
            disabled={loading || !delegateAddress.trim()}
            className="w-full px-4 py-2 text-sm font-medium transition-colors rounded bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-white/40"
          >
            Delegate
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10">
        <p className="text-white/50 text-xs">
          Delegating gives voting power to the chosen address. You can change your delegation at any time.
        </p>
      </div>
    </div>
  )
}