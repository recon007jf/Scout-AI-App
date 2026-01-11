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

export async function generateDraftForTarget(target: MorningQueueTarget): Promise<{
  subject: string
  body: string
}> {
  const supabase = createBrowserClient()
  const { data: existingDraft } = await supabase
    .from("target_brokers")
    .select("llm_email_subject, llm_email_body")
    .eq("id", target.id)
    .single()

  // If LLM draft already exists, return it (don't regenerate)
  if (existingDraft?.llm_email_subject && existingDraft?.llm_email_body) {
    console.log("[v0] Using existing LLM draft for target:", target.id)
    return {
      subject: existingDraft.llm_email_subject,
      body: existingDraft.llm_email_body,
    }
  }

  console.log("[v0] Generating NEW LLM draft for target:", target.id)
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

  await saveDraftToDatabase(target.id, data.subject, data.body)

  return {
    subject: data.subject,
    body: data.body,
  }
}

export async function saveDraftToDatabase(targetId: string, subject: string, body: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from("target_brokers")
    .update({
      llm_email_subject: subject,
      llm_email_body: body,
    })
    .eq("id", targetId)

  if (error) {
    throw new Error(`Failed to save draft: ${error.message}`)
  }
}

export async function regenerateDraftWithFeedback(
  target: MorningQueueTarget,
  currentDraft: { subject: string; body: string },
  userFeedback: string,
): Promise<{
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
      currentDraft,
      userFeedback,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to regenerate draft")
  }

  const data = await response.json()

  await saveDraftToDatabase(target.id, data.subject, data.body)

  return {
    subject: data.subject,
    body: data.body,
  }
}
