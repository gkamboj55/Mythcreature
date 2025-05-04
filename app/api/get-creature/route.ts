import { type NextRequest, NextResponse } from "next/server"
import { getCreatureData } from "@/app/actions/creature-storage"

export async function GET(request: NextRequest) {
  try {
    // Get the ID from the query parameters
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "No ID provided" }, { status: 400 })
    }

    // Fetch the data from Supabase
    const data = await getCreatureData(id)

    if (!data) {
      return NextResponse.json({ success: false, error: "Creature not found" }, { status: 404 })
    }

    // Return the creature data
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error retrieving creature data:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve creature data" }, { status: 500 })
  }
}
