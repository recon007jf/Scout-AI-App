import { createBrowserClient } from "@/lib/supabase/client"

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
 * Fetch morning queue targets directly from Supabase target_brokers table
 * NO API endpoints - direct database query
 */
export async function getMorningQueue(): Promise<MorningQueueTarget[]> {
  const supabase = createBrowserClient()

  // 1. Get current user (Source of Truth)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("[Morning Queue] No authenticated user")
    return []
  }

  // 2. Query the Operational Table - targets ready for review
  const { data, error } = await supabase
    .from("target_brokers")
    .select("*")
    .in("status", ["ENRICHED", "DRAFT_READY", "READY_TO_PROCESS"])
    .order("created_at", { ascending: false })
    .limit(10) // STRICT LIMIT

  if (error) {
    console.error("[Morning Queue] Fetch Error:", error)
    throw error
  }

  console.log("[Morning Queue] Fetched rows:", data?.length || 0)

  // 3. Map DB Columns to UI Props
  return (data || []).map((row) => ({
    id: row.id,
    name: row.full_name || "Unknown",
    title: row.role || "Broker",
    company: row.firm || "Unknown Firm",

    // Map verification_status to confidence level
    confidence: row.verification_status === "verified" ? "high" : "medium",

    // LinkedIn URL if available
    linkedinUrl: row.linkedin_url || undefined,

    // Construct reason from available data
    reason: row.risk_profile
      ? `Risk Profile: ${row.risk_profile}${row.base_archetype ? ` | Archetype: ${row.base_archetype}` : ""}`
      : "Analysis pending",

    // Handle "Writer Hasn't Run Yet" scenario
    draftSubject: row.draft_subject || "Analysis Complete • Pending Strategy...",
    draftBody: row.draft_body || "Draft content is being generated...",

    // Pass raw status for logic
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
    console.error("[Morning Queue] Approve Error:", error)
    throw error
  }

  console.log("[Morning Queue] Target approved:", id)
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
    console.error("[Morning Queue] Skip Error:", error)
    throw error
  }

  console.log("[Morning Queue] Target skipped:", id)
}
