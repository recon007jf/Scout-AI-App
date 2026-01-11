import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getBackendUrl() {
  const raw = process.env.PYTHON_BACKEND_URL || process.env.CLOUD_RUN_BACKEND_URL || "http://" + "127.0.0.1:8000"
  const url = raw.trim()
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[Proxy] Request received at ${timestamp}`)

  const backendUrl =
    process.env.CLOUD_RUN_BACKEND_URL ||
    process.env.PYTHON_BACKEND_URL ||
    "https://" + "scout-backend-prod-283427197752.us-central1.run.app"

  console.log("[Proxy] Resolved backend URL:", backendUrl)

  const internalSecret = process.env.SCOUT_INTERNAL_SECRET

  if (!internalSecret || internalSecret.trim().length < 16) {
    console.error("[Proxy] Missing/invalid SCOUT_INTERNAL_SECRET env var.")
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 })
  }

  try {
    const body = await req.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userEmail = user?.email || "admin@pacificaisystems.com"
    const senderName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin"
    const senderTitle = user?.user_metadata?.title || "Account Executive"

    console.log("[Proxy] Authenticated user:", { email: userEmail, name: senderName, title: senderTitle })

    const rawId = body.id || body.targetId || body.dossier_id
    const dossier_id = rawId ? String(rawId) : null

    if (!dossier_id) {
      console.error("[Proxy] Validation failed: Missing dossier_id")
      return NextResponse.json({ error: "Missing dossier_id" }, { status: 400 })
    }

    const payload = {
      id: dossier_id,
      force_regenerate: Boolean(body.force_regenerate),
      comments: String(body.comments || ""),
      user_email: userEmail,
      sender_name: senderName,
      sender_title: senderTitle,
    }

    console.log("[v0] Validated payload:", JSON.stringify(payload, null, 2))

    const upstream = await fetch(`${backendUrl}/api/scout/generate-draft`, {
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

    if (!upstream.ok) {
      console.error(`[Proxy] Upstream error ${status}:`, data)
      return NextResponse.json(data, { status })
    }

    if (status === 200 || status === 202) {
      const hasSubject = data && (data.subject || data.email_subject || data.llm_email_subject)
      const hasBody = data && (data.body || data.email_body || data.llm_email_body)

      if (!hasSubject || !hasBody) {
        console.error("[Proxy] Contract violation: Backend returned 200 but missing subject or body keys")
        console.error("[Proxy] Response data:", JSON.stringify(data, null, 2))
        return NextResponse.json({ error: "Backend returned incomplete draft data" }, { status: 502 })
      }
    }

    return NextResponse.json(data, { status })
  } catch (error: any) {
    console.error("[Proxy] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
