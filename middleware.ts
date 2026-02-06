import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
    "/", "/sign-in(.*)", "/sign-up(.*)", "/login(.*)", "/signup(.*)",
    "/auth(.*)", "/api/scout(.*)", "/api/briefing(.*)", "/api/outreach(.*)",
    "/api/outlook(.*)", "/health(.*)"
])

// Clerk's standard middleware handler
export default clerkMiddleware(async (auth, req) => {
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

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
