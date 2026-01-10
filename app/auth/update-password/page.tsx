"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
      setCheckingSession(false)
    }

    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    const supabase = createClient()

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("Password update failed - no user data returned")
      }

      setSuccess(true)

      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push("/login?message=password_set")
      }, 2000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while updating password"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
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

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold">Invalid Session</CardTitle>
              <CardDescription>Password setup link is invalid or expired</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertDescription>
                  Password setup link is invalid or expired. Request a new reset email.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            <CardTitle className="text-2xl font-semibold">Set Your Password</CardTitle>
            <CardDescription>Complete your account setup by choosing a secure password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500">Password set. Please sign in.</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Setting password..." : success ? "Redirecting..." : "Set Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          After setting your password, you'll be able to log in with your email and new password
        </p>
      </div>
    </div>
  )
}
