'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useConfig } from 'wagmi'
import { isAddress, type Address, type Hex } from 'viem'
import { propose } from '~/lib/governance/actions'
import { formatEther } from 'viem'

interface EligibilityState {
  canPropose: boolean
  threshold: bigint
  votes: bigint
}

interface ProposeFormProps {
  eligibility: EligibilityState
  onProposed: () => void
}

export default function ProposeForm({ eligibility, onProposed }: ProposeFormProps) {
  const config = useConfig()
  
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [calldata, setCalldata] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eligibility.canPropose) {
      setError('Insufficient voting power to create proposals')
      return
    }

    if (!description.trim()) {
      setError('Description is required')
      return
    }

    // For now, support simple proposals without specific targets
    // In a full implementation, you'd want a more sophisticated form
    const targets: Address[] = target && isAddress(target) ? [target as Address] : []
    const values: bigint[] = targets.length > 0 ? [BigInt(0)] : []
    const calldatas: Hex[] = targets.length > 0 && calldata ? [calldata as Hex] : targets.length > 0 ? ['0x' as Hex] : []
    
    // If no specific action, create a signaling proposal
    if (targets.length === 0) {
      // Empty proposal (signaling only)
      targets.push('0x0000000000000000000000000000000000000000' as Address)
      values.push(BigInt(0))
      calldatas.push('0x' as Hex)
    }

    try {
      setLoading(true)
      setError('')
      
      await propose(config, {
        targets,
        values,
        calldatas,
        description: description.trim(),
      })
      
      // Reset form
      setDescription('')
      setTarget('')
      setCalldata('')
      
      setTimeout(onProposed, 2000) // Wait for confirmation
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded p-6">
      <h3 className="text-lg font-medium text-white mb-6">Create Proposal</h3>
      
      {/* Eligibility Check */}
      {!eligibility.canPropose && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.052 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-red-400 font-medium">Insufficient Voting Power</h4>
              <p className="text-red-300/80 text-sm mt-1">
                You need at least {formatEther(eligibility.threshold)} votes to create proposals. 
                You currently have {formatEther(eligibility.votes)} votes.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handlePropose} className="space-y-4">
        {/* Description */}
        <div className="space-y-2">
          <label className="block text-white font-medium text-sm">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setError('')
            }}
            placeholder="Describe your proposal in detail..."
            rows={4}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
            required
          />
          <p className="text-white/50 text-xs">
            Provide a clear description of what you&apos;re proposing and why it should be implemented.
          </p>
        </div>

        {/* Advanced Options */}
        <details className="space-y-4">
          <summary className="text-white font-medium text-sm cursor-pointer hover:text-white/80">
            Advanced: Custom Action (Optional)
          </summary>
          
          <div className="space-y-4 pl-4 border-l-2 border-white/10">
            <div className="space-y-2">
              <label className="block text-white font-medium text-sm">
                Target Contract Address
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/20 font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-white font-medium text-sm">
                Calldata
              </label>
              <input
                type="text"
                value={calldata}
                onChange={(e) => setCalldata(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/20 font-mono text-sm"
              />
            </div>
            
            <p className="text-white/50 text-xs">
              Leave empty for signaling proposals. For contract calls, specify the target address and encoded function call.
            </p>
          </div>
        </details>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !eligibility.canPropose}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 font-medium transition-colors rounded bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-white/40"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating Proposal...</span>
            </>
          ) : (
            <span>Create Proposal</span>
          )}
        </button>
        
        {eligibility.canPropose && (
          <p className="text-white/50 text-xs text-center">
            Your proposal will be subject to community voting once created.
          </p>
        )}
      </form>
    </div>
  )
}