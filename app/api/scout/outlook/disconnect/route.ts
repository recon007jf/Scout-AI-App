import { NextResponse } from "next/server"

const BACKEND_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function DELETE() {
  try {
    const probeKey = process.env.SCOUT_INTERNAL_PROBE_KEY

    if (!probeKey) {
      console.error("[Outlook Disconnect] Missing SCOUT_INTERNAL_PROBE_KEY")
      return NextResponse.json({ error: "Server configuration error", details: "Missing probe key" }, { status: 500 })
    }

    const email = "andrew.oram@pointchealth.com"
    const response = await fetch(`${BACKEND_URL}/api/outlook/disconnect?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: {
        "X-Scout-Internal-Probe": probeKey,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to disconnect Outlook", details: data }, { status: response.status })
    }

    return NextResponse.json({ success: true, message: "Outlook disconnected successfully" })
  } catch (error) {
    console.error("[Outlook Disconnect] Error:", error)
    return NextResponse.json(
      {
        error: "Server proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
