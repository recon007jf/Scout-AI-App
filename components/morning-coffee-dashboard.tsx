"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfileImage } from "@/lib/hooks/use-profile-image"
import { createBrowserClient } from "@/lib/supabase/client"
import { DossierView } from "./dossier-view"
import RichAssetEditor from "@/components/rich-asset-editor"
import { SignalBadge } from "@/components/signal-badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Coffee,
  CheckCircle2,
  Edit3,
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Building2,
  Mail,
  Linkedin,
  AlertTriangle
} from "lucide-react"

// Types
export interface ProvenanceData {
  source_file: string
  source_row: number
  last_enriched: string
  liveness_status: string
  signal_count: number
  confidence: number // mapped from confidence_score
  // Legacy mappings for display
  clay_linkedin?: string
  serper_linkedin?: string
  linkedin_final?: string
}

export interface TargetInterface {
  id: string
  contactName: string
  title: string
  company: string
  linkedinUrl: string
  email: string
  profileImage?: string
  confidenceScore: number
  aiRationale: string
  status: "pending" | "approved" | "rejected" | "paused" | "failed"

  // Rich Data (Loaded on demand)
  dossier: {
    companySize?: string
    industry?: string
    notes?: string
    opportunityScore?: number
    recentSignals: string[] // Strings for UI
    structuredSignals?: any[] // Raw objects
    painPoints?: string[]
    recentActivity?: string[]
  }

  draft: {
    id?: string
    subject: string
    body: string
    htmlBody?: string
    tone: string
    wordCount: number
  }

  broker: {
    name: string
    firm: string
    title: string
    avatar?: string
    location?: string
    linkedin?: string
    provenance: ProvenanceData
  }
}

function TargetAvatar({ name, company, linkedinUrl, profileImage }: { name: string; company: string; linkedinUrl?: string; profileImage?: string }) {
  const { imageUrl } = useProfileImage(name, company, linkedinUrl)
  const finalImage = profileImage || imageUrl

  return (
    <Avatar className="w-14 h-14 border-2 border-border">
      {finalImage && <AvatarImage src={finalImage} alt={name} referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}

export function MorningCoffeeDashboard() {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("")
  const [targets, setTargets] = useState<TargetInterface[]>([])
  const [activeTab, setActiveTab] = useState<"draft" | "dossier">("draft")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) // For action buttons
  const [isSaving, setIsSaving] = useState(false)
  const [isRichMode, setIsRichMode] = useState(false)
  const [validationError, setValidationError] = useState<string>("")

  const { toast } = useToast()

  useEffect(() => {
    loadTargets()
  }, [])

  // 1. Initial Load (List View) - Keeps payload light
  const loadTargets = async () => {
    console.log("!!! MORNING DASHBOARD: loadTargets CALLED !!!")
    try {
      setIsLoading(true)

      const supabase = createBrowserClient()

      // Fetch ACTIVE + PREVIOUS (POOL candidates for Alpha testing)
      // Including FAILED for visibility as requested
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .in("status", ["QUEUED", "ENRICHED", "DRAFT_READY", "POOL", "FAILED", "BLOCKED_BOUNCE_RISK"])
        .order("updated_at", { ascending: false })
        .limit(20)

      if (error) throw error

      if (!data || data.length === 0) {
        console.warn("No candidates found in database")
        setTargets([])
        return
      }

      const mappedTargets: TargetInterface[] = data.map((t: any) => ({
        id: t.id,
        contactName: t.full_name || "Unknown",
        title: t.title || t.role || "",
        company: t.firm || "",
        linkedinUrl: t.linkedin_url || t.linkedin || "",
        email: t.email || t.work_email || "",
        confidenceScore: 85,
        aiRationale: "High-value target in your pipeline.",
        status: t.status === "FAILED" || t.status === "BLOCKED_BOUNCE_RISK" ? "failed" : "pending",
        profileImage: t.linkedin_image_url || t.profile_image || "",

        // Placeholders until full fetch
        dossier: { recentSignals: [], recentActivity: [] },
        draft: {
          subject: t.draft_subject || "",
          body: t.draft_body || "",
          htmlBody: t.draft_html_body || "",
          tone: "Professional",
          wordCount: 0
        },
        broker: {
          name: t.full_name || "Unknown",
          firm: t.firm || "",
          title: t.title || t.role || "",
          provenance: {
            confidence: 85,
            source_file: "Database",
            source_row: 0,
            last_enriched: t.updated_at || "",
            liveness_status: t.liveness_status || "unknown",
            signal_count: 0
          }
        }
      }))

      setTargets(mappedTargets)
      if (mappedTargets.length > 0) {
        setSelectedTargetId(mappedTargets[0].id)
        // Trigger fetch for first item
        fetchCandidateDetails(mappedTargets[0].id)
      }
    } catch (error) {
      console.error("Failed to load targets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Full Detail Fetch (The "Trust" Fix)
  const fetchCandidateDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/scout/candidates/${id}`)
      if (!res.ok) throw new Error("Failed to fetch details")

      const detail = await res.json()

      console.log(`[DOSSIER_FETCH] ID: ${id} | Provenance Loaded.`)

      // UPDATE STATE (Hard Replace of data fields)
      setTargets(prev => prev.map(t => {
        if (t.id !== id) return t

        // Map API response to Component State
        const signals = detail.signals || []
        const signalSummaries = signals.map((s: any) => `${s.type}: ${s.summary}`)

        return {
          ...t,
          dossier: {
            ...t.dossier,
            recentSignals: signalSummaries,
            structuredSignals: signals,
            notes: detail.dossier?.notes
          },
          draft: {
            id: detail.draft.id,
            subject: detail.draft.subject,
            body: detail.draft.body,
            htmlBody: detail.draft.html_body,
            tone: "Personalized", // Derived or fixed
            wordCount: detail.draft.body ? detail.draft.body.split(" ").length : 0
          },
          broker: {
            ...t.broker,
            provenance: {
              ...detail.provenance,
              confidence: detail.confidence_score
            }
          },
          // Sync status just in case
          status: detail.status === "FAILED" || detail.status.includes("BLOCK") ? "failed" : t.status
        }
      }))
    } catch (e) {
      console.error("Detail fetch failed", e)
    }
  }

  // Effect: Fetch details when selection changes
  // Effect: Fetch details when selection changes
  useEffect(() => {
    setValidationError("") // Clear validation error on switch
    if (selectedTargetId) {
      fetchCandidateDetails(selectedTargetId)
    }
  }, [selectedTargetId])

  // Detect Rich Mode from data
  useEffect(() => {
    if (selectedTargetId) {
      const t = targets.find(t => t.id === selectedTargetId)
      if (t && t.draft.htmlBody) {
        setIsRichMode(true)
      } else {
        setIsRichMode(false)
      }
    }
  }, [selectedTargetId, targets])

  // 4. Draft Text Handlers
  const handleDraftChange = (field: "body" | "subject" | "htmlBody", value: string) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== selectedTargetId) return t
      return {
        ...t,
        draft: {
          ...t.draft,
          [field]: value,
          wordCount: field === "body" ? value.split(" ").length : t.draft.wordCount
        }
      }
    }))
  }

  // 5. Save Draft
  const saveDraft = async () => {
    if (!selectedTargetId) return
    const target = targets.find(t => t.id === selectedTargetId)
    if (!target) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/targets/${selectedTargetId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: target.draft.subject,
          body: target.draft.body,
          html_body: isRichMode ? target.draft.htmlBody : null
        })
      })

      if (!res.ok) throw new Error("Save failed")

      toast({
        title: "Draft Saved",
        description: "Your changes have been saved to the database.",
      })
    } catch (e) {
      console.error("Save error", e)
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save draft changes.",
      })
    } finally {
      setIsSaving(false)
    }
  }


  // 3. Action Handlers (Single Pipe)
  const handleAction = async (id: string, action: string, comments: string = "") => {
    setIsProcessing(true)
    try {
      const res = await fetch("/api/scout/drafts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: id,
          action: action,
          user_comments: comments
        })
      })

      if (!res.ok) throw new Error("Action failed")

      const result = await res.json()

      // Handle Synchronous Regenerate
      if (action === "REGENERATE" && result.draft) {
        setTargets(prev => prev.map(t => {
          if (t.id !== id) return t
          return {
            ...t,
            draft: {
              ...t.draft,
              id: result.draft.id,
              subject: result.draft.subject,
              body: result.draft.body,
              wordCount: result.draft.body.split(" ").length
            }
          }
        }))
        // Toast success? Using simple visual cue for now
      }
      // Handle Status Updates
      else {
        const newStatus = action === "APPROVE" ? "approved" : "rejected"
        setTargets(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)))
      }

    } catch (e) {
      console.error("Action error", e)
      alert("Action failed. Check console.")
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedTarget = targets.find((t) => t.id === selectedTargetId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Morning Coffee</h1>
                <p className="text-sm text-muted-foreground">Today's Target Batch</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-2">Total: {targets.length}</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center p-12 text-muted-foreground">Loading Batch...</div>
        ) : (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">

            {/* LEFT: List */}
            <div className="col-span-5 overflow-y-auto space-y-3 pr-2 pb-20">
              {targets.map((target) => (
                <Card
                  key={target.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 relative ${selectedTargetId === target.id ? "border-primary bg-card/80" : "border-border bg-card/40"
                    }`}
                  onClick={() => {
                    setSelectedTargetId(target.id)
                    setActiveTab("draft")
                  }}
                >
                  {/* FAILED Status Overlay/Indicator */}
                  {target.status === "failed" && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Blocked
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <TargetAvatar name={target.contactName} company={target.company} linkedinUrl={target.linkedinUrl} profileImage={target.profileImage} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{target.contactName}</h3>
                      <p className="text-sm text-muted-foreground truncate">{target.title}</p>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {target.company}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* RIGHT: Detail */}
            <div className="col-span-7 overflow-y-auto pb-20">
              {selectedTarget && (
                <div className="space-y-4">
                  {/* Selected Header */}
                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-4">
                      <TargetAvatar
                        name={selectedTarget.contactName}
                        company={selectedTarget.company}
                        linkedinUrl={selectedTarget.linkedinUrl}
                        profileImage={selectedTarget.profileImage}
                      />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground mb-1">{selectedTarget.contactName}</h2>
                        <p className="text-muted-foreground mb-2">{selectedTarget.title}</p>

                        {/* Status Warning Inline */}
                        {selectedTarget.status === "failed" && (
                          <div className="p-2 bg-destructive/10 text-destructive text-sm rounded mb-2 border border-destructive/20">
                            <strong>Liveness Check Failed:</strong> Verify employment status manually.
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                          <a href={`mailto:${selectedTarget.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                            <Mail className="w-4 h-4" /> Email
                          </a>
                          {selectedTarget.linkedinUrl && (
                            <a href={selectedTarget.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                              <Linkedin className="w-4 h-4" /> LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <SignalBadge
                          status={selectedTarget.status}
                          evidence={{
                            lastActivity: selectedTarget.broker.provenance.last_enriched || "N/A",
                            targetUrl: selectedTarget.linkedinUrl,
                            sourceContext: selectedTarget.broker.provenance.source_file
                          }}
                        />
                        <Badge variant="secondary" className="gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {selectedTarget.confidenceScore}% match
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draft" | "dossier")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="draft">Draft Review</TabsTrigger>
                      <TabsTrigger value="dossier">Full Dossier</TabsTrigger>
                    </TabsList>

                    <TabsContent value="draft" className="space-y-4 mt-4">
                      {/* Context Rationale */}
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex gap-3">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-foreground mb-1">Context</h3>
                            <p className="text-sm text-muted-foreground">{selectedTarget.aiRationale}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Draft Body */}
                      <Card className="p-6 bg-card/60">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="rich-mode"
                                  checked={isRichMode}
                                  onCheckedChange={setIsRichMode}
                                />
                                <Label htmlFor="rich-mode" className="text-sm font-medium">Rich Asset Mode</Label>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={saveDraft}
                              disabled={isSaving}
                              variant="ghost"
                              className="h-8 gap-2"
                            >
                              {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isSaving ? "Saving..." : "Save Draft"}
                            </Button>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
                            <Textarea
                              className="mt-1.5 font-medium min-h-[40px] resize-none"
                              value={selectedTarget.draft.subject}
                              onChange={(e) => handleDraftChange("subject", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                              {isRichMode ? "Rich Content (HTML)" : "Body Text"}
                            </label>

                            {isRichMode ? (
                              <RichAssetEditor
                                key={selectedTarget.id} // Force remount on switch
                                candidateId={selectedTarget.id}
                                initialContent={selectedTarget.draft.htmlBody}
                                onContentChange={(html) => handleDraftChange("htmlBody", html || "")}
                                onValidationError={setValidationError}
                              />
                            ) : (
                              <Textarea
                                className="mt-1.5 min-h-[300px] font-mono text-sm leading-relaxed"
                                value={selectedTarget.draft.body}
                                onChange={(e) => handleDraftChange("body", e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Actions */}
                      <Card className="p-4 bg-card/40">
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAction(selectedTarget.id, "APPROVE")}
                            disabled={selectedTarget.status === "approved" || selectedTarget.status === "failed" || isProcessing || !!validationError}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          {validationError && (
                            <p className="text-xs text-destructive mt-1 text-center w-full col-span-3">
                              ⚠️ Blocked: {validationError}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleAction(selectedTarget.id, "REGENERATE", "User requested refresh")}
                            disabled={isProcessing}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
                            Regenerate
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleAction(selectedTarget.id, "DISMISS")}
                            disabled={selectedTarget.status === "rejected" || isProcessing}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Dismiss
                          </Button>
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="dossier" className="mt-4">
                      {/* Use the new DossierView Component which has Provenance Built-in */}
                      <DossierView
                        dossier={{
                          id: selectedTarget.id,
                          contact_name: selectedTarget.contactName,
                          firm: selectedTarget.broker.firm,
                          role: selectedTarget.title,
                          linkedin_url: selectedTarget.linkedinUrl,
                          confidence_score: selectedTarget.confidenceScore,
                          status: selectedTarget.status,
                          // Map sub-objects
                          provenance: selectedTarget.broker.provenance,
                          signals: selectedTarget.dossier.structuredSignals || [],
                          // Legacy dossier fields
                          dossier: {
                            notes: selectedTarget.dossier.notes,
                            companySize: selectedTarget.dossier.companySize,
                            industry: selectedTarget.dossier.industry
                          },
                          draft: {
                            id: selectedTarget.draft.id || "pending",
                            subject: selectedTarget.draft.subject,
                            body: selectedTarget.draft.body
                          },
                          commercial_context: undefined
                        }}
                        isLoading={false}
                        error={null}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
