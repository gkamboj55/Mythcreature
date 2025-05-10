import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const deviceId = url.searchParams.get("deviceId")
    const creatureId = url.searchParams.get("creatureId")
    const storybookId = url.searchParams.get("storybookId")

    if (!deviceId || !creatureId || !storybookId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // First verify the storybook belongs to this device
    const { data: storybook, error: storybookError } = await supabase
      .from("storybooks")
      .select("id")
      .eq("id", storybookId)
      .eq("device_id", deviceId)
      .single()

    if (storybookError || !storybook) {
      console.error("Error verifying storybook ownership:", storybookError)
      return NextResponse.json({ success: false, isInStorybook: false }, { status: 200 })
    }

    // Check if the creature is in this storybook
    const { data: entries, error: entriesError } = await supabase
      .from("storybook_entries")
      .select("id")
      .eq("storybook_id", storybookId)
      .eq("creature_short_id", creatureId)
      .limit(1)

    if (entriesError) {
      console.error("Error checking for creature in storybook:", entriesError)
      return NextResponse.json({ success: false, isInStorybook: false }, { status: 200 })
    }

    const isInStorybook = entries && entries.length > 0

    return NextResponse.json({
      success: true,
      isInStorybook,
    })
  } catch (error) {
    console.error("Error in check-creature-in-storybook API:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
