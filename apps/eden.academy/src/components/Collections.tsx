'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CollectionWork, Collection, fetchWork } from '~/lib/api'

interface CollectionsProps {
  collections: string[]
  agentName: string
  spiritId: string
}

export default function Collections({ collections, agentName, spiritId }: CollectionsProps) {
  const [collectionData, setCollectionData] = useState<{[key: string]: CollectionWork[]}>({})
  const [collectionInfo, setCollectionInfo] = useState<{[key: string]: Collection | null}>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState<{[key: string]: boolean}>({})
  const [offset, setOffset] = useState<{[key: string]: number}>({})
  const observerTargets = useRef<{[key: string]: HTMLDivElement | null}>({})

  const ITEMS_PER_PAGE = 20

  // Load works for a specific collection
  const loadCollectionWorks = useCallback(async (collectionName: string, currentOffset = 0, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetchWork(collectionName, currentOffset, ITEMS_PER_PAGE)
      const newWorks = response.data?.works || []
      
      if (isLoadMore) {
        setCollectionData(prev => ({
          ...prev,
          [collectionName]: [...(prev[collectionName] || []), ...newWorks]
        }))
      } else {
        setCollectionData(prev => ({
          ...prev,
          [collectionName]: newWorks
        }))
        setCollectionInfo(prev => ({
          ...prev,
          [collectionName]: response.data?.collection || null
        }))
      }
      
      // Check if we have more works to load
      const hasMoreWorks = newWorks.length === ITEMS_PER_PAGE
      setHasMore(prev => ({
        ...prev,
        [collectionName]: hasMoreWorks
      }))

      // Update offset
      setOffset(prev => ({
        ...prev,
        [collectionName]: currentOffset + ITEMS_PER_PAGE
      }))

    } catch (error) {
      console.error(`Error loading collection ${collectionName}:`, error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadAllCollections = async () => {
      for (const collection of collections) {
        await loadCollectionWorks(collection, 0, false)
      }
    }
    
    if (collections.length > 0) {
      loadAllCollections()
    } else {
      setLoading(false)
    }
  }, [collections, loadCollectionWorks])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observers: {[key: string]: IntersectionObserver} = {}

    collections.forEach(collection => {
      if (observerTargets.current[collection] && hasMore[collection]) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !loadingMore) {
              loadCollectionWorks(collection, offset[collection] || 0, true)
            }
          },
          { threshold: 1 }
        )

        observer.observe(observerTargets.current[collection]!)
        observers[collection] = observer
      }
    })

    return () => {
      Object.values(observers).forEach(observer => observer.disconnect())
    }
  }, [collections, hasMore, loadingMore, offset, loadCollectionWorks])

  if (loading && Object.keys(collectionData).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading collections...</p>
      </div>
    )
  }

  const allWorks = collections.flatMap(collection => 
    collectionData[collection]?.map(work => ({ ...work, collection })) || []
  )

  if (allWorks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Works Found</h3>
        <p className="text-gray-600">This collection appears to be empty.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Works Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {allWorks.map((work, index) => (
          <Link
            key={`${work.collection}-${work.id}`}
            href={`/spirit/${spiritId}/work/${work.id}`}
            className="group cursor-pointer"
          >
            {/* Work Image */}
            <div className="aspect-square bg-gray-50 overflow-hidden group-hover:shadow-lg transition-shadow duration-300 rounded-lg">
              <Image
                src={work.thumbnailUrl || work.imageUrl}
                alt={work.title || 'Collection work'}
                width={400}
                height={400}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Work Info */}
            <div className="mt-3 space-y-1">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {work.title}
              </h3>
              <p className="text-xs text-gray-600">
                Archive #{work.archiveNumber}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {work.collection?.replace(/-/g, ' ')}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More Indicators */}
      {collections.map(collection => (
        hasMore[collection] && (
          <div
            key={collection}
            ref={(el) => { observerTargets.current[collection] = el }}
            className="text-center py-4"
          >
            {loadingMore ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600">Loading more works...</span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Scroll to load more</div>
            )}
          </div>
        )
      ))}

      {/* Collection Summary */}
      {allWorks.length > 0 && (
        <div className="text-center pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Showing {allWorks.length} works from {collections.length} collection{collections.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}