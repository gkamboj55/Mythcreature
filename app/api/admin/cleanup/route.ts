import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Helper function to delete images for a creature
async function deleteCreatureImages(supabase: any, shortId: string) {
  try {
    // List all files in the creature's folder
    const { data: files, error: listError } = await supabase.storage.from("creature-images").list(shortId)

    if (listError) {
      console.error(`Error listing files for creature ${shortId}:`, listError)
      return
    }

    if (!files || files.length === 0) {
      return // No files to delete
    }

    // Create an array of file paths to delete
    const filesToDelete = files.map((file) => `${shortId}/${file.name}`)

    // Delete the files
    const { error: deleteError } = await supabase.storage.from("creature-images").remove(filesToDelete)

    if (deleteError) {
      console.error(`Error deleting files for creature ${shortId}:`, deleteError)
    }
  } catch (error) {
    console.error(`Error in deleteCreatureImages for ${shortId}:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get expired entries to delete their images first
    const { data: expiredCreatures, error: fetchError } = await supabase
      .from("creatures")
      .select("short_id")
      .lt("expires_at", new Date().toISOString())

    if (fetchError) {
      throw fetchError
    }

    // Delete images for each expired creature
    if (expiredCreatures && expiredCreatures.length > 0) {
      for (const creature of expiredCreatures) {
        await deleteCreatureImages(supabase, creature.short_id)
      }
    }

    // Delete expired entries
    const { error, count } = await supabase
      .from("creatures")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("count")

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} expired entries and their associated images`,
      count,
    })
  } catch (error) {
    console.error("Error cleaning up expired creatures:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clean up expired creatures",
      },
      { status: 500 },
    )
  }
}
