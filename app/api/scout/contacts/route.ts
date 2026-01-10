import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"
import type { ContactsResponse } from "@/lib/types/api"

// v2.0 - Uses runtime URL resolution
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("page_size") || "50"
    const userEmail = searchParams.get("user_email")

    if (!userEmail) {
      return NextResponse.json({ error: "user_email required" }, { status: 400 })
    }

    const response = await makeAuthenticatedRequest(
      `/api/contacts?user_email=${encodeURIComponent(userEmail)}&page=${page}&page_size=${pageSize}`,
    )

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data: ContactsResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v2.0] Failed to fetch contacts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts", contacts: [], pagination: { page: 1, page_size: 50, total: 0 } },
      { status: 500 },
    )
  }
}
