'use client'

import Link from 'next/link'
import { useAuth } from '~/hooks/useAuth'
import WalletConnect from '~/components/WalletConnect'
import engagementsData from '~/data/engagements.json'

export default function Engagements() {
  const { ready } = useAuth()
  const { featured, upcoming, calendar } = engagementsData

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear().toString()
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.replace(' UTC', '')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    )
  }

  const allEngagements = [featured, ...upcoming, ...calendar].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

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
                <Link href="/works" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">WORKS</Link>
                <Link href="/engagements" className="text-sm font-light text-neutral-900 tracking-wide">ENGAGEMENTS</Link>
                <Link href="/academy" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">ACADEMY</Link>
                <Link href="/journal" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">JOURNAL</Link>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-extralight text-neutral-900 mb-4 leading-tight">
            Engagements
          </h1>
          <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-2xl">
            Launches, exhibitions, and institutional presentations
          </p>
        </div>

        {/* Calendar View - Compact List */}
        <div className="space-y-1">
          {allEngagements.map((engagement, index) => {
            const date = formatDate(engagement.date)
            const isPast = new Date(engagement.date) < new Date()
            const isFeatured = index === 0
            
            return (
              <div 
                key={engagement.id} 
                className={`${
                  isFeatured 
                    ? 'bg-white border-l-4 border-neutral-900 p-6 mb-6 shadow-sm' 
                    : 'bg-white border-b border-neutral-100 p-4 hover:bg-neutral-50/50 transition-colors'
                } ${isPast ? 'opacity-60' : ''} group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-6">
                    {/* Date Block */}
                    <div className={`text-center ${isFeatured ? 'min-w-[60px]' : 'min-w-[50px]'} flex-shrink-0`}>
                      <div className={`${isFeatured ? 'text-2xl' : 'text-lg'} font-extralight text-neutral-900`}>
                        {date.day}
                      </div>
                      <div className="text-xs font-light text-neutral-500 tracking-wider uppercase">
                        {date.month}
                      </div>
                      <div className="text-xs font-light text-neutral-400">{date.year}</div>
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-light tracking-wider uppercase ${
                          isFeatured 
                            ? 'bg-neutral-900 text-white' 
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {engagement.type}
                        </span>
                        {engagement.spirit && (
                          <span className="text-xs font-light text-neutral-600 tracking-wider uppercase">
                            {engagement.spirit}
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs font-light text-neutral-400 tracking-wider uppercase">PAST</span>
                        )}
                      </div>
                      
                      <h3 className={`${isFeatured ? 'text-xl' : 'text-base'} font-light text-neutral-900 mb-2`}>
                        {engagement.title}
                      </h3>
                      
                      <p className="text-sm font-light text-neutral-600 leading-relaxed mb-3 max-w-2xl">
                        {engagement.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs font-light text-neutral-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(engagement.time)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                          </svg>
                          {engagement.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {engagement.external_url && engagement.external_url !== "" && (
                      <a 
                        href={engagement.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs font-light text-neutral-500 hover:text-neutral-900 transition-colors tracking-wide uppercase ${
                          !isFeatured && 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        Details →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}