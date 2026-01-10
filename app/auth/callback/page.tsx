"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient()
      const url = window.location.href
      const hasCode = url.includes("code=")

      let hasPKCEVerifier = false
      try {
        // Check if PKCE code verifier exists in localStorage
        const storageKeys = Object.keys(localStorage)
        hasPKCEVerifier = storageKeys.some(
          (key) => key.includes("supabase.auth.token") || key.includes("pkce") || key.includes("code_verifier"),
        )
      } catch (e) {
        console.error("[v0 Callback] Could not access localStorage:", e)
      }

      console.log("[v0 Callback] URL has code parameter:", hasCode)
      console.log("[v0 Callback] PKCE verifier exists in browser storage:", hasPKCEVerifier)

      setDebugInfo(`Code in URL: ${hasCode}, PKCE verifier in storage: ${hasPKCEVerifier}`)

      if (!hasCode) {
        console.error("[v0 Callback] No code parameter in URL")
        router.replace("/login?error=callback_failed&reason=missing_code")
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(url)

      if (error) {
        console.error("[v0 Callback] Exchange failed:", error.message)
        const errorDetails = encodeURIComponent(error.message)
        router.replace(`/login?error=callback_failed&reason=session_exchange&details=${errorDetails}`)
        return
      }

      console.log("[v0 Callback] Exchange successful, redirecting to update-password")
      router.replace("/auth/update-password")
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Processing authentication...</p>
        {debugInfo && <p className="text-xs text-muted-foreground font-mono">{debugInfo}</p>}
      </div>
    </div>
  )
}
