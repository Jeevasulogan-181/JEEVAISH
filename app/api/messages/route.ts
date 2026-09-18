// GET  /api/messages        — fetch all messages
// POST /api/messages        — send a message (with optional file upload)
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getMessages, addMessage } from "@/lib/local-db"
import { saveFile, BUCKETS } from "@/lib/local-storage"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(getMessages())
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") ?? ""

  let text = ""
  let sender_username = ""
  let display_name = ""
  let attachment_url: string | undefined
  let attachment_type: "image" | "video" | undefined
  let attachment_name: string | undefined

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    text            = form.get("text") as string ?? ""
    sender_username = form.get("sender_username") as string ?? ""
    display_name    = form.get("display_name") as string ?? ""
    const file       = form.get("file") as File | null

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      attachment_url  = saveFile(BUCKETS.chatAttachments, file.name, buffer)
      attachment_type = file.type.startsWith("video") ? "video" : "image"
      attachment_name = file.name
    }
  } else {
    const body = await req.json()
    text            = body.text ?? ""
    sender_username = body.sender_username ?? ""
    display_name    = body.display_name ?? ""
  }

  const data = addMessage({
    sender_id: userId, sender_username, display_name, text,
    attachment_url, attachment_type, attachment_name,
  })

  return NextResponse.json(data, { status: 201 })
}
