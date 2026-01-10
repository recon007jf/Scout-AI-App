import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Hard redirect if no session (backup to middleware)
  if (!session) {
    redirect("/login")
  }

  return <AppShell>{/* AppShell renders the appropriate view based on navigation */}</AppShell>
}
