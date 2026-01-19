"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactNotes } from "@/components/contact-notes"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
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
  Reply,
} from "lucide-react"
import {
  approveTarget,
  dismissTarget,
  saveDraft,
  pauseTarget,
  getOutreachStatus,
  resumeOutreach,
  pauseOutreach,
} from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { PauseDurationModal } from "@/components/pause-duration-modal"
import { ThresholdWarningModal } from "@/components/threshold-warning-modal"
import {
  getMorningQueue,
  generateDraftForTarget,
  regenerateDraft,
  regenerateDraftWithFeedback,
} from "@/lib/api/morning-queue"
import { createBrowserClient } from "@supabase/ssr" // Import Supabase client

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
  status: string
  created_at: string
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
  async function checkExistingDraft(targetId: string): Promise<{ llm_email_subject?: string; llm_email_body?: string }> {
    if (process.env.NODE_ENV === "development") return {}

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await supabase
      .from("target_brokers")
      .select("llm_email_subject, llm_email_body")
      .eq("id", targetId)
      .single()

    if (error) {
      console.error("[v0] Failed to check existing draft:", error)
      return {}
    }

    return data || {}
  }
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false) // Added for the comment dialog state
  const [draftError, setDraftError] = useState<string | null>(null) // Adding state for API error messages

  useEffect(() => {
    loadData()
    checkOutreachStatus()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      checkOutreachStatus()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedTarget) return

    const loadDraftForTarget = async () => {
      const dossier_id = selectedTarget.id
      if (!dossier_id) return

      // Check if already in cache
      if (draftCache[dossier_id]) {
        console.log("[v0] Draft already in cache for:", dossier_id)
        setEditedSubject(draftCache[dossier_id].subject)
        setEditedBody(draftCache[dossier_id].body)
        return
      }

      // Load from database
      console.log("[v0] Loading draft from database for:", dossier_id)

      // MOCK MODE: Bypass Supabase
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Mock Mode: Using embedded draft from target object")
        if (selectedTarget.draft) {
          setDraftCache((prev) => ({
            ...prev,
            [dossier_id]: selectedTarget.draft!,
          }))
          setEditedSubject(selectedTarget.draft.subject)
          setEditedBody(selectedTarget.draft.body)
        }
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("target_brokers")
        .select("llm_email_subject, llm_email_body")
        .eq("id", dossier_id)
        .single()

      if (error) {
        console.error("[v0] Failed to load draft from database:", error)
        return
      }

      if (data?.llm_email_subject && data?.llm_email_body) {
        console.log("[v0] ✅ Draft loaded from database")
        const draft = {
          subject: data.llm_email_subject,
          body: data.llm_email_body,
        }

        setDraftCache((prev) => ({
          ...prev,
          [dossier_id]: draft,
        }))

        setEditedSubject(draft.subject)
        setEditedBody(draft.body)
      } else {
        console.log("[v0] No draft found in database for:", dossier_id)
      }
    }

    loadDraftForTarget()
  }, [selectedTarget])

  // Load drafts for all active targets on initial load and when activeTargets changes
  useEffect(() => {
    const loadDraftsFromSupabase = async () => {
      const activeTargets = targets.filter((target) => !dismissedTargets.has(target.id))

      if (!activeTargets || activeTargets.length === 0) return

      console.log("[v0] Loading drafts for", activeTargets.length, "targets")

      // MOCK MODE: Bypass Supabase
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Mock Mode: Pre-loading embedded drafts into cache")
        const newCache: Record<string, { subject: string; body: string }> = {}
        activeTargets.forEach((t) => {
          if (t.draft) {
            newCache[t.id] = t.draft
          }
        })
        setDraftCache((prev) => ({ ...prev, ...newCache }))
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      try {
        const targetIds = activeTargets.map((t) => t.id)

        const { data, error } = await supabase
          .from("target_brokers")
          .select("id, llm_email_subject, llm_email_body")
          .in("id", targetIds)

        if (error) {
          console.error("[v0] ❌ Error loading drafts:", error)
          setDraftError(`Database error: ${error.message}`)
          return
        }

        if (!data || data.length === 0) {
          console.log("[v0] No drafts found in database for these targets")
          return
        }

        console.log(`[v0] Loaded ${data.length} drafts from database`)

        const newCache: Record<string, { subject: string; body: string }> = {}

        data.forEach((row) => {
          if (row.llm_email_subject && row.llm_email_body) {
            newCache[row.id] = {
              subject: row.llm_email_subject,
              body: row.llm_email_body,
            }
            console.log(`[v0] Draft found for ${row.id}:`, {
              subjectLength: row.llm_email_subject.length,
              bodyLength: row.llm_email_body.length,
            })
          } else {
            console.log(`[v0] No draft content for ${row.id}`)
          }
        })

        setDraftCache((prev) => ({ ...prev, ...newCache }))

        // Set editedSubject/editedBody for the CURRENTLY selected target
        if (selectedTarget && newCache[selectedTarget.id]) {
          setEditedSubject(newCache[selectedTarget.id].subject)
          setEditedBody(newCache[selectedTarget.id].body)
          console.log(`[v0] Loaded draft for selected target: ${selectedTarget.id}`)
          setDraftError(null)
        }
      } catch (error) {
        console.error("[v0] ❌ Exception while loading drafts:", error)
        setDraftError(`Failed to load drafts: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    loadDraftsFromSupabase()
  }, [targets, dismissedTargets, selectedTarget]) // Use source data instead of derived activeTargets

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

      // Use the authoritative status from backend
      setOutlookConnected(status.outlook_connected)

      if (status.outlook_connected && status.status === "active") {
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
      toast({ title: `Failed to load briefing: ${error}`, variant: "destructive" })
      setTargets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (targetId: string) => {
    // Optimistic Update: Set status to sending immediately
    setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "sending" } : t)))

    try {
      await approveTarget(targetId)
      toast({ title: "Draft sent successfully", variant: "default" })
      // Update to Sent
      setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "sent" } : t)))
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to approve target:", error)
      toast({ title: "Failed to approve draft", variant: "destructive" })
      setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "failed" } : t)))
    }
  }

  const handleDismiss = async (targetId: string) => {
    setDismissedTargets((prev) => new Set(prev).add(targetId))

    try {
      await dismissTarget(targetId, "bad_fit")
      toast({ title: "Target dismissed", variant: "default" })
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to dismiss target:", error)
      toast({ title: "Failed to dismiss target", variant: "destructive" })
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
      toast({ title: "Target paused", variant: "default" })
    } catch (error) {
      console.error("[v0] Failed to pause target:", error)
      toast({ title: "Failed to pause target", variant: "destructive" })
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
      toast({
        title: `Outreach paused ${selectedPauseDuration === "manual" ? "until resumed" : `for ${selectedPauseDuration}`}`,
        variant: "default"
      })
    } catch (error) {
      toast({ title: "Failed to pause outreach", variant: "destructive" })
      console.error(error)
    }
  }

  const handleResumeOutreach = async () => {
    try {
      await resumeOutreach()
      setOutreachStatus("active")
      setPausedAt(null)
      setShowThresholdWarning(false)
      toast({ title: "Outreach resumed", variant: "default" })
    } catch (error) {
      toast({ title: "Failed to resume outreach", variant: "destructive" })
      console.error(error)
    }
  }

  const handleThresholdKeepPaused = () => {
    setShowThresholdWarning(false)
    toast({ title: "Outreach remains paused", variant: "default" })
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

  const handleRegenerateDraft = async () => {
    if (!selectedTarget) return

    setIsGeneratingDraft(true)
    setDraftError(null) // Clear previous errors

    try {
      const result = await regenerateDraft(selectedTarget)

      setDraftCache((prev) => ({
        ...prev,
        [selectedTarget.id]: result,
      }))

      setEditedSubject(result.subject)
      setEditedBody(result.body)

      setShowRegenerateInput(false)

      toast({
        title: "Draft Regenerated",
        description: "Your draft has been regenerated with AI.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] Regenerate failed:", errorMessage)
      setDraftError(errorMessage)
      toast({
        title: "Regeneration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const handleRegenerateWithFeedback = async () => {
    if (!selectedTarget || !regenerateComments.trim()) return

    const currentDraft = draftCache[selectedTarget.id]

    if (!currentDraft) {
      toast({
        title: "No Current Draft",
        description: "Generate a draft first before providing feedback.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingDraft(true)
    setDraftError(null) // Clear previous errors

    try {
      const result = await regenerateDraftWithFeedback(selectedTarget, currentDraft, regenerateComments)

      setDraftCache((prev) => ({
        ...prev,
        [selectedTarget.id]: result,
      }))

      setEditedSubject(result.subject)
      setEditedBody(result.body)

      setRegenerateComments("")
      setShowRegenerateInput(false)

      toast({
        title: "Draft Updated",
        description: "Your feedback has been incorporated.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] Regenerate with feedback failed:", errorMessage)
      setDraftError(errorMessage)
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDraft(false)
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
    // We need to advance based on the SORTED list, not raw targets
    const currentIndex = activeTargets.findIndex((t) => t.id === currentTargetId)

    // Safety check if current target isn't found
    if (currentIndex === -1) {
      if (activeTargets.length > 0) setSelectedTarget(activeTargets[0])
      return
    }

    // Find next actionable target (skip processed ones if possible, or just next in list)
    // Actually, processed items sink to bottom. So picking sorting[0] is correct logic IF we remove current from 'Actionable'.
    // But current is still in list.
    // If we just sorted, the processed item is now at bottom.
    // So `activeTargets[0]` should be the NEXT unsent item (since processed one moved).
    // EXCEPT: React state update hasn't triggered sort re-render yet within this execution context.

    // Simple logic: Find next Unsent target in original array or just pick next index?
    // Since sorting creates a new array order, index logic is tricky.
    // Better: Pick the first target in `activeTargets` that is NOT the current one and is UNSENT.
    // If all are sent, pick first sent.

    const nextUnsent = activeTargets.find(t => t.id !== currentTargetId && !['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(t.status || ''))
    if (nextUnsent) {
      setSelectedTarget(nextUnsent)
    } else {
      // No unsent left. Stay on current or pick first.
      const next = activeTargets.find(t => t.id !== currentTargetId)
      if (next) setSelectedTarget(next)
    }
  }

  const handleConfirmPause = async (pauseInfo: PauseInfo) => {
    if (selectedTarget) {
      setPausedTargets((prev) => new Map(prev).set(selectedTarget.id, pauseInfo.type))

      try {
        await pauseTarget(selectedTarget.id, pauseInfo.type, pauseInfo.date)
        toast({ title: "Target paused", variant: "default" })
      } catch (error) {
        console.error("[v0] Failed to pause target:", error)
        toast({ title: "Failed to pause target", variant: "destructive" })
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

  // Sorting Logic: Unsent First, Processed Last
  const activeTargets = targets.filter((target) => !dismissedTargets.has(target.id)).sort((a, b) => {
    const isProcessedA = ['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(a.status || '')
    const isProcessedB = ['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(b.status || '')

    if (isProcessedA === isProcessedB) return 0 // Maintain original order
    return isProcessedA ? 1 : -1 // Move processed to bottom
  })

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
              {/* Status Indicator */}
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
            {activeTargets.map((target) => {
              // Status Derived Values
              const status = target.status
              const isSending = status === "sending"
              const isSent = status === "sent"
              const isFailed = status === "failed"
              const isReplied = status === "replied"
              const isOOO = status === "ooo"
              const isBounced = status === "bounced"

              // Opacity & Overlay styles
              // Contract: Sent/Replied/OOO/Bounced = 60%, Failed = 80%, Candidate = 100%, Sending = 75%
              const cardOpacity = isSending
                ? "opacity-75"
                : (isSent || isReplied || isOOO || isBounced)
                  ? "opacity-60"
                  : isFailed
                    ? "opacity-80"
                    : "opacity-100"

              const textColor = (isSent || isReplied || isOOO || isBounced) ? "text-muted-foreground" : "text-foreground"

              return (
                <Card
                  key={target.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all border relative overflow-hidden",
                    selectedTarget?.id === target.id
                      ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20"
                      : "border-border hover:border-blue-500/50 hover:bg-accent/50",
                    cardOpacity,
                    // Contract: Failed border must be border-l-4
                    isFailed && "border-l-4 border-l-destructive"
                  )}
                  onClick={() => handleSelectTarget(target)}
                >
                  {isSending && (
                    <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-end pr-4 pointer-events-none">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage src={target.profileImage} />
                      <AvatarFallback className="bg-blue-500 text-white font-semibold">
                        {getInitials(target.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("font-medium truncate", textColor)}>{target.name}</h3>
                          <p className={cn("text-sm truncate", textColor || "text-muted-foreground")}>{target.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* STATES BADGES - MUTUALLY EXCLUSIVE */}
                          {/* Contract: One badge at a time for processed states */}

                          {isSent && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-2 py-0.5">
                              Sent
                            </Badge>
                          )}

                          {isReplied && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs px-2 py-0.5 gap-1">
                              <Reply className="w-3 h-3" />
                              Replied
                            </Badge>
                          )}

                          {isOOO && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-2 py-0.5">
                              OOO
                            </Badge>
                          )}

                          {isBounced && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-2 py-0.5 gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Bounced
                            </Badge>
                          )}

                          {isFailed && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-2 py-0.5">
                              Failed
                            </Badge>
                          )}

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

                          {/* Only show confidence if not processed/failed */}
                          {!isSent && !isFailed && !isReplied && !isOOO && !isBounced && (
                            <div className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-foreground">{target.confidence}%</span>
                            </div>
                          )}

                        </div>
                      </div>
                      <div className={cn("flex items-center gap-1 mt-1 text-xs text-muted-foreground", textColor)}>
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
              )
            })}
          </div>
        </div>

        {/* Right Panel - Draft Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTarget && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <Card className="p-6 bg-card/60">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-border">
                      <AvatarImage src={selectedTarget.profileImage} />
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
                        {(() => {
                          const rawUrl = selectedTarget.linkedinUrl
                          if (!rawUrl) {
                            return (
                              <span className="flex items-center gap-1.5 text-muted-foreground cursor-not-allowed opacity-70">
                                <Linkedin className="w-4 h-4" />
                                <span className="text-xs">(No LinkedIn Available)</span>
                              </span>
                            )
                          }

                          const href = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`

                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )
                        })()}
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
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draft" | "dossier")} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="draft"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Review Draft
                  </TabsTrigger>
                  <TabsTrigger
                    value="dossier"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Full Dossier
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="draft" className="space-y-4">
                  <Card className="p-6">


                    {isGeneratingDraft && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3 text-muted-foreground">Generating draft...</p>
                      </div>
                    )}

                    {!isGeneratingDraft && selectedTarget && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">SUBJECT LINE</h3>
                            <div className="flex gap-2">
                              {isEditingEmail ? (
                                <>
                                  <Button onClick={handleSaveEdit}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </Button>
                                  <Button variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Email
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerateDraft}
                                    disabled={isRegenerating || isGeneratingDraft}
                                  >
                                    {isRegenerating || isGeneratingDraft ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Regenerate with AI (v2)
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCommentDialog(true)}
                                    disabled={isRegenerating || isGeneratingDraft}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Regenerate with Comments
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditingEmail ? (
                            <>
                              <Input
                                value={editedSubject}
                                onChange={(e) => setEditedSubject(e.target.value)}
                                placeholder="Email subject..."
                                className="mb-4"
                              />
                              <Textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                placeholder="Email body..."
                                className="min-h-[300px] font-mono text-sm"
                              />
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-semibold mb-6">{editedSubject}</div>
                              <div className="prose prose-sm max-w-none whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
                                {editedBody}
                              </div>
                            </>
                          )}
                        </div>
                      </>
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
      </div >

      {/* Comment Dialog */}
      {
        showCommentDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[500px] p-6">
              <h3 className="text-lg font-semibold mb-4">Provide Regeneration Feedback</h3>
              <Textarea
                value={regenerateComments}
                onChange={(e) => setRegenerateComments(e.target.value)}
                placeholder="Tell the AI what to change or improve..."
                className="min-h-[120px] mb-4"
              />
              <div className="flex gap-2">
                <Button onClick={handleRegenerateWithFeedback} disabled={!regenerateComments.trim() || isGeneratingDraft}>
                  {isGeneratingDraft ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )
      }

      <div className="border-t border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        Build: v251 | Time: {new Date().toISOString()} | Backend: ...7752
      </div>
    </div >
  )
}
