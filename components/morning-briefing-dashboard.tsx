"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactNotes } from "@/components/contact-notes"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
  Building2,
  CheckCircle2,
  X,
  Sparkles,
  Mail,
  Linkedin,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  Calendar,
  Pause,
  Play,
  Undo2,
  Pencil,
  Check,
  MessageSquare,
} from "lucide-react"
import {
  approveTarget,
  dismissTarget,
  saveDraft,
  regenerateDraft,
  pauseTarget,
  getOutreachStatus,
  resumeOutreach,
  pauseOutreach,
} from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { PauseDurationModal } from "@/components/pause-duration-modal"
import { ThresholdWarningModal } from "@/components/threshold-warning-modal"
import { getMorningQueue, generateDraftForTarget, regenerateDraftWithFeedback } from "@/lib/api/morning-queue"

type Target = {
  id: string
  name: string
  title: string
  company: string
  confidence: number
  profileImage: string
  contactName: string
  email: string
  linkedinUrl: string
  draft: {
    subject: string
    body: string
    tone: string
    wordCount: number
  } | null
  aiRationale: string
  businessPersona: {
    type: string
    description: string
    decisionStyle: string
    communicationPreference: string
  }
  dossier: {
    selfFundedPlans: {
      clientName: string
      planType: string
      enrollmentSize: number
      renewalDate?: string
      upcomingChanges?: string
    }[]
    companySize: string
    industry: string
    opportunityScore: number
    recentActivity: string[]
    painPoints: string[]
  }
  email_subject?: string
  email_body?: string
}

type PauseInfo = {
  type: "next-batch" | "specific-date"
  date?: string
}

export function MorningBriefingDashboard({ onNavigateToSettings }: { onNavigateToSettings?: (tab?: string) => void }) {
  const [targets, setTargets] = useState<Target[]>([])
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [dismissedTargets, setDismissedTargets] = useState<Set<string>>(new Set())
  const [pausedTargets, setPausedTargets] = useState<Map<string, string>>(new Map())
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [showRegenerateInput, setShowRegenerateInput] = useState(false)
  const [regenerateComments, setRegenerateComments] = useState("")
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [pauseOption, setPauseOption] = useState<"next-batch" | "specific-date">("next-batch")
  const [pauseDate, setPauseDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"draft" | "dossier">("draft")
  const [outlookConnected, setOutlookConnected] = useState<boolean>(false)
  const [outreachStatus, setOutreachStatus] = useState<"active" | "paused">("paused")
  const [pausedAt, setPausedAt] = useState<Date | null>(null)
  const [showThresholdWarning, setShowThresholdWarning] = useState(false)
  const [showPauseDurationModal, setShowPauseDurationModal] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [selectedPauseDuration, setSelectedPauseDuration] = useState<string>("manual")
  const [draftCache, setDraftCache] = useState<Record<string, { subject: string; body: string }>>({})
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false) // Added for the comment dialog state

  useEffect(() => {
    loadData()
    checkOutlookConnection()
    checkOutreachStatus()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      checkOutlookConnection()
      checkOutreachStatus()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedTarget) return

    const targetId = selectedTarget.id

    // Check if we already have a draft in cache
    if (draftCache[targetId]) {
      console.log("[v0] SKIP: Draft already in cache for:", targetId)
      return
    }

    // Check if draft exists in database first (from email_subject/email_body fields)
    if (selectedTarget.email_subject && selectedTarget.email_body) {
      console.log("[v0] Loading existing draft from database for:", targetId)
      setDraftCache((prev) => ({
        ...prev,
        [targetId]: {
          subject: selectedTarget.email_subject || "",
          body: selectedTarget.email_body || "",
        },
      }))
      return
    }

    // No draft exists - generate one
    console.log("[v0] No existing draft found, generating new draft for:", targetId)
    const generateDraft = async () => {
      setIsGeneratingDraft(true)
      try {
        console.log("[v0] Calling generateDraftForTarget...")
        const draft = await generateDraftForTarget(selectedTarget)
        console.log("[v0] Draft generated successfully:", draft)

        if (draft.subject && draft.body && !draft.body.includes("[LLM PLACEHOLDER]")) {
          setDraftCache((prev) => ({ ...prev, [targetId]: draft }))
          console.log("[v0] Draft saved to cache")
        } else {
          console.log("[v0] Draft generation returned placeholder, not caching")
        }
      } catch (error) {
        console.error("[v0] Failed to generate draft:", error)
        toast({
          title: "Draft Generation Failed",
          description: error instanceof Error ? error.message : "Could not generate email draft. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingDraft(false)
      }
    }

    generateDraft()
  }, [selectedTarget, draftCache])

  const checkOutlookConnection = async () => {
    try {
      const response = await fetch("/api/scout/outlook/test?email=admin@pacificaisystems.com")
      const data = await response.json()
      setOutlookConnected(data.success === true)
    } catch (error) {
      console.error("[v0] Failed to check Outlook connection:", error)
      setOutlookConnected(false)
    }
  }

  const checkOutreachStatus = async () => {
    try {
      const status = await getOutreachStatus()
      console.log("[v0] Backend Status Field:", status.status)

      if (outlookConnected && status.status === "active") {
        setOutreachStatus("active")
      } else {
        setOutreachStatus("paused")
      }

      setPausedAt(status.paused_at ? new Date(status.paused_at) : null)

      if (status.warning_due) {
        setShowThresholdWarning(true)
      }
    } catch (error) {
      console.error("[v0] Failed to check outreach status:", error)
      setOutreachStatus("paused")
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getMorningQueue()

      setTargets(data)

      if (data.length > 0) {
        setSelectedTarget(data[0])
      }
    } catch (error) {
      console.error("[Morning Briefing] Fetch Error:", error)
      toast.error(`Failed to load briefing: ${error}`)
      setTargets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (targetId: string) => {
    setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "approved" } : t)))

    try {
      await approveTarget(targetId)
      toast.success("Draft approved and queued for sending")
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to approve target:", error)
      toast.error("Failed to approve draft")
      setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "pending" } : t)))
    }
  }

  const handleDismiss = async (targetId: string) => {
    setDismissedTargets((prev) => new Set(prev).add(targetId))

    try {
      await dismissTarget(targetId, "bad_fit")
      toast.success("Target dismissed")
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to dismiss target:", error)
      toast.error("Failed to dismiss target")
      setDismissedTargets((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  const handleUndoDismiss = (targetId: string) => {
    setDismissedTargets((prev) => {
      const next = new Set(prev)
      next.delete(targetId)
      return next
    })
  }

  const handlePauseTarget = async (targetId: string) => {
    setPausedTargets((prev) => new Map(prev).set(targetId, "user_paused"))

    try {
      await pauseTarget(targetId, "user_paused")
      toast.success("Target paused")
    } catch (error) {
      console.error("[v0] Failed to pause target:", error)
      toast.error("Failed to pause target")
      setPausedTargets((prev) => {
        const next = new Map(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  const handlePauseOutreach = async () => {
    try {
      await pauseOutreach(selectedPauseDuration as "manual" | "1h" | "2h" | "3h" | "1d" | "2d" | "3d")
      setOutreachStatus("paused")
      setPausedAt(new Date())
      setShowPauseDurationModal(false)
      toast.success(
        `Outreach paused ${selectedPauseDuration === "manual" ? "until resumed" : `for ${selectedPauseDuration}`}`,
      )
    } catch (error) {
      toast.error("Failed to pause outreach")
      console.error(error)
    }
  }

  const handleResumeOutreach = async () => {
    try {
      await resumeOutreach()
      setOutreachStatus("active")
      setPausedAt(null)
      setShowThresholdWarning(false)
      toast.success("Outreach resumed")
    } catch (error) {
      toast.error("Failed to resume outreach")
      console.error(error)
    }
  }

  const handleThresholdKeepPaused = () => {
    setShowThresholdWarning(false)
    toast.info("Outreach remains paused")
  }

  const handleThresholdResume = async () => {
    setShowThresholdWarning(false)
    await handleResumeOutreach()
  }

  const handleStartEdit = () => {
    if (selectedTarget) {
      const draft = draftCache[selectedTarget.id]
      if (draft) {
        setEditedSubject(draft.subject)
        setEditedBody(draft.body)
      } else {
        // Keep editor empty if no draft exists yet
        setEditedSubject("")
        setEditedBody("")
      }
      setIsEditingEmail(true)
      setShowRegenerateInput(false)
    } else {
      toast({
        title: "No Target Selected",
        description: "Please select a target first.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (selectedTarget) {
      const oldDraft = draftCache[selectedTarget.id]

      // Update the draft cache immediately for UI
      setDraftCache((prev) => ({
        ...prev,
        [selectedTarget.id]: { subject: editedSubject, body: editedBody },
      }))
      setIsEditingEmail(false)

      try {
        await saveDraft(selectedTarget.id, editedSubject, editedBody)
        console.log("[v0] Draft saved successfully:", selectedTarget.id)
        toast({
          title: "Draft Saved",
          description: "Your changes have been saved.",
        })
      } catch (error) {
        console.error("[v0] Failed to save draft:", error)
        // Revert on error
        if (oldDraft) {
          setDraftCache((prev) => ({
            ...prev,
            [selectedTarget.id]: oldDraft,
          }))
        }
        setIsEditingEmail(true)
        toast({
          title: "Save Failed",
          description: "Could not save edited draft. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Renamed to handleRegenerate to match usage in the update
  const handleRegenerate = async () => {
    if (selectedTarget) {
      setIsRegenerating(true)
      try {
        const result = await regenerateDraft(selectedTarget.id)

        const subject = result.subject ?? result.draft_subject ?? ""
        const body = result.body_clean ?? result.draft ?? result.body ?? ""

        if (subject && body && !body.includes("[LLM PLACEHOLDER]")) {
          setDraftCache((prev) => ({
            ...prev,
            [selectedTarget.id]: { subject, body },
          }))
          setEditedSubject(subject)
          setEditedBody(body)
          console.log("[v0] Draft regenerated successfully:", selectedTarget.id)
          toast({
            title: "Draft Regenerated",
            description: "A new draft has been generated.",
          })
        } else {
          console.error("[v0] Regeneration returned placeholder or empty content")
          toast({
            title: "Regeneration Incomplete",
            description: "The backend is still processing. Please try again in a moment.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Failed to regenerate draft:", error)
        toast({
          title: "Regeneration Failed",
          description: error instanceof Error ? error.message : "Could not regenerate draft. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsRegenerating(false)
      }
    }
  }

  const handleRegenerateWithComments = async () => {
    if (selectedTarget && regenerateComments.trim()) {
      setIsRegenerating(true)
      try {
        const currentDraft = draftCache[selectedTarget.id] || { subject: "", body: "" }

        const result = await regenerateDraftWithFeedback(selectedTarget, currentDraft, regenerateComments)

        const subject = result.subject ?? result.draft_subject ?? ""
        const body = result.body_clean ?? result.draft ?? result.body ?? ""

        if (subject && body && !body.includes("[LLM PLACEHOLDER]")) {
          setDraftCache((prev) => ({
            ...prev,
            [selectedTarget.id]: { subject, body },
          }))

          setEditedSubject(subject)
          setEditedBody(body)
          setRegenerateComments("")
          setShowRegenerateInput(false)
          setShowCommentDialog(false) // Close the dialog after successful regeneration
          console.log("[v0] Draft regenerated with feedback:", selectedTarget.id)
          toast({
            title: "Draft Updated",
            description: "Your feedback has been incorporated.",
          })
        } else {
          console.error("[v0] Regeneration with feedback returned placeholder or empty content")
          toast({
            title: "Regeneration Incomplete",
            description: "The backend is still processing. Please try again in a moment.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Failed to regenerate draft with feedback:", error)
        toast({
          title: "Regeneration Failed",
          description:
            error instanceof Error ? error.message : "Could not regenerate draft with feedback. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsRegenerating(false)
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditingEmail(false)
    setShowRegenerateInput(false)
    setRegenerateComments("")
  }

  const getTimeSincePaused = (): string => {
    if (!pausedAt) return ""
    const now = new Date()
    const minutes = Math.floor((now.getTime() - pausedAt.getTime()) / (1000 * 60))
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  }

  const handleUnpause = (targetId: string) => {
    setPausedTargets((prev) => {
      const next = new Map(prev)
      next.delete(targetId)
      return next
    })
  }

  const advanceToNextTarget = (currentTargetId: string) => {
    const currentIndex = targets.findIndex((t) => t.id === currentTargetId)
    const nextTarget = targets[currentIndex + 1]

    if (nextTarget) {
      setSelectedTarget(nextTarget)
    } else if (currentIndex > 0) {
      setSelectedTarget(targets[0])
    }
  }

  const handleConfirmPause = async (pauseInfo: PauseInfo) => {
    if (selectedTarget) {
      setPausedTargets((prev) => new Map(prev).set(selectedTarget.id, pauseInfo.type))

      try {
        await pauseTarget(selectedTarget.id, pauseInfo.type, pauseInfo.date)
        toast.success("Target paused")
      } catch (error) {
        console.error("[v0] Failed to pause target:", error)
        toast.error("Failed to pause target")
        setPausedTargets((prev) => {
          const next = new Map(prev)
          next.delete(selectedTarget.id)
          return next
        })
      }
    }
  }

  const getInitials = (name: string): string => {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const activeTargets = targets.filter((target) => !dismissedTargets.has(target.id))

  const handleSelectTarget = (target: Target) => {
    setSelectedTarget(target)
  }

  const handleConnectOutlook = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings("integrations")
    }
  }

  const currentDraft = selectedTarget ? draftCache[selectedTarget.id] : null

  // This prevents the white-screen crash while the system loads the batch
  if (!selectedTarget && activeTargets.length > 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading System Selection...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-full gap-6">
        <div className="w-[400px] flex flex-col bg-card border-r border-border h-full overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold mb-2">Morning Briefing</h2>
            <p className="text-sm text-muted-foreground mb-4">Review today's target batch and approve drafts</p>

            <div className="flex items-center justify-between mb-2">
              {!outlookConnected ? (
                <div className="text-sm text-orange-400">
                  Status: <span className="font-medium">Outreach Offline</span>
                </div>
              ) : (
                <div className={cn("text-sm", outreachStatus === "active" ? "text-green-400" : "text-red-400")}>
                  Status:{" "}
                  <span className="font-medium">
                    {outreachStatus === "active" ? "Outreach Active" : "Outreach Paused"}
                  </span>
                </div>
              )}
            </div>

            {!outlookConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-orange-500/20 text-orange-400 bg-transparent"
                onClick={handleConnectOutlook}
              >
                Connect Outlook in Settings
              </Button>
            ) : outreachStatus === "paused" ? (
              <Button
                onClick={handleResumeOutreach}
                size="sm"
                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume Outreach
              </Button>
            ) : (
              <Button
                onClick={() => setShowPauseDurationModal(true)}
                size="sm"
                variant="outline"
                className="w-full border-orange-500/20 text-orange-400"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Outreach
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTargets.map((target) => (
              <Card
                key={target.id}
                className={cn(
                  "p-4 cursor-pointer transition-all border",
                  selectedTarget?.id === target.id
                    ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-border hover:border-blue-500/50 hover:bg-accent/50",
                )}
                onClick={() => handleSelectTarget(target)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 border-2 border-border">
                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                      {getInitials(target.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{target.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{target.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {dismissedTargets.has(target.id) && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            Dismissed
                          </Badge>
                        )}
                        {pausedTargets.has(target.id) && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Paused
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-foreground">{target.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{target.company}</span>
                    </div>
                    {pausedTargets.has(target.id) && (
                      <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        {pausedTargets.get(target.id) === "next-batch"
                          ? "→ Moved to next batch today"
                          : "→ Paused by user"}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedTarget && (
            <div className="space-y-4">
              <Card className="p-6 bg-card/60">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-border">
                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-xl">
                      {getInitials(selectedTarget.contactName || selectedTarget.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">{selectedTarget.contactName}</h2>
                    <p className="text-muted-foreground mb-2">{selectedTarget.title}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <a
                        href={`mailto:${selectedTarget.email}`}
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                      <a
                        href={selectedTarget.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {selectedTarget.confidence}% confidence
                  </Badge>
                </div>
              </Card>

              <ContactNotes contactName={selectedTarget.contactName || "Contact"} contactId={selectedTarget.id} />

              <Card className="p-4 bg-card/40">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(selectedTarget.id)}
                    disabled={!outlookConnected || outreachStatus === "paused"}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Draft
                  </Button>
                  {pausedTargets.has(selectedTarget.id) ? (
                    <Button
                      variant="outline"
                      className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10"
                      onClick={() => handleUnpause(selectedTarget.id)}
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Unpause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-border/50 hover:bg-accent/5 bg-transparent"
                      onClick={() => handlePauseTarget(selectedTarget.id)}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {dismissedTargets.has(selectedTarget.id) ? (
                    <Button
                      variant="outline"
                      className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10"
                      onClick={() => handleUndoDismiss(selectedTarget.id)}
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => handleDismiss(selectedTarget.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Dismiss Target
                    </Button>
                  )}
                </div>
                {!outlookConnected ? (
                  <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-sm text-orange-600 dark:text-orange-400">
                    Connect Outlook in Settings to activate outreach and approve drafts.
                  </div>
                ) : outreachStatus === "paused" ? (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm text-amber-600 dark:text-amber-400">
                    Outreach is paused. Resume to approve drafts.
                  </div>
                ) : null}
              </Card>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draft" | "dossier")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draft">Review Draft</TabsTrigger>
                  <TabsTrigger value="dossier">Full Dossier</TabsTrigger>
                </TabsList>

                <TabsContent value="draft" className="space-y-4 mt-4">
                  <Card className="p-6 bg-card/60">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-muted-foreground">SUBJECT LINE</label>
                        {!isEditingEmail && (
                          <Button variant="ghost" size="sm" onClick={handleStartEdit} className="h-8">
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit Email
                          </Button>
                        )}
                      </div>

                      {isEditingEmail ? (
                        <Input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="font-medium"
                          placeholder="Enter subject line..."
                        />
                      ) : isGeneratingDraft ? (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Generating subject...</span>
                        </div>
                      ) : currentDraft?.subject ? (
                        <h3 className="text-lg font-medium">{currentDraft.subject}</h3>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No draft yet - click "Regenerate with AI" to create one
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">EMAIL BODY</label>
                      {isEditingEmail ? (
                        <Textarea
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="min-h-[300px] resize-none font-sans"
                          placeholder="Enter email body..."
                        />
                      ) : isGeneratingDraft ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 bg-muted/50 rounded-md min-h-[300px]">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <div className="text-center">
                            <p className="text-sm font-medium mb-1">Generating personalized email...</p>
                            <p className="text-xs text-muted-foreground">This may take a few moments</p>
                          </div>
                        </div>
                      ) : currentDraft?.body ? (
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap">{currentDraft.body}</div>
                      ) : (
                        <div className="p-8 bg-muted/50 rounded-md text-center">
                          <p className="text-sm text-muted-foreground mb-2">No draft available</p>
                          <p className="text-xs text-muted-foreground">
                            Click "Regenerate with AI" below to generate an email draft
                          </p>
                        </div>
                      )}
                    </div>

                    {isEditingEmail && (
                      <div className="flex gap-2 pt-4 border-t border-border mb-4">
                        <Button size="sm" onClick={handleSaveEdit} className="bg-primary">
                          <Check className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} className="bg-transparent">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}

                    {!isEditingEmail && selectedTarget && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Regenerate with AI clicked")
                            handleRegenerate()
                          }}
                          disabled={isGeneratingDraft}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingDraft ? "Generating..." : "Regenerate with AI"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Regenerate with Comments clicked")
                            setShowCommentDialog(true)
                          }}
                          disabled={isGeneratingDraft}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Regenerate with Comments
                        </Button>
                      </div>
                    )}

                    {showRegenerateInput && (
                      <div className="space-y-2 pt-4 border-t border-border mt-4">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                          Provide guidance for regeneration
                        </label>
                        <Textarea
                          value={regenerateComments}
                          onChange={(e) => setRegenerateComments(e.target.value)}
                          placeholder="E.g., Make it more casual, add a specific reference to their recent acquisition, focus on cost savings..."
                          className="w-full min-h-[80px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleRegenerateWithComments}
                            disabled={isRegenerating || !regenerateComments.trim()}
                            className="bg-primary"
                          >
                            {isRegenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Regenerate
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowRegenerateInput(false)
                              setRegenerateComments("")
                            }}
                            className="bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Why this target?</h3>
                        <p className="text-sm text-muted-foreground">{selectedTarget.aiRationale}</p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="dossier" className="space-y-4 mt-4">
                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-3 mb-4">
                      <Users className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Business Persona</h3>
                        <Badge variant="secondary" className="mb-3">
                          {selectedTarget.businessPersona?.type || "Unknown"}
                        </Badge>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedTarget.businessPersona?.description || "No description available"}
                        </p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Decision Style
                            </label>
                            <p className="text-sm text-foreground mt-1">
                              {selectedTarget.businessPersona?.decisionStyle || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Communication Preference
                            </label>
                            <p className="text-sm text-foreground mt-1">
                              {selectedTarget.businessPersona?.communicationPreference || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-3">Self-Funded Plans Under Management</h3>
                        <div className="space-y-3">
                          {selectedTarget.dossier?.selfFundedPlans &&
                          selectedTarget.dossier.selfFundedPlans.length > 0 ? (
                            selectedTarget.dossier.selfFundedPlans.map((plan, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-muted/40 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium text-foreground">{plan.clientName}</h4>
                                    <p className="text-sm text-muted-foreground mt-0.5">{plan.planType}</p>
                                  </div>
                                  <Badge variant="outline" className="shrink-0">
                                    {plan.enrollmentSize} lives
                                  </Badge>
                                </div>
                                {plan.renewalDate && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span>Renewal: {plan.renewalDate}</span>
                                  </div>
                                )}
                                {plan.upcomingChanges && (
                                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm">
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">Note: </span>
                                    <span className="text-foreground">{plan.upcomingChanges}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No self-funded plans data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-3 mb-4">
                      <Building2 className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-3">Company Intelligence</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Company Size
                            </label>
                            <p className="text-sm text-foreground mt-1">
                              {selectedTarget.dossier?.companySize || "Not available"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Industry
                            </label>
                            <p className="text-sm text-foreground mt-1">
                              {selectedTarget.dossier?.industry || "Not available"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Opportunity Score
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                style={{ width: `${selectedTarget.dossier?.opportunityScore || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {selectedTarget.dossier?.opportunityScore || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
                        <ul className="space-y-2">
                          {selectedTarget.dossier?.recentActivity &&
                          selectedTarget.dossier.recentActivity.length > 0 ? (
                            selectedTarget.dossier.recentActivity.map((activity, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span>{activity}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No recent activity</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-3">Identified Pain Points</h3>
                        <ul className="space-y-2">
                          {selectedTarget.dossier?.painPoints && selectedTarget.dossier.painPoints.length > 0 ? (
                            selectedTarget.dossier.painPoints.map((pain, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span>{pain}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No pain points identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <PauseDurationModal
          open={showPauseDurationModal}
          onOpenChange={setShowPauseDurationModal}
          selectedDuration={selectedPauseDuration}
          onDurationChange={setSelectedPauseDuration}
          onConfirm={handlePauseOutreach}
        />

        <ThresholdWarningModal
          open={showThresholdWarning}
          onKeepPaused={handleThresholdKeepPaused}
          onResume={handleThresholdResume}
        />
      </div>
      <div className="border-t border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        Build: v249 | Time: {new Date().toISOString()} | Backend: ...7752
      </div>
    </div>
  )
}
