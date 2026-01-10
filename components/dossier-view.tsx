/**
 * COMPONENT: DossierView
 * Full detailed view of a Target's Dossier
 *
 * PROVENANCE FIELDS:
 * - Display-only: UI shows all provenance sources but doesn't decide which wins
 * - Core engine (Antigravity) handles resolution logic
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2, FileText, Database } from "lucide-react"
import type { Target } from "./morning-coffee-dashboard"

interface DossierViewProps {
  target: Target
}

export function DossierView({ target }: DossierViewProps) {
  const initials = target.broker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={target.broker.avatar || "/placeholder.svg?height=80&width=80&query=professional+business+executive"}
              alt={`${target.broker.name} profile photo`}
            />
            <AvatarFallback className="bg-primary text-2xl font-medium text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-3xl font-semibold text-foreground">{target.broker.name}</h2>
            <p className="mt-1 text-lg text-muted-foreground">{target.broker.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {target.broker.provenance.confidence}% Confidence
              </Badge>
              <Badge variant="outline">Target ID: {target.id}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Firm Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Firm Information
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Firm Name</p>
                <p className="text-base font-medium text-foreground">{target.broker.firm}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-base text-foreground">{target.broker.location}</p>
              </div>
              {target.dossier.topPlanSponsor && (
                <div>
                  <p className="text-sm text-muted-foreground">Top Plan Sponsor</p>
                  <p className="text-base text-foreground">{target.dossier.topPlanSponsor}</p>
                </div>
              )}
              {target.dossier.aum && (
                <div>
                  <p className="text-sm text-muted-foreground">AUM</p>
                  <p className="text-base text-foreground">{target.dossier.aum}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Signals */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <FileText className="h-4 w-4" />
              Recent Signals
            </h3>
            <ul className="space-y-2">
              {target.dossier.recentSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* Provenance Data - Display Only */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <Database className="h-4 w-4" />
            Data Provenance (Display Only)
          </h3>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Source resolution handled by core engine. UI displays all available sources.
            </p>
            <div className="space-y-2">
              {target.broker.provenance.clay_linkedin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clay LinkedIn:</span>
                  <span className="font-mono text-foreground">{target.broker.provenance.clay_linkedin}</span>
                </div>
              )}
              {target.broker.provenance.serper_linkedin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Serper LinkedIn:</span>
                  <span className="font-mono text-foreground">{target.broker.provenance.serper_linkedin}</span>
                </div>
              )}
              {target.broker.provenance.linkedin_final && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">LinkedIn Final:</span>
                  <span className="font-mono text-accent">{target.broker.provenance.linkedin_final}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="font-medium text-muted-foreground">Confidence Score:</span>
                <span className="font-semibold text-accent">{target.broker.provenance.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Notes */}
        {target.dossier.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Broker Notes</h3>
              <p className="text-sm text-foreground">{target.dossier.notes}</p>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
