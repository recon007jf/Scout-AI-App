"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { getGoogleMapsScriptUrl } from "@/lib/actions/maps"

declare global {
  interface Window {
    google: any
  }
}


interface Account {
  id: string
  company: string
  contact: string
  title: string
  location: {
    lat: number
    lng: number
  }
  address: string
  status: "active" | "prospect" | "at-risk"
  revenue: number
  lastContact: string
  region?: string
}

interface TerritoryMapProps {
  accounts: Account[]
  selectedAccount: Account | null
  onSelectAccount: (account: Account) => void
}

const statusColors = {
  active: "#22c55e",
  prospect: "#f59e0b",
  "at-risk": "#ef4444",
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0f0f10" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f0f10" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a1a1aa" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#18181b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#27272a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#18181b" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#71717a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3f3f46" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#27272a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a1a1aa" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#18181b" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#09090b" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3f3f46" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#09090b" }],
  },
]

export default function TerritoryMap({ accounts, selectedAccount, onSelectAccount }: TerritoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any | null>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // In development/mock mode, skip loading the real map to avoid API key errors
    if (process.env.NODE_ENV === "development") {
      setIsLoaded(false) // Keep as false to show fallback, but we'll modify the fallback UI
      return
    }

    if (typeof window !== "undefined") {
      if (window.google) {
        setIsLoaded(true)
        return
      }

      const scriptId = "google-maps-script"
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement

      if (existingScript) {
        if (isLoaded) return
        existingScript.addEventListener("load", () => setIsLoaded(true))
        return
      }

      getGoogleMapsScriptUrl()
        .then((scriptUrl) => {
          if (document.getElementById(scriptId)) return

          const script = document.createElement("script")
          script.id = scriptId
          script.src = scriptUrl
          script.async = true
          script.defer = true
          script.onload = () => setIsLoaded(true)
          script.onerror = () => {
            console.error("[v0] Failed to load Google Maps script")
          }
          document.head.appendChild(script)
        })
        .catch((error) => {
          console.error("[v0] Error fetching Google Maps URL:", error)
        })
    }
  }, [])

  // ... (rest of the component)

  const isDev = process.env.NODE_ENV === "development"

  return (
    <Card className="h-full overflow-hidden relative bg-card/40">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-transparent to-purple-950/5 pointer-events-none z-10" />

      {isDev ? (
        <div className="w-full h-full bg-[#0a0a0b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Mock Map Grid Background */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          <div className="z-10 text-center max-w-md bg-card/90 backdrop-blur-md p-6 rounded-xl border border-border shadow-2xl">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Local Mock Map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Google Maps API is disabled in local development to prevent API key usage and errors.
            </p>
            <div className="flex gap-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> {accounts.filter(a => a.status === 'active').length} Active
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> {accounts.filter(a => a.status === 'prospect').length} Prospects
              </div>
            </div>
          </div>

          {/* Mock Markers */}
          {accounts.slice(0, 5).map((acc, i) => (
            <div key={acc.id}
              className="absolute w-3 h-3 rounded-full border border-white/50 shadow-lg"
              style={{
                backgroundColor: statusColors[acc.status],
                top: `${30 + (i * 15) % 40}%`,
                left: `${20 + (i * 20) % 60}%`,
                opacity: 0.8
              }}
            />
          ))}
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}

      {/* Loading State for Production */}
      {!isLoaded && !isDev && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/60">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 z-20">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Account Status</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-foreground">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-foreground">Prospect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-foreground">At Risk</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
