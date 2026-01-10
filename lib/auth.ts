// This will be replaced with proper OAuth/SSO in Phase 2

export function getCurrentUser() {
  // Hardcoded default user for backend API calls during test phase
  return {
    email: "admin@pacificaisystems.com",
    name: "Administrator",
  }
}

export function logout() {
  // Clear the httpOnly cookie by calling the logout endpoint
  fetch("/api/auth/logout", { method: "POST" }).then(() => {
    window.location.href = "/login"
  })
}

export function isAuthenticated() {
  // Middleware handles auth, this is just for client-side checks
  return true
}
