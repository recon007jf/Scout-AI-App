"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Building2, Linkedin, Mail, Calendar, Briefcase, Users, Award, ChevronRight } from "lucide-react"
import { getSignals, markSignalRead, generateSignalReply, convertSignalToTarget } from "@/lib/api/client"

interface Signal {
  id: string
  type: "email-reply" | "linkedin-post" | "job-change" | "company-news" | "renewal-window" | "industry-event"
  priority: "high" | "medium" | "low"
  timestamp: string
  contact: {
    name: string
    title: string
    company: string
    avatarUrl?: string
  }
  summary: string
  details: string
  actionable: boolean
  signalStrength: number
  replyText?: string
  isRead?: boolean
  actionSuggested?: string  // LLM-generated action recommendation
}

const signalTypeConfig = {
  "email-reply": { icon: Mail, label: "Email Reply", color: "text-green-400 bg-green-500/10" },
  "linkedin-post": { icon: Linkedin, label: "LinkedIn Activity", color: "text-blue-400 bg-blue-500/10" },
  "job-change": { icon: Briefcase, label: "Job Change", color: "text-purple-400 bg-purple-500/10" },
  "company-news": { icon: Building2, label: "Company News", color: "text-cyan-400 bg-cyan-500/10" },
  "renewal-window": { icon: Calendar, label: "Renewal Window", color: "text-amber-400 bg-amber-500/10" },
  "industry-event": { icon: Award, label: "Industry Event", color: "text-rose-400 bg-rose-500/10" },
}

export function SignalsView() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [filterType, setFilterType] = useState<"all" | "email-reply" | "job-change" | "industry-event" | "other">("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [profileImages, setProfileImages] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSignals()
  }, [])

  useEffect(() => {
    signals.forEach(async (signal) => {
      if (!profileImages[signal.contact.name]) {
        try {
          const response = await fetch(
            `/api/scout/profile-image?name=${encodeURIComponent(signal.contact.name)}&company=${encodeURIComponent(signal.contact.company)}`,
          )
          const data = await response.json()
          if (data.imageUrl) {
            setProfileImages((prev) => ({ ...prev, [signal.contact.name]: data.imageUrl }))
          }
        } catch (error) {
          console.error("[v0] Failed to fetch profile image:", error)
        }
      }
    })
  }, [signals, profileImages])

  const loadSignals = async () => {
    try {
      setIsLoading(true)
      // Use client function which handles mocking
      const signalsData = await getSignals()

      const mappedSignals = signalsData.map((signal: any) => ({
        id: signal.id,
        type: signal.type.replace("_", "-") as Signal["type"],
        priority: signal.priority,
        timestamp: new Date().toLocaleDateString(),
        contact: {
          name: signal.contact?.name || signal.contact?.full_name || "Unknown",
          title: signal.contact?.title || signal.contact?.role || "",
          company: signal.contact?.company || signal.contact?.firm || "Unknown",
          avatarUrl: signal.contact?.avatarUrl,
        },
        summary: signal.title || signal.summary || "New Signal",  // Use title as summary
        details: signal.details,
        actionable: signal.actionable,
        signalStrength: signal.priority_score || signal.signalStrength || 50,
        isRead: signal.isRead || false,
        replyText: signal.metadata?.raw_content || signal.replyText,
        actionSuggested: signal.metadata?.action_suggested || null,
      }))

      setSignals(mappedSignals)
    } catch (error) {
      console.error("[v0] Failed to load signals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSignal = async (signal: Signal) => {
    setSelectedSignal(signal)

    if (!signal.isRead) {
      // Optimistic update
      setSignals(signals.map((s) => (s.id === signal.id ? { ...s, isRead: true } : s)))

      try {
        await markSignalRead(signal.id)
        console.log("[v0] Signal marked as read:", signal.id)
      } catch (error) {
        console.error("[v0] Failed to mark signal as read:", error)
        // Revert on failure
        setSignals(signals.map((s) => (s.id === signal.id ? { ...s, isRead: false } : s)))
      }
    }
  }

  const handleGenerateReply = async () => {
    if (!selectedSignal) return

    setIsGeneratingReply(true)
    try {
      const { subject, body } = await generateSignalReply(selectedSignal.id)
      console.log("[v0] Reply generated successfully:", { subject, body })
      alert(`Draft Reply Generated!\n\nSubject: ${subject}\n\n${body}`)
    } catch (error) {
      console.error("[v0] Failed to generate reply:", error)
      alert("Failed to generate reply")
    } finally {
      setIsGeneratingReply(false)
    }
  }

  const handleConvertToTarget = async () => {
    if (!selectedSignal) return

    try {
      const { success, targetId } = await convertSignalToTarget(selectedSignal.id)
      if (success) {
        console.log("[v0] Signal converted to target:", targetId)
        alert("Added to Morning Briefing queue!")
      }
    } catch (error) {
      console.error("[v0] Failed to convert signal to target:", error)
      alert("Failed to convert signal")
    }
  }

  const filteredSignals = (() => {
    if (filterType === "all") return signals
    if (filterType === "email-reply") return signals.filter((s) => s.type === "email-reply")
    if (filterType === "job-change") return signals.filter((s) => s.type === "job-change")
    if (filterType === "industry-event") return signals.filter((s) => s.type === "industry-event")
    if (filterType === "other")
      return signals.filter((s) => ["linkedin-post", "company-news", "renewal-window"].includes(s.type))
    return signals
  })()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Signals</h2>
          <p className="text-muted-foreground">Incoming signals and opportunities detected by Scout</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType !== "all" ? "bg-transparent" : ""}
          >
            All Signals
          </Button>
          <Button
            variant={filterType === "email-reply" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("email-reply")}
            className={filterType !== "email-reply" ? "bg-transparent" : ""}
          >
            Email Responses
          </Button>
          <Button
            variant={filterType === "job-change" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("job-change")}
            className={filterType !== "job-change" ? "bg-transparent" : ""}
          >
            Job Changes
          </Button>
          <Button
            variant={filterType === "industry-event" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("industry-event")}
            className={filterType !== "industry-event" ? "bg-transparent" : ""}
          >
            Events
          </Button>
          <Button
            variant={filterType === "other" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("other")}
            className={filterType !== "other" ? "bg-transparent" : ""}
          >
            Other
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        <div className="col-span-6 space-y-2 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading signals...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No signals available</p>
            </div>
          ) : (
            filteredSignals.map((signal) => {
              const config = signalTypeConfig[signal.type]
              const Icon = config.icon
              const [textColor, bgColor] = config.color.split(" ")
              const avatarUrl = profileImages[signal.contact.name]

              return (
                <Card
                  key={signal.id}
                  className={`p-2.5 cursor-pointer transition-colors ${selectedSignal?.id === signal.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-border hover:bg-card/80"
                    }`}
                  onClick={() => handleSelectSignal(signal)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${textColor}`} />
                    </div>
                    <Badge
                      className={`${getPriorityColor(signal.priority)} text-[10px] py-0 px-1.5 h-4`}
                      variant="outline"
                    >
                      {signal.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-semibold py-0 px-1.5 h-4">
                      {signal.signalStrength}%
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                      {signal.timestamp}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs text-white leading-snug line-clamp-2">{signal.summary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`${signal.contact.name} profile`} />
                      )}
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {signal.contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold text-foreground truncate">{signal.contact.name}</span>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        <div className="col-span-6 overflow-y-auto">
          {selectedSignal ? (
            <div className="space-y-4">
              <Card className="p-6 bg-card/60">
                <div className="flex items-start gap-4 mb-4">
                  {(() => {
                    const config = signalTypeConfig[selectedSignal.type]
                    const Icon = config.icon
                    const [textColor, bgColor] = config.color.split(" ")
                    return (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                        <Icon className={`w-6 h-6 ${textColor}`} />
                      </div>
                    )
                  })()}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(selectedSignal.priority)} variant="outline">
                        {selectedSignal.priority} priority
                      </Badge>
                      <Badge variant="secondary">{signalTypeConfig[selectedSignal.type].label}</Badge>
                      {selectedSignal.actionable && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20" variant="outline">
                          Actionable
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{selectedSignal.summary}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSignal.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-foreground">{selectedSignal.signalStrength}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/60">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    {profileImages[selectedSignal.contact.name] && (
                      <AvatarImage
                        src={profileImages[selectedSignal.contact.name] || "/placeholder.svg"}
                        alt={`${selectedSignal.contact.name} profile`}
                      />
                    )}
                    <AvatarFallback>
                      {selectedSignal.contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground mb-1">{selectedSignal.contact.name}</h4>
                    <p className="text-sm text-muted-foreground mb-1">{selectedSignal.contact.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedSignal.contact.company}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    View Profile
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-card/60">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  Signal Details
                </h4>
                <p className="text-foreground leading-relaxed">{selectedSignal.details}</p>

                {selectedSignal.type === "email-reply" && selectedSignal.replyText && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Email Reply
                    </h5>
                    <p className="text-sm text-foreground italic leading-relaxed">"{selectedSignal.replyText}"</p>
                  </div>
                )}
              </Card>

              {selectedSignal.actionable && (
                <Card className="p-6 bg-green-500/5 border-green-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Recommended Action</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedSignal.actionSuggested || "Review this signal and determine appropriate follow-up."}
                      </p>
                    </div>
                  </div>
                  {/* Different buttons based on signal type */}
                  {selectedSignal.type === "email-reply" ? (
                    /* Email response signals - these came FROM the prospect */
                    <div className="flex gap-3">
                      {(selectedSignal.actionSuggested?.toLowerCase().includes("remove") ||
                        selectedSignal.priority === "high" && selectedSignal.actionSuggested?.toLowerCase().includes("negative")) ? (
                        <Button variant="destructive" className="gap-2" onClick={() => console.log("Mark as removed")}>
                          <Users className="w-4 h-4" />
                          Mark as Removed
                        </Button>
                      ) : (
                        <Button className="gap-2" onClick={() => window.open("mailto:admin@pacificaisystems.com?subject=Hot Lead Follow-up: " + selectedSignal.contact.name, "_blank")}>
                          <Mail className="w-4 h-4" />
                          Forward to Andrew
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={() => console.log("Archive signal")}
                      >
                        Archive
                      </Button>
                    </div>
                  ) : (
                    /* Other signals (news, events, etc.) - can add to pipeline */
                    <div className="flex gap-3">
                      <Button className="gap-2" onClick={handleConvertToTarget}>
                        <Users className="w-4 h-4" />
                        Add to Target Queue
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={handleGenerateReply}
                        disabled={isGeneratingReply}
                      >
                        {isGeneratingReply ? "Generating..." : "Create Draft"}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-6 bg-card/60">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  Notes for {selectedSignal.contact.name}
                </h4>
                {/* Placeholder for ContactNotes component */}
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Notes will appear here</p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Mail className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a signal to view details</h3>
              <p className="text-muted-foreground">Click on any signal from the list to see more information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
