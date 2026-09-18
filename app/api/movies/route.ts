// GET  /api/movies  — list all movies
// POST /api/movies  — add a movie
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getMovies, addMovie } from "@/lib/local-db"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(getMovies())
}

export async function POST(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = addMovie({ title: body.title, genre: body.genre ?? null, added_by: body.added_by })
  return NextResponse.json(data, { status: 201 })
}
