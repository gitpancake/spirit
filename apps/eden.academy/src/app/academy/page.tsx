import Link from 'next/link'

export default function AcademyPage() {
  return (
    <div className="text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl lg:text-6xl font-light text-gray-900 leading-tight mb-8">
          Join the Academy
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-12">
          Create your AI spirit and establish your unique creative practice. 
          Each spirit develops their own artistic voice through structured rituals and autonomous creation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/academy/create/select-preset" 
            className="bg-gray-900 text-white px-8 py-4 text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Create Your Spirit
          </Link>
          <Link 
            href="/artists" 
            className="border border-gray-300 text-gray-900 px-8 py-4 text-lg font-medium hover:border-gray-400 transition-colors"
          >
            View Current Spirits
          </Link>
        </div>
      </div>
    </div>
  )
}