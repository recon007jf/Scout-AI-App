import { NextResponse } from "next/server"
import { makeAuthenticatedRequest } from "@/lib/auth/service-account"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")
    const company = searchParams.get("company")

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log("[v0] Fetching profile image for:", name, company)

    const data = await makeAuthenticatedRequest(
      `/api/profile-image?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company || "")}`,
      {
        method: "GET",
      },
    )

    console.log("[v0] Profile image response:", data)

    if (data.imageUrl) {
      return NextResponse.json({ imageUrl: data.imageUrl })
    }

    console.log("[v0] No image URL in response, returning null")
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  } catch (error) {
    console.error("[v0] Profile image fetch error:", error)
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, company } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const data = await makeAuthenticatedRequest(
      `/api/profile-image?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company || "")}`,
      {
        method: "GET",
      },
    )

    if (data.imageUrl) {
      return NextResponse.json({ imageUrl: data.imageUrl })
    }

    return NextResponse.json({ imageUrl: null }, { status: 200 })
  } catch (error) {
    console.error("[v0] Profile image fetch error:", error)
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}
