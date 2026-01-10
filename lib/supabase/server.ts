import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Create a new Supabase server client for each function call.
 * Important for Fluid compute compatibility.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // setAll called from Server Component - ignored with proxy refreshing
        }
      },
    },
  })
}

export { createClient as createServerClient }
