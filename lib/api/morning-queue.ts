cks oimport { createBrowserClient } from "@/lib/supabase/client"

export interface MorningQueueTarget {
  id: string
  name: string
  title: string
  company: string
  confidence: "high" | "medium" | "low"
  avatarUrl?: string
  linkedinUrl?: string
  reason: string
  draftSubject: string
  draftBody: string
  status: string
}

/**
 * PRODUCTION FIFO PRIORITY QUEUE
 * Fetch the NEXT 10 items ready for review from a massive database
 * Behaves like a high-volume queue, not a static list
 */
export async function getMorningQueue(): Promise<MorningQueueTarget[]> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("No authenticated user")
  }

  const { data, error } = await supabase
    .from("target_brokers")
    .select("*")
    .in("status", ["ENRICHED", "DRAFT_READY"])
    .order("created_at", { ascending: true })
    .limit(10)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((row) => ({
    id: row.id,
    name: row.full_name || "Unknown",
    title: row.role || "Broker",
    company: row.firm || "Unknown Firm",
    confidence: row.verification_status === "verified" ? "high" : "medium",
    linkedinUrl: row.linkedin_url || undefined,
    reason: row.risk_profile
      ? `Risk Profile: ${row.risk_profile}${row.base_archetype ? ` | Archetype: ${row.base_archetype}` : ""}`
      : "Analysis pending",
    draftSubject: row.generated_subject_line || "Analysis Complete • Pending Strategy...",
    draftBody: row.generated_email_body || "Draft content is being generated...",
    status: row.status,
  }))
}

/**
 * Approve target and queue for sending
 * UI does not send - it sets status to QUEUED_FOR_SEND
 * Backend watches for this status change and sends
 */
export async function approveTarget(id: string, finalSubject: string, finalBody: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from("target_brokers")
    .update({
      status: "QUEUED_FOR_SEND",
      draft_subject: finalSubject,
      draft_body: finalBody,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw error
  }
}

/**
 * Skip/archive target
 */
export async function skipTarget(id: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from("target_brokers")
    .update({
      status: "ARCHIVED",
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw error
  }
}
