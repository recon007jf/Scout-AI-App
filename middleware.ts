import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const isPublicRoute = createRouteMatcher([
    "/", "/sign-in(.*)", "/sign-up(.*)", "/login(.*)", "/signup(.*)",
    "/auth(.*)", "/api/scout(.*)", "/api/briefing(.*)", "/api/outreach(.*)",
    "/api/outlook(.*)", "/health(.*)", "/__clerk(.*)",
])

async function proxyMiddleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/__clerk')) {
        const clerkPath = req.nextUrl.pathname.replace('/__clerk', '')
        const clerkUrl = new URL(`https://frontend-api.clerk.dev${clerkPath}${req.nextUrl.search}`)

        // Forward headers with X-Forwarded-Host
        const proxyHeaders = new Headers()
        req.headers.forEach((value, key) => {
            proxyHeaders.set(key, value)
        })

        // Explicitly set forwarded host so Clerk knows the original domain
        proxyHeaders.set('X-Forwarded-Host', req.nextUrl.host)
        proxyHeaders.set('X-Forwarded-Proto', 'https')
        // Ensure required Clerk proxy headers are also set
        proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || 'https://scout-ai-app.com/__clerk')
        proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')


        const response = await fetch(clerkUrl.toString(), {
            method: req.method,
            headers: proxyHeaders,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
        })

        return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
        })
    }
    return null
}

const clerkHandler = clerkMiddleware(
    async (auth, req) => {
        if (isPublicRoute(req)) return NextResponse.next()
        await auth.protect()
    },
    {
        authorizedParties: [
            "http://localhost:3000",
            "https://scout-ui.vercel.app",
            "https://v0-scout-ui.vercel.app",
            "https://scout-ai-app.com",
        ],
    }
)

export default async function middleware(req: NextRequest) {
    const proxyResponse = await proxyMiddleware(req)
    if (proxyResponse) return proxyResponse
    return clerkHandler(req, {} as any)
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc|__clerk)(.*)",
    ],
}
