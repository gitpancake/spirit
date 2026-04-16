import Link from 'next/link'

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple header for academy */}
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="text-xl font-medium text-gray-900 tracking-tight hover:text-gray-600 transition-colors">
              Eden Academy
            </Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  )
}