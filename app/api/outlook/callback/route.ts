
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic to prevent caching
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.CLOUD_RUN_BACKEND_URL || "https://scout-backend-prod-283427197752.us-central1.run.app"

// ALIAS: Matches /api/outlook/callback (Legacy/Direct Path possibility)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const code = searchParams.get("code")

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 })
        }

        // Construct target URL for the backend
        const targetUrl = new URL("/api/outlook/callback", BACKEND_URL)
        targetUrl.searchParams.set("code", code)

        console.log(`[Outlook Callback Alias] Proxying to: ${targetUrl.toString()}`)

        const response = await fetch(targetUrl.toString(), {
            method: "GET",
            // We manually handle the redirect so we can pass it back to the client
            redirect: "manual",
        })

        // Create a new response with the backend's status and headers
        const newResponse = new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
        })

        // Explicitly copy the Location header if it exists (for the redirect)
        const location = response.headers.get("Location")
        if (location) {
            newResponse.headers.set("Location", location)
        }

        return newResponse

    } catch (error) {
        console.error("[Outlook Callback Alias] Proxy Error:", error)
        return NextResponse.json(
            { error: "Callback Proxy Failed", details: String(error) },
            { status: 500 }
        )
    }
}
