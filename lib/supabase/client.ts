import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Which is actually SERVICE KEY now

  if (!url || !key) {
    throw new Error("Supabase credentials missing!")
  }

  return createSupabaseClient(url, key)
}

// Keep old function for compatibility
export function createClient() {
  return createBrowserClient()
}
