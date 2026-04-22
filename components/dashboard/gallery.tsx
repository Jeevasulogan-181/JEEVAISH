"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  apiGetGallery, apiToggleLike, apiDeleteGalleryItem,
} from "@/lib/api-client"
import {
  ImageIcon, Plus, Heart, Trash2, X,
  ChevronLeft, ChevronRight, Play, Pause,
  Upload, Maximize2, Film, CheckCircle2,
} from "lucide-react"

interface GalleryItem {
  id: string
  url: string
  caption: string
  type: "image" | "video"
  uploaded_by?: string
  liked: boolean
  created_at: string
}

const POLL = 3000

export function Gallery() {
  const { user } = useAuth()
  const [items, setItems]         = useState<GalleryItem[]>([])
  const [index, setIndex]         = useState(0)
  const [fade, setFade]           = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [lightbox, setLightbox]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reload = useCallback(async () => {
    try { setItems(await apiGetGallery()) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    reload()
    pollRef.current = setInterval(reload, POLL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [reload])

  useEffect(() => {
    if (!isPlaying || items.length <= 1) return
    const t = setInterval(() => goNext(), 6000)
    return () => clearInterval(t)
  }, [isPlaying, items.length, index])

  useEffect(() => {
    if (items.length > 0 && index >= items.length) setIndex(items.length - 1)
  }, [items.length, index])

  useEffect(() => {
    if (!lightbox) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false)
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [lightbox, index, items.length])

  const goNext = useCallback(() => {
    if (items.length <= 1) return
    setFade(false)
    setTimeout(() => { setIndex((i) => (i + 1) % items.length); setFade(true) }, 250)
  }, [items.length])

  const goPrev = useCallback(() => {
    if (items.length <= 1) return
    setFade(false)
    setTimeout(() => { setIndex((i) => (i - 1 + items.length) % items.length); setFade(true) }, 250)
  }, [items.length])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPendingFiles(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
    e.target.value = ""
  }

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpload = async () => {
    if (!pendingFiles.length || !user) return
    setUploading(true)
    setUploadProgress(0)

    try {
      const form = new FormData()
      pendingFiles.forEach((f) => form.append("files", f))

      const token = localStorage.getItem("cosmicus-token")
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!res.ok) throw new Error("Upload failed")

      await reload()
      setIndex(0)
      setPendingFiles([])
      setPreviews([])
      setShowUpload(false)
    } catch (err) {
      console.error("[CosmicUs] Upload error:", err)
      alert("Upload failed — " + (err as Error).message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleLike = async (id: string) => {
    await apiToggleLike(id)
    reload()
  }

  const handleDelete = async (id: string) => {
    await apiDeleteGalleryItem(id)
    reload()
    setIndex(0)
  }

  const current = items[index] ?? null

  return (
    <div className="cosmic-card rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#8b5cf6] flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Our Gallery</h3>
            <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "memory" : "memories"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-muted-foreground" /> : <Play className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f472b6]/20 to-[#8b5cf6]/20 hover:from-[#f472b6]/30 hover:to-[#8b5cf6]/30 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-[#f472b6]" />
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="p-4 border-b border-white/5 space-y-3">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-white/15 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-[#f472b6]/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-7 h-7 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              {pendingFiles.length > 0
                ? `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} selected`
                : "Choose photos or videos"}
            </p>
            <p className="text-xs text-muted-foreground">You can select multiple files at once</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Previews grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  {pendingFiles[i]?.type.startsWith("video") ? (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Film className="w-5 h-5 text-[#8b5cf6]" />
                    </div>
                  ) : (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!pendingFiles.length || uploading}
              className="cosmic-btn flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {uploading
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}…</>
                : <><CheckCircle2 className="w-3.5 h-3.5" /> Upload {pendingFiles.length > 0 ? `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}` : ""} ✨</>}
            </button>
            <button
              onClick={() => { setShowUpload(false); setPendingFiles([]); setPreviews([]) }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slideshow */}
      <div className="relative aspect-video bg-black/20 overflow-hidden">
        {items.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add your first memory 💕</p>
          </div>
        ) : current && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
            {current.type === "video" ? (
              <video key={current.id} src={current.url} className="w-full h-full object-cover" muted loop autoPlay={isPlaying} />
            ) : (
              <img key={current.id} src={current.url} alt={current.caption} className="w-full h-full object-cover" crossOrigin="anonymous" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {current.caption && (
              <p className="absolute bottom-12 left-4 right-4 text-sm text-white font-medium drop-shadow">{current.caption}</p>
            )}
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <button onClick={() => handleLike(current.id)} className="text-white/80 hover:text-[#f472b6] transition-colors">
                <Heart className={`w-4 h-4 ${current.liked ? "fill-[#f472b6] text-[#f472b6]" : ""}`} />
              </button>
              <button onClick={() => setLightbox(true)} className="text-white/60 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {current.uploaded_by === user?.id && (
                <button onClick={() => handleDelete(current.id)} className="text-white/60 hover:text-[#f472b6] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {items.length > 1 && (
              <>
                <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-3 left-4 flex gap-1 items-center">
                  {items.slice(0, 8).map((_, i) => (
                    <button key={i} onClick={() => { setFade(false); setTimeout(() => { setIndex(i); setFade(true) }, 200) }}
                      className={`rounded-full transition-all ${i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
                  ))}
                  {items.length > 8 && <span className="text-white/50 text-[10px] ml-1">+{items.length - 8}</span>}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && current && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          {current.type === "video"
            ? <video src={current.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
            : <img src={current.url} alt={current.caption} className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />}
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <X className="w-5 h-5 text-white" />
          </button>
          {items.length > 1 && (
            <>
              <button className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); goPrev() }}>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); goNext() }}>
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          {current.caption && <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center px-6">{current.caption}</p>}
        </div>
      )}
    </div>
  )
}
