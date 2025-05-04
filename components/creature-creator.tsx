"use client"

import { useState } from "react"
import CreatureForm from "./creature-form"
import CreatureStory from "./creature-story"
import { Button } from "@/components/ui/button"
import { MagicalLoading } from "./magical-loading"
import type { StoryResult } from "@/app/actions"

type CreatureDetails = {
  name: string
  color: string
  bodyPart1: string
  bodyPart2: string
  ability: string
  habitat: string
}

export default function CreatureCreator({
  initialData = null,
  onStoryGenerated,
  isSharedCreature = false,
  sharedId,
}: {
  initialData?: {
    creatureDetails: CreatureDetails
    storyResult: StoryResult
  } | null
  onStoryGenerated?: () => void
  isSharedCreature?: boolean
  sharedId?: string
}) {
  const [storyResult, setStoryResult] = useState<StoryResult | null>(initialData?.storyResult || null)
  const [creatureDetails, setCreatureDetails] = useState<CreatureDetails | null>(initialData?.creatureDetails || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedShortId, setSavedShortId] = useState<string | null>(sharedId || null)

  const handleStoryGenerated = (details: CreatureDetails, result: StoryResult) => {
    setCreatureDetails(details)
    setStoryResult(result)
    setIsGenerating(false)

    // Notify parent component that a story has been generated
    if (onStoryGenerated) {
      onStoryGenerated()
    }
  }

  const handleSaveComplete = (shortId: string) => {
    setSavedShortId(shortId)
  }

  const handleReset = () => {
    // Clear URL parameters when creating a new creature
    window.history.pushState({}, "", window.location.pathname)

    setStoryResult(null)
    setCreatureDetails(null)
    setSavedShortId(null)

    // Reload the page to reset everything cleanly
    window.location.reload()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!storyResult ? (
        <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <CreatureForm onGenerating={() => setIsGenerating(true)} onStoryGenerated={handleStoryGenerated} />

          {isGenerating && <MagicalLoading />}
        </div>
      ) : (
        <div className="space-y-6">
          <CreatureStory
            story={storyResult.story}
            imagePrompt={storyResult.imagePrompt}
            imageUrl={storyResult.imageUrl}
            sceneImagePrompt={storyResult.sceneImagePrompt || ""}
            sceneImageUrl={storyResult.sceneImageUrl}
            creatureDetails={creatureDetails!}
            shortId={savedShortId}
            onSaveComplete={handleSaveComplete}
            isSharedCreature={isSharedCreature}
          />

          <div className="text-center">
            <Button
              onClick={handleReset}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-full shadow-md transition-all duration-300 hover:shadow-lg"
            >
              Create Another Creature
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
