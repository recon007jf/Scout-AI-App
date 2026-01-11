import { createBrowserClient } from "@/lib/supabase/client"

export interface MorningQueueTarget {
  id: string
  name: string
  company: string
  title: string
  subject: string
  message: string
  status: string
  created_at: string
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

  return data.map((row: any) => ({
    id: row.id,
    name: row.full_name || "Unknown",
    company: row.firm || "Unknown",
    title: row.role || "Unknown",
    subject: row.generated_subject_line || "No subject",
    message: row.generated_email_body || "No message",
    status: row.status,
    created_at: row.created_at,
  }))
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
