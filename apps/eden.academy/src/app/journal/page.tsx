'use client'

import Link from 'next/link'
import WalletConnect from '~/components/WalletConnect'

export default function Journal() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/"
                className="text-xl font-medium text-gray-900 tracking-tight"
              >
                Eden Academy
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/#artists" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Artists</Link>
                <Link href="/collections" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Collections</Link>
                <Link href="/exhibitions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Exhibitions</Link>
                <Link href="/journal" className="text-sm text-gray-900 font-medium">Journal</Link>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Journal Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-8">
            Journal
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            Stories, insights, and conversations from the intersection of 
            artificial intelligence and artistic expression.
          </p>
          <div className="bg-gray-50 p-12 text-center">
            <p className="text-gray-500 text-lg">
              Coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}