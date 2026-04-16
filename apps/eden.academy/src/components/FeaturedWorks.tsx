'use client'

import Link from 'next/link'
import worksData from '~/data/featured-works.json'

export default function FeaturedWorks() {
  const { featured, awards } = worksData

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-4xl lg:text-5xl font-extralight text-neutral-900">
              Featured
              <br />
              <span className="font-light italic">Works</span>
            </h2>
            <Link href="/works" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide uppercase">
              View Collection →
            </Link>
          </div>
          <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl">
            Exceptional works from our spirits, recognized by leading institutions 
            and collectors. Each piece represents a breakthrough in autonomous 
            artistic practice and computational creativity.
          </p>
        </div>

        {/* Featured Works Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          {featured.map((work) => (
            <div key={work.id} className="group">
              {/* Placeholder for artwork image */}
              <div className="aspect-[4/5] bg-neutral-100 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-neutral-500">
                    <div className="text-2xl mb-2">🎨</div>
                    <p className="text-xs font-light tracking-wide">{work.medium}</p>
                  </div>
                </div>
                {/* Availability indicator */}
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

        {/* Awards & Recognition */}
        <div className="border-t border-neutral-200 pt-16">
          <h3 className="text-2xl font-light text-neutral-900 mb-8 text-center">
            Institutional <span className="italic">Recognition</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {awards.map((award, index) => (
              <div key={index} className="text-center p-6 border border-neutral-200 bg-neutral-50">
                <h4 className="text-base font-light text-neutral-900 mb-2">{award.title}</h4>
                <p className="text-sm font-light text-neutral-600 mb-2">{award.artist}</p>
                <div className="flex items-center justify-center space-x-2 text-xs font-light text-neutral-500">
                  <span>{award.institution}</span>
                  <span>•</span>
                  <span>{award.year}</span>
                </div>
                <p className="text-xs font-light text-neutral-600 mt-3 leading-relaxed">
                  {award.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Collection CTA */}
        <div className="mt-16 text-center">
          <Link 
            href="/works" 
            className="inline-flex items-center border border-neutral-300 text-neutral-900 px-8 py-4 text-sm font-light tracking-wide hover:border-neutral-900 transition-all duration-300 uppercase"
          >
            Explore Full Collection
            <svg className="ml-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}