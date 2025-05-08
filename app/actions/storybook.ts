"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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
 * Check if a creature is already in the storybook
 */
export async function isCreatureInStorybook(deviceId: string, creatureShortId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Get the storybook ID
    const { data: storybook } = await supabase
      .from("storybooks")
      .select("id")
      .eq("device_id", deviceId)
      .limit(1)
      .single()

    if (!storybook) return false

    // Check if the creature is already in the storybook
    const { data, error } = await supabase
      .from("storybook_entries")
      .select("id")
      .eq("storybook_id", storybook.id)
      .eq("creature_short_id", creatureShortId)
      .limit(1)
      .single()

    if (error) {
      // If no entry found, it's not in the storybook
      if (error.code === "PGRST116") {
        return false
      }
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error checking if creature is in storybook:", error)
    return false
  }
}

/**
 * Add a story to the storybook
 */
export async function addStoryToBook(deviceId: string, creatureShortId: string): Promise<boolean> {
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

    console.log("[SERVER] Creature exists, checking if already in storybook")

    // Check if the creature is already in the storybook
    try {
      const alreadyInBook = await isCreatureInStorybook(deviceId, cleanCreatureId)
      if (alreadyInBook) {
        console.log("[SERVER] Creature already in storybook")
        return true // Already added, consider it a success
      }
    } catch (error) {
      console.error("[SERVER] Error checking if creature is in storybook:", error)
      // Continue anyway to try creating a new storybook
    }

    console.log("[SERVER] Creature not in storybook, checking for existing storybook")

    // Get or create storybook
    let storybookId: number | null = null

    try {
      const { data: existingStorybook } = await supabase
        .from("storybooks")
        .select("id")
        .eq("device_id", deviceId)
        .limit(1)
        .single()

      if (existingStorybook) {
        storybookId = existingStorybook.id
        console.log("[SERVER] Found existing storybook with ID:", storybookId)
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

      if (error) throw error
    }

    // Revalidate the storybook page to reflect changes
    revalidatePath("/storybook")

    return true
  } catch (error) {
    console.error("Error reordering stories:", error)
    return false
  }
}

/**
 * Create a new storybook for a device without adding a creature
 */
export async function createNewStorybook(deviceId: string, bookName?: string): Promise<boolean> {
  try {
    console.log("[SERVER] Starting createNewStorybook for device:", deviceId)

    if (!deviceId) {
      console.error("[SERVER] No device ID provided to createNewStorybook")
      return false
    }

    // Check if user already has a storybook
    try {
      const existingStorybook = await getStorybook(deviceId)
      console.log("[SERVER] Existing storybook check result:", existingStorybook ? "Found" : "Not found")

      if (existingStorybook) {
        // User already has a storybook, no need to create a new one
        console.log("[SERVER] User already has a storybook, returning true")
        return true
      }
    } catch (checkError) {
      console.error("[SERVER] Error checking for existing storybook:", checkError)
      // Continue to try creating a new one
    }

    // Create a new storybook
    console.log("[SERVER] Creating new storybook for device:", deviceId)
    try {
      const newBookId = await createStorybook(deviceId, bookName)
      console.log("[SERVER] Create storybook result:", newBookId)

      if (!newBookId) {
        console.error("[SERVER] Failed to create storybook - no ID returned")
        return false
      }

      console.log("[SERVER] Created new storybook with ID:", newBookId)

      // Revalidate the storybook page to reflect changes
      revalidatePath("/storybook")
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
