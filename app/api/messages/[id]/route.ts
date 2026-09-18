// PATCH /api/messages/[id]  — edit a message
// DELETE /api/messages/[id] — delete a message
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getMessageById, updateMessage, deleteMessage } from "@/lib/local-db"
import { deleteFileByUrl } from "@/lib/local-storage"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()

  // Only the sender can edit
  const msg = getMessageById(params.id)
  if (msg?.sender_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const data = updateMessage(params.id, text)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const msg = getMessageById(params.id)
  if (msg?.sender_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (msg?.attachment_url) deleteFileByUrl(msg.attachment_url)

  deleteMessage(params.id)
  return NextResponse.json({ success: true })
}
