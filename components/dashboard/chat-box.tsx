"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getMessages, saveMessage, updateMessage, deleteMessage, type Message,
} from "@/lib/data-service"
import {
  Send, Heart, MessageCircle, Smile, ImagePlus, X,
  Play, Pencil, Trash2, Maximize2,
} from "lucide-react"

const EMOJI_CATEGORIES = [
  { label: "Love",  emojis: ["❤️","😘","🥰","💕","💖","💞","💋","🧡","💓","💗","💝","💟","😍","🤩"] },
  { label: "Happy", emojis: ["😊","😄","😁","😆","😂","🤣","😋","😜","🤪","🤗","🤩","🥳"] },
  { label: "React", emojis: ["👍","👏","🙏","🙌","🤟","✌️","🤞","🤙","💪","✨","🌟","🔥","🌈","🌙"] },
  { label: "Fun",   emojis: ["🎉","🎊","🎂","🎁","🍓","🌹","🌻","🦋","🌌","🌃","🌅","🌄"] },
]

const POLL_INTERVAL = 2000 // 2 seconds

export function ChatBox() {
  const { user } = useAuth()
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState("")
  const [showEmoji, setShowEmoji]   = useState(false)
  const [emojiTab, setEmojiTab]     = useState(0)
  const [attachment, setAttachment] = useState<{ file: File; preview: string; type: "image" | "video" } | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editText, setEditText]     = useState("")
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null)
  const [lightbox, setLightbox]     = useState<{ url: string; type: "image" | "video" } | null>(null)
  const [sending, setSending]       = useState(false)

  const scrollRef     = useRef<HTMLDivElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const editInputRef  = useRef<HTMLInputElement>(null)
  const longPressRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCountRef  = useRef(0)
  const isAtBottomRef = useRef(true)

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (scrollToBottom = false) => {
    const data = await getMessages()
    setMessages(data)

    // Auto-scroll only if new messages arrived OR explicitly requested
    if (scrollToBottom || data.length > lastCountRef.current) {
      lastCountRef.current = data.length
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
        }
      }, 50)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadMessages(true)
  }, [loadMessages])

  // Poll every 2s for new messages from partner
  useEffect(() => {
    pollRef.current = setInterval(() => loadMessages(false), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [loadMessages])

  // ── Edit input focus ─────────────────────────────────────────────────────
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus()
  }, [editingId])

  // ── Context menu close on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener("click", handler)
      return () => window.removeEventListener("click", handler)
    }
  }, [contextMenu])

  // ── Lightbox keyboard close ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null) }
    if (lightbox) {
      window.addEventListener("keydown", handler)
      return () => window.removeEventListener("keydown", handler)
    }
  }, [lightbox])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment({ file, preview: URL.createObjectURL(file), type: file.type.startsWith("video") ? "video" : "image" })
    e.target.value = ""
  }

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachment) || !user || sending) return
    setSending(true)

    // Optimistically add to UI immediately
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      sender_username: user.username,
      display_name: user.displayName,
      text: input.trim(),
      created_at: new Date().toISOString(),
      attachment_url: attachment?.preview,
      attachment_type: attachment?.type,
      attachment_name: attachment?.file.name,
    }
    setMessages((prev) => [...prev, optimistic])
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 50)

    const sentText = input.trim()
    const sentAttachment = attachment
    setInput("")
    setAttachment(null)
    setShowEmoji(false)

    try {
      await saveMessage({
        sender_id: user.id,
        sender_username: user.username,
        display_name: user.displayName,
        text: sentText,
        attachmentFile: sentAttachment?.file,
      })
      // Reload to replace optimistic message with real one from DB
      await loadMessages(false)
    } catch (err) {
      console.error("[CosmicUs] Send failed:", err)
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }, [input, attachment, user, sending, loadMessages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSaveEdit = useCallback(async (id: string) => {
    if (!editText.trim()) return
    await updateMessage(id, editText.trim())
    setEditingId(null)
    setEditText("")
    await loadMessages(false)
  }, [editText, loadMessages])

  const handleDelete = useCallback(async (id: string) => {
    await deleteMessage(id)
    setContextMenu(null)
    await loadMessages(false)
  }, [loadMessages])

  const startLongPress = (e: React.MouseEvent | React.TouchEvent, msgId: string) => {
    const pos = "touches" in e ? e.touches[0] : (e as React.MouseEvent)
    longPressRef.current = setTimeout(() => {
      setContextMenu({ msgId, x: pos.clientX, y: pos.clientY })
    }, 500)
  }
  const cancelLongPress = () => { if (longPressRef.current) clearTimeout(longPressRef.current) }

  const isOwn = (msg: Message) => msg.sender_username === user?.username
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="cosmic-card rounded-3xl flex flex-col h-150 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#6366f1] to-[#f472b6] flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-serif text-base font-semibold text-foreground">Our Chat</h3>
          <p className="text-xs text-muted-foreground">Live & private ✨</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Heart className="w-10 h-10 text-[#f472b6]" />
            <p className="text-sm text-muted-foreground">Start your story… 💕</p>
          </div>
        )}

        {messages.map((msg) => {
          const own = isOwn(msg)
          return (
            <div
              key={msg.id}
              className={`flex ${own ? "justify-end" : "justify-start"}`}
              onMouseDown={(e) => startLongPress(e, msg.id)}
              onMouseUp={cancelLongPress}
              onTouchStart={(e) => startLongPress(e, msg.id)}
              onTouchEnd={cancelLongPress}
            >
              <div className={`max-w-[75%] group flex flex-col gap-1 ${own ? "items-end" : "items-start"}`}>
                {!own && <span className="text-xs text-muted-foreground px-1">{msg.display_name}</span>}

                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  own
                    ? "bg-linear-to-br from-[#6366f1] to-[#8b5cf6] text-white rounded-br-sm"
                    : "bg-white/5 text-foreground rounded-bl-sm border border-white/8"
                } ${msg.id.startsWith("temp-") ? "opacity-60" : ""}`}>

                  {editingId === msg.id ? (
                    <div className="flex gap-2">
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(msg.id)
                          if (e.key === "Escape") { setEditingId(null); setEditText("") }
                        }}
                        className="bg-transparent outline-none flex-1 min-w-0"
                      />
                      <button onClick={() => handleSaveEdit(msg.id)}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {msg.attachment_url && (
                        <div
                          className="mb-2 relative cursor-pointer"
                          onClick={() => setLightbox({ url: msg.attachment_url!, type: msg.attachment_type! })}
                        >
                          {msg.attachment_type === "video" ? (
                            <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                              <video src={msg.attachment_url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white drop-shadow" />
                              </div>
                            </div>
                          ) : (
                            <img src={msg.attachment_url} alt={msg.attachment_name} className="max-w-40 max-h-35 rounded-xl object-cover" />
                          )}
                          <Maximize2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-white/70" />
                        </div>
                      )}
                      {msg.text && <span>{msg.text}</span>}
                      {msg.edited_at && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                    </>
                  )}
                </div>

                <div className={`flex items-center gap-2 px-1 ${own ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-muted-foreground">{fmtTime(msg.created_at)}</span>
                  {own && !msg.id.startsWith("temp-") && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button onClick={() => { setEditingId(msg.id); setEditText(msg.text) }}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(msg.id)}
                        className="text-muted-foreground hover:text-[#f472b6] transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 cosmic-card rounded-xl py-1 shadow-xl border border-white/10 text-sm min-w-30"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 140), top: Math.min(contextMenu.y, window.innerHeight - 100) }}
        >
          {messages.find((m) => m.id === contextMenu.msgId && m.sender_username === user?.username) && (
            <>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 w-full text-left"
                onClick={() => {
                  const msg = messages.find((m) => m.id === contextMenu.msgId)
                  if (msg) { setEditingId(msg.id); setEditText(msg.text) }
                  setContextMenu(null)
                }}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 w-full text-left text-[#f472b6]"
                onClick={() => handleDelete(contextMenu.msgId)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 w-full text-left"
            onClick={() => setContextMenu(null)}>
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="border-t border-white/5 bg-[#0a0a14] p-3">
          <div className="flex gap-2 mb-2">
            {EMOJI_CATEGORIES.map((c, i) => (
              <button key={c.label} onClick={() => setEmojiTab(i)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${emojiTab === i ? "bg-[#6366f1]/30 text-[#818cf8]" : "text-muted-foreground hover:text-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {EMOJI_CATEGORIES[emojiTab].emojis.map((em) => (
              <button key={em} onClick={() => setInput((p) => p + em)}
                className="text-xl p-1.5 rounded-lg hover:bg-white/8 transition-colors">
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
          {attachment.type === "image"
            ? <img src={attachment.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg" />
            : <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center"><Play className="w-5 h-5 text-[#8b5cf6]" /></div>}
          <span className="text-xs text-muted-foreground truncate flex-1">{attachment.file.name}</span>
          <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="p-4 border-t border-white/5 flex items-center gap-2">
        <button onClick={() => setShowEmoji((v) => !v)}
          className={`text-muted-foreground hover:text-[#f472b6] transition-colors ${showEmoji ? "text-[#f472b6]" : ""}`}>
          <Smile className="w-5 h-5" />
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-[#8b5cf6] transition-colors">
          <ImagePlus className="w-5 h-5" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="cosmic-input flex-1 px-4 py-2.5 rounded-xl text-sm"
        />

        <button
          onClick={handleSend}
          disabled={(!input.trim() && !attachment) || sending}
          className="w-9 h-9 rounded-xl bg-linear-to-br from-[#6366f1] to-[#f472b6] flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center" onClick={() => setLightbox(null)}>
          {lightbox.type === "video"
            ? <video src={lightbox.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
            : <img src={lightbox.url} alt="full" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />}
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
