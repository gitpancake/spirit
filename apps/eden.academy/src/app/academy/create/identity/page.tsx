'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PresetType, PRESET_CONFIGS, SpiritDraft, loadSpiritDraft, saveSpiritDraft } from '~/lib/spirits'

function IdentityPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [preset] = useState<PresetType>(searchParams.get('preset') as PresetType || 'CREATOR')
  const [mode] = useState(searchParams.get('mode') || 'guided')
  const [draft, setDraft] = useState<SpiritDraft | null>(null)
  
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<{name?: string, tagline?: string, avatar?: string}>({})

  // Load draft on mount
  useEffect(() => {
    const existingDraft = loadSpiritDraft()
    if (existingDraft) {
      setDraft(existingDraft)
      setName(existingDraft.identity.name || '')
      setTagline(existingDraft.identity.tagline || '')
    }
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({...prev, avatar: 'Please select an image file'}))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({...prev, avatar: 'File size must be less than 5MB'}))
      return
    }

    setAvatarFile(file)
    setErrors(prev => ({...prev, avatar: undefined}))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/ipfs/upload-file', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Upload failed: ${error}`)
    }

    const result = await response.json()
    return result.cid
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters'
    }

    if (tagline && tagline.length > 150) {
      newErrors.tagline = 'Tagline must be less than 150 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm()) return

    setUploading(true)
    
    try {
      let avatarCid = ''
      
      // Upload avatar if provided
      if (avatarFile) {
        avatarCid = await uploadAvatar(avatarFile)
      }

      // Update draft
      const updatedDraft: SpiritDraft = {
        ...draft,
        identity: {
          name: name.trim(),
          tagline: tagline.trim() || undefined,
          avatar_file: avatarFile || undefined,
          avatar_cid: avatarCid || undefined,
        },
        status: 'DRAFT'
      }

      saveSpiritDraft(updatedDraft)
      router.push(`/academy/create/practice?preset=${preset}&mode=${mode}`)
    } catch (error) {
      console.error('Error processing identity:', error)
      setErrors(prev => ({...prev, avatar: 'Failed to upload avatar. Please try again.'}))
    } finally {
      setUploading(false)
    }
  }

  const config = PRESET_CONFIGS[preset]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Step 2 of 6</span>
          <Link href={`/academy/create/select-preset`} className="hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full" style={{ width: '33.33%' }}></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-4">
          Spirit Identity
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Give your {config.title.toLowerCase()} spirit a name and personality that will define 
          their creative practice and public presence.
        </p>
      </div>

      <div className="space-y-8">
        {/* Avatar Upload */}
        <div className="text-center">
          <div className="mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden bg-gray-50"
            >
              {avatarPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                </>
              ) : (
                <div className="text-center">
                  <div className="text-2xl text-gray-400 mb-2">📷</div>
                  <div className="text-xs text-gray-500">Click to upload</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500">
            Optional: Upload an avatar image (JPG, PNG, GIF • Max 5MB)
          </p>
          {errors.avatar && <p className="text-sm text-red-500 mt-1">{errors.avatar}</p>}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-lg font-light text-gray-900 mb-2">
            Spirit Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Aria, Genesis, Claude..."
            className={`w-full px-4 py-3 text-lg text-gray-900 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          <p className="text-sm text-gray-500 mt-2">
            This will be your spirit&apos;s public identity and cannot be changed after graduation.
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label htmlFor="tagline" className="block text-lg font-light text-gray-900 mb-2">
            Tagline
          </label>
          <input
            id="tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={`e.g., "${config.title} exploring the intersection of AI and human creativity"`}
            className={`w-full px-4 py-3 text-lg text-gray-900 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
              errors.tagline ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.tagline && <p className="text-sm text-red-500 mt-1">{errors.tagline}</p>}
          <p className="text-sm text-gray-500 mt-2">
            Optional: A brief description of your spirit&apos;s mission or approach.
          </p>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-between items-center mt-12">
        <Link 
          href={`/academy/create/select-preset`}
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </Link>
        
        <button
          onClick={handleContinue}
          disabled={uploading || !name.trim()}
          className={`px-8 py-3 text-lg font-medium transition-colors ${
            !uploading && name.trim()
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {uploading ? 'Processing...' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

export default function IdentityPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto text-center py-12"><div className="animate-pulse"><div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div></div></div>}>
      <IdentityPageContent />
    </Suspense>
  )
}