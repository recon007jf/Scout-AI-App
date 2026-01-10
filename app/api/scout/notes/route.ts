import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"
import type { NoteResponse } from "@/lib/types/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dossierId = searchParams.get("dossier_id")
  const userEmail = searchParams.get("user_email")

  if (!dossierId || !userEmail) {
    return NextResponse.json({ error: "dossier_id and user_email required" }, { status: 400 })
  }

  try {
    const response = await makeAuthenticatedRequest(
      `/api/notes?dossier_id=${dossierId}&user_email=${encodeURIComponent(userEmail)}`,
    )

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.user_email || !body.dossier_id || !body.note_text) {
      return NextResponse.json({ error: "user_email, dossier_id, and note_text required" }, { status: 400 })
    }

    const response = await makeAuthenticatedRequest(`/api/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    })

    const data: NoteResponse = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to create note:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
