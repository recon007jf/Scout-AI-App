import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"
import type { DraftActionResponse } from "@/lib/types/api"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.user_email || !body.dossier_id || !body.action) {
      return NextResponse.json({ error: "user_email, dossier_id, and action required" }, { status: 400 })
    }

    const response = await makeAuthenticatedRequest(`/api/drafts/action`, {
      method: "POST",
      body: JSON.stringify(body),
    })

    const data: DraftActionResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to execute draft action:", error)
    return NextResponse.json({ error: "Failed to execute draft action" }, { status: 500 })
  }
}
