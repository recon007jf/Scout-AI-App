import { createBrowserClient } from "@/lib/supabase/client"

export interface MorningQueueTarget {
  id: string
  name: string
  company: string
  title: string
  status: string
  created_at: string
  work_email?: string
  linkedin_url?: string
  region?: string
  tier?: string
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
    linkedin_url: raw?.linkedin_url || undefined,
    region: raw?.region || undefined,
    tier: raw?.tier || undefined,
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

export async function generateDraftForTarget(target: MorningQueueTarget): Promise<{
  subject: string
  body: string
}> {
  const response = await fetch("/api/generate-draft", {
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

  if (!response.ok) {
    throw new Error("Failed to generate draft")
  }

  const data = await response.json()
  return {
    subject: data.subject,
    body: data.body,
  }
}
