'use client'

import { useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, usePublicClient } from 'wagmi'
import { BrowserProvider } from 'ethers'
import { OpenSeaPurchaseService } from '@/lib/opensea-purchase'

interface NFTPurchaseButtonProps {
  contractAddress: string
  tokenId: string
  nftName: string
  onPurchaseStart?: () => void
  onPurchaseComplete?: (transactionHash: string) => void
  onPurchaseError?: (error: string) => void
}

type PurchaseState = 'idle' | 'connecting' | 'fetching-price' | 'confirming' | 'purchasing' | 'success' | 'error'

export default function NFTPurchaseButton({
  contractAddress,
  tokenId,
  nftName,
  onPurchaseStart,
  onPurchaseComplete,
  onPurchaseError
}: NFTPurchaseButtonProps) {
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle')
  const [error, setError] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [gasEstimate, setGasEstimate] = useState<string>('')

  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const handlePurchase = async () => {
    try {
      setPurchaseState('connecting')
      onPurchaseStart?.()

      // Connect wallet if not connected
      if (!isConnected) {
        await open()
        return // Modal will handle connection, user needs to click again after connecting
      }

      if (!address) {
        throw new Error('No wallet address found')
      }

      setPurchaseState('fetching-price')

      // Initialize OpenSea service
      const provider = new BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      
      const purchaseService = new OpenSeaPurchaseService('main')

      // Get current price and availability
      const priceInfo = await purchaseService.getListingPrice(contractAddress, tokenId)
      
      if (!priceInfo.isAvailable) {
        throw new Error('NFT is not currently available for purchase')
      }

      setPrice(priceInfo.price)

      // Get gas estimate
      const gasInfo = await purchaseService.estimateGasCost(contractAddress, tokenId, address)
      setGasEstimate(gasInfo.gasCostEth)

      setPurchaseState('confirming')

      // Small delay to show confirmation state
      await new Promise(resolve => setTimeout(resolve, 1000))

      setPurchaseState('purchasing')

      // Execute the purchase
      const result = await purchaseService.purchaseNFT({
        contractAddress,
        tokenId,
        userAddress: address,
        provider
      })

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash)
        setPurchaseState('success')
        onPurchaseComplete?.(result.transactionHash)
      } else {
        throw new Error(result.error || 'Purchase failed')
      }

    } catch (error: any) {
      console.error('Purchase error:', error)
      const errorMsg = error.message || 'Purchase failed'
      setError(errorMsg)
      setPurchaseState('error')
      onPurchaseError?.(errorMsg)
    }
  }

  const getButtonText = () => {
    switch (purchaseState) {
      case 'idle': return '[EXECUTE_BUY_ORDER]'
      case 'connecting': return '[CONNECTING_WALLET...]'
      case 'fetching-price': return '[SCANNING_MARKETPLACE...]'
      case 'confirming': return `[CONFIRM_PURCHASE] ${price} ETH`
      case 'purchasing': return '[EXECUTING_TRANSACTION...]'
      case 'success': return '[PURCHASE_COMPLETE] ✓'
      case 'error': return '[RETRY_PURCHASE]'
      default: return '[EXECUTE_BUY_ORDER]'
    }
  }

  const getButtonColor = () => {
    switch (purchaseState) {
      case 'success': return '#00ff00'
      case 'error': return '#ff6600'
      case 'purchasing': return '#ffff00'
      default: return '#00ff00'
    }
  }

  const isDisabled = ['connecting', 'fetching-price', 'purchasing'].includes(purchaseState)

  return (
    <div style={{
      margin: '15px 0',
      padding: '15px',
      border: '2px solid #00ff00',
      background: '#000',
      textAlign: 'center'
    }}>
      <div style={{
        color: '#00ff00',
        fontSize: '11px',
        marginBottom: '10px',
        fontFamily: 'monospace'
      }}>
        [INVADERBOT_PURCHASE_PROTOCOL]
      </div>
      
      <div style={{
        color: '#888',
        fontSize: '10px',
        marginBottom: '15px'
      }}>
        TARGET :: {nftName || `${contractAddress.slice(0, 6)}...#${tokenId}`}
      </div>

      {price && (
        <div style={{
          color: '#00ff00',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          PRICE :: {price} ETH
          {gasEstimate && (
            <div style={{ color: '#888', fontSize: '9px' }}>
              + ~{gasEstimate} ETH gas
            </div>
          )}
        </div>
      )}

      <button
        onClick={handlePurchase}
        disabled={isDisabled}
        style={{
          background: isDisabled ? '#333' : 'none',
          border: `2px solid ${getButtonColor()}`,
          color: isDisabled ? '#666' : getButtonColor(),
          fontSize: '11px',
          padding: '10px 20px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace',
          width: '100%',
          maxWidth: '300px'
        }}
      >
        {getButtonText()}
      </button>

      {purchaseState === 'success' && transactionHash && (
        <div style={{
          marginTop: '10px',
          color: '#00ff00',
          fontSize: '9px'
        }}>
          <div>TRANSACTION_HASH:</div>
          <a 
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#00ff00',
              textDecoration: 'none',
              wordBreak: 'break-all'
            }}
          >
            {transactionHash.slice(0, 20)}...
          </a>
        </div>
      )}

      {purchaseState === 'error' && error && (
        <div style={{
          marginTop: '10px',
          color: '#ff6600',
          fontSize: '9px',
          border: '1px solid #ff6600',
          padding: '5px',
          background: '#330000'
        }}>
          ERROR :: {error}
        </div>
      )}

      <div style={{
        marginTop: '10px',
        color: '#666',
        fontSize: '8px'
      }}>
        POWERED_BY :: OPENSEA_PROTOCOL v7.2.1
      </div>
    </div>
  )
}