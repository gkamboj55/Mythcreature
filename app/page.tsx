"use client"

import { useEffect, useState } from "react"
import CreatureCreator from "@/components/creature-creator"
import { useSearchParams } from "next/navigation"
import type { StoryResult } from "./actions"
import { BookOpen } from "lucide-react"
import Link from "next/link"

// First, add these imports at the top of the file
import { getOrCreateDeviceId, hasDeviceId } from "@/lib/device-id"
import { getStorybook } from "@/app/actions/storybook"

// Helper function to safely decode URL data
function safeDecode(encodedData: string): any {
  try {
    return JSON.parse(decodeURIComponent(encodedData))
  } catch (error) {
    console.error("Failed to decode data:", error)
    return null
  }
}

export default function Home() {
  const searchParams = useSearchParams()
  const [initialCreatureData, setInitialCreatureData] = useState<{
    creatureDetails: any
    storyResult: StoryResult
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStory, setShowStory] = useState(false)
  const [isSharedCreature, setIsSharedCreature] = useState(false)

  // Then, add a new state variable in the component
  const [hasStorybook, setHasStorybook] = useState(false)

  // Add this effect to check if the user has a storybook
  useEffect(() => {
    async function checkForStorybook() {
      if (hasDeviceId()) {
        const deviceId = getOrCreateDeviceId()
        const storybook = await getStorybook(deviceId)
        setHasStorybook(!!storybook)
      }
    }

    checkForStorybook()
  }, [])

  useEffect(() => {
    const fetchCreatureData = async () => {
      setIsLoading(true)

      // Check if we have an ID in the URL
      const id = searchParams.get("id")

      if (id) {
        try {
          // Fetch data from Supabase via API
          const response = await fetch(`/api/get-creature?id=${id}`)

          if (!response.ok) {
            throw new Error(`Failed to fetch creature data: ${response.status}`)
          }

          const result = await response.json()

          if (result.success && result.data) {
            setInitialCreatureData(result.data)
            setShowStory(true)
            setIsSharedCreature(true) // Mark this as a shared creature
          } else {
            console.error("No data found for ID:", id)
          }
        } catch (error) {
          console.error("Failed to fetch creature data:", error)
        }
      } else {
        // Check for legacy format
        const encodedData = searchParams.get("creature")
        if (encodedData) {
          try {
            const decodedData = safeDecode(encodedData)
            if (decodedData) {
              setInitialCreatureData(decodedData)
              setShowStory(true)
              setIsSharedCreature(true) // Mark this as a shared creature
            }
          } catch (error) {
            console.error("Failed to parse creature data from URL:", error)
          }
        }
      }

      setIsLoading(false)
    }

    fetchCreatureData()
    // Only run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 relative overflow-hidden flex items-center justify-center">
        <div className="text-purple-600 text-xl">Loading magical creature...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 relative overflow-hidden">
      {/* Animated background with stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 7}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!showStory && !initialCreatureData && (
          <header className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <img
                src="/images/magical-creature-banner.jpeg"
                alt="Cute unicorn in a magical colorful forest"
                className="rounded-lg shadow-lg max-w-full md:max-w-lg mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-4 drop-shadow-md">
              Magical Creature Creator
            </h1>
            <p className="text-lg text-purple-700 max-w-2xl mx-auto">
              Mix and match magical traits to create your very own mythical creature, then read a special story about
              their adventures!
            </p>

            {/* Updated button text to "My Magical Storybooks" and link to the all-storybooks page */}
            <div className="mt-4">
              <Link href="/storybooks" className="text-purple-600 hover:text-purple-800 inline-flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>My Magical Storybooks</span>
              </Link>
            </div>
          </header>
        )}

        <CreatureCreator
          initialData={initialCreatureData}
          onStoryGenerated={() => setShowStory(true)}
          isSharedCreature={isSharedCreature}
          sharedId={searchParams.get("id") || undefined}
        />
      </div>
    </main>
  )
}
