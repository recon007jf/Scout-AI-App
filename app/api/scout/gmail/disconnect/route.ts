export const dynamic = "force-dynamic"

const BACKEND_URL = "https://scout-backend-prod-283427197752.us-central1.run.app"

export async function DELETE() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gmail/connection`, {
      method: "DELETE",
      headers: {
        "X-Scout-Internal-Probe": process.env.SCOUT_INTERNAL_PROBE_KEY || "",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Gmail disconnect failed:", response.status, errorText)
      return Response.json(
        {
          success: false,
          error: "Backend error",
          details: errorText || `HTTP ${response.status}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return Response.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Gmail disconnect error:", error)
    return Response.json(
      {
        success: false,
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
