'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

export function TokenManagementSection() {
  const { address } = useAccount()
  const contractConfig = getContractConfig(getDefaultChainId())

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    recipient: '',
    metadataURI: '',
    previewName: '',
    previewDescription: ''
  })

  // Set default recipient to connected wallet
  useEffect(() => {
    if (address && !registerForm.recipient) {
      setRegisterForm(prev => ({ ...prev, recipient: address }))
    }
  }, [address, registerForm.recipient])

  // Burn form state
  const [burnTokenId, setBurnTokenId] = useState('')

  // Update token URI form state
  const [updateForm, setUpdateForm] = useState({
    tokenId: '',
    newURI: ''
  })

  // Contract write hooks
  const { 
    writeContract: writeRegister,
    data: registerHash,
    error: registerError,
    isPending: isRegisterPending 
  } = useWriteContract()

  const { 
    writeContract: writeBurn,
    data: burnHash,
    error: burnError,
    isPending: isBurnPending 
  } = useWriteContract()

  const { 
    writeContract: writeUpdateURI,
    data: updateHash,
    error: updateError,
    isPending: isUpdatePending 
  } = useWriteContract()

  // Transaction confirmations
  const { isLoading: isRegisterConfirming, isSuccess: isRegisterConfirmed } = useWaitForTransactionReceipt({
    hash: registerHash,
  })

  const { isLoading: isBurnConfirming, isSuccess: isBurnConfirmed } = useWaitForTransactionReceipt({
    hash: burnHash,
  })

  const { isLoading: isUpdateConfirming, isSuccess: isUpdateConfirmed } = useWaitForTransactionReceipt({
    hash: updateHash,
  })

  // Read current token ID for validation
  const { data: currentTokenId } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'currentTokenId',
    query: { enabled: !!contractConfig }
  })

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !registerForm.recipient || !registerForm.metadataURI) return

    try {
      writeRegister({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'register',
        args: [
          registerForm.recipient as `0x${string}`,
          registerForm.metadataURI
        ],
      })
    } catch (error) {
      console.error('Error registering agent:', error)
    }
  }

  // Handle burn
  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !burnTokenId) return

    const tokenId = parseInt(burnTokenId)
    if (isNaN(tokenId) || tokenId < 0) return

    try {
      writeBurn({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'burn',
        args: [BigInt(tokenId)],
      })
    } catch (error) {
      console.error('Error burning token:', error)
    }
  }

  // Handle token URI update
  const handleUpdateURI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractConfig || !address || !updateForm.tokenId || !updateForm.newURI) return

    const tokenId = parseInt(updateForm.tokenId)
    if (isNaN(tokenId) || tokenId < 0) return

    try {
      writeUpdateURI({
        address: contractConfig.address,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'setTokenURI',
        args: [BigInt(tokenId), updateForm.newURI],
      })
    } catch (error) {
      console.error('Error updating token URI:', error)
    }
  }

  // Reset forms
  const resetRegisterForm = () => {
    setRegisterForm({
      recipient: address || '',
      metadataURI: '',
      previewName: '',
      previewDescription: ''
    })
  }

  const resetBurnForm = () => {
    setBurnTokenId('')
  }

  const resetUpdateForm = () => {
    setUpdateForm({
      tokenId: '',
      newURI: ''
    })
  }

  return (
    <div className="space-y-8">
      {/* Agent Registration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-green-500">➕</span>
          <span>Register New Agent</span>
        </h3>

        {/* Success State */}
        {isRegisterConfirmed && (
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
                {registerHash && (
                  <p className="text-xs text-green-600 mt-2 font-mono break-all">
                    Transaction: {registerHash}
                  </p>
                )}
                <button
                  onClick={resetRegisterForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Register Another Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {registerError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {registerError.message || 'An error occurred during registration.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Pending */}
        {(isRegisterPending || isRegisterConfirming) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  {isRegisterPending ? 'Confirming Transaction...' : 'Processing...'}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {isRegisterPending 
                    ? 'Please confirm the transaction in your wallet.'
                    : 'Transaction submitted. Waiting for blockchain confirmation...'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0x..."
              value={registerForm.recipient}
              onChange={(e) => setRegisterForm({ ...registerForm, recipient: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              The wallet address that will own this agent NFT
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metadata URI *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ipfs://... or https://..."
              value={registerForm.metadataURI}
              onChange={(e) => setRegisterForm({ ...registerForm, metadataURI: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              IPFS URI or URL pointing to the agent&apos;s metadata JSON
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name (Preview)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agent name for preview"
                value={registerForm.previewName}
                onChange={(e) => setRegisterForm({ ...registerForm, previewName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Preview)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description"
                value={registerForm.previewDescription}
                onChange={(e) => setRegisterForm({ ...registerForm, previewDescription: e.target.value })}
              />
            </div>
          </div>

          {/* Preview */}
          {(registerForm.previewName || registerForm.previewDescription) && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <div className="text-sm text-gray-700">
                {registerForm.previewName && <div className="font-medium">{registerForm.previewName}</div>}
                {registerForm.previewDescription && <div className="mt-1">{registerForm.previewDescription}</div>}
                <div className="text-xs text-gray-500 mt-2">
                  Owner: {registerForm.recipient || 'Not specified'}
                </div>
                <div className="text-xs text-gray-500">
                  Next Token ID: {currentTokenId !== undefined ? Number(currentTokenId).toString() : 'Loading...'}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!address || !contractConfig || isRegisterPending || isRegisterConfirming || isRegisterConfirmed}
              className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRegisterPending || isRegisterConfirming ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>

      {/* Token Burn */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-red-500">🔥</span>
          <span>Burn Agent Token</span>
        </h3>

        {/* Success State */}
        {isBurnConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Token Burned Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Token #{burnTokenId} has been permanently burned.
                </p>
                <button
                  onClick={resetBurnForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Burn Another Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {burnError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Burn Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {burnError.message || 'An error occurred while burning the token.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleBurn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token ID to Burn *
            </label>
            <input
              type="number"
              min="0"
              max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter token ID"
              value={burnTokenId}
              onChange={(e) => setBurnTokenId(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              ⚠️ Warning: This action is irreversible. The token will be permanently destroyed.
            </p>
            {currentTokenId !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                Valid range: 0 to {Number(currentTokenId) - 1}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!address || !contractConfig || !burnTokenId || isBurnPending || isBurnConfirming || isBurnConfirmed}
              className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isBurnPending || isBurnConfirming ? 'Burning...' : 'Burn Token'}
            </button>
          </div>
        </form>
      </div>

      {/* Update Token URI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <span className="text-blue-500">✏️</span>
          <span>Update Token URI</span>
        </h3>

        {/* Success State */}
        {isUpdateConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Token URI Updated Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Token #{updateForm.tokenId} metadata has been updated.
                </p>
                <button
                  onClick={resetUpdateForm}
                  className="mt-3 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Update Another Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {updateError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Update Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {updateError.message || 'An error occurred while updating the token URI.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateURI} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token ID *
            </label>
            <input
              type="number"
              min="0"
              max={currentTokenId !== undefined ? Number(currentTokenId) - 1 : undefined}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter token ID"
              value={updateForm.tokenId}
              onChange={(e) => setUpdateForm({ ...updateForm, tokenId: e.target.value })}
            />
            {currentTokenId !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                Valid range: 0 to {Number(currentTokenId) - 1}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Metadata URI *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ipfs://... or https://..."
              value={updateForm.newURI}
              onChange={(e) => setUpdateForm({ ...updateForm, newURI: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              New IPFS URI or URL pointing to the updated metadata JSON
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!address || !contractConfig || !updateForm.tokenId || !updateForm.newURI || isUpdatePending || isUpdateConfirming || isUpdateConfirmed}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdatePending || isUpdateConfirming ? 'Updating...' : 'Update Token URI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}