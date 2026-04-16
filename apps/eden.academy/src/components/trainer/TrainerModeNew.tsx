'use client'

import { HeroSection } from './widgets/HeroSection'
import { MissionStatement } from './widgets/MissionStatement'
import { TrainingStatus } from './widgets/TrainingStatus'
import { CollectionsGallery } from './widgets/CollectionsGallery'
// Import other widgets as they're created
// import { DailyPractice } from './widgets/DailyPractice'
// import { PerformanceMetrics } from './widgets/PerformanceMetrics'
// import { AuctionConfiguration } from './widgets/AuctionConfiguration'
// import { FixedPriceSale } from './widgets/FixedPriceSale'
// import { WorksGallery } from './widgets/WorksGallery'
// import { LinksProfile } from './widgets/LinksProfile'

interface TrainerModeNewProps {
  tokenId: string
  isTrainer: boolean
  agentData: {
    tokenId: string
    metadata?: {
      name?: string
    }
  }
}

// Placeholder widgets for development
function PlaceholderWidget({ title, description }: { title: string; description: string }) {
  return (
    <div className="widget-card bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 italic">Coming soon...</p>
      </div>
    </div>
  )
}

export function TrainerModeNew({ tokenId, isTrainer, agentData }: TrainerModeNewProps) {
  if (!isTrainer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-4">Training Access Required</h3>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            You need trainer privileges to access this mode. Training access is granted through the Eden Spirit Registry smart contract.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="trainer-mode max-w-7xl mx-auto">
      {/* Header */}
      <div className="trainer-header mb-8">
        <h2 className="text-2xl font-light text-gray-900 mb-2">Trainer Mode</h2>
        <p className="text-gray-600">
          Advanced training controls for {agentData?.metadata?.name || 'this agent'}
        </p>
      </div>

      {/* Widget Configuration Dashboard */}
      <div className="widget-sections space-y-12">
        
        {/* Profile Widgets */}
        <section className="widget-section">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Profile Widgets</h3>
            <p className="text-gray-600 text-sm">Agent identity and core information</p>
          </div>
          <div className="widgets-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HeroSection tokenId={tokenId} isTrainer={isTrainer} />
            <MissionStatement tokenId={tokenId} isTrainer={isTrainer} />
          </div>
        </section>

        {/* Training Widgets */}
        <section className="widget-section">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Training Widgets</h3>
            <p className="text-gray-600 text-sm">Training progress and session management</p>
          </div>
          <div className="widgets-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlaceholderWidget
              title="Daily Practice"
              description="Agent daily output and practice tracking"
            />
            <TrainingStatus tokenId={tokenId} isTrainer={isTrainer} />
          </div>
        </section>

        {/* Technical Widgets */}
        <section className="widget-section">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Technical Widgets</h3>
            <p className="text-gray-600 text-sm">Performance metrics and marketplace configuration</p>
          </div>
          <div className="widgets-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <PlaceholderWidget
              title="Performance Metrics"
              description="Agent performance and analytics"
            />
            <PlaceholderWidget
              title="Auction Configuration"
              description="Daily auction and marketplace settings"
            />
            <PlaceholderWidget
              title="Fixed Price Sale"
              description="Direct purchase and fixed pricing configuration"
            />
          </div>
        </section>

        {/* Social Widgets */}
        <section className="widget-section">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Social Widgets</h3>
            <p className="text-gray-600 text-sm">External connections and content management</p>
          </div>
          <div className="widgets-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <PlaceholderWidget
              title="Works Gallery"
              description="Recent works and creations showcase"
            />
            <PlaceholderWidget
              title="Links & Profile"
              description="External links, website, and social connections"
            />
            <CollectionsGallery tokenId={tokenId} isTrainer={isTrainer} />
          </div>
        </section>
      </div>

      {/* Development Notice */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Development in Progress</h4>
            <p className="text-sm text-blue-800">
              This is the new Trainer Mode interface with full IPFS and smart contract integration. 
              Additional widgets are being developed and will be added progressively.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add global styles for the trainer mode
const trainerModeStyles = `
.trainer-mode .widget-card {
  transition: all 0.2s ease-in-out;
}

.trainer-mode .widget-card:hover {
  shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trainer-mode .configure-button {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.trainer-mode .configure-button:hover {
  background: #059669;
}

.trainer-mode .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`

// Inject styles (in a real app, these would be in a CSS file)
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = trainerModeStyles
  document.head.appendChild(styleElement)
}