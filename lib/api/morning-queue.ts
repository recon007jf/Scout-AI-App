import { createBrowserClient } from "@/lib/supabase/client"

export interface MorningQueueTarget {
  id: string
  name: string
  company: string
  title: string
  status: string
  created_at: string
  work_email?: string
  linkedinUrl: string // Made mandatory to match Target
  // Expanded fields for Dashboard compatibility
  confidence: number
  profileImage: string
  contactName: string
  email: string
  draft: {
    subject: string
    body: string
    tone: string
    wordCount: number
  } | null
  aiRationale: string
  businessPersona: {
    type: string
    description: string
    decisionStyle: string
    communicationPreference: string
  }
  dossier: {
    selfFundedPlans: {
      clientName: string
      planType: string
      enrollmentSize: number
      renewalDate?: string
      upcomingChanges?: string
    }[]
    companySize: string
    industry: string
    opportunityScore: number
    recentActivity: string[]
    painPoints: string[]
  }
}

export const normalizeTarget = (raw: any): MorningQueueTarget => {
  console.log("[v0] AUDIT RAW DB ROW:", raw)

  return {
    id: raw?.id || "",
    name: raw?.full_name || "",
    company: raw?.firm || "",
    title: raw?.role || "",
    status: raw?.status || "pending",
    created_at: raw?.created_at || new Date().toISOString(),
    work_email: raw?.email || raw?.work_email || undefined,
    linkedinUrl: raw?.linkedin_url || "",

    // Mapped Fields
    confidence: raw?.confidence || 85, // Default to high confidence
    profileImage: raw?.linkedin_image_url || raw?.profile_image || "",
    contactName: raw?.full_name || "", // Map to full_name
    email: raw?.email || raw?.work_email || "",

    draft: (raw?.llm_email_subject && raw?.llm_email_body) ? {
      subject: raw.llm_email_subject,
      body: raw.llm_email_body,
      tone: "Professional",
      wordCount: raw.llm_email_body.split(" ").length
    } : null,

    aiRationale: raw?.ai_rationale || "Strong fit based on industry alignment and role.",

    businessPersona: raw?.business_persona || {
      type: "Data-Driven Executive",
      description: "Focuses on ROI and clear metrics.",
      decisionStyle: "Analytical",
      communicationPreference: "Concise"
    },

    dossier: raw?.dossier || {
      selfFundedPlans: [],
      companySize: "Unknown",
      industry: "Unknown",
      opportunityScore: 75,
      recentActivity: [],
      painPoints: []
    }
  }
}

// ============================================================================
// ADAPTER: Backend API -> Frontend Interface
// ============================================================================

import { apiRequest } from "@/lib/api/client"
import type { BriefingResponse, BriefingTarget } from "@/lib/types/scout"

function adaptBriefingTarget(t: BriefingTarget, batchNum: number): MorningQueueTarget {
  return {
    id: t.targetId,
    // Flatten Broker info to root level per legacy interface
    name: t.broker.name,
    company: t.broker.firm,
    title: t.broker.title,
    status: t.status,
    created_at: t.createdAt,
    work_email: t.broker.email,
    linkedinUrl: t.broker.linkedIn || "", // Mandatory in Interface

    // Mapped Fields
    confidence: 85, // Default for curated list
    profileImage: t.broker.avatar || "",
    contactName: t.broker.name,
    email: t.broker.email,

    // Deep Objects (Draft, Persona, Dossier) match roughly but need precise type alignment
    draft: t.draft ? {
      subject: t.draft.subject,
      body: t.draft.body,
      tone: "Professional",
      wordCount: (t.draft.body || "").split(/\s+/).length
    } : null,

    aiRationale: t.businessPersona?.description || "Algorithm Selection",

    businessPersona: {
      type: t.businessPersona?.type || "Standard",
      description: t.businessPersona?.description || "",
      decisionStyle: t.businessPersona?.decisionStyle || "",
      communicationPreference: t.businessPersona?.communicationPreference || ""
    },

    // Dossier flattening if needed, or pass through
    dossier: {
      selfFundedPlans: [], // Not yet in backend response?
      companySize: t.sponsor?.revenue || "Unknown", // Mapping sponsor revenue to companySize
      industry: t.sponsor?.industry || "Unknown",
      opportunityScore: t.dossier?.relationshipScore || 50,
      recentActivity: t.dossier?.keyNotes || [], // Map notes to activity
      painPoints: [] // Not in backend response yet
    }
  }
}

export async function getMorningQueue(): Promise<MorningQueueTarget[]> {
  try {
    // 1. Fetch from Authoritative Backend API
    const response = await apiRequest<BriefingResponse>("/api/briefing")

    // 2. Adapt to Legacy Interface
    const rawTargets = response.targets || []

    if (rawTargets.length === 0) {
      console.log("[Queue] No briefing generated (API returned empty).")
      return []
    }

    // 3. Batch Logic (Client-Side for Phase 3)
    // We assign batch based on priority or just default to Batch 1 since backend limits to 10
    const adaptedList = rawTargets.map(t => adaptBriefingTarget(t, 1))

    return adaptedList

  } catch (error) {
    console.error("[Queue] Failed to fetch via API:", error)
    // Fail safe to empty list
    return []
  }
}

export async function approveTarget(targetId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Mock Approve Target:", targetId)
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  const supabase = createBrowserClient()

  const { error } = await supabase.from("target_brokers").update({ status: "QUEUED_FOR_SEND" }).eq("id", targetId)

  if (error) {
    throw new Error(`Failed to approve target: ${error.message}`)
  }
}

export async function skipTarget(targetId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Mock Skip Target:", targetId)
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  const supabase = createBrowserClient()

  const { error } = await supabase.from("target_brokers").update({ status: "SKIPPED" }).eq("id", targetId)

  if (error) {
    throw new Error(`Failed to skip target: ${error.message}`)
  }
}

export async function generateDraftForTarget(target: MorningQueueTarget): Promise<{ subject: string; body: string }> {
  // MOCK MODE
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Mock Generate Draft for:", target.company)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      subject: `[MOCK] Coverage Review for ${target.company}`,
      body: `Hi ${target.contactName.split(" ")[0]},\n\nThis is a mock draft generated locally for testing purposes.\n\nWe noticed some interesting activity at ${target.company} that aligns with our risk models.\n\nBest,\nAndrew`,
    }
  }

  const dossier_id = target.id

  if (!dossier_id) {
    console.error("[GenerateDraft] ❌ Missing dossier_id!")
    throw new Error("Missing Dossier ID")
  }

  console.log("[GenerateDraft] sending dossier_id=", dossier_id)
  console.log("[v0] ==> STARTING DRAFT GENERATION for target:", dossier_id)

  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dossier_id,
      targetId: dossier_id,
      force_regenerate: false,
      comments: "",
    }),
  })

  const requestTrace = response.headers.get("x-request-trace")
  const llmModel = response.headers.get("x-llm-model")

  if (requestTrace) {
    console.log("[v0] 🔍 Request Trace:", requestTrace)
  }
  if (llmModel) {
    console.log("[v0] 🤖 LLM Model:", llmModel)
  }

  console.log("[v0] API response status:", response.status)

  if (response.status === 500) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || errorData.message || "Internal server error"
    const traceId = errorData.trace_id || requestTrace || "unknown"

    console.error("[v0] 🔴 500 Error:", errorMessage, "| Trace:", traceId)

    throw new Error(`${errorMessage} (trace: ${traceId})`)
  }

  // Handle 202 Accepted (draft is generating in background)
  if (response.status === 202) {
    const data = await response.json()
    console.log("[v0] Draft generation started (202 Accepted):", data)

    // Poll every 2 seconds until draft is ready
    return await pollForDraft(dossier_id, 30)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] API error response:", errorText)
    throw new Error(`Failed to generate draft: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] ✅ API returned draft (200 OK)")

  console.log("[v0] Saving draft to database...")
  await saveDraftToDatabase(dossier_id, data.subject, data.body)
  console.log("[v0] Draft saved to database")

  return {
    subject: data.subject,
    body: data.body,
  }
}

// New polling function for async draft generation
async function pollForDraft(
  targetId: string,
  maxAttempts: number,
): Promise<{
  subject: string
  body: string
}> {
  console.log("[v0] Polling for draft completion (targetId:", targetId, ")")

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait 2 seconds before checking
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log(`[v0] Poll attempt ${attempt}/${maxAttempts}`)

    // Check if draft is ready in database
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("target_brokers")
      .select("llm_email_subject, llm_email_body")
      .eq("id", targetId)
      .single()

    if (error) {
      console.error("[v0] Poll error:", error)
      continue
    }

    if (data?.llm_email_subject && data?.llm_email_body) {
      console.log("[v0] Draft ready after", attempt, "attempts")
      return {
        subject: data.llm_email_subject,
        body: data.llm_email_body,
      }
    }
  }

  throw new Error("Draft generation timed out after 60 seconds")
}

export async function saveDraftToDatabase(targetId: string, subject: string, body: string): Promise<void> {
  console.log("[v0] saveDraftToDatabase called for:", targetId)
  const supabase = createBrowserClient()

  const { error, data } = await supabase
    .from("target_brokers")
    .update({
      llm_email_subject: subject,
      llm_email_body: body,
    })
    .eq("id", targetId)
    .select()

  console.log("[v0] Database update result:", { error, data })

  if (error) {
    console.error("[v0] ❌ Database save failed:", error)
    throw new Error(`Failed to save draft: ${error.message}`)
  }

  console.log("[v0] ✅ Database update successful")
}

export async function regenerateDraftWithFeedback(
  target: MorningQueueTarget,
  currentDraft: { subject: string; body: string },
  comments: string,
): Promise<{ subject: string; body: string }> {
  // MOCK DISABLED: Using real backend LLM for testing two-stage note classification
  console.log("[v0] Using REAL backend for guided rewrite (mock disabled)")

  const dossier_id = target.id

  if (!dossier_id) {
    console.error("[RegenerateDraftWithFeedback] ❌ Missing dossier_id!")
    throw new Error("Missing Dossier ID")
  }

  console.log("[v0] ==> REGENERATING with comments for:", dossier_id)
  console.log("[v0] User comments:", comments)

  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dossier_id,
      targetId: dossier_id,
      force_regenerate: true,
      comments: comments,
    }),
  })

  const requestTrace = response.headers.get("x-request-trace")
  const llmModel = response.headers.get("x-llm-model")

  if (requestTrace) {
    console.log("[v0] 🔍 Request Trace:", requestTrace)
  }
  if (llmModel) {
    console.log("[v0] 🤖 LLM Model:", llmModel)
  }

  console.log("[v0] Regenerate with feedback API response status:", response.status)

  if (response.status === 500) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || errorData.message || "Internal server error"
    const traceId = errorData.trace_id || requestTrace || "unknown"

    console.error("[v0] 🔴 500 Error:", errorMessage, "| Trace:", traceId)

    throw new Error(`${errorMessage} (trace: ${traceId})`)
  }

  if (response.status === 202) {
    const data = await response.json()
    console.log("[v0] Draft regeneration with feedback started (202 Accepted):", data)
    return await pollForDraft(dossier_id, 30)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Regenerate with feedback API error:", errorText)
    throw new Error(`Failed to regenerate draft with feedback: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] ✅ Regenerate with feedback API returned draft (200 OK)")

  console.log("[v0] Saving draft with feedback to database...")
  await saveDraftToDatabase(dossier_id, data.subject, data.body)
  console.log("[v0] Draft with feedback saved")

  return {
    subject: data.subject,
    body: data.body,
  }
}

export async function regenerateDraft(target: MorningQueueTarget): Promise<{ subject: string; body: string }> {
  // MOCK MODE
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Mock Regenerate Draft")
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return {
      subject: `Fresh Perspective for ${target.company}`,
      body: `Hi ${target.contactName.split(" ")[0]},\n\nI'm reaching out with a completely fresh perspective on ${target.company}'s risk profile.\n\nOur AI has identified new patterns that suggest an immediate conversation is warranted.\n\nBest,\nAndrew`,
    }
  }

  const dossier_id = target.id

  if (!dossier_id) {
    console.error("[RegenerateDraft] ❌ Missing dossier_id!")
    throw new Error("Missing Dossier ID")
  }

  console.log("[RegenerateDraft] sending dossier_id=", dossier_id)
  console.log("[v0] ==> FORCE REGENERATING draft for:", dossier_id)

  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dossier_id,
      targetId: dossier_id,
      force_regenerate: true,
      comments: "",
    }),
  })

  const requestTrace = response.headers.get("x-request-trace")
  const llmModel = response.headers.get("x-llm-model")

  if (requestTrace) {
    console.log("[v0] 🔍 Request Trace:", requestTrace)
  }
  if (llmModel) {
    console.log("[v0] 🤖 LLM Model:", llmModel)
  }

  console.log("[v0] Regenerate API response status:", response.status)

  if (response.status === 500) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || errorData.message || "Internal server error"
    const traceId = errorData.trace_id || requestTrace || "unknown"

    console.error("[v0] 🔴 500 Error:", errorMessage, "| Trace:", traceId)

    throw new Error(`${errorMessage} (trace: ${traceId})`)
  }

  if (response.status === 202) {
    const data = await response.json()
    console.log("[v0] Draft regeneration started (202 Accepted):", data)
    return await pollForDraft(dossier_id, 30)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Regenerate API error:", errorText)
    throw new Error(`Failed to regenerate draft: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] ✅ Regenerate API returned draft (200 OK)")

  console.log("[v0] Saving regenerated draft to database...")
  await saveDraftToDatabase(dossier_id, data.subject, data.body)
  console.log("[v0] Regenerated draft saved")

  return {
    subject: data.subject,
    body: data.body,
  }
}

async function checkExistingDraft(targetId: string): Promise<{ llm_email_subject?: string; llm_email_body?: string }> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("target_brokers")
    .select("llm_email_subject, llm_email_body")
    .eq("id", targetId)
    .single()

  if (error) {
    console.error("[v0] ❌ Error fetching existing draft:", error)
    throw new Error(`Failed to fetch existing draft: ${error.message}`)
  }

  return data || {}
}
