// GET  /api/messages        — fetch all messages
// POST /api/messages        — send a message (with optional file upload)
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

const BUCKET = "chat-attachments"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const contentType = req.headers.get("content-type") ?? ""

  let text = ""
  let sender_username = ""
  let display_name = ""
  let attachment_url: string | undefined
  let attachment_type: string | undefined
  let attachment_name: string | undefined

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    text            = form.get("text") as string ?? ""
    sender_username = form.get("sender_username") as string ?? ""
    display_name    = form.get("display_name") as string ?? ""
    const file      = form.get("file") as File | null

    if (file) {
      const path = `${Date.now()}-${file.name}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadErr } = await sb.storage
        .from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: true })

      if (uploadErr)
        return NextResponse.json({ error: uploadErr.message }, { status: 500 })

      attachment_url  = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      attachment_type = file.type.startsWith("video") ? "video" : "image"
      attachment_name = file.name
    }
  } else {
    const body = await req.json()
    text            = body.text ?? ""
    sender_username = body.sender_username ?? ""
    display_name    = body.display_name ?? ""
  }

  const { data, error } = await sb
    .from("messages")
    .insert({ sender_id: userId, sender_username, display_name, text,
              attachment_url, attachment_type, attachment_name })
    .select().single()

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
