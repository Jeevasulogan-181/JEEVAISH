/**
 * lib/data-service.ts
 *
 * All data access goes through the API layer (/api/...).
 * No direct Supabase calls from the browser.
 * Realtime still uses Supabase WebSocket (it's a subscription, not a write).
 */

import {
  apiGetMessages, apiSendMessage, apiEditMessage, apiDeleteMessage,
  apiGetGallery, apiUploadGalleryItem, apiToggleLike, apiDeleteGalleryItem,
  apiGetMovies, apiAddMovie, apiUpdateMovie, apiDeleteMovie,
  apiGetMovieSync, apiSetMovieSync,
} from "./api-client"
import { getSupabase } from "./supabase"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
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

export interface GalleryItem {
  id: string
  url: string
  caption: string
  type: "image" | "video"
  uploaded_by?: string
  liked: boolean
  created_at: string
}

export interface Movie {
  id: string
  title: string
  genre?: string
  added_by: string
  watched: boolean
  rating?: number
  poster?: string
  video_url?: string
  created_at: string
}

export interface MovieSyncState {
  movieId: string
  isPlaying: boolean
  currentTime: number
  startedBy: string
  timestamp: number
}

export interface Quote { id: string; text: string; author: string }

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export async function getMessages(): Promise<Message[]> {
  try { return await apiGetMessages() }
  catch (e) { console.error("[CosmicUs] getMessages:", e); return [] }
}

export async function saveMessage(payload: {
  sender_id: string
  sender_username: string
  display_name: string
  text: string
  attachmentFile?: File
}): Promise<Message> {
  return apiSendMessage({
    sender_username: payload.sender_username,
    display_name: payload.display_name,
    text: payload.text,
    file: payload.attachmentFile,
  })
}

export async function updateMessage(id: string, text: string): Promise<void> {
  await apiEditMessage(id, text)
}

export async function deleteMessage(id: string): Promise<void> {
  await apiDeleteMessage(id)
}

export function subscribeToMessages(
  onInsert: (msg: Message) => void,
  onUpdate: (msg: Message) => void,
  onDelete: (id: string) => void,
): () => void {
  const channel = getSupabase()
    .channel("realtime:messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
      (p) => onInsert(p.new as Message))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" },
      (p) => onUpdate(p.new as Message))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" },
      (p) => onDelete((p.old as any).id))
    .subscribe()
  return () => { getSupabase().removeChannel(channel) }
}

// ── GALLERY ───────────────────────────────────────────────────────────────────

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try { return await apiGetGallery() }
  catch (e) { console.error("[CosmicUs] getGallery:", e); return [] }
}

export async function addGalleryItem(
  meta: { caption: string; type: "image" | "video"; uploaded_by: string },
  file: File,
): Promise<GalleryItem> {
  return apiUploadGalleryItem(file, meta.caption)
}

export async function toggleGalleryLike(id: string): Promise<void> {
  await apiToggleLike(id)
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await apiDeleteGalleryItem(id)
}

export function subscribeToGallery(onChange: () => void): () => void {
  const channel = getSupabase()
    .channel("realtime:gallery")
    .on("postgres_changes", { event: "*", schema: "public", table: "gallery_items" }, onChange)
    .subscribe()
  return () => { getSupabase().removeChannel(channel) }
}

// ── MOVIES ────────────────────────────────────────────────────────────────────

export async function getMovies(): Promise<Movie[]> {
  try { return await apiGetMovies() }
  catch (e) { console.error("[CosmicUs] getMovies:", e); return [] }
}

export async function addMovie(
  movie: Omit<Movie, "id" | "created_at">,
): Promise<Movie> {
  return apiAddMovie({
    title: movie.title,
    added_by: movie.added_by,
    genre: movie.genre,
  })
}

export async function updateMovie(id: string, updates: Partial<Movie>): Promise<void> {
  await apiUpdateMovie(id, updates)
}

export async function deleteMovie(id: string): Promise<void> {
  await apiDeleteMovie(id)
}

export function subscribeToMovies(onChange: () => void): () => void {
  const channel = getSupabase()
    .channel("realtime:movies")
    .on("postgres_changes", { event: "*", schema: "public", table: "movies" }, onChange)
    .subscribe()
  return () => { getSupabase().removeChannel(channel) }
}

// ── MOVIE SYNC ────────────────────────────────────────────────────────────────

export async function getMovieSyncState(): Promise<MovieSyncState | null> {
  try {
    const data = await apiGetMovieSync()
    if (!data?.movie_id) return null
    return {
      movieId: data.movie_id,
      isPlaying: data.is_playing,
      currentTime: data.playback_time,
      startedBy: data.started_by ?? "",
      timestamp: new Date(data.updated_at).getTime(),
    }
  } catch { return null }
}

export async function setMovieSyncState(
  state: { movieId: string; isPlaying: boolean; currentTime: number; startedBy: string } | null,
): Promise<void> {
  await apiSetMovieSync(state)
}

export function subscribeToMovieSync(
  onChange: (sync: MovieSyncState | null) => void,
): () => void {
  const channel = getSupabase()
    .channel("realtime:movie_sync")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "movie_sync" },
      async () => { onChange(await getMovieSyncState()) })
    .subscribe()
  return () => { getSupabase().removeChannel(channel) }
}

// ── QUOTES (static) ───────────────────────────────────────────────────────────

export function getQuotes(): Quote[] {
  return [
    { id: "1",  text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
    { id: "2",  text: "I have found the one whom my soul loves.", author: "Song of Solomon 3:4" },
    { id: "3",  text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Bronte" },
    { id: "4",  text: "You are my sun, my moon, and all my stars.", author: "E.E. Cummings" },
    { id: "5",  text: "I would rather spend one lifetime with you, than face all the ages of this world alone.", author: "J.R.R. Tolkien" },
    { id: "6",  text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
    { id: "7",  text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
    { id: "8",  text: "You know you're in love when you can't fall asleep because reality is finally better than your dreams.", author: "Dr. Seuss" },
    { id: "9",  text: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
    { id: "10", text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
    { id: "11", text: "Grow old with me, the best is yet to be.", author: "Robert Browning" },
    { id: "12", text: "Where there is love there is life.", author: "Mahatma Gandhi" },
    { id: "13", text: "Being deeply loved by someone gives you strength.", author: "Lao Tzu" },
    { id: "14", text: "Love recognizes no barriers.", author: "Maya Angelou" },
    { id: "15", text: "My heart is and always will be yours.", author: "Jane Austen" },
    { id: "16", text: "Every love story is beautiful, but ours is my favorite.", author: "Unknown" },
  ]
}
