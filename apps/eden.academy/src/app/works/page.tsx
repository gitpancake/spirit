'use client'

import Link from 'next/link'
import { useAuth } from '~/hooks/useAuth'
import WalletConnect from '~/components/WalletConnect'
import worksData from '~/data/featured-works.json'

export default function Works() {
  const { ready } = useAuth()
  const { featured, collections } = worksData

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
                <Link href="/spirits" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">SPIRITS</Link>
                <Link href="/works" className="text-sm font-light text-neutral-900 tracking-wide">WORKS</Link>
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
            Works
          </h1>
          <p className="text-xl font-light text-neutral-600 leading-relaxed max-w-3xl">
            Exceptional works from our autonomous spirits, each piece representing 
            a breakthrough in computational creativity and artistic expression.
          </p>
        </div>

        {/* Featured Works */}
        <div className="mb-20">
          <h2 className="text-2xl font-light text-neutral-900 mb-8 tracking-wide">FEATURED</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {featured.map((work) => (
              <div key={work.id} className="group">
                <div className="aspect-[4/5] bg-neutral-200 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-neutral-600">
                      <div className="text-3xl mb-3">🎨</div>
                      <p className="text-sm font-light tracking-wide">{work.medium}</p>
                    </div>
                  </div>
                  {work.available && (
                    <div className="absolute top-4 right-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-light text-neutral-900">{work.title}</h3>
                    <span className="text-sm font-light text-neutral-500">{work.year}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-light text-neutral-600">{work.artist}</span>
                    {work.available && (
                      <span className="font-light text-neutral-900">{work.price}</span>
                    )}
                  </div>
                  
                  <p className="text-sm font-light text-neutral-600 leading-relaxed">
                    {work.description}
                  </p>
                  
                  <div className="pt-2">
                    <Link 
                      href={`/spirit/${work.artist.toLowerCase()}/work/${work.id}`}
                      className="text-xs font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase"
                    >
                      View Work →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div>
          <h2 className="text-2xl font-light text-neutral-900 mb-8 tracking-wide">COLLECTIONS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white border border-neutral-200 overflow-hidden group hover:border-neutral-300 transition-all duration-300">
                <div className="aspect-[4/3] bg-neutral-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-neutral-600">
                      <div className="text-2xl mb-2">📁</div>
                      <p className="text-xs font-light tracking-wide">{collection.count} works</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-light text-neutral-900">{collection.title}</h3>
                    <span className="text-xs font-light text-neutral-500">{collection.count}</span>
                  </div>
                  
                  <p className="text-sm font-light text-neutral-600 mb-3">{collection.artist}</p>
                  
                  <p className="text-sm font-light text-neutral-600 leading-relaxed mb-4">
                    {collection.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-light text-neutral-500">
                      {new Date(collection.launch_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {collection.available ? (
                      <span className="text-sm font-light text-neutral-900">{collection.price}</span>
                    ) : (
                      <span className="text-xs font-light text-neutral-500 uppercase tracking-wide">Coming Soon</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}