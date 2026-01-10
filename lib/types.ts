/**
 * Scout UI: Type Definitions
 * Shared types between UI and backend
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
  userId: string
  email: string
  fullName: string
  role: "broker" | "admin"
}

export interface Broker {
  name: string
  title: string
  firm: string
  email: string
  phone: string
  linkedIn?: string
  avatar?: string
}

export interface Sponsor {
  name: string
  industry: string
  revenue: string
  employees: number
  location: string
}

export interface SignalDetail {
  type: string
  priority: number
  description: string
}

export interface Dossier {
  lastContact: string
  relationshipScore: number
  previousInteractions: number
  keyNotes: string[]
}

export interface Draft {
  subject: string
  body: string
  generatedAt: string
  version: number
}

export interface Target {
  targetId: string
  broker: Broker
  sponsor: Sponsor
  signals: SignalDetail[]
  dossier: Dossier
  businessPersona: {
    type: string
    description: string
    decisionStyle: string
    communicationPreference: string
  }
  draft: Draft
  status: "pending_review" | "approved" | "paused" | "dismissed"
  priority: number
  createdAt: string
}

// ============================================================================
// Signal Types
// ============================================================================

export interface Signal {
  id: string
  type: "email-reply" | "job-change" | "company-news" | "referral" | "meeting-request"
  priority: "high" | "medium" | "low"
  timestamp: string
  contact: {
    name: string
    title: string
    company: string
    avatarUrl?: string
  }
  summary: string
  details: string
  replyText?: string
  actionable: boolean
  signalStrength: number
  isRead: boolean
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApprovalResponse {
  success: boolean
  scheduledFor: string
}

export interface DraftUpdates {
  subject?: string
  body?: string
  editorNotes?: string
}

export interface PolishedDraft {
  original: {
    subject: string
    body: string
  }
  polished: {
    subject: string
    body: string
  }
  changes: Array<{
    type: string
    description: string
  }>
  improvementScore: number
}

export interface SkipPayload {
  targetId: string
  reason: "bad_fit" | "wrong_timing" | "needs_research" | "other"
  notes?: string
}

export interface SessionSummary {
  totalReviewed: number
  approved: number
  edited: number
  polished: number
  skipped: number
  timeSpent: number
  improvements: {
    accuracyChange: number
    approvalRate: number
    spamComplaints: number
  }
}

export interface APIError {
  code: string
  message: string
  retryable: boolean
}
