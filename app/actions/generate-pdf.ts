"use server"

import { jsPDF } from "jspdf"
import fetch from "node-fetch"

type CreatureDetails = {
  name: string
  color: string
  bodyPart1: string
  bodyPart2: string
  ability: string
  habitat: string
}

type StoryData = {
  story: string
  imageUrl: string | null
  imagePrompt: string
  sceneImageUrl: string | null
  sceneImagePrompt: string
  creatureDetails: CreatureDetails
}

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // For placeholder SVGs, return null to use fallback
    if (url.startsWith("/placeholder")) {
      return null
    }

    // If the URL is relative, make it absolute
    if (url.startsWith("/")) {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://mythcreature.vercel.app"
      url = `${baseUrl}${url}`
    }

    console.log("Fetching image from:", url)

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // Determine the mime type based on the URL
    let mimeType = "image/jpeg" // Default
    if (url.endsWith(".png")) mimeType = "image/png"
    if (url.endsWith(".gif")) mimeType = "image/gif"

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error("Error fetching image:", error)
    return null
  }
}

export async function generatePDF(data: StoryData): Promise<string> {
  try {
    // Split the story into paragraphs
    const paragraphs = data.story.split("\n\n").filter((p) => p.trim() !== "")

    // Determine which paragraphs go on which page to match the book layout
    const firstPageParagraphs = paragraphs.length > 0 ? [paragraphs[0]] : []
    const secondPageParagraphs = paragraphs.slice(1)

    // Fetch images as base64 (if available)
    let creatureImageBase64: string | null = null
    let sceneImageBase64: string | null = null

    if (data.imageUrl) {
      creatureImageBase64 = await fetchImageAsBase64(data.imageUrl)
    }

    if (data.sceneImageUrl) {
      sceneImageBase64 = await fetchImageAsBase64(data.sceneImageUrl)
    }

    // Create PDF (A4 format)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Define page dimensions
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const margin = 20 // Margin in mm
    const contentWidth = pageWidth - 2 * margin
    const footerHeight = 20 // Height reserved for footer

    // Set consistent font size - INCREASED TO 16
    const titleFontSize = 30 // Increased from 28
    const bodyFontSize = 16 // Increased from 14
    const dropCapFontSize = 40 // Increased from 36

    // ===== FIRST PAGE =====

    // Add title to first page
    pdf.setFont("serif", "bold")
    pdf.setFontSize(titleFontSize)
    pdf.setTextColor(139, 69, 19) // Brown color
    pdf.text(`The Tale of ${data.creatureDetails.name}`, pageWidth / 2, margin + 10, { align: "center" })

    // Add creature image to first page
    if (creatureImageBase64) {
      pdf.addImage(creatureImageBase64, "JPEG", (pageWidth - 70) / 2, margin + 20, 70, 70)
    } else {
      // Add a colored rectangle as placeholder
      pdf.setFillColor(getColorFromName(data.creatureDetails.color))
      pdf.rect((pageWidth - 70) / 2, margin + 20, 70, 70, "F")

      // Add text
      pdf.setFont("serif", "normal")
      pdf.setFontSize(16)
      pdf.setTextColor(255, 255, 255) // White text
      pdf.text(data.creatureDetails.name, pageWidth / 2, margin + 55, { align: "center" })
    }

    // Position for the start of the story text
    const storyStartY = margin + 100

    // Add first paragraph with drop cap styling
    if (firstPageParagraphs.length > 0) {
      const firstParagraph = firstPageParagraphs[0]

      // Add first letter as larger drop cap
      pdf.setFont("serif", "bold")
      pdf.setFontSize(dropCapFontSize)
      const dropCapWidth = 14 // Increased from 12 for larger font
      const dropCapHeight = 14 // Increased from 12 for larger font
      pdf.text(firstParagraph.charAt(0), margin, storyStartY)

      // Add rest of first paragraph with text wrapping around the drop cap
      pdf.setFont("serif", "normal")
      pdf.setFontSize(bodyFontSize)
      pdf.setTextColor(93, 64, 55) // Dark brown

      // Format text with line breaks for the first paragraph
      const firstPageText = firstParagraph.substring(1)

      // Calculate lines with proper wrapping
      const lines = []
      let currentLine = ""
      const words = firstPageText.split(" ")

      // First line starts after the drop cap
      let lineX = margin + dropCapWidth
      let lineWidth = contentWidth - dropCapWidth
      let lineY = storyStartY
      let isFirstLine = true

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const testLine = currentLine + (currentLine ? " " : "") + word
        const testWidth = pdf.getStringUnitWidth(testLine) * bodyFontSize * 0.352778 // Convert to mm

        if (testWidth > lineWidth) {
          // Add the current line
          pdf.text(currentLine, lineX, lineY)

          // Start a new line
          currentLine = word
          lineY += 8 // Increased line height for larger font

          // After first line, use full width and start from left margin
          if (isFirstLine) {
            isFirstLine = false
            lineX = margin
            lineWidth = contentWidth
          }
        } else {
          currentLine = testLine
        }
      }

      // Add the last line
      pdf.text(currentLine, lineX, lineY)
      lineY += 8 // Increased line height for larger font

      // Update the current Y position for next content
      const currentY = lineY + 6 // Add some spacing after paragraph
    }

    // Add footer to first page
    addFooter(pdf, pageWidth, pageHeight)

    // ===== SECOND PAGE =====

    // Add new page for the second part
    pdf.addPage()

    // Add scene image to second page (top right)
    if (sceneImageBase64) {
      pdf.addImage(sceneImageBase64, "JPEG", pageWidth - margin - 60, margin, 50, 50)
    } else {
      // Add a colored rectangle as placeholder
      pdf.setFillColor(getColorFromName(data.creatureDetails.color, 0.7))
      pdf.rect(pageWidth - margin - 60, margin, 50, 50, "F")
    }

    // Add remaining paragraphs to second page
    pdf.setFont("serif", "normal")
    pdf.setFontSize(bodyFontSize)
    pdf.setTextColor(93, 64, 55) // Dark brown

    let yPosition = margin + 10

    for (let i = 0; i < secondPageParagraphs.length; i++) {
      const paragraph = secondPageParagraphs[i]

      // Determine if text needs to wrap around the image
      const textWidth = yPosition < margin + 60 ? contentWidth - 60 : contentWidth
      const textX = margin

      // Format text with line breaks
      const paragraphLines = pdf.splitTextToSize(paragraph, textWidth)

      pdf.text(paragraphLines, textX, yPosition)
      yPosition += paragraphLines.length * 8 + 6 // Increased spacing for larger font
    }

    // Add "The End" at the bottom of the second page
    const maxYPosition = pageHeight - margin - footerHeight
    if (yPosition < maxYPosition - 10) {
      pdf.setFont("serif", "italic")
      pdf.setTextColor(139, 69, 19) // Brown color
      pdf.text("The End", pageWidth / 2, yPosition + 10, { align: "center" })
    }

    // Add footer to second page
    addFooter(pdf, pageWidth, pageHeight)

    // Convert PDF to base64 string
    const pdfBase64 = pdf.output("datauristring")
    return pdfBase64
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

// Function to add footer to each page - now without the image
function addFooter(pdf: any, pageWidth: number, pageHeight: number) {
  const footerY = pageHeight - 15

  // Add app name
  pdf.setFont("serif", "bold")
  pdf.setFontSize(12) // Increased from 10
  pdf.setTextColor(139, 69, 19) // Brown color
  pdf.text("Magical Creature Creator", pageWidth / 2, footerY, { align: "center" })

  // Add website URL
  pdf.setFont("serif", "normal")
  pdf.setFontSize(10) // Increased from 8
  pdf.text("https://mythcreature.vercel.app", pageWidth / 2, footerY + 8, { align: "center" })
}

// Helper function to get a color from name
function getColorFromName(colorName: string, opacity = 1): string {
  const colorMap: { [key: string]: number[] } = {
    red: [220, 20, 60],
    orange: [255, 140, 0],
    yellow: [255, 215, 0],
    green: [46, 139, 87],
    blue: [65, 105, 225],
    purple: [138, 43, 226],
    pink: [255, 105, 180],
    brown: [139, 69, 19],
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [128, 128, 128],
    teal: [0, 128, 128],
    gold: [218, 165, 32],
    silver: [192, 192, 192],
    rainbow: [255, 20, 147], // Using a vibrant pink for rainbow
    sparkly: [0, 191, 255], // Using a bright cyan for sparkly
  }

  const rgb = colorMap[colorName.toLowerCase()] || [147, 112, 219] // Default to medium purple
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}
