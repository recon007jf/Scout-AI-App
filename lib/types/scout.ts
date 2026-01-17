/**
 * FROZEN DATA CONTRACT - Phase 2
 * Source: Stage 2 Integration Test (Successful)
 * Date: Integration Testing Phase
 *
 * DO NOT MODIFY without backend coordination.
 * These types match the EXACT payload from Cloud Run backend.
 */

export interface BriefingSignal {
  type: string
  priority: number
  description: string
}

export interface BriefingDraft {
  subject: string
  body: string
  generatedAt: string
  version: number
}

export interface BusinessPersona {
  type: string
  description: string
  decisionStyle: string
  communicationPreference: string
}

export interface BriefingTarget {
  targetId: string
  broker: {
    name: string
    title: string
    firm: string
    email: string
    phone: string
    linkedIn: string
    avatar: string
    imageUrl?: string | null // Phase 2: Live LinkedIn Image
  }
  sponsor: {
    name: string
    industry: string
    revenue: string
    employees: number
    location: string
  }
  signals: BriefingSignal[]
  dossier: {
    lastContact: string
    relationshipScore: number
    previousInteractions: number
    keyNotes: string[]
  }
  businessPersona: BusinessPersona
  draft: BriefingDraft
  status: "pending_review" | "approved" | "rejected" | "sending" | "sent" | "failed" | "replied" | "bounced" | "ooo"
  priority: number
  createdAt: string
}

export interface BriefingResponse {
  targets: BriefingTarget[]
  metadata: {
    generatedAt: string
    totalTargets: number
  }
}

export interface OutreachStatus {
  status: "active" | "paused"
  paused_at: string | null
  resume_at: string | null
  duration: string | null
  queue_frozen: boolean
  queued_count: number
  in_flight_count: number
  next_block_at: string | null
  warning_due: boolean
}
