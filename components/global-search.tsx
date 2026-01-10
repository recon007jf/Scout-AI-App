"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Command } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
  currentMode: string
}

export function GlobalSearch({ currentMode }: GlobalSearchProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const getPlaceholder = () => {
    const placeholderMap: Record<string, string> = {
      "morning-briefing": "Search targets and drafts...",
      signals: "Search opportunities and signals...",
      network: "Search contacts and companies...",
      territory: "Search accounts and locations...",
      calendar: "Search events and meetings...",
      performance: "Search metrics and reports...",
      notes: "Search notes and observations...", // Added notes placeholder for new Notes view
    }
    return placeholderMap[currentMode] || "Search Scout..."
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      document.getElementById("global-search-input")?.focus()
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    // TODO: Implement actual search functionality
    console.log("[v0] Searching:", value, "in mode:", currentMode)
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
        "bg-zinc-800/50 border border-zinc-700/50",
        isFocused && "bg-zinc-800/70 border-zinc-600/60 ring-1 ring-primary/20",
      )}
    >
      <Search className="w-4 h-4 text-muted-foreground" />
      <input
        id="global-search-input"
        type="text"
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={getPlaceholder()}
        className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
      />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Command className="w-3 h-3" />
        <span>K</span>
      </div>
    </div>
  )
}
