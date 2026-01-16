"use client"

import React from "react"

import { AvatarFallback } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useClerk } from "@clerk/nextjs"
import { AIAgentPanel } from "@/components/ai-agent-panel"
import { MorningBriefingDashboard } from "@/components/morning-briefing-dashboard"
import { SignalsView } from "@/components/views/signals-view"
import { NetworkView } from "@/components/views/network-view"
import { TerritoryView } from "@/components/views/territory-view"
import { NotesView } from "@/components/views/notes-view"
import { CalendarView } from "@/components/views/calendar-view"
import { PerformanceView } from "@/components/views/performance-view"
import { GlobalSearch } from "@/components/global-search"
import { useRouter } from "next/navigation"
import { SettingsView } from "@/components/views/settings-view"
import { Menu } from "lucide-react" // Fixed import to use lucide-react

interface AppShellProps {
  children?: React.ReactNode
  initialView?: string
}

export function AppShell({ children, initialView = "morning" }: AppShellProps) {
  const [activeView, setActiveView] = useState<string>(initialView)
  const [user, setUser] = useState<{ email: string; name: string; role?: string } | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDate())
  const [settingsTab, setSettingsTab] = useState<string | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!clerkUser) {
      console.log("[v0 AppShell] No Clerk user found")
      setIsCheckingAuth(false)
      return
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || ""
    const name = clerkUser.fullName || clerkUser.firstName || email.split("@")[0] || "User"

    setUser({
      email,
      name,
      role: "admin", // Temporary: will be fetched from database via API
    })

    setIsCheckingAuth(false)
  }, [clerkUser, isLoaded])

  const navigationItems = [
    { id: "morning", label: "Morning Briefing", icon: "/icons/morning-briefing.png", color: "amber" },
    { id: "signals", label: "Signals", icon: "/icons/signals.png", color: "green" },
    { id: "network", label: "Network", icon: "/icons/ledger.png", color: "blue" },
    { id: "territory", label: "Territory", icon: "/icons/map-view.png", color: "purple" },
    { id: "calendar", label: "Calendar", icon: "/icons/calendar.png", color: "rose" },
    { id: "performance", label: "Performance", icon: "/icons/performance.png", color: "cyan" },
    { id: "notes", label: "Notes", icon: "/icons/notes-icon.svg", color: "orange" },
  ]

  const getUserInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      amber: {
        textActive: "text-amber-400",
        bgActive: "bg-amber-900/50",
        bgHover: "hover:bg-amber-900/30",
      },
      green: {
        textActive: "text-green-400",
        bgActive: "bg-green-900/50",
        bgHover: "hover:bg-green-900/30",
      },
      blue: {
        textActive: "text-blue-400",
        bgActive: "bg-blue-900/50",
        bgHover: "hover:bg-blue-900/30",
      },
      purple: {
        textActive: "text-purple-400",
        bgActive: "bg-purple-900/50",
        bgHover: "hover:bg-purple-900/30",
      },
      rose: {
        textActive: "text-rose-400",
        bgActive: "bg-rose-900/50",
        bgHover: "hover:bg-rose-900/30",
      },
      cyan: {
        textActive: "text-cyan-400",
        bgActive: "bg-cyan-900/50",
        bgHover: "hover:bg-cyan-900/30",
      },
      orange: {
        textActive: "text-orange-400",
        bgActive: "bg-orange-900/50",
        bgHover: "hover:bg-orange-900/30",
      },
    }

    return colorMap[color as keyof typeof colorMap] || colorMap.amber
  }

  const getPageTint = () => {
    const activeItem = navigationItems.find((item) => item.id === activeView)
    if (!activeItem) return ""
    const gradientMap = {
      amber: "bg-gradient-to-br from-amber-950/15 via-amber-950/5 to-transparent",
      green: "bg-gradient-to-br from-green-950/15 via-green-950/5 to-transparent",
      blue: "bg-gradient-to-br from-blue-950/15 via-blue-950/5 to-transparent",
      purple: "bg-gradient-to-br from-purple-950/15 via-purple-950/5 to-transparent",
      rose: "bg-gradient-to-br from-rose-950/15 via-rose-950/5 to-transparent",
      cyan: "bg-gradient-to-br from-cyan-950/15 via-cyan-950/5 to-transparent",
      orange: "bg-gradient-to-br from-orange-950/15 via-orange-950/5 to-transparent",
    }
    return gradientMap[activeItem.color as keyof typeof gradientMap] || ""
  }

  const handleSettingsMount = () => {
    setSettingsTab(undefined)
  }

  const handleNavigateToSettings = (tab?: string) => {
    setSettingsTab(tab)
    setActiveView("settings")
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" })
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Left Sidebar Navigation */}
      <aside className="w-20 border-r border-border bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950/40 flex flex-col items-center py-6 gap-6 overflow-y-auto">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
          <Menu className="w-8 h-8 text-primary" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-5">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id
            const colors = getColorClasses(item.color)

            return (
              <button
                key={item.id}
                className={cn(
                  "relative w-18 h-18 rounded-xl flex items-center justify-center transition-all",
                  isActive ? colors.bgActive : `text-muted-foreground hover:${colors.bgHover}`,
                )}
                onClick={() => setActiveView(item.id)}
                title={item.label}
              >
                {typeof item.icon === "string" ? (
                  <>
                    <img
                      src={item.icon || "/placeholder.svg"}
                      className="w-10 h-10 transition-all"
                      style={{ opacity: isActive ? 1 : 0.6 }}
                      alt={item.label}
                    />
                    {item.id === "calendar" && (
                      <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-foreground pointer-events-none leading-none">
                        {currentDay}
                      </div>
                    )}
                  </>
                ) : (
                  React.createElement(item.icon, {
                    className: "w-10 h-10 transition-all",
                    style: { opacity: isActive ? 1 : 0.6 },
                  })
                )}
              </button>
            )
          })}
        </nav>

        <button
          className={cn(
            "w-18 h-18 rounded-xl flex items-center justify-center transition-all mt-auto",
            activeView === "settings" ? "text-gray-400 bg-gray-900/50" : "text-muted-foreground hover:bg-gray-900/30",
          )}
          onClick={() => setActiveView("settings")}
          title="Settings"
        >
          <img src="/icons/settings.png" className="w-10 h-10" alt="Settings" />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-gradient-to-r from-zinc-950/80 via-zinc-950/60 to-zinc-950/40 backdrop-blur-sm sticky top-0 z-20">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Scout</h1>
                <p className="text-xs text-muted-foreground">by Pacific AI Systems</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-card/50">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                  </div>
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="border-b border-border/50 bg-card/20 px-6 py-3 flex justify-center">
          <div className="w-full max-w-3xl">
            <GlobalSearch currentMode={activeView} />
          </div>
        </div>

        {/* Content */}
        <main className="relative flex-1 overflow-auto">
          {activeView === "morning" && <MorningBriefingDashboard />}
          {activeView === "signals" && <SignalsView />}
          {activeView === "network" && <NetworkView />}
          {activeView === "territory" && <TerritoryView />}
          {activeView === "calendar" && <CalendarView />}
          {activeView === "performance" && <PerformanceView />}
          {activeView === "notes" && <NotesView />}
          {activeView === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Right Sidebar Navigation */}
      <div className="w-auto border-l border-border bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950/40 flex flex-col items-center py-6 gap-6 overflow-y-auto">
        {/* AI Agent Panel */}
        <AIAgentPanel />
      </div>

    </div>
  )
}
