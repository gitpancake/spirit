'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

interface WriteOperation {
  name: string
  functionName: string
  description: string
  args: Array<{
    name: string
    type: string
    description: string
    placeholder?: string
    min?: number
    max?: number
  }>
  category: 'token' | 'trainer' | 'approval' | 'ownership'
  dangerLevel: 'low' | 'medium' | 'high'
}

const writeOperations: WriteOperation[] = [
  // Token Operations
  {
    name: 'Register Agent',
    functionName: 'register',
    description: 'Register a new agent NFT with metadata URI',
    args: [
      { name: 'recipient', type: 'address', description: 'Address to receive the NFT', placeholder: '0x...' },
      { name: 'metadataURI', type: 'string', description: 'IPFS URI or URL to metadata', placeholder: 'ipfs://...' }
    ],
    category: 'token',
    dangerLevel: 'low'
  },
  {
    name: 'Burn Token',
    functionName: 'burn',
    description: 'Permanently destroy an agent token',
    args: [
      { name: 'tokenId', type: 'uint256', description: 'Token ID to burn', placeholder: '0', min: 0 }
    ],
    category: 'token',
    dangerLevel: 'high'
  },
  {
    name: 'Set Token URI',
    functionName: 'setTokenURI',
    description: 'Update metadata URI for an existing token',
    args: [
      { name: 'tokenId', type: 'uint256', description: 'Token ID to update', placeholder: '0', min: 0 },
      { name: 'newURI', type: 'string', description: 'New metadata URI', placeholder: 'ipfs://...' }
    ],
    category: 'token',
    dangerLevel: 'medium'
  },
  
  // Trainer Operations
  {
    name: 'Add Trainer',
    functionName: 'addTrainer',
    description: 'Add trainer permissions for a token',
    args: [
      { name: 'tokenId', type: 'uint256', description: 'Token ID', placeholder: '0', min: 0 },
      { name: 'trainer', type: 'address', description: 'Trainer address', placeholder: '0x...' }
    ],
    category: 'trainer',
    dangerLevel: 'low'
  },
  {
    name: 'Remove Trainer',
    functionName: 'removeTrainer',
    description: 'Remove trainer permissions for a token',
    args: [
      { name: 'tokenId', type: 'uint256', description: 'Token ID', placeholder: '0', min: 0 },
      { name: 'trainer', type: 'address', description: 'Trainer address to remove', placeholder: '0x...' }
    ],
    category: 'trainer',
    dangerLevel: 'medium'
  },
  
  // Approval Operations
  {
    name: 'Approve',
    functionName: 'approve',
    description: 'Approve another address to transfer a specific token',
    args: [
      { name: 'to', type: 'address', description: 'Address to approve', placeholder: '0x...' },
      { name: 'tokenId', type: 'uint256', description: 'Token ID to approve', placeholder: '0', min: 0 }
    ],
    category: 'approval',
    dangerLevel: 'medium'
  },
  {
    name: 'Set Approval For All',
    functionName: 'setApprovalForAll',
    description: 'Approve or revoke approval for all tokens to an operator',
    args: [
      { name: 'operator', type: 'address', description: 'Operator address', placeholder: '0x...' },
      { name: 'approved', type: 'bool', description: 'Approval status (true/false)' }
    ],
    category: 'approval',
    dangerLevel: 'high'
  },
  
  // Transfer Operations
  {
    name: 'Transfer From',
    functionName: 'transferFrom',
    description: 'Transfer a token from one address to another',
    args: [
      { name: 'from', type: 'address', description: 'Current owner address', placeholder: '0x...' },
      { name: 'to', type: 'address', description: 'Recipient address', placeholder: '0x...' },
      { name: 'tokenId', type: 'uint256', description: 'Token ID to transfer', placeholder: '0', min: 0 }
    ],
    category: 'token',
    dangerLevel: 'high'
  },
  {
    name: 'Safe Transfer From',
    functionName: 'safeTransferFrom',
    description: 'Safely transfer a token (checks if recipient can handle NFTs)',
    args: [
      { name: 'from', type: 'address', description: 'Current owner address', placeholder: '0x...' },
      { name: 'to', type: 'address', description: 'Recipient address', placeholder: '0x...' },
      { name: 'tokenId', type: 'uint256', description: 'Token ID to transfer', placeholder: '0', min: 0 }
    ],
    category: 'token',
    dangerLevel: 'high'
  },
  
  // Ownership Operations
  {
    name: 'Set Max Trainers Per Token',
    functionName: 'setMaxTrainersPerToken',
    description: 'Update the maximum number of trainers per token',
    args: [
      { name: '_maxTrainersPerToken', type: 'uint256', description: 'New maximum trainers', placeholder: '15', min: 1, max: 100 }
    ],
    category: 'ownership',
    dangerLevel: 'low'
  },
  {
    name: 'Transfer Ownership',
    functionName: 'transferOwnership',
    description: 'Transfer contract ownership to another address',
    args: [
      { name: 'newOwner', type: 'address', description: 'New owner address', placeholder: '0x...' }
    ],
    category: 'ownership',
    dangerLevel: 'high'
  },
  {
    name: 'Renounce Ownership',
    functionName: 'renounceOwnership',
    description: 'Permanently give up contract ownership (leaves contract ownerless)',
    args: [],
    category: 'ownership',
    dangerLevel: 'high'
  }
]

export function ContractWriteSection() {
  const { address } = useAccount()
  const contractConfig = getContractConfig(getDefaultChainId())

  const [selectedOperation, setSelectedOperation] = useState<WriteOperation | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<string>('all')

  // Write contract hook
  const { 
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending 
  } = useWriteContract()

  // Transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read current token ID for validation
  const { data: currentTokenId } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'currentTokenId',
    query: { enabled: !!contractConfig }
  })

  const { data: contractOwner } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'owner',
    query: { enabled: !!contractConfig }
  })

  const isOwner = address && contractOwner && 
    address.toLowerCase() === (contractOwner as string).toLowerCase()

  // Handle operation selection
  const handleOperationSelect = (operation: WriteOperation) => {
    setSelectedOperation(operation)
    setFormValues({})
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !selectedOperation || !address) return

    try {
      // Convert form values to appropriate types
      const args = selectedOperation.args.map(arg => {
        const value = formValues[arg.name]
        
        switch (arg.type) {
          case 'uint256':
            return BigInt(parseInt(value))
          case 'address':
            return value as `0x${string}`
          case 'bool':
            return value === 'true'
          case 'string':
            return value
          default:
            return value
        }
      })

      writeContract({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: selectedOperation.functionName as never,
        args: args as readonly unknown[],
      })
    } catch (error) {
      console.error('Error executing contract function:', error)
    }
  }

  // Filter operations
  const filteredOperations = writeOperations.filter(op => {
    if (filter === 'all') return true
    return op.category === filter
  })

  const resetForm = () => {
    setFormValues({})
    setSelectedOperation(null)
  }

  const getDangerColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'token': return '🎫'
      case 'trainer': return '🎓'
      case 'approval': return '✅'
      case 'ownership': return '👑'
      default: return '⚡'
    }
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Contract Operations</h3>
        <p className="text-sm text-gray-600 mb-4">
          Execute any write function on the SpiritRegistry contract. Use with caution as these operations modify blockchain state.
        </p>
        
        {/* Owner warning */}
        {!isOwner && address && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              ⚠️ You are not the contract owner. Some operations may fail if they require owner permissions.
            </p>
          </div>
        )}
      </div>

      {/* Success State */}
      {isConfirmed && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Operation Successful!</h3>
              <p className="text-sm text-green-700 mt-1">
                {selectedOperation?.name} has been executed successfully.
              </p>
              {hash && (
                <p className="text-xs text-green-600 mt-2 font-mono break-all">
                  Transaction: {hash}
                </p>
              )}
              <button
                onClick={resetForm}
                className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
              >
                Execute Another Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {writeError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Operation Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {writeError.message || 'An error occurred while executing the operation.'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operation Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
            <h4 className="text-base font-medium text-gray-900 mb-4">Select Operation</h4>
            
            {/* Category Filter */}
            <div className="mb-4">
              <select
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Operations</option>
                <option value="token">Token Operations</option>
                <option value="trainer">Trainer Operations</option>
                <option value="approval">Approval Operations</option>
                <option value="ownership">Ownership Operations</option>
              </select>
            </div>

            {/* Operations List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredOperations.map((operation, index) => (
                <button
                  key={index}
                  onClick={() => handleOperationSelect(operation)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedOperation?.functionName === operation.functionName
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0">{getCategoryIcon(operation.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {operation.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDangerColor(operation.dangerLevel)}`}>
                          {operation.dangerLevel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {operation.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Operation Form */}
        <div className="lg:col-span-2">
          {selectedOperation ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span>{getCategoryIcon(selectedOperation.category)}</span>
                    <h4 className="text-lg font-medium text-gray-900">{selectedOperation.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDangerColor(selectedOperation.dangerLevel)}`}>
                      {selectedOperation.dangerLevel} risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedOperation.description}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Function: {selectedOperation.functionName}()
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedOperation.args.map((arg, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {arg.name} <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 font-normal"> ({arg.type})</span>
                    </label>
                    
                    {arg.type === 'bool' ? (
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={formValues[arg.name] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [arg.name]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={arg.type === 'uint256' ? 'number' : 'text'}
                        min={arg.min}
                        max={arg.max !== undefined ? arg.max : (arg.type === 'uint256' && currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder={arg.placeholder}
                        value={formValues[arg.name] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [arg.name]: e.target.value })}
                      />
                    )}
                    <p className="mt-1 text-xs text-gray-500">{arg.description}</p>
                    
                    {arg.type === 'uint256' && currentTokenId !== undefined && (
                      <p className="text-xs text-gray-500">
                        Valid token ID range: 0 to {Number(currentTokenId) - 1}
                      </p>
                    )}
                  </div>
                ))}

                {/* Danger Level Warning */}
                {selectedOperation.dangerLevel === 'high' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h5 className="text-sm font-medium text-red-800">High Risk Operation</h5>
                        <p className="text-xs text-red-700 mt-1">
                          This operation can have significant consequences. Please double-check all parameters before proceeding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={!address || !contractConfig || isWritePending || isConfirming || isConfirmed}
                    className={`px-6 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      selectedOperation.dangerLevel === 'high' 
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : selectedOperation.dangerLevel === 'medium'
                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    {isWritePending || isConfirming ? 'Executing...' : `Execute ${selectedOperation.name}`}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Select an Operation</h4>
              <p className="text-gray-600">
                Choose a contract function from the list on the left to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}