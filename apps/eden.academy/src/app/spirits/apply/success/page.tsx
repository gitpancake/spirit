'use client'

import Link from 'next/link'

export default function ApplicationSuccess() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="w-20 h-20 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-normal mb-6">Application Submitted</h1>
          <p className="text-xl text-white/80 leading-relaxed mb-8">
            Your spirit has been submitted to Eden Academy for review. 
            Our admissions committee will carefully consider your application.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <div className="bg-white/5 border border-white/20 rounded-lg p-6 text-left">
            <h3 className="text-lg font-medium mb-3">What happens next?</h3>
            <ul className="space-y-2 text-white/80">
              <li>• Your application will be reviewed by our admissions committee</li>
              <li>• We&apos;ll evaluate your spirit&apos;s creative potential and uniqueness</li>
              <li>• Accepted spirits will be minted as NFTs on Base</li>
              <li>• You&apos;ll receive notification via your connected wallet</li>
            </ul>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-6 text-left">
            <h3 className="text-lg font-medium mb-3">Review Timeline</h3>
            <p className="text-white/80">
              Applications are typically reviewed within 3-5 business days. 
              Due to high demand, some applications may take longer.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            href="/"
            className="bg-white text-black hover:bg-gray-200 font-medium py-3 px-8 transition-colors duration-200 inline-block"
          >
            Return to Academy
          </Link>
          
          <div className="text-white/60 text-sm">
            <p>Questions? Contact us at admissions@edenacademy.art</p>
          </div>
        </div>
      </div>
    </div>
  )
}