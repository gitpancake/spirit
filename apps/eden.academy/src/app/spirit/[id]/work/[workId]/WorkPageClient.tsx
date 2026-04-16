'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, RectangleStackIcon } from '@heroicons/react/24/outline'
import { CollectionWork, fetchWork } from '~/lib/api'

interface WorkPageClientProps {
  spiritId: string
  workId: string
}

interface Breadcrumb {
  name: string
  href: string
  current?: boolean
}

export default function WorkPageClient({ spiritId, workId }: WorkPageClientProps) {
  const router = useRouter()
  const [work, setWork] = useState<CollectionWork | null>(null)
  const [allWorks, setAllWorks] = useState<CollectionWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectionName, setCollectionName] = useState<string>('')

  // Find current work index for navigation
  const currentIndex = allWorks.findIndex(w => w.id === workId)
  const previousWork = currentIndex > 0 ? allWorks[currentIndex - 1] : null
  const nextWork = currentIndex < allWorks.length - 1 ? allWorks[currentIndex + 1] : null

  useEffect(() => {
    async function loadWork() {
      try {
        setLoading(true)
        setError(null)

        // We need to determine which collection this work belongs to
        // For now, we'll try the known collection names
        const possibleCollections = ['abraham-early-works', 'abstract-expressions', 'nature-studies']
        
        let foundWork: CollectionWork | null = null
        let foundCollection = ''
        let foundWorks: CollectionWork[] = []

        for (const collection of possibleCollections) {
          try {
            const response = await fetchWork(collection, 0, 100) // Get more works for navigation
            const works = response.data?.works || []
            const workMatch = works.find(w => w.id === workId)
            
            if (workMatch) {
              foundWork = workMatch
              foundCollection = collection
              foundWorks = works
              break
            }
          } catch (err) {
            // Continue trying other collections
            console.log(`Work not found in ${collection}`)
          }
        }

        if (foundWork) {
          setWork(foundWork)
          setAllWorks(foundWorks)
          setCollectionName(foundCollection)
        } else {
          setError('Work not found')
        }
      } catch (err) {
        console.error('Error loading work:', err)
        setError('Failed to load work')
      } finally {
        setLoading(false)
      }
    }

    loadWork()
  }, [workId])

  const breadcrumbs: Breadcrumb[] = [
    { name: 'Spirits', href: '/' },
    { name: 'Spirit Profile', href: `/spirit/${spiritId}` },
    { name: 'Collections', href: `/spirit/${spiritId}` },
    { name: collectionName.replace(/-/g, ' '), href: `/spirit/${spiritId}`, current: false },
    { name: work?.title || 'Work', href: '#', current: true }
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading work...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Work Not Found</h3>
          <p className="text-gray-600 mb-6">{error || 'The requested work could not be found.'}</p>
          <Link
            href={`/spirit/${spiritId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back to Spirit Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.name} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              )}
              {crumb.current ? (
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 capitalize"
                >
                  {index === 0 && <HomeIcon className="w-4 h-4 mr-2" />}
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Work Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {previousWork && (
            <Link
              href={`/spirit/${spiritId}/work/${previousWork.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Previous
            </Link>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Work {currentIndex + 1} of {allWorks.length}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {nextWork && (
            <Link
              href={`/spirit/${spiritId}/work/${nextWork.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="lg:flex">
          {/* Image Section */}
          <div className="lg:w-2/3">
            <div className="aspect-square lg:aspect-auto lg:h-[80vh] relative bg-gray-50 flex items-center justify-center">
              <Image
                src={work.fullUrl || work.imageUrl}
                alt={work.title || 'Collection work'}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:w-1/3 p-8">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {work.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Archive #{work.archiveNumber}
                </p>
              </div>

              {/* Description */}
              {work.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {work.description}
                  </p>
                </div>
              )}

              {/* Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Details</h3>
                <div className="space-y-3">
                  <div>
                    <dt className="text-xs text-gray-600 uppercase tracking-wide">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(work.createdDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-600 uppercase tracking-wide">Source</dt>
                    <dd className="text-sm text-gray-900">
                      {work.metadata.source}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-600 uppercase tracking-wide">Format</dt>
                    <dd className="text-sm text-gray-900 uppercase">
                      {work.metadata.format}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-600 uppercase tracking-wide">Original Filename</dt>
                    <dd className="text-sm text-gray-900 break-all">
                      {work.originalFilename}
                    </dd>
                  </div>
                </div>

                {/* Tags */}
                {work.metadata?.tags && work.metadata.tags.length > 0 && (
                  <div className="mt-4">
                    <dt className="text-xs text-gray-600 uppercase tracking-wide mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {work.metadata.tags.map((tag) => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <a
                  href={work.fullUrl || work.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 text-sm font-medium transition-colors text-center block rounded"
                >
                  View Full Resolution
                </a>
                <Link
                  href={`/spirit/${spiritId}`}
                  className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition-colors text-center block rounded"
                >
                  <RectangleStackIcon className="w-4 h-4 inline mr-2" />
                  Back to Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}