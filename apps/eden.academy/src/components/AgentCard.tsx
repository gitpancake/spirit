'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Agent, getIpfsImageUrl } from '~/lib/api'

interface AgentCardProps {
  agent: Agent
}

function AgentCard({ agent }: AgentCardProps) {
  const { metadata } = agent
  const imageUrl = getIpfsImageUrl(metadata.image)

  return (
    <Link href={`/spirit/${agent.tokenId}`} className="block group">
      <div className="group">
        {/* Image */}
        <div className="aspect-[4/5] bg-neutral-100 mb-6 overflow-hidden border border-neutral-200">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={metadata.name}
              width={400}
              height={500}
              className="w-full h-full object-cover group-hover:opacity-95 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <div className="text-center text-neutral-400">
                <div className="text-2xl mb-2">🎨</div>
                <span className="text-xs font-light tracking-wide">Spirit Image</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-light text-neutral-900 group-hover:text-neutral-600 transition-colors tracking-wide">
                {metadata.name}
              </h3>
              {metadata.handle && (
                <p className="text-sm font-light text-neutral-500 tracking-wide">@{metadata.handle}</p>
              )}
            </div>
            <span className="text-xs font-light text-neutral-400 tracking-wider">#{agent.tokenId}</span>
          </div>
          
          {metadata.role && (
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
              <span className="text-xs font-light text-neutral-600 uppercase tracking-wider">{metadata.role}</span>
            </div>
          )}
          
          {metadata.tagline && (
            <p className="text-sm font-light text-neutral-600 leading-relaxed line-clamp-2">
              {metadata.tagline}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default React.memo(AgentCard)