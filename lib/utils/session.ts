export function getCurrentUserEmail(): string | null {
  return "admin@pacificaisystems.com"
}

export function getCurrentUser(): { email: string; name: string } | null {
  // Return hardcoded admin email and name for backend API calls during test phase
  return {
    email: "admin@pacificaisystems.com",
    name: "Administrator",
  }
}
