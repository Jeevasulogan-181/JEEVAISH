/**
 * lib/api-client.ts
 * All frontend API calls. Token stored in localStorage.
 * Auto-refreshes expired tokens using the refresh token.
 */

const TOKEN_KEY        = "cosmicus-token"
const REFRESH_KEY      = "cosmicus-refresh-token"
const EXPIRES_KEY      = "cosmicus-token-expires"
const USER_KEY         = "cosmicus-user"

export function setToken(token: string | null, refreshToken?: string, expiresAt?: number) {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    if (expiresAt)    localStorage.setItem(EXPIRES_KEY, String(expiresAt))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY)
}

function getExpiresAt(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(EXPIRES_KEY) ?? "0", 10)
}

function isTokenExpired(): boolean {
  const exp = getExpiresAt()
  if (!exp) return false
  return Date.now() / 1000 > exp - 300
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return false

    const data = await res.json()
    setToken(data.token, data.refreshToken, data.expiresAt)
    return true
  } catch {
    return false
  }
}

// ── Base fetch ────────────────────────────────────────────────────────────────
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isTokenExpired()) {
    await refreshAccessToken()
  }

  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (token) headers["Authorization"] = `Bearer ${token}`

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const newToken = getToken()
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`
      const retry = await fetch(path, { ...options, headers })
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: retry.statusText }))
        throw new Error(err.error ?? `API error ${retry.status}`)
      }
      return retry.json()
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `API error ${res.status}`)
  }

  return res.json()
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

export async function apiLogin(username: string, password: string) {
  return api<{
    token: string
    refreshToken: string
    expiresAt: number
    user: { id: string; username: string; displayName: string; avatarUrl?: string }
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export async function apiLogout() {
  return api("/api/auth/logout", { method: "POST" })
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export async function apiGetMessages() {
  return api<any[]>("/api/messages")
}

export async function apiSendMessage(payload: {
  sender_username: string
  display_name: string
  text: string
  file?: File
}) {
  if (payload.file) {
    const form = new FormData()
    form.append("text", payload.text)
    form.append("sender_username", payload.sender_username)
    form.append("display_name", payload.display_name)
    form.append("file", payload.file)
    return api<any>("/api/messages", { method: "POST", body: form })
  }
  return api<any>("/api/messages", {
    method: "POST",
    body: JSON.stringify({
      text:            payload.text,
      sender_username: payload.sender_username,
      display_name:    payload.display_name,
    }),
  })
}

export async function apiEditMessage(id: string, text: string) {
  return api<any>(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify({ text }) })
}

export async function apiDeleteMessage(id: string) {
  return api<any>(`/api/messages/${id}`, { method: "DELETE" })
}

// ── GALLERY ───────────────────────────────────────────────────────────────────

export async function apiGetGallery() {
  return api<any[]>("/api/gallery")
}

export async function apiUploadGalleryItem(file: File, caption: string) {
  const form = new FormData()
  form.append("file", file)
  form.append("caption", caption)
  return api<any>("/api/gallery", { method: "POST", body: form })
}

export async function apiToggleLike(id: string) {
  return api<any>(`/api/gallery/${id}`, { method: "PATCH" })
}

export async function apiDeleteGalleryItem(id: string) {
  return api<any>(`/api/gallery/${id}`, { method: "DELETE" })
}

// ── MOVIES ────────────────────────────────────────────────────────────────────

export async function apiGetMovies() {
  return api<any[]>("/api/movies")
}

export async function apiAddMovie(payload: { title: string; added_by: string; genre?: string }) {
  return api<any>("/api/movies", { method: "POST", body: JSON.stringify(payload) })
}

export async function apiUpdateMovie(id: string, updates: Record<string, unknown>) {
  return api<any>(`/api/movies/${id}`, { method: "PATCH", body: JSON.stringify(updates) })
}

export async function apiDeleteMovie(id: string) {
  return api<any>(`/api/movies/${id}`, { method: "DELETE" })
}

// ── MOVIE SYNC ────────────────────────────────────────────────────────────────

export async function apiGetMovieSync() {
  return api<any>("/api/movie-sync")
}

export async function apiSetMovieSync(state: {
  movieId: string; isPlaying: boolean; currentTime: number; startedBy: string
} | null) {
  return api<any>("/api/movie-sync", { method: "PATCH", body: JSON.stringify(state) })
}

// ── NOTES ─────────────────────────────────────────────────────────────────────

export async function apiGetNotes() {
  return api<any[]>("/api/notes")
}

export async function apiCreateNote(content: string, author_name: string) {
  return api<any>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ content, author_name }),
  })
}

export async function apiDeleteNote(id: string) {
  return api<any>(`/api/notes/${id}`, { method: "DELETE" })
}

export async function apiAddReply(noteId: string, content: string, author_name: string) {
  return api<any>(`/api/notes/${noteId}/replies`, {
    method: "POST",
    body: JSON.stringify({ content, author_name }),
  })
}

export async function apiDeleteReply(noteId: string, replyId: string) {
  return api<any>(`/api/notes/${noteId}/replies?replyId=${replyId}`, { method: "DELETE" })
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function apiGetSettings() {
  return api<any>("/api/settings")
}

export async function apiUpdateSettings(payload: {
  display_name?: string
  about?: string
  avatarFile?: File
}) {
  const form = new FormData()
  if (payload.display_name !== undefined) form.append("display_name", payload.display_name)
  if (payload.about !== undefined)        form.append("about", payload.about)
  if (payload.avatarFile)                 form.append("avatar", payload.avatarFile)
  return api<any>("/api/settings", { method: "PATCH", body: form })
}