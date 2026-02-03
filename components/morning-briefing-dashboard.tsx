/**
 * COMPONENT: MorningBriefingDashboard (REFACTORED)
 * 
 * This is the ORCHESTRATOR component.
 * Role: State management, data fetching, and coordination.
 * 
 * Decomposition:
 * - QueueSidebar: Navigation + Selection
 * - CandidateDossierView: Static read-only identity (not used here, used in Full Dossier tab)
 * - DraftWorkspace: Draft editing + regeneration
 * - ActionFooter: THE MUTATION CHOKE POINT
 * 
 * Hydration Strategy: LAZY INITIALIZATION
 * - draftCache is AUTHORITATIVE, not reactive
 * - When selecting a target: Check cache first, fallback to embedded draft
 * - NEVER sync props to state via useEffect
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Undo2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Decomposed Components
import { QueueSidebar } from "@/components/briefing/QueueSidebar"
import { DraftWorkspace } from "@/components/briefing/DraftWorkspace"
import { ActionFooter } from "@/components/briefing/ActionFooter"
import { SignalFeed, type SignalsProposal } from "@/components/briefing/SignalFeed"
import { getApiBaseUrl } from "@/lib/api/client"

// Existing Components (for Full Dossier tab)
import { DossierView } from "@/components/dossier-view"
import { CandidateIdentityHeader } from "@/components/candidate-identity-header"
import { ContactNotes } from "@/components/contact-notes"
import { PauseDurationModal } from "@/components/pause-duration-modal"
import { ThresholdWarningModal } from "@/components/threshold-warning-modal"

// API
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

import {
  getMorningQueue,
  regenerateDraft,
  regenerateDraftWithFeedback,
  type MorningQueueTarget,
} from "@/lib/api/morning-queue"

// Types
type Target = MorningQueueTarget

interface Draft {
  subject: string
  body: string
  richAssetHtml?: string  // Pre-made marketing HTML block
}

interface Props {
  onNavigateToSettings?: (tab?: string) => void
}

export function MorningBriefingDashboard({ onNavigateToSettings }: Props) {
  // ===================================
  // STATE: Core Data
  // ===================================
  const [targets, setTargets] = useState<Target[]>([])
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ===================================
  // STATE: Draft Cache (AUTHORITATIVE)
  // ===================================
  // This is the single source of truth for drafts.
  // Populated via LAZY INITIALIZATION, not useEffect sync.
  const [draftCache, setDraftCache] = useState<Record<string, Draft>>({})

  // ===================================
  // STATE: UI State
  // ===================================
  const [dismissedTargets, setDismissedTargets] = useState<Set<string>>(new Set())
  const [pausedTargets, setPausedTargets] = useState<Map<string, string>>(new Map())
  const [activeTab, setActiveTab] = useState<"draft" | "dossier">("draft")
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)

  // ===================================
  // STATE: Outreach Status
  // ===================================
  const [outlookConnected, setOutlookConnected] = useState<boolean>(false)
  const [outreachStatus, setOutreachStatus] = useState<"active" | "paused">("paused")
  const [showThresholdWarning, setShowThresholdWarning] = useState(false)
  const [showPauseDurationModal, setShowPauseDurationModal] = useState(false)
  const [selectedPauseDuration, setSelectedPauseDuration] = useState<string>("manual")

  // ===================================
  // STATE: Full Dossier (for Full Dossier tab)
  // ===================================
  const [candidateDossier, setCandidateDossier] = useState<CandidateDossier | null>(null)
  const [isLoadingDossier, setIsLoadingDossier] = useState(false)
  const [dossierError, setDossierError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ===================================
  // STATE: Signals Proposal (Week 2 - ISOLATED)
  // ===================================
  const [signalsProposal, setSignalsProposal] = useState<SignalsProposal | null>(null)
  const [isLoadingSignals, setIsLoadingSignals] = useState(false)

  // ===================================
  // LAZY INITIALIZATION: Get Draft for Target
  // ===================================
  // This is the approved hydration pattern.
  // Check cache first, fallback to embedded draft.
  const getDraftForTarget = useCallback((targetId: string): Draft | null => {
    // 1. Check cache first (AUTHORITATIVE)
    if (draftCache[targetId]) {
      return draftCache[targetId]
    }

    // 2. Fallback to embedded draft from target
    const target = targets.find(t => t.id === targetId)
    if (target?.draft) {
      return {
        subject: target.draft.subject,
        body: target.draft.body
      }
    }

    // 3. No draft available
    return null
  }, [draftCache, targets])

  // ===================================
  // EFFECTS: Initial Load
  // ===================================
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

  // ===================================
  // ISOLATED EFFECT: Signals Proposal Fetch
  // CRITICAL: Must NOT block queue or draft hydration
  // Fails silently if endpoint is unavailable
  // ===================================
  useEffect(() => {
    if (!selectedTarget?.id) {
      setSignalsProposal(null)
      return
    }

    // Non-blocking fetch with fail-safe
    const fetchSignalsProposal = async () => {
      setIsLoadingSignals(true)
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/signals/proposal?candidate_id=${selectedTarget.id}`,
          { cache: 'no-store' }
        )

        if (response.ok) {
          const data = await response.json()
          setSignalsProposal(data)
        } else {
          // Fail silently - signals are optional enrichment
          setSignalsProposal(null)
        }
      } catch (error) {
        // Fail silently - do NOT block dashboard
        console.log('[SignalFeed] Fetch failed (non-blocking):', error)
        setSignalsProposal(null)
      } finally {
        setIsLoadingSignals(false)
      }
    }

    // Fire and forget - do NOT await in effect
    fetchSignalsProposal()
  }, [selectedTarget?.id])

  // ===================================
  // DATA FETCHING
  // ===================================
  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log("[Morning Briefing] Fetching live data from backend...")

      // LIVE DATABASE FETCH - Replaces mock data injection
      const data = await getMorningQueue()

      if (!data || data.length === 0) {
        console.warn("[Morning Briefing] No targets returned from queue")
        setTargets([])
        return
      }

      console.log(`[Morning Briefing] Loaded ${data.length} targets from database`)
      setTargets(data)

      // LAZY INIT: Pre-populate cache from initial load
      // This is initialization, not reactive sync
      const initialCache: Record<string, Draft> = {}
      data.forEach(t => {
        if (t.draft) {
          initialCache[t.id] = {
            subject: t.draft.subject,
            body: t.draft.body,
            richAssetHtml: t.draft.richAssetHtml
          }
        }
      })
      setDraftCache(initialCache)

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

  const checkOutreachStatus = async () => {
    try {
      const status = await getOutreachStatus()
      setOutlookConnected(status.outlook_connected)

      if (status.outlook_connected && status.status === "active") {
        setOutreachStatus("active")
      } else {
        setOutreachStatus("paused")
      }

      if (status.warning_due) {
        setShowThresholdWarning(true)
      }
    } catch (error) {
      console.error("[v0] Failed to check outreach status:", error)
      setOutreachStatus("paused")
    }
  }

  // Fetch full dossier when tab switches to dossier
  const fetchCandidateDossier = useCallback(async (targetId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoadingDossier(true)
    setDossierError(null)
    setCandidateDossier(null)

    try {
      const data = await getCandidateDossier(targetId, controller.signal)
      if (!controller.signal.aborted) {
        setCandidateDossier(data)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setDossierError(err.message)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingDossier(false)
      }
    }
  }, [])

  // ===================================
  // HANDLERS: Selection
  // ===================================
  const handleSelectTarget = useCallback((target: Target) => {
    setSelectedTarget(target)

    // Fetch full dossier if on dossier tab
    if (activeTab === "dossier") {
      fetchCandidateDossier(target.id)
    }
  }, [activeTab, fetchCandidateDossier])

  // ===================================
  // HANDLERS: Mutations (via ActionFooter)
  // ===================================
  const handleApprove = async (targetId: string) => {
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: "sending" } : t))

    try {
      await approveTarget(targetId)
      toast({ title: "Draft sent successfully", variant: "default" })
      setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: "sent" } : t))
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to approve target:", error)
      toast({ title: "Failed to approve draft", variant: "destructive" })
      setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: "failed" } : t))
    }
  }

  const handlePause = async (targetId: string) => {
    setPausedTargets(prev => new Map(prev).set(targetId, "user_paused"))

    try {
      await pauseTarget(targetId, "user_paused")
      toast({ title: "Target paused", variant: "default" })
    } catch (error) {
      console.error("[v0] Failed to pause target:", error)
      toast({ title: "Failed to pause target", variant: "destructive" })
      setPausedTargets(prev => {
        const next = new Map(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  const handleUnpause = (targetId: string) => {
    setPausedTargets(prev => {
      const next = new Map(prev)
      next.delete(targetId)
      return next
    })
  }

  const handleDismiss = async (targetId: string) => {
    setDismissedTargets(prev => new Set(prev).add(targetId))

    try {
      await dismissTarget(targetId, "bad_fit")
      toast({ title: "Target dismissed", variant: "default" })
      advanceToNextTarget(targetId)
    } catch (error) {
      console.error("[v0] Failed to dismiss target:", error)
      toast({ title: "Failed to dismiss target", variant: "destructive" })
      setDismissedTargets(prev => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  const handleUndoDismiss = (targetId: string) => {
    setDismissedTargets(prev => {
      const next = new Set(prev)
      next.delete(targetId)
      return next
    })
  }

  // ===================================
  // HANDLERS: Draft Operations
  // ===================================
  const handleSaveDraft = async (subject: string, body: string) => {
    if (!selectedTarget) return

    const oldDraft = draftCache[selectedTarget.id]

    // Optimistic update
    setDraftCache(prev => ({
      ...prev,
      [selectedTarget.id]: { subject, body }
    }))

    try {
      await saveDraft(selectedTarget.id, subject, body)
      toast({ title: "Draft Saved", description: "Your changes have been saved." })
    } catch (error) {
      console.error("[v0] Failed to save draft:", error)
      // Revert on error
      if (oldDraft) {
        setDraftCache(prev => ({ ...prev, [selectedTarget.id]: oldDraft }))
      }
      toast({ title: "Save Failed", description: "Could not save draft.", variant: "destructive" })
      throw error // Re-throw so DraftWorkspace knows it failed
    }
  }

  const handleRegenerate = async () => {
    if (!selectedTarget) return

    setIsGeneratingDraft(true)
    try {
      const result = await regenerateDraft(selectedTarget)
      setDraftCache(prev => ({
        ...prev,
        [selectedTarget.id]: result
      }))
      toast({ title: "Draft Regenerated", description: "Your draft has been regenerated with AI." })
    } catch (error) {
      console.error("[v0] Regenerate failed:", error)
      toast({ title: "Regeneration Failed", variant: "destructive" })
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const handleRegenerateWithFeedback = async (comments: string) => {
    if (!selectedTarget) return

    const currentDraft = getDraftForTarget(selectedTarget.id)
    if (!currentDraft) {
      toast({ title: "No draft to refine", variant: "destructive" })
      return
    }

    setIsGeneratingDraft(true)
    try {
      const result = await regenerateDraftWithFeedback(selectedTarget, currentDraft, comments)
      setDraftCache(prev => ({
        ...prev,
        [selectedTarget.id]: result
      }))
      toast({ title: "Draft Updated", description: "Your feedback has been incorporated." })
    } catch (error) {
      console.error("[v0] Regenerate with feedback failed:", error)
      toast({ title: "Update Failed", variant: "destructive" })
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  // ===================================
  // HANDLER: Apply Signal Proposal (Orchestrator Pattern)
  // ===================================
  const handleApplySignal = (proposal: SignalsProposal) => {
    if (!selectedTarget || !proposal.proposed_mutations) return

    const targetId = selectedTarget.id
    const currentDraft = getDraftForTarget(targetId)
    const mutations = proposal.proposed_mutations

    // Clean/Dirty Check: If draft has been edited, confirm overwrite
    const isDirty = currentDraft && draftCache[targetId] && (
      currentDraft.subject !== targets.find(t => t.id === targetId)?.draft?.subject ||
      currentDraft.body !== targets.find(t => t.id === targetId)?.draft?.body
    )

    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved edits to this draft. Apply the signal proposal anyway? This will overwrite your changes."
      )
      if (!confirmed) return
    }

    // Apply mutations to draft cache
    const newDraft: Draft = {
      subject: mutations.subject || currentDraft?.subject || "",
      body: mutations.body || currentDraft?.body || ""
    }

    setDraftCache(prev => ({
      ...prev,
      [targetId]: newDraft
    }))

    // Telemetry
    console.log(`[APPLY_SIGNAL] Proposal ${proposal.id} applied to target ${targetId}`)
    toast({
      title: "Signal Applied",
      description: "Draft updated with signal proposal."
    })
  }

  // ===================================
  // HANDLERS: Outreach Control
  // ===================================
  const handlePauseOutreach = async () => {
    try {
      await pauseOutreach(selectedPauseDuration as any)
      setOutreachStatus("paused")
      setShowPauseDurationModal(false)
      toast({ title: `Outreach paused`, variant: "default" })
    } catch (error) {
      toast({ title: "Failed to pause outreach", variant: "destructive" })
    }
  }

  const handleResumeOutreach = async () => {
    try {
      await resumeOutreach()
      setOutreachStatus("active")
      setShowThresholdWarning(false)
      toast({ title: "Outreach resumed", variant: "default" })
    } catch (error) {
      toast({ title: "Failed to resume outreach", variant: "destructive" })
    }
  }

  const handleConnectOutlook = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings("integrations")
    }
  }

  // ===================================
  // HELPERS
  // ===================================
  const advanceToNextTarget = (currentTargetId: string) => {
    const activeTargets = targets.filter(t => !dismissedTargets.has(t.id))
    const nextUnsent = activeTargets.find(t =>
      t.id !== currentTargetId &&
      !['sent', 'sending', 'failed', 'replied', 'ooo', 'bounced'].includes(t.status || '')
    )
    if (nextUnsent) {
      setSelectedTarget(nextUnsent)
    } else {
      const next = activeTargets.find(t => t.id !== currentTargetId)
      if (next) setSelectedTarget(next)
    }
  }

  // ===================================
  // COMPUTED VALUES
  // ===================================
  const currentDraft = selectedTarget ? getDraftForTarget(selectedTarget.id) : null

  // ===================================
  // RENDER: Loading State
  // ===================================
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading briefing...</p>
      </div>
    )
  }

  // ===================================
  // RENDER: Empty State  
  // ===================================
  if (targets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No targets available for today's briefing.</p>
      </div>
    )
  }

  // ===================================
  // RENDER: Main Layout
  // ===================================
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full gap-6">
        {/* LEFT PANEL: Queue Sidebar */}
        <QueueSidebar
          targets={targets}
          selectedId={selectedTarget?.id || null}
          dismissedIds={dismissedTargets}
          pausedIds={pausedTargets}
          outlookConnected={outlookConnected}
          outreachStatus={outreachStatus}
          onSelect={handleSelectTarget}
          onConnectOutlook={handleConnectOutlook}
          onPauseOutreach={() => setShowPauseDurationModal(true)}
          onResumeOutreach={handleResumeOutreach}
        />

        {/* RIGHT PANEL: Draft Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTarget && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as "draft" | "dossier")
                  if (v === "dossier" && selectedTarget) {
                    fetchCandidateDossier(selectedTarget.id)
                  }
                }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* PERMANENT IDENTITY HEADER */}
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

                {/* TAB NAVIGATION */}
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

                {/* TAB CONTENT */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
                  <TabsContent value="draft" className="space-y-6 m-0 focus-visible:ring-0">
                    {/* ACTION FOOTER (THE MUTATION CHOKE POINT) */}
                    <ActionFooter
                      targetId={selectedTarget.id}
                      isPaused={pausedTargets.has(selectedTarget.id)}
                      isDismissed={dismissedTargets.has(selectedTarget.id)}
                      outlookConnected={outlookConnected}
                      outreachActive={outreachStatus === "active"}
                      onApprove={handleApprove}
                      onPause={handlePause}
                      onUnpause={handleUnpause}
                      onDismiss={handleDismiss}
                      onUndoDismiss={handleUndoDismiss}
                    />

                    {/* DRAFT WORKSPACE (Primary Focus) */}
                    <DraftWorkspace
                      draft={currentDraft}
                      isGenerating={isGeneratingDraft}
                      onSave={handleSaveDraft}
                      onRegenerate={handleRegenerate}
                      onRegenerateWithFeedback={handleRegenerateWithFeedback}
                    />

                    {/* SIGNAL FEED (Week 2 - Read-Only, Below Draft) */}
                    <SignalFeed
                      proposal={signalsProposal}
                      isLoading={isLoadingSignals}
                      onApply={handleApplySignal}
                    />

                    {/* CONTACT NOTES */}
                    <ContactNotes
                      contactName={selectedTarget.contactName || "Contact"}
                      contactId={selectedTarget.id}
                    />

                    {/* AI RATIONALE */}
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
                        if (selectedTarget) fetchCandidateDossier(selectedTarget.id)
                      }}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>

        {/* MODALS */}
        <PauseDurationModal
          open={showPauseDurationModal}
          onOpenChange={setShowPauseDurationModal}
          selectedDuration={selectedPauseDuration}
          onDurationChange={setSelectedPauseDuration}
          onConfirm={handlePauseOutreach}
        />

        <ThresholdWarningModal
          open={showThresholdWarning}
          onKeepPaused={() => setShowThresholdWarning(false)}
          onResume={handleResumeOutreach}
        />
      </div>

      {/* BUILD FOOTER */}
      <div className="border-t border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        Build: v252 (Decomposed) | Time: {new Date().toISOString()} | Backend: ...7752
      </div>
    </div>
  )
}
