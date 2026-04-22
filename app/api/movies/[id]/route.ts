// PATCH  /api/movies/[id]  — update watched/rating
// DELETE /api/movies/[id]  — delete movie
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const sb = getServerSupabase()

  const allowed: Record<string, unknown> = {}
  if (body.watched  !== undefined) allowed.watched  = body.watched
  if (body.rating   !== undefined) allowed.rating   = body.rating
  if (body.title    !== undefined) allowed.title    = body.title
  if (body.genre    !== undefined) allowed.genre    = body.genre

  const { data, error } = await sb
    .from("movies").update(allowed).eq("id", params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { error } = await sb.from("movies").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
