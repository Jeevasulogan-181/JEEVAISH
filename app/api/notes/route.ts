// GET  /api/notes  — get all notes with replies
// POST /api/notes  — create a note
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getNotesWithReplies, addNote } from "@/lib/local-db"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(getNotesWithReplies())
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, author_name } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

  const data = addNote({ author_id: userId, author_name, content: content.trim() })
  return NextResponse.json(data, { status: 201 })
}
