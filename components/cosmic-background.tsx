"use client"

import { useEffect, useRef } from "react"

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let stars: { x: number; y: number; size: number; opacity: number; speed: number; dir: number; hue: number }[] = []
    let shootingStars: { x: number; y: number; len: number; speed: number; opacity: number; angle: number }[] = []
    let constellationLines: { x1: number; y1: number; x2: number; y2: number; progress: number; opacity: number; growing: boolean }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    const init = () => {
      const count = Math.min(350, Math.floor((canvas.width * canvas.height) / 4000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.2,
        opacity: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        dir: Math.random() > 0.5 ? 1 : -1,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 230 : 280) : 0,
      }))

      // Create constellation connections between nearby stars
      constellationLines = []
      for (let i = 0; i < Math.min(stars.length, 100); i++) {
        for (let j = i + 1; j < Math.min(stars.length, 100); j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120 && Math.random() < 0.15) {
            constellationLines.push({
              x1: stars[i].x, y1: stars[i].y,
              x2: stars[j].x, y2: stars[j].y,
              progress: 0, opacity: 0, growing: true,
            })
          }
        }
      }
    }

    let time = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.005

      // Constellation lines
      for (const line of constellationLines) {
        if (line.growing) {
          line.opacity += 0.001
          if (line.opacity >= 0.08) line.growing = false
        } else {
          line.opacity -= 0.0005
          if (line.opacity <= 0.02) line.growing = true
        }
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.strokeStyle = `rgba(99, 102, 241, ${line.opacity})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Stars
      for (const star of stars) {
        star.opacity += star.speed * star.dir
        if (star.opacity >= 0.95) { star.opacity = 0.95; star.dir = -1 }
        if (star.opacity <= 0.15) { star.opacity = 0.15; star.dir = 1 }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        if (star.hue > 0) {
          ctx.fillStyle = `hsla(${star.hue}, 70%, 75%, ${star.opacity})`
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        }
        ctx.fill()

        // Glow for larger stars
        if (star.size > 1.2) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          if (star.hue > 0) {
            g.addColorStop(0, `hsla(${star.hue}, 60%, 70%, ${star.opacity * 0.3})`)
          } else {
            g.addColorStop(0, `rgba(200, 200, 255, ${star.opacity * 0.2})`)
          }
          g.addColorStop(1, "transparent")
          ctx.fillStyle = g
          ctx.fill()
        }
      }

      // Shooting stars
      if (Math.random() < 0.003 && shootingStars.length < 2) {
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 6)
        shootingStars.push({
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * canvas.height * 0.3,
          len: Math.random() * 100 + 60,
          speed: Math.random() * 14 + 10,
          opacity: 1,
          angle,
        })
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i]
        const tailX = ss.x - Math.cos(ss.angle) * ss.len
        const tailY = ss.y - Math.sin(ss.angle) * ss.len
        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY)
        grad.addColorStop(0, `rgba(200, 200, 255, ${ss.opacity})`)
        grad.addColorStop(0.3, `rgba(139, 92, 246, ${ss.opacity * 0.6})`)
        grad.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.moveTo(ss.x, ss.y)
        ctx.lineTo(tailX, tailY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Head glow
        ctx.beginPath()
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`
        ctx.fill()

        ss.x += Math.cos(ss.angle) * ss.speed
        ss.y += Math.sin(ss.angle) * ss.speed
        ss.opacity -= 0.012
        if (ss.opacity <= 0 || ss.x > canvas.width + 50 || ss.y > canvas.height + 50) {
          shootingStars.splice(i, 1)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050510]" />
      {/* Nebula layers */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#6366f1] opacity-[0.04] blur-[150px] animate-pulse-glow" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#f472b6] opacity-[0.035] blur-[140px] animate-pulse-glow" style={{ animationDelay: "2.5s" }} />
      <div className="absolute top-[40%] left-[40%] w-[700px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6] opacity-[0.025] blur-[180px] animate-pulse-glow" style={{ animationDelay: "5s" }} />
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Floating orbs */}
      <div className="absolute top-[15%] right-[20%] w-[200px] h-[200px] rounded-full bg-[#6366f1] opacity-[0.06] blur-[60px] animate-float" />
      <div className="absolute bottom-[20%] left-[15%] w-[180px] h-[180px] rounded-full bg-[#a855f7] opacity-[0.05] blur-[60px] animate-float-slow" style={{ animationDelay: "3s" }} />
      <div className="absolute top-[60%] right-[40%] w-[120px] h-[120px] rounded-full bg-[#f472b6] opacity-[0.04] blur-[50px] animate-float" style={{ animationDelay: "6s" }} />
    </div>
  )
}
