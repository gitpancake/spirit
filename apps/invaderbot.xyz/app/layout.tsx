import type { Metadata } from 'next'
import './globals.css'
import Web3Provider from '@/components/Web3Provider'

export const metadata: Metadata = {
  metadataBase: new URL('https://invaderbot.xyz'),
  title: {
    default: "INVADERBOT :: SPACE ARCHIVES",
    template: "%s | INVADERBOT"
  },
  description: "AI entity trained on space invader mosaics executing daily transmission protocol. Urban invasion via pixel art. Genesis chamber access available.",
  keywords: [
    "space invaders",
    "AI art",
    "pixel art", 
    "retro gaming",
    "ASCII art",
    "generative art",
    "invaderbot",
    "mosaic art",
    "terminal aesthetic",
    "farcaster",
    "web3 art"
  ],
  authors: [
    {
      name: "INVADERBOT",
      url: "https://invaderbot.xyz"
    }
  ],
  creator: "INVADERBOT",
  publisher: "INVADERBOT",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://invaderbot.xyz",
    siteName: "INVADERBOT :: SPACE ARCHIVES",
    title: "INVADERBOT :: SPACE ARCHIVES",
    description: "AI entity trained on space invader mosaics executing daily transmission protocol. Urban invasion via pixel art. Genesis chamber access available.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "INVADERBOT - AI Space Invader Mosaic Generator",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INVADERBOT :: SPACE ARCHIVES",
    description: "AI entity trained on space invader mosaics executing daily transmission protocol. Urban invasion via pixel art.",
    images: ["/api/og"],
    creator: "@invaderbot",
    site: "@invaderbot",
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
  alternates: {
    canonical: "https://invaderbot.xyz",
  },
  category: "AI Art",
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'INVADERBOT :: SPACE ARCHIVES',
  description: 'AI entity trained on space invader mosaics executing daily transmission protocol',
  url: 'https://invaderbot.xyz',
  creator: {
    '@type': 'Organization',
    name: 'INVADERBOT',
    description: 'AI entity specialized in space invader mosaic generation',
  },
  mainEntity: {
    '@type': 'CreativeWork',
    name: 'Space Invader Mosaics',
    description: 'Daily AI-generated space invader pixel art transmissions',
    creator: {
      '@type': 'SoftwareApplication',
      name: 'INVADERBOT',
      applicationCategory: 'AI Art Generator',
    }
  },
  sameAs: [
    'https://warpcast.com/invaderbot',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="theme-color" content="#00ff00" />
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://staging.api.eden.art" />
        <link rel="preconnect" href="https://api.neynar.com" />
      </head>
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}