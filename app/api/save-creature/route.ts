import { type NextRequest, NextResponse } from "next/server"
import { saveCreatureData } from "@/app/actions/creature-storage"

export async function POST(request: NextRequest) {
  try {
    const creatureData = await request.json()

    // Save the data to Supabase
    const shortId = await saveCreatureData(creatureData)

    // Return the short ID
    return NextResponse.json({ success: true, shortId })
  } catch (error) {
    console.error("Error saving creature data:", error)
    return NextResponse.json({ success: false, error: "Failed to save creature data" }, { status: 500 })
  }
}
