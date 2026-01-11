"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [debugInfo, setDebugInfo] = useState({
    fullUrl: "",
    searchParams: "",
    hashFragment: "",
    authEvent: "Waiting...",
    message: "Initializing...",
  })
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const urlDebug = {
      fullUrl: window.location.href,
      searchParams: window.location.search,
      hashFragment: window.location.hash,
      authEvent: "Initializing client...",
      message: "Initializing Supabase client...",
    }
    setDebugInfo(urlDebug)

    console.log("[v0 Callback] Full URL:", window.location.href)
    console.log("[v0 Callback] Search params:", window.location.search)
    console.log("[v0 Callback] Hash fragment:", window.location.hash)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    setDebugInfo((prev) => ({ ...prev, message: "Listening for auth events..." }))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0 Callback] Auth event:", event)
      console.log("[v0 Callback] Session:", session ? "Present" : "None")

      setDebugInfo((prev) => ({
        ...prev,
        authEvent: event,
        message: `Auth event received: ${event}`,
      }))

      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        console.log("[v0 Callback] Recovery/sign-in successful, checking redirect...")

        setStatus("success")
        setDebugInfo((prev) => ({ ...prev, message: "Session established! Redirecting..." }))

        const urlParams = new URLSearchParams(window.location.search)
        const next = urlParams.get("next") || "/auth/update-password"

        console.log("[v0 Callback] Redirecting to:", next)

        setTimeout(() => {
          router.push(next)
        }, 1000)
      } else if (event === "SIGNED_OUT") {
        setErrorMessage("Session ended unexpectedly")
        setStatus("error")
        setDebugInfo((prev) => ({ ...prev, message: "Error: Session ended" }))
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Authentication Callback</CardTitle>
            <CardDescription>Processing your authentication request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertDescription className="text-sm space-y-2 font-mono text-xs break-all">
                <div>
                  <strong>Full URL:</strong> {debugInfo.fullUrl || "Loading..."}
                </div>
                <div>
                  <strong>Search params:</strong> {debugInfo.searchParams || "(empty)"}
                </div>
                <div>
                  <strong>Hash fragment:</strong> {debugInfo.hashFragment || "(empty)"}
                </div>
                <div>
                  <strong>Auth Event:</strong> {debugInfo.authEvent}
                </div>
              </AlertDescription>
            </Alert>

            <Alert className={status === "error" ? "border-destructive/50 bg-destructive/10" : "border-border/50"}>
              <div className="flex items-center gap-2">
                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                <AlertDescription className={status === "error" ? "text-destructive" : ""}>
                  {debugInfo.message}
                </AlertDescription>
              </div>
            </Alert>

            {status === "error" && errorMessage && (
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertDescription className="text-sm">
                  <strong>Error Details:</strong> {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
