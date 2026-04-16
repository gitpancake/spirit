'use client'

import { useState } from 'react'
import { Agent } from '~/lib/api'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'
import Image from 'next/image'
import { getIpfsImageUrl } from '~/lib/api'

interface TrainerManagementProps {
  agents?: Agent[]
  loading: boolean
}

export function TrainerManagement({ agents, loading }: TrainerManagementProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [trainerAddress, setTrainerAddress] = useState('')
  const [action, setAction] = useState<'add' | 'remove'>('add')

  const { address } = useAccount()
  const contractConfig = getContractConfig(getDefaultChainId())

  const { 
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !selectedAgent) return

    try {
      const functionName = action === 'add' ? 'addTrainer' : 'removeTrainer'
      
      writeContract({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName,
        args: [
          BigInt(selectedAgent.tokenId),
          trainerAddress as `0x${string}`
        ],
      })
    } catch (error) {
      console.error('Error managing trainer:', error)
    }
  }

  const resetForm = () => {
    setSelectedAgent(null)
    setTrainerAddress('')
    setAction('add')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Available</h3>
        <p className="text-gray-600">Register some agents first to manage their trainers.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Trainers</h3>
        <p className="text-gray-600">
          Add or remove trainer permissions for agents. Trainers can access training mode for their assigned agents.
        </p>
      </div>

      {/* Success State */}
      {isConfirmed && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Trainer {action === 'add' ? 'Added' : 'Removed'} Successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {action === 'add' 
                  ? `${trainerAddress} has been granted trainer access for ${selectedAgent?.metadata.name}.`
                  : `${trainerAddress} has been removed as a trainer for ${selectedAgent?.metadata.name}.`
                }
              </p>
              <button
                onClick={resetForm}
                className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
              >
                Manage Another Trainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {(writeError || receiptError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Operation Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {writeError?.message || receiptError?.message || 'An error occurred while managing the trainer.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Pending */}
      {(isWritePending || isConfirming) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                {isWritePending ? 'Confirming Transaction...' : 'Processing...'}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {isWritePending 
                  ? 'Please confirm the transaction in your wallet.'
                  : 'Transaction submitted. Waiting for blockchain confirmation...'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trainer Management Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Action
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="add"
                    checked={action === 'add'}
                    onChange={(e) => setAction(e.target.value as 'add' | 'remove')}
                    className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Add Trainer</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="remove"
                    checked={action === 'remove'}
                    onChange={(e) => setAction(e.target.value as 'add' | 'remove')}
                    className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Remove Trainer</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value)
                  setSelectedAgent(agent || null)
                }}
              >
                <option value="">Choose an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    #{agent.tokenId} - {agent.metadata.name} (@{agent.metadata.handle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="0x..."
                value={trainerAddress}
                onChange={(e) => setTrainerAddress(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                The wallet address to {action === 'add' ? 'grant trainer access to' : 'remove trainer access from'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedAgent || !trainerAddress || !address || !contractConfig || isWritePending || isConfirming || isConfirmed}
                className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isWritePending || isConfirming 
                  ? `${action === 'add' ? 'Adding' : 'Removing'} Trainer...` 
                  : `${action === 'add' ? 'Add' : 'Remove'} Trainer`
                }
              </button>
            </div>
          </form>
        </div>

        {/* Agent Preview */}
        <div>
          {selectedAgent ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Selected Agent</h4>
              
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 flex-shrink-0">
                  {getIpfsImageUrl(selectedAgent.metadata.image) ? (
                    <Image
                      src={getIpfsImageUrl(selectedAgent.metadata.image)}
                      alt={selectedAgent.metadata.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {selectedAgent.metadata.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">@{selectedAgent.metadata.handle}</p>
                  <p className="text-sm text-gray-500 mb-3">{selectedAgent.metadata.role}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Token ID:</span>
                      <span className="font-medium">#{selectedAgent.tokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Trainers:</span>
                      <span className="font-medium">{selectedAgent.trainers?.length || 0}</span>
                    </div>
                  </div>
                  
                  {selectedAgent.trainers && selectedAgent.trainers.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Current Trainers:</h5>
                      <div className="space-y-1">
                        {selectedAgent.trainers.map((trainer, index) => (
                          <div key={index} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {trainer}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-500">Select an agent to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}