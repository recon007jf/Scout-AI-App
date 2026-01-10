"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign, Calendar } from "lucide-react"
import TerritoryMap from "@/components/territory-map"

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

const mockAccounts: Account[] = [
  {
    id: "1",
    company: "TechCorp Solutions",
    contact: "Sarah Johnson",
    title: "VP of Operations",
    location: { lat: 37.7749, lng: -122.4194 },
    address: "San Francisco, CA",
    status: "active",
    revenue: 850000,
    lastContact: "2024-12-20",
    region: "West",
  },
  {
    id: "2",
    company: "Pacific Insurance Group",
    contact: "Michael Chen",
    title: "Risk Manager",
    location: { lat: 47.6062, lng: -122.3321 },
    address: "Seattle, WA",
    status: "prospect",
    revenue: 520000,
    lastContact: "2024-12-15",
    region: "Northwest",
  },
  {
    id: "3",
    company: "Mountain West Healthcare",
    contact: "Jennifer Martinez",
    title: "CFO",
    location: { lat: 39.7392, lng: -104.9903 },
    address: "Denver, CO",
    status: "active",
    revenue: 1200000,
    lastContact: "2024-12-18",
    region: "Mountain",
  },
  {
    id: "4",
    company: "SunValley Tech",
    contact: "David Kim",
    title: "Benefits Director",
    location: { lat: 33.4484, lng: -112.074 },
    address: "Phoenix, AZ",
    status: "at-risk",
    revenue: 380000,
    lastContact: "2024-11-28",
    region: "Southwest",
  },
  {
    id: "5",
    company: "Coastal Enterprises",
    contact: "Amanda Wright",
    title: "HR Director",
    location: { lat: 34.0522, lng: -118.2437 },
    address: "Los Angeles, CA",
    status: "active",
    revenue: 950000,
    lastContact: "2024-12-22",
    region: "West",
  },
  {
    id: "6",
    company: "Portland Manufacturing Co",
    contact: "Robert Taylor",
    title: "CEO",
    location: { lat: 45.5152, lng: -122.6784 },
    address: "Portland, OR",
    status: "prospect",
    revenue: 680000,
    lastContact: "2024-12-10",
    region: "Northwest",
  },
]

const statusConfig = {
  active: { label: "Active", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  prospect: { label: "Prospect", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "at-risk": { label: "At Risk", color: "bg-red-500/10 text-red-400 border-red-500/20" },
}

export function TerritoryView() {
  const [accounts] = useState<Account[]>(mockAccounts)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [filterRegion, setFilterRegion] = useState<"all" | string>("all")

  const filteredAccounts = filterRegion === "all" ? accounts : accounts.filter((a) => a.region === filterRegion)

  const regions = Array.from(new Set(accounts.map((a) => a.region).filter(Boolean)))
  const regionStats = regions.reduce(
    (acc, region) => {
      acc[region!] = accounts.filter((a) => a.region === region).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Territory</h2>
          <p className="text-muted-foreground">Geographic account and opportunity mapping</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterRegion === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRegion("all")}
            className={filterRegion !== "all" ? "bg-transparent" : ""}
          >
            All Regions
          </Button>
          {regions.map((region) => (
            <Button
              key={region}
              variant={filterRegion === region ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRegion(region!)}
              className={filterRegion !== region ? "bg-transparent" : ""}
            >
              {region} ({regionStats[region!]})
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* Map Visualization */}
        <div className="col-span-8">
          <TerritoryMap
            accounts={filteredAccounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
          />
        </div>

        {/* Account Detail or List */}
        <div className="col-span-4 overflow-y-auto space-y-4">
          {selectedAccount ? (
            <>
              <Card className="p-6 bg-card/60">
                <div className="mb-4">
                  <Badge className={statusConfig[selectedAccount.status].color} variant="outline">
                    {statusConfig[selectedAccount.status].label}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{selectedAccount.company}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedAccount.address}</span>
                </div>
                <div className="text-sm text-foreground mb-4">
                  <p className="font-medium">{selectedAccount.contact}</p>
                  <p className="text-xs text-muted-foreground">{selectedAccount.title}</p>
                </div>
                {selectedAccount.region && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{selectedAccount.region}</Badge>
                  </div>
                )}
              </Card>

              <Card className="p-5 bg-card/60">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Annual Revenue</p>
                    <p className="text-2xl font-semibold text-foreground">
                      ${selectedAccount.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card/60">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Contact</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(selectedAccount.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1">View Details</Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  Contact
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAccount(null)}
                className="w-full text-muted-foreground"
              >
                Clear Selection
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">All Accounts</h3>
                <p className="text-sm text-muted-foreground">Select an account on the map or from the list below</p>
              </div>

              {filteredAccounts.map((account) => (
                <Card
                  key={account.id}
                  className="p-4 cursor-pointer hover:border-primary/50 transition-all bg-card/40"
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{account.company}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{account.address}</span>
                      </div>
                    </div>
                    <Badge className={statusConfig[account.status].color} variant="outline">
                      {statusConfig[account.status].label}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-foreground">{account.contact}</p>
                    <p className="text-xs text-muted-foreground">{account.title}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>${account.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(account.lastContact).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
