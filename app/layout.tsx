import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import "./globals.css"
import { Footer } from "@/components/footer"
import { VersionGate } from "@/components/version-gate"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Scout - AI-Powered Prospecting Intelligence",
  description: "AI-powered prospecting intelligence for insurance brokers by Pacific AI Systems",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Force Redeploy: 2026-02-06T09:55:00
    // Routes: morning-briefing, daily-outreach
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`font-sans antialiased`}>
          <VersionGate />
          {children}
          <Analytics />
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
