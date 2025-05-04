"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BookLayoutProps {
  leftPage: ReactNode
  rightPage: ReactNode
}

export function BookLayout({ leftPage, rightPage }: BookLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = 2 // We have 2 pages in our book

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Book container */}
      <div className="relative w-full max-w-xl mx-auto bg-amber-50 rounded-lg shadow-2xl overflow-hidden border-t border-amber-100">
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
                  <div className="absolute bottom-2 right-4 text-amber-800/50 text-sm">1</div>
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
                  <div className="absolute bottom-2 left-4 text-amber-800/50 text-sm">2</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page turn buttons - moved outside the text area */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className={`absolute left-2 bottom-1/4 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100/80 backdrop-blur-sm text-amber-800 z-20 transition-opacity ${
            currentPage === 0 ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-amber-200/80"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className={`absolute right-2 bottom-1/4 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100/80 backdrop-blur-sm text-amber-800 z-20 transition-opacity ${
            currentPage === totalPages - 1 ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-amber-200/80"
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
