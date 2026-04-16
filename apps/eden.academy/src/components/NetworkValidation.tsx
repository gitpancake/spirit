import { useNetworkValidation } from '~/hooks/useNetworkValidation'

interface NetworkValidationProps {
  className?: string
  showWhenCorrect?: boolean
}

/**
 * Component that shows network validation status and allows switching
 * Displays warning when user is on wrong network with switch button
 */
export function NetworkValidationBanner({ className = '', showWhenCorrect = false }: NetworkValidationProps) {
  const { 
    isCorrectNetwork, 
    requiredChainName, 
    canSwitchNetwork, 
    switchNetwork, 
    networkError 
  } = useNetworkValidation()

  // Show success state only if explicitly requested
  if (isCorrectNetwork && !showWhenCorrect) {
    return null
  }

  // Success state
  if (isCorrectNetwork && showWhenCorrect) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2 text-green-800">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Connected to {requiredChainName}</span>
        </div>
      </div>
    )
  }

  // Warning state - wrong network
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-amber-800">Wrong Network</h3>
          <p className="mt-1 text-sm text-amber-700">
            Please switch to <span className="font-medium">{requiredChainName}</span> to continue with transactions.
          </p>
          
          {networkError && (
            <p className="mt-1 text-xs text-red-600">
              Error: {networkError}
            </p>
          )}
          
          <div className="mt-3">
            <button
              onClick={switchNetwork}
              disabled={!canSwitchNetwork}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-1.5 px-3 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canSwitchNetwork ? `Switch to ${requiredChainName}` : 'Switching...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact network indicator for headers/navigation
 */
export function NetworkIndicator({ className = '' }: { className?: string }) {
  const { isCorrectNetwork, requiredChainName } = useNetworkValidation()

  return (
    <div className={`inline-flex items-center ${className}`}>
      {isCorrectNetwork ? (
        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>{requiredChainName}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
          <span>Wrong Network</span>
        </div>
      )}
    </div>
  )
}

/**
 * Transaction blocker component - prevents transactions on wrong network
 */
export function TransactionGuard({ 
  children, 
  fallback,
  className = '' 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  const { isCorrectNetwork } = useNetworkValidation()

  if (!isCorrectNetwork) {
    return (
      <div className={className}>
        {fallback || <NetworkValidationBanner />}
      </div>
    )
  }

  return <>{children}</>
}