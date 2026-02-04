import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/login(.*)",
    "/signup(.*)",
    "/auth(.*)",
    "/api/scout(.*)",
    "/api/briefing(.*)",
    "/api/outreach(.*)",
    "/api/outlook(.*)",
    "/health(.*)",
    "/__clerk(.*)",  // Proxy route is public
])

// Clerk Frontend API Proxy - bypasses SSL certificate issues with CNAME
function proxyMiddleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/__clerk')) {
        const proxyHeaders = new Headers(req.headers)

        // Set required Clerk proxy headers
        proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || 'https://scout-ai-app.com/__clerk')
        proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')

        // Forward client IP
        if (req.ip) {
            proxyHeaders.set('X-Forwarded-For', req.ip)
        } else {
            proxyHeaders.set('X-Forwarded-For', req.headers.get('X-Forwarded-For') || '')
        }

        // Rewrite to Clerk's Frontend API
        const proxyUrl = new URL(req.url)
        proxyUrl.host = 'frontend-api.clerk.dev'
        proxyUrl.port = '443'
        proxyUrl.protocol = 'https'
        proxyUrl.pathname = proxyUrl.pathname.replace('/__clerk', '')

        return NextResponse.rewrite(proxyUrl, {
            request: {
                headers: proxyHeaders,
            },
        })
    }
    return null
}

const clerkHandler = clerkMiddleware(
    async (auth, req) => {
        // SECURITY: No dev bypass. Clerk is the sole identity source.
        if (isPublicRoute(req)) {
            return NextResponse.next()
        }

        await auth.protect()
    },
    {
        // Allow these origins to use Clerk auth (fixes redirect loop on Vercel)
        authorizedParties: [
            "http://localhost:3000",
            "https://scout-ui.vercel.app",
            "https://v0-scout-ui.vercel.app",
            "https://scout-ai-app.com",
        ],
    }
)

export default function middleware(req: NextRequest) {
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
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes AND the Clerk proxy
        "/(api|trpc|__clerk)(.*)",
    ],
}
