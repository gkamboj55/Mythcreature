"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Maximize, Minimize, Home } from "lucide-react"

interface ReaderControlsProps {
  onExit: () => void
  onNext: () => void
  onPrev: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  hasNext: boolean
  hasPrev: boolean
  currentPage: number
  totalPages: number
  className?: string
}

export function ReaderControls({
  onExit,
  onNext,
  onPrev,
  onToggleFullscreen,
  isFullscreen,
  hasNext,
  hasPrev,
  currentPage,
  totalPages,
  className = "",
}: ReaderControlsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null)

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleActivity = () => {
      setIsVisible(true)

      // Reset the idle timer
      if (idleTimer) clearTimeout(idleTimer)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000) // Hide after 3 seconds of inactivity

      setIdleTimer(timer)
    }

    // Set up event listeners for user activity
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("click", handleActivity)
    window.addEventListener("touchstart", handleActivity)
    window.addEventListener("keydown", handleActivity)

    // Initial timer
    handleActivity()

    return () => {
      if (idleTimer) clearTimeout(idleTimer)
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("touchstart", handleActivity)
      window.removeEventListener("keydown", handleActivity)
    }
  }, [idleTimer])

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Top controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/30 to-transparent ${className}`}
          >
            <Button variant="ghost" size="sm" onClick={onExit} className="text-white hover:bg-black/20">
              <Home className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Exit</span>
            </Button>

            <div className="text-white text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </div>

            <Button variant="ghost" size="sm" onClick={onToggleFullscreen} className="text-white hover:bg-black/20">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </motion.div>

          {/* Left/Right navigation buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center z-40">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                disabled={!hasPrev}
                className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 disabled:opacity-0"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center z-40">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!hasNext}
                className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 disabled:opacity-0"
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>

          {/* Bottom controls - page indicator dots */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center z-40"
          >
            <div className="flex space-x-1 px-3 py-1.5 bg-black/20 rounded-full">
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                // If we have more than 10 pages, show ellipsis in the middle
                if (totalPages > 10) {
                  if (i === 4 && currentPage >= 7 && currentPage < totalPages - 3) {
                    return (
                      <div
                        key="ellipsis-1"
                        className="w-2 h-2 rounded-full bg-white/30 flex items-center justify-center"
                      >
                        <span className="text-xs">•••</span>
                      </div>
                    )
                  }

                  // Logic to show dots around current page and at start/end
                  let showDot = false
                  if (i < 3)
                    showDot = true // First 3 dots
                  else if (i >= totalPages - 3)
                    showDot = true // Last 3 dots
                  else if (Math.abs(i - currentPage) < 2) showDot = true // Dots around current

                  if (!showDot) return null
                }

                return (
                  <div
                    key={`dot-${i}`}
                    className={`w-2 h-2 rounded-full ${
                      i === currentPage ? "bg-white" : "bg-white/30"
                    } transition-colors duration-200`}
                  />
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
