// POST /api/auth/refresh — get a new access token using refresh token
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()
    if (!refreshToken)
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await sb.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session)
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })

    return NextResponse.json({
      token:        data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt:    data.session.expires_at,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
