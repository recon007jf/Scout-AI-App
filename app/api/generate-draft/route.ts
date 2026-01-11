import { type NextRequest, NextResponse } from "next/server"

const PYTHON_URL = process.env.CLOUD_RUN_BACKEND_URL || "http://127.0.0.1:8000"
const INTERNAL_SECRET = process.env.SCOUT_INTERNAL_PROBE_KEY || "dev-secret"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log("[v0] Proxying request to Python backend:", PYTHON_URL)

    // Forward to Python Backend with Auth Header
    const pythonResponse = await fetch(`${PYTHON_URL}/api/scout/generate-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Scout-Internal-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] Python backend response status:", pythonResponse.status)

    // Parse Response
    let data
    try {
      data = await pythonResponse.json()
    } catch (e) {
      console.error("[v0] Failed to parse Python response:", e)
      return NextResponse.json({ error: "Draft Engine Unavailable" }, { status: 503 })
    }

    // PASS-THROUGH: Return exact status and data to UI
    // If Python returns 202, we return 202. If 200, we return 200.
    return NextResponse.json(data, { status: pythonResponse.status })
  } catch (error) {
    console.error("[v0] Proxy Connection Failed:", error)
    return NextResponse.json({ error: "Proxy Connection Failed" }, { status: 500 })
  }
}
