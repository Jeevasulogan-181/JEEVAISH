// POST /api/auth/refresh — get a new access token using a refresh token
import { NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/local-auth"
import { getProfileById } from "@/lib/local-db"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()
    if (!refreshToken)
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 })

    const userId = verifyRefreshToken(refreshToken)
    if (!userId || !getProfileById(userId))
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })

    const { token, expiresAt } = signAccessToken(userId)
    const newRefreshToken = signRefreshToken(userId)

    return NextResponse.json({ token, refreshToken: newRefreshToken, expiresAt })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
