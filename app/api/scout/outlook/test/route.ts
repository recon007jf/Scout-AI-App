import { NextResponse } from "next/server"

const CLOUD_RUN_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter required" }, { status: 400 })
    }

    const probeKey = process.env.SCOUT_INTERNAL_PROBE_KEY

    if (!probeKey) {
      return NextResponse.json({ success: false, error: "SCOUT_INTERNAL_PROBE_KEY not configured" }, { status: 500 })
    }

    const response = await fetch(`${CLOUD_RUN_URL}/api/outlook/test-connection?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "X-Scout-Internal-Probe": probeKey,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Backend test failed", details: data },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Outlook test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
