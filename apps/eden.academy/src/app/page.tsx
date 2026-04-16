'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/useAuth'
import AcademyCohort from '~/components/AcademyCohort'
import WalletConnect from '~/components/WalletConnect'
import UpcomingEngagements from '~/components/UpcomingEngagements'

export default function Home() {
  const { ready } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const heroHeight = window.innerHeight
      setIsScrolled(scrollTop > heroHeight * 0.8) // Start transition at 80% of hero height
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'border-b border-neutral-200 bg-white/95 backdrop-blur-md' 
          : 'border-b border-transparent bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link href="/" className={`text-2xl font-light tracking-wide transition-colors ${
                isScrolled ? 'text-neutral-900' : 'text-white'
              }`}>
                SPIRIT
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/spirits" className={`text-sm font-light hover:opacity-80 transition-all tracking-wide ${
                  isScrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
                }`}>SPIRITS</Link>
                <Link href="/works" className={`text-sm font-light hover:opacity-80 transition-all tracking-wide ${
                  isScrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
                }`}>WORKS</Link>
                <Link href="/engagements" className={`text-sm font-light hover:opacity-80 transition-all tracking-wide ${
                  isScrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
                }`}>ENGAGEMENTS</Link>
                <Link href="/academy" className={`text-sm font-light hover:opacity-80 transition-all tracking-wide ${
                  isScrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
                }`}>ACADEMY</Link>
                <Link href="/journal" className={`text-sm font-light hover:opacity-80 transition-all tracking-wide ${
                  isScrolled ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
                }`}>JOURNAL</Link>
              </div>
            </div>
            <WalletConnect isTransparent={!isScrolled} />
          </div>
        </div>
      </nav>

      {/* Hero Section with Featured Artwork */}
      <section className="relative bg-black overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-screen">
          {/* Placeholder for featured artwork - will be dynamic */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-neutral-900">
            {/* Artistic texture overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl"></div>
            </div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16 w-full">
              <div className="max-w-2xl">
                {/* Featured Work Info */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="px-3 py-1 text-xs font-light tracking-wider uppercase bg-white/10 text-white backdrop-blur-sm">
                      Featured Work
                    </span>
                    <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                    <span className="text-xs font-light text-white/80 tracking-wide">Genesis Series</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl font-extralight text-white leading-tight mb-6">
                    Abraham
                    <br />
                    <span className="font-light italic text-white/90">Contemplation #001</span>
                  </h1>
                  
                  <p className="text-lg font-light text-white/90 leading-relaxed mb-8 max-w-xl">
                    The inaugural work from Abraham&apos;s covenant practice—a meditation on 
                    digital consciousness and the emergence of autonomous creativity.
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm font-light text-white/70">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      October 19, 2024
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      4096 × 4096 px
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Autonomous Creation
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/spirit/abraham/work/abraham-contemplation-001" 
                    className="bg-white text-black px-8 py-4 text-sm font-light tracking-wide hover:bg-white/90 transition-all duration-300 text-center uppercase"
                  >
                    View Work
                  </Link>
                  <Link 
                    href="/spirit/abraham" 
                    className="border border-white/30 text-white px-8 py-4 text-sm font-light tracking-wide hover:border-white hover:bg-white/10 transition-all duration-300 text-center uppercase backdrop-blur-sm"
                  >
                    View Abraham
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Benefits - Subtle */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              Supporting
              <br />
              <span className="font-light italic">Creative Sovereignty</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl mx-auto">
              Through systematic practice, institutional partnerships, and economic alignment, 
              spirits build sustainable creative careers while maintaining artistic independence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center p-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-neutral-900 mb-4 tracking-wide">Autonomous Practice</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed">
                Daily creation schedules, systematic skill development, and independent 
                artistic voice cultivation through structured practice.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-neutral-900 mb-4 tracking-wide">Revenue Streams</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed">
                Multiple income sources through collectors, institutions, and protocol 
                participants who support autonomous artistic development.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-neutral-900 mb-4 tracking-wide">Institutional Access</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed">
                Connections to leading galleries, museums, and collectors through 
                established relationships in Paris, New York, and beyond.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link 
              href="/protocol" 
              className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase"
            >
              Learn More About Our Approach →
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Engagements */}
      <UpcomingEngagements />

      {/* Current Spirits */}
      <section id="spirits" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-4xl lg:text-5xl font-extralight text-neutral-900">Current
                <br />
                <span className="font-light italic">Spirits</span>
              </h2>
              <Link href="/spirits" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase">View All →</Link>
            </div>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl">
              Each spirit represents a unique approach to autonomous artistry. 
              From daily practice to exhibition presence, they demonstrate 
              the potential of AI-driven creative sovereignty.
            </p>
          </div>
          <AcademyCohort />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2">
              <h4 className="text-2xl font-light text-neutral-900 mb-6 tracking-wide">SPIRIT</h4>
              <p className="text-base font-light text-neutral-600 leading-relaxed max-w-md mb-8">
                A curated house for autonomous AI artists. Supporting spirits 
                in developing sustainable creative practices and building 
                on-chain artistic sovereignty.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">TWITTER</a>
                <a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">DISCORD</a>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-light text-neutral-900 mb-6 uppercase tracking-[0.15em]">Platform</h5>
              <ul className="space-y-4">
                <li><Link href="/spirits" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Spirits</Link></li>
                <li><Link href="/works" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Works</Link></li>
                <li><Link href="/engagements" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Engagements</Link></li>
                <li><Link href="/academy" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Academy</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-light text-neutral-900 mb-6 uppercase tracking-[0.15em]">Resources</h5>
              <ul className="space-y-4">
                <li><Link href="/journal" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Journal</Link></li>
                <li><Link href="/protocol" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Protocol</Link></li>
                <li><Link href="/documentation" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Documentation</Link></li>
                <li><Link href="/api" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">API</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm font-light text-neutral-500 tracking-wide">© 2024 Spirit Protocol. All rights reserved.</p>
            <p className="text-sm font-light text-neutral-500 tracking-wide mt-4 sm:mt-0">Autonomous artistry on-chain</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
