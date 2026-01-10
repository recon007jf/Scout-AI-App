"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Building2, Linkedin, Send, SkipForward, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Target {
  id: string
  name: string
  title: string
  company: string
  confidence: number
  avatarUrl?: string
  linkedinUrl?: string
  reason: string
  draftSubject: string
  draftBody: string
}

export function MorningBriefingView() {
  const [targets, setTargets] = useState<Target[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")

  const currentTarget = targets[currentIndex]

  useEffect(() => {
    async function fetchBriefing() {
      try {
        const response = await fetch("/api/scout/briefing")

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.targets && Array.isArray(data.targets)) {
          const mappedTargets = await Promise.all(
            data.targets.map(async (target: any) => {
              let avatarUrl = undefined

              try {
                const imageResponse = await fetch(
                  `/api/scout/profile-image?name=${encodeURIComponent(target.name)}&company=${encodeURIComponent(target.company)}`,
                )

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  if (imageData.imageUrl) {
                    avatarUrl = imageData.imageUrl
                  }
                }
              } catch (error) {
                console.error("Failed to fetch profile image for", target.name)
                // avatarUrl stays undefined for fallback
              }

              return {
                id: target.id,
                name: target.name,
                title: target.title,
                company: target.company,
                confidence: 85,
                avatarUrl,
                linkedinUrl: target.linkedinUrl,
                reason: `Risk Profile: ${target.risk_profile}. ${target.base_archetype ? `Archetype: ${target.base_archetype}` : ""}`,
                draftSubject: target.draftSubject || "D&O Coverage Review Opportunity",
                draftBody:
                  target.draftBody ||
                  "Hi {name},\n\nI noticed your firm might benefit from reviewing your D&O coverage...",
              }
            }),
          )

          setTargets(mappedTargets)
          if (mappedTargets.length > 0) {
            setEditedSubject(mappedTargets[0].draftSubject)
            setEditedBody(mappedTargets[0].draftBody)
          }
        }
      } catch (error) {
        console.error("Error fetching briefing:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBriefing()
  }, [])

  useEffect(() => {
    if (currentTarget) {
      setEditedSubject(currentTarget.draftSubject)
      setEditedBody(currentTarget.draftBody)
    }
  }, [currentIndex, currentTarget])

  const handleApproveAndSend = async () => {
    if (!currentTarget) return

    if (!confirm("This will send a REAL email via Outlook. Are you sure?")) {
      return
    }

    setSending(true)
    try {
      const user = JSON.parse(localStorage.getItem("scout_current_user") || "{}")
      const userEmail = user.email || "andrew@pacificaisystems.com"

      const response = await fetch("/api/scout/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: currentTarget.id,
          final_subject: editedSubject,
          final_body: editedBody,
          user_email: userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send email")
      }

      alert("Email sent successfully!")

      const newTargets = targets.filter((_, i) => i !== currentIndex)
      setTargets(newTargets)

      if (newTargets.length === 0) {
        setCurrentIndex(0)
      } else if (currentIndex >= newTargets.length) {
        setCurrentIndex(newTargets.length - 1)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert(`Failed to send email: ${error}`)
    } finally {
      setSending(false)
    }
  }

  const handleSkip = () => {
    if (!currentTarget) return

    if (!confirm("Archive this candidate without sending?")) {
      return
    }

    const newTargets = targets.filter((_, i) => i !== currentIndex)
    setTargets(newTargets)

    if (newTargets.length === 0) {
      setCurrentIndex(0)
    } else if (currentIndex >= newTargets.length) {
      setCurrentIndex(newTargets.length - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < targets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const getInitials = (name: string): string => {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">No Candidates Ready</h3>
          <p className="text-muted-foreground">Check back later for new candidates to review.</p>
        </div>
      </div>
    )
  }

  if (!currentTarget) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-amber-500 text-amber-950 px-8 py-3 font-semibold text-center text-lg">
        ⚠️ TEST MODE — EMAILS ARE NOT BEING SENT ⚠️
      </div>

      {/* Header with navigation */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Morning Briefing Cockpit</h2>
            <p className="text-sm text-muted-foreground">
              Reviewing {currentIndex + 1} of {targets.length} candidates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={currentIndex === targets.length - 1}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-8 p-8 h-full">
          {/* Left side: Candidate details */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Candidate Details</h3>

              <div className="flex items-start gap-4 mb-6">
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarFallback className="bg-blue-500 text-white text-2xl font-semibold">
                    {getInitials(currentTarget.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-foreground">{currentTarget.name}</h4>
                  <p className="text-muted-foreground">{currentTarget.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{currentTarget.company}</span>
                  </div>
                </div>
              </div>

              {currentTarget.linkedinUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => window.open(currentTarget.linkedinUrl, "_blank")}
                >
                  <Linkedin className="w-4 h-4" />
                  View LinkedIn Profile
                </Button>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Why This Candidate?</h3>
              <p className="text-muted-foreground leading-relaxed">{currentTarget.reason}</p>
              <div className="mt-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentTarget.confidence}% Match
                </Badge>
              </div>
            </Card>
          </div>

          {/* Right side: Editable draft */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Draft Email</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Subject Line</label>
                  <Input value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} className="w-full" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Email Body</label>
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full min-h-[400px] font-mono text-sm"
                  />
                </div>
              </div>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleApproveAndSend}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Approve & Send
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-muted-foreground hover:bg-muted bg-transparent"
                onClick={handleSkip}
                disabled={sending}
              >
                <SkipForward className="w-5 h-5" />
                Skip/Archive
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Adding Truth Marker to footer */}
      <footer className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
        Build: v247 | Time: {new Date().toISOString()} | Backend: ...7752
      </footer>
    </div>
  )
}
