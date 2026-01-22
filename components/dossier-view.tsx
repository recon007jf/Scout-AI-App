/**
 * COMPONENT: DossierView
 * Full detailed view of a Target's Dossier
 * 
 * Includes:
 * - Firm Intelligence
 * - Structured Signals
 * - Provenance Block (Debug Visibility)
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Building2,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Newspaper,
  Clock,
  AlertCircle
} from "lucide-react"
import type { CandidateDossier } from "@/lib/api/client"
import { CandidateIdentityHeader } from "@/components/candidate-identity-header"

interface DossierViewProps {
  dossier: CandidateDossier | null
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export function DossierView({ dossier, isLoading, error, onRetry }: DossierViewProps) {

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dossier</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          {onRetry && (
            <button onClick={onRetry} className="text-sm underline self-start">Retry</button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!dossier) return <div className="p-4 text-center text-muted-foreground">Select a candidate to view dossier.</div>

  const { provenance, signals, dossier: legacyDossier, commercial_context } = dossier
  const isFailed = dossier.status === "FAILED"

  // DEV-ONLY MOCK DATA LAYER
  // Validates UI wiring by filling "Unknown" fields when in development mode.
  // STRICTLY GATED: Does not persist, never reaches production.
  const isDev = process.env.NODE_ENV === "development"

  const mockContext = {
    sponsor_name: "Acme Corp (Dev Mock)",
    lives: 5000,
    self_funded_status: "Self-Funded"
  }

  const mockSignals = [
    { type: "NEWS", summary: "Acme Corp announces new benefits strategy (Mock Signal)", source: "BusinessWire", date: "2 days ago" },
    { type: "EVENT", summary: "HR Director attended Annual Benefits Summit (Mock Signal)", source: "LinkedIn", date: "1 week ago" }
  ]

  const displayContext = isDev ? {
    ...commercial_context,
    sponsor_name: commercial_context?.sponsor_name || mockContext.sponsor_name,
    lives: commercial_context?.lives || mockContext.lives,
    self_funded_status: (commercial_context?.self_funded_status === "unknown" || !commercial_context?.self_funded_status)
      ? mockContext.self_funded_status
      : commercial_context.self_funded_status
  } : commercial_context

  const displaySignals = (isDev && (!signals || signals.length === 0)) ? mockSignals : signals
  // -------------------------

  return (
    <div className="space-y-6">

      {/* 1. Liveness Alert */}
      {isFailed && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Liveness Check Failed</AlertTitle>
          <AlertDescription>
            This candidate was flagged by the system. Reason: {provenance.liveness_status}
          </AlertDescription>
        </Alert>
      )}

      {/* LAYER 1: CANONICAL IDENTITY HEADER */}
      {/* LAYER 1: CANONICAL IDENTITY HEADER (Hoisted to Parent) */}
      {/* <CandidateIdentityHeader /> removed from here to prevent duplication */}

      {/* LAYER 2: COMMERCIAL CONTEXT */}
      <Card className="p-5 bg-card/60">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          <Database className="h-3.5 w-3.5" />
          Market Context {isDev && <span className="text-amber-500 text-[10px] ml-2">(DEV MOCKS ACTIVE)</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="block text-xs text-muted-foreground uppercase mb-1">Client(s) / Sponsor</span>
            <p className="font-medium text-foreground text-sm">
              {displayContext?.sponsor_name || "Unknown"}
            </p>
          </div>

          <div>
            <span className="block text-xs text-muted-foreground uppercase mb-1">Lives Covered</span>
            <p className="font-medium text-foreground text-sm">
              {displayContext?.lives ? Number(displayContext.lives).toLocaleString() : "Unknown"}
            </p>
          </div>

          <div>
            <span className="block text-xs text-muted-foreground uppercase mb-1">Self-Funded Status</span>
            <p className="font-medium text-foreground text-sm">
              {displayContext?.self_funded_status === "unknown"
                ? <span className="text-muted-foreground italic">Unknown</span>
                : displayContext?.self_funded_status}
            </p>
          </div>
        </div>
      </Card>

      {/* LAYER 3: INTELLIGENCE */}

      {/* 3a. Structured Signals */}
      <Card className="p-6 bg-card/60">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          <Newspaper className="h-3.5 w-3.5" />
          Signals Intelligence
        </h3>

        {displaySignals && displaySignals.length > 0 ? (
          <div className="space-y-3">
            {displaySignals.map((sig, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="mt-1">
                  {sig.type === "EVENT" ? <Calendar className="h-4 w-4 text-orange-500" /> : <FileText className="h-4 w-4 text-blue-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{sig.summary}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{sig.source}</span>
                    <span>•</span>
                    <span>{sig.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No signals detected recently.</p>
        )}
      </Card>

      {/* 3b. Firm DNA */}
      <Card className="p-6 bg-card/60">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          <Building2 className="h-3.5 w-3.5" />
          Firm DNA
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-muted-foreground uppercase">Firm Name</label>
            <p className="font-medium text-foreground">{dossier.firm}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Industry</label>
            <p className="font-medium text-foreground">{legacyDossier?.industry || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase">Revenue</label>
                <p className="font-medium text-foreground">{legacyDossier?.companySize || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Opportunity Score</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 w-24">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${dossier.confidence_score || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{dossier.confidence_score}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Provenance Block (The "Plumbing" View) */}
      <div className="border-t border-border pt-6 mt-4">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <Database className="h-3 w-3" />
          Data Provenance & Reliability
        </h4>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-md border border-border/50 text-xs text-muted-foreground font-mono">
          <div>
            <span className="block text-accent/70 mb-1">Source Origin</span>
            <p className="text-foreground truncate" title={provenance.source_file}>{provenance.source_file} (Row {provenance.source_row})</p>
          </div>
          <div>
            <span className="block text-accent/70 mb-1">Last Enriched</span>
            <p className="text-foreground">{provenance.last_enriched || "Never"}</p>
          </div>
          <div>
            <span className="block text-accent/70 mb-1">Liveness Status</span>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded ${isFailed ? "bg-destructive/20 text-destructive" : "bg-green-500/20 text-green-500"}`}>
                {provenance.liveness_status}
              </span>
              {!isFailed && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            </div>
          </div>
          <div>
            <span className="block text-accent/70 mb-1">Signals</span>
            <p className="text-foreground">{provenance.signal_count} Captured</p>
          </div>
        </div>
      </div>

    </div>
  )
}
