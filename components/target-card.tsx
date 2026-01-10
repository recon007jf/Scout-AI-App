"use client"

/**
 * COMPONENT: TargetCard
 * Displays a Target's Dossier preview and AI-generated draft for review
 *
 * HUMAN APPROVAL GATE:
 * - "Approve" button queues for Outlook Outbox injection (no auto-send)
 * - All actions require explicit user interaction
 */

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, XCircle, Edit3, Sparkles, MapPin, Briefcase, TargetIcon, Lightbulb } from "lucide-react"
import type { Target } from "./morning-coffee-dashboard"

interface TargetCardProps {
  target: Target
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (id: string, subject: string, body: string) => void
  onMagicPolish: (id: string) => void
  onViewDossier: () => void
}

export function TargetCard({ target, onApprove, onReject, onEdit, onMagicPolish, onViewDossier }: TargetCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState(target.draft.subject)
  const [editedBody, setEditedBody] = useState(target.draft.body)

  const handleSaveEdit = () => {
    onEdit(target.id, editedSubject, editedBody)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedSubject(target.draft.subject)
    setEditedBody(target.draft.body)
    setIsEditing(false)
  }

  const initials = target.broker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[400px,1fr] lg:gap-0">
        {/* Left: Dossier Preview */}
        <div className="border-b bg-muted/30 p-6 lg:border-b-0 lg:border-r">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={
                    target.broker.avatar || "/placeholder.svg?height=56&width=56&query=professional+business+executive"
                  }
                  alt={`${target.broker.name} profile photo`}
                />
                <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{target.broker.name}</h3>
                <p className="text-sm text-muted-foreground">{target.broker.title}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{target.broker.firm}</p>
                  {target.dossier.topPlanSponsor && (
                    <p className="text-xs text-muted-foreground">Top Client: {target.dossier.topPlanSponsor}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{target.broker.location}</p>
              </div>

              <div className="flex items-start gap-3">
                <TargetIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Signals</p>
                  <ul className="mt-2 space-y-1">
                    {target.dossier.recentSignals.map((signal, idx) => (
                      <li key={idx} className="text-xs text-foreground">
                        • {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">
                {target.broker.provenance.confidence}% Confidence
              </Badge>
              {target.broker.provenance.linkedin_final && (
                <p className="text-xs text-muted-foreground">Source: {target.broker.provenance.linkedin_final}</p>
              )}
            </div>

            <Button onClick={onViewDossier} variant="outline" className="w-full bg-transparent" size="sm">
              View Full Dossier
            </Button>
          </div>
        </div>

        {/* Right: Draft */}
        <div className="flex flex-col p-6">
          <div className="mb-4 rounded-lg bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-primary">AI Rationale ({target.draft.aiProvider})</p>
                <p className="mt-1 text-xs text-muted-foreground">{target.draft.aiRationale}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject Line</label>
              {isEditing ? (
                <Input value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} className="mt-2" />
              ) : (
                <p className="mt-2 text-lg font-medium text-foreground">{target.draft.subject}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Draft Body</label>
              {isEditing ? (
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="mt-2 min-h-[300px] font-mono text-sm"
                />
              ) : (
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {target.draft.body}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar - HUMAN APPROVAL GATE */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-6">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} size="lg" className="flex-1">
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="lg" className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => onApprove(target.id)} size="lg" className="flex-1 bg-accent hover:bg-accent/90">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve (Queue for Outbox)
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="lg">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => onMagicPolish(target.id)} variant="outline" size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Magic Polish
                </Button>
                <Button onClick={() => onReject(target.id)} variant="destructive" size="lg">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
