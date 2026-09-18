// GET   /api/movie-sync        — get current sync state
// PATCH /api/movie-sync        — update sync state
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data, error } = await sb.from("movie_sync").select("*").eq("id", 1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const sb = getServerSupabase()

  const update = body
    ? {
        movie_id:     body.movieId ?? null,
        is_playing:   body.isPlaying ?? false,
        playback_time: body.currentTime ?? 0,
        started_by:   body.startedBy ?? null,
        updated_at:   new Date().toISOString(),
      }
    : { movie_id: null, is_playing: false, playback_time: 0,
        started_by: null, updated_at: new Date().toISOString() }

  const { data, error } = await sb
    .from("movie_sync").update(update).eq("id", 1).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
