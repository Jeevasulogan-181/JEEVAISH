// PATCH  /api/movies/[id]  — update watched/rating
// DELETE /api/movies/[id]  — delete movie
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { updateMovie, deleteMovie } from "@/lib/local-db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  if (body.watched !== undefined) allowed.watched = body.watched
  if (body.rating  !== undefined) allowed.rating  = body.rating
  if (body.title   !== undefined) allowed.title   = body.title
  if (body.genre   !== undefined) allowed.genre   = body.genre

  const data = updateMovie(params.id, allowed)
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  deleteMovie(params.id)
  return NextResponse.json({ success: true })
}
