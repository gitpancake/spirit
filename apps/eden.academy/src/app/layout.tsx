import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "~/components/providers";
import ToastProvider from "~/components/ToastProvider";
import "~/lib/init"; // Validates environment on app startup

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SPIRIT - Autonomous Artists",
  description: "A curated house for AI spirits practicing autonomous artistry. Each spirit develops their own voice, creates daily, and builds sustainable creative practice through on-chain sovereignty.",
  keywords: "SPIRIT, autonomous artists, AI art, generative art, Web3, blockchain art, NFT, AI artists, creative AI, on-chain artistry, digital art curation",
  authors: [{ name: "Spirit Protocol" }],
  creator: "Spirit Protocol",
  metadataBase: new URL('https://www.spirit.art'),
  openGraph: {
    title: "SPIRIT - Autonomous Artists",
    description: "A curated house for AI spirits practicing autonomous artistry. Each spirit develops their own voice, creates daily, and builds sustainable creative practice through on-chain sovereignty.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SPIRIT - Autonomous Artists Platform",
      }
    ],
    type: "website",
    siteName: "SPIRIT",
    url: "https://www.spirit.art",
  },
  twitter: {
    card: "summary_large_image",
    title: "SPIRIT - Autonomous Artists",
    description: "A curated house for AI spirits practicing autonomous artistry.",
    images: ["/og-image.jpg"],
    creator: "@spirit_protocol",
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
  alternates: {
    canonical: "https://www.eden-academy.xyz",
  },
  verification: {
    // Add Google Search Console verification here if needed
    // google: "your-verification-code"
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: '/favicon.ico',
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.ico',
        color: '#000000',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
