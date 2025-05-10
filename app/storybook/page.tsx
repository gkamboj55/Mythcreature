"use client"

import { useEffect, useState } from "react"
import { getStorybook } from "@/app/actions/storybook"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, BookOpen, ArrowLeft, MoveUp, MoveDown, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { removeStoryFromBook, reorderStories } from "@/app/actions/storybook"
import { toast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { EditStorybookCover } from "@/components/edit-storybook-cover"

export default function StorybookPage() {
  const searchParams = useSearchParams()
  const [storybook, setStorybook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)

  // Set document title
  useEffect(() => {
    if (storybook) {
      document.title = `${storybook.book_name} - Magical Creature Creator`
    } else {
      document.title = "Storybook - Magical Creature Creator"
    }
  }, [storybook])

  // Force refresh on mount to ensure we get the latest data
  useEffect(() => {
    // This will ensure we're not using a cached version of the page
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("refresh", Date.now().toString())
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [])

  useEffect(() => {
    async function loadStorybook() {
      try {
        setIsLoading(true)
        const deviceId = getOrCreateDeviceId()
        console.log("Loading storybook for device ID:", deviceId)

        // Check if a specific storybook ID is provided
        const storybookId = searchParams.get("id")
        console.log("Storybook ID from URL:", storybookId)

        let book
        if (storybookId) {
          // Get a specific storybook by ID
          const { getStorybookById } = await import("@/app/actions/storybook")
          book = await getStorybookById(Number.parseInt(storybookId, 10))
          console.log("Loaded specific storybook by ID:", book)
        } else {
          // Get the default storybook
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

  const handleRemoveStory = async (entryId: number) => {
    if (!confirm("Are you sure you want to remove this story from your book?")) return

    try {
      const success = await removeStoryFromBook(entryId)
      if (success) {
        setStorybook({
          ...storybook,
          entries: storybook.entries.filter((entry: any) => entry.id !== entryId),
        })
        toast({
          title: "Story removed",
          description: "The story has been removed from your book.",
        })
      }
    } catch (error) {
      console.error("Error removing story:", error)
      toast({
        title: "Error",
        description: "Failed to remove the story.",
        variant: "destructive",
      })
    }
  }

  const handleMoveStory = async (entryId: number, direction: "up" | "down") => {
    if (!storybook || isReordering) return

    setIsReordering(true)
    try {
      const currentIndex = storybook.entries.findIndex((entry: any) => entry.id === entryId)
      if (currentIndex === -1) return

      const newEntries = [...storybook.entries]

      if (direction === "up" && currentIndex > 0) {
        // Swap with previous entry
        ;[newEntries[currentIndex], newEntries[currentIndex - 1]] = [
          newEntries[currentIndex - 1],
          newEntries[currentIndex],
        ]
      } else if (direction === "down" && currentIndex < newEntries.length - 1) {
        // Swap with next entry
        ;[newEntries[currentIndex], newEntries[currentIndex + 1]] = [
          newEntries[currentIndex + 1],
          newEntries[currentIndex],
        ]
      } else {
        return // Can't move further
      }

      // Update the page numbers
      const entryIds = newEntries.map((entry: any) => entry.id)
      const success = await reorderStories(storybook.id, entryIds)

      if (success) {
        setStorybook({
          ...storybook,
          entries: newEntries,
        })
      }
    } catch (error) {
      console.error("Error reordering stories:", error)
      toast({
        title: "Error",
        description: "Failed to reorder the stories.",
        variant: "destructive",
      })
    } finally {
      setIsReordering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-purple-800">Loading your magical storybook...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          {/* Check if we came from the add page */}
          {searchParams.get("from") === "add" ? (
            <Link
              href={`/storybook/add?id=${searchParams.get("creatureId") || ""}`}
              className="inline-flex items-center text-purple-700 hover:text-purple-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Add to Storybook
            </Link>
          ) : (
            <Link href="/" className="inline-flex items-center text-purple-700 hover:text-purple-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Creature Creator
            </Link>
          )}

          <Link href="/storybooks" className="inline-flex items-center text-purple-700 hover:text-purple-900">
            <BookOpen className="mr-2 h-4 w-4" />
            All Storybooks
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-800 mb-2">
                {storybook?.book_name || "My Magical Storybook"}
              </h1>
              <p className="text-purple-600">Your collection of magical creatures and their stories</p>
            </div>

            {storybook && (
              <EditStorybookCover
                storybookId={storybook.id}
                storybookName={storybook.book_name}
                currentCoverUrl={storybook.cover_image_url}
                onCoverUpdated={(newCoverUrl) => {
                  setStorybook({
                    ...storybook,
                    cover_image_url: newCoverUrl,
                  })
                }}
              />
            )}
          </div>

          {storybook?.cover_image_url && (
            <div className="mt-4 flex justify-center">
              <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-lg overflow-hidden border-2 border-purple-200 shadow-md">
                <img
                  src={storybook.cover_image_url || "/placeholder.svg"}
                  alt={`Cover for ${storybook.book_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {!storybook || !storybook.entries || storybook.entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BookOpen className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-purple-800 mb-2">Your Storybook is Empty</h2>
            <p className="text-purple-600 mb-6">Add creatures to your storybook to start building your collection!</p>
            <Link href="/" passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create a Creature
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storybook.entries.map((entry: any, index: number) => {
              const creature = entry.creatures?.creature_data?.creatureDetails || {}
              return (
                <Card key={entry.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold truncate">{creature.name || "Magical Creature"}</h3>
                      <span className="text-sm bg-white text-purple-700 px-2 py-1 rounded-full">
                        Page {entry.page_number}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex mb-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-purple-100 mr-4">
                        <img
                          src={entry.creatures?.creature_data?.storyResult?.imageUrl || "/placeholder.svg"}
                          alt={creature.name || "Creature"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          A {creature.color} creature with {creature.bodyPart1} and {creature.bodyPart2}
                        </p>
                        <p className="text-sm text-gray-600">Lives in the {creature.habitat}</p>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Link href={`/?id=${entry.creatures?.short_id}`} passHref>
                        <Button variant="outline" size="sm">
                          Read Story
                        </Button>
                      </Link>

                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === 0 || isReordering}
                          onClick={() => handleMoveStory(entry.id, "up")}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === storybook.entries.length - 1 || isReordering}
                          onClick={() => handleMoveStory(entry.id, "down")}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveStory(entry.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {storybook?.entries?.length > 0 && (
          <div className="mt-8 text-center">
            <Link href={`/storybook/read?id=${storybook.id}`} passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <BookOpen className="mr-2 h-4 w-4" />
                Read Full Storybook
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
