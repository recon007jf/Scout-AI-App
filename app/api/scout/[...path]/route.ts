import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Force dynamic to prevent caching of proxy requests
export const dynamic = "force-dynamic"

// Force localhost in development, otherwise use Env Var or Default to Prod
const IS_DEV = process.env.NODE_ENV === "development"
const BACKEND_URL = IS_DEV
    ? "http://127.0.0.1:8000"
    : (process.env.CLOUD_RUN_BACKEND_URL || "https://scout-backend-prod-283427197752.us-central1.run.app")

async function handler(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    try {
        const params = await props.params
        const { path } = params

        // Construct target URL
        // e.g. /api/scout/outlook/auth-url -> https://backend.../api/scout/outlook/auth-url
        // path is ["outlook", "auth-url"]
        const backendPath = path.join("/")
        const targetUrl = new URL(`/api/scout/${backendPath}`, BACKEND_URL)

        // Copy query params
        req.nextUrl.searchParams.forEach((value, key) => {
            targetUrl.searchParams.append(key, value)
        })

        console.log(`[Proxy] Forwarding ${req.method} request to: ${targetUrl.toString()}`)

        // Prepare headers
        const headers = new Headers(req.headers)
        headers.delete("host") // Let fetch set the host
        headers.delete("content-length") // Let fetch handle this

        // Inject Auth Token
        const { getToken } = await auth()
        const token = await getToken()
        if (token) {
            headers.set("Authorization", `Bearer ${token}`)
            // console.log("[Proxy] Injected Bearer Token")
        }

        // Forward request
        const response = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: headers,
            body: req.body,
            // @ts-ignore - duplexe is needed for streaming but typescript might complain
            duplex: "half",
        })

        // Stream response back
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        })

    } catch (error) {
        console.error("[Proxy] Error:", error)
        return NextResponse.json(
            { error: "Proxy Error", details: String(error) },
            { status: 500 }
        )
    }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
