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

    console.log("[Proxy] Authenticated user:", { email: userEmail })

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
      const llmStatus = upstream.headers.get("x-llm-status")
      const llmModel = upstream.headers.get("x-llm-model")
      const requestTrace = upstream.headers.get("x-request-trace")
      const llmLatency = upstream.headers.get("x-llm-latency-ms")
      const llmTokensOut = upstream.headers.get("x-llm-tokens-out")

      console.log("[Proxy] Backend proof headers:", {
        llmStatus,
        llmModel,
        requestTrace,
        llmLatency,
        llmTokensOut,
      })

      if (data.body_with_signature) {
        console.log("[Proxy] Upstream Body (body_with_signature):", data.body_with_signature.substring(0, 200) + "...")
      }
      if (data.body_clean) {
        console.log("[Proxy] Upstream Body (body_clean):", data.body_clean.substring(0, 200) + "...")
      }
      if (data.signature_block) {
        console.log("[Proxy] Upstream Signature Block:", data.signature_block)
      }

      // Backend returns: body_with_signature, body_clean, signature_block
      // Frontend expects: subject, body
      if (data) {
        const transformedData = {
          subject: data.subject || data.email_subject || data.llm_email_subject,
          body: data.body_with_signature || data.body || data.body_clean || data.email_body || data.llm_email_body,
          // Pass through additional metadata
          trace_id: data.trace_id || requestTrace,
          status: data.status,
          dossier_id: data.dossier_id,
        }

        console.log("[Proxy] Downstream Body (after mapping):", transformedData.body?.substring(0, 200) + "...")

        if (!transformedData.subject || !transformedData.body) {
          console.error("[Proxy] Contract violation: Backend response missing required fields")
          console.error("[Proxy] Original data:", JSON.stringify(data, null, 2))
          return NextResponse.json({ error: "Backend returned incomplete draft data" }, { status: 502 })
        }

        console.log("[Proxy] Transformed response:", {
          subject: transformedData.subject.substring(0, 50) + "...",
          bodyLength: transformedData.body.length,
          trace_id: transformedData.trace_id,
        })

        const responseHeaders = new Headers()
        if (llmStatus) responseHeaders.set("x-llm-status", llmStatus)
        if (llmModel) responseHeaders.set("x-llm-model", llmModel)
        if (requestTrace) responseHeaders.set("x-request-trace", requestTrace)
        if (llmLatency) responseHeaders.set("x-llm-latency-ms", llmLatency)
        if (llmTokensOut) responseHeaders.set("x-llm-tokens-out", llmTokensOut)

        return NextResponse.json(transformedData, { status, headers: responseHeaders })
      }
    }

    return NextResponse.json(data, { status })
  } catch (error: any) {
    console.error("[Proxy] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
