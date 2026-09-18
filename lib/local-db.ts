/**
 * lib/local-db.ts
 *
 * Fully local data store — no cloud, no external services.
 * Everything lives in a single JSON file on disk: data/db.json
 * (gitignored — it's your private data, it never leaves your machine).
 *
 * This is a small, synchronous read-modify-write store. That's intentional:
 * this app is used by two people at once at most, so there's no need for a
 * real database engine — a JSON file is simpler, has zero native
 * dependencies, and is trivial to back up or inspect.
 */

import fs from "fs"
import path from "path"
import crypto from "crypto"
import bcrypt from "bcryptjs"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string
  username: string
  password_hash: string
  display_name: string
  avatar_url: string | null
  about: string | null
  created_at: string
}

export interface MessageRow {
  id: string
  sender_id: string
  sender_username: string
  display_name: string
  text: string
  edited_at?: string
  attachment_url?: string
  attachment_type?: "image" | "video"
  attachment_name?: string
  created_at: string
}

export interface GalleryRow {
  id: string
  url: string
  caption: string
  type: "image" | "video"
  uploaded_by?: string
  liked: boolean
  created_at: string
}

export interface MovieRow {
  id: string
  title: string
  genre?: string | null
  added_by: string
  watched: boolean
  rating?: number | null
  poster?: string | null
  video_url?: string | null
  created_at: string
}

export interface MovieSyncRow {
  id: 1
  movie_id: string | null
  is_playing: boolean
  playback_time: number
  started_by: string | null
  updated_at: string
}

export interface NoteRow {
  id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

export interface ReplyRow {
  id: string
  note_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

interface DBShape {
  secret: string
  profiles: ProfileRow[]
  messages: MessageRow[]
  gallery_items: GalleryRow[]
  movies: MovieRow[]
  movie_sync: MovieSyncRow
  notes: NoteRow[]
  note_replies: ReplyRow[]
}

// ── Dummy default credentials ───────────────────────────────────────────────
// Ships with placeholder logins — change the password after first run
// (Settings page can't change passwords yet; edit data/db.json's password_hash
// with a fresh bcrypt hash, or delete data/db.json to reset to these defaults).
const DUMMY_PASSWORD = "ChangeMe@123"

const DATA_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "db.json")

function seedDefault(): DBShape {
  const now = new Date().toISOString()
  const hash = bcrypt.hashSync(DUMMY_PASSWORD, 10)
  return {
    secret: crypto.randomBytes(32).toString("hex"),
    profiles: [
      {
        id: crypto.randomUUID(),
        username: "husband",
        password_hash: hash,
        display_name: "Partner A",
        avatar_url: null,
        about: null,
        created_at: now,
      },
      {
        id: crypto.randomUUID(),
        username: "wife",
        password_hash: hash,
        display_name: "Partner B",
        avatar_url: null,
        about: null,
        created_at: now,
      },
    ],
    messages: [],
    gallery_items: [],
    movies: [],
    movie_sync: { id: 1, movie_id: null, is_playing: false, playback_time: 0, started_by: null, updated_at: now },
    notes: [],
    note_replies: [],
  }
}

function ensureDb(): DBShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    const fresh = seedDefault()
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), "utf8")
    return fresh
  }
  const raw = fs.readFileSync(DB_PATH, "utf8")
  try {
    const parsed = JSON.parse(raw) as Partial<DBShape>
    // Backfill any fields missing from an older db.json
    return {
      secret: parsed.secret ?? crypto.randomBytes(32).toString("hex"),
      profiles: parsed.profiles ?? [],
      messages: parsed.messages ?? [],
      gallery_items: parsed.gallery_items ?? [],
      movies: parsed.movies ?? [],
      movie_sync: parsed.movie_sync ?? { id: 1, movie_id: null, is_playing: false, playback_time: 0, started_by: null, updated_at: new Date().toISOString() },
      notes: parsed.notes ?? [],
      note_replies: parsed.note_replies ?? [],
    }
  } catch {
    // Corrupt file — back it up and start fresh rather than losing writes silently
    fs.copyFileSync(DB_PATH, `${DB_PATH}.corrupt-${Date.now()}.bak`)
    const fresh = seedDefault()
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), "utf8")
    return fresh
  }
}

function readDb(): DBShape {
  return ensureDb()
}

function writeDb(db: DBShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8")
}

export function getJwtSecret(): string {
  return readDb().secret
}

// ── PROFILES / AUTH ───────────────────────────────────────────────────────────

export function getProfileByUsername(username: string): ProfileRow | null {
  const db = readDb()
  return db.profiles.find((p) => p.username === username.toLowerCase().trim()) ?? null
}

export function getProfileById(id: string): ProfileRow | null {
  const db = readDb()
  return db.profiles.find((p) => p.id === id) ?? null
}

export function verifyPassword(profile: ProfileRow, password: string): boolean {
  return bcrypt.compareSync(password, profile.password_hash)
}

export function updateProfile(id: string, updates: Partial<Pick<ProfileRow, "display_name" | "about" | "avatar_url">>): ProfileRow | null {
  const db = readDb()
  const p = db.profiles.find((x) => x.id === id)
  if (!p) return null
  Object.assign(p, updates)
  writeDb(db)
  return p
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export function getMessages(): MessageRow[] {
  return readDb().messages.slice().sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function addMessage(row: Omit<MessageRow, "id" | "created_at">): MessageRow {
  const db = readDb()
  const msg: MessageRow = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  db.messages.push(msg)
  writeDb(db)
  return msg
}

export function getMessageById(id: string): MessageRow | null {
  return readDb().messages.find((m) => m.id === id) ?? null
}

export function updateMessage(id: string, text: string): MessageRow | null {
  const db = readDb()
  const msg = db.messages.find((m) => m.id === id)
  if (!msg) return null
  msg.text = text
  msg.edited_at = new Date().toISOString()
  writeDb(db)
  return msg
}

export function deleteMessage(id: string): void {
  const db = readDb()
  db.messages = db.messages.filter((m) => m.id !== id)
  writeDb(db)
}

// ── GALLERY ───────────────────────────────────────────────────────────────────

export function getGalleryItems(): GalleryRow[] {
  return readDb().gallery_items.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function addGalleryItems(rows: Omit<GalleryRow, "id" | "created_at">[]): GalleryRow[] {
  const db = readDb()
  const created = rows.map((row) => ({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
  db.gallery_items.push(...created)
  writeDb(db)
  return created
}

export function getGalleryItemById(id: string): GalleryRow | null {
  return readDb().gallery_items.find((g) => g.id === id) ?? null
}

export function toggleGalleryLike(id: string): GalleryRow | null {
  const db = readDb()
  const item = db.gallery_items.find((g) => g.id === id)
  if (!item) return null
  item.liked = !item.liked
  writeDb(db)
  return item
}

export function deleteGalleryItem(id: string): GalleryRow | null {
  const db = readDb()
  const item = db.gallery_items.find((g) => g.id === id) ?? null
  db.gallery_items = db.gallery_items.filter((g) => g.id !== id)
  writeDb(db)
  return item
}

// ── MOVIES ────────────────────────────────────────────────────────────────────

export function getMovies(): MovieRow[] {
  return readDb().movies.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function addMovie(row: { title: string; genre?: string | null; added_by: string }): MovieRow {
  const db = readDb()
  const movie: MovieRow = {
    id: crypto.randomUUID(),
    title: row.title,
    genre: row.genre ?? null,
    added_by: row.added_by,
    watched: false,
    rating: null,
    poster: null,
    video_url: null,
    created_at: new Date().toISOString(),
  }
  db.movies.push(movie)
  writeDb(db)
  return movie
}

export function updateMovie(id: string, updates: Partial<MovieRow>): MovieRow | null {
  const db = readDb()
  const movie = db.movies.find((m) => m.id === id)
  if (!movie) return null
  Object.assign(movie, updates)
  writeDb(db)
  return movie
}

export function deleteMovie(id: string): void {
  const db = readDb()
  db.movies = db.movies.filter((m) => m.id !== id)
  writeDb(db)
}

// ── MOVIE SYNC ────────────────────────────────────────────────────────────────

export function getMovieSync(): MovieSyncRow {
  return readDb().movie_sync
}

export function setMovieSync(update: Partial<Omit<MovieSyncRow, "id">>): MovieSyncRow {
  const db = readDb()
  db.movie_sync = { ...db.movie_sync, ...update, id: 1, updated_at: new Date().toISOString() }
  writeDb(db)
  return db.movie_sync
}

// ── NOTES ─────────────────────────────────────────────────────────────────────

export function getNotesWithReplies(): (NoteRow & { replies: ReplyRow[] })[] {
  const db = readDb()
  return db.notes
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((n) => ({ ...n, replies: db.note_replies.filter((r) => r.note_id === n.id) }))
}

export function addNote(row: { author_id: string; author_name: string; content: string }): NoteRow & { replies: ReplyRow[] } {
  const db = readDb()
  const note: NoteRow = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  db.notes.push(note)
  writeDb(db)
  return { ...note, replies: [] }
}

export function getNoteById(id: string): NoteRow | null {
  return readDb().notes.find((n) => n.id === id) ?? null
}

export function deleteNote(id: string): void {
  const db = readDb()
  db.notes = db.notes.filter((n) => n.id !== id)
  db.note_replies = db.note_replies.filter((r) => r.note_id !== id)
  writeDb(db)
}

export function addReply(row: { note_id: string; author_id: string; author_name: string; content: string }): ReplyRow {
  const db = readDb()
  const reply: ReplyRow = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  db.note_replies.push(reply)
  writeDb(db)
  return reply
}

export function getReplyById(id: string): ReplyRow | null {
  return readDb().note_replies.find((r) => r.id === id) ?? null
}

export function deleteReply(id: string): void {
  const db = readDb()
  db.note_replies = db.note_replies.filter((r) => r.id !== id)
  writeDb(db)
}
