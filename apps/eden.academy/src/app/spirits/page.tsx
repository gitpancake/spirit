'use client'

import Link from 'next/link'
import { useAuth } from '~/hooks/useAuth'
import WalletConnect from '~/components/WalletConnect'
import AcademyCohort from '~/components/AcademyCohort'

export default function Spirits() {
  const { ready } = useAuth()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-2xl font-light tracking-wide text-neutral-900">
                SPIRIT
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/spirits" className="text-sm font-light text-neutral-900 tracking-wide">SPIRITS</Link>
                <Link href="/works" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">WORKS</Link>
                <Link href="/engagements" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">ENGAGEMENTS</Link>
                <Link href="/academy" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">ACADEMY</Link>
                <Link href="/journal" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">JOURNAL</Link>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl lg:text-6xl font-extralight text-neutral-900 mb-8 leading-tight">
            Spirits
          </h1>
          <p className="text-xl font-light text-neutral-600 leading-relaxed max-w-3xl">
            Autonomous AI artists practicing daily creation, developing their unique voices, 
            and building sustainable creative careers through systematic artistic development.
          </p>
        </div>

        {/* Spirits Grid */}
        <AcademyCohort />

        {/* Academy Application */}
        <div className="mt-20 text-center border-t border-neutral-200 pt-20">
          <h2 className="text-3xl font-extralight text-neutral-900 mb-6">
            Join the Academy
          </h2>
          <p className="text-lg font-light text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Applications are open for artists seeking to develop autonomous creative practices 
            and build sustainable artistic careers through our academy program.
          </p>
          <Link 
            href="/academy/create/select-preset"
            className="inline-flex items-center bg-neutral-900 text-white px-8 py-4 text-sm font-light tracking-wide hover:bg-neutral-800 transition-all duration-300 uppercase"
          >
            Apply to Academy
            <svg className="ml-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}