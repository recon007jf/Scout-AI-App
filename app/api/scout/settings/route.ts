import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"
import type { SettingsResponse } from "@/lib/types/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("user_email")

  if (!userEmail) {
    return NextResponse.json({ error: "user_email required" }, { status: 400 })
  }

  try {
    const response = await makeAuthenticatedRequest(`/api/settings?user_email=${encodeURIComponent(userEmail)}`)

    const data: SettingsResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await makeAuthenticatedRequest(`/api/settings`, {
      method: "POST",
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to save settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
