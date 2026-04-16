import { useSmartWallet } from '~/hooks/useSmartWallet'

interface GasSponsorshipIndicatorProps {
  className?: string
}

/**
 * Component that shows when gas sponsorship is active
 * Displays a small indicator to let users know their transactions are sponsored
 */
export function GasSponsorshipIndicator({ className = '' }: GasSponsorshipIndicatorProps) {
  const { canSponsorGas, isSmartWallet } = useSmartWallet()

  if (!isSmartWallet) {
    return null
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {canSponsorGas ? (
        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Gas Free</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Smart Wallet</span>
        </div>
      )}
    </div>
  )
}

/**
 * More detailed component showing smart wallet status and gas sponsorship info
 */
export function SmartWalletStatus({ className = '' }: GasSponsorshipIndicatorProps) {
  const { canSponsorGas, isSmartWallet, smartWalletAddress } = useSmartWallet()

  if (!isSmartWallet) {
    return null
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-2">Smart Wallet Active</h3>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Address:</span>
          <span className="font-mono text-gray-900">
            {smartWalletAddress ? `${smartWalletAddress.slice(0, 6)}...${smartWalletAddress.slice(-4)}` : 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Gas Sponsorship:</span>
          <div className="flex items-center space-x-1">
            {canSponsorGas ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-600 font-medium">Active</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-amber-600 font-medium">Unavailable</span>
              </>
            )}
          </div>
        </div>
        
        {canSponsorGas && (
          <div className="mt-2 text-green-600 bg-green-50 px-2 py-1 rounded text-center">
            Your transactions are sponsored - no gas fees required!
          </div>
        )}
      </div>
    </div>
  )
}