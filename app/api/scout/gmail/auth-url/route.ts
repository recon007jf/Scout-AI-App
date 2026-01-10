import { NextResponse } from "next/server"

const BACKEND_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function GET() {
  try {
    const probeKey = process.env.SCOUT_INTERNAL_PROBE_KEY

    if (!probeKey) {
      return NextResponse.json({ error: "Server configuration error", details: "Missing probe key" }, { status: 500 })
    }

    const response = await fetch(`${BACKEND_URL}/api/gmail/auth-url`, {
      method: "GET",
      headers: {
        "X-Scout-Internal-Probe": probeKey,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Backend request failed", details: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Gmail auth-url proxy error:", error)
    return NextResponse.json({ error: "Server proxy error", details: String(error) }, { status: 500 })
  }
}
