import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia, base, baseSepolia } from 'viem/chains'
import { getContractConfig, SPIRIT_REGISTRY_ABI, getDefaultChainId } from '~/lib/contracts'

// Helper function to convert BigInt values to strings for JSON serialization
function convertBigIntsToStrings(obj: unknown): unknown {
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings)
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntsToStrings(value)
    }
    return converted
  }
  
  return obj
}

// Create viem public client
function getPublicClient(chainId: number) {
  let chain
  switch (chainId) {
    case 1:
      chain = mainnet
      break
    case 11155111:
      chain = sepolia
      break
    case 8453:
      chain = base
      break
    case 84532:
      chain = baseSepolia
      break
    default:
      chain = sepolia // fallback
  }
  
  return createPublicClient({
    chain,
    transport: http()
  })
}

export async function POST(request: Request) {
  try {
    const { functionName, args, address, abi, chainId } = await request.json()

    if (!functionName) {
      return NextResponse.json(
        { error: 'Function name is required' },
        { status: 400 }
      )
    }

    // If custom address and abi are provided, use them
    let contractAddress, contractAbi, contractChainId

    if (address && abi) {
      contractAddress = address
      contractAbi = abi
      contractChainId = chainId || getDefaultChainId()
    } else {
      // Fallback to default registry contract
      contractChainId = getDefaultChainId()
      const contractConfig = getContractConfig(contractChainId)

      if (!contractConfig) {
        return NextResponse.json(
          { error: 'Contract not configured for this chain' },
          { status: 500 }
        )
      }

      contractAddress = contractConfig.address
      contractAbi = SPIRIT_REGISTRY_ABI
    }

    const publicClient = getPublicClient(contractChainId)

    // Read from contract
    const result = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: functionName as never,
      args: args || []
    })

    // Convert BigInt values to strings for JSON serialization
    const serializedResult = convertBigIntsToStrings(result)

    return NextResponse.json({ data: serializedResult })

  } catch (error) {
    console.error('Contract read error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read contract' },
      { status: 500 }
    )
  }
}