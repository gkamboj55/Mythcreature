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

    // Execute the SQL to create the tables directly
    const { error } = await supabase.rpc("setup_storybook_tables")

    if (error) {
      console.error("Error setting up storybook tables:", error)

      // If the function doesn't exist, create the tables directly
      if (error.message.includes("does not exist")) {
        // Create the storybooks table
        const { error: createStorybooksError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS storybooks (
            id SERIAL PRIMARY KEY,
            device_id TEXT NOT NULL,
            book_name TEXT NOT NULL DEFAULT 'My Magical Storybook',
            cover_image_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        if (createStorybooksError) {
          throw createStorybooksError
        }

        // Create the storybook_entries table
        const { error: createEntriesError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS storybook_entries (
            id SERIAL PRIMARY KEY,
            storybook_id INTEGER REFERENCES storybooks(id) ON DELETE CASCADE,
            creature_short_id TEXT REFERENCES creatures(short_id) ON DELETE CASCADE,
            page_number INTEGER NOT NULL,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        if (createEntriesError) {
          throw createEntriesError
        }

        // Create indexes
        await supabase.query(`
          CREATE INDEX IF NOT EXISTS idx_storybooks_device_id ON storybooks(device_id);
          CREATE INDEX IF NOT EXISTS idx_storybook_entries_storybook_id ON storybook_entries(storybook_id);
          CREATE INDEX IF NOT EXISTS idx_storybook_entries_creature_id ON storybook_entries(creature_short_id);
        `)

        return NextResponse.json({
          success: true,
          message: "Storybook tables created directly",
        })
      } else {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Storybook tables created successfully",
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
