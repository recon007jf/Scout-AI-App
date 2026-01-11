import { NextResponse } from "next/server"

function getBackendUrl() {
  const raw = process.env.PYTHON_BACKEND_URL || process.env.CLOUD_RUN_BACKEND_URL || "http://" + "127.0.0.1:8000"
  const url = raw.trim()
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export async function POST(req: Request) {
  const backendUrl = getBackendUrl()
  const internalSecret = process.env.SCOUT_INTERNAL_SECRET

  console.log("=== DRAFT GENERATION PROXY DEBUG ===")
  console.log("Environment:", process.env.VERCEL_ENV || "local")
  console.log("Resolved Backend URL:", backendUrl)
  console.log("Target Endpoint:", `${backendUrl}/api/drafts/action`)
  console.log("Secret Header Present:", internalSecret ? "yes" : "no")
  console.log("====================================")

  if (!internalSecret || internalSecret.trim().length < 16) {
    console.error("[Proxy] Missing/invalid SCOUT_INTERNAL_SECRET env var.")
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 })
  }

  try {
    const body = await req.json()

    const rawId = body.id || body.targetId || body.dossier_id
    const dossier_id = rawId ? String(rawId) : null

    if (!dossier_id) {
      console.error("[Proxy] Validation failed: Missing dossier_id")
      return NextResponse.json({ error: "Missing dossier_id" }, { status: 400 })
    }

    const payload = {
      dossier_id: dossier_id,
      action: "generate",
      user_email: body.user_email || "admin@pacificaisystems.com",
      // Include optional fields if present
      draft_content: body.draft_content || body.currentDraft?.body || body.feedback,
      draft_subject: body.draft_subject || body.currentDraft?.subject,
    }

    console.log("[v0] Validated payload:", JSON.stringify(payload, null, 2))

    const upstream = await fetch(`${backendUrl}/api/drafts/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-scout-internal-secret": internalSecret.trim(),
      },
      body: JSON.stringify(payload),
    })

    const status = upstream.status
    const contentType = upstream.headers.get("content-type") || ""

    let data: any = null
    if (contentType.includes("application/json")) {
      data = await upstream.json()
    } else {
      const text = await upstream.text()
      data = { error: text || "Upstream returned non-JSON response." }
    }

    if (!upstream.ok) console.error(`[Proxy] Upstream error ${status}:`, data)

    return NextResponse.json(data, { status })
  } catch (err) {
    console.error("[Proxy] Fatal error contacting draft service:", err)
    return NextResponse.json({ error: "Draft service unreachable." }, { status: 503 })
  }
}
