import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import WorkPageClient from './WorkPageClient'

interface WorkPageProps {
  params: Promise<{
    id: string
    workId: string
  }>
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { id, workId } = await params

  if (!id || !workId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      }>
        <WorkPageClient spiritId={id} workId={workId} />
      </Suspense>
    </div>
  )
}