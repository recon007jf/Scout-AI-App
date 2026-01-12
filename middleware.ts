import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/auth(.*)",
  "/api/scout/outlook/test(.*)",
  "/clerk-test(.*)",
  "/clerk-login(.*)",
  "/clerk-signup(.*)", // Added clerk-signup to public routes
  "/health(.*)",
])

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "https://scout-backend-752.up.railway.app"

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    // Proxy /api/scout routes to backend even if public
    if (req.nextUrl.pathname.startsWith("/api/scout")) {
      const targetUrl = new URL(req.nextUrl.pathname, BACKEND_URL)
      targetUrl.search = req.nextUrl.search
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  await auth.protect()

  if (req.nextUrl.pathname.startsWith("/api/scout")) {
    const targetUrl = new URL(req.nextUrl.pathname, BACKEND_URL)
    targetUrl.search = req.nextUrl.search

    // Inject Clerk Bearer token for hybrid auth
    const requestHeaders = new Headers(req.headers)
    const token = await auth().getToken()
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`)
    }

    return NextResponse.rewrite(targetUrl, {
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
