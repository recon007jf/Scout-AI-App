import { NextResponse } from "next/server"

const BACKEND_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function DELETE() {
  try {
    const probeKey = process.env.SCOUT_INTERNAL_PROBE_KEY
    if (!probeKey) {
      return NextResponse.json({ error: "Server configuration error", details: "Missing probe key" }, { status: 500 })
    }

    const response = await fetch(`${BACKEND_URL}/api/crm/disconnect`, {
      method: "DELETE",
      headers: {
        "X-Scout-Internal-Probe": probeKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: "Backend disconnect failed", details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[CRM Disconnect Error]", error)
    return NextResponse.json(
      {
        error: "Server proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
