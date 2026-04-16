'use client'

import Link from 'next/link'
import engagementsData from '~/data/engagements.json'

export default function UpcomingEngagements() {
  const { featured, upcoming } = engagementsData
  
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

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-3">
              Upcoming Engagements
            </h2>
            <p className="text-base font-light text-neutral-600 max-w-2xl">
              Launches, exhibitions, and institutional presentations
            </p>
          </div>
          <Link href="/engagements" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase">
            Full Calendar →
          </Link>
        </div>

        {/* Compact Calendar-Style List */}
        <div className="space-y-1">
          {/* Featured Event */}
          <div className="bg-neutral-50 border-l-4 border-neutral-900 p-6 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex space-x-6">
                {/* Date Block */}
                <div className="text-center min-w-[60px] flex-shrink-0">
                  <div className="text-2xl font-extralight text-neutral-900">{formatDate(featured.date).day}</div>
                  <div className="text-xs font-light text-neutral-600 tracking-wider uppercase">{formatDate(featured.date).month}</div>
                  <div className="text-xs font-light text-neutral-400">{formatDate(featured.date).year}</div>
                </div>
                
                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 text-xs font-light tracking-wider uppercase bg-neutral-900 text-white">
                      {featured.type}
                    </span>
                    {featured.spirit && (
                      <span className="text-xs font-light text-neutral-600 tracking-wider uppercase">
                        {featured.spirit}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-light text-neutral-900 mb-2">{featured.title}</h3>
                  <p className="text-sm font-light text-neutral-600 leading-relaxed mb-3 max-w-2xl">
                    {featured.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs font-light text-neutral-500">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(featured.time)}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {featured.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events - Compact List */}
          {upcoming.slice(0, 4).map((engagement) => {
            const date = formatDate(engagement.date)
            
            return (
              <div key={engagement.id} className="bg-white border-b border-neutral-100 p-4 hover:bg-neutral-50/50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-6">
                    {/* Date */}
                    <div className="text-center min-w-[50px] flex-shrink-0">
                      <div className="text-lg font-light text-neutral-900">{date.day}</div>
                      <div className="text-xs font-light text-neutral-500 tracking-wider uppercase">{date.month}</div>
                    </div>
                    
                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="px-2 py-1 text-xs font-light tracking-wider uppercase bg-neutral-100 text-neutral-700">
                          {engagement.type}
                        </span>
                        {engagement.spirit && (
                          <span className="text-xs font-light text-neutral-500 tracking-wider uppercase">
                            {engagement.spirit}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-light text-neutral-900 mb-1">{engagement.title}</h4>
                      <p className="text-sm font-light text-neutral-600 leading-relaxed mb-2 max-w-xl">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                        className="text-xs font-light text-neutral-500 hover:text-neutral-900 transition-colors tracking-wide uppercase opacity-0 group-hover:opacity-100"
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

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/engagements" 
            className="inline-flex items-center text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase"
          >
            View Full Calendar
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}