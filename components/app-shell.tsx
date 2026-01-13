"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState, useEffect } from "react"
import { Settings, Menu } from "lucide-react"
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
import { SignalsView } from "@/components/views/signals"
import { NetworkView } from "@/components/views/network"
import { TerritoryView } from "@/components/views/territory"
import { NotesView } from "@/components/views/notes"
import { GlobalSearch } from "@/components/global-search"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [activeView, setActiveView] = useState<string>("morning-briefing")
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
    { id: "morning-briefing", label: "Morning Briefing", icon: "/icons/morning-briefing.png", color: "amber" },
    { id: "signals", label: "Signals", icon: "/icons/signals.png", color: "green" },
    { id: "network", label: "Network", icon: "/icons/ledger.png", color: "blue" },
    { id: "territory", label: "Territory", icon: "/icons/map-view.png", color: "purple" },
    { id: "calendar", label: "Calendar", icon: "/icons/calendar.png", color: "rose", showDate: true },
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

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      amber: {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        bgHover: "hover:bg-amber-500/20",
        bgActive: "bg-amber-500/20",
        pageTint: "bg-amber-950/10",
      },
      green: {
        text: "text-green-400",
        bg: "bg-green-500/10",
        bgHover: "hover:bg-green-500/20",
        bgActive: "bg-green-500/20",
        pageTint: "bg-green-950/10",
      },
      blue: {
        text: "text-blue-400",
        bg: "bg-blue-500/10",
        bgHover: "hover:bg-blue-500/20",
        bgActive: "bg-blue-500/20",
        pageTint: "bg-blue-950/10",
      },
      purple: {
        text: "text-purple-400",
        bg: "bg-purple-500/10",
        bgHover: "hover:bg-purple-500/20",
        bgActive: "bg-purple-500/20",
        pageTint: "bg-purple-950/10",
      },
      rose: {
        text: "text-rose-400",
        bg: "bg-rose-500/10",
        bgHover: "hover:bg-rose-500/20",
        bgActive: "bg-rose-500/20",
        pageTint: "bg-rose-950/10",
      },
      cyan: {
        text: "text-cyan-400",
        bg: "bg-cyan-500/10",
        bgHover: "hover:bg-cyan-500/20",
        bgActive: "bg-cyan-500/20",
        pageTint: "bg-cyan-950/10",
      },
      orange: {
        text: "text-orange-400",
        bg: "bg-orange-500/10",
        bgHover: "hover:bg-orange-500/20",
        bgActive: "bg-orange-500/20",
        pageTint: "bg-orange-950/10",
      },
      gray: {
        text: "text-gray-400",
        bg: "bg-gray-500/10",
        bgHover: "hover:bg-gray-500/20",
        bgActive: "bg-gray-500/20",
        pageTint: "bg-gray-950/10",
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
      gray: "bg-gradient-to-br from-gray-950/15 via-gray-950/5 to-transparent",
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
            const colors = getColorClasses(item.color, isActive)

            return (
              <button
                key={item.id}
                className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center transition-all relative",
                  isActive ? colors.text : "text-muted-foreground",
                  isActive ? colors.bgActive : colors.bgHover,
                )}
                onClick={() => setActiveView(item.id)}
                title={item.label}
              >
                <Image
                  src={item.icon || "/placeholder.svg"}
                  alt={item.label}
                  width={68}
                  height={68}
                  className={cn("transition-all", isActive ? "opacity-100" : "opacity-60")}
                />
                {item.showDate && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-black pt-3">
                    {currentDay}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <button
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center transition-all mt-auto",
            activeView === "settings" ? "text-gray-400 bg-gray-500/20" : "text-muted-foreground hover:bg-gray-500/20",
          )}
          onClick={() => setActiveView("settings")}
          title="Settings"
        >
          <Settings className="w-8 h-8" />
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
          {activeView === "morning-briefing" && <MorningBriefingDashboard />}
          {activeView === "signals" && <SignalsView />}
          {activeView === "network" && <NetworkView />}
          {activeView === "territory" && <TerritoryView />}
          {activeView === "calendar" && <div>Calendar View Placeholder</div>}
          {activeView === "performance" && <div>Performance View Placeholder</div>}
          {activeView === "notes" && <NotesView />}
          {activeView === "settings" && <div>Settings View Placeholder</div>}
        </main>
      </div>

      {/* Right Sidebar Navigation */}
      <div className="w-64 border-l border-border bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950/40 flex flex-col items-center py-6 gap-6 overflow-y-auto">
        {/* AI Agent Panel */}
        <AIAgentPanel />
      </div>
    </div>
  )
}
