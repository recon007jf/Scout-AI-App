import { GoogleAuth } from "google-auth-library"

// v2.0 - Runtime URL resolution (cache bust for deployment)
export function getBackendUrl(): string {
  return process.env.BACKEND_BASE_URL || "https://scout-backend-prod-283427197752.us-central1.run.app"
}

export async function getAuthenticatedClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured")
  }

  console.log("[v0] Credential string length:", credentials.length)
  console.log("[v0] First 50 chars:", credentials.substring(0, 50))

  // Try using GoogleAuth's fromJSON which handles key parsing internally
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  })

  let parsedCredentials
  try {
    parsedCredentials = JSON.parse(credentials)
  } catch (parseError) {
    console.error("[v0] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY: Invalid JSON format")
    throw new Error("Invalid JSON in GOOGLE_SERVICE_ACCOUNT_KEY environment variable")
  }

  console.log("[v0] Parsed credential fields:", Object.keys(parsedCredentials))
  console.log("[v0] Client email:", parsedCredentials.client_email)

  const client = auth.fromJSON(parsedCredentials)

  if (!client) {
    throw new Error("Failed to create auth client from credentials")
  }

  return auth
}

export async function getIdToken(): Promise<string> {
  const auth = await getAuthenticatedClient()
  const backendUrl = getBackendUrl()
  const client = await auth.getIdTokenClient(backendUrl)
  const token = await client.idTokenProvider.fetchIdToken(backendUrl)

  console.log("[v0] ID Token minted successfully for audience:", backendUrl)

  return token
}

export async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken()
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}${endpoint}`

  console.log("[v0] Making authenticated request to:", url)

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  console.log(`[v0] Response status: ${response.status} ${response.ok ? "✓ OK" : "✗ FAILED"}`)

  return response
}
