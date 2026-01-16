
import { AppShell } from "@/components/app-shell"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { userId } = await auth()

    if (!userId) {
        redirect("/sign-in")
    }

    // The AppShell handles internal client-side routing.
    // We can pass a prop or rely on it reading the URL/URL params if implemented.
    // But based on `page.tsx` (root), it seems AppShell might be a client component that manages state?
    // Let's check AppShell to be sure, but creating this page allows the URL to exist.
    // We'll pass "settings" as the default view if possible, or just render it.

    // Actually, to ensure "/settings" loads the Settings view, we should check how AppShell determines the view.
    // If AppShell uses URL path, good. If it uses internal state, we need to tell it "show settings".

    return <AppShell initialView="settings" />
}
