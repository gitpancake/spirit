'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { formatEther } from 'viem'
import { getDelegationState, getEligibility } from '~/lib/governance/eligibility'
import { fetchProposals, type Proposal } from '~/lib/governance/proposals'
import { getProposalState } from '~/lib/governance/actions'
import DelegationPanel from './DelegationPanel'
import ProposalList from './ProposalList'
import ProposeForm from './ProposeForm'

interface GovernanceDashboardProps {
  agentName: string
}

export default function GovernanceDashboard({}: GovernanceDashboardProps) {
  const { address, isConnected } = useAccount()
  const config = useConfig()
  
  const [activeSection, setActiveSection] = useState<'overview' | 'proposals' | 'propose'>('overview')
  const [delegationState, setDelegationState] = useState({
    balance: BigInt(0),
    votes: BigInt(0),
    delegatee: `0x${'0'.repeat(40)}` as const,
    symbol: '',
    decimals: 18,
  })
  const [eligibility, setEligibility] = useState({
    canPropose: false,
    threshold: BigInt(0),
    votes: BigInt(0),
  })
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [proposalStates, setProposalStates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGovernanceData() {
      try {
        setLoading(true)
        
        // Load basic data
        const [delegationData, eligibilityData, proposalsData] = await Promise.all([
          getDelegationState(config, address),
          getEligibility(config, address),
          fetchProposals(config),
        ])

        setDelegationState(delegationData)
        setEligibility(eligibilityData)
        setProposals(proposalsData)

        // Load proposal states
        if (proposalsData.length > 0) {
          const states: Record<string, number> = {}
          await Promise.all(
            proposalsData.map(async (proposal) => {
              try {
                const state = await getProposalState(config, proposal.id)
                states[proposal.id.toString()] = state as number
              } catch (error) {
                console.error(`Error loading state for proposal ${proposal.id}:`, error)
                states[proposal.id.toString()] = 0 // Default to Pending
              }
            })
          )
          setProposalStates(states)
        }
      } catch (error) {
        console.error('Error loading governance data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && address) {
      loadGovernanceData()
    } else {
      setLoading(false)
    }
  }, [address, isConnected, config])

  const needsDelegation = delegationState.balance > BigInt(0) && delegationState.votes === BigInt(0)

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zM4 9V7a8 8 0 118 8v2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Connect Wallet</h3>
        <p className="text-white/60">Connect your wallet to participate in governance</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60">Loading governance data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white">Governance</h2>
        <div className="flex space-x-1 bg-white/5 border border-white/10 rounded p-1">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${
              activeSection === 'overview'
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('proposals')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${
              activeSection === 'proposals'
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Proposals
          </button>
          <button
            onClick={() => setActiveSection('propose')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${
              activeSection === 'propose'
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Propose
          </button>
        </div>
      </div>

      {/* Delegation Warning */}
      {needsDelegation && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.052 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-yellow-400 font-medium">Delegation Required</h4>
              <p className="text-yellow-300/80 text-sm mt-1">
                You have {delegationState.symbol} tokens but no voting power. Delegate to yourself or another address to participate in governance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Voting Power */}
          <div className="bg-white/5 border border-white/10 rounded p-6 space-y-4">
            <h3 className="text-lg font-medium text-white">Your Voting Power</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Balance</span>
                <span className="text-white text-sm">
                  {formatEther(delegationState.balance)} {delegationState.symbol}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Voting Power</span>
                <span className="text-white text-sm">
                  {formatEther(delegationState.votes)} votes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Can Propose</span>
                <span className={`text-sm ${eligibility.canPropose ? 'text-green-400' : 'text-red-400'}`}>
                  {eligibility.canPropose ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Delegation */}
          <DelegationPanel 
            delegationState={delegationState}
            onUpdate={() => {
              // Reload governance data after delegation
              getDelegationState(config, address).then(setDelegationState)
              getEligibility(config, address).then(setEligibility)
            }}
          />
        </div>
      )}

      {activeSection === 'proposals' && (
        <ProposalList 
          proposals={proposals}
          proposalStates={proposalStates}
          onVote={() => {
            // Optionally refresh data after voting
          }}
        />
      )}

      {activeSection === 'propose' && (
        <ProposeForm 
          eligibility={eligibility}
          onProposed={() => {
            // Refresh proposals after successful proposal
            fetchProposals(config).then(setProposals)
            setActiveSection('proposals')
          }}
        />
      )}
    </div>
  )
}