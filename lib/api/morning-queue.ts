import { createBrowserClient } from "@/lib/supabase/client"

export interface CSVSourceTarget {
  // Database ID (internal)
  id: string

  // CSV COLUMNS (27 total - SOURCE OF TRUTH)
  SPONSOR_NAME: string
  LIVES: number
  PROVIDER_NAME_NORM: string
  PROVIDER_STATE: string
  "Contact Full Name": string
  "Contact Email": string | null
  "Contact Mobile Phone 1": number | null
  "Contact Job Title": string
  "Company Name": string
  firm_norm: string
  firm_name_raw: string
  firm_name_norm: string
  firm_state: string
  firm_state_class: string
  firm_state_method: string
  firm_state_evidence: string
  resolved_at: string
  target_firm_raw: string
  Funding_Status_Est: string
  Funding_Confidence: string
  Funding_Source: string
  LinkedIn_URL: string | null
  StopLoss_Verified: boolean | null
  StopLoss_Evidence_TypeCode: string | null
  StopLoss_Evidence_ContractName: string | null
  StopLoss_Evidence_ACK_ID: string | null
  StopLoss_Evidence_MatchMethod: string | null

  // Internal workflow columns
  status: string
  created_at: string
}

export interface MorningQueueTarget {
  id: string
  name: string // from "Contact Full Name"
  company: string // from "Company Name"
  title: string // from "Contact Job Title"
  email: string // from "Contact Email"
  phone: string // from "Contact Mobile Phone 1"
  linkedinUrl: string // from "LinkedIn_URL"

  // Company data (from CSV)
  sponsor: string // from "SPONSOR_NAME"
  lives: number // from "LIVES"
  providerName: string // from "PROVIDER_NAME_NORM"
  providerState: string // from "PROVIDER_STATE"
  firmState: string // from "firm_state"
  firmStateClass: string // from "firm_state_class"

  // Funding data (from CSV)
  fundingStatus: string // from "Funding_Status_Est"
  fundingConfidence: string // from "Funding_Confidence"
  fundingSource: string // from "Funding_Source"
  stopLossVerified: boolean // from "StopLoss_Verified"

  // Workflow
  status: string
  created_at: string
}

export const normalizeTarget = (raw: any): MorningQueueTarget => {
  return {
    id: raw?.id || "",

    // Contact info (from CSV)
    name: raw?.["Contact Full Name"] || raw?.full_name || "Unknown Contact",
    company: raw?.["Company Name"] || raw?.company || "Unknown Company",
    title: raw?.["Contact Job Title"] || raw?.title || "Unknown Title",
    email: raw?.["Contact Email"] || raw?.email || "",
    phone: raw?.["Contact Mobile Phone 1"] ? String(raw["Contact Mobile Phone 1"]) : "",
    linkedinUrl: raw?.["LinkedIn_URL"] || raw?.linkedin_url || "",

    // Company data (from CSV)
    sponsor: raw?.["SPONSOR_NAME"] || raw?.sponsor_name || "Unknown Sponsor",
    lives: raw?.["LIVES"] || raw?.lives || 0,
    providerName: raw?.["PROVIDER_NAME_NORM"] || raw?.provider_name_norm || "",
    providerState: raw?.["PROVIDER_STATE"] || raw?.provider_state || "",
    firmState: raw?.["firm_state"] || "",
    firmStateClass: raw?.["firm_state_class"] || "",

    // Funding data (from CSV)
    fundingStatus: raw?.["Funding_Status_Est"] || raw?.funding_status_est || "Unknown",
    fundingConfidence: raw?.["Funding_Confidence"] || raw?.funding_confidence || "Unknown",
    fundingSource: raw?.["Funding_Source"] || raw?.funding_source || "",
    stopLossVerified: raw?.["StopLoss_Verified"] || raw?.stoploss_verified || false,

    // Workflow
    status: raw?.status || "PENDING",
    created_at: raw?.created_at || new Date().toISOString(),
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
