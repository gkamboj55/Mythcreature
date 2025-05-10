"use client"

import { useEffect, useRef, useState } from "react"

export type ThemeType = "forest" | "ocean" | "sky" | "mountain" | "magic" | "default"
export type IntensityType = "low" | "medium" | "high" | "none"

interface AmbientBackgroundProps {
  theme: ThemeType
  intensity: IntensityType
  className?: string
}

export function AmbientBackground({ theme = "default", intensity = "medium", className = "" }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  // Theme-based configuration
  const themeConfig = {
    forest: {
      colors: ["#8BC34A", "#4CAF50", "#009688", "#CDDC39"],
      particleCount: intensity === "high" ? 40 : intensity === "medium" ? 25 : 15,
      background: "from-green-900/30 to-teal-800/30",
    },
    ocean: {
      colors: ["#03A9F4", "#00BCD4", "#4FC3F7", "#B3E5FC"],
      particleCount: intensity === "high" ? 50 : intensity === "medium" ? 30 : 20,
      background: "from-blue-900/30 to-cyan-800/30",
    },
    sky: {
      colors: ["#FFEB3B", "#FFC107", "#FF9800", "#FFFFFF"],
      particleCount: intensity === "high" ? 60 : intensity === "medium" ? 40 : 25,
      background: "from-blue-400/30 to-indigo-600/30",
    },
    mountain: {
      colors: ["#9C27B0", "#673AB7", "#3F51B5", "#2196F3"],
      particleCount: intensity === "high" ? 45 : intensity === "medium" ? 30 : 20,
      background: "from-purple-900/30 to-indigo-800/30",
    },
    magic: {
      colors: ["#E91E63", "#9C27B0", "#673AB7", "#FFEB3B"],
      particleCount: intensity === "high" ? 70 : intensity === "medium" ? 50 : 30,
      background: "from-purple-500/30 to-pink-500/30",
    },
    default: {
      colors: ["#FFFFFF", "#E0E0E0", "#BDBDBD", "#9E9E9E"],
      particleCount: intensity === "high" ? 40 : intensity === "medium" ? 25 : 15,
      background: "from-purple-100/30 to-pink-100/30",
    },
  }

  const config = themeConfig[theme]

  // Skip particle animation if intensity is none
  const skipAnimation = intensity === "none"

  // Particle class
  class Particle {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    color: string

    constructor(canvas: HTMLCanvasElement, colors: string[]) {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.size = Math.random() * 3 + 1
      this.speedX = Math.random() * 0.5 - 0.25
      this.speedY = Math.random() * 0.5 - 0.25
      this.color = colors[Math.floor(Math.random() * colors.length)]
    }

    update(canvas: HTMLCanvasElement) {
      this.x += this.speedX
      this.y += this.speedY

      if (this.x > canvas.width) this.x = 0
      else if (this.x < 0) this.x = canvas.width

      if (this.y > canvas.height) this.y = 0
      else if (this.y < 0) this.y = canvas.height
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Initialize particles
  useEffect(() => {
    if (skipAnimation) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    // Create particles
    const newParticles = []
    for (let i = 0; i < config.particleCount; i++) {
      newParticles.push(new Particle(canvas, config.colors))
    }
    setParticles(newParticles)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [config.colors, config.particleCount, skipAnimation])

  // Animation loop
  useEffect(() => {
    if (skipAnimation || particles.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.update(canvas)
        particle.draw(ctx)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [particles, skipAnimation])

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-b ${config.background}`} />
      {!skipAnimation && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }} />
      )}
    </div>
  )
}
