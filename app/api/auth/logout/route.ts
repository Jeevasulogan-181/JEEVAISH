// POST /api/auth/logout
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  await sb.auth.admin.signOut(req.headers.get("authorization")!.slice(7))
  return NextResponse.json({ success: true })
}
