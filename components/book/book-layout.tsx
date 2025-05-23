"use client"

import { useState, type ReactNode, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BookLayoutProps {
  leftPage: ReactNode
  rightPage: ReactNode
  onNextStory?: () => void
  onPrevStory?: () => void
  hasNextStory?: boolean
  hasPrevStory?: boolean
}

export function BookLayout({
  leftPage,
  rightPage,
  onNextStory,
  onPrevStory,
  hasNextStory = false,
  hasPrevStory = false,
}: BookLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = 2 // We have 2 pages in our book

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    } else if (onNextStory && hasNextStory) {
      // If we're on the last page and there's a next story, go to it
      setCurrentPage(0) // Reset to first page
      onNextStory()
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    } else if (onPrevStory && hasPrevStory) {
      // If we're on the first page and there's a previous story, go to it
      setCurrentPage(totalPages - 1) // Go to last page of previous story
      onPrevStory()
    }
  }

  // Reset to first page when story changes
  useEffect(() => {
    setCurrentPage(0)
  }, [leftPage, rightPage])

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Book container */}
      <div className="relative w-full max-w-3xl mx-auto bg-amber-50 rounded-lg shadow-2xl overflow-hidden border-t border-amber-100">
        {/* Pages container */}
        <div>
          <AnimatePresence mode="wait">
            {currentPage === 0 ? (
              <motion.div
                key="page0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Left page */}
                <div className="w-full p-6 bg-amber-50 relative book-page">
                  <div className="pr-4">{leftPage}</div>
                  {/* Page number is now handled in the BookPageLeft component */}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="page1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Right page */}
                <div className="w-full p-6 bg-amber-50 relative book-page">
                  <div className="pl-4">{rightPage}</div>
                  {/* Page number is now handled in the BookPageRight component */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page turn buttons - moved outside the text area */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0 && !hasPrevStory}
          className={`absolute left-2 bottom-1/4 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100/80 backdrop-blur-sm text-amber-800 z-20 transition-opacity ${
            currentPage === 0 && !hasPrevStory ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-amber-200/80"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1 && !hasNextStory}
          className={`absolute right-2 bottom-1/4 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100/80 backdrop-blur-sm text-amber-800 z-20 transition-opacity ${
            currentPage === totalPages - 1 && !hasNextStory
              ? "opacity-0 pointer-events-none"
              : "opacity-100 hover:bg-amber-200/80"
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
