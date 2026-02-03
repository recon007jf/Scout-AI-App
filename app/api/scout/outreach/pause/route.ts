import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const url = `${backendUrl}/api/outreach/pause`

        const body = await request.json().catch(() => ({}))

        console.log("[v0] Pausing outreach via:", url)

        const response = await fetch(url, {
            method: "POST",
            cache: 'no-store',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()
        console.log("[v0] Pause Response:", JSON.stringify(data, null, 2))

        if (response.ok) {
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: "Failed to pause outreach", upstream: data }, { status: response.status })
    } catch (error) {
        console.error("[v0] Pause outreach failed:", error)
        return NextResponse.json(
            { error: "Server proxy error", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 },
        )
    }
}
