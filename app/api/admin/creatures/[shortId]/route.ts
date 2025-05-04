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

export async function DELETE(request: NextRequest, { params }: { params: { shortId: string } }) {
  try {
    const shortId = params.shortId

    if (!shortId) {
      return NextResponse.json({ success: false, error: "Short ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Delete associated images first
    await deleteCreatureImages(supabase, shortId)

    // Delete the creature with the specified short ID
    const { error } = await supabase.from("creatures").delete().eq("short_id", shortId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Creature and associated images deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting creature:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete creature",
      },
      { status: 500 },
    )
  }
}
