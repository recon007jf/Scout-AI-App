"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Suspense } from "react"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [debugInfo, setDebugInfo] = useState({
    codePresent: false,
    tokenPresent: false,
    typeParam: "",
    message: "Initializing...",
  })
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Parse URL parameters
      const code = searchParams.get("code")
      const token = searchParams.get("token")
      const type = searchParams.get("type")
      const next = searchParams.get("next") || "/"

      setDebugInfo({
        codePresent: !!code,
        tokenPresent: !!token,
        typeParam: type || "none",
        message: "Callback received",
      })

      console.log("[v0 Callback] Code present:", !!code)
      console.log("[v0 Callback] Token present:", !!token)
      console.log("[v0 Callback] Type:", type)
      console.log("[v0 Callback] Next destination:", next)

      if (code) {
        setDebugInfo((prev) => ({ ...prev, message: "Exchanging code for session..." }))
        console.log("[v0 Callback] Attempting code exchange...")

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("[v0 Callback] Exchange failed:", error.message)
          setErrorMessage(error.message)
          setStatus("error")
          setDebugInfo((prev) => ({ ...prev, message: `Exchange failed: ${error.message}` }))
          return
        }

        if (data.session) {
          console.log("[v0 Callback] Exchange successful")
          setStatus("success")
          setDebugInfo((prev) => ({ ...prev, message: "Success! Redirecting..." }))

          setTimeout(() => {
            router.push(next)
          }, 1000)
          return
        }
      }

      if (token && type === "recovery") {
        setDebugInfo((prev) => ({ ...prev, message: "Processing recovery token..." }))
        console.log("[v0 Callback] Recovery token detected, checking session...")

        // For recovery flows, Supabase automatically establishes the session
        // We just need to verify it exists
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          console.log("[v0 Callback] Recovery session established")
          setStatus("success")
          setDebugInfo((prev) => ({ ...prev, message: "Recovery session established! Redirecting..." }))

          setTimeout(() => {
            router.push(next)
          }, 1000)
          return
        } else {
          console.error("[v0 Callback] No session found after recovery")
          setErrorMessage("Recovery token processed but no session established")
          setStatus("error")
          setDebugInfo((prev) => ({ ...prev, message: "Recovery failed: No session" }))
          return
        }
      }

      // No valid parameters found
      console.error("[v0 Callback] No valid auth parameters in URL")
      setErrorMessage("No valid authentication parameters found in callback URL")
      setStatus("error")
      setDebugInfo((prev) => ({ ...prev, message: "Error: No valid auth parameters" }))
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Authentication Callback</CardTitle>
            <CardDescription>Processing your authentication request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Code present:</span>
                <span className={debugInfo.codePresent ? "text-green-500" : "text-muted-foreground"}>
                  {debugInfo.codePresent ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token present:</span>
                <span className={debugInfo.tokenPresent ? "text-green-500" : "text-muted-foreground"}>
                  {debugInfo.tokenPresent ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground">{debugInfo.typeParam}</span>
              </div>
            </div>

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

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
