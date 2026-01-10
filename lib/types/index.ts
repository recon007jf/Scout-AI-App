/**
 * Scout UI: TypeScript Type Definitions
 *
 * Core data structures for the Scout frontend.
 * These types define the contract between UI and backend.
 */

// ============================================================================
// Morning Coffee Queue
// ============================================================================

export interface Target {
  // Identity
  targetId: string
  fullName: string
  firmName: string
  role?: string
  email?: string

  // Draft content
  draftSubject: string
  draftBody: string

  // Confidence & verification
  confidenceScore: number // 0.0 to 1.0
  confidenceLevel: "high" | "medium" | "low"
  verificationStatus: "verified" | "candidate" | "failed"

  // Timing & cadence
  cadenceDay: number
  cadenceTotal: number
  lastContactDate: string // ISO date
  scheduledSendTime?: string // ISO datetime

  // Why today? (AI reasoning)
  primaryReason: string
  reasoningDetail: string

  // Provenance (display only)
  dataSource: {
    email: "crm" | "enriched" | "manual"
    profile: "linkedin" | "website" | "crm"
    lastVerified: string
  }

  // Engagement history
  previousEngagement?: {
    emailsSent: number
    emailsOpened: number
    lastOpenedDate?: string
  }
}

// ============================================================================
// Dossier
// ============================================================================

export interface Dossier {
  target: Target

  // Relationship timeline
  interactions: Interaction[]

  // Firm context
  firmContext: FirmContext

  // AI reasoning
  whyToday: AIReasoning
}

export interface Interaction {
  date: string // ISO date
  type: "email_sent" | "email_opened" | "meeting" | "note" | "call"
  summary: string
  details?: string
}

export interface FirmContext {
  employeeCount?: number
  recentGrowth?: string
  industry: string
  website?: string
  newsItems?: NewsItem[]
}

export interface NewsItem {
  title: string
  date: string
  source: string
  url?: string
}

export interface AIReasoning {
  primarySignal: string
  supportingSignals: string[]
  confidenceFactors: string[]
}

// ============================================================================
// Draft Actions
// ============================================================================

export interface DraftUpdates {
  subject?: string
  body?: string
}

export interface PolishedDraft {
  subject: string
  body: string
  changes: DraftChange[]
}

export interface DraftChange {
  type: "added" | "removed" | "modified"
  originalText?: string
  newText?: string
  section?: "subject" | "opening" | "body" | "closing"
}

export type SkipReason = "needs_research" | "bad_timing" | "data_quality" | "other"

export interface SkipPayload {
  targetId: string
  reason: SkipReason
  note?: string
}

// ============================================================================
// API Responses
// ============================================================================

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
}

export interface APIError {
  code: string
  message: string
  retryable: boolean
}

export interface ApprovalResponse {
  success: boolean
  scheduledFor: string // ISO datetime
  outboxId?: string
}

export interface SessionSummary {
  totalReviewed: number
  approved: number
  edited: number
  polished: number
  skipped: number
  timeSpent: number // seconds
  improvements?: {
    accuracyChange: number // percentage
    approvalRate: number
    spamComplaints: number
  }
}

// ============================================================================
// UI State
// ============================================================================

export interface MorningCoffeeState {
  targets: Target[]
  currentIndex: number
  expandedTargetId: string | null
  isLoading: boolean
  error: APIError | null
}

export interface DossierState {
  isOpen: boolean
  targetId: string | null
  data: Dossier | null
  isLoading: boolean
  error: APIError | null
}

// ============================================================================
// User Session
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  fullName: string
  firmName?: string
  settings: UserSettings
}

export interface UserSettings {
  voiceConfidence: number
  preferredSendTime: string // "09:00"
  enableBatPhone: boolean
  keyboardShortcutsEnabled: boolean
}
