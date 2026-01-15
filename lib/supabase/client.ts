import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr"

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[v0] Missing Supabase credentials in dev mode. Using dummy client.")
      // Return a dummy client that satisfies the basic interface to prevent crashes
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      } as any
    }
    // In production, we want this to crash/error if config is missing
    throw new Error("Supabase credentials missing!")
  }

  return createBrowserClientSSR(url, key)
}

// Keep old function for compatibility
export function createClient() {
  return createBrowserClientSSR(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
