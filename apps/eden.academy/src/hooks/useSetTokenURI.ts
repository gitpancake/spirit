'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SPIRIT_REGISTRY_ABI } from '~/lib/contracts'

export function useSetTokenURI() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { 
    isLoading: isConfirming, 
    isSuccess, 
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  })

  const setTokenURI = async ({ 
    tokenId, 
    contractAddress, 
    newMetadataURI 
  }: {
    tokenId: string
    contractAddress: string
    newMetadataURI: string
  }) => {
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: SPIRIT_REGISTRY_ABI,
        functionName: 'setTokenURI',
        args: [BigInt(tokenId), newMetadataURI]
      })
    } catch (error) {
      console.error('Failed to set token URI:', error)
      throw error
    }
  }

  return {
    setTokenURI,
    isPending,
    isConfirming,
    isSuccess,
    transactionHash: hash,
    error: error || receiptError
  }
}