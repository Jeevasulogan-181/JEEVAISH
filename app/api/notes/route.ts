// GET  /api/notes  — get all notes with replies
// POST /api/notes  — create a note
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("notes")
    .select("*, replies:note_replies(*)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, author_name } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("notes")
    .insert({ author_id: userId, author_name, content: content.trim() })
    .select("*, replies:note_replies(*)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
