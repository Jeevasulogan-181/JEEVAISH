// POST /api/auth/logout
// Tokens are stateless local JWTs, so there's nothing to revoke server-side —
// the client just discards them. This route exists for symmetry with login.
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({ success: true })
}
