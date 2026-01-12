import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const BYPASS_ROUTES = ["/login", "/auth/reset-password", "/auth/callback", "/auth/update-password"]
const CLERK_PROTECTED_ROUTES = ["/clerk-test", "/dashboard-test", "/clerk-login"]

const isClerkRoute = createRouteMatcher(CLERK_PROTECTED_ROUTES)

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isClerkRoute(req)) {
    return clerkMiddleware()(req as any, {} as any)
  }

  if (BYPASS_ROUTES.includes(pathname) || pathname.startsWith("/auth/")) {
    return NextResponse.next()
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
