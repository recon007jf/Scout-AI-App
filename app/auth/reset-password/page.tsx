"use client"

import type React from "react"

import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert, Mail } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{ verifierFound: boolean; keys: string[] } | null>(null)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setDebugInfo(null)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`
      console.log("[v0] Reset Password RedirectTo:", redirectTo)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        throw new Error("Unable to send password reset email. Please try again.")
      }

      const keys = Object.keys(localStorage)
      const verifierKeys = keys.filter(
        (k) => k.includes("code-verifier") || k.includes("pkce") || k.includes("supabase"),
      )

      setDebugInfo({
        verifierFound: verifierKeys.length > 0,
        keys: verifierKeys,
      })

      console.log("[v0] PKCE Verifier Storage Check:", {
        verifierFound: verifierKeys.length > 0,
        keys: verifierKeys,
      })

      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Scout</h1>
          </div>
          <p className="text-sm text-muted-foreground">by Pacific AI Systems</p>
        </div>

        <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-500">Internal Test Build. Authorized Access Only.</AlertDescription>
        </Alert>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <>
                  <Alert className="bg-green-500/10 border-green-500/50">
                    <Mail className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">
                      Password reset link sent! Check your email and click the link to set a new password.
                    </AlertDescription>
                  </Alert>

                  {debugInfo && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                      <AlertDescription className="text-blue-500 space-y-1">
                        <div className="font-semibold">PKCE Verifier Storage Debug:</div>
                        <div>Verifier Found: {debugInfo.verifierFound ? "✓ YES" : "✗ NO"}</div>
                        {debugInfo.keys.length > 0 && (
                          <div className="text-xs mt-2">
                            <div>Storage Keys ({debugInfo.keys.length}):</div>
                            <div className="font-mono">{debugInfo.keys.slice(0, 3).join(", ")}</div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Sending link..." : success ? "Link sent!" : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">Only invited users can reset their password</p>
      </div>
    </div>
  )
}
