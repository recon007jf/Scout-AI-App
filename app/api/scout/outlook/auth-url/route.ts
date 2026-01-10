import { NextResponse } from "next/server"

const BACKEND_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/outlook/auth-url`, {
      method: "GET",
      headers: {
        "X-Scout-Internal-Probe": process.env.SCOUT_INTERNAL_PROBE_KEY || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Failed to get OAuth URL:", data)
      return NextResponse.json({ error: "Failed to get OAuth URL", details: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching OAuth URL:", error)
    return NextResponse.json(
      {
        error: "Server proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
