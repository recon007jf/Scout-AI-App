"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { getGoogleMapsScriptUrl } from "@/lib/actions/maps"

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
    if (typeof window !== "undefined" && !window.google) {
      getGoogleMapsScriptUrl()
        .then((scriptUrl) => {
          const script = document.createElement("script")
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
    } else if (window.google) {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 5,
      styles: darkMapStyles,
      backgroundColor: "#0a0a0b",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
    })

    googleMapRef.current = map
  }, [isLoaded])

  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()

    accounts.forEach((account) => {
      const marker = new window.google.maps.Marker({
        position: account.location,
        map: googleMapRef.current,
        title: account.company,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: statusColors[account.status],
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        onSelectAccount(account)
        googleMapRef.current?.panTo(account.location)
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; background: #18181b; color: #fff; border-radius: 4px;">
            <h4 style="margin: 0 0 4px; font-weight: 600; font-size: 14px;">${account.company}</h4>
            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">${account.address}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa;">${account.contact} • $${account.revenue.toLocaleString()}</p>
          </div>
        `,
      })

      marker.addListener("mouseover", () => {
        infoWindow.open(googleMapRef.current, marker)
      })

      marker.addListener("mouseout", () => {
        infoWindow.close()
      })

      markersRef.current.set(account.id, marker)
    })
  }, [accounts, isLoaded, onSelectAccount])

  useEffect(() => {
    if (!googleMapRef.current || !selectedAccount) return

    googleMapRef.current.panTo(selectedAccount.location)
    googleMapRef.current.setZoom(8)

    const marker = markersRef.current.get(selectedAccount.id)
    if (marker) {
      marker.setAnimation(window.google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 2000)
    }
  }, [selectedAccount])

  return (
    <Card className="h-full overflow-hidden relative bg-card/40">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-transparent to-purple-950/5 pointer-events-none z-10" />

      <div ref={mapRef} className="w-full h-full" />

      {!isLoaded && (
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
