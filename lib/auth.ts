"use client"
import { useClerk } from "@clerk/nextjs"

export function getCurrentUser() {
  // Hardcoded default user for backend API calls during test phase
  return {
    email: "admin@pacificaisystems.com",
    name: "Administrator",
  }
}

export function logout() {
  // This will be replaced by the useLogout hook in components
  // This function is deprecated - use useLogout() hook instead
  window.location.href = "/sign-in"
}

export function isAuthenticated() {
  // Middleware handles auth, this is just for client-side checks
  return true
}

export function useLogout() {
  const { signOut } = useClerk()

  return async () => {
    await signOut()
    window.location.href = "/sign-in"
  }
}
