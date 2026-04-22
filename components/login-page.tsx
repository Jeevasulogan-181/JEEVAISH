"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getQuotes, type Quote } from "@/lib/data-service"
import { Heart, Lock, User, Eye, EyeOff } from "lucide-react"

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [quotes] = useState<Quote[]>(getQuotes())
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteFade, setQuoteFade] = useState(true)
  const [shakeError, setShakeError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    setQuoteIndex(Math.floor(Math.random() * getQuotes().length))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false)
      setTimeout(() => { setQuoteIndex((p) => (p + 1) % quotes.length); setQuoteFade(true) }, 500)
    }, 7000)
    return () => clearInterval(interval)
  }, [quotes.length])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)
    if (!ok) {
      setError("Invalid credentials")
      setShakeError(true)
      setTimeout(() => setShakeError(false), 600)
    }
  }, [username, password, login])

  const currentQuote = quotes[quoteIndex]

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4">
      <div className="absolute w-[500px] h-[500px] rounded-full border border-[rgba(99,102,241,0.06)] animate-spin-slow pointer-events-none" />
      <div className="absolute w-[380px] h-[380px] rounded-full border border-[rgba(244,114,182,0.04)] animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

      <div className={`w-full max-w-[420px] transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 animate-orbit">
              <div className="w-2 h-2 rounded-full bg-[#f472b6]" />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#f472b6] flex items-center justify-center animate-glow-pulse rotate-[8deg]">
              <Heart className="w-9 h-9 text-white fill-white animate-heartbeat" />
            </div>
          </div>
          <h1 className="font-serif text-5xl font-bold cosmic-gradient-text mb-3">CosmicUs</h1>
          <p className="text-muted-foreground text-sm tracking-wide">Our private corner of the universe</p>
        </div>

        {currentQuote && (
          <div className="text-center mb-10 h-20 flex items-center justify-center px-6">
            <div className={`transition-all duration-500 ${quoteFade ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"}`}>
              <p className="text-[#8888aa] text-sm italic leading-relaxed">"{currentQuote.text}"</p>
              <p className="text-[#555577] text-xs mt-2">-- {currentQuote.author}</p>
            </div>
          </div>
        )}

        <div className={`cosmic-card rounded-3xl p-8 ${shakeError ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#6366f1] to-[#f472b6]" />
            <h2 className="font-serif text-xl font-semibold text-foreground">Welcome Back</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577] group-focus-within:text-[#6366f1] transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="husband or wife"
                  className="cosmic-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577] group-focus-within:text-[#6366f1] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="cosmic-input w-full pl-11 pr-11 py-3.5 rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555577] hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-[#f472b6] bg-[#f472b6]/8 px-4 py-2.5 rounded-xl border border-[#f472b6]/15">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cosmic-btn w-full py-3.5 rounded-xl font-semibold text-sm mt-1 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Heart className="w-4 h-4" /> Enter Our Space</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#444466] text-xs mt-8 tracking-wide">
          Only two souls have the key to this universe
        </p>
      </div>
    </div>
  )
}
