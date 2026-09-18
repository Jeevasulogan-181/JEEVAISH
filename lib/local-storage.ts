/**
 * lib/local-storage.ts
 * Local file storage — replaces Supabase Storage buckets.
 * Files are written to public/uploads/<bucket>/... and served by Next.js'
 * static file handling, so they stay on this machine (gitignored).
 */

import fs from "fs"
import path from "path"

export const BUCKETS = {
  chatAttachments: "chat-attachments",
  gallery: "gallery",
  movies: "movies",
  avatars: "avatars",
} as const

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads")

function bucketDir(bucket: string): string {
  const dir = path.join(UPLOADS_ROOT, bucket)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

/** Save a file into a bucket, at an explicit relative path (e.g. "userId/avatar.jpg"). */
export function saveFileAt(bucket: string, relPath: string, buffer: Buffer): string {
  const cleanRel = relPath.split("/").map(safeName).join("/")
  const dest = path.join(bucketDir(bucket), cleanRel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buffer)
  return `/uploads/${bucket}/${cleanRel}`
}

/** Save a file into a bucket with a generated collision-safe name. Returns the public URL. */
export function saveFile(bucket: string, originalName: string, buffer: Buffer): string {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName(originalName)}`
  return saveFileAt(bucket, filename, buffer)
}

/** Delete a previously-saved file given its public URL (e.g. "/uploads/gallery/foo.jpg"). */
export function deleteFileByUrl(url: string): void {
  if (!url.startsWith("/uploads/")) return
  const target = path.join(process.cwd(), "public", url)
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target)
  } catch {
    /* best-effort — ignore */
  }
}
