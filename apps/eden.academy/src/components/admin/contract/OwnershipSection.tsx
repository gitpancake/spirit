'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

export function OwnershipSection() {
  const { address } = useAccount()
  const contractConfig = getContractConfig(getDefaultChainId())

  // Form states
  const [transferOwnerForm, setTransferOwnerForm] = useState({ newOwner: '' })
  const [maxTrainersForm, setMaxTrainersForm] = useState({ maxTrainers: '' })
  
  // Write contracts
  const { 
    writeContract: writeTransferOwnership,
    data: transferHash,
    error: transferError,
    isPending: isTransferPending 
  } = useWriteContract()

  const { 
    writeContract: writeRenounceOwnership,
    data: renounceHash,
    error: renounceError,
    isPending: isRenouncePending 
  } = useWriteContract()

  const { 
    writeContract: writeSetMaxTrainers,
    data: setMaxHash,
    error: setMaxError,
    isPending: isSetMaxPending 
  } = useWriteContract()

  // Transaction confirmations
  const { isLoading: isTransferConfirming, isSuccess: isTransferConfirmed } = useWaitForTransactionReceipt({
    hash: transferHash,
  })

  const { isLoading: isRenounceConfirming, isSuccess: isRenounceConfirmed } = useWaitForTransactionReceipt({
    hash: renounceHash,
  })

  const { isLoading: isSetMaxConfirming, isSuccess: isSetMaxConfirmed } = useWaitForTransactionReceipt({
    hash: setMaxHash,
  })

  // Read contract data
  const { data: contractOwner } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'owner',
    query: { enabled: !!contractConfig }
  })

  const { data: maxTrainersPerToken } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'maxTrainersPerToken',
    query: { enabled: !!contractConfig }
  })

  const { data: contractName } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'name',
    query: { enabled: !!contractConfig }
  })

  const { data: contractSymbol } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'symbol',
    query: { enabled: !!contractConfig }
  })

  const { data: currentTokenId } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'currentTokenId',
    query: { enabled: !!contractConfig }
  })

  // Handle transfer ownership
  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !transferOwnerForm.newOwner) return

    try {
      writeTransferOwnership({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'transferOwnership',
        args: [transferOwnerForm.newOwner as `0x${string}`],
      })
    } catch (error) {
      console.error('Error transferring ownership:', error)
    }
  }

  // Handle renounce ownership
  const handleRenounceOwnership = async () => {
    if (!contractConfig || !address) return

    try {
      writeRenounceOwnership({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'renounceOwnership',
      })
    } catch (error) {
      console.error('Error renouncing ownership:', error)
    }
  }

  // Handle set max trainers
  const handleSetMaxTrainers = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !maxTrainersForm.maxTrainers) return

    const maxTrainers = parseInt(maxTrainersForm.maxTrainers)
    if (isNaN(maxTrainers) || maxTrainers <= 0) return

    try {
      writeSetMaxTrainers({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'setMaxTrainersPerToken',
        args: [BigInt(maxTrainers)],
      })
    } catch (error) {
      console.error('Error setting max trainers:', error)
    }
  }

  // Reset forms
  const resetTransferForm = () => {
    setTransferOwnerForm({ newOwner: '' })
  }

  const resetMaxTrainersForm = () => {
    setMaxTrainersForm({ maxTrainers: '' })
  }

  const isOwner = address && contractOwner && 
    address.toLowerCase() === (contractOwner as string).toLowerCase()

  return (
    <div className="space-y-8">
      {/* Contract Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Contract Name</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {contractName || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Symbol</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {contractSymbol || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Total Tokens Minted</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono">
              {currentTokenId !== undefined ? Number(currentTokenId).toString() : 'Loading...'}
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-gray-600 font-medium mb-1">Contract Address</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-xs break-all">
              {contractConfig?.address || 'Not configured'}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-600 font-medium mb-1">Current Owner</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-xs break-all">
              {contractOwner as string || 'Loading...'}
            </div>
            {isOwner && (
              <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ You are the owner
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ownership Warning */}
      {!isOwner && address && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-amber-800">Not Contract Owner</h3>
              <p className="text-sm text-amber-700 mt-1">
                You are not the owner of this contract. Only the contract owner can perform ownership and configuration operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Max Trainers Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-blue-500">⚙️</span>
          <span>Max Trainers Configuration</span>
        </h3>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-800">Current Max Trainers Per Token:</span>
              <span className="ml-2 text-lg font-bold text-blue-900">
                {maxTrainersPerToken !== undefined ? Number(maxTrainersPerToken).toString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isSetMaxConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Max Trainers Updated!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Maximum trainers per token has been set to {maxTrainersForm.maxTrainers}.
                </p>
                <button
                  onClick={resetMaxTrainersForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Update Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {setMaxError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Update Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {setMaxError.message || 'An error occurred while updating max trainers.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSetMaxTrainers} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Max Trainers Per Token *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              disabled={!isOwner}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              placeholder="Enter maximum number of trainers"
              value={maxTrainersForm.maxTrainers}
              onChange={(e) => setMaxTrainersForm({ maxTrainers: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              This will affect all tokens. Existing tokens with more trainers won&apos;t be affected until trainers are removed.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isOwner || !maxTrainersForm.maxTrainers || isSetMaxPending || isSetMaxConfirming || isSetMaxConfirmed}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSetMaxPending || isSetMaxConfirming ? 'Updating...' : 'Update Max Trainers'}
            </button>
          </div>
        </form>
      </div>

      {/* Transfer Ownership */}
      <div className="bg-white border border-yellow-300 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-yellow-500">👑</span>
          <span>Transfer Ownership</span>
        </h3>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Warning: Irreversible Action</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Transferring ownership will give full control of the contract to another address. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isTransferConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Ownership Transferred!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Contract ownership has been transferred to {transferOwnerForm.newOwner}.
                </p>
                <button
                  onClick={resetTransferForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Transfer Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {transferError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Transfer Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {transferError.message || 'An error occurred while transferring ownership.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleTransferOwnership} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Owner Address *
            </label>
            <input
              type="text"
              required
              disabled={!isOwner}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:bg-gray-100"
              placeholder="0x..."
              value={transferOwnerForm.newOwner}
              onChange={(e) => setTransferOwnerForm({ newOwner: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              The address that will become the new owner of the contract.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isOwner || !transferOwnerForm.newOwner || isTransferPending || isTransferConfirming || isTransferConfirmed}
              className="px-6 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTransferPending || isTransferConfirming ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </form>
      </div>

      {/* Renounce Ownership */}
      <div className="bg-white border border-red-300 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <span>Renounce Ownership</span>
        </h3>

        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Danger: Permanent Action</h4>
              <p className="text-sm text-red-700 mt-1">
                Renouncing ownership will leave the contract without an owner. This means no one will be able to perform owner-only functions. 
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isRenounceConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Ownership Renounced!</h3>
                <p className="text-sm text-green-700 mt-1">
                  The contract is now ownerless. No one can perform owner-only functions anymore.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {renounceError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Renounce Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {renounceError.message || 'An error occurred while renouncing ownership.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleRenounceOwnership}
            disabled={!isOwner || isRenouncePending || isRenounceConfirming || isRenounceConfirmed}
            className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRenouncePending || isRenounceConfirming ? 'Renouncing...' : 'Renounce Ownership'}
          </button>
        </div>
      </div>
    </div>
  )
}