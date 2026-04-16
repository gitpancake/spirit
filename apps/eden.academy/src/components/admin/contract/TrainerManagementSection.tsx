'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

export function TrainerManagementSection() {
  const { address } = useAccount()
  const contractConfig = getContractConfig(getDefaultChainId())

  // Form states
  const [addForm, setAddForm] = useState({
    tokenId: '',
    trainerAddress: ''
  })

  const [removeForm, setRemoveForm] = useState({
    tokenId: '',
    trainerAddress: ''
  })

  const [queryForm, setQueryForm] = useState({
    tokenId: '',
    trainerAddress: ''
  })

  const [viewTrainersTokenId, setViewTrainersTokenId] = useState('')

  // Write contracts
  const { 
    writeContract: writeAddTrainer,
    data: addHash,
    error: addError,
    isPending: isAddPending 
  } = useWriteContract()

  const { 
    writeContract: writeRemoveTrainer,
    data: removeHash,
    error: removeError,
    isPending: isRemovePending 
  } = useWriteContract()

  // Transaction confirmations
  const { isLoading: isAddConfirming, isSuccess: isAddConfirmed } = useWaitForTransactionReceipt({
    hash: addHash,
  })

  const { isLoading: isRemoveConfirming, isSuccess: isRemoveConfirmed } = useWaitForTransactionReceipt({
    hash: removeHash,
  })

  // Read contracts for queries
  const { data: currentTokenId } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'currentTokenId',
    query: { enabled: !!contractConfig }
  })

  const { data: maxTrainersPerToken } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'maxTrainersPerToken',
    query: { enabled: !!contractConfig }
  })

  // Trainer queries
  const { data: isTrainerResult, error: isTrainerError } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'isTrainer',
    args: queryForm.tokenId && queryForm.trainerAddress ? 
      [BigInt(queryForm.tokenId), queryForm.trainerAddress as `0x${string}`] : 
      undefined,
    query: { 
      enabled: !!(contractConfig && queryForm.tokenId && queryForm.trainerAddress)
    }
  })

  const { data: trainersForToken, error: trainersError } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'getTrainers',
    args: viewTrainersTokenId ? [BigInt(viewTrainersTokenId)] : undefined,
    query: { enabled: !!(contractConfig && viewTrainersTokenId) }
  })

  const { data: trainerCount } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'getTrainerCount',
    args: viewTrainersTokenId ? [BigInt(viewTrainersTokenId)] : undefined,
    query: { enabled: !!(contractConfig && viewTrainersTokenId) }
  })

  // Handle add trainer
  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !addForm.tokenId || !addForm.trainerAddress) return

    const tokenId = parseInt(addForm.tokenId)
    if (isNaN(tokenId) || tokenId < 0) return

    try {
      writeAddTrainer({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'addTrainer',
        args: [
          BigInt(tokenId),
          addForm.trainerAddress as `0x${string}`
        ],
      })
    } catch (error) {
      console.error('Error adding trainer:', error)
    }
  }

  // Handle remove trainer
  const handleRemoveTrainer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !removeForm.tokenId || !removeForm.trainerAddress) return

    const tokenId = parseInt(removeForm.tokenId)
    if (isNaN(tokenId) || tokenId < 0) return

    try {
      writeRemoveTrainer({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'removeTrainer',
        args: [
          BigInt(tokenId),
          removeForm.trainerAddress as `0x${string}`
        ],
      })
    } catch (error) {
      console.error('Error removing trainer:', error)
    }
  }

  // Reset forms
  const resetAddForm = () => {
    setAddForm({ tokenId: '', trainerAddress: '' })
  }

  const resetRemoveForm = () => {
    setRemoveForm({ tokenId: '', trainerAddress: '' })
  }

  return (
    <div className="space-y-8">
      {/* System Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trainer System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Max Trainers Per Token</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {maxTrainersPerToken !== undefined ? Number(maxTrainersPerToken).toString() : 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Current Token ID Range</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {currentTokenId !== undefined ? `0 - ${Number(currentTokenId) - 1}` : 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Total Tokens</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {currentTokenId !== undefined ? Number(currentTokenId).toString() : 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      {/* Add Trainer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-green-500">➕</span>
          <span>Add Trainer</span>
        </h3>

        {/* Success State */}
        {isAddConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Trainer Added Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {addForm.trainerAddress} has been granted trainer access for token #{addForm.tokenId}.
                </p>
                <button
                  onClick={resetAddForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Add Another Trainer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {addError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Add Trainer Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {addError.message || 'An error occurred while adding the trainer.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAddTrainer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID *
              </label>
              <input
                type="number"
                min="0"
                max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter token ID"
                value={addForm.tokenId}
                onChange={(e) => setAddForm({ ...addForm, tokenId: e.target.value })}
              />
              {currentTokenId !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Valid range: 0 to {Number(currentTokenId) - 1}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0x..."
                value={addForm.trainerAddress}
                onChange={(e) => setAddForm({ ...addForm, trainerAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!address || !contractConfig || !addForm.tokenId || !addForm.trainerAddress || isAddPending || isAddConfirming || isAddConfirmed}
              className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAddPending || isAddConfirming ? 'Adding Trainer...' : 'Add Trainer'}
            </button>
          </div>
        </form>
      </div>

      {/* Remove Trainer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-red-500">➖</span>
          <span>Remove Trainer</span>
        </h3>

        {/* Success State */}
        {isRemoveConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Trainer Removed Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {removeForm.trainerAddress} has been removed as a trainer for token #{removeForm.tokenId}.
                </p>
                <button
                  onClick={resetRemoveForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Remove Another Trainer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {removeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Remove Trainer Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {removeError.message || 'An error occurred while removing the trainer.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRemoveTrainer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID *
              </label>
              <input
                type="number"
                min="0"
                max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter token ID"
                value={removeForm.tokenId}
                onChange={(e) => setRemoveForm({ ...removeForm, tokenId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="0x..."
                value={removeForm.trainerAddress}
                onChange={(e) => setRemoveForm({ ...removeForm, trainerAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!address || !contractConfig || !removeForm.tokenId || !removeForm.trainerAddress || isRemovePending || isRemoveConfirming || isRemoveConfirmed}
              className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRemovePending || isRemoveConfirming ? 'Removing Trainer...' : 'Remove Trainer'}
            </button>
          </div>
        </form>
      </div>

      {/* Check if Address is Trainer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-blue-500">🔍</span>
          <span>Check Trainer Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Token ID</label>
            <input
              type="number"
              min="0"
              max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter token ID"
              value={queryForm.tokenId}
              onChange={(e) => setQueryForm({ ...queryForm, tokenId: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address to Check</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0x..."
              value={queryForm.trainerAddress}
              onChange={(e) => setQueryForm({ ...queryForm, trainerAddress: e.target.value })}
            />
          </div>
        </div>

        {queryForm.tokenId && queryForm.trainerAddress && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Trainer Status:</span>
              {isTrainerError ? (
                <span className="text-red-600 text-sm">Error checking trainer status</span>
              ) : (
                <span className={`text-sm font-medium ${isTrainerResult ? 'text-green-600' : 'text-red-600'}`}>
                  {isTrainerResult ? '✅ IS a trainer' : '❌ NOT a trainer'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View All Trainers for Token */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-purple-500">👥</span>
          <span>View All Trainers</span>
        </h3>

        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Token ID</label>
            <input
              type="number"
              min="0"
              max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter token ID"
              value={viewTrainersTokenId}
              onChange={(e) => setViewTrainersTokenId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setViewTrainersTokenId(viewTrainersTokenId)}
              disabled={!viewTrainersTokenId}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Trainers
            </button>
          </div>
        </div>

        {viewTrainersTokenId && (
          <div className="space-y-4">
            {trainersError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error loading trainers: {trainersError.message}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-medium text-purple-800">
                    Token #{viewTrainersTokenId} has {trainerCount ? Number(trainerCount) : 0} trainer(s)
                  </span>
                  <span className="text-xs text-purple-600">
                    Max: {maxTrainersPerToken ? Number(maxTrainersPerToken) : 0}
                  </span>
                </div>

                {trainersForToken && (trainersForToken as string[]).length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Trainer Addresses:</h4>
                    {(trainersForToken as string[]).map((trainer, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-sm break-all">
                        {trainer}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                    No trainers assigned to this token
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}