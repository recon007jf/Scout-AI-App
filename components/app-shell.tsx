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
import { useUser, useClerk, useAuth } from "@clerk/nextjs"
import { AIAgentPanel } from "@/components/ai-agent-panel"
import { MorningPlanDashboard } from "@/components/morning-plan-dashboard"
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
import { Menu, Send } from "lucide-react" // Fixed import to use lucide-react

interface AppShellProps {
  children?: React.ReactNode
  initialView?: string
}

export function AppShell({ children, initialView = "morning-briefing" }: AppShellProps) {
  const [activeView, setActiveView] = useState<string>(initialView)
  const [user, setUser] = useState<{ email: string; name: string; role?: string } | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDate())
  const [settingsTab, setSettingsTab] = useState<string | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { getToken } = useAuth()

  // Wiring: Sync Clerk Token to LocalStorage for Legacy Client API
  /* --- AUTH & TOKEN SYNC WIRING --- */
  const [isTokenSynced, setIsTokenSynced] = useState(false)

  // 1. Sync Clerk Token to LocalStorage (Critical for Legacy API Client)
  useEffect(() => {
    const syncToken = async () => {
      if (!isLoaded) return // Wait for Clerk to load

      try {
        const getTokenResult = await getToken()
        const token = getTokenResult
        if (token) {
          localStorage.setItem("scout_auth_token", token)
          console.log("[AppShell] Token synced to storage")
        } else {
          console.warn("[AppShell] No token available from Clerk")
        }
      } catch (e) {
        console.error("[AppShell] Token Sync Failed", e)
      } finally {
        setIsTokenSynced(true) // Unblock rendering even if sync fails (graceful degradation)
      }
    }

    syncToken()
  }, [isLoaded, getToken])

  // 2. Auth State Check (Redirect if not authenticated)
  useEffect(() => {
    if (!isLoaded || !isTokenSynced) return // Wait for both Clerk and Token Sync

    if (!clerkUser) {
      console.log("[AppShell] No Clerk user found, redirecting...")
      setIsCheckingAuth(false)
      return
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || ""
    const name = clerkUser.fullName || clerkUser.firstName || email.split("@")[0] || "User"

    setUser({
      email,
      name,
      role: "admin",
    })

    setIsCheckingAuth(false)
  }, [clerkUser, isLoaded, isTokenSynced])


  // BLOCK RENDERING until Token is Synced (Prevents 401 Race Conditions)
  if (isCheckingAuth || !isTokenSynced) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-muted-foreground">Initializing Scout...</p>
        </div>
      </div>
    )
  }



  const navigationItems = [
    { id: "morning-briefing", label: "Morning Briefing", icon: "/icons/morning-briefing.png", color: "emerald" }, // Was plan
    { id: "daily-outreach", label: "Daily Outreach", icon: Send, color: "amber" }, // Was morning
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
      emerald: {
        textActive: "text-emerald-400",
        bgActive: "bg-emerald-900/50",
        bgHover: "hover:bg-emerald-900/30",
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
      emerald: "bg-gradient-to-br from-emerald-950/15 via-emerald-950/5 to-transparent",
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



  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Left Sidebar Navigation */}
      <aside className="w-20 border-r border-border bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950/40 flex flex-col items-center py-6 gap-6 overflow-y-auto">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2">
          <img src="/scout-logo.png" className="w-12 h-12 rounded-xl" alt="Scout" />
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
                onClick={() => router.push(`/scout/${item.id}`)}
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
                      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-foreground pointer-events-none leading-none">
                        {currentDay}
                      </div>
                    )}
                  </>
                ) : (
                  React.createElement(item.icon, {
                    className: "w-7 h-7 transition-all",
                    style: { opacity: isActive ? 1 : 0.6 },
                    strokeWidth: 1.5
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
          onClick={() => router.push("/scout/settings")}
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
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-foreground">Scout</h1>
                  <span className="text-sm font-semibold text-red-500 tracking-wide">Alpha Testing</span>
                </div>
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
        <main className="relative flex-1 overflow-hidden flex flex-col">
          {/* Alpha pages render directly */}
          {activeView === "morning-briefing" && <MorningPlanDashboard />}
          {activeView === "daily-outreach" && <MorningBriefingDashboard />}
          {activeView === "signals" && <SignalsView />}
          {activeView === "notes" && <NotesView />}
          {activeView === "settings" && <SettingsView />}

          {/* Non-Alpha pages get "Feature in Development" watermark */}
          {["network", "territory", "calendar", "performance"].includes(activeView) && (
            <div className="relative flex-1 overflow-hidden flex flex-col">
              {/* Watermark overlay */}
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
                <span
                  className="text-[5rem] md:text-[7rem] font-black uppercase tracking-widest text-white/[0.07] select-none whitespace-nowrap leading-tight text-center"
                  style={{ transform: "rotate(-25deg)" }}
                >
                  Feature in<br />Development
                </span>
              </div>
              {/* Page content renders beneath the watermark */}
              {activeView === "network" && <NetworkView />}
              {activeView === "territory" && <TerritoryView />}
              {activeView === "calendar" && <CalendarView />}
              {activeView === "performance" && <PerformanceView />}
            </div>
          )}
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
