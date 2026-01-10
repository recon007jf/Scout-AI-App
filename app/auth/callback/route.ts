import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  console.log("[v0 Callback] Server-side callback triggered")
  console.log("[v0 Callback] Code parameter present:", !!code)
  console.log("[v0 Callback] Next destination:", next)

  if (!code) {
    console.error("[v0 Callback] No code parameter in URL")
    return NextResponse.redirect(new URL("/login?error=callback_failed&reason=missing_code", requestUrl.origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[v0 Callback] Exchange failed:", error.message)
    const errorDetails = encodeURIComponent(error.message)
    return NextResponse.redirect(
      new URL(`/login?error=callback_failed&reason=session_exchange&details=${errorDetails}`, requestUrl.origin),
    )
  }

  console.log("[v0 Callback] Exchange successful, redirecting to:", next)

  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  // Ensure all cookies from the auth exchange are set in the response
  const allCookies = cookieStore.getAll()
  allCookies.forEach(({ name, value }) => {
    response.cookies.set(name, value, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
  })

  return response
}
