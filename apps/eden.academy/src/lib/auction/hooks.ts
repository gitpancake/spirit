/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, isAddress } from 'viem'
import { THIRTEEN_YEAR_AUCTION_ABI } from './abi'

export type AuctionData = {
  auctionId: bigint
  tokenId: bigint
  startTime: bigint
  endTime: bigint
  highestBidder: `0x${string}`
  highestBid: bigint
  settled: boolean
  exists: boolean
  isAuctionActive: boolean
  hasStarted: boolean
  hasEnded: boolean
  canSettleNow: boolean
  nextTokenUriSeeded: boolean
  totalBids: bigint
}

export type BidData = {
  bidder: `0x${string}`
  amount: bigint
  timestamp: bigint
}

export function useAuctionData(contractAddress: `0x${string}` | undefined, chainId: number | undefined) {
  const { data: auctionView, error, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: THIRTEEN_YEAR_AUCTION_ABI,
    functionName: 'getCurrentAuctionView',
    chainId: chainId as any,
    query: {
      enabled: !!contractAddress && !!chainId,
      refetchInterval: 30000, // Refetch every 30 seconds (reduced from 5s)
      retry: 3,
      retryDelay: 1000,
      staleTime: 20000, // Consider data fresh for 20 seconds
    },
  })


  const auctionData: AuctionData | null = auctionView ? {
    auctionId: auctionView[0],
    tokenId: auctionView[1], 
    startTime: auctionView[2],
    endTime: auctionView[3],
    highestBidder: auctionView[4],
    highestBid: auctionView[5],
    settled: auctionView[6],
    exists: auctionView[7],
    isAuctionActive: auctionView[8],
    hasStarted: auctionView[9],
    hasEnded: auctionView[10],
    canSettleNow: auctionView[11],
    nextTokenUriSeeded: auctionView[12],
    totalBids: auctionView[13]
  } : null

  return {
    auctionData,
    isLoading,
    error,
    refetch,
  }
}

export function useAuctionBids(
  contractAddress: `0x${string}` | undefined, 
  chainId: number | undefined,
  auctionId: bigint | undefined,
  count: number = 10
) {
  const { data: bids, error, isLoading } = useReadContract({
    address: contractAddress,
    abi: THIRTEEN_YEAR_AUCTION_ABI,
    functionName: 'getRecentAuctionBids',
    args: auctionId !== undefined ? [auctionId, BigInt(count)] : undefined,
    chainId: chainId as any,
    query: {
      enabled: !!contractAddress && !!chainId && auctionId !== undefined,
      refetchInterval: 30000, // Refetch every 30 seconds (reduced from 5s)
      staleTime: 20000, // Consider data fresh for 20 seconds
    },
  })

  const bidData: BidData[] = bids ? bids.map(bid => ({
    bidder: bid.bidder,
    amount: bid.amount,
    timestamp: bid.timestamp
  })) : []

  return {
    bids: bidData,
    isLoading,
    error,
  }
}

export function usePlaceBid(contractAddress: `0x${string}` | undefined, chainId: number | undefined) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash,
    chainId: chainId as any
  })

  const placeBid = (bidAmount: string) => {
    if (!contractAddress || !chainId) return

    try {
      const value = parseEther(bidAmount)
      writeContract({
        address: contractAddress,
        abi: THIRTEEN_YEAR_AUCTION_ABI,
        functionName: 'placeBid',
        value,
        chainId: chainId as any,
      })
    } catch (err) {
      console.error('Error placing bid:', err)
    }
  }

  return {
    placeBid,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  }
}

export function useSettleAuction(contractAddress: `0x${string}` | undefined, chainId: number | undefined) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash,
    chainId: chainId as any
  })

  const settleAuction = () => {
    if (!contractAddress || !chainId) return

    writeContract({
      address: contractAddress,
      abi: THIRTEEN_YEAR_AUCTION_ABI,
      functionName: 'settleAuction',
      chainId: chainId as any,
    })
  }

  return {
    settleAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  }
}

export function useIsWinner(contractAddress: `0x${string}` | undefined, chainId: number | undefined, userAddress: `0x${string}` | undefined) {
  const { data: isWinner, error, isLoading } = useReadContract({
    address: contractAddress,
    abi: THIRTEEN_YEAR_AUCTION_ABI,
    functionName: 'isWinner',
    args: userAddress ? [userAddress] : undefined,
    chainId: chainId as any,
    query: {
      enabled: !!contractAddress && !!chainId && !!userAddress && isAddress(userAddress),
      refetchInterval: 60000, // Refetch every 60 seconds (reduced from 10s)
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  })

  return {
    isWinner: !!isWinner,
    isLoading,
    error,
  }
}

// Utility functions
export function formatTimeRemaining(endTime: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = Number(endTime) - now

  if (timeLeft <= 0) {
    return 'Auction ended'
  }

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

export function formatBidAmount(amount: bigint): string {
  return Number(formatEther(amount)).toFixed(4)
}

export function useTokenMetadata(
  contractAddress: `0x${string}` | undefined,
  chainId: number | undefined,
  tokenId: bigint | undefined
) {
  // First get the token URI
  const { data: tokenURI } = useReadContract({
    address: contractAddress,
    abi: THIRTEEN_YEAR_AUCTION_ABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: chainId as any,
    query: {
      enabled: !!contractAddress && !!chainId && tokenId !== undefined,
    },
  })

  // Then fetch the metadata from the URI
  const [metadata, setMetadata] = useState<any>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenURI) return

    const fetchMetadata = async () => {
      setMetadataLoading(true)
      setMetadataError(null)
      
      try {
        let metadataUrl = tokenURI
        
        // Handle IPFS URLs
        if (tokenURI.startsWith('ipfs://')) {
          metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
        }
        
        const response = await fetch(metadataUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch metadata')
        }
        
        const data = await response.json()
        setMetadata(data)
      } catch (error) {
        console.error('Error fetching token metadata:', error)
        setMetadataError('Failed to load token metadata')
      } finally {
        setMetadataLoading(false)
      }
    }

    fetchMetadata()
  }, [tokenURI])

  return {
    tokenURI,
    metadata,
    metadataLoading,
    metadataError,
  }
}

