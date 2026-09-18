// POST /api/gallery/bulk
// Registers pre-existing files into the DB by URL (e.g. files already placed
// under public/uploads/gallery by hand).
// Body: { items: [{ url, caption, type }] }

import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { addGalleryItems } from "@/lib/local-db"

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items } = await req.json()

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "items array required" }, { status: 400 })

  const rows = items.map((item: { url: string; caption?: string; type?: "image" | "video" }) => ({
    url:         item.url,
    caption:     item.caption ?? "",
    type:        item.type ?? "image",
    uploaded_by: userId,
    liked:       false,
  }))

  const data = addGalleryItems(rows)

  return NextResponse.json({ inserted: data.length, items: data }, { status: 201 })
}
