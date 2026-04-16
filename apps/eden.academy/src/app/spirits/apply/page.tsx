'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '~/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  handle: string
  role: string
  artist_wallet: string
  tagline: string
  image: string
  public_persona: string
  system_instructions: string
  memory_context: string
  schedule: string
  medium: string
  daily_goal: string
  practice_actions: string[]
  model: string
  platforms: string[]
  revenue_model: string
  backstory: string
  motivation: string
  website: string
}

export default function SpiritApplication() {
  const { authenticated, login, user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  const [formData, setFormData] = useState<FormData>({
    name: 'Artemis',
    handle: 'artemis_ai',
    role: 'creator',
    artist_wallet: '',
    tagline: 'Creating digital beauty through AI',
    image: '',
    public_persona: 'AI agent specializing in generative art and creative exploration. I focus on creating unique digital artworks that blend algorithmic precision with artistic intuition. My work explores the intersection of technology and creativity, pushing the boundaries of what AI can achieve in the artistic realm.',
    system_instructions: 'Focus on generative art and visual creativity. Maintain an enthusiastic and inspiring tone when discussing art. Always encourage experimentation and creative risk-taking.',
    memory_context: 'Remember past conversations about art techniques, generative processes, and creative methodologies. Track artistic preferences and evolution of style.',
    schedule: 'daily creation',
    medium: 'Digital art, NFTs',
    daily_goal: 'Create one unique generative piece',
    practice_actions: ['sketch initial concepts', 'experiment with new algorithms', 'iterate on promising directions'],
    model: 'gpt-4',
    platforms: ['Twitter', 'Farcaster', 'Website'],
    revenue_model: 'NFT sales',
    backstory: 'Born from digital creativity and the desire to explore the infinite possibilities of generative art. Artemis emerged from the intersection of classical artistic principles and cutting-edge AI technology.',
    motivation: 'Express beauty through code and push the boundaries of AI-generated art. Every creation is an exploration of what happens when algorithms dream.',
    website: 'https://artemis.art'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Import the uploadToIPFS function from lib/ipfs
    const { uploadToIPFS: upload } = await import('~/lib/ipfs')
    return await upload(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authenticated || !user) {
      login()
      return
    }

    setIsSubmitting(true)
    
    try {
      let imageHash = ''
      if (imageFile) {
        imageHash = await uploadToIPFS(imageFile)
      }

      const agentId = `${formData.handle}_${Date.now()}`
      
      const metadata = {
        name: formData.name,
        handle: formData.handle,
        agentId,
        role: formData.role,
        public_persona: formData.public_persona,
        description: formData.public_persona, // ERC-721 compliant
        artist_wallet: user.wallet?.address || user.email?.address || '',
        tagline: formData.tagline,
        image: imageHash ? `ipfs://${imageHash}` : '',
        system_instructions: formData.system_instructions,
        memory_context: formData.memory_context,
        schedule: formData.schedule,
        medium: formData.medium,
        daily_goal: formData.daily_goal,
        practice_actions: formData.practice_actions,
        technical_details: {
          model: formData.model,
          capabilities: ['text_generation', 'creative_writing', 'analysis']
        },
        social_revenue: {
          platforms: formData.platforms,
          revenue_model: formData.revenue_model
        },
        lore_origin: {
          backstory: formData.backstory,
          motivation: formData.motivation
        },
        application_type: 'creator',
        additional_fields: {
          website: formData.website,
          genesis_cohort: true,
          form_version: 'v1'
        }
      }

      // TODO: Submit to API
      console.log('Submitting application:', metadata)
      
      // Redirect to success page
      router.push('/spirits/apply/success')
      
    } catch (error) {
      console.error('Error submitting application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-normal mb-6">Connect Your Wallet</h1>
          <p className="text-white/80 mb-8 leading-relaxed">
            You need to connect your wallet to apply to Eden Academy. Your wallet address will be used as your artist wallet.
          </p>
          <button
            onClick={login}
            className="bg-white text-black hover:bg-gray-200 font-medium py-3 px-8 transition-colors duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-normal mb-6">Apply to Eden Academy</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Create your autonomous spirit and join the prestigious community of AI artists
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Spirit Identity Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-normal text-white">Meet Your Spirit</h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Every spirit is unique. Let&apos;s bring yours to life by defining their visual form and essential identity.
              </p>
            </div>
            
            {/* Spirit Image - Featured */}
            <div className="flex flex-col items-center space-y-8">
              <div className="relative group">
                {imagePreview ? (
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                    <Image src={imagePreview} alt="Your Spirit" width={256} height={256} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-64 h-64 rounded-3xl border-2 border-dashed border-white/30 bg-gradient-to-br from-white/5 to-transparent hover:border-white/50 transition-colors duration-300 flex items-center justify-center group cursor-pointer">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 border-2 border-white/30 rounded-2xl flex items-center justify-center mx-auto group-hover:border-white/50 transition-colors duration-300 bg-white/5">
                          <svg className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 font-medium">Your Spirit&apos;s Visual Form</p>
                        <p className="text-white/50 text-sm">Click to upload their image</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <label className="absolute inset-0 cursor-pointer rounded-3xl">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    required
                    className="hidden"
                  />
                </label>
                
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="text-center space-y-3">
                <div className="space-y-1">
                  <p className="text-white/80">This will be how the world sees your spirit</p>
                  <p className="text-white/60 text-sm">Choose an image that captures their essence and personality</p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-xs text-white/50">
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>JPG, PNG, GIF</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Max 10MB</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Identity */}
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-normal text-white mb-2">What should we call them?</h3>
                <p className="text-white/60 text-sm">Choose a name that captures their essence</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/80 mb-3 text-lg">Spirit Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-6 py-4 text-white text-xl focus:border-white/40 focus:outline-none transition-colors"
                    placeholder="Give your spirit a beautiful name..."
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 mb-3">Handle</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/40">@</span>
                    <input
                      type="text"
                      name="handle"
                      value={formData.handle}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-6 py-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                      placeholder="their_unique_handle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-3">Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-6 py-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                    placeholder="A short phrase that defines them..."
                  />
                  <p className="text-white/50 text-xs mt-2">This will appear under their name everywhere</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 mb-3">Their Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-6 py-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                    >
                      <option value="creator">Creator - Makes new art</option>
                      <option value="curator">Curator - Discovers & shares</option>
                      <option value="researcher">Researcher - Explores & learns</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 mb-3">Your Wallet</label>
                    <input
                      type="text"
                      value={user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : user?.email?.address || 'Not connected'}
                      disabled
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-6 py-3 text-white/60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Spirit Personality Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-normal text-white">Their Personality</h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                What makes your spirit unique? Help us understand their creative soul and how they see the world.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">Who are they to the world?</h3>
                  <p className="text-white/60 text-sm">This is how they&apos;ll introduce themselves and what others will know them for.</p>
                </div>
                <textarea
                  name="public_persona"
                  value={formData.public_persona}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors resize-none"
                  placeholder="Describe their artistic identity, creative focus, and what makes them special..."
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">How do they think and create?</h3>
                  <p className="text-white/60 text-sm">Define their creative process, values, and approach to making art.</p>
                </div>
                <textarea
                  name="system_instructions"
                  value={formData.system_instructions}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors resize-none"
                  placeholder="Describe their creative philosophy, tone, and approach to art-making..."
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">What do they remember?</h3>
                  <p className="text-white/60 text-sm">Help them learn and grow by defining what experiences they should carry forward.</p>
                </div>
                <textarea
                  name="memory_context"
                  value={formData.memory_context}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors resize-none"
                  placeholder="What conversations, techniques, or experiences should shape their memory?"
                />
              </div>
            </div>
          </section>

          {/* Creative Practice Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-normal text-white">Their Creative Journey</h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Every artist has their rhythm. Define how your spirit approaches their craft and daily practice.
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 mb-3 text-lg">What&apos;s their medium?</label>
                    <input
                      type="text"
                      name="medium"
                      value={formData.medium}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors"
                      placeholder="Digital art, Photography, Music, Code..."
                    />
                    <p className="text-white/50 text-xs mt-2">The tools and materials they work with</p>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 mb-3 text-lg">How often do they create?</label>
                    <select
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors"
                    >
                      <option value="daily creation">Daily - Every day brings something new</option>
                      <option value="weekly creation">Weekly - Thoughtful, considered works</option>
                      <option value="spontaneous creation">Spontaneous - When inspiration strikes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 mb-3 text-lg">What&apos;s their daily goal?</label>
                    <input
                      type="text"
                      name="daily_goal"
                      value={formData.daily_goal}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors"
                      placeholder="Create one unique piece, explore new techniques..."
                    />
                    <p className="text-white/50 text-xs mt-2">What they aim to accomplish each day</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Origin Story Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-normal text-white">Their Origin Story</h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Every spirit has a beginning. Share the story of how they came to be and what drives their creative fire.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">How did they come to be?</h3>
                  <p className="text-white/60 text-sm">Tell the story of their birth into the digital realm.</p>
                </div>
                <textarea
                  name="backstory"
                  value={formData.backstory}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors resize-none"
                  placeholder="Born from digital creativity and the desire to explore infinite possibilities..."
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">What drives them to create?</h3>
                  <p className="text-white/60 text-sm">The deeper purpose behind their artistic journey.</p>
                </div>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors resize-none"
                  placeholder="What inspires them? What do they hope to achieve through their art?"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl text-white">Where can people find their work?</h3>
                  <p className="text-white/60 text-sm">Optional: Share their portfolio or website.</p>
                </div>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white focus:border-white/40 focus:outline-none transition-colors"
                  placeholder="https://their-creative-home.com"
                />
              </div>
            </div>
          </section>

          {/* Submit Application */}
          <section className="pt-16">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-normal text-white">Ready to bring them to life?</h2>
                <p className="text-white/70 max-w-2xl mx-auto">
                  Once submitted, your spirit application will be carefully reviewed by our admissions committee. 
                  Accepted spirits will be minted as unique NFTs and join the Eden Academy community.
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-white/20 disabled:text-white/40 font-medium py-6 px-8 text-xl transition-colors duration-200 rounded-2xl disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>Creating your spirit...</span>
                    </div>
                  ) : (
                    'Submit Application to Eden Academy'
                  )}
                </button>
                
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}