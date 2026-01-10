import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

export async function GET() {
  try {
    console.log("[v0] Stage 1: Fetching /api/outreach/status")

    const response = await makeAuthenticatedRequest("/api/outreach/status")
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
