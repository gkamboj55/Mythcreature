import { type NextRequest, NextResponse } from "next/server"
import { generatePDF } from "@/app/actions/generate-pdf"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Received PDF generation request")

    // Generate the PDF
    const pdfBase64 = await generatePDF(data)
    console.log("PDF generated successfully")

    // Return the PDF data
    return NextResponse.json({
      success: true,
      pdfData: pdfBase64,
    })
  } catch (error) {
    console.error("Error in PDF generation API:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
