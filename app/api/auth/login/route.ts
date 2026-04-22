// POST /api/auth/login
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function toEmail(u: string) { return `${u.toLowerCase().trim()}@cosmicus.app` }

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await sb.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })

    if (error || !data.session)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const { data: profile } = await sb
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", data.user.id)
      .single()

    // Return both access token and refresh token
    return NextResponse.json({
      token:        data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt:    data.session.expires_at,
      user: {
        id:          data.user.id,
        username:    profile?.username ?? username,
        displayName: profile?.display_name ?? username.toUpperCase(),
        avatarUrl:   profile?.avatar_url ?? null,
      },
    })
  } catch (e) {
    console.error("[CosmicUs] Login error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
