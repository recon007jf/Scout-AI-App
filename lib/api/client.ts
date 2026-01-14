/**
 * Scout UI: API Client
 *
 * Abstract integration layer between UI and Core Engine (Antigravity).
 * Uses mock data in development, real API in production.
 */

import type {
  Target,
  Dossier,
  DraftUpdates,
  PolishedDraft,
  SkipPayload,
  ApprovalResponse,
  SessionSummary,
  APIError,
  Signal,
  User,
} from "@/lib/types"

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "https://scout-backend-283427197752.us-central1.run.app"
}

function shouldUseMocks(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true" || !process.env.NEXT_PUBLIC_API_URL
}

// ============================================================================
// HTTP Client Helper
// ============================================================================

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`

  // Get auth token from localStorage (Antigravity will provide this)
  const token = typeof window !== "undefined" ? localStorage.getItem("scout_auth_token") : null

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error: APIError = {
      code: `HTTP_${response.status}`,
      message: response.statusText,
      retryable: response.status >= 500,
    }
    throw error
  }

  return response.json()
}

// ============================================================================
// Morning Coffee Queue
// ============================================================================

/**
 * BACKEND TODO: Implement getMorningCoffeeQueue()
 *
 * Fetches the curated list of targets ready for review.
 * Should return 8-12 targets max.
 */
export async function getMorningCoffeeQueue(): Promise<Target[]> {
  if (shouldUseMocks()) {
    const { mockTargets } = await import("./mock/morning-coffee")
    return new Promise((resolve) => setTimeout(() => resolve(mockTargets), 500))
  }

  return apiRequest<Target[]>("/api/morning-coffee/queue")
}

// ============================================================================
// Morning Briefing Actions (Button Contract Matrix)
// ============================================================================

/**
 * DEPRECATED: getBriefing() has been removed.
 * Use getMorningQueue() from @/lib/api/morning-queue instead.
 * All morning briefing data now comes directly from Supabase target_brokers table.
 */

/**
 * Approves a draft and queues for sending
 * Endpoint: POST /api/drafts/{id}/approve
 */
export async function approveTarget(targetId: string): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock approve:", targetId)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
  }

  return apiRequest(`/api/drafts/${targetId}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

/**
 * Pauses a target with optional reason
 * Endpoint: POST /api/targets/{id}/pause
 */
export async function pauseTarget(targetId: string, reason?: string): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock pause:", targetId, reason)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
  }

  return apiRequest(`/api/targets/${targetId}/pause`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

/**
 * Dismisses a target from the queue
 * Endpoint: POST /api/targets/{id}/dismiss
 */
export async function dismissTarget(targetId: string, reason = "bad_fit"): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock dismiss:", targetId, reason)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
  }

  return apiRequest(`/api/targets/${targetId}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

// ============================================================================
// Draft Actions
// ============================================================================

/**
 * BACKEND TODO: Implement approveDraft()
 *
 * Approves a draft and queues it to Outlook outbox.
 * Returns scheduled send time.
 */
export async function approveDraft(targetId: string): Promise<ApprovalResponse> {
  if (shouldUseMocks()) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: true,
            scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          }),
        200,
      ),
    )
  }

  return apiRequest<ApprovalResponse>("/api/drafts/approve", {
    method: "POST",
    body: JSON.stringify({ targetId }),
  })
}

/**
 * BACKEND TODO: Implement editDraft()
 *
 * Saves edits and logs them for AI learning.
 */
export async function editDraft(targetId: string, updates: DraftUpdates): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock edit:", targetId, updates)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
  }

  return apiRequest("/api/drafts/edit", {
    method: "POST",
    body: JSON.stringify({ targetId, updates }),
  })
}

/**
 * BACKEND TODO: Implement magicPolish()
 *
 * Sends draft to AI for enhancement.
 * Returns polished version with diff.
 */
export async function magicPolish(targetId: string): Promise<PolishedDraft> {
  if (shouldUseMocks()) {
    const { mockPolishedDraft } = await import("./mock/morning-coffee")
    return new Promise((resolve) => setTimeout(() => resolve(mockPolishedDraft), 3000))
  }

  return apiRequest<PolishedDraft>("/api/drafts/polish", {
    method: "POST",
    body: JSON.stringify({ targetId }),
  })
}

/**
 * BACKEND TODO: Implement skipTarget()
 *
 * Removes target from queue and flags for review.
 * Logs reason for AI feedback.
 */
export async function skipTarget(payload: SkipPayload): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock skip:", payload)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
  }

  return apiRequest("/api/targets/skip", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Saves edited draft content
 * Endpoint: PUT /api/targets/{id}/draft
 */
export async function saveDraft(targetId: string, subject: string, body: string): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock save draft:", targetId, { subject, body })
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 300))
  }

  return apiRequest(`/api/targets/${targetId}/draft`, {
    method: "PUT",
    body: JSON.stringify({ subject, body }),
  })
}

/**
 * Regenerates draft with AI using optional comments
 * Endpoint: POST /api/targets/{id}/draft/regenerate
 */
export async function regenerateDraft(targetId: string, comments?: string): Promise<{ subject: string; body: string }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock regenerate:", targetId, comments)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            subject: "Refined: Your D&O Coverage Strategy",
            body: `[LLM PLACEHOLDER]\n\nThis email will be generated by Gemini when connected.\nUser instructions: "${comments || "Standard regeneration"}"\n\nThe backend will analyze the target's context, signals, and your comments to create a personalized, compelling email.`,
          }),
        2000,
      ),
    )
  }

  return apiRequest(`/api/targets/${targetId}/draft/regenerate`, {
    method: "POST",
    body: JSON.stringify({ comments }),
  })
}

// ============================================================================
// Signals Actions (Button Contract Matrix)
// ============================================================================

/**
 * Fetches all signals
 * Endpoint: GET /api/signals
 */
export async function getSignals(): Promise<Signal[]> {
  if (shouldUseMocks()) {
    const { mockSignals } = await import("./mock/signals")
    return new Promise((resolve) => setTimeout(() => resolve(mockSignals), 500))
  }

  return apiRequest<Signal[]>("/api/signals")
}

/**
 * Marks a signal as read
 * Endpoint: POST /api/signals/{id}/read
 */
export async function markSignalRead(signalId: string): Promise<{ success: boolean }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock mark read:", signalId)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
  }

  return apiRequest(`/api/signals/${signalId}/read`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

/**
 * Generates AI reply draft for a signal
 * Endpoint: POST /api/signals/{id}/reply
 */
export async function generateSignalReply(signalId: string): Promise<{ subject: string; body: string }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock generate reply:", signalId)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            subject: "Re: Your inquiry about D&O coverage",
            body: "[LLM PLACEHOLDER]\n\nThis reply will be generated by Gemini based on the signal context and conversation history.",
          }),
        2000,
      ),
    )
  }

  return apiRequest(`/api/signals/${signalId}/reply`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

/**
 * Converts a signal into a target for the briefing queue
 * Endpoint: POST /api/signals/{id}/convert
 */
export async function convertSignalToTarget(signalId: string): Promise<{ success: boolean; targetId: string }> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock convert to target:", signalId)
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, targetId: `target_${Date.now()}` }), 300))
  }

  return apiRequest(`/api/signals/${signalId}/convert`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

// ============================================================================
// Outreach Control (Button Contract Matrix)
// ============================================================================

/**
 * Pauses all outreach with optional duration
 *
 * IMPORTANT: Pause is enforced server-side in Supabase and checked by the send worker.
 * The backend will refuse to send any queued emails while paused.
 * Timed pauses auto-resume based on backend time, not client timers.
 *
 * Endpoint: POST /api/outreach/pause
 */
export async function pauseOutreach(
  duration: string,
  reason?: string,
): Promise<{
  status: "paused"
  paused_at: string
  resume_at: string | null
  duration: string
  queue_frozen: boolean
}> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock pause outreach:", duration, reason)
    const pausedAt = new Date().toISOString()
    let resumeAt = null

    // Calculate resume time for timed pauses
    if (duration !== "manual") {
      const hours =
        duration === "1h"
          ? 1
          : duration === "2h"
            ? 2
            : duration === "3h"
              ? 3
              : duration === "1d"
                ? 24
                : duration === "2d"
                  ? 48
                  : 72
      resumeAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    }

    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "paused",
            paused_at: pausedAt,
            resume_at: resumeAt,
            duration,
            queue_frozen: true,
          }),
        200,
      ),
    )
  }

  return apiRequest(`/api/outreach/pause`, {
    method: "POST",
    body: JSON.stringify({ duration, reason }),
  })
}

/**
 * Resumes paused outreach
 *
 * IMPORTANT: Idempotent operation - safe to call multiple times.
 *
 * Endpoint: POST /api/outreach/resume
 */
export async function resumeOutreach(): Promise<{
  status: "active"
  resumed_at: string
  queue_frozen: boolean
}> {
  if (shouldUseMocks()) {
    console.log("[v0] Mock resume outreach")
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "active",
            resumed_at: new Date().toISOString(),
            queue_frozen: false,
          }),
        200,
      ),
    )
  }

  return apiRequest(`/api/outreach/resume`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

/**
 * Gets current outreach status with queue metrics
 *
 * IMPORTANT: This is the authoritative source for pause state.
 * UI uses this to determine if 2-hour warning should be shown.
 * Backend enforces pause in the send worker, not the UI.
 *
 * Endpoint: GET /api/outreach/status (proxied via Next.js)
 */
export async function getOutreachStatus(): Promise<{
  status: "active" | "paused"
  paused_at: string | null
  resume_at: string | null
  duration: string | null
  queue_frozen: boolean
  queued_count: number
  in_flight_count: number
  next_block_at: string | null
  warning_due: boolean
  outlook_connected: boolean
}> {
  if (shouldUseMocks()) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "active",
            paused_at: null,
            resume_at: null,
            duration: null,
            queue_frozen: false,
            queued_count: 15,
            in_flight_count: 0,
            next_block_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            warning_due: false,
            outlook_connected: true,
          }),
        100,
      ),
    )
  }

  const response = await fetch("/api/scout/outreach/status")
  if (!response.ok) {
    throw new Error(`Status fetch failed: ${response.statusText}`)
  }
  return response.json()
}

// ============================================================================
// Dossier
// ============================================================================

/**
 * BACKEND TODO: Implement getDossier()
 *
 * Fetches complete context for a target.
 */
export async function getDossier(targetId: string): Promise<Dossier> {
  if (shouldUseMocks()) {
    const { mockDossier } = await import("./mock/dossier")
    return new Promise((resolve) => setTimeout(() => resolve(mockDossier), 800))
  }

  return apiRequest<Dossier>(`/api/dossier/${targetId}`)
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * BACKEND TODO: Implement getSessionSummary()
 *
 * Returns summary of Morning Coffee session.
 */
export async function getSessionSummary(): Promise<SessionSummary> {
  if (shouldUseMocks()) {
    return {
      totalReviewed: 8,
      approved: 6,
      edited: 2,
      polished: 1,
      skipped: 1,
      timeSpent: 720, // 12 minutes
      improvements: {
        accuracyChange: 12,
        approvalRate: 87,
        spamComplaints: 0,
      },
    }
  }

  return apiRequest<SessionSummary>("/api/session/summary")
}

// ============================================================================
// Authentication (Handled by Antigravity)
// ============================================================================

/**
 * BACKEND TODO: Implement login()
 *
 * Authenticates user and returns session token.
 */
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  if (shouldUseMocks()) {
    return {
      token: "mock_token_12345",
      user: {
        userId: "user_001",
        email: "andrew@insurance.com",
        fullName: "Andrew Miller",
        role: "broker",
      },
    }
  }

  const result = await apiRequest<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

  // Store token for future requests
  if (typeof window !== "undefined") {
    localStorage.setItem("scout_auth_token", result.token)
  }

  return result
}

/**
 * BACKEND TODO: Implement logout()
 */
export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("scout_auth_token")
  }

  if (!shouldUseMocks()) {
    await apiRequest("/api/auth/logout", { method: "POST" })
  }
}

/**
 * BACKEND TODO: Implement getCurrentUser()
 *
 * Returns current authenticated user or null.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (shouldUseMocks()) {
    return {
      userId: "user_001",
      email: "andrew@insurance.com",
      fullName: "Andrew Miller",
      role: "broker",
    }
  }

  try {
    return await apiRequest<User>("/api/auth/me")
  } catch {
    return null
  }
}
