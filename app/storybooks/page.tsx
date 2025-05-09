"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, BookOpen, ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { getOrCreateDeviceId } from "@/lib/device-id"
import { getAllStorybooks, deleteStorybook } from "@/app/actions/storybook"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function StorybooksPage() {
  const [storybooks, setStorybooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({})
  const [newStorybookName, setNewStorybookName] = useState("My Magical Storybook")
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [storybookToDelete, setStorybookToDelete] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadStorybooks()
  }, [])

  async function loadStorybooks() {
    try {
      setIsLoading(true)
      const deviceId = getOrCreateDeviceId()
      const books = await getAllStorybooks(deviceId)
      setStorybooks(books || [])
    } catch (error) {
      console.error("Error loading storybooks:", error)
      toast({
        title: "Error",
        description: "Failed to load your storybooks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

      toast({
        title: "Creating new storybook...",
        description: "Please wait while we set up your magical storybook.",
      })

      // Create a new storybook with the custom name
      const { createNewStorybook } = await import("@/app/actions/storybook")
      const success = await createNewStorybook(deviceId, newStorybookName)

      if (success) {
        setIsNameDialogOpen(false)
        toast({
          title: "Storybook created!",
          description: `Your new storybook "${newStorybookName}" has been created.`,
        })

        // Reload the storybooks list
        await loadStorybooks()
      } else {
        throw new Error("Failed to create storybook")
      }
    } catch (error: any) {
      console.error("Error creating storybook:", error)
      toast({
        title: "Couldn't create storybook",
        description: `There was an error creating your storybook: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteStorybook = (storybookId: number) => {
    setStorybookToDelete(storybookId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteStorybook = async () => {
    if (!storybookToDelete) return

    setIsDeleting((prev) => ({ ...prev, [storybookToDelete]: true }))
    try {
      const success = await deleteStorybook(storybookToDelete)

      if (success) {
        toast({
          title: "Storybook deleted",
          description: "Your storybook has been deleted successfully.",
        })

        // Remove the deleted storybook from the list
        setStorybooks((prev) => prev.filter((book) => book.id !== storybookToDelete))
      } else {
        throw new Error("Failed to delete storybook")
      }
    } catch (error) {
      console.error("Error deleting storybook:", error)
      toast({
        title: "Error",
        description: "Failed to delete storybook",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [storybookToDelete!]: false }))
      setIsDeleteDialogOpen(false)
      setStorybookToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-purple-800">Loading your magical storybooks...</h2>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-800 mb-2">My Magical Storybooks</h1>
              <p className="text-purple-600">Your collection of magical creatures and their stories</p>
            </div>
            <Button
              onClick={handleCreateNewStorybook}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Storybook
            </Button>
          </div>
        </div>

        {storybooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BookOpen className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-purple-800 mb-2">You Don't Have Any Storybooks Yet</h2>
            <p className="text-purple-600 mb-6">Create your first magical storybook to start your collection!</p>
            <Button
              onClick={handleCreateNewStorybook}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Storybook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storybooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle>{book.book_name}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Created: {new Date(book.created_at).toLocaleDateString()}</p>
                      <p className="text-sm font-medium mt-1">{book.entries?.length || 0} magical creatures</p>
                    </div>
                    {book.cover_image_url && (
                      <div className="w-16 h-16 rounded overflow-hidden">
                        <img
                          src={book.cover_image_url || "/placeholder.svg"}
                          alt={`Cover for ${book.book_name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 p-4 flex justify-between">
                  <Link href={`/storybook?id=${book.id}`} passHref>
                    <Button variant="outline" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Storybook
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteStorybook(book.id)}
                    disabled={isDeleting[book.id]}
                  >
                    {isDeleting[book.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
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

      {/* Dialog for confirming storybook deletion */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Storybook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this storybook? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteStorybook} variant="destructive" disabled={!storybookToDelete}>
              Delete Storybook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
