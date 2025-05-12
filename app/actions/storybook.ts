"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import OpenAI from "openai"

// Types
type Storybook = {
  id: number
  device_id: string
  book_name: string
  cover_image_url: string | null
  created_at: string
  updated_at: string
  entries?: StorybookEntry[]
}

type StorybookEntry = {
  id: number
  storybook_id: number
  creature_short_id: string
  page_number: number
  added_at: string
  creatures?: {
    short_id: string
    creature_data: any
  }
}

/**
 * Create a new storybook for a device
 */
export async function createStorybook(deviceId: string, bookName?: string): Promise<number | null> {
  try {
    console.log("[SERVER] Creating storybook in database for device:", deviceId)
    console.log("[SERVER] Using book name:", bookName || "My Magical Storybook")

    if (!deviceId) {
      console.error("[SERVER] No device ID provided to createStorybook")
      return null
    }

    const supabase = createServerSupabaseClient()

    // First check if a storybook already exists for this device
    console.log("[SERVER] Checking for existing storybook")
    const { data: existingBook, error: checkError } = await supabase
      .from("storybooks")
      .select("id")
      .eq("device_id", deviceId)
      .limit(1)

    if (checkError) {
      console.error("[SERVER] Error checking for existing storybook:", checkError)
      // Check if the error indicates the table doesn't exist
      if (checkError.message.includes("does not exist") || checkError.code === "PGRST204") {
        console.error("[SERVER] Storybooks table may not exist. Attempting to create it.")

        // Try to create the tables
        try {
          // Call the setup endpoint to create the tables
          const setupResponse = await fetch(`/api/setup-storybook-tables?key=${process.env.CLEANUP_SECRET_KEY}`)
          if (!setupResponse.ok) {
            throw new Error(`Failed to set up storybook tables: ${setupResponse.statusText}`)
          }
          console.log("[SERVER] Successfully created storybook tables")
        } catch (setupError) {
          console.error("[SERVER] Failed to set up storybook tables:", setupError)
          throw new Error(`Failed to set up storybook tables: ${setupError}`)
        }
      } else {
        throw new Error(`Failed to check for existing storybook: ${checkError.message}`)
      }
    }

    if (existingBook && existingBook.length > 0) {
      console.log("[SERVER] Found existing storybook:", existingBook[0].id)
      return existingBook[0].id
    }

    console.log("[SERVER] No existing storybook found, creating new one")
    const { data, error } = await supabase
      .from("storybooks")
      .insert({
        device_id: deviceId,
        book_name: bookName || "My Magical Storybook",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[SERVER] Error creating storybook in database:", error)
      throw new Error(`Failed to create storybook in database: ${error.message}`)
    }

    if (!data || !data.id) {
      console.error("[SERVER] No data returned from storybook creation")
      throw new Error("No data returned from storybook creation")
    }

    console.log("[SERVER] Successfully created storybook with ID:", data.id)

    // Generate a cover for the new storybook
    const storybookName = bookName || "My Magical Storybook"
    const coverUrl = await generateStorybookCover(storybookName, data.id)

    if (coverUrl) {
      console.log("[SERVER] Generated cover for storybook:", coverUrl)
    } else {
      console.log("[SERVER] Failed to generate cover for storybook")
    }

    return data.id
  } catch (error) {
    console.error("[SERVER] Error in createStorybook:", error)
    throw error // Re-throw the error to be handled by the calling function
  }
}

/**
 * Get storybook for a device
 */
export async function getStorybook(deviceId: string): Promise<Storybook | null> {
  try {
    const supabase = createServerSupabaseClient()

    // First check if user has a storybook
    const { data: storybook, error: storybookError } = await supabase
      .from("storybooks")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (storybookError) {
      // If no storybook found, return null (not an error)
      if (storybookError.code === "PGRST116") {
        return null
      }
      throw storybookError
    }

    // Get all entries in the storybook
    const { data: entries, error: entriesError } = await supabase
      .from("storybook_entries")
      .select(`
        id,
        storybook_id,
        creature_short_id,
        page_number,
        added_at,
        creatures:creature_short_id (
          short_id,
          creature_data
        )
      `)
      .eq("storybook_id", storybook.id)
      .order("page_number", { ascending: true })

    if (entriesError) {
      console.error("Error fetching storybook entries:", entriesError)
      throw entriesError
    }

    return {
      ...storybook,
      entries: entries || [],
    }
  } catch (error) {
    console.error("Error getting storybook:", error)
    return null
  }
}

/**
 * Get a specific storybook by ID
 */
export async function getStorybookById(storybookId: number): Promise<Storybook | null> {
  try {
    if (!storybookId) {
      console.error("[SERVER] No storybook ID provided")
      return null
    }

    const supabase = createServerSupabaseClient()

    // Get the storybook by ID
    const { data: storybook, error: storybookError } = await supabase
      .from("storybooks")
      .select("*")
      .eq("id", storybookId)
      .single()

    if (storybookError) {
      console.error("[SERVER] Error fetching storybook by ID:", storybookError)
      return null
    }

    // Get all entries in the storybook
    const { data: entries, error: entriesError } = await supabase
      .from("storybook_entries")
      .select(`
        id,
        storybook_id,
        creature_short_id,
        page_number,
        added_at,
        creatures:creature_short_id (
          short_id,
          creature_data
        )
      `)
      .eq("storybook_id", storybook.id)
      .order("page_number", { ascending: true })

    if (entriesError) {
      console.error("[SERVER] Error fetching storybook entries:", entriesError)
      throw entriesError
    }

    return {
      ...storybook,
      entries: entries || [],
    }
  } catch (error) {
    console.error("[SERVER] Error getting storybook by ID:", error)
    return null
  }
}

/**
 * Get all storybooks for a device
 */
export async function getAllStorybooks(deviceId: string): Promise<Storybook[]> {
  try {
    const supabase = createServerSupabaseClient()

    // Get all storybooks for this device
    const { data: storybooks, error: storybooksError } = await supabase
      .from("storybooks")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })

    if (storybooksError) {
      console.error("Error fetching storybooks:", storybooksError)
      throw storybooksError
    }

    if (!storybooks || storybooks.length === 0) {
      return []
    }

    // Get entries for each storybook
    const storybookIds = storybooks.map((book) => book.id)

    const { data: entries, error: entriesError } = await supabase
      .from("storybook_entries")
      .select(`
        id,
        storybook_id,
        creature_short_id,
        page_number,
        added_at
      `)
      .in("storybook_id", storybookIds)
      .order("page_number", { ascending: true })

    if (entriesError) {
      console.error("Error fetching storybook entries:", entriesError)
      throw entriesError
    }

    // Group entries by storybook ID
    const entriesByStorybook: Record<number, any[]> = {}
    entries?.forEach((entry) => {
      if (!entriesByStorybook[entry.storybook_id]) {
        entriesByStorybook[entry.storybook_id] = []
      }
      entriesByStorybook[entry.storybook_id].push(entry)
    })

    // Add entries to each storybook
    return storybooks.map((book) => ({
      ...book,
      entries: entriesByStorybook[book.id] || [],
    }))
  } catch (error) {
    console.error("Error getting all storybooks:", error)
    return []
  }
}

/**
 * Delete a storybook
 */
export async function deleteStorybook(storybookId: number): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Delete the storybook (cascade will delete entries)
    const { error } = await supabase.from("storybooks").delete().eq("id", storybookId)

    if (error) {
      console.error("Error deleting storybook:", error)
      throw error
    }

    // Revalidate paths
    revalidatePath("/storybooks")
    revalidatePath("/storybook")

    return true
  } catch (error) {
    console.error("Error deleting storybook:", error)
    return false
  }
}

/**
 * Check if a creature is already in the storybook
 */
export async function isCreatureInStorybook(deviceId: string, creatureShortId: string): Promise<boolean> {
  try {
    if (!deviceId || !creatureShortId) {
      console.log("[SERVER] Missing deviceId or creatureShortId in isCreatureInStorybook check")
      return false
    }

    // Clean the creature ID
    const cleanCreatureId = creatureShortId.split("?")[0].split(".")[0]
    console.log(`[SERVER] Checking if creature ${cleanCreatureId} is in storybook for device ${deviceId}`)

    const supabase = createServerSupabaseClient()

    // Get the storybook ID
    const { data: storybooks, error: storybookError } = await supabase
      .from("storybooks")
      .select("id")
      .eq("device_id", deviceId)
      .limit(1)

    if (storybookError) {
      console.error("[SERVER] Error fetching storybook:", storybookError)
      return false
    }

    if (!storybooks || storybooks.length === 0) {
      console.log("[SERVER] No storybook found for device")
      return false
    }

    const storybookId = storybooks[0].id
    console.log(`[SERVER] Found storybook ID: ${storybookId}, checking for creature`)

    // Check if the creature is already in the storybook
    const { data: entries, error: entriesError } = await supabase
      .from("storybook_entries")
      .select("id")
      .eq("storybook_id", storybookId)
      .eq("creature_short_id", cleanCreatureId)
      .limit(1)

    if (entriesError) {
      console.error("[SERVER] Error checking for creature in storybook:", entriesError)
      return false
    }

    const isInBook = entries && entries.length > 0
    console.log(`[SERVER] Creature ${cleanCreatureId} in storybook: ${isInBook}`)

    return isInBook
  } catch (error) {
    console.error("[SERVER] Error in isCreatureInStorybook:", error)
    return false
  }
}

// Update the addStoryToBook function to use the most recently created storybook

export async function addStoryToBook(
  deviceId: string,
  creatureShortId: string,
  specificStorybookId?: number,
): Promise<boolean> {
  console.log(`[SERVER] Adding creature ${creatureShortId} to storybook for device ${deviceId}`)

  try {
    if (!deviceId) {
      console.error("[SERVER] No device ID provided")
      return false
    }

    if (!creatureShortId) {
      console.error("[SERVER] No creature short ID provided")
      return false
    }

    // Sanitize the creature ID - remove any file extensions or query parameters
    const cleanCreatureId = creatureShortId.split("?")[0].split(".")[0]
    console.log(`[SERVER] Cleaned creature ID: ${cleanCreatureId}`)

    const supabase = createServerSupabaseClient()

    // Check if the creature exists
    const { data: creatures, error: creatureError } = await supabase
      .from("creatures")
      .select("short_id")
      .eq("short_id", cleanCreatureId)

    if (creatureError) {
      console.error("[SERVER] Error checking if creature exists:", creatureError)
      return false
    }

    if (!creatures || creatures.length === 0) {
      console.error("[SERVER] Creature does not exist:", cleanCreatureId)
      return false
    }

    // Determine which storybook to use
    let storybookId: number | null = null

    if (specificStorybookId) {
      // Use the specified storybook ID if provided
      storybookId = specificStorybookId
      console.log(`[SERVER] Using specified storybook ID: ${storybookId}`)

      // Verify the storybook exists and belongs to this device
      const { data: storybook, error: verifyError } = await supabase
        .from("storybooks")
        .select("id")
        .eq("id", storybookId)
        .eq("device_id", deviceId)
        .single()

      if (verifyError || !storybook) {
        console.error("[SERVER] Specified storybook not found or doesn't belong to this device")
        return false
      }
    } else {
      console.log("[SERVER] No specific storybook ID provided, getting the most recent storybook")

      // Get the most recent storybook for this device
      try {
        const { data: existingStorybook, error } = await supabase
          .from("storybooks")
          .select("id")
          .eq("device_id", deviceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error("[SERVER] Error getting most recent storybook:", error)
          throw error
        }

        if (existingStorybook) {
          storybookId = existingStorybook.id
          console.log("[SERVER] Found most recent storybook with ID:", storybookId)
        }
      } catch (error) {
        console.log("[SERVER] No existing storybook found, will create new one")
      }

      // If no storybook exists, create one
      if (!storybookId) {
        console.log("[SERVER] Creating new storybook")
        const newBookId = await createStorybook(deviceId)
        if (!newBookId) {
          console.error("[SERVER] Failed to create storybook")
          throw new Error("Failed to create storybook")
        }
        storybookId = newBookId
        console.log("[SERVER] Created new storybook with ID:", storybookId)
      }
    }

    // Get the next page number
    let nextPage = 1

    try {
      const { data: entries } = await supabase
        .from("storybook_entries")
        .select("page_number")
        .eq("storybook_id", storybookId)
        .order("page_number", { ascending: false })
        .limit(1)

      if (entries && entries.length > 0) {
        nextPage = entries[0].page_number + 1
        console.log("[SERVER] Next page number:", nextPage)
      } else {
        console.log("[SERVER] No existing entries, starting with page 1")
      }
    } catch (error) {
      console.error("[SERVER] Error getting existing entries:", error)
      // Continue with page 1
    }

    console.log(`[SERVER] Adding creature ${cleanCreatureId} to storybook ${storybookId} at page ${nextPage}`)

    // Add the entry
    const { error: insertError } = await supabase.from("storybook_entries").insert({
      storybook_id: storybookId,
      creature_short_id: cleanCreatureId,
      page_number: nextPage,
    })

    if (insertError) {
      console.error("[SERVER] Error inserting storybook entry:", insertError)
      throw insertError
    }

    console.log("[SERVER] Successfully added creature to storybook")

    // Revalidate the storybook page to reflect changes
    revalidatePath("/storybook")
    revalidatePath("/storybooks")

    return true
  } catch (error) {
    console.error("[SERVER] Error adding story to book:", error)
    return false
  }
}

/**
 * Remove a story from the storybook
 */
export async function removeStoryFromBook(entryId: number): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("storybook_entries").delete().eq("id", entryId)

    if (error) throw error

    // Revalidate the storybook page to reflect changes
    revalidatePath("/storybook")
    revalidatePath("/storybooks")

    return true
  } catch (error) {
    console.error("Error removing story from book:", error)
    return false
  }
}

/**
 * Reorder stories in the storybook
 */
export async function reorderStories(storybookId: number, entryIds: number[]): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Update each entry with its new page number
    for (let i = 0; i < entryIds.length; i++) {
      const { error } = await supabase
        .from("storybook_entries")
        .update({ page_number: i + 1 })
        .eq("id", entryIds[i])
        .eq("storybook_id", storybookId)

      if (error) {
        console.error(`Error updating page number for entry ${entryIds[i]}:`, error)
        throw error
      }
    }

    // Revalidate the storybook page to reflect changes
    revalidatePath("/storybook")
    revalidatePath("/storybooks")

    return true
  } catch (error) {
    console.error("Error reordering stories:", error)
    return false
  }
}

// Update the createNewStorybook function to force creation of a new storybook
// even if one already exists

export async function createNewStorybook(deviceId: string, bookName?: string): Promise<boolean> {
  try {
    console.log("[SERVER] Starting createNewStorybook for device:", deviceId)
    console.log("[SERVER] Using book name:", bookName || "My Magical Storybook")

    if (!deviceId) {
      console.error("[SERVER] No device ID provided to createNewStorybook")
      return false
    }

    // Create a new storybook directly without checking for existing ones
    console.log("[SERVER] Creating new storybook for device:", deviceId)
    try {
      const supabase = createServerSupabaseClient()

      // Insert a new storybook record
      const { data, error } = await supabase
        .from("storybooks")
        .insert({
          device_id: deviceId,
          book_name: bookName || "My Magical Storybook",
        })
        .select("id")
        .single()

      if (error) {
        console.error("[SERVER] Error creating storybook in database:", error)
        throw new Error(`Failed to create storybook in database: ${error.message}`)
      }

      if (!data || !data.id) {
        console.error("[SERVER] No data returned from storybook creation")
        throw new Error("No data returned from storybook creation")
      }

      console.log("[SERVER] Successfully created storybook with ID:", data.id)

      // Generate a cover for the new storybook
      const storybookName = bookName || "My Magical Storybook"
      const coverUrl = await generateStorybookCover(storybookName, data.id)

      if (coverUrl) {
        console.log("[SERVER] Generated cover for storybook:", coverUrl)
      } else {
        console.log("[SERVER] Failed to generate cover for storybook")
      }

      // Revalidate the storybook page to reflect changes
      revalidatePath("/storybook")
      revalidatePath("/storybooks")
      revalidatePath("/storybook/add")

      return true
    } catch (createError) {
      console.error("[SERVER] Error in createStorybook:", createError)
      throw createError // Re-throw to provide more context
    }
  } catch (error) {
    console.error("[SERVER] Error creating new storybook:", error)
    throw error // Re-throw to be handled by the client
  }
}

/**
 * Generate a cover image for a storybook
 */
export async function generateStorybookCover(storybookName: string, storybookId: number): Promise<string | null> {
  try {
    // Create a prompt for the cover based on the storybook name
    const prompt = `A magical storybook cover for a children's book titled "${storybookName}". 
    The cover should be colorful, whimsical, and feature magical elements like stars, sparkles, 
    and fantasy creatures. Suitable for children ages 5-10. Illustration style, vibrant colors, 
    no text on the cover.`

    // Use the existing image generation function (similar to creature image generation)
    const imageUrl = await generateImageWithGrok(prompt)

    // If we have a URL, store it in Supabase Storage and update the storybook
    if (imageUrl) {
      const supabase = createServerSupabaseClient()

      // Generate a unique filename
      const filename = `storybook-${storybookId}-cover-${Date.now()}.png`
      const filePath = `storybooks/${filename}`

      try {
        // Fetch the image
        const response = await fetch(imageUrl)
        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status}`)
          return imageUrl // Return original URL as fallback
        }

        // Get the image as a blob
        const imageBlob = await response.blob()

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from("creature-images").upload(filePath, imageBlob, {
          contentType: "image/png",
          upsert: true,
        })

        if (error) {
          console.error("Error uploading storybook cover to Supabase:", error)
          return imageUrl // Return original URL as fallback
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from("creature-images").getPublicUrl(filePath)
        const storedImageUrl = publicUrlData.publicUrl

        console.log("Stored storybook cover in Supabase:", storedImageUrl)

        // Update the storybook with the cover image URL
        const { error: updateError } = await supabase
          .from("storybooks")
          .update({ cover_image_url: storedImageUrl })
          .eq("id", storybookId)

        if (updateError) {
          console.error("Error updating storybook cover:", updateError)
          return storedImageUrl // Still return the stored URL
        }

        return storedImageUrl
      } catch (storageError) {
        console.error("Error storing storybook cover:", storageError)
        return imageUrl // Return original URL as fallback
      }
    }

    return null
  } catch (error) {
    console.error("Error generating storybook cover:", error)
    return null
  }
}

/**
 * Update the cover image for a storybook
 */
export async function updateStorybookCover(storybookId: number, coverUrl: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Update the storybook with the new cover image URL
    const { error } = await supabase.from("storybooks").update({ cover_image_url: coverUrl }).eq("id", storybookId)

    if (error) {
      console.error("Error updating storybook cover:", error)
      return false
    }

    // Revalidate paths
    revalidatePath("/storybook")
    revalidatePath("/storybooks")

    return true
  } catch (error) {
    console.error("Error updating storybook cover:", error)
    return false
  }
}

/**
 * Update the name of a storybook
 */
export async function updateStorybookName(storybookId: number, newName: string): Promise<boolean> {
  try {
    if (!storybookId || !newName.trim()) {
      return false
    }

    const supabase = createServerSupabaseClient()

    // Update the storybook name
    const { error } = await supabase.from("storybooks").update({ book_name: newName.trim() }).eq("id", storybookId)

    if (error) {
      console.error("Error updating storybook name:", error)
      return false
    }

    // Revalidate paths
    revalidatePath("/storybook")
    revalidatePath("/storybooks")

    return true
  } catch (error) {
    console.error("Error updating storybook name:", error)
    return false
  }
}

/**
 * Helper function to generate an image using Grok (reusing existing code)
 */
async function generateImageWithGrok(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.X_AI_API_KEY

    if (!apiKey) {
      console.log("No API key found for image generation")
      return null
    }

    // Ensure prompt is a string and within character limit
    const safePrompt = (prompt || "magical storybook cover").substring(0, 500)

    console.log("Generating image with prompt:", safePrompt)

    // Initialize the OpenAI client with X.AI configuration
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
      dangerouslyAllowBrowser: true,
    })

    // Use the exact same structure as the sample code
    const response = await openai.images.generate({
      prompt: safePrompt,
      model: "grok-2-image",
    })

    // Check if we have a valid URL in the response
    if (response.data && response.data.length > 0 && response.data[0].url) {
      return response.data[0].url
    }

    return null
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}
