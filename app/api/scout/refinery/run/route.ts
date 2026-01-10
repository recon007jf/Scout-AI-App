import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit") || "50"

    const response = await makeAuthenticatedRequest(`/api/refinery/run?limit=${limit}`, {
      method: "POST",
      body: JSON.stringify({}),
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json(
        { success: false, error: data.error || "Failed to trigger refinery" },
        { status: response.status },
      )
    }

    return Response.json({ success: true, message: "Refinery triggered successfully", data })
  } catch (error) {
    console.error("Refinery trigger error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
