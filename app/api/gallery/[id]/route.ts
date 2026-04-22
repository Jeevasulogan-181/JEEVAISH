// PATCH  /api/gallery/[id]  — toggle like
// DELETE /api/gallery/[id]  — delete item
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data: item } = await sb.from("gallery_items").select("liked").eq("id", params.id).single()

  const { data, error } = await sb
    .from("gallery_items")
    .update({ liked: !(item?.liked ?? false) })
    .eq("id", params.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data: item } = await sb.from("gallery_items")
    .select("url, uploaded_by").eq("id", params.id).single()

  if (item?.uploaded_by !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (item?.url) {
    const path = item.url.split("/gallery/")[1]
    if (path) await sb.storage.from("gallery").remove([path])
  }

  const { error } = await sb.from("gallery_items").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
