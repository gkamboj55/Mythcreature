"use client"

import { useEffect } from "react"

interface UseKeyboardNavigationProps {
  onNext?: () => void
  onPrev?: () => void
  onExit?: () => void
  onToggleFullscreen?: () => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onNext,
  onPrev,
  onExit,
  onToggleFullscreen,
  enabled = true,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Space":
          if (onNext) {
            e.preventDefault()
            onNext()
          }
          break
        case "ArrowLeft":
          if (onPrev) {
            e.preventDefault()
            onPrev()
          }
          break
        case "Escape":
          if (onExit) {
            e.preventDefault()
            onExit()
          }
          break
        case "f":
          if (onToggleFullscreen && e.ctrlKey) {
            e.preventDefault()
            onToggleFullscreen()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, onNext, onPrev, onExit, onToggleFullscreen])

  return { enabled }
}
