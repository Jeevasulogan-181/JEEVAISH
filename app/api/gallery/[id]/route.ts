// PATCH  /api/gallery/[id]  — toggle like
// DELETE /api/gallery/[id]  — delete item
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/local-auth"
import { getGalleryItemById, toggleGalleryLike, deleteGalleryItem } from "@/lib/local-db"
import { deleteFileByUrl } from "@/lib/local-storage"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = toggleGalleryLike(params.id)
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyToken(req.headers.get("authorization"))
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const item = getGalleryItemById(params.id)
  if (item?.uploaded_by !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  deleteGalleryItem(params.id)
  if (item?.url) deleteFileByUrl(item.url)

  return NextResponse.json({ success: true })
}
