"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, BookOpen, ArrowLeft, Plus, Check } from "lucide-react"
import Link from "next/link"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { getStorybook, addStoryToBook, isCreatureInStorybook, createNewStorybook } from "@/app/actions/storybook"
import { toast } from "@/hooks/use-toast"

export default function AddToStorybookPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [creatureId, setCreatureId] = useState<string | null>(null)
  const [storybook, setStorybook] = useState<any>(null)
  const [creatureData, setCreatureData] = useState<any>(null)
  const [alreadyInBook, setAlreadyInBook] = useState(false)
  const [storybookCreated, setStorybookCreated] = useState(false)

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

        // Check if creature is already in a storybook
        const inBook = await isCreatureInStorybook(deviceId, id)
        setAlreadyInBook(inBook)

        // Get existing storybook if any
        const existingStorybook = await getStorybook(deviceId)
        setStorybook(existingStorybook)

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

  const handleAddToStorybook = async () => {
    if (!creatureId || isAdding) return

    setIsAdding(true)
    try {
      const deviceId = getOrCreateDeviceId()

      toast({
        title: "Adding to storybook...",
        description: "Please wait while we save your creature.",
      })

      const success = await addStoryToBook(deviceId, creatureId)

      if (success) {
        setAlreadyInBook(true)
        toast({
          title: "Added to your storybook!",
          description: "This magical creature is now part of your collection.",
        })
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
      setIsAdding(false)
    }
  }

  const handleCreateNewStorybook = async () => {
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

      // Create a new storybook without adding the creature
      const success = await createNewStorybook(deviceId)
      console.log("[CLIENT] Create storybook result:", success)

      if (success) {
        // Fetch the newly created storybook
        const newStorybook = await getStorybook(deviceId)
        console.log("[CLIENT] Fetched new storybook:", newStorybook)

        setStorybook(newStorybook)
        setStorybookCreated(true)

        toast({
          title: "Storybook created!",
          description: "Your magical storybook has been created. You can now add creatures to it.",
        })
      } else {
        throw new Error("Failed to create storybook")
      }
    } catch (error) {
      console.error("[CLIENT] Error creating storybook:", error)
      toast({
        title: "Couldn't create storybook",
        description: "There was an error creating your storybook. Please try again.",
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

  if (alreadyInBook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-purple-800 mb-4">Already in Your Storybook</h1>
          <p className="text-purple-600 mb-6">This magical creature is already part of your storybook collection!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Creator
              </Button>
            </Link>
            <Link href="/storybook" passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <BookOpen className="mr-2 h-4 w-4" />
                View Storybook
              </Button>
            </Link>
          </div>
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
          {storybook || storybookCreated ? (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle>Add to Existing Storybook</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="mb-4">
                  Add this magical creature to your existing storybook collection with {storybook?.entries?.length || 0}{" "}
                  stories.
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  onClick={handleAddToStorybook}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to storybook...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Storybook
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle>Create New Storybook</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="mb-4">
                  You don't have a storybook yet. Create your first magical storybook and add this creature to it.
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  onClick={handleCreateNewStorybook}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating storybook...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create Storybook
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-500 text-white">
              <CardTitle>View Your Storybook</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4">
                {storybook || storybookCreated
                  ? "Browse your existing collection of magical creatures and their stories."
                  : "After creating your storybook, you'll be able to browse your collection here."}
              </p>
            </CardContent>
            <CardFooter className="bg-gray-50 p-4">
              <Link href="/storybook" passHref className="w-full">
                <Button variant="outline" className="w-full" disabled={!storybook && !storybookCreated}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {storybook || storybookCreated ? "View Storybook" : "No Storybook Yet"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
