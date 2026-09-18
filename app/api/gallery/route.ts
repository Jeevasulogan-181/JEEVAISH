// GET  /api/gallery  — fetch all gallery items
// POST /api/gallery  — upload one OR multiple files
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getGalleryItems, addGalleryItems } from "@/lib/local-db"
import { saveFile, BUCKETS } from "@/lib/local-storage"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(getGalleryItems())
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()

  // Support multiple files — getAll("files") or single "file"
  const files    = form.getAll("files") as File[]
  const single   = form.get("file") as File | null
  const allFiles = files.length > 0 ? files : single ? [single] : []
  const caption  = (form.get("caption") as string ?? "").trim()

  if (allFiles.length === 0)
    return NextResponse.json({ error: "No files provided" }, { status: 400 })

  const rows: { url: string; caption: string; type: "image" | "video"; uploaded_by: string; liked: boolean }[] = []
  const errors: { file: string; error: string }[] = []

  for (const file of allFiles) {
    try {
      const isVideo = file.type.startsWith("video")
      const buffer  = Buffer.from(await file.arrayBuffer())
      const url     = saveFile(BUCKETS.gallery, file.name, buffer)

      rows.push({
        url,
        caption: caption || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        type: isVideo ? "video" : "image",
        uploaded_by: userId,
        liked: false,
      })
    } catch (e: any) {
      errors.push({ file: file.name, error: e.message })
    }
  }

  const results = rows.length > 0 ? addGalleryItems(rows) : []

  return NextResponse.json({ uploaded: results, errors }, { status: 201 })
}
