import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { AppShell } from "@/components/app-shell"

export default async function PlanPage() {
    const { userId } = await auth()
    if (!userId) {
        redirect("/sign-in")
    }

    return <AppShell initialView="plan" />
}
