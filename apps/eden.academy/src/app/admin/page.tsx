'use client'

import { useAccount } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import WalletConnect from '~/components/WalletConnect'
import { NetworkIndicator } from '~/components/NetworkValidation'
import { getContractConfig, getDefaultChainId } from '~/lib/contracts'
import { useContractAddress } from '~/hooks/useContractAddress'
import { SpiritRegistryAdmin } from '~/components/admin/SpiritRegistryAdmin'

export default function AdminPage() {
  const { authenticated } = usePrivy()
  const { address } = useAccount()
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  const contractConfig = getContractConfig(getDefaultChainId())
  
  // Get contract address from API cache
  const { contractAddress: apiContractAddress, loading: apiLoading, error: apiError, refetch } = useContractAddress()

  // Get contract owner with direct RPC call to avoid multicall issues
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [ownerLoading, setOwnerLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchContractOwner = async () => {
      if (!contractConfig?.address) return

      try {
        setOwnerLoading(true)
        
        // Direct RPC call to avoid multicall batching
        const rpcUrl = getDefaultChainId() === 1 
          ? process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL 
          : process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL

        if (!rpcUrl) {
          throw new Error('RPC URL not configured')
        }

        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
              {
                to: contractConfig.address,
                data: '0x8da5cb5b' // owner() function selector
              },
              'latest'
            ],
            id: 1
          })
        })

        const data = await response.json()
        
        if (data.result && mounted) {
          // Convert hex result to address
          const ownerAddress = `0x${data.result.slice(-40)}`
          setContractOwner(ownerAddress)
        }
      } catch {
        if (mounted) {
          setContractOwner(null)
        }
      } finally {
        if (mounted) {
          setOwnerLoading(false)
        }
      }
    }

    fetchContractOwner()

    return () => {
      mounted = false
    }
  }, [contractConfig?.address])

  useEffect(() => {
    if (!ownerLoading && address && contractOwner) {
      const isContractOwner = address.toLowerCase() === contractOwner.toLowerCase()
      setIsOwner(isContractOwner)
      setLoading(false)
    } else if (!ownerLoading && (!address || !contractOwner)) {
      setIsOwner(false)
      setLoading(false)
    }
  }, [address, contractOwner, ownerLoading])

  if (loading || ownerLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/"
                className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight"
              >
                Eden Academy
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        {/* Loading State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authenticated || !address) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/"
                className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight"
              >
                Eden Academy
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        {/* Access Denied */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a2 2 0 10-4 0v4m-2 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Please connect your wallet to access the admin panel.
            </p>
            <div className="inline-block">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/"
                className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight"
              >
                Eden Academy
              </Link>
              <WalletConnect />
            </div>
          </div>
        </nav>

        {/* Access Denied */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Only the Spirit Registry contract owner can access this admin panel.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Your address: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{address}</code></p>
              <p>Contract owner: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{contractOwner as string}</code></p>
            </div>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="text-lg sm:text-xl font-medium text-gray-900 tracking-tight"
            >
              Eden Academy
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Admin</span>
              </div>
              <NetworkIndicator />
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Admin</span>
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-light text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage Eden Academy and Spirit Registry</p>
            </div>
          </div>
        </div>

        {/* Admin Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Admin Access Confirmed
              </h3>
              <p className="text-green-700 mb-3">
                You have full administrative privileges for the Eden Academy platform and Spirit Registry contract.
              </p>
              <div className="flex items-center space-x-4 text-sm text-green-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Contract Owner Verified</span>
                </div>
                <span className="text-xs">
                  {contractConfig?.chainName || 'Unknown Chain'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Address Verification */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Contract Address Verification</h3>
                <p className="text-sm text-gray-600">Compare webapp config with API cache</p>
              </div>
            </div>
            <button
              onClick={refetch}
              disabled={apiLoading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {apiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Webapp Config Address */}
            <div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Webapp Configuration</span>
                </div>
                <div className="text-xs text-blue-700 mb-1">NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS</div>
                <code className="text-sm bg-blue-100 text-blue-900 px-2 py-1 rounded font-mono break-all">
                  {contractConfig?.address || 'Not configured'}
                </code>
                <div className="text-xs text-blue-600 mt-1">
                  Chain: {contractConfig?.chainName || 'Unknown'}
                </div>
              </div>
            </div>

            {/* API Cache Address */}
            <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">API Cache</span>
                </div>
                <div className="text-xs text-green-700 mb-1">GET /api/config/contract-address</div>
                {apiLoading ? (
                  <div className="text-sm text-green-700">Loading...</div>
                ) : apiError ? (
                  <div className="text-sm text-red-700">Error: {apiError}</div>
                ) : (
                  <code className="text-sm bg-green-100 text-green-900 px-2 py-1 rounded font-mono break-all">
                    {apiContractAddress || 'Not available'}
                  </code>
                )}
              </div>
            </div>

            {/* Comparison Result */}
            {!apiLoading && !apiError && apiContractAddress && contractConfig?.address && (
              <div className={`p-4 border rounded-lg ${
                apiContractAddress.toLowerCase() === contractConfig.address.toLowerCase()
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {apiContractAddress.toLowerCase() === contractConfig.address.toLowerCase() ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        ✅ Contract addresses match!
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-red-800">
                        ❌ Contract addresses don&apos;t match!
                      </span>
                    </>
                  )}
                </div>
                {apiContractAddress.toLowerCase() !== contractConfig.address.toLowerCase() && (
                  <div className="mt-2 text-xs text-red-700">
                    This mismatch could cause issues with agent data and blockchain interactions.
                    The API cache may be pointing to a different contract than your webapp configuration.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Spirit Registry Contract Admin */}
        <SpiritRegistryAdmin />
      </div>
    </div>
  )
}