'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

interface AgentFormData {
  recipientAddress: string
  metadataURI: string
  name: string
  description: string
}

export function AgentRegistration() {
  const { address } = useAccount()
  
  const [formData, setFormData] = useState<AgentFormData>({
    recipientAddress: '',
    metadataURI: '',
    name: '',
    description: ''
  })

  // Set default recipient to connected wallet
  useEffect(() => {
    if (address && !formData.recipientAddress) {
      setFormData(prev => ({ ...prev, recipientAddress: address }))
    }
  }, [address, formData.recipientAddress])
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
    if (!contractConfig || !address) return

    try {
      writeContract({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'register',
        args: [
          formData.recipientAddress as `0x${string}`,
          formData.metadataURI
        ],
      })
    } catch (error) {
      console.error('Error registering agent:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      recipientAddress: address || '',
      metadataURI: '',
      name: '',
      description: ''
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Register New Agent</h3>
        <p className="text-gray-600">
          Register a new agent in the Spirit Registry. This will mint a new NFT and create an agent profile.
        </p>
      </div>

      {/* Success State */}
      {isConfirmed && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Agent Registered Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Transaction confirmed. The new agent has been registered in the Spirit Registry.
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
                Register Another Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {(writeError || receiptError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {writeError?.message || receiptError?.message || 'An error occurred during registration.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Pending */}
      {(isWritePending || isConfirming) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                {isWritePending ? 'Confirming Transaction...' : 'Waiting for Confirmation...'}
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address *
          </label>
          <input
            type="text"
            id="recipientAddress"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="0x..."
            value={formData.recipientAddress}
            onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">
            The wallet address that will own this agent NFT
          </p>
        </div>

        <div>
          <label htmlFor="metadataURI" className="block text-sm font-medium text-gray-700 mb-2">
            Metadata URI *
          </label>
          <input
            type="text"
            id="metadataURI"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="ipfs://... or https://..."
            value={formData.metadataURI}
            onChange={(e) => setFormData({ ...formData, metadataURI: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">
            IPFS URI or URL pointing to the agent&apos;s metadata JSON
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name (Preview)
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Agent name for preview"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">
            This is for preview only - actual name comes from metadata URI
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Preview)
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Brief description of the agent"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">
            This is for preview only - actual description comes from metadata URI
          </p>
        </div>

        {/* Preview */}
        {(formData.name || formData.description) && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="text-sm text-gray-700">
              {formData.name && <div className="font-medium">{formData.name}</div>}
              {formData.description && <div className="mt-1">{formData.description}</div>}
              <div className="text-xs text-gray-500 mt-2">
                Owner: {formData.recipientAddress || 'Not specified'}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!address || !contractConfig || isWritePending || isConfirming || isConfirmed}
            className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isWritePending || isConfirming ? 'Registering...' : 'Register Agent'}
          </button>
        </div>
      </form>

      {/* Information */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Registration requires a transaction fee (gas)</li>
          <li>The metadata URI should point to a valid JSON file with agent information</li>
          <li>Once registered, the agent will be assigned the next available token ID</li>
          <li>The recipient address will become the owner of the agent NFT</li>
        </ul>
      </div>
    </div>
  )
}