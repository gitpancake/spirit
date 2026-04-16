'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAccount, useBalance } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { 
  useAuctionData, 
  useAuctionBids, 
  usePlaceBid, 
  useSettleAuction,
  useIsWinner,
  useTokenMetadata,
  formatTimeRemaining,
  formatBidAmount
} from '~/lib/auction/hooks'

interface AuctionConfig {
  active: boolean
  contract: `0x${string}`
  chainId: number
}

interface DailyAuctionProps {
  auctionConfig: AuctionConfig | null
  agentName: string
}

export default function DailyAuction({ auctionConfig, agentName }: DailyAuctionProps) {
  const { address, isConnected } = useAccount()
  const [bidAmount, setBidAmount] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Get user's ETH balance
  const { data: balance } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Auction data hooks
  const { auctionData, isLoading: auctionLoading, error: auctionError, refetch } = useAuctionData(
    auctionConfig?.contract,
    auctionConfig?.chainId
  )

  const { bids } = useAuctionBids(
    auctionConfig?.contract,
    auctionConfig?.chainId,
    auctionData?.auctionId
  )

  const { placeBid, isPending, isConfirming, isConfirmed, hash, error: bidError } = usePlaceBid(
    auctionConfig?.contract,
    auctionConfig?.chainId
  )

  const { settleAuction, isPending: settlePending, isConfirming: settleConfirming, isConfirmed: settleConfirmed } = useSettleAuction(
    auctionConfig?.contract,
    auctionConfig?.chainId
  )

  const { isWinner } = useIsWinner(
    auctionConfig?.contract,
    auctionConfig?.chainId,
    address
  )

  // Get current token metadata
  const { metadata: tokenMetadata, metadataLoading } = useTokenMetadata(
    auctionConfig?.contract,
    auctionConfig?.chainId,
    auctionData?.tokenId
  )

  // Update time remaining every second
  useEffect(() => {
    if (!auctionData?.endTime) return

    const updateTime = () => {
      setTimeRemaining(formatTimeRemaining(auctionData.endTime))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [auctionData?.endTime])

  // Refetch auction data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed || settleConfirmed) {
      refetch()
    }
  }, [isConfirmed, settleConfirmed, refetch])

  if (!auctionConfig || !auctionConfig.active) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-light text-gray-900 mb-2">No Active Auction</h3>
        <p className="text-gray-600">This artist does not currently have daily auctions enabled.</p>
      </div>
    )
  }

  if (auctionLoading) {
    return (
      <div className="text-center py-16">
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-gray-600">Loading auction data...</p>
      </div>
    )
  }

  if (auctionError) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-light text-gray-900 mb-2">Error Loading Auction</h3>
        <p className="text-gray-600">Failed to load auction data. Please try again.</p>
      </div>
    )
  }

  if (!auctionData?.exists) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-light text-gray-900 mb-2">No Auction Available</h3>
        <p className="text-gray-600">No auction is currently available for {agentName}.</p>
      </div>
    )
  }

  // No minimum bid restrictions - users can bid any amount above current bid
  const currentBid = auctionData.highestBid || BigInt(0)

  const handlePlaceBid = () => {
    if (!bidAmount || !isConnected) return

    try {
      const bidValue = parseEther(bidAmount)
      
      // Only check that bid is higher than current bid
      if (bidValue <= currentBid) {
        alert(`Bid must be higher than current bid of ${formatBidAmount(currentBid)} ETH`)
        return
      }

      if (balance && bidValue > balance.value) {
        alert('Insufficient balance')
        return
      }

      placeBid(bidAmount)
    } catch (err) {
      console.error('Error placing bid:', err)
      alert('Invalid bid amount')
    }
  }

  return (
    <div className="space-y-8">
      {/* Auction Status */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm font-medium text-gray-900">
              Auction #{auctionData?.auctionId?.toString() || '---'}
            </div>
            <div className="text-sm text-gray-600">
              {auctionData?.isAuctionActive ? `${timeRemaining} remaining` : 
               auctionData?.canSettleNow ? 'Ready to settle' :
               auctionData?.settled ? 'Settled' : 'Inactive'}
            </div>
          </div>
          {!auctionData?.isAuctionActive && !auctionData?.settled && auctionData?.canSettleNow && (
            <button
              onClick={settleAuction}
              disabled={settlePending || settleConfirming}
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
            >
              {settlePending || settleConfirming ? 'Settling...' : 'Settle Auction'}
            </button>
          )}
        </div>
      </div>

      {/* Main Auction Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Token Image */}
        <div>
          <div className="aspect-square bg-gray-50">
            {tokenMetadata?.image ? (
              <Image 
                src={tokenMetadata.image.startsWith('ipfs://') 
                  ? tokenMetadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                  : tokenMetadata.image
                }
                alt={tokenMetadata.name || 'Token artwork'}
                width={800}
                height={800}
                className="w-full h-full object-contain bg-gray-50"
              />
            ) : metadataLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
                  <span className="text-gray-400 text-sm">Loading artwork</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No artwork available</span>
              </div>
            )}
          </div>
        </div>

        {/* Auction Info & Bidding */}
        <div className="space-y-8">
          {/* Token Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-2">
                {tokenMetadata?.name || `Token #${auctionData?.tokenId?.toString() || '---'}`}
              </h2>
              <p className="text-gray-600">
                Token #{auctionData?.tokenId?.toString() || '---'}
              </p>
              {tokenMetadata?.description && (
                <p className="text-gray-700 mt-4 leading-relaxed">
                  {tokenMetadata.description}
                </p>
              )}
            </div>

            {/* Current Bid */}
            <div className="bg-gray-50 p-6">
              <div className="text-center space-y-2">
                <div className="text-gray-600 text-sm font-medium uppercase tracking-wider">Current High Bid</div>
                <div className="text-gray-900 text-4xl font-light">
                  {auctionData?.highestBid && auctionData.highestBid > BigInt(0) 
                    ? `${formatBidAmount(auctionData.highestBid)} ETH` 
                    : 'No bids'
                  }
                </div>
                {auctionData?.highestBid && auctionData.highestBid > BigInt(0) ? (
                  auctionData?.highestBidder && auctionData.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                    <div className="text-gray-500 text-sm">
                      by {auctionData.highestBidder.slice(0, 6)}...{auctionData.highestBidder.slice(-4)}
                      {isWinner && <span className="text-gray-900 font-medium"> (you)</span>}
                    </div>
                  )
                ) : (
                  <div className="text-gray-500 text-sm">Be the first to bid</div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200">
                <div className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Total Bids</div>
                <div className="text-gray-900 text-xl font-light">{auctionData?.totalBids?.toString() || '0'}</div>
              </div>
              <div className="text-center p-4 border border-gray-200">
                <div className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Status</div>
                <div className={`text-sm font-medium ${auctionData?.isAuctionActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {auctionData?.isAuctionActive ? 'Live' : 'Ended'}
                </div>
              </div>
            </div>
          </div>

          {/* Bidding Interface */}
          <div>
            {auctionData?.isAuctionActive ? (
              isConnected ? (
                <div className="space-y-6">
                  {/* Bid Form */}
                  <div className="bg-gray-50 p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Place Your Bid</h3>
                      </div>
                      
                      {/* Bid Input */}
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={currentBid > BigInt(0) ? `>${formatBidAmount(currentBid)}` : "0.001"}
                          className="w-full border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 text-lg text-center bg-white"
                        />
                        <div className="text-gray-500 text-xs text-center">
                          ETH Amount
                        </div>
                      </div>

                      {/* Quick bid suggestions */}
                      {currentBid > BigInt(0) && (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            Number(formatBidAmount(currentBid)) + 0.001,
                            Number(formatBidAmount(currentBid)) + 0.01,
                            Number(formatBidAmount(currentBid)) + 0.1
                          ].map((amount, index) => (
                            <button
                              key={index}
                              onClick={() => setBidAmount(amount.toFixed(3))}
                              className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-3 py-2 text-sm transition-colors"
                            >
                              +{index === 0 ? '0.001' : index === 1 ? '0.01' : '0.1'}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Wallet Balance */}
                      {balance && (
                        <div className="border border-gray-200 p-3 text-center">
                          <div className="text-gray-600 text-xs font-medium">Wallet Balance</div>
                          <div className="text-gray-900 text-sm">
                            {Number(formatEther(balance.value)).toFixed(4)} ETH
                          </div>
                        </div>
                      )}

                      {/* Bid Button */}
                      <button
                        onClick={handlePlaceBid}
                        disabled={!bidAmount || isPending || isConfirming}
                        className="w-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm font-medium transition-colors"
                      >
                        {isPending ? 'Confirm in wallet' : 
                         isConfirming ? 'Processing...' : 
                         'Submit Bid'}
                      </button>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {bidError && (
                    <div className="border border-red-300 bg-red-50 p-3">
                      <div className="text-red-600 text-sm text-center">
                        {bidError.message.includes('user rejected') ? 'Transaction rejected' : 'Bid failed'}
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

                  {/* Recent Bids */}
                  {bids.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Recent Bids</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {bids.slice(0, 5).map((bid, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-600 text-sm">
                              {bid.bidder.slice(0, 4)}...{bid.bidder.slice(-4)}
                              {bid.bidder === address && <span className="text-gray-900 font-medium"> (you)</span>}
                            </span>
                            <div className="text-right">
                              <div className="text-gray-900 text-sm font-medium">
                                {formatBidAmount(bid.amount)} ETH
                              </div>
                              {index === 0 && (
                                <div className="text-green-600 text-xs">Current high</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 p-6 space-y-3">
                    <h3 className="font-medium text-gray-900">Connect Wallet to Bid</h3>
                    <p className="text-gray-600 text-sm">
                      Authentication required to participate in auction
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-50 p-6 space-y-3">
                  <h3 className="font-medium text-gray-900">
                    {auctionData?.settled ? 'Auction Complete' : 'Auction Ended'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {auctionData?.settled 
                      ? 'This auction has been settled'
                      : 'Waiting for settlement'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traits Section */}
      {tokenMetadata?.attributes && tokenMetadata.attributes.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attributes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tokenMetadata.attributes.map((attr: { trait_type: string; value: string }, index: number) => (
              <div key={index} className="border border-gray-200 p-3">
                <div className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">
                  {attr.trait_type}
                </div>
                <div className="text-gray-900 text-sm">{attr.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}