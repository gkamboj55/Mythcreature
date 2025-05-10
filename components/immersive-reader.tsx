"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ReaderControls } from "./reader-controls"
import { AmbientBackground, type ThemeType } from "./ambient-background"
import { useSwipe } from "@/hooks/use-swipe"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { useOrientation } from "@/hooks/use-orientation"

interface ImmersiveReaderProps {
  children: React.ReactNode
  onPageChange: (direction: "next" | "prev") => void
  onExit: () => void
  hasNextPage: boolean
  hasPrevPage: boolean
  currentPage: number
  totalPages: number
  theme?: ThemeType
}

export function ImmersiveReader({
  children,
  onPageChange,
  onExit,
  hasNextPage,
  hasPrevPage,
  currentPage,
  totalPages,
  theme = "default",
}: ImmersiveReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen(readerRef)
  const orientation = useOrientation()

  // Handle swipe gestures
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe({
    onSwipeLeft: () => {
      if (hasNextPage) onPageChange("next")
    },
    onSwipeRight: () => {
      if (hasPrevPage) onPageChange("prev")
    },
  })

  // Handle keyboard navigation
  useKeyboardNavigation({
    onNext: () => {
      if (hasNextPage) onPageChange("next")
    },
    onPrev: () => {
      if (hasPrevPage) onPageChange("prev")
    },
    onExit,
    onToggleFullscreen: toggleFullscreen,
  })

  // Automatically enter fullscreen on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && !isFullscreen && readerRef.current) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        toggleFullscreen()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isFullscreen, toggleFullscreen])

  return (
    <div
      ref={readerRef}
      className={`fixed inset-0 bg-black z-50 overflow-hidden ${isFullscreen ? "fullscreen-mode" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background */}
      <AmbientBackground theme={theme} intensity="medium" />

      {/* Reader controls */}
      <ReaderControls
        onExit={onExit}
        onNext={() => onPageChange("next")}
        onPrev={() => onPageChange("prev")}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        hasNext={hasNextPage}
        hasPrev={hasPrevPage}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Content container with responsive layout */}
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center p-4 ${
          orientation === "portrait" ? "portrait-layout" : "landscape-layout"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`bg-transparent max-w-full max-h-full ${
            orientation === "portrait" ? "w-full md:w-[90%] lg:w-[80%]" : "w-[95%] md:w-[90%] lg:w-[85%]"
          }`}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
