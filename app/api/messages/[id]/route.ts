// PATCH /api/messages/[id]  — edit a message
// DELETE /api/messages/[id] — delete a message
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  const sb = getServerSupabase()

  // Only the sender can edit
  const { data: msg } = await sb.from("messages").select("sender_id").eq("id", params.id).single()
  if (msg?.sender_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await sb
    .from("messages")
    .update({ text, edited_at: new Date().toISOString() })
    .eq("id", params.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()

  const { data: msg } = await sb.from("messages")
    .select("sender_id, attachment_url").eq("id", params.id).single()

  if (msg?.sender_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Delete attachment from storage if exists
  if (msg?.attachment_url) {
    const path = msg.attachment_url.split("/chat-attachments/")[1]
    if (path) await sb.storage.from("chat-attachments").remove([path])
  }

  const { error } = await sb.from("messages").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
