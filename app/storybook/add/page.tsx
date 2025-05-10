"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BookOpen, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { getStorybook, addStoryToBook, createNewStorybook, getAllStorybooks } from "@/app/actions/storybook"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function AddToStorybookPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState<number | null>(null)
  const [storybooks, setStorybooks] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [creatureId, setCreatureId] = useState<string | null>(null)
  const [storybook, setStorybook] = useState<any>(null)
  const [creatureData, setCreatureData] = useState<any>(null)
  const [alreadyInBook, setAlreadyInBook] = useState(false)
  const [storybookCreated, setStorybookCreated] = useState(false)
  const [newStorybookName, setNewStorybookName] = useState("My Magical Storybook")
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)

  // Set document title
  useEffect(() => {
    if (creatureData?.creatureDetails?.name) {
      document.title = `Add ${creatureData.creatureDetails.name} to Storybook - Magical Creature Creator`
    } else {
      document.title = "Add to Storybook - Magical Creature Creator"
    }
  }, [creatureData])

  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true)

        // Get the creature ID from the URL
        const id = searchParams.get("id")
        if (!id) {
          toast({
            title: "Missing creature ID",
            description: "No creature ID was provided",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setCreatureId(id)

        // Get device ID
        const deviceId = getOrCreateDeviceId()
        console.log("[CLIENT] Checking if creature is in storybook with device ID:", deviceId, "and creature ID:", id)

        // Get all storybooks for this device
        try {
          const existingStorybooks = await getAllStorybooks(deviceId)
          setStorybooks(existingStorybooks || [])

          // We'll check if the creature is in each specific storybook when adding,
          // rather than showing a global "already in storybook" message
          setAlreadyInBook(false)
        } catch (error) {
          console.error("[CLIENT] Error fetching storybooks:", error)
          setStorybooks([])
        }

        // Fetch creature data
        const response = await fetch(`/api/get-creature?id=${id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setCreatureData(data.data)
          }
        }
      } catch (error) {
        console.error("Error initializing add to storybook page:", error)
        toast({
          title: "Error",
          description: "Failed to load storybook data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [searchParams, router])

  const handleAddToStorybook = async (storybookId: number) => {
    if (!creatureId || isAdding) return

    setIsAdding(storybookId)
    try {
      const deviceId = getOrCreateDeviceId()

      // Check if the creature is already in this specific storybook
      const isAlreadyInThisBook = await isCreatureInStorybook(deviceId, creatureId, storybookId)

      if (isAlreadyInThisBook) {
        // Creature is already in this specific storybook
        toast({
          title: "Already in storybook",
          description: "This creature is already part of this storybook.",
        })
        setIsAdding(null)
        return
      }

      toast({
        title: "Adding to storybook...",
        description: "Please wait while we save your creature.",
      })

      // Get the storybook name for the toast message
      const storybook = storybooks.find((book) => book.id === storybookId)
      const storybookName = storybook ? storybook.book_name : "your storybook"

      const success = await addStoryToBook(deviceId, creatureId, storybookId)

      if (success) {
        toast({
          title: "Added to storybook!",
          description: `This magical creature is now part of "${storybookName}".`,
        })

        // Redirect to the storybook view with a parameter to indicate we came from the add page
        router.push(`/storybook?id=${storybookId}&from=add&creatureId=${creatureId}`)
      } else {
        throw new Error("Failed to add to storybook")
      }
    } catch (error) {
      console.error("Error adding to storybook:", error)
      toast({
        title: "Couldn't add to storybook",
        description: "There was an error saving this story to your book. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdding(null)
    }
  }

  // Helper function to check if a creature is in a specific storybook
  const isCreatureInStorybook = async (deviceId: string, creatureId: string, storybookId: number): Promise<boolean> => {
    try {
      // Make a fetch request to check if the creature is in the storybook
      const response = await fetch(
        `/api/check-creature-in-storybook?deviceId=${deviceId}&creatureId=${creatureId}&storybookId=${storybookId}`,
      )

      if (!response.ok) {
        throw new Error("Failed to check if creature is in storybook")
      }

      const data = await response.json()
      return data.isInStorybook
    } catch (error) {
      console.error("Error checking if creature is in storybook:", error)
      return false
    }
  }

  const handleCreateNewStorybook = () => {
    setIsNameDialogOpen(true)
  }

  const handleConfirmCreateStorybook = async () => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const deviceId = getOrCreateDeviceId()
      console.log("[CLIENT] Creating storybook with device ID:", deviceId)

      if (!deviceId) {
        throw new Error("Failed to get device ID")
      }

      toast({
        title: "Creating new storybook...",
        description: "Please wait while we set up your magical storybook.",
      })

      // Create a new storybook with the custom name
      try {
        const success = await createNewStorybook(deviceId, newStorybookName)
        console.log("[CLIENT] Create storybook result:", success)

        if (success) {
          // Fetch the newly created storybook - we need to get the most recent one
          const newStorybook = await getStorybook(deviceId)
          console.log("[CLIENT] Fetched new storybook:", newStorybook)

          setStorybook(newStorybook)
          setStorybookCreated(true)
          setIsNameDialogOpen(false)

          toast({
            title: "Storybook created!",
            description: `Your new storybook "${newStorybookName}" has been created.`,
          })

          // Automatically add the creature to the new storybook
          if (creatureId && newStorybook) {
            await addStoryToBook(deviceId, creatureId, newStorybook.id)
            toast({
              title: "Creature added!",
              description: `Your creature has been added to "${newStorybookName}".`,
            })

            // Redirect to the storybook view with a parameter to indicate we came from the add page
            router.push(`/storybook?id=${newStorybook.id}&from=add&creatureId=${creatureId}`)
          }
        } else {
          throw new Error("Failed to create storybook")
        }
      } catch (error: any) {
        console.error("[CLIENT] Error creating storybook:", error)
        toast({
          title: "Couldn't create storybook",
          description: `There was an error creating your storybook: ${error.message || "Unknown error"}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[CLIENT] Error in handleCreateNewStorybook:", error)
      toast({
        title: "Couldn't create storybook",
        description: `There was an error creating your storybook: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-purple-800">Loading storybook options...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-purple-700 hover:text-purple-900 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Creature Creator
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Add to Your Magical Storybook</h1>
          <p className="text-purple-600">Save this creature to your collection of magical stories</p>
        </div>

        {creatureData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-purple-100">
                <img
                  src={creatureData.storyResult?.imageUrl || "/placeholder.svg"}
                  alt={creatureData.creatureDetails?.name || "Creature"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-purple-800">
                  {creatureData.creatureDetails?.name || "Magical Creature"}
                </h2>
                <p className="text-purple-600">
                  A {creatureData.creatureDetails?.color} creature with {creatureData.creatureDetails?.bodyPart1} and{" "}
                  {creatureData.creatureDetails?.bodyPart2}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Only show the existing storybooks card if there are storybooks */}
          {storybooks && storybooks.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle>Add to Existing Storybook</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {storybooks.map((book) => (
                    <div key={book.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Add cover image */}
                        <div className="w-16 h-20 rounded overflow-hidden bg-purple-100 flex-shrink-0">
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url || "/placeholder.svg"}
                              alt={`Cover for ${book.book_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                              <span className="text-purple-400 text-xs">No cover</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{book.book_name}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            This storybook has {book.entries?.length || 0} magical creatures.
                          </p>

                          {/* Fixed button layout */}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="flex-1 min-w-[120px]" asChild>
                              <Link href={`/storybook?id=${book.id}`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                View Storybook
                              </Link>
                            </Button>

                            <Button
                              size="sm"
                              className="flex-1 min-w-[120px] bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                              onClick={() => handleAddToStorybook(book.id)}
                              disabled={isAdding === book.id}
                            >
                              {isAdding === book.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add to Storybook
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Always show the create new storybook card */}
          <Card className={`overflow-hidden ${storybooks.length === 0 ? "md:col-span-2" : ""}`}>
            <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-500 text-white">
              <CardTitle>Create New Storybook</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Start a New Collection</h3>
              <p className="mb-4">Create a brand new storybook with this magical creature as your first story.</p>
              <Button
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-500 text-white"
                onClick={handleCreateNewStorybook}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Storybook
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog for entering storybook name */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name Your Magical Storybook</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newStorybookName}
              onChange={(e) => setNewStorybookName(e.target.value)}
              placeholder="Enter a name for your storybook"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCreateStorybook}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              disabled={isCreating || !newStorybookName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Storybook"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
