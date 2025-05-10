"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
  direction: "left" | "right" | "none"
  isActive: boolean
  duration?: number
}

export function PageTransition({ children, direction, isActive, duration = 0.5 }: PageTransitionProps) {
  // Different animation variants based on direction
  const variants = {
    enter: {
      x: direction === "right" ? "100%" : direction === "left" ? "-100%" : 0,
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: direction === "right" ? "-100%" : direction === "left" ? "100%" : 0,
      opacity: 0,
    },
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isActive && (
        <motion.div
          key={`page-transition-${direction}`}
          initial="enter"
          animate="center"
          exit="exit"
          variants={variants}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: duration * 0.5 },
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
