'use client'

import { useEffect, useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import Image from 'next/image'
import { getIpfsImageUrl } from '~/lib/api'
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { GasSponsorshipIndicator } from './GasSponsorshipIndicator'
import { TransactionGuard } from './NetworkValidation'

// Minter contract ABI (relevant functions)
const MINTER_ABI = [
  {
    "inputs": [],
    "name": "getSaleInfo",
    "outputs": [
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "currentPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "sold", "type": "uint256"},
      {"internalType": "uint256", "name": "revenue", "type": "uint256"},
      {"internalType": "uint256", "name": "maxSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "remainingSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "contractBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
    "name": "batchMint",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
    "name": "calculateTotalCost",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// NFT contract ABI (relevant functions)
const NFT_ABI = [
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextTokenId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface SaleInfo {
  isActive: boolean
  currentPrice: bigint
  sold: bigint
  revenue: bigint
  maxSupply: bigint
  remainingSupply: bigint
  contractBalance: bigint
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  tokenId: number
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

interface SaleProps {
  minterAddress: string
  nftAddress: string
  chainId: number
}

export default function Sale({ minterAddress, nftAddress, chainId }: SaleProps) {
  const [mintQuantity, setMintQuantity] = useState(1)
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(true)

  // Read sale info from minter contract
  const { data: saleInfo, isError: saleInfoError, isLoading: saleInfoLoading } = useReadContract({
    address: minterAddress as `0x${string}`,
    abi: MINTER_ABI,
    functionName: 'getSaleInfo',
    chainId: chainId as 1 | 11155111,
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 20000, // Consider data fresh for 20 seconds
    },
  })

  // Read total cost for selected quantity
  const { data: totalCost } = useReadContract({
    address: minterAddress as `0x${string}`,
    abi: MINTER_ABI,
    functionName: 'calculateTotalCost',
    args: [BigInt(mintQuantity)],
    chainId: chainId as 1 | 11155111,
    query: {
      staleTime: 10000, // Consider data fresh for 10 seconds (price calculation updates frequently)
    },
  })

  // Read NFT total supply
  const { data: nftTotalSupply } = useReadContract({
    address: nftAddress as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'totalSupply',
    chainId: chainId as 1 | 11155111,
    query: {
      refetchInterval: 60000, // Refetch every 60 seconds (total supply changes slowly)
      staleTime: 45000, // Consider data fresh for 45 seconds
    },
  })

  // Write contract for minting  
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  
  // Smart wallet capabilities
  const { canSponsorGas, smartWalletClient } = useSmartWallet()

  // Wait for transaction receipt
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  // Fetch NFT metadata
  useEffect(() => {
    const fetchNFTMetadata = async () => {
      console.log('fetchNFTMetadata called with:', { nftTotalSupply, nftAddress, chainId })
      
      if (!nftTotalSupply || nftTotalSupply === BigInt(0)) {
        console.log('No NFT total supply, skipping fetch')
        setLoadingNFTs(false)
        return
      }

      setLoadingNFTs(true)
      const metadata: NFTMetadata[] = []
      
      try {
        // Fetch first 12 NFTs (or all if less than 12), starting from token ID 1
        const limit = Math.min(Number(nftTotalSupply), 12)
        console.log(`Fetching ${limit} NFTs from ${nftAddress}`)
        
        for (let i = 1; i <= limit; i++) {
          try {
            console.log(`Fetching tokenURI for token ${i}`)
            
            // Get token URI for each token
            const tokenUriResponse = await fetch(`/api/contract/read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: nftAddress,
                abi: NFT_ABI,
                functionName: 'tokenURI',
                args: [i],
                chainId,
              }),
            })

            console.log(`TokenURI response for token ${i}:`, tokenUriResponse.status)

            if (tokenUriResponse.ok) {
              const responseData = await tokenUriResponse.json()
              console.log(`TokenURI data for token ${i}:`, responseData)
              const tokenUri = responseData.data
              
              if (tokenUri) {
                // Fetch metadata from IPFS
                const ipfsUrl = getIpfsImageUrl(tokenUri)
                console.log(`Fetching metadata from IPFS: ${ipfsUrl}`)
                
                const metadataResponse = await fetch(ipfsUrl)
                
                if (metadataResponse.ok) {
                  const nftData = await metadataResponse.json()
                  console.log(`NFT metadata for token ${i}:`, nftData)
                  metadata.push({
                    ...nftData,
                    tokenId: i,
                  })
                } else {
                  console.error(`Failed to fetch metadata for token ${i}, status:`, metadataResponse.status)
                }
              } else {
                console.log(`No tokenURI for token ${i}`)
              }
            } else {
              console.error(`Failed to get tokenURI for token ${i}, status:`, tokenUriResponse.status)
            }
          } catch (err) {
            console.error(`Error fetching NFT ${i}:`, err)
          }
        }
      } catch (err) {
        console.error('Error fetching NFT metadata:', err)
      }

      console.log(`Final metadata array:`, metadata)
      setNftMetadata(metadata)
      setLoadingNFTs(false)
    }

    fetchNFTMetadata()
  }, [nftAddress, nftTotalSupply, chainId])

  const handleMint = () => {
    if (!totalCost) return

    if (mintQuantity === 1) {
      // Use single mint function
      writeContract({
        address: minterAddress as `0x${string}`,
        abi: MINTER_ABI,
        functionName: 'mint',
        args: [],
        value: totalCost,
      })
    } else {
      // Use batch mint function
      writeContract({
        address: minterAddress as `0x${string}`,
        abi: MINTER_ABI,
        functionName: 'batchMint',
        args: [BigInt(mintQuantity)],
        value: totalCost,
      })
    }
  }

  // Map the response array to our SaleInfo interface
  const typedSaleInfo: SaleInfo | undefined = saleInfo ? {
    isActive: saleInfo[0],
    currentPrice: saleInfo[1], 
    sold: saleInfo[2],
    revenue: saleInfo[3],
    maxSupply: saleInfo[4],
    remainingSupply: saleInfo[5],
    contractBalance: saleInfo[6]
  } : undefined
  
  // Debug logging
  console.log('Sale component - raw saleInfo:', saleInfo)
  console.log('Sale component - typedSaleInfo:', typedSaleInfo)
  console.log('Sale component - saleInfoError:', saleInfoError)
  console.log('Sale component - saleInfoLoading:', saleInfoLoading)
  
  // Use remainingSupply directly from the contract
  const remaining = typedSaleInfo?.remainingSupply || BigInt(0)

  if (saleInfoLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (saleInfoError || !typedSaleInfo) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading sale information</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Price */}
      <div className="bg-gray-50 p-6">
        <div className="text-center space-y-2">
          <div className="text-gray-600 text-sm font-medium uppercase tracking-wider">Fixed Price</div>
          <div className="text-gray-900 text-4xl font-light">
            {typedSaleInfo?.currentPrice ? formatEther(typedSaleInfo.currentPrice) : '0'} ETH
          </div>
          <div className="text-gray-500 text-sm">
            {remaining.toString()} of {typedSaleInfo?.maxSupply ? typedSaleInfo.maxSupply.toString() : '0'} remaining
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 border border-gray-200">
          <div className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Sold</div>
          <div className="text-gray-900 text-xl font-light">{typedSaleInfo?.sold?.toString() || '0'}</div>
        </div>
        <div className="text-center p-4 border border-gray-200">
          <div className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Status</div>
          <div className={`text-sm font-medium ${typedSaleInfo?.isActive ? 'text-green-600' : 'text-gray-500'}`}>
            {typedSaleInfo?.isActive ? 'Live' : 'Ended'}
          </div>
        </div>
      </div>

      {/* Minting Interface */}
      <div>
        {typedSaleInfo?.isActive && remaining > BigInt(0) ? (
          <div className="space-y-6">
            {/* Mint Form */}
            <TransactionGuard>
              <div className="bg-gray-50 p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select Quantity</h3>
                    <GasSponsorshipIndicator className="justify-center mb-2" />
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                      className="w-10 h-10 rounded border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={mintQuantity <= 1}
                    >
                      −
                    </button>
                    <div className="text-center px-4">
                      <div className="text-2xl font-light text-gray-900">{mintQuantity}</div>
                    </div>
                    <button
                      onClick={() => setMintQuantity(Math.min(Number(remaining), mintQuantity + 1))}
                      className="w-10 h-10 rounded border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={mintQuantity >= Number(remaining)}
                    >
                      +
                    </button>
                  </div>

                  {/* Total Cost */}
                  {totalCost && (
                    <div className="border border-gray-200 p-3 text-center">
                      <div className="text-gray-600 text-xs font-medium">Total Cost</div>
                      <div className="text-gray-900 text-lg font-medium">
                        {formatEther(totalCost)} ETH
                      </div>
                    </div>
                  )}

                  {/* Mint Button */}
                  <button
                    onClick={handleMint}
                    disabled={isPending || isConfirming || !typedSaleInfo?.isActive}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm font-medium transition-colors"
                  >
                    {isPending ? 'Confirm in wallet' : 
                     isConfirming ? 'Processing...' : 
                     `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </TransactionGuard>

            {/* Status Messages */}
            {error && (
              <div className="border border-red-300 bg-red-50 p-3">
                <div className="text-red-600 text-sm text-center">
                  {error.message.includes('user rejected') ? 'Transaction rejected' : 'Mint failed'}
                </div>
              </div>
            )}

            {hash && (
              <div className="border border-green-300 bg-green-50 p-3">
                <div className="text-green-600 text-sm text-center">
                  Transaction submitted: {hash.slice(0, 10)}...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-50 p-6 space-y-3">
              <h3 className="font-medium text-gray-900">
                {!typedSaleInfo?.isActive ? 'Sale Ended' : 'Sold Out'}
              </h3>
              <p className="text-gray-600 text-sm">
                {!typedSaleInfo?.isActive ? 'This sale is no longer active' : 'All NFTs have been minted'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NFT Grid */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-light text-gray-900 mb-2">Minted NFTs</h3>
          <p className="text-gray-600">Collection showcase</p>
        </div>

        {loadingNFTs ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : nftMetadata.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No NFTs have been minted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nftMetadata.map((nft) => (
              <div key={nft.tokenId} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100">
                  {nft.image ? (
                    <Image
                      src={getIpfsImageUrl(nft.image)}
                      alt={nft.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 truncate">{nft.name || `Token #${nft.tokenId}`}</h4>
                  {nft.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{nft.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Token #{nft.tokenId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}