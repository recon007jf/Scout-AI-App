import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  try {
    const { targetId, name, company, title, region, tier } = await req.json()

    if (!name || !company) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const prompt = `You are a sales development representative at Pacific AI Systems, a benefits advisory firm.

Write a personalized outreach email to:
- Name: ${name}
- Title: ${title || "Benefits Decision Maker"}
- Company: ${company}
- Region: ${region || "Unknown"}
- Tier: ${tier || "Unknown"}

The email should:
1. Be professional but warm and conversational
2. Reference their role and company context
3. Highlight a relevant pain point in benefits administration
4. Offer a specific value proposition related to Scout AI
5. Include a clear, low-friction call to action
6. Be 150-200 words maximum

Return ONLY a JSON object with this structure:
{
  "subject": "email subject line here",
  "body": "email body here"
}

Do not include any other text or explanation.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse the generated JSON
    const draft = JSON.parse(text.trim())

    return NextResponse.json({
      targetId,
      subject: draft.subject,
      body: draft.body,
    })
  } catch (error: any) {
    console.error("[Generate Draft] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate draft" }, { status: 500 })
  }
}
