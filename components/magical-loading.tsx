"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const loadingMessages = [
  "Creating your magical creature...",
  "Sprinkling fairy dust...",
  "Gathering stardust for sparkly features...",
  "Mixing rainbow colors...",
  "Weaving magical abilities...",
  "Crafting tiny magical wings...",
  "Polishing unicorn horns...",
  "Bottling enchanted giggles...",
  "Collecting moonbeams...",
  "Stirring the cauldron of creativity...",
  "Whispering to the magical forest...",
  "Consulting with wizard elders...",
  "Summoning friendly spirits...",
  "Brewing imagination potion...",
  "Planting seeds of wonder...",
]

export function MagicalLoading() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [showSparkle, setShowSparkle] = useState(false)

  // Change message every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)

      // Trigger sparkle animation
      setShowSparkle(true)
      setTimeout(() => setShowSparkle(false), 500)
    }, 3000)

    return () => clearInterval(messageInterval)
  }, [])

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center relative">
        <Sparkles className={`mr-2 h-5 w-5 ${showSparkle ? "text-yellow-500 animate-pulse" : "text-purple-400"}`} />

        <AnimatePresence mode="wait">
          <motion.span
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-purple-700 font-medium"
          >
            {loadingMessages[messageIndex]}
          </motion.span>
        </AnimatePresence>

        {/* Floating sparkles */}
        {showSparkle && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400 text-xs"
                initial={{
                  opacity: 1,
                  x: Math.random() * 40 - 20,
                  y: Math.random() * 40 - 20,
                }}
                animate={{
                  opacity: 0,
                  x: Math.random() * 80 - 40,
                  y: Math.random() * 80 - 40 - 50,
                  scale: 0,
                }}
                transition={{ duration: 1.5 }}
                style={{
                  left: `${50 + i * 10}%`,
                  top: `${50 + (i % 2 === 0 ? 10 : -10)}%`,
                }}
              >
                ✨
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex justify-center space-x-2">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            className="h-2 w-2 rounded-full bg-purple-300"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: dot * 0.4,
            }}
          />
        ))}
      </div>
    </div>
  )
}
