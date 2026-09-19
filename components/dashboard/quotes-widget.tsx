"use client"

import { useState, useEffect } from "react"
import { getQuotes, type Quote } from "@/lib/data-service"
import { Quote as QuoteIcon, Heart, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

export function QuotesWidget() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [direction, setDirection] = useState<"left" | "right">("right")

  useEffect(() => {
    const q = getQuotes()
    setQuotes(q)
    setIndex(Math.floor(Math.random() * q.length))
  }, [])

  useEffect(() => {
    if (quotes.length === 0) return
    const interval = setInterval(() => {
      goNext()
    }, 10000)
    return () => clearInterval(interval)
  }, [quotes.length])

  const goNext = () => {
    setDirection("right")
    setFade(false)
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % quotes.length)
      setFade(true)
    }, 400)
  }

  const goPrev = () => {
    setDirection("left")
    setFade(false)
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + quotes.length) % quotes.length)
      setFade(true)
    }, 400)
  }

  const shuffle = () => {
    setFade(false)
    setTimeout(() => {
      let newIdx: number
      do { newIdx = Math.floor(Math.random() * quotes.length) } while (newIdx === index && quotes.length > 1)
      setIndex(newIdx)
      setFade(true)
    }, 400)
  }

  if (quotes.length === 0) return null
  const quote = quotes[index]

  return (
    <div className="cosmic-card rounded-2xl overflow-hidden relative">
      {/* Top glow line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#8b5cf6]/40 to-transparent" />

      {/* Decorative background quote mark */}
      <div className="absolute top-2 right-2 opacity-[0.03] pointer-events-none">
        <QuoteIcon className="w-20 h-20 text-[#8b5cf6]" />
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[rgba(255,255,255,0.04)]">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#f472b6] flex items-center justify-center shrink-0">
          <QuoteIcon className="w-3 h-3 text-white" />
        </div>
        <h3 className="font-serif font-semibold text-foreground text-xs truncate">Love Notes</h3>
      </div>

      <div className="px-4 py-4 min-h-[90px] flex items-center relative overflow-hidden">
        <div
          className={`transition-all duration-500 ease-out w-full ${
            fade
              ? "opacity-100 translate-x-0 scale-100"
              : direction === "right"
                ? "opacity-0 -translate-x-4 scale-98"
                : "opacity-0 translate-x-4 scale-98"
          }`}
        >
          <p className="text-foreground text-xs leading-relaxed italic font-serif text-balance">
            {'"'}{quote.text}{'"'}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <Heart className="w-2.5 h-2.5 text-[#f472b6] fill-[#f472b6] animate-heartbeat shrink-0" />
            <p className="text-muted-foreground text-[11px] font-medium truncate">{quote.author}</p>
          </div>
        </div>
      </div>

      {/* Controls + progress dots */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center transition-all hover:scale-105"
            aria-label="Previous quote"
          >
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={shuffle}
            className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center transition-all hover:scale-105 hover:rotate-180 duration-500"
            aria-label="Random quote"
          >
            <RefreshCw className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
          <button
            onClick={goNext}
            className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center transition-all hover:scale-105"
            aria-label="Next quote"
          >
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {quotes.slice(0, Math.min(quotes.length, 6)).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i === index % 6 ? "w-3 bg-[#8b5cf6]" : "w-1 bg-[rgba(255,255,255,0.08)]"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
