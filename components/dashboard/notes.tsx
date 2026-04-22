"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  apiGetNotes, apiCreateNote, apiDeleteNote,
  apiAddReply, apiDeleteReply,
} from "@/lib/api-client"
import {
  BookOpen, Plus, X, Trash2, Send,
  ChevronDown, ChevronUp, MessageSquare, Heart,
} from "lucide-react"

interface Reply {
  id: string
  note_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

interface Note {
  id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
  replies: Reply[]
}

const POLL = 5000

export function Notes() {
  const { user } = useAuth()
  const [notes, setNotes]         = useState<Note[]>([])
  const [content, setContent]     = useState("")
  const [showAdd, setShowAdd]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replying, setReplying]   = useState<Record<string, boolean>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reload = useCallback(async () => {
    try { setNotes(await apiGetNotes()) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    reload()
    pollRef.current = setInterval(reload, POLL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [reload])

  const handleCreate = async () => {
    if (!content.trim() || !user) return
    setSaving(true)
    try {
      const note = await apiCreateNote(content.trim(), user.displayName)
      setNotes((prev) => [note, ...prev])
      setContent("")
      setShowAdd(false)
      setExpanded((p) => ({ ...p, [note.id]: true }))
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await apiDeleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleReply = async (noteId: string) => {
    const text = replyText[noteId]?.trim()
    if (!text || !user) return
    setReplying((p) => ({ ...p, [noteId]: true }))
    try {
      const reply = await apiAddReply(noteId, text, user.displayName)
      setNotes((prev) => prev.map((n) =>
        n.id === noteId ? { ...n, replies: [...(n.replies ?? []), reply] } : n
      ))
      setReplyText((p) => ({ ...p, [noteId]: "" }))
    } catch (e) { console.error(e) }
    finally { setReplying((p) => ({ ...p, [noteId]: false })) }
  }

  const handleDeleteReply = async (noteId: string, replyId: string) => {
    await apiDeleteReply(noteId, replyId)
    setNotes((prev) => prev.map((n) =>
      n.id === noteId ? { ...n, replies: (n.replies ?? []).filter((r) => r.id !== replyId) } : n
    ))
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isOwn = (authorId: string) => authorId === user?.id

  return (
    <div className="cosmic-card rounded-3xl flex flex-col max-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#8b5cf6] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Our Notes</h3>
            <p className="text-xs text-muted-foreground">Share your moments 💭</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f472b6]/20 to-[#8b5cf6]/20 hover:from-[#f472b6]/30 hover:to-[#8b5cf6]/30 flex items-center justify-center transition-all"
        >
          <Plus className="w-4 h-4 text-[#f472b6]" />
        </button>
      </div>

      {/* Add note */}
      {showAdd && (
        <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened today? Share your moment… ✨"
            rows={4}
            className="cosmic-input w-full px-4 py-3 rounded-xl text-sm resize-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleCreate()
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ctrl+Enter to post</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setContent("") }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!content.trim() || saving}
                className="cosmic-btn px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center gap-2"
              >
                {saving
                  ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Send className="w-3.5 h-3.5" /> Post</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 py-8">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">No notes yet.<br />Share something that happened today 💕</p>
          </div>
        )}

        {notes.map((note) => {
          const isExpanded = expanded[note.id] ?? false
          const replies    = note.replies ?? []
          const own        = isOwn(note.author_id)

          return (
            <div key={note.id} className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              {/* Note header */}
              <div className="flex items-start gap-3 p-4">
                {/* Avatar placeholder */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  own
                    ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"
                    : "bg-gradient-to-br from-[#f472b6] to-[#8b5cf6]"
                } text-white`}>
                  {note.author_name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{note.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{fmtDate(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </div>

                {own && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-muted-foreground hover:text-[#f472b6] transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Reply bar */}
              <div className="px-4 pb-3 flex items-center gap-3 border-t border-white/5 pt-3">
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [note.id]: !isExpanded }))}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {replies.length > 0
                    ? <>{replies.length} {replies.length === 1 ? "reply" : "replies"} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</>
                    : "Reply"}
                </button>
                {replies.length === 0 && !isExpanded && (
                  <Heart className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                )}
              </div>

              {/* Replies expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isOwn(reply.author_id)
                          ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"
                          : "bg-gradient-to-br from-[#f472b6] to-[#8b5cf6]"
                      } text-white`}>
                        {reply.author_name[0]}
                      </div>
                      <div className="flex-1 min-w-0 bg-white/5 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-foreground">{reply.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">{fmtDate(reply.created_at)}</span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed">{reply.content}</p>
                      </div>
                      {isOwn(reply.author_id) && (
                        <button
                          onClick={() => handleDeleteReply(note.id, reply.id)}
                          className="text-muted-foreground hover:text-[#f472b6] mt-1 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Reply input */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white`}>
                      {user?.displayName[0]}
                    </div>
                    <input
                      value={replyText[note.id] ?? ""}
                      onChange={(e) => setReplyText((p) => ({ ...p, [note.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReply(note.id) }}
                      placeholder="Write a reply…"
                      className="cosmic-input flex-1 px-3 py-2 rounded-xl text-xs"
                    />
                    <button
                      onClick={() => handleReply(note.id)}
                      disabled={!replyText[note.id]?.trim() || replying[note.id]}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#f472b6] flex items-center justify-center disabled:opacity-40"
                    >
                      {replying[note.id]
                        ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        : <Send className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
