import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
    "/", "/sign-in(.*)", "/sign-up(.*)", "/login(.*)", "/signup(.*)",
    "/auth(.*)", "/api/scout(.*)", "/api/briefing(.*)", "/api/outreach(.*)",
    "/api/outlook(.*)", "/health(.*)", "/__clerk(.*)"
])

// PROXY MIDDLEWARE: Routes /__clerk/* to Clerk's Frontend API
// This bypasses the broken clerk.scout-ai-app.com SSL by using Vercel's SSL
function proxyMiddleware(req: any) {
    if (req.nextUrl.pathname.startsWith('/__clerk')) {
        const proxyHeaders = new Headers(req.headers)
        proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '')
        proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')

        // Get client IP for rate limiting
        if (req.ip) {
            proxyHeaders.set('X-Forwarded-For', req.ip)
        } else {
            proxyHeaders.set('X-Forwarded-For', req.headers.get('X-Forwarded-For') || '')
        }

        const proxyUrl = new URL(req.url)
        proxyUrl.host = 'frontend-api.clerk.dev'
        proxyUrl.port = '443'
        proxyUrl.protocol = 'https'
        proxyUrl.pathname = proxyUrl.pathname.replace('/__clerk', '')

        return NextResponse.rewrite(proxyUrl, {
            request: { headers: proxyHeaders },
        })
    }
    return null
}

// Clerk's standard middleware handler
const clerkHandler = clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }
    await auth.protect()
}, {
    authorizedParties: [
        "http://localhost:3000",
        "https://scout-ui.vercel.app",
        "https://v0-scout-ui.vercel.app",
        "https://scout-ai-app.com",
    ],
})

// Main middleware: Check proxy first, then Clerk
export default function middleware(req: any) {
    // First check if it's a proxy request
    const proxyResponse = proxyMiddleware(req)
    if (proxyResponse) {
        return proxyResponse
    }
    // Otherwise, use Clerk's middleware
    return clerkHandler(req, {} as any)
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes AND the proxy path
        '/(api|trpc|__clerk)(.*)',
    ],
}
