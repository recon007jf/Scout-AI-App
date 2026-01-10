import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidate_id, final_subject, final_body, user_email } = body

    if (!candidate_id || !final_subject || !final_body || !user_email) {
      return Response.json(
        { success: false, error: "Missing required fields: candidate_id, final_subject, final_body, user_email" },
        { status: 400 },
      )
    }

    const response = await makeAuthenticatedRequest("/api/email/send", {
      method: "POST",
      body: JSON.stringify({
        candidate_id,
        final_subject,
        final_body,
        user_email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json({ success: false, error: data.error || "Failed to send email" }, { status: response.status })
    }

    return Response.json({ success: true, message: "Email sent successfully", data })
  } catch (error) {
    console.error("Email send error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
