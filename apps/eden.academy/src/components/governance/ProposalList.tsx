'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useConfig } from 'wagmi'
import { castVote, queue, execute } from '~/lib/governance/actions'
import { formatProposalActions, type Proposal } from '~/lib/governance/proposals'
import { ProposalStateNames } from '~/lib/governance/abi'

interface ProposalListProps {
  proposals: Proposal[]
  proposalStates: Record<string, number>
  onVote: () => void
}

export default function ProposalList({ proposals, proposalStates, onVote }: ProposalListProps) {
  const config = useConfig()
  const [votingLoading, setVotingLoading] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVote = async (proposalId: bigint, support: 0 | 1 | 2, reason = '') => {
    const id = proposalId.toString()
    
    try {
      setVotingLoading(prev => ({ ...prev, [id]: true }))
      setErrors(prev => ({ ...prev, [id]: '' }))
      
      await castVote(config, proposalId, support, reason)
      setTimeout(onVote, 2000) // Wait for confirmation
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message || 'Failed to cast vote' }))
    } finally {
      setVotingLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleQueue = async (proposal: Proposal) => {
    const id = proposal.id.toString()
    
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }))
      setErrors(prev => ({ ...prev, [id]: '' }))
      
      await queue(config, {
        targets: proposal.targets,
        values: proposal.values,
        calldatas: proposal.calldatas,
        description: proposal.description,
      })
      
      setTimeout(onVote, 2000) // Refresh data
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message || 'Failed to queue proposal' }))
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleExecute = async (proposal: Proposal) => {
    const id = proposal.id.toString()
    
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }))
      setErrors(prev => ({ ...prev, [id]: '' }))
      
      await execute(config, {
        targets: proposal.targets,
        values: proposal.values,
        calldatas: proposal.calldatas,
        description: proposal.description,
      })
      
      setTimeout(onVote, 2000) // Refresh data
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message || 'Failed to execute proposal' }))
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const getStateColor = (state: number) => {
    switch (state) {
      case 1: return 'text-blue-400 bg-blue-400/10' // Active
      case 4: return 'text-green-400 bg-green-400/10' // Succeeded
      case 5: return 'text-yellow-400 bg-yellow-400/10' // Queued
      case 7: return 'text-purple-400 bg-purple-400/10' // Executed
      case 3: return 'text-red-400 bg-red-400/10' // Defeated
      default: return 'text-white/60 bg-white/10' // Other states
    }
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Proposals</h3>
        <p className="text-white/60">No governance proposals found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const state = proposalStates[proposal.id.toString()] ?? 0
        const stateColor = getStateColor(state)
        const id = proposal.id.toString()
        const actions = formatProposalActions(proposal)
        
        return (
          <div key={id} className="bg-white/5 border border-white/10 rounded p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-white font-medium">Proposal #{proposal.id.toString()}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${stateColor}`}>
                    {ProposalStateNames[state as keyof typeof ProposalStateNames] || 'Unknown'}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  Proposed by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm">Description</h4>
              <p className="text-white/80 text-sm leading-relaxed">{proposal.description}</p>
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium text-sm">Actions</h4>
                <div className="space-y-1">
                  {actions.map((action, i) => (
                    <div key={i} className="bg-white/5 rounded p-3">
                      <p className="text-white/80 text-xs font-mono break-all">{action.display}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors[id] && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <p className="text-red-400 text-xs">{errors[id]}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2 border-t border-white/10">
              {state === 1 && ( // Active - can vote
                <>
                  <button
                    onClick={() => handleVote(proposal.id, 1)}
                    disabled={votingLoading[id]}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:bg-green-500/10 disabled:text-green-400/50 rounded transition-colors"
                  >
                    <span>For</span>
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 0)}
                    disabled={votingLoading[id]}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:bg-red-500/10 disabled:text-red-400/50 rounded transition-colors"
                  >
                    <span>Against</span>
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 2)}
                    disabled={votingLoading[id]}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-white/10 text-white/60 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 rounded transition-colors"
                  >
                    <span>Abstain</span>
                  </button>
                </>
              )}
              
              {state === 4 && ( // Succeeded - can queue
                <button
                  onClick={() => handleQueue(proposal)}
                  disabled={actionLoading[id]}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 disabled:bg-yellow-500/10 disabled:text-yellow-400/50 rounded transition-colors"
                >
                  {actionLoading[id] ? (
                    <>
                      <div className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                      <span>Queueing...</span>
                    </>
                  ) : (
                    <span>Queue</span>
                  )}
                </button>
              )}
              
              {state === 5 && ( // Queued - can execute (after timelock)
                <button
                  onClick={() => handleExecute(proposal)}
                  disabled={actionLoading[id]}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:bg-purple-500/10 disabled:text-purple-400/50 rounded transition-colors"
                >
                  {actionLoading[id] ? (
                    <>
                      <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                      <span>Executing...</span>
                    </>
                  ) : (
                    <span>Execute</span>
                  )}
                </button>
              )}

              {votingLoading[id] && (
                <div className="flex items-center space-x-2 text-white/60">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs">Voting...</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}