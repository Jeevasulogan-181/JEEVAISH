// DELETE /api/notes/[id]
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getNoteById, deleteNote } from "@/lib/local-db"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const note = getNoteById(params.id)
  if (note?.author_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  deleteNote(params.id)
  return NextResponse.json({ success: true })
}
