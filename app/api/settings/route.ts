// GET   /api/settings  — get current user profile
// PATCH /api/settings  — update name, about, avatar
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getServerSupabase } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const { data, error } = await sb
    .from("profiles")
    .select("id, username, display_name, avatar_url, about")
    .eq("id", userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = getServerSupabase()
  const form = await req.formData()

  const display_name = form.get("display_name") as string | null
  const about        = form.get("about") as string | null
  const avatarFile   = form.get("avatar") as File | null

  const updates: Record<string, string> = {}
  if (display_name !== null) updates.display_name = display_name
  if (about !== null)        updates.about = about

  // Upload avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    const ext      = avatarFile.name.split(".").pop() ?? "jpg"
    const path     = `${userId}/avatar.${ext}`
    const buffer   = Buffer.from(await avatarFile.arrayBuffer())

    const { error: uploadErr } = await sb.storage
      .from("avatars")
      .upload(path, buffer, { contentType: avatarFile.type, upsert: true })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    updates.avatar_url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await sb
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, username, display_name, avatar_url, about")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
