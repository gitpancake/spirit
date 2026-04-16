'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { GasSponsorshipIndicator } from './GasSponsorshipIndicator'

interface WalletConnectProps {
  isTransparent?: boolean
}

export default function WalletConnect({ isTransparent = false }: WalletConnectProps) {
  const { address } = useAccount()
  const { login, logout, authenticated } = usePrivy()
  const { isSmartWallet, canSponsorGas, smartWalletAddress } = useSmartWallet()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (authenticated && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center space-x-2 px-3 py-2 text-sm transition-all duration-300 rounded-lg font-mono ${
            isTransparent 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
          }`}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>0x{address.slice(2, 4)}...{address.slice(-4)}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
              <p className="text-sm font-mono text-gray-900 truncate mb-2">{address}</p>
              <GasSponsorshipIndicator />
            </div>
            
            {isSmartWallet && (
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Smart Wallet</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-mono text-gray-900">
                      {smartWalletAddress ? `${smartWalletAddress.slice(0, 6)}...${smartWalletAddress.slice(-4)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gas Sponsorship:</span>
                    <span className={`font-medium ${canSponsorGas ? 'text-green-600' : 'text-amber-600'}`}>
                      {canSponsorGas ? 'Active' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                {canSponsorGas && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✨ Your transactions are sponsored
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => {
                logout()
                setIsDropdownOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className={`font-mono px-4 py-2 text-sm transition-all duration-300 rounded ${
        isTransparent
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
    >
      CONNECT WALLET
    </button>
  )
}