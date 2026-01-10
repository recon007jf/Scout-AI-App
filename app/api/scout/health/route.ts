import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

export async function GET() {
  try {
    console.log("[v0] Stage 0: Testing /health endpoint")

    const response = await makeAuthenticatedRequest("/health")

    console.log("[v0] Upstream Status:", response.status)

    // Parse response body
    const data = await response.json().catch((e) => {
      console.error("[v0] Failed to parse health response:", e)
      return { error: "Invalid JSON response from upstream" }
    })

    console.log("[v0] Health Response:", JSON.stringify(data, null, 2))

    if (response.ok) {
      return NextResponse.json({
        success: true,
        upstream: data,
        message: "Stage 0 Complete: Server-to-Server auth working",
      })
    }

    return NextResponse.json(
      {
        error: "Upstream health check failed",
        upstream: data,
        status: response.status,
        statusText: response.statusText,
      },
      { status: response.status },
    )
  } catch (error) {
    console.error("[v0] Health check failed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: "Server proxy error",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
