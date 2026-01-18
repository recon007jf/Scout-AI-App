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
    work_email: raw?.work_email || undefined,
    linkedinUrl: raw?.linkedin_url || "",

    // Mapped Fields
    confidence: raw?.confidence || 85, // Default to high confidence
    profileImage: raw?.profile_image || "",
    contactName: raw?.full_name || "", // Map to full_name
    email: raw?.work_email || "",

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

export async function getMorningQueue(): Promise<MorningQueueTarget[]> {
  // MOCK MODE: Bypass Supabase in development to ensure stable UI testing
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Using MOCK DATA for Morning Queue (Dev Mode)")
    const { mockTargets } = await import("./mock/morning-coffee")
    // Simulate network delay
    return new Promise((resolve) => setTimeout(() => resolve(mockTargets), 600))
  }

  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from("target_brokers")
    .in("status", ["ENRICHED", "DRAFT_READY", "SENT", "QUEUED_FOR_SEND", "FAILED", "SKIPPED"])
    .order("created_at", { ascending: true })
    .order("id", { ascending: true }) // STABLE SORT: Tie-breaker for batch uploads
    .limit(50) // Increased limit to see history

  if (error) {
    throw new Error(`Failed to fetch morning queue: ${error.message}`)
  }

  if (!data) {
    return []
  }

  // --- HARD GATE ENFORCEMENT ---
  // https://github.com/StartUp-Inc/Scout/issues/CONTRACT-001
  // We filter out any target that violates the P0 "Morning Briefing Contract".
  const normalized = data.map(normalizeTarget)

  const eligible = normalized.filter(t => {
    // 1. Identity
    if (!t.name || !t.work_email || !t.linkedinUrl) {
      console.log(`[Queue] 🚫 Dropped ${t.name} (Missing Identity)`)
      return false
    }
    // 2. Context
    if (!t.company || !t.title) {
      console.log(`[Queue] 🚫 Dropped ${t.name} (Missing Context)`)
      return false
    }
    // 6. Draft Readiness (Zero-Latency Rule)
    if (!t.draft?.subject || !t.draft?.body) {
      console.log(`[Queue] 🚫 Dropped ${t.name} (Not Draft Ready)`)
      // NOTE: We could auto-trigger generation here if we wanted, but for now we block.
      return false
    }

    return true
  })


  // --- QUEUE FLOW LOGIC (Batch Clearing Rule) ---
  // User Requirement: "No more candidates come in... until all 10 are marked as sent"
  // Logic: Divide into batches of 10. Show only the CURRENT batch until it's exhausted.

  const SENT_STATUSES = ["SENT", "QUEUED_FOR_SEND", "REPLIED", "OOO", "BOUNCED", "SKIPPED"]

  // 1. Separate History (Always show Sent items for context)
  const historyItems = eligible.filter((t: any) => SENT_STATUSES.includes(t.status))

  // 2. Determine Current Batch from ALL eligible items (to maintain stable ordering)
  // We cannot just look at 'activeItems' because that loses the concept of "Batch 1 vs Batch 2".
  // We must look at the ORIGINAL list order.
  const BATCH_SIZE = 10
  let visibleActive: MorningQueueTarget[] = []

  // Iterate through chunks of 10
  // Iterate through chunks of 10 to find the "Current active batch"
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const currentBatch = eligible.slice(i, i + BATCH_SIZE)
    const hasUnsent = currentBatch.some((t: any) => !SENT_STATUSES.includes(t.status))

    // If this batch has work remaining (or is the last available batch), it is the "Current Batch"
    // We show this batch AND the one immediately before it (the buffer).
    if (hasUnsent || i + BATCH_SIZE >= eligible.length) {

      // Get the Immediately Preceding Batch (if it exists)
      // This satisfies "Batch 2 Loaded: 10 Active / 10 Sent (Total 20)"
      const startOfPrevious = Math.max(0, i - BATCH_SIZE)
      const previousBatch = (i > 0) ? eligible.slice(startOfPrevious, i) : []

      const visibleSet = [...previousBatch, ...currentBatch]

      console.log(`[Queue] Locked to Batch ${i / BATCH_SIZE + 1}. Visible: ${visibleSet.length} (Prev: ${previousBatch.length}, Curr: ${currentBatch.length})`)
      return visibleSet
    }
  }

  console.log(`[Queue] History: ${historyItems.length}, Active (Count): ${visibleActive.length}`)

  return [...historyItems, ...visibleActive]
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
  // MOCK MODE
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Mock Regenerate with Feedback:", comments)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      subject: `[UPDATED] ${currentDraft.subject}`,
      body: `Hi ${target.contactName.split(" ")[0]},\n\n(Updated based on feedback: "${comments}")\n\nHere is the revised draft incorporating your specific notes regarding ${target.company}.\n\nBest,\nAndrew`,
    }
  }

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
      subject: `[REGENERATED] Fresh Perspective for ${target.company}`,
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
