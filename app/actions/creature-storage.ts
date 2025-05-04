"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { generateShortId } from "@/lib/utils-id"

// Types for creature data
type CreatureDetails = {
  name: string
  color: string
  bodyPart1: string
  bodyPart2: string
  ability: string
  habitat: string
}

type StoryResult = {
  story: string
  imagePrompt: string
  imageUrl: string | null
  sceneImagePrompt: string
  sceneImageUrl: string | null
}

type CreatureData = {
  creatureDetails: CreatureDetails
  storyResult: StoryResult
}

// Function to download and store an image in Supabase Storage
async function storeImageInSupabase(
  imageUrl: string | null,
  shortId: string,
  imageType: string,
): Promise<string | null> {
  if (!imageUrl) return null

  try {
    // Skip if the URL is already a Supabase Storage URL
    if (imageUrl.includes("supabase") && imageUrl.includes("storage")) {
      console.log(`Image ${imageType} is already stored in Supabase:`, imageUrl)
      return imageUrl
    }

    console.log(`Storing ${imageType} image in Supabase:`, imageUrl)

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`)
      return imageUrl // Return original URL as fallback
    }

    // Get the image as a blob
    const imageBlob = await response.blob()

    // Create a unique filename
    const filename = `${shortId}-${imageType}-${Date.now()}.png`
    const filePath = `${shortId}/${filename}`

    // Get Supabase client
    const supabase = createServerSupabaseClient()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("creature-images").upload(filePath, imageBlob, {
      contentType: "image/png",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading image to Supabase:", error)
      return imageUrl // Return original URL as fallback
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("creature-images").getPublicUrl(filePath)

    console.log(`Successfully stored ${imageType} image:`, publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error("Error storing image:", error)
    return imageUrl // Return original URL as fallback
  }
}

// Save creature data to Supabase
export async function saveCreatureData(data: CreatureData): Promise<string> {
  try {
    const supabase = createServerSupabaseClient()

    // Generate a unique short ID
    let shortId = generateShortId()
    let isUnique = false

    // Ensure the short ID is unique
    while (!isUnique) {
      const { data: existingData } = await supabase
        .from("creatures")
        .select("short_id")
        .eq("short_id", shortId)
        .single()

      if (!existingData) {
        isUnique = true
      } else {
        shortId = generateShortId()
      }
    }

    // Store the images in Supabase Storage
    const storedCreatureImageUrl = await storeImageInSupabase(data.storyResult.imageUrl, shortId, "creature")

    const storedSceneImageUrl = await storeImageInSupabase(data.storyResult.sceneImageUrl, shortId, "scene")

    // Update the data with stored image URLs
    const updatedData = {
      ...data,
      storyResult: {
        ...data.storyResult,
        imageUrl: storedCreatureImageUrl,
        sceneImageUrl: storedSceneImageUrl,
      },
    }

    // Calculate expiration (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert into Supabase
    const { error } = await supabase.from("creatures").insert({
      short_id: shortId,
      creature_data: updatedData,
      expires_at: expiresAt.toISOString(),
    })

    if (error) {
      console.error("Error saving creature data:", error)
      throw new Error("Failed to save creature data")
    }

    return shortId
  } catch (error) {
    console.error("Error in saveCreatureData:", error)
    throw new Error("Failed to save creature data")
  }
}

// Retrieve creature data from Supabase
export async function getCreatureData(shortId: string): Promise<CreatureData | null> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("creatures").select("creature_data").eq("short_id", shortId).single()

    if (error) {
      console.error("Error retrieving creature data:", error)
      return null
    }

    return (data?.creature_data as CreatureData) || null
  } catch (error) {
    console.error("Error in getCreatureData:", error)
    return null
  }
}
