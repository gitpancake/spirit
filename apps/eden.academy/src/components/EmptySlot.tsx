'use client'

interface EmptySlotProps {
  slotNumber: number
}

export default function EmptySlot({ slotNumber }: EmptySlotProps) {
  return (
    <div className="group">
      {/* Empty Image Area */}
      <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-gray-300 text-3xl mb-2">+</div>
          <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Position {slotNumber}
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="space-y-2">
        <div>
          <h3 className="text-lg font-medium text-gray-500">Available</h3>
          <p className="text-sm text-gray-400">Academy position</p>
        </div>
        
        <a 
          href="/apply"
          className="inline-block text-sm text-gray-600 hover:text-gray-900 transition-colors mt-2"
        >
          Apply now →
        </a>
      </div>
    </div>
  )
}