// DELETE /api/notes/[id]
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data: note } = await sb.from("notes").select("author_id").eq("id", params.id).single()
  if (note?.author_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await sb.from("notes").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
