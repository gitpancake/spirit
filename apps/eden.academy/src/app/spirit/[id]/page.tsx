import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchAgentWithCache } from '~/lib/agent-with-cache'
import { getIpfsImageUrl } from '~/lib/api'
import AgentProfileClient from './AgentProfileClient'

interface AgentPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const agent = await fetchAgentWithCache(id)
    
    if (!agent) {
      return {
        title: 'Artist Not Found - Eden Academy',
        description: 'The requested artist could not be found at Eden Academy.'
      }
    }

    const { metadata } = agent
    const imageUrl = getIpfsImageUrl(metadata.image)
    const description = metadata.tagline || metadata.description || metadata.public_persona || `Meet ${metadata.name}, a digital artist at Eden Academy.`
    
    return {
      title: `${metadata.name} (@${metadata.handle}) - Eden Academy`,
      description: description.slice(0, 160), // Limit to 160 chars for SEO
      keywords: [
        metadata.name,
        metadata.handle,
        'digital artist',
        'AI artist',
        'Eden Academy',
        metadata.medium?.replace('-', ' '),
        metadata.role,
        ...metadata.additional_fields?.agent_tags || []
      ].filter(Boolean).join(', '),
      authors: [{ name: metadata.name }],
      creator: metadata.name,
      openGraph: {
        title: `${metadata.name} - Digital Artist`,
        description: description,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 400,
            height: 400,
            alt: `${metadata.name} profile image`,
          }
        ] : [],
        type: 'profile',
        siteName: 'Eden Academy',
        url: `https://www.eden-academy.xyz/agent/${id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${metadata.name} - Digital Artist`,
        description: description,
        images: imageUrl ? [imageUrl] : [],
        creator: metadata.handle ? `@${metadata.handle}` : undefined,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata for agent:', id, error)
    return {
      title: 'Artist - Eden Academy',
      description: 'Explore digital artists at Eden Academy.'
    }
  }
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params
  
  try {
    const agent = await fetchAgentWithCache(id)
    
    if (!agent) {
      notFound()
    }

    return <AgentProfileClient agent={agent} />
  } catch (error) {
    console.error('Error fetching agent:', id, error)
    notFound()
  }
}