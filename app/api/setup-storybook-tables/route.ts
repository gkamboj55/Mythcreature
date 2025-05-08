import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const url = new URL(request.url)
    const secretKey = url.searchParams.get("key")

    // This is a simple protection - in production, use a more secure method
    if (secretKey !== process.env.CLEANUP_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Check if storybooks table exists
    const { error: checkError } = await supabase.from("storybooks").select("id").limit(1)

    if (checkError && checkError.code === "PGRST204") {
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc("setup_storybook_tables")

      if (createError) {
        throw createError
      }

      return NextResponse.json({
        success: true,
        message: "Storybook tables created successfully",
      })
    } else if (checkError) {
      throw checkError
    }

    return NextResponse.json({
      success: true,
      message: "Storybook tables already exist",
    })
  } catch (error) {
    console.error("Error setting up storybook tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up storybook tables",
        details: error,
      },
      { status: 500 },
    )
  }
}
