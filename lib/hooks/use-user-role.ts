"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "member" | null

export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    async function loadUserRole() {
      // Mock Mode Bypass
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Mock Mode: Defaulting to 'admin' role")
        setRole("admin")
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        console.log("[v0] useUserRole - Current user:", user?.email, user?.id)

        if (!user) {
          console.log("[v0] useUserRole - No user found")
          setRole(null)
          return
        }

        const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        console.log("[v0] useUserRole - Profile query result:", {
          profile,
          error,
          errorCode: error?.code,
          errorMessage: error?.message,
          errorDetails: error?.details,
          errorHint: error?.hint,
        })

        if (error) {
          console.error("[v0] useUserRole - Database error:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          setRole("member")
          return
        }

        if (!profile) {
          console.log("[v0] No profile found for user, defaulting to member (fail-safe)")
          setRole("member")
          return
        }

        console.log("[v0] useUserRole - Setting role to:", profile.role)
        setRole(profile.role as UserRole)
      } catch (error) {
        console.error("[v0] Error loading user role:", error)
        setRole("member") // Fail safe
      }
    }

    loadUserRole()
  }, [])

  return role
}
