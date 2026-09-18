// POST /api/auth/login
import { NextRequest, NextResponse } from "next/server"
import { getProfileByUsername, verifyPassword } from "@/lib/local-db"
import { signAccessToken, signRefreshToken } from "@/lib/local-auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })

    const profile = getProfileByUsername(username)
    if (!profile || !verifyPassword(profile, password))
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const { token, expiresAt } = signAccessToken(profile.id)
    const refreshToken = signRefreshToken(profile.id)

    return NextResponse.json({
      token,
      refreshToken,
      expiresAt,
      user: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
    })
  } catch (e) {
    console.error("[CosmicUs] Login error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
