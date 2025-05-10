"use client"

import { useEffect } from "react"

interface UseKeyboardNavigationProps {
  onNextPage?: () => void
  onPrevPage?: () => void
  onNextStory?: () => void
  onPrevStory?: () => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onNextPage,
  onPrevPage,
  onNextStory,
  onPrevStory,
  enabled = true,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Space":
          if (onNextPage) {
            e.preventDefault()
            onNextPage()
          }
          break
        case "ArrowLeft":
          if (onPrevPage) {
            e.preventDefault()
            onPrevPage()
          }
          break
        case "ArrowDown":
        case "PageDown":
          if (onNextStory) {
            e.preventDefault()
            onNextStory()
          }
          break
        case "ArrowUp":
        case "PageUp":
          if (onPrevStory) {
            e.preventDefault()
            onPrevStory()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, onNextPage, onPrevPage, onNextStory, onPrevStory])

  return { enabled }
}
