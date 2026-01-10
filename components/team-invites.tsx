"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Invite {
  id: string
  email: string
  role: "admin" | "member"
  status: "pending" | "accepted"
  invited_at: string
  invited_by: string
}

export function TeamInvites() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("")
  const [stubMode, setStubMode] = useState(false)
  const [showUserExistsDialog, setShowUserExistsDialog] = useState(false)
  const [existingUserEmail, setExistingUserEmail] = useState("")
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadCurrentUser()
    loadInvites()
  }, [])

  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.email) {
      setCurrentUserEmail(user.email)
    }
  }

  async function loadInvites() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        console.log("[v0] No session found, skipping invite load")
        return
      }

      const response = await fetch("/api/admin/invite", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const formattedInvites = data.invites?.map((inv: any) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          invited_at: inv.invited_at,
          invited_by: inv.invited_by_profile?.email || "Unknown",
        }))
        setInvites(formattedInvites || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load invites:", error)
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const requestUrl = `${window.location.origin}/api/admin/invite`
      console.log("[v0 TeamInvites] Request URL:", requestUrl)
      console.log("[v0 TeamInvites] Sending invite request:", { email, role })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to send invites")
      }

      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, role }),
      })

      const contentType = response.headers.get("content-type") || ""
      const revision =
        response.headers.get("x-cloud-trace-context") ||
        response.headers.get("x-serverless-revision") ||
        response.headers.get("x-revision") ||
        "unknown"
      const responseText = await response.text()

      console.log("[v0 TeamInvites] === FULL RESPONSE DEBUG ===")
      console.log("[v0 TeamInvites] Status:", response.status)
      console.log("[v0 TeamInvites] Content-Type:", contentType)
      console.log("[v0 TeamInvites] Backend Revision:", revision)
      console.log("[v0 TeamInvites] Full Response Body:", responseText)
      console.log("[v0 TeamInvites] === END RESPONSE DEBUG ===")

      let data: any

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("[v0 TeamInvites] JSON parse failed:", parseError)
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
        }
      } else {
        console.warn("[v0 TeamInvites] Non-JSON response received")
        data = { error: responseText.trim() }
      }

      if (response.status === 501) {
        setStubMode(true)
        console.log("[v0] Invite stub mode:", data)
      } else if (!response.ok) {
        if (
          response.status === 409 ||
          data.status === "recovery_sent" ||
          (data.error &&
            (data.error.toLowerCase().includes("already exists") || data.error.toLowerCase().includes("duplicate")))
        ) {
          setExistingUserEmail(email)
          setShowUserExistsDialog(true)
          setEmail("")
          setLoading(false)
          return
        }

        const errorPreview = responseText.substring(0, 200)
        const detailedError = `Status: ${response.status}\nContent-Type: ${contentType}\nRevision: ${revision}\n\nResponse: ${errorPreview}`

        console.error("[v0 TeamInvites] Invite failed:", {
          status: response.status,
          statusText: response.statusText,
          contentType,
          revision,
          error: data.error,
          details: data.details,
          fullResponse: data,
        })

        alert(`Failed to send invite:\n\n${detailedError}`)
        throw new Error(data.error || data.details || `Failed to send invite (${response.status})`)
      } else {
        if (data.status === "invited") {
          alert(`✓ Invite sent to ${email}. They must set a password from the email link.`)
        } else if (data.status === "recovery_sent") {
          alert(`✓ User already exists. Sent password reset instead to ${email}.`)
        } else {
          alert(`✓ Invite sent successfully to ${email}!`)
        }
        setEmail("")
        loadInvites()
      }
    } catch (error) {
      console.error("[v0 TeamInvites] Invite error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to send invite: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendPasswordReset() {
    setSendingPasswordReset(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to send password resets")
      }

      const response = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: existingUserEmail }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send password reset")
      }

      alert(`✓ Password reset email sent to ${existingUserEmail}. They can set a password and then sign in normally.`)
      setShowUserExistsDialog(false)
      setExistingUserEmail("")
    } catch (error) {
      console.error("[v0 TeamInvites] Password reset error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to send password reset: ${errorMessage}`)
    } finally {
      setSendingPasswordReset(false)
    }
  }

  return (
    <div className="space-y-6">
      {stubMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invite system is in development. Backend endpoint not yet implemented.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invite Team Members</CardTitle>
          <CardDescription>
            Send email invitations to new team members. They'll receive a link to set up their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: "admin" | "member") => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Standard access</SelectItem>
                  <SelectItem value="admin">Admin - Full access including invites</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Active Invites</CardTitle>
          <CardDescription>Track invitation status and manage team access</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invites sent yet</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invite.invited_by} on {new Date(invite.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invite.role}</Badge>
                    <Badge variant={invite.status === "accepted" ? "default" : "secondary"}>{invite.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUserExistsDialog} onOpenChange={setShowUserExistsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Already Exists</DialogTitle>
            <DialogDescription>
              The email <strong>{existingUserEmail}</strong> is already registered. Send a password reset email instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUserExistsDialog(false)} disabled={sendingPasswordReset}>
              Cancel
            </Button>
            <Button onClick={handleSendPasswordReset} disabled={sendingPasswordReset}>
              {sendingPasswordReset ? "Sending..." : "Send Password Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
