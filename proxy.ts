import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/update-password",
  "/api/public/*",
  "/health",
  "/sign-in*",
  "/sign-up*",
]

const CLERK_PROTECTED_ROUTES = ["/app/*", "/dashboard/*", "/clerk-test", "/dashboard-test"]

const isPublicRoute = createRouteMatcher(PUBLIC_ROUTES)
const isClerkProtectedRoute = createRouteMatcher(CLERK_PROTECTED_ROUTES)

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  if (isClerkProtectedRoute(req)) {
    return clerkMiddleware()(req as any, {} as any)
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const redirectUrl = new URL("/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  await supabase.auth.getUser()

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
