import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Redirect authenticated Clerk users to main app
  redirect("/")
}
