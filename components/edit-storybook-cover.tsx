"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EditStorybookCoverProps {
  storybookId: number
  storybookName: string
  currentCoverUrl: string | null
  onCoverUpdated: (newCoverUrl: string) => void
}

export function EditStorybookCover({
  storybookId,
  storybookName,
  currentCoverUrl,
  onCoverUpdated,
}: EditStorybookCoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)

  const handleGenerateNewCover = async () => {
    setIsGenerating(true)
    try {
      // Import the server action dynamically
      const { generateStorybookCover } = await import("@/app/actions/storybook")

      // Generate a new cover
      const newCoverUrl = await generateStorybookCover(storybookName, storybookId)

      if (newCoverUrl) {
        setCoverUrl(newCoverUrl)
        onCoverUpdated(newCoverUrl)
        toast({
          title: "Cover updated!",
          description: "Your storybook has a new magical cover.",
        })
      } else {
        throw new Error("Failed to generate a new cover")
      }
    } catch (error) {
      console.error("Error generating new cover:", error)
      toast({
        title: "Couldn't generate cover",
        description: "There was an error creating a new cover. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Edit Cover
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Storybook Cover</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-center mb-4">
              <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-lg overflow-hidden border-2 border-purple-200 shadow-md">
                {coverUrl ? (
                  <img
                    src={coverUrl || "/placeholder.svg"}
                    alt={`Cover for ${storybookName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <span className="text-purple-400">No cover image</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerateNewCover}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Cover
                </>
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
