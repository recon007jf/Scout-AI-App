/**
 * Stage 0: Health Check
 * Tests the server-to-server proxy authentication
 */
export async function checkHealth(): Promise<{
  success: boolean
  upstream: any
  message: string
}> {
  const response = await fetch("/api/scout/health")

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    const errorParts = [
      errorData.error || response.statusText || "Unknown error",
      errorData.details ? `Details: ${errorData.details}` : null,
      errorData.status ? `Status: ${errorData.status}` : null,
    ].filter(Boolean)

    throw new Error(`Health check failed: ${errorParts.join(" | ")}`)
  }

  const data = await response.json()
  console.log("[v0] Health Check Result:", data)

  return data
}
