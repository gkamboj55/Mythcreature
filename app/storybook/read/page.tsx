"use client"

import { useEffect, useState } from "react"
import { getStorybook, getStorybookById } from "@/app/actions/storybook"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Home, BookOpen } from "lucide-react"
import Link from "next/link"
import { BookLayout } from "@/components/book/book-layout"
import { BookPageLeft } from "@/components/book/book-page-left"
import { BookPageRight } from "@/components/book/book-page-right"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function ReadStorybookPage() {
  const [storybook, setStorybook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Set document title
  useEffect(() => {
    if (storybook) {
      document.title = `Reading ${storybook.book_name} - Magical Creature Creator`
    } else {
      document.title = "Reading Storybook - Magical Creature Creator"
    }
  }, [storybook])

  // Get the starting page from URL or default to 0
  useEffect(() => {
    const pageParam = searchParams.get("page")
    if (pageParam) {
      const pageNum = Number.parseInt(pageParam, 10)
      if (!isNaN(pageNum) && pageNum >= 0) {
        setCurrentStoryIndex(pageNum)
      }
    }
  }, [searchParams])

  useEffect(() => {
    async function loadStorybook() {
      try {
        setIsLoading(true)

        // Check if a specific storybook ID is provided
        const storybookId = searchParams.get("id")

        let book
        if (storybookId) {
          // Get a specific storybook by ID
          book = await getStorybookById(Number.parseInt(storybookId, 10))
          console.log("Loaded specific storybook by ID:", book)
        } else {
          // Get the default storybook
          const deviceId = getOrCreateDeviceId()
          book = await getStorybook(deviceId)
          console.log("Loaded default storybook:", book)
        }

        setStorybook(book)
      } catch (error) {
        console.error("Error loading storybook:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStorybook()
  }, [searchParams])

  // Navigation handlers
  const handleNextStory = () => {
    if (currentStoryIndex < (storybook?.entries?.length || 0) - 1) {
      const nextIndex = currentStoryIndex + 1
      setCurrentStoryIndex(nextIndex)

      // Update URL without full page reload
      const url = new URL(window.location.href)
      url.searchParams.set("page", nextIndex.toString())
      router.replace(url.pathname + url.search)
    }
  }

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1
      setCurrentStoryIndex(prevIndex)

      // Update URL without full page reload
      const url = new URL(window.location.href)
      url.searchParams.set("page", prevIndex.toString())
      router.replace(url.pathname + url.search)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-800 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-amber-800">Opening your magical storybook...</h2>
        </div>
      </div>
    )
  }

  if (!storybook || !storybook.entries || storybook.entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-amber-800 mb-6">Your Storybook is Empty</h1>
          <p className="text-amber-700 mb-8">
            Create magical creatures and add them to your storybook to start reading!
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/storybook" passHref>
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Storybook
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700">
                Create a Creature
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get the current story based on page number
  const currentStory = storybook.entries[currentStoryIndex]
  if (!currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-amber-800 mb-6">Page Not Found</h1>
          <p className="text-amber-700 mb-8">This page doesn't exist in your storybook.</p>
          <div className="flex justify-center space-x-4">
            <Link href={`/storybook?id=${storybook.id}`} passHref>
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Storybook
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Extract story data
  const creature = currentStory.creatures?.creature_data?.creatureDetails || {}
  const storyResult = currentStory.creatures?.creature_data?.storyResult || {}
  const story = storyResult.story || ""

  // Split the story into paragraphs
  const paragraphs = story.split("\n\n").filter((p: string) => p.trim() !== "")
  const firstParagraph = paragraphs.length > 0 ? paragraphs[0] : "Once upon a time..."
  const remainingParagraphs = paragraphs.slice(1)

  return (
    <div className="min-h-screen bg-[url('/images/subtle-paper-texture.png')] bg-amber-50 bg-repeat">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with minimal controls */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href={`/storybook?id=${storybook.id}`}
            className="text-amber-800 hover:text-amber-600 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Storybook</span>
          </Link>

          <div className="text-center">
            <h2 className="text-lg font-serif font-medium text-amber-800">
              <span className="hidden sm:inline">Story </span>
              {currentStoryIndex + 1} of {storybook.entries.length}
            </h2>
          </div>

          <Link href="/" className="text-amber-800 hover:text-amber-600 transition-colors inline-flex items-center">
            <Home className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Story title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-800">
            {creature.name}'s Magical Adventure
          </h1>
        </motion.div>

        {/* Book with enlarged size */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl mx-auto"
        >
          <BookLayout
            leftPage={
              <BookPageLeft
                title={`The Tale of ${creature.name}`}
                image={storyResult.imageUrl || "/placeholder.svg"}
                imageAlt={`${creature.name} the magical creature`}
                firstParagraph={firstParagraph}
              />
            }
            rightPage={
              <BookPageRight
                remainingParagraphs={remainingParagraphs}
                image={storyResult.sceneImageUrl || "/placeholder.svg"}
                imageAlt={`A magical scene featuring ${creature.name}`}
              />
            }
            onNextStory={handleNextStory}
            onPrevStory={handlePrevStory}
            hasNextStory={currentStoryIndex < storybook.entries.length - 1}
            hasPrevStory={currentStoryIndex > 0}
          />
        </motion.div>

        {/* Story navigation - simplified and elegant */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStory}
            disabled={currentStoryIndex === 0}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            Previous Story
          </Button>

          <Link href={`/?id=${currentStory.creatures?.short_id}`} passHref>
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              <BookOpen className="h-4 w-4 mr-2" />
              View Full Story
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextStory}
            disabled={currentStoryIndex === storybook.entries.length - 1}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            Next Story
          </Button>
        </div>
      </div>
    </div>
  )
}
