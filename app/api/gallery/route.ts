// GET  /api/gallery  — fetch all gallery items
// POST /api/gallery  — upload one OR multiple files
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

const BUCKET = "gallery"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb   = getServerSupabase()
  const form = await req.formData()

  // Support multiple files — getAll("files") or single "file"
  const files   = form.getAll("files") as File[]
  const singles = form.get("file") as File | null
  const allFiles = files.length > 0 ? files : singles ? [singles] : []
  const caption  = (form.get("caption") as string ?? "").trim()

  if (allFiles.length === 0)
    return NextResponse.json({ error: "No files provided" }, { status: 400 })

  const results = []
  const errors  = []

  for (const file of allFiles) {
    try {
      const isVideo  = file.type.startsWith("video")
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
      const buffer   = Buffer.from(await file.arrayBuffer())

      const { error: uploadErr } = await sb.storage
        .from(BUCKET)
        .upload(filename, buffer, {
          contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
          upsert: true,
        } as any)

      if (uploadErr) { errors.push({ file: file.name, error: uploadErr.message }); continue }

      const url = sb.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl

      const { data, error: dbErr } = await sb
        .from("gallery_items")
        .insert({
          url,
          caption:     caption || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          type:        isVideo ? "video" : "image",
          uploaded_by: userId,
          liked:       false,
        })
        .select()
        .single()

      if (dbErr) { errors.push({ file: file.name, error: dbErr.message }); continue }
      results.push(data)
    } catch (e: any) {
      errors.push({ file: file.name, error: e.message })
    }
  }

  return NextResponse.json({ uploaded: results, errors }, { status: 201 })
}
