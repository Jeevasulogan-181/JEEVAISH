// GET   /api/movie-sync        — get current sync state
// PATCH /api/movie-sync        — update sync state
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getMovieSync, setMovieSync } from "@/lib/local-db"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(getMovieSync())
}

export async function PATCH(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const update = body
    ? {
        movie_id: body.movieId ?? null,
        is_playing: body.isPlaying ?? false,
        playback_time: body.currentTime ?? 0,
        started_by: body.startedBy ?? null,
      }
    : { movie_id: null, is_playing: false, playback_time: 0, started_by: null }

  const data = setMovieSync(update)
  return NextResponse.json(data)
}
