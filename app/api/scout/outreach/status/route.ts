import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check multiple env vars - NEXT_PUBLIC_ vars may not be available server-side in some cases
    const backendUrl = process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const url = `${backendUrl}/api/outreach/status`

    console.log("[v0] Fetching outreach status from:", url)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    console.log("[v0] Outreach Status Response:", JSON.stringify(data, null, 2))

    if (response.ok) {
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Failed to fetch outreach status", upstream: data }, { status: response.status })
  } catch (error) {
    console.error("[v0] Outreach status fetch failed:", error)
    return NextResponse.json(
      { error: "Server proxy error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
