import { useReadContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

interface UseIsTrainerProps {
  tokenId: string | number
}

export function useIsTrainer({ tokenId }: UseIsTrainerProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId || getDefaultChainId())

  const { data: isTrainer, isLoading, error } = useReadContract({
    address: contractConfig?.address,
    abi: SPIRIT_REGISTRY_ABI,
    functionName: 'isTrainer',
    args: [BigInt(tokenId || '0'), address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!contractConfig && !!address && !!tokenId,
    },
  })

  return {
    isTrainer: !!isTrainer,
    isLoading,
    error,
    hasContractConfig: !!contractConfig,
    isConnected: !!address,
  }
}