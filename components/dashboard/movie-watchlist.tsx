"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getMovies, addMovie, updateMovie, deleteMovie,
  getMovieSyncState, setMovieSyncState,
  subscribeToMovies, subscribeToMovieSync,
  type Movie, type MovieSyncState,
} from "@/lib/data-service"
import {
  Film, Plus, X, Check, Star, Eye, Popcorn,
  ChevronDown, ChevronUp, Play, Pause, Maximize2, Users,
} from "lucide-react"

export function MovieWatchlist() {
  const { user } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [showWatched, setShowWatched] = useState(false)
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<MovieSyncState | null>(null)
  const [fullscreenMovie, setFullscreenMovie] = useState<Movie | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const reload = useCallback(() => { getMovies().then(setMovies) }, [])

  useEffect(() => {
    reload()
    const unsubMovies = subscribeToMovies(reload)
    const unsubSync = subscribeToMovieSync(setSyncState)
    return () => { unsubMovies(); unsubSync() }
  }, [reload])

  // Sync partner playback
  useEffect(() => {
    if (!syncState || syncState.startedBy === user?.username) return
    if (syncState.isPlaying && playingId !== syncState.movieId) setPlayingId(syncState.movieId)
    else if (!syncState.isPlaying && playingId === syncState.movieId) setPlayingId(null)
  }, [syncState, user?.username, playingId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !user) return
    await addMovie({ title: newTitle.trim(), added_by: user.displayName, watched: false })
    setNewTitle(""); setShowAdd(false)
  }

  const handleToggleWatched = async (movie: Movie) => {
    setAnimatingId(movie.id)
    await updateMovie(movie.id, { watched: !movie.watched })
    setTimeout(() => setAnimatingId(null), 600)
  }

  const handlePlayToggle = async (movie: Movie) => {
    if (!user) return
    const isPlaying = playingId === movie.id
    setPlayingId(isPlaying ? null : movie.id)
    await setMovieSyncState(isPlaying ? null : {
      movieId: movie.id,
      isPlaying: true,
      currentTime: videoRef.current?.currentTime ?? 0,
      startedBy: user.username,
    })
  }

  const unwatched = movies.filter((m) => !m.watched)
  const watched = movies.filter((m) => m.watched)

  const renderCard = (movie: Movie) => (
    <div
      key={movie.id}
      className={`flex flex-col gap-2 p-3 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 transition-all ${animatingId === movie.id ? "scale-95 opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
          {movie.poster
            ? <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            : <Film className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight truncate ${movie.watched ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {movie.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Added by {movie.added_by}</p>
          {movie.genre && <span className="text-[10px] text-[#8b5cf6] mt-1 inline-block">{movie.genre}</span>}
          {movie.watched && (
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => updateMovie(movie.id, { rating: n })}
                  className={`transition-colors ${n <= (movie.rating ?? 0) ? "text-[#f472b6]" : "text-white/20 hover:text-[#f472b6]/60"}`}>
                  <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => handleToggleWatched(movie)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${movie.watched ? "bg-[#4ade80]/20 text-[#4ade80]" : "bg-white/5 text-muted-foreground hover:text-[#4ade80]"}`}
          >
            {movie.watched ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          {movie.video_url && (
            <button
              onClick={() => handlePlayToggle(movie)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${playingId === movie.id ? "bg-[#6366f1]/30 text-[#818cf8]" : "bg-white/5 text-muted-foreground hover:text-[#818cf8]"}`}
            >
              {playingId === movie.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => deleteMovie(movie.id)}
            className="w-7 h-7 rounded-lg bg-white/5 text-muted-foreground hover:text-[#f472b6] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {movie.video_url && playingId === movie.id && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} src={movie.video_url} className="w-full max-h-48 object-contain" controls autoPlay />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => setFullscreenMovie(movie)}
              className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-white/70 hover:text-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {syncState && syncState.startedBy !== user?.username && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 rounded-lg px-2 py-1">
              <Users className="w-3 h-3 text-[#f472b6]" />
              <span className="text-[10px] text-white/70">Synced</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="cosmic-card rounded-3xl flex flex-col max-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center">
            <Popcorn className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Watch Together</h3>
            <p className="text-xs text-muted-foreground">{unwatched.length} to watch · {watched.length} watched</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-[#6366f1]/20 hover:from-[#8b5cf6]/30 hover:to-[#6366f1]/30 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 text-[#8b5cf6]" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 border-b border-white/5 flex gap-2 shrink-0">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Movie title…"
            className="cosmic-input flex-1 px-4 py-2 rounded-xl text-sm"
            autoFocus
          />
          <button type="submit" className="px-3 py-2 rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 text-sm font-medium">
            Add
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {unwatched.length === 0 && watched.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 py-8">
            <Film className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add movies to watch together 🍿</p>
          </div>
        )}
        {unwatched.map(renderCard)}
        {watched.length > 0 && (
          <div>
            <button
              onClick={() => setShowWatched((v) => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full py-2"
            >
              {showWatched ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {watched.length} watched
            </button>
            {showWatched && <div className="space-y-2 mt-1">{watched.map(renderCard)}</div>}
          </div>
        )}
      </div>

      {fullscreenMovie && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-black/80 shrink-0">
            <span className="text-white font-medium">{fullscreenMovie.title}</span>
            <button onClick={() => setFullscreenMovie(null)} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <video src={fullscreenMovie.video_url} className="flex-1 w-full object-contain" controls autoPlay />
        </div>
      )}
    </div>
  )
}
