import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "GENESIS CHAMBER",
  description: "Where space invaders are born. Explore AI-generated space invader mosaics and pixel art creations from INVADERBOT's neural matrix.",
  openGraph: {
    title: "GENESIS CHAMBER | INVADERBOT",
    description: "Where space invaders are born. Explore AI-generated space invader mosaics and pixel art creations from INVADERBOT's neural matrix.",
    images: [
      {
        url: "/api/og?type=genesis",
        width: 1200,
        height: 630,
        alt: "GENESIS CHAMBER - Where Space Invaders Are Born",
        type: "image/png",
      }
    ],
  },
  twitter: {
    title: "GENESIS CHAMBER | INVADERBOT",
    description: "Where space invaders are born. Explore AI-generated space invader mosaics and pixel art creations.",
    images: ["/api/og?type=genesis"],
  },
}

export default function GenesisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}