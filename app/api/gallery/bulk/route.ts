// POST /api/gallery/bulk
// Registers pre-uploaded images into the DB by URL
// Use this when you bulk-upload images directly to Supabase Storage / R2 / S3
// Body: { items: [{ url, caption, type }] }

import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items } = await req.json()

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "items array required" }, { status: 400 })

  const sb = getServerSupabase()

  // Insert all items in one DB call
  const rows = items.map((item: { url: string; caption?: string; type?: string }) => ({
    url:         item.url,
    caption:     item.caption ?? "",
    type:        item.type ?? "image",
    uploaded_by: userId,
    liked:       false,
  }))

  const { data, error } = await sb
    .from("gallery_items")
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    inserted: data.length,
    items: data,
  }, { status: 201 })
}
