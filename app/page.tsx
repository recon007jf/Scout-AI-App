import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { AppShell } from "@/components/app-shell"

export default async function Page() {
  // Redirect to sign-in if not authenticated with Clerk (Bypassed in Dev)
  if (process.env.NODE_ENV !== "development") {
    const { userId } = await auth()
    if (!userId) {
      redirect("/sign-in")
    }
  }

  return <AppShell>{/* AppShell renders the appropriate view based on navigation */}</AppShell>
}
