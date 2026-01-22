"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactNotes } from "@/components/contact-notes"
import { DossierView } from "@/components/dossier-view"
import { CandidateIdentityHeader } from "@/components/candidate-identity-header"
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
  FileText,
} from "lucide-react"
import {
  approveTarget,
  dismissTarget,
  saveDraft,
  pauseTarget,
  getOutreachStatus,
  resumeOutreach,
  pauseOutreach,
  getCandidateDossier,
  type CandidateDossier,
} from "@/lib/api/client"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { PauseDurationModal } from "@/components/pause-duration-modal"
import { ThresholdWarningModal } from "@/components/threshold-warning-modal"
import {
  getMorningQueue,
  generateDraftForTarget,
  regenerateDraft,
  regenerateDraftWithFeedback,
} from "@/lib/api/morning-queue"

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

  // ===================================
  // PHASE 2: SHADOW FETCH STATE
  // ===================================
  const [candidateDossier, setCandidateDossier] = useState<CandidateDossier | null>(null)
  const [isLoadingDossier, setIsLoadingDossier] = useState(false)
  const [dossierError, setDossierError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
    loadDraftForTarget()
  }, [selectedTarget])

  // NEW: Auto-fetch Dossier when selectedTarget changes
  useEffect(() => {
    const loadDossierForTarget = async () => {
      if (!selectedTarget) return

      // Avoid refetching if we already have the correct dossier
      // Note: We might want a more robust check or force refresh strategy later
      if (candidateDossier?.id === selectedTarget.id) return

      try {
        setIsLoadingDossier(true)
        setDossierError(null)
        const dossier = await getCandidateDossier(selectedTarget.id)
        setCandidateDossier(dossier)
      } catch (err) {
        console.error("Failed to fetch dossier:", err)
        setDossierError("Failed to load dossier details.")
        setCandidateDossier(null)
      } finally {
        setIsLoadingDossier(false)
      }
    }

    loadDossierForTarget()
  }, [selectedTarget, candidateDossier?.id])

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
    // 1. Keep Legacy UI Working
    setSelectedTarget(target)

    // 2. Gate 2 Verification: Shadow Fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoadingDossier(true)
    setDossierError(null)
    setCandidateDossier(null) // STRICT REPLACE logic

    getCandidateDossier(target.id, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        console.log("[SHADOW FETCH] Payload:", data)
        setCandidateDossier(data)
        setIsLoadingDossier(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error("[SHADOW FETCH] Error:", err)
        setDossierError(err.message)
        setIsLoadingDossier(false)
      })
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
    <div className="flex h-full flex-col">
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
                          <div className="font-semibold text-foreground/90 truncate">
                            {target.contactName || target.name || "Unknown Contact"}
                          </div>
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
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draft" | "dossier")} className="flex-1 flex flex-col overflow-hidden">
                {/* PERMANENT IDENTITY HEADER (View-Owned) */}
                <div className="px-6 pt-6 pb-2">
                  <CandidateIdentityHeader
                    name={selectedTarget.contactName}
                    title={selectedTarget.title}
                    firm={selectedTarget.company}
                    email={selectedTarget.email}
                    linkedinUrl={selectedTarget.linkedinUrl}
                    confidence={selectedTarget.confidence}
                    profileImage={selectedTarget.profileImage}
                  />
                </div>

                <div className="px-6 pt-4 border-b bg-card">
                  <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                    <TabsTrigger
                      value="draft"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Review Draft
                    </TabsTrigger>
                    <TabsTrigger
                      value="dossier"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Full Dossier
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
                  <TabsContent value="draft" className="space-y-6 m-0 focus-visible:ring-0">
                    {/* 1. Identity Header Removed (Hoisted) */}

                    {/* 2. Actions Block (Moved from Parent) */}
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



                    {/* 4. Draft Editor */}
                    <Card className="p-6">
                      {isGeneratingDraft && (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="ml-3 text-muted-foreground">Generating draft...</p>
                        </div>
                      )}

                      {!isGeneratingDraft && (
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleStartEdit}
                                      className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleRegenerateDraft}
                                      disabled={isRegenerating || isGeneratingDraft}
                                      className="border-violet-500/30 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
                                    >
                                      {isRegenerating || isGeneratingDraft ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                      )}
                                      AI Rewrite
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowRegenerateInput(true)}
                                      disabled={isRegenerating || isGeneratingDraft}
                                      className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                                    >
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Guided Rewrite
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

                            {/* Inline Guided Rewrite Field */}
                            {showRegenerateInput && (
                              <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Guided Rewrite</span>
                                </div>
                                <Textarea
                                  value={regenerateComments}
                                  onChange={(e) => setRegenerateComments(e.target.value)}
                                  placeholder="Tell the AI what to change or improve..."
                                  className="min-h-[80px] mb-3 bg-background"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleRegenerateWithFeedback}
                                    disabled={!regenerateComments.trim() || isGeneratingDraft}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    {isGeneratingDraft ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Regenerate
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setShowRegenerateInput(false)
                                      setRegenerateComments("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </Card>

                    {/* 3. Contact Notes (Moved below Draft Editor) */}
                    <ContactNotes contactName={selectedTarget.contactName || "Contact"} contactId={selectedTarget.id} />

                    {/* 5. AI Rationale */}
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

                  <TabsContent value="dossier" className="space-y-4 m-0 focus-visible:ring-0">

                    <div className="flex justify-end px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("draft")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Back to Draft
                      </Button>
                    </div>
                    <DossierView
                      dossier={candidateDossier}
                      isLoading={isLoadingDossier}
                      error={dossierError}
                      onRetry={() => {
                        if (selectedTarget) handleSelectTarget(selectedTarget)
                      }}
                    />
                  </TabsContent>
                </div>
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

      {/* Popup dialog removed - now inline below email */}

      <div className="border-t border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        Build: v251 | Time: {new Date().toISOString()} | Backend: ...7752
      </div>
    </div >
  )
}
