import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
    "/", "/sign-in(.*)", "/sign-up(.*)", "/login(.*)", "/signup(.*)",
    "/auth(.*)", "/api/scout(.*)", "/api/briefing(.*)", "/api/outreach(.*)",
    "/api/outlook(.*)", "/health(.*)", "/__clerk(.*)"
])

// PROXY MIDDLEWARE: Routes /__clerk/* to Clerk's Frontend API
// Uses fetch() instead of rewrite() for proper header control
async function proxyMiddleware(req: any) {
    if (req.nextUrl.pathname.startsWith('/__clerk')) {
        try {
            // Build the target URL
            const targetPath = req.nextUrl.pathname.replace('/__clerk', '') || '/'
            const targetUrl = `https://frontend-api.clerk.dev${targetPath}${req.nextUrl.search}`

            // Build headers with proper Host override
            const proxyHeaders = new Headers()

            // Copy original headers
            req.headers.forEach((value: string, key: string) => {
                if (key.toLowerCase() !== 'host') {
                    proxyHeaders.set(key, value)
                }
            })

            // Set the Host to Clerk's API (critical!)
            proxyHeaders.set('Host', 'frontend-api.clerk.dev')

            // Tell Clerk about the original host
            proxyHeaders.set('X-Forwarded-Host', 'scout-ai-app.com')
            proxyHeaders.set('X-Forwarded-Proto', 'https')
            proxyHeaders.set('Origin', 'https://scout-ai-app.com')

            // Clerk-specific headers
            proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || 'https://scout-ai-app.com/__clerk')
            proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')

            // Forward client IP
            const clientIp = req.ip || req.headers.get('X-Forwarded-For') || ''
            if (clientIp) {
                proxyHeaders.set('X-Forwarded-For', clientIp)
            }

            // Make the request to Clerk
            const clerkResponse = await fetch(targetUrl, {
                method: req.method,
                headers: proxyHeaders,
                body: ['GET', 'HEAD'].includes(req.method) ? null : req.body,
            })

            // Return Clerk's response
            return new NextResponse(clerkResponse.body, {
                status: clerkResponse.status,
                headers: clerkResponse.headers,
            })
        } catch (error) {
            console.error('[Clerk Proxy] Error:', error)
            return new NextResponse('Proxy Error', { status: 500 })
        }
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
export default async function middleware(req: any) {
    // First check if it's a proxy request
    const proxyResponse = await proxyMiddleware(req)
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
