// GET   /api/settings  — get current user profile
// PATCH /api/settings  — update name, about, avatar
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getProfileById, updateProfile } from "@/lib/local-db"
import { saveFileAt, BUCKETS } from "@/lib/local-storage"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = getProfileById(userId)
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { id, username, display_name, avatar_url, about } = profile
  return NextResponse.json({ id, username, display_name, avatar_url, about })
}

export async function PATCH(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()

  const display_name = form.get("display_name") as string | null
  const about        = form.get("about") as string | null
  const avatarFile    = form.get("avatar") as File | null

  const updates: { display_name?: string; about?: string; avatar_url?: string } = {}
  if (display_name !== null) updates.display_name = display_name
  if (about !== null)        updates.about = about

  if (avatarFile && avatarFile.size > 0) {
    const ext    = avatarFile.name.split(".").pop() ?? "jpg"
    const buffer = Buffer.from(await avatarFile.arrayBuffer())
    updates.avatar_url = saveFileAt(BUCKETS.avatars, `${userId}/avatar.${ext}`, buffer)
  }

  const data = updateProfile(userId, updates)
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { id, username, display_name: name, avatar_url, about: aboutOut } = data
  return NextResponse.json({ id, username, display_name: name, avatar_url, about: aboutOut })
}
