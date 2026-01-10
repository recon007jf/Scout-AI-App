import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

function redactPII(data: any): any {
  if (!data || typeof data !== "object") return data

  const redacted = Array.isArray(data) ? [...data] : { ...data }

  for (const key in redacted) {
    const value = redacted[key]

    // Redact email addresses
    if (typeof value === "string" && value.includes("@")) {
      redacted[key] = value.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)/g, "***@***.com")
    }

    // Redact phone numbers (various formats)
    if (typeof value === "string" && /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(value)) {
      redacted[key] = "***-***-****"
    }

    // Recursively redact nested objects
    if (typeof value === "object" && value !== null) {
      redacted[key] = redactPII(value)
    }
  }

  return redacted
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("user_email")

    if (!userEmail) {
      return NextResponse.json({ error: "user_email required" }, { status: 400 })
    }

    console.log("[v0] ===== STAGE 2: BRIEFING DATA TEST =====")

    const response = await makeAuthenticatedRequest(`/api/briefing?user_email=${encodeURIComponent(userEmail)}`)

    const responseText = await response.text()

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Failed to parse backend response as JSON")
      const safeText = responseText.substring(0, 200).replace(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/g, "***@***.com")
      return NextResponse.json({ error: "Backend returned invalid JSON", raw: safeText }, { status: 502 })
    }

    console.log("[v0] ===== RAW BRIEFING PAYLOAD (PII REDACTED FOR GEMINI) =====")
    console.log(JSON.stringify(redactPII(data), null, 2))
    console.log("[v0] ===== END SANITIZED PAYLOAD =====")

    if (response.ok) {
      const adapted = adaptBriefingResponse(data)
      return NextResponse.json(adapted)
    }

    return NextResponse.json({ error: "Failed to fetch briefing", upstream: data }, { status: response.status })
  } catch (error) {
    console.error("[v0] ===== BRIEFING FETCH ERROR =====")
    console.error(error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { error: "Server proxy error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

function adaptBriefingResponse(data: any): any {
  if (!data || !data.dossiers) {
    return data
  }

  return {
    dossiers: data.dossiers.map((dossier: any) => ({
      dossier_id: dossier.dossier_id,
      contact: dossier.contact,
      draft: dossier.draft,
      notes: dossier.notes || [],
    })),
  }
}
