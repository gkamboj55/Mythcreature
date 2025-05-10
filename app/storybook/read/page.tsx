"use client"

import { useEffect, useState, useRef } from "react"
import { getStorybook, getStorybookById } from "@/app/actions/storybook"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, ArrowRight, Home, Maximize } from "lucide-react"
import Link from "next/link"
import { BookLayout } from "@/components/book/book-layout"
import { BookPageLeft } from "@/components/book/book-page-left"
import { BookPageRight } from "@/components/book/book-page-right"
import { useSearchParams } from "next/navigation"
import { ImmersiveReader } from "@/components/immersive-reader"
import { PageTransition } from "@/components/page-transition"
import type { ThemeType } from "@/components/ambient-background"

export default function ReadStorybookPage() {
  const [storybook, setStorybook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isImmersive, setIsImmersive] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | "none">("none")
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)

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
        setCurrentPage(pageNum)
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
  const handleNextPage = () => {
    if (currentPage < (storybook?.entries?.length || 0) - 1) {
      setTransitionDirection("left")
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setTransitionDirection("right")
      setCurrentPage((prev) => prev - 1)
    }
  }

  // Determine theme based on creature habitat
  const getThemeFromHabitat = (habitat?: string): ThemeType => {
    if (!habitat) return "default"

    const habitatLower = habitat.toLowerCase()

    if (habitatLower.includes("forest") || habitatLower.includes("jungle") || habitatLower.includes("wood")) {
      return "forest"
    }
    if (habitatLower.includes("ocean") || habitatLower.includes("sea") || habitatLower.includes("water")) {
      return "ocean"
    }
    if (habitatLower.includes("sky") || habitatLower.includes("cloud") || habitatLower.includes("air")) {
      return "sky"
    }
    if (habitatLower.includes("mountain") || habitatLower.includes("cave") || habitatLower.includes("rock")) {
      return "mountain"
    }
    if (habitatLower.includes("magic") || habitatLower.includes("crystal") || habitatLower.includes("enchant")) {
      return "magic"
    }

    return "default"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-purple-800">Opening your magical storybook...</h2>
        </div>
      </div>
    )
  }

  if (!storybook || !storybook.entries || storybook.entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-purple-800 mb-6">Your Storybook is Empty</h1>
          <p className="text-purple-600 mb-8">
            Create magical creatures and add them to your storybook to start reading!
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/storybook" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Storybook
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Create a Creature</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get the current story based on page number
  const currentStory = storybook.entries[currentPage]
  if (!currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-purple-800 mb-6">Page Not Found</h1>
          <p className="text-purple-600 mb-8">This page doesn't exist in your storybook.</p>
          <div className="flex justify-center space-x-4">
            <Link href={`/storybook?id=${storybook.id}`} passHref>
              <Button variant="outline">
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

  // Determine theme based on creature habitat
  const theme = getThemeFromHabitat(creature.habitat)

  // Render book content
  const renderBookContent = () => (
    <PageTransition direction={transitionDirection} isActive={true} duration={0.5}>
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
      />
    </PageTransition>
  )

  // If in immersive mode, render the immersive reader
  if (isImmersive) {
    return (
      <ImmersiveReader
        onPageChange={(direction) => {
          if (direction === "next") {
            handleNextPage()
          } else {
            handlePrevPage()
          }
        }}
        onExit={() => setIsImmersive(false)}
        hasNextPage={currentPage < storybook.entries.length - 1}
        hasPrevPage={currentPage > 0}
        currentPage={currentPage}
        totalPages={storybook.entries.length}
        theme={theme}
      >
        {renderBookContent()}
      </ImmersiveReader>
    )
  }

  // Otherwise, render the standard view
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6" ref={containerRef}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link
            href={`/storybook?id=${storybook.id}`}
            className="text-purple-700 hover:text-purple-900 inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Storybook
          </Link>

          <div className="text-center">
            <h2 className="text-lg font-medium text-purple-800">
              Page {currentPage + 1} of {storybook.entries.length}
            </h2>
          </div>

          <Link href="/" className="text-purple-700 hover:text-purple-900 inline-flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </div>

        {renderBookContent()}

        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 0} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Story
          </Button>

          <Button variant="outline" onClick={() => setIsImmersive(true)} className="flex items-center">
            <Maximize className="mr-2 h-4 w-4" />
            Immersive Mode
          </Button>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === storybook.entries.length - 1}
            className="flex items-center"
          >
            Next Story
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
