"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAuthLinkWarning, setShowAuthLinkWarning] = useState(false)
  const router = useRouter()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured"

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const message = params.get("message")
      const errorParam = params.get("error")
      const reason = params.get("reason")
      const details = params.get("details")

      const referrer = document.referrer
      const wasAuthAttempt = errorParam === "callback_failed" || referrer.includes("supabase.co/auth")

      if (message === "password_set") {
        setSuccessMessage("Password set successfully! Please sign in with your new credentials.")
      }

      if (errorParam === "callback_failed") {
        let errorMessage = "Authentication failed. Please try again or request a new password reset."

        if (reason === "missing_code") {
          errorMessage = "Authentication link is invalid. Please request a new password reset."
        } else if (reason === "session_exchange") {
          errorMessage = details
            ? `Failed to establish session: ${details}`
            : "Failed to establish session. Please request a new password reset."
        }

        setError(errorMessage)
        setShowAuthLinkWarning(true)
        if (details) {
          console.error("[v0 Login] Callback error details:", details)
        }
      }
    }

    router.replace("/sign-in")
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("[v0 Login] Supabase auth error:", authError)
        // Display the exact Supabase error message
        throw new Error(authError.message)
      }

      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  )
}
