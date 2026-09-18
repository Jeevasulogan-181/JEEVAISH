// POST   /api/notes/[id]/replies           — add a reply
// DELETE /api/notes/[id]/replies?replyId=  — delete a reply
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, author_name } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("note_replies")
    .insert({ note_id: params.id, author_id: userId, author_name, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const replyId = req.nextUrl.searchParams.get("replyId")
  if (!replyId) return NextResponse.json({ error: "replyId required" }, { status: 400 })

  const sb = getServerSupabase()
  const { data: reply } = await sb.from("note_replies").select("author_id").eq("id", replyId).single()
  if (reply?.author_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await sb.from("note_replies").delete().eq("id", replyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
