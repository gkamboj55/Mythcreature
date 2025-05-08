"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy, Twitter, Facebook, Download, Loader2, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BookLayout } from "./book/book-layout"
import { BookPageLeft } from "./book/book-page-left"
import { BookPageRight } from "./book/book-page-right"
import { isCreatureInStorybook } from "@/app/actions/storybook"
import { getOrCreateDeviceId } from "@/lib/device-id"
import Link from "next/link"

type CreatureDetails = {
  name: string
  color: string
  bodyPart1: string
  bodyPart2: string
  ability: string
  habitat: string
}

// Helper function to safely encode data for URLs (for backward compatibility)
function safeEncode(data: any): string {
  // Convert the data to JSON and then encode it for URLs
  return encodeURIComponent(JSON.stringify(data))
}

// Helper function to detect if device is mobile
function isMobileDevice() {
  return (
    typeof window !== "undefined" &&
    (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i))
  )
}

export default function CreatureStory({
  story,
  imagePrompt,
  imageUrl,
  sceneImagePrompt,
  sceneImageUrl,
  creatureDetails,
  shortId,
  onSaveComplete,
  isSharedCreature = false,
}: {
  story: string
  imagePrompt: string
  imageUrl: string | null
  sceneImagePrompt?: string
  sceneImageUrl?: string | null
  creatureDetails: CreatureDetails
  shortId?: string
  onSaveComplete?: (id: string) => void
  isSharedCreature?: boolean
}) {
  const [shared, setShared] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedShortId, setSavedShortId] = useState<string | null>(shortId || null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sceneImageLoaded, setSceneImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [sceneImageError, setSceneImageError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [addedToBook, setAddedToBook] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const shareUrlRef = useRef<HTMLInputElement>(null)
  const bookContentRef = useRef<HTMLDivElement>(null)
  const leftPageRef = useRef<HTMLDivElement>(null)
  const rightPageRef = useRef<HTMLDivElement>(null)
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
  const hasSavedRef = useRef<boolean>(false) // Use a ref to track if we've already saved

  // Check if device is mobile on component mount
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Save creature data to Supabase when component mounts
  useEffect(() => {
    const saveData = async () => {
      // Skip saving if this is a shared creature (already in the database)
      if (isSharedCreature) {
        console.log("Skipping save for shared creature")
        return
      }

      // Skip if we already have a short ID, if we're already saving, or if we've already tried to save
      if (savedShortId || isSaving || hasSavedRef.current) return

      // Mark that we've attempted to save to prevent duplicate saves
      hasSavedRef.current = true

      try {
        setIsSaving(true)

        // Create the data object
        const creatureData = {
          creatureDetails,
          storyResult: {
            story,
            imagePrompt,
            imageUrl,
            sceneImagePrompt: sceneImagePrompt || "",
            sceneImageUrl,
          },
        }

        // Call the server action to save data
        const response = await fetch("/api/save-creature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(creatureData),
        })

        if (!response.ok) {
          throw new Error("Failed to save creature data")
        }

        const { shortId } = await response.json()

        if (!shortId) {
          throw new Error("No short ID returned")
        }

        // Update state with the new short ID
        setSavedShortId(shortId)

        // Update the URL without reloading the page
        const newUrl = `${window.location.pathname}?id=${shortId}`
        window.history.replaceState({ path: newUrl }, "", newUrl)

        // Call the callback if provided
        if (onSaveComplete) {
          onSaveComplete(shortId)
        }
      } catch (error) {
        console.error("Failed to save creature data:", error)
        // Don't fall back to the old method - it causes infinite loops
      } finally {
        setIsSaving(false)
      }
    }

    // Only run this once
    if (!isSharedCreature && !savedShortId && !isSaving && !hasSavedRef.current) {
      saveData()
    }
  }, [
    creatureDetails,
    story,
    imagePrompt,
    imageUrl,
    sceneImagePrompt,
    sceneImageUrl,
    savedShortId,
    onSaveComplete,
    isSaving,
    isSharedCreature,
  ])

  // Check if the story is already in the storybook
  useEffect(() => {
    async function checkIfInStorybook() {
      if (!shortId) return

      try {
        const deviceId = getOrCreateDeviceId()
        const inBook = await isCreatureInStorybook(deviceId, shortId)
        setAddedToBook(inBook)
      } catch (error) {
        console.error("Error checking if in storybook:", error)
      }
    }

    checkIfInStorybook()
  }, [shortId])

  // Function to copy text to clipboard with better browser compatibility
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // For modern browsers
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const success = document.execCommand("copy")
        document.body.removeChild(textArea)
        return success
      }
    } catch (error) {
      console.error("Failed to copy text: ", error)
      return false
    }
  }

  // Function to generate and download PDF using server-side generation
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      toast({
        title: "Creating PDF...",
        description: "Please wait while we generate your story PDF",
      })

      // Prepare data for the server
      const pdfData = {
        story,
        imageUrl,
        imagePrompt,
        sceneImageUrl,
        sceneImagePrompt,
        creatureDetails,
      }

      // Call the API to generate the PDF
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pdfData),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success || !result.pdfData) {
        throw new Error("Failed to generate PDF")
      }

      // Create a blob from the data URI
      const dataURI = result.pdfData
      const byteString = atob(dataURI.split(",")[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }

      const blob = new Blob([ab], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(blob)

      // Create a download link
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `${creatureDetails.name}-magical-story.pdf`

      // Append to body and click
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100)

      toast({
        title: "PDF Downloaded!",
        description: "Your magical story has been saved as a PDF",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Couldn't generate PDF",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Function to share the creature
  const shareCreature = async () => {
    // Get the current URL which now contains the creature data
    const shareUrl = window.location.href

    // Create share text with creature details
    const shareTitle = `Meet ${creatureDetails.name}, my magical creature!`
    const shareText = `I created ${creatureDetails.name}, a ${creatureDetails.color} creature with ${creatureDetails.bodyPart1} and ${creatureDetails.bodyPart2} who can ${creatureDetails.ability} and lives in the ${creatureDetails.habitat}!`

    // Check if the Web Share API is supported and if we're on mobile
    if (navigator.share && isMobile) {
      try {
        // IMPORTANT: Only pass the URL in the url parameter, not in the text
        // This ensures proper link formatting on mobile
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })

        // Show success indicator briefly
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch (error) {
        // User likely canceled the share operation
        console.log("Share canceled or failed:", error)
      }
    } else {
      // Desktop fallback - copy to clipboard
      const success = await copyToClipboard(`${shareTitle}\n\n${shareText}\n\n${shareUrl}`)

      if (success) {
        toast({
          title: "Copied to clipboard!",
          description: "Share link and details copied to clipboard",
        })

        // Show success indicator briefly
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } else {
        toast({
          title: "Couldn't copy to clipboard",
          description: "Please try again or manually copy the page URL",
          variant: "destructive",
        })
      }
    }
  }

  // Function to open share URL in a new window
  const shareToSocial = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href)
    const shareTitle = encodeURIComponent(`Meet ${creatureDetails.name}, my magical creature!`)
    let url = ""

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
    }
  }

  // Split the story into paragraphs
  const paragraphs = story.split("\n\n").filter((p) => p.trim() !== "")

  // Get the first paragraph for the left page
  const firstParagraph = paragraphs.length > 0 ? paragraphs[0] : "Once upon a time..."

  // Get the remaining paragraphs for the right page
  const remainingParagraphs = paragraphs.slice(1)

  // Determine image sources - use the API-generated images if available, otherwise use placeholders
  const creatureImageSrc =
    imageUrl || `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(imagePrompt || "magical creature")}`

  const sceneImageSrc =
    sceneImageUrl ||
    `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(sceneImagePrompt || "magical scene")}`

  // Preload images
  useEffect(() => {
    const creatureImg = new Image()
    creatureImg.src = creatureImageSrc
    creatureImg.onload = () => setImageLoaded(true)
    creatureImg.onerror = () => setImageError(true)

    if (sceneImageSrc) {
      const sceneImg = new Image()
      sceneImg.src = sceneImageSrc
      sceneImg.onload = () => setSceneImageLoaded(true)
      sceneImg.onerror = () => setSceneImageError(true)
    }
  }, [creatureImageSrc, sceneImageSrc])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="mb-8" id="book-content" ref={bookContentRef}>
        <BookLayout
          leftPage={
            <div ref={leftPageRef}>
              <BookPageLeft
                title={`The Tale of ${creatureDetails.name}`}
                image={creatureImageSrc}
                imageAlt={`${creatureDetails.name} the magical creature`}
                firstParagraph={firstParagraph}
              />
            </div>
          }
          rightPage={
            <div ref={rightPageRef}>
              <BookPageRight
                remainingParagraphs={remainingParagraphs}
                image={sceneImageSrc}
                imageAlt={`A magical scene featuring ${creatureDetails.name}`}
              />
            </div>
          }
        />
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        {/* Share Button */}
        {isMobile ? (
          // Mobile share button
          <Button
            onClick={shareCreature}
            variant="outline"
            className="flex items-center space-x-2 rounded-full px-4 py-2 border-purple-300 hover:bg-purple-50 transition-colors"
            disabled={isSaving}
          >
            {shared ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Shared!</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                <span>Saving your magical creation...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-purple-500" />
                <span>Share Your Creature</span>
              </>
            )}
          </Button>
        ) : (
          // Desktop share options
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-2 rounded-full px-4 py-2 border-purple-300 hover:bg-purple-50 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                    <span>Saving your magical creation...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-purple-500" />
                    <span>Share Your Creature</span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-center">Share your magical creature</h3>

                <div className="flex space-x-2">
                  <input
                    ref={shareUrlRef}
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      copyToClipboard(window.location.href).then((success) => {
                        if (success) {
                          toast({
                            title: "Link copied!",
                            description: "Share link copied to clipboard",
                          })
                        }
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={() => shareToSocial("twitter")}
                  >
                    <Twitter className="h-4 w-4 text-blue-400" />
                    <span>Twitter</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={() => shareToSocial("facebook")}
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Download PDF Button */}
        <Button
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          variant="outline"
          className="flex items-center space-x-2 rounded-full px-4 py-2 border-purple-300 hover:bg-purple-50 transition-colors"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
              <span>Creating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-purple-500" />
              <span>Download Story</span>
            </>
          )}
        </Button>

        {/* Add to Storybook Button - Simplified to just navigate to the add-to-storybook page */}
        {savedShortId && (
          <Link href={`/storybook/add?id=${savedShortId}`} passHref>
            <Button
              variant="outline"
              className="flex items-center space-x-2 rounded-full px-4 py-2 border-purple-300 hover:bg-purple-50 transition-colors"
              disabled={addedToBook}
            >
              {addedToBook ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Added to storybook</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span>Add to storybook</span>
                </>
              )}
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}
