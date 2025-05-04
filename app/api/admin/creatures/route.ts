import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch all creatures, ordered by creation date (newest first)
    const { data, error } = await supabase.from("creatures").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      creatures: data,
    })
  } catch (error) {
    console.error("Error fetching creatures:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch creatures",
      },
      { status: 500 },
    )
  }
}
