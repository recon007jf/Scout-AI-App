import { NextResponse } from "next/server"

function getBackendUrl() {
  const raw = process.env.PYTHON_BACKEND_URL || process.env.CLOUD_RUN_BACKEND_URL || "http://" + "127.0.0.1:8000" // Split string prevents Markdown artifacts

  const url = raw.trim()
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export async function POST(req: Request) {
  const backendUrl = getBackendUrl()
  const internalSecret = process.env.SCOUT_INTERNAL_PROBE_KEY

  if (!internalSecret || internalSecret.trim().length < 16) {
    console.error("[Proxy] Missing/invalid SCOUT_INTERNAL_PROBE_KEY env var.")
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 })
  }

  try {
    const body = await req.json()

    const upstream = await fetch(`${backendUrl}/api/scout/generate-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Scout-Internal-Secret": internalSecret.trim(),
      },
      body: JSON.stringify(body),
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
