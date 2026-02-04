import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Force dynamic to prevent caching
export const dynamic = "force-dynamic"
// Extend timeout for backend calls
export const maxDuration = 60

const IS_DEV = process.env.NODE_ENV === "development"
const BACKEND_URL = IS_DEV
    ? "http://127.0.0.1:8000"
    : (process.env.CLOUD_RUN_BACKEND_URL || "https://scout-backend-prod-283427197752.us-central1.run.app")

/**
 * Proxy for /api/briefing -> Backend /api/briefing
 * Injects Clerk auth token for authenticated briefing requests.
 */
export async function GET(req: NextRequest) {
    try {
        const targetUrl = new URL("/api/briefing", BACKEND_URL)

        // Copy query params
        req.nextUrl.searchParams.forEach((value, key) => {
            targetUrl.searchParams.append(key, value)
        })

        console.log(`[Briefing Proxy] Forwarding GET to: ${targetUrl.toString()}`)

        // Prepare headers
        const headers = new Headers(req.headers)
        headers.delete("host")
        headers.delete("content-length")

        // Inject Auth Token
        const { getToken } = await auth()
        const token = await getToken()
        if (token) {
            headers.set("Authorization", `Bearer ${token}`)
            console.log("[Briefing Proxy] Injected Bearer Token")
        } else {
            console.warn("[Briefing Proxy] No token available - request may fail auth")
        }

        const response = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: headers,
        })

        console.log(`[Briefing Proxy] Backend returned ${response.status}`)

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        })

    } catch (error) {
        console.error("[Briefing Proxy] Error:", error)
        return NextResponse.json(
            { error: "Proxy Error", details: String(error) },
            { status: 500 }
        )
    }
}
