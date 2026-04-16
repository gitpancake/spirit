'use client'

import { useState, useCallback, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

interface TokenUriResult {
  tokenId: string
  uri: string | null
  metadata: Record<string, unknown> | null
  error: string | null
  loading: boolean
}

interface ContractInfo {
  contractName: string | null
  contractSymbol: string | null
  contractOwner: string | null
  currentTokenId: string | null
  maxTrainersPerToken: string | null
  contractAddress: string | null
}

export function ContractReadSection() {
  const contractConfig = getContractConfig(getDefaultChainId())
  
  // Single token URI state
  const [singleTokenId, setSingleTokenId] = useState('')
  const [singleResult, setSingleResult] = useState<TokenUriResult | null>(null)
  
  // Batch token URIs state
  const [batchTokenIds, setBatchTokenIds] = useState('')
  const [batchResults, setBatchResults] = useState<TokenUriResult[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  // Contract info state - now manually controlled
  const [contractInfo, setContractInfo] = useState<ContractInfo>({
    contractName: null,
    contractSymbol: null,
    contractOwner: null,
    currentTokenId: null,
    maxTrainersPerToken: null,
    contractAddress: contractConfig?.address || null
  })

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    contractName: false,
    contractSymbol: false,
    contractOwner: false,
    currentTokenId: false,
    maxTrainersPerToken: false
  })

  // Individual contract read hooks
  const contractNameRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'name',
    query: { enabled: false }
  })

  const contractSymbolRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'symbol',
    query: { enabled: false }
  })

  const contractOwnerRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'owner',
    query: { enabled: false }
  })

  const currentTokenIdRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'currentTokenId',
    query: { enabled: false }
  })

  const maxTrainersRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'maxTrainersPerToken',
    query: { enabled: false }
  })

  // Function to trigger individual contract reads
  const readContractValue = (fieldName: keyof ContractInfo, refetch: () => void) => {
    setLoadingStates(prev => ({ ...prev, [fieldName]: true }))
    refetch()
  }

  // Update contract info when reads complete
  const updateContractInfo = useCallback(() => {
    if (contractNameRead.data && !contractNameRead.isLoading) {
      setContractInfo(prev => ({ ...prev, contractName: contractNameRead.data as string }))
      setLoadingStates(prev => ({ ...prev, contractName: false }))
    }
    if (contractSymbolRead.data && !contractSymbolRead.isLoading) {
      setContractInfo(prev => ({ ...prev, contractSymbol: contractSymbolRead.data as string }))
      setLoadingStates(prev => ({ ...prev, contractSymbol: false }))
    }
    if (contractOwnerRead.data && !contractOwnerRead.isLoading) {
      setContractInfo(prev => ({ ...prev, contractOwner: contractOwnerRead.data as string }))
      setLoadingStates(prev => ({ ...prev, contractOwner: false }))
    }
    if (currentTokenIdRead.data !== undefined && !currentTokenIdRead.isLoading) {
      setContractInfo(prev => ({ ...prev, currentTokenId: (currentTokenIdRead.data as bigint).toString() }))
      setLoadingStates(prev => ({ ...prev, currentTokenId: false }))
    }
    if (maxTrainersRead.data !== undefined && !maxTrainersRead.isLoading) {
      setContractInfo(prev => ({ ...prev, maxTrainersPerToken: (maxTrainersRead.data as bigint).toString() }))
      setLoadingStates(prev => ({ ...prev, maxTrainersPerToken: false }))
    }
  }, [contractNameRead, contractSymbolRead, contractOwnerRead, currentTokenIdRead, maxTrainersRead])

  // Update contract info when any read completes
  useEffect(() => {
    updateContractInfo()
  }, [updateContractInfo])

  // Helper function to fetch IPFS metadata
  const fetchIpfsMetadata = async (uri: string): Promise<Record<string, unknown>> => {
    try {
      if (uri.startsWith('ipfs://')) {
        const ipfsHash = uri.replace('ipfs://', '')
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } else if (uri.startsWith('http')) {
        const response = await fetch(uri)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } else {
        throw new Error('Unsupported URI format')
      }
    } catch (error) {
      console.error('Error fetching metadata:', error)
      throw error
    }
  }

  // Single token URI read hook
  const [tokenUriToFetch, setTokenUriToFetch] = useState<number | null>(null)
  const singleTokenUriRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'tokenURI',
    args: tokenUriToFetch !== null ? [BigInt(tokenUriToFetch)] : undefined,
    query: { enabled: tokenUriToFetch !== null }
  })

  // Single token URI fetch
  const fetchSingleTokenUri = useCallback(async () => {
    if (!contractConfig || !singleTokenId.trim()) return

    const tokenIdNum = parseInt(singleTokenId.trim())
    if (isNaN(tokenIdNum) || tokenIdNum < 0) {
      setSingleResult({
        tokenId: singleTokenId,
        uri: null,
        metadata: null,
        error: 'Invalid token ID',
        loading: false
      })
      return
    }

    // Validate against currentTokenId if available
    if (contractInfo.currentTokenId !== null && tokenIdNum >= Number(contractInfo.currentTokenId)) {
      setSingleResult({
        tokenId: singleTokenId,
        uri: null,
        metadata: null,
        error: `Token ID ${tokenIdNum} does not exist. Current max token ID is ${Number(contractInfo.currentTokenId) - 1}`,
        loading: false
      })
      return
    }

    setSingleResult({
      tokenId: singleTokenId,
      uri: null,
      metadata: null,
      error: null,
      loading: true
    })

    setTokenUriToFetch(tokenIdNum)
  }, [contractConfig, singleTokenId, contractInfo.currentTokenId])

  // Handle single token URI result
  useEffect(() => {
    if (singleTokenUriRead.data && !singleTokenUriRead.isLoading && tokenUriToFetch !== null) {
      const uri = singleTokenUriRead.data as string
      
      // Fetch metadata
      fetchIpfsMetadata(uri)
        .then(metadata => {
          setSingleResult({
            tokenId: tokenUriToFetch.toString(),
            uri,
            metadata,
            error: null,
            loading: false
          })
        })
        .catch(metadataError => {
          console.error('Failed to fetch metadata:', metadataError)
          setSingleResult({
            tokenId: tokenUriToFetch.toString(),
            uri,
            metadata: null,
            error: null,
            loading: false
          })
        })
      
      setTokenUriToFetch(null)
    } else if (singleTokenUriRead.error && tokenUriToFetch !== null) {
      setSingleResult({
        tokenId: tokenUriToFetch.toString(),
        uri: null,
        metadata: null,
        error: singleTokenUriRead.error.message || 'Failed to fetch token URI',
        loading: false
      })
      setTokenUriToFetch(null)
    }
  }, [singleTokenUriRead.data, singleTokenUriRead.error, singleTokenUriRead.isLoading, tokenUriToFetch])

  // Batch token URIs read hook
  const [batchTokenIdsToFetch, setBatchTokenIdsToFetch] = useState<number[] | null>(null)
  const batchTokenUrisRead = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'getTokenUris',
    args: batchTokenIdsToFetch ? [batchTokenIdsToFetch.map(id => BigInt(id))] : undefined,
    query: { enabled: batchTokenIdsToFetch !== null }
  })

  // Batch token URIs fetch
  const fetchBatchTokenUris = useCallback(async () => {
    if (!contractConfig || !batchTokenIds.trim()) return

    const tokenIdStrings = batchTokenIds.split(',').map(id => id.trim()).filter(Boolean)
    const tokenIds = tokenIdStrings.map(id => parseInt(id)).filter(id => !isNaN(id) && id >= 0)

    if (tokenIds.length === 0) {
      setBatchResults([{
        tokenId: 'invalid',
        uri: null,
        metadata: null,
        error: 'No valid token IDs provided',
        loading: false
      }])
      return
    }

    // Validate against currentTokenId if available
    if (contractInfo.currentTokenId !== null) {
      const invalidIds = tokenIds.filter(id => id >= Number(contractInfo.currentTokenId))
      if (invalidIds.length > 0) {
        setBatchResults([{
          tokenId: invalidIds.join(', '),
          uri: null,
          metadata: null,
          error: `Token IDs [${invalidIds.join(', ')}] do not exist. Current max token ID is ${Number(contractInfo.currentTokenId) - 1}`,
          loading: false
        }])
        return
      }
    }

    setBatchLoading(true)
    setBatchResults(tokenIds.map(id => ({
      tokenId: id.toString(),
      uri: null,
      metadata: null,
      error: null,
      loading: true
    })))

    setBatchTokenIdsToFetch(tokenIds)
  }, [contractConfig, batchTokenIds, contractInfo.currentTokenId])

  // Handle batch token URIs result
  useEffect(() => {
    if (batchTokenUrisRead.data && !batchTokenUrisRead.isLoading && batchTokenIdsToFetch) {
      const uris = batchTokenUrisRead.data as string[]
      
      // Fetch metadata for each URI
      Promise.all(
        batchTokenIdsToFetch.map(async (tokenId, index) => {
          const uri = uris[index]
          let metadata = null
          let error = null

          try {
            metadata = await fetchIpfsMetadata(uri)
          } catch (metadataError) {
            error = `Failed to fetch metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`
          }

          return {
            tokenId: tokenId.toString(),
            uri,
            metadata,
            error,
            loading: false
          }
        })
      ).then(results => {
        setBatchResults(results)
        setBatchLoading(false)
        setBatchTokenIdsToFetch(null)
      })
    } else if (batchTokenUrisRead.error && batchTokenIdsToFetch) {
      setBatchResults([{
        tokenId: 'batch',
        uri: null,
        metadata: null,
        error: batchTokenUrisRead.error.message || 'Failed to fetch token URIs',
        loading: false
      }])
      setBatchLoading(false)
      setBatchTokenIdsToFetch(null)
    }
  }, [batchTokenUrisRead.data, batchTokenUrisRead.error, batchTokenUrisRead.isLoading, batchTokenIdsToFetch])

  return (
    <div className="space-y-8">
      {/* Contract Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Contract Name</label>
              <button
                onClick={() => readContractValue('contractName', contractNameRead.refetch)}
                disabled={loadingStates.contractName}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.contractName ? 'Reading...' : 'Read'}
              </button>
            </div>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-gray-900">
              {contractInfo.contractName || 'Click "Read" to load'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Symbol</label>
              <button
                onClick={() => readContractValue('contractSymbol', contractSymbolRead.refetch)}
                disabled={loadingStates.contractSymbol}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.contractSymbol ? 'Reading...' : 'Read'}
              </button>
            </div>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-gray-900">
              {contractInfo.contractSymbol || 'Click "Read" to load'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Contract Owner</label>
              <button
                onClick={() => readContractValue('contractOwner', contractOwnerRead.refetch)}
                disabled={loadingStates.contractOwner}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.contractOwner ? 'Reading...' : 'Read'}
              </button>
            </div>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-xs break-all text-gray-900">
              {contractInfo.contractOwner || 'Click "Read" to load'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Current Token ID</label>
              <button
                onClick={() => readContractValue('currentTokenId', currentTokenIdRead.refetch)}
                disabled={loadingStates.currentTokenId}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.currentTokenId ? 'Reading...' : 'Read'}
              </button>
            </div>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-gray-900">
              {contractInfo.currentTokenId !== null ? (
                <>
                  {contractInfo.currentTokenId}
                  <div className="text-xs text-gray-500 mt-1">
                    Next token ID will be {contractInfo.currentTokenId}
                  </div>
                </>
              ) : (
                'Click "Read" to load'
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Max Trainers Per Token</label>
              <button
                onClick={() => readContractValue('maxTrainersPerToken', maxTrainersRead.refetch)}
                disabled={loadingStates.maxTrainersPerToken}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.maxTrainersPerToken ? 'Reading...' : 'Read'}
              </button>
            </div>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-gray-900">
              {contractInfo.maxTrainersPerToken || 'Click "Read" to load'}
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Contract Address</label>
            <div className="bg-white p-3 border border-gray-200 rounded font-mono text-xs break-all text-gray-900">
              {contractInfo.contractAddress || 'Not configured'}
            </div>
          </div>
        </div>

      </div>

      {/* Single Token URI Query */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Single Token URI Query</h3>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Token ID</label>
            <input
              type="number"
              min="0"
              max={contractInfo.currentTokenId !== null ? Number(contractInfo.currentTokenId) - 1 : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter token ID (e.g. 0, 1, 2...)"
              value={singleTokenId}
              onChange={(e) => setSingleTokenId(e.target.value)}
            />
            {contractInfo.currentTokenId !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Valid range: 0 to {Number(contractInfo.currentTokenId) - 1}
              </p>
            )}
          </div>
          <button
            onClick={fetchSingleTokenUri}
            disabled={!singleTokenId.trim() || (singleResult?.loading ?? false)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {singleResult?.loading ? 'Loading...' : 'Fetch Token URI'}
          </button>
        </div>

        {singleResult && (
          <div className="mt-4 space-y-4">
            {singleResult.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {singleResult.error}
              </div>
            ) : (
              <>
                {singleResult.uri && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Token URI</label>
                    <div className="bg-gray-50 p-3 border border-gray-200 rounded-md font-mono text-sm break-all text-gray-900">
                      {singleResult.uri}
                    </div>
                  </div>
                )}
                
                {singleResult.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolved Metadata</label>
                    <textarea
                      readOnly
                      className="w-full p-3 border border-gray-200 rounded-md font-mono text-xs bg-gray-50 text-gray-900"
                      rows={10}
                      value={JSON.stringify(singleResult.metadata, null, 2)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Batch Token URIs Query */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Token URIs Query</h3>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Token IDs (comma-separated)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter token IDs (e.g. 0, 1, 2, 5, 10)"
              value={batchTokenIds}
              onChange={(e) => setBatchTokenIds(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple token IDs with commas
            </p>
          </div>
          <button
            onClick={fetchBatchTokenUris}
            disabled={!batchTokenIds.trim() || batchLoading}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {batchLoading ? 'Loading...' : 'Fetch Batch URIs'}
          </button>
        </div>

        {batchResults.length > 0 && (
          <div className="mt-4 space-y-4">
            {batchResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Token ID: {result.tokenId}</h4>
                
                {result.error ? (
                  <div className="text-red-600 text-sm">{result.error}</div>
                ) : (
                  <div className="space-y-3">
                    {result.uri && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Token URI</label>
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all text-gray-900">
                          {result.uri}
                        </div>
                      </div>
                    )}
                    
                    {result.metadata && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Metadata</label>
                        <textarea
                          readOnly
                          className="w-full p-2 border border-gray-200 rounded text-xs font-mono bg-gray-50 text-gray-900"
                          rows={6}
                          value={JSON.stringify(result.metadata, null, 2)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}