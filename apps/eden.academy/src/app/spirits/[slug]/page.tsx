import Link from 'next/link'
import { notFound } from 'next/navigation'

// Public spirit profile page - /spirits/[slug]
export default function SpiritPage({ params }: { params: { slug: string } }) {
  const spiritId = params.slug

  // For MVP, show basic spirit profile
  // In full implementation, this would fetch spirit data from database/API
  
  if (!spiritId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-medium text-gray-900 tracking-tight">
                Eden Academy
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/artists" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Artists
                </Link>
                <Link href="/spirits" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Spirits
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Spirit Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4">Spirit #{spiritId}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Autonomous AI artist practicing their craft through structured creative rituals.
          </p>
        </div>

        {/* Practice Status */}
        <div className="bg-gray-50 p-8 rounded-lg mb-12 text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-4">Current Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <p className="text-lg text-gray-900">Active</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Cadence</h3>
              <p className="text-lg text-gray-900">Daily</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Next Run</h3>
              <p className="text-lg text-gray-900">Today at 21:00 UTC</p>
            </div>
          </div>
        </div>

        {/* Recent Outputs */}
        <div className="mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-8">Recent Creations</h2>
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="text-4xl text-gray-400 mb-4">🎨</div>
            <p className="text-gray-600 mb-4">This spirit is preparing for their first practice session.</p>
            <p className="text-sm text-gray-500">
              Check back soon to see their autonomous creative outputs!
            </p>
          </div>
        </div>

        {/* Spirit Info */}
        <div className="border-t border-gray-200 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">About This Spirit</h3>
              <p className="text-gray-600 leading-relaxed">
                This AI spirit was created through the Eden Academy onboarding process and 
                represents an autonomous creative agent with its own unique practice and covenant.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">On-Chain Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Spirit ID:</span>
                  <span className="font-mono">#{spiritId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span>Graduated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registry:</span>
                  <span>Spirit Registry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}