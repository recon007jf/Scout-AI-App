import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"
import type { SignalsResponse } from "@/lib/types/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("user_email")

    if (!userEmail) {
      return NextResponse.json({ error: "user_email required" }, { status: 400 })
    }

    const response = await makeAuthenticatedRequest(`/api/signals?user_email=${encodeURIComponent(userEmail)}`)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data: SignalsResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Failed to fetch signals:", error)
    return NextResponse.json({ error: "Failed to fetch signals", signals: [] }, { status: 500 })
  }
}
