"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfileImage } from "@/lib/hooks/use-profile-image"
import {
  Coffee,
  CheckCircle2,
  Edit3,
  X,
  Sparkles,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Linkedin,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react"

interface TargetInterface {
  id: string
  contactName: string
  title: string
  company: string
  linkedinUrl: string
  email: string
  profileImage?: string
  confidenceScore: number
  aiRationale: string
  businessPersona: {
    type: string
    description: string
    decisionStyle: string
    communicationPreference: string
  }
  dossier: {
    companySize: string
    industry: string
    recentActivity: string[]
    painPoints: string[]
    opportunityScore: number
  }
  draft: {
    subject: string
    body: string
    tone: string
    wordCount: number
  }
  status: "pending" | "approved" | "rejected"
}

function TargetAvatar({ name, company, linkedinUrl }: { name: string; company: string; linkedinUrl?: string }) {
  const { imageUrl } = useProfileImage(name, company, linkedinUrl)

  return (
    <Avatar className="w-14 h-14 border-2 border-border">
      {imageUrl && <AvatarImage src={imageUrl || "/placeholder.svg"} alt={name} />}
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  )
}

export function MorningCoffeeDashboard() {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("")
  const [targets, setTargets] = useState<TargetInterface[]>([])
  const [activeTab, setActiveTab] = useState<"draft" | "dossier">("draft")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTargets()
  }, [])

  const loadTargets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/scout/briefing")
      const data = await response.json()

      const mappedTargets = data.targets.map((target: any) => ({
        id: target.id,
        contactName: target.full_name,
        title: target.role,
        company: target.firm,
        linkedinUrl: target.linkedin_url || "",
        email: target.work_email,
        confidenceScore: 85, // Default confidence score
        aiRationale: target.dossiers?.ai_insight || "High-value target based on recent activity",
        businessPersona: {
          type: "Strategic Partner",
          description: target.dossiers?.persona_summary || "Relationship-focused decision maker",
          decisionStyle: "Consultative",
          communicationPreference: "Email and scheduled calls",
        },
        dossier: {
          companySize: target.dossiers?.firm_size || "Unknown",
          industry: target.dossiers?.industry || "Insurance",
          recentActivity: target.dossiers?.recent_signals || [],
          painPoints: target.dossiers?.pain_points || [],
          opportunityScore: target.dossiers?.opportunity_score || 75,
        },
        draft: {
          subject: target.dossiers?.draft_subject || `Following up - ${target.full_name}`,
          body:
            target.dossiers?.draft_body ||
            `Hi ${target.full_name.split(" ")[0]},\n\nI wanted to reach out regarding...`,
          tone: "Professional, personalized",
          wordCount: target.dossiers?.draft_body?.split(" ").length || 50,
        },
        status: "pending" as const,
      }))

      setTargets(mappedTargets)
      if (mappedTargets.length > 0) {
        setSelectedTargetId(mappedTargets[0].id)
      }
    } catch (error) {
      console.error("[v0] Failed to load briefing targets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTarget = targets.find((t) => t.id === selectedTargetId)

  const handleApprove = async (targetId: string) => {
    try {
      await fetch("/api/scout/drafts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: targetId,
          action: "approved",
        }),
      })
      setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "approved" } : t)))
    } catch (error) {
      console.error("[v0] Failed to approve draft:", error)
    }
  }

  const handleReject = async (targetId: string) => {
    try {
      await fetch("/api/scout/drafts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: targetId,
          action: "dismissed",
        }),
      })
      setTargets(targets.map((t) => (t.id === targetId ? { ...t, status: "rejected" } : t)))
    } catch (error) {
      console.error("[v0] Failed to reject draft:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Badge variant="secondary" className="gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                {targets.length} targets
              </Badge>
              <Badge variant="outline" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="container mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-140px)]">
            <p className="text-muted-foreground">Loading targets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left Panel - Target List */}
            <div className="col-span-5 overflow-y-auto space-y-3 pr-2">
              {targets.map((target) => (
                <Card
                  key={target.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedTargetId === target.id ? "border-primary bg-card/80" : "border-border bg-card/40"
                  }`}
                  onClick={() => {
                    setSelectedTargetId(target.id)
                    setActiveTab("draft")
                  }}
                >
                  <div className="flex gap-4">
                    <TargetAvatar name={target.contactName} company={target.company} linkedinUrl={target.linkedinUrl} />

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{target.contactName}</h3>
                        <Badge
                          variant={
                            target.status === "approved"
                              ? "default"
                              : target.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="shrink-0 text-xs"
                        >
                          {target.confidenceScore}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{target.title}</p>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {target.company}
                      </p>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTargetId(target.id)
                            setActiveTab("dossier")
                          }}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          View Dossier
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right Panel - Detail View */}
            <div className="col-span-7 overflow-y-auto">
              {selectedTarget && (
                <div className="space-y-4">
                  {/* Target Header */}
                  <Card className="p-6 bg-card/60">
                    <div className="flex items-start gap-4">
                      <TargetAvatar
                        name={selectedTarget.contactName}
                        company={selectedTarget.company}
                        linkedinUrl={selectedTarget.linkedinUrl}
                      />
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
                          {selectedTarget.linkedinUrl && (
                            <a
                              href={selectedTarget.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {selectedTarget.confidenceScore}% confidence
                      </Badge>
                    </div>
                  </Card>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draft" | "dossier")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="draft">Review Draft</TabsTrigger>
                      <TabsTrigger value="dossier">Full Dossier</TabsTrigger>
                    </TabsList>

                    {/* Draft Tab */}
                    <TabsContent value="draft" className="space-y-4 mt-4">
                      {/* AI Rationale */}
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex gap-3">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-foreground mb-1">Why this target?</h3>
                            <p className="text-sm text-muted-foreground">{selectedTarget.aiRationale}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Draft Content */}
                      <Card className="p-6 bg-card/60">
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Subject Line
                            </label>
                            <p className="text-foreground font-medium mt-1.5">{selectedTarget.draft.subject}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Email Body
                            </label>
                            <div className="mt-1.5 text-foreground whitespace-pre-wrap leading-relaxed">
                              {selectedTarget.draft.body}
                            </div>
                          </div>
                          <div className="flex gap-4 pt-2 text-xs text-muted-foreground">
                            <span>Tone: {selectedTarget.draft.tone}</span>
                            <span>•</span>
                            <span>{selectedTarget.draft.wordCount} words</span>
                          </div>
                        </div>
                      </Card>

                      {/* Actions */}
                      <Card className="p-4 bg-card/40">
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(selectedTarget.id)}
                            disabled={selectedTarget.status === "approved"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {selectedTarget.status === "approved" ? "Approved" : "Approve (Queue for Outbox)"}
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <Edit3 className="w-4 h-4 mr-1.5" />
                            Edit Draft
                          </Button>
                          <Button variant="outline">
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Magic Polish
                          </Button>
                          <Button
                            variant="outline"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => handleReject(selectedTarget.id)}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </Card>
                    </TabsContent>

                    {/* Dossier Tab */}
                    <TabsContent value="dossier" className="space-y-4 mt-4">
                      {/* Business Persona */}
                      <Card className="p-6 bg-card/60">
                        <div className="flex items-start gap-3 mb-4">
                          <Users className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Business Persona</h3>
                            <Badge variant="secondary" className="mb-3">
                              {selectedTarget.businessPersona.type}
                            </Badge>
                            <p className="text-sm text-muted-foreground mb-4">
                              {selectedTarget.businessPersona.description}
                            </p>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Decision Style
                                </label>
                                <p className="text-sm text-foreground mt-1">
                                  {selectedTarget.businessPersona.decisionStyle}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Communication Preference
                                </label>
                                <p className="text-sm text-foreground mt-1">
                                  {selectedTarget.businessPersona.communicationPreference}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Company Intelligence */}
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
                                <p className="text-sm text-foreground mt-1">{selectedTarget.dossier.companySize}</p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Industry
                                </label>
                                <p className="text-sm text-foreground mt-1">{selectedTarget.dossier.industry}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                                Opportunity Score
                              </label>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${selectedTarget.dossier.opportunityScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {selectedTarget.dossier.opportunityScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Recent Activity */}
                      <Card className="p-6 bg-card/60">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
                            <ul className="space-y-2">
                              {selectedTarget.dossier.recentActivity.map((activity, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>

                      {/* Pain Points */}
                      <Card className="p-6 bg-card/60">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-3">Identified Pain Points</h3>
                            <ul className="space-y-2">
                              {selectedTarget.dossier.painPoints.map((pain, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{pain}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>

                      {/* Dossier Actions */}
                      <Card className="p-4 bg-card/40">
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              handleApprove(selectedTarget.id)
                              setActiveTab("draft")
                            }}
                            disabled={selectedTarget.status === "approved"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve Draft
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setActiveTab("draft")}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Review & Edit Draft
                          </Button>
                          <Button
                            variant="outline"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => handleReject(selectedTarget.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Dismiss Target
                          </Button>
                        </div>
                      </Card>
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
