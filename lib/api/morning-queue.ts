import { createBrowserClient } from "@/lib/supabase/client"

export interface MorningQueueTarget {
  id: string
  name: string
  company: string
  title: string
  status: string
  created_at: string
  work_email?: string
  linkedinUrl?: string
  region?: string
  tier?: string
  email_subject?: string
  email_body?: string
}

export const normalizeTarget = (raw: any): MorningQueueTarget => {
  console.log("[v0] AUDIT RAW DB ROW:", raw)

  return {
    id: raw?.id || "",
    name: raw?.full_name || "",
    company: raw?.firm || "",
    title: raw?.role || "",
    status: raw?.status || "PENDING",
    created_at: raw?.created_at || new Date().toISOString(),
    work_email: raw?.work_email || undefined,
    linkedinUrl: raw?.linkedin_url || undefined,
    region: raw?.region || undefined,
    tier: raw?.tier || undefined,
    email_subject: raw?.llm_email_subject || undefined,
    email_body: raw?.llm_email_body || undefined,
  }
}

export async function getMorningQueue(): Promise<MorningQueueTarget[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from("target_brokers")
    .select("*")
    .in("status", ["ENRICHED", "DRAFT_READY"])
    .order("created_at", { ascending: true })
    .limit(10)

  if (error) {
    throw new Error(`Failed to fetch morning queue: ${error.message}`)
  }

  if (!data) {
    return []
  }

  return data.map(normalizeTarget)
}

export async function approveTarget(targetId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("target_brokers").update({ status: "QUEUED_FOR_SEND" }).eq("id", targetId)

  if (error) {
    throw new Error(`Failed to approve target: ${error.message}`)
  }
}

export async function skipTarget(targetId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("target_brokers").update({ status: "SKIPPED" }).eq("id", targetId)

  if (error) {
    throw new Error(`Failed to skip target: ${error.message}`)
  }
}

export async function generateDraftForTarget(target: MorningQueueTarget): Promise<{ subject: string; body: string }> {
  console.log("[v0] === STARTING DRAFT GENERATION for target:", target.id)
  console.log("[v0] Target data:", { name: target.name, company: target.company, title: target.title })

  const response = await fetch("/api/scout/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: target.id,
      name: target.name,
      company: target.company,
      title: target.title,
      region: target.region,
      tier: target.tier,
    }),
  })

  console.log("[v0] API response status:", response.status)

  // Handle 202 Accepted (draft is generating in background)
  if (response.status === 202) {
    const data = await response.json()
    console.log("[v0] Draft generation started (202 Accepted):", data)

    // Poll every 2 seconds until draft is ready
    return await pollForDraft(target.id, 30) // 30 attempts = 60 seconds max
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] API error response:", errorText)
    throw new Error(`Failed to generate draft: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] API returned draft (200 OK):", data)

  // Save draft to database for persistence
  console.log("[v0] Saving draft to database...")
  await saveDraftToDatabase(target.id, data.subject, data.body)
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
  feedback: string,
): Promise<{ subject: string; body: string }> {
  console.log("[v0] Regenerating draft with feedback for target:", target.id)
  console.log("[v0] Feedback:", feedback)

  const response = await fetch("/api/scout/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: target.id,
      name: target.name,
      company: target.company,
      title: target.title,
      region: target.region,
      tier: target.tier,
      currentDraft,
      feedback,
    }),
  })

  console.log("[v0] API response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] API error response:", errorText)
    throw new Error(`Failed to regenerate draft: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] API returned draft (200 OK):", data)

  // Save draft to database for persistence
  console.log("[v0] Saving draft to database...")
  await saveDraftToDatabase(target.id, data.subject, data.body)
  console.log("[v0] Draft saved to database")

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
