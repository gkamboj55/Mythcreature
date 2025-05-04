"use client"

import { useEffect, useState } from "react"
import { getStorybook } from "@/app/actions/storybook"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, ArrowRight, Home } from "lucide-react"
import Link from "next/link"
import { BookLayout } from "@/components/book/book-layout"
import { BookPageLeft } from "@/components/book/book-page-left"
import { BookPageRight } from "@/components/book/book-page-right"
import { useSearchParams } from "next/navigation"

export default function ReadStorybookPage() {
  const [storybook, setStorybook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const searchParams = useSearchParams()

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
        const deviceId = getOrCreateDeviceId()
        const book = await getStorybook(deviceId)
        setStorybook(book)
      } catch (error) {
        console.error("Error loading storybook:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStorybook()
  }, [])

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
            <Link href="/storybook" passHref>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/storybook" className="text-purple-700 hover:text-purple-900 inline-flex items-center">
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

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Story
          </Button>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(storybook.entries.length - 1, prev + 1))}
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
