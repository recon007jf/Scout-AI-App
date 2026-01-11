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
  // Adding console audit to inspect raw database response
  console.log("AUDIT ROW:", raw)

  return {
    id: raw?.id || "",

    // Mapping from snake_case DB columns (Supabase auto-conversion) with CSV fallback
    // Contact info - prioritize snake_case DB columns
    name: raw?.contact_full_name || raw?.["Contact Full Name"] || "",
    company: raw?.company_name || raw?.["Company Name"] || "",
    title: raw?.contact_job_title || raw?.["Contact Job Title"] || "",
    email: raw?.contact_email || raw?.["Contact Email"] || "",
    phone: raw?.contact_mobile_phone_1
      ? String(raw.contact_mobile_phone_1)
      : raw?.["Contact Mobile Phone 1"]
        ? String(raw["Contact Mobile Phone 1"])
        : "",
    linkedinUrl: raw?.linkedin_url || raw?.["LinkedIn_URL"] || "",

    // Company data - prioritize snake_case DB columns
    sponsor: raw?.sponsor_name || raw?.["SPONSOR_NAME"] || "",
    lives: raw?.lives || raw?.LIVES || 0,
    providerName: raw?.provider_name_norm || raw?.["PROVIDER_NAME_NORM"] || "",
    providerState: raw?.provider_state || raw?.["PROVIDER_STATE"] || "",
    firmState: raw?.firm_state || "",
    firmStateClass: raw?.firm_state_class || "",

    // Funding data - prioritize snake_case DB columns
    fundingStatus: raw?.funding_status_est || raw?.["Funding_Status_Est"] || "",
    fundingConfidence: raw?.funding_confidence || raw?.["Funding_Confidence"] || "",
    fundingSource: raw?.funding_source || raw?.["Funding_Source"] || "",
    stopLossVerified: raw?.stoploss_verified ?? raw?.["StopLoss_Verified"] ?? false,

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
