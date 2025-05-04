"use server"

import OpenAI from "openai"

type CreatureDetails = {
  name: string
  color: string
  bodyPart1: string
  bodyPart2: string
  ability: string
  habitat: string
}

export type StoryResult = {
  story: string
  imagePrompt: string
  imageUrl: string | null
  sceneImagePrompt: string
  sceneImageUrl: string | null
}

export type SuggestionResult = {
  bodyParts: string[]
  habitats: string[]
}

// New function to generate suggestions using Grok
export async function generateSuggestions(): Promise<SuggestionResult> {
  try {
    const apiKey = process.env.X_AI_API_KEY

    // Default suggestions in case API call fails
    const defaultSuggestions: SuggestionResult = {
      bodyParts: [
        "Wings",
        "Tail",
        "Horn",
        "Tentacles",
        "Fins",
        "Claws",
        "Snail Shell",
        "Antlers",
        "Trunk",
        "Spikes",
        "Fluffy Fur",
        "Scales",
      ],
      habitats: [
        "Candy Forest",
        "Cloud Castle",
        "Underwater Cave",
        "Crystal Mountain",
        "Rainbow Waterfall",
        "Floating Island",
        "Glowing Mushroom Forest",
        "Bubble Kingdom",
        "Ice Palace",
        "Star Meadow",
      ],
    }

    if (!apiKey) {
      console.log("No API key found for generating suggestions")
      return defaultSuggestions
    }

    // Initialize the OpenAI client with X.AI configuration
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
      dangerouslyAllowBrowser: true,
    })

    // Create a prompt for generating suggestions - only for body parts and habitats
    const prompt = `You're a wildly imaginative assistant helping to build a magical creature creator for children ages 5 to 10. The creatures will be brought to life with generative AI illustrations, so the ideas must spark wonder, vivid visuals, and delight. Please provide: 

1. A list of 16 unique, imaginative, and varied body parts that magical creatures might have. 
   - Include a mix of physical features (like wings, tails, etc.)
   - Include unusual or magical features (like "time-shifting gears" or "dream-catching antennae")
   - Include features inspired by different elements (water, fire, air, earth, dreams, stars, etc.)
   - Avoid repeating similar concepts (don't just list different types of the same feature)

2. A list of 16 whimsical and fantastical habitats where magical creatures might live.
   - Include diverse environments (sky, underground, underwater, space-related, etc.)
   - Include habitats with unusual physical properties (like "upside-down mountains" or "bubble cities")
   - Include habitats related to emotions, dreams, or abstract concepts
   - Make each habitat distinct and evocative with rich imagery potential

Format your response as a JSON object with two arrays: bodyParts and habitats. Each item should be a single word or short phrase, capitalized, and suitable for children ages 5-10. Focus on variety, uniqueness, and whimsy - avoid conventional or repetitive options.`

    console.log("Sending suggestion prompt to Grok")

    // Generate suggestions using Grok
    const completion = await client.chat.completions.create({
      model: "grok-3-beta",
      messages: [
        {
          role: "system",
          content:
            "You are a wildly creative assistant specializing in generating unique, diverse, and unexpected content for a magical creature generator. Your suggestions should be imaginative, varied, and avoid conventional patterns. Each suggestion should feel distinct from the others, drawing from different themes, elements, and concepts. Prioritize originality and surprise over familiar fantasy tropes.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    })

    // Extract the generated content
    const generatedContent = completion.choices?.[0]?.message?.content

    if (generatedContent) {
      try {
        // Parse the JSON response
        const suggestions = JSON.parse(generatedContent) as SuggestionResult
        console.log("Generated suggestions:", suggestions)

        // Validate the response structure
        if (
          Array.isArray(suggestions.bodyParts) &&
          Array.isArray(suggestions.habitats) &&
          suggestions.bodyParts.length > 0 &&
          suggestions.habitats.length > 0
        ) {
          return suggestions
        } else {
          console.log("Invalid suggestion format, using defaults")
          return defaultSuggestions
        }
      } catch (error) {
        console.error("Failed to parse suggestions:", error)
        return defaultSuggestions
      }
    } else {
      console.log("No content generated for suggestions, using defaults")
      return defaultSuggestions
    }
  } catch (error) {
    console.error("Error generating suggestions:", error)
    // Return default suggestions if there's an error
    return {
      bodyParts: [
        "Wings",
        "Tail",
        "Horn",
        "Tentacles",
        "Fins",
        "Claws",
        "Snail Shell",
        "Antlers",
        "Trunk",
        "Spikes",
        "Fluffy Fur",
        "Scales",
        "Crystal Spines",
        "Glowing Spots",
        "Feathered Crest",
        "Floating Orbs",
      ],
      habitats: [
        "Candy Forest",
        "Cloud Castle",
        "Underwater Cave",
        "Crystal Mountain",
        "Rainbow Waterfall",
        "Floating Island",
        "Glowing Mushroom Forest",
        "Bubble Kingdom",
        "Ice Palace",
        "Star Meadow",
        "Lava Springs",
        "Moonlight Garden",
        "Whispering Canyon",
        "Nebula Shores",
        "Enchanted Library",
        "Dream Meadow",
      ],
    }
  }
}

// Function to generate an image using Grok API
async function generateCreatureImage(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.X_AI_API_KEY

    if (!apiKey) {
      console.log("No API key found for image generation")
      return null
    }

    // Ensure prompt is a string and within character limit
    const safePrompt = (prompt || "magical creature, children's illustration style").substring(0, 500)

    console.log("Generating image with prompt:", safePrompt)
    console.log("Prompt length:", safePrompt.length)

    // Initialize the OpenAI client with X.AI configuration
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
      dangerouslyAllowBrowser: true,
    })

    // Use the exact same structure as the sample code
    const response = await openai.images.generate({
      prompt: safePrompt,
      model: "grok-2-image",
    })

    console.log(response.data[0].url)

    console.log(response.data[0])

    // Check if we have a valid URL in the response
    if (response.data && response.data.length > 0 && response.data[0].url) {
      return response.data[0].url
    }

    return null
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}

// Helper function to extract key sentences from a paragraph
function extractKeySentences(text: string, maxLength = 150): string {
  // Split by periods to get sentences
  const sentences = text
    .split(".")
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim() + ".")

  if (sentences.length === 0) return ""

  // If we only have one sentence, truncate it if needed
  if (sentences.length === 1) {
    return sentences[0].substring(0, maxLength)
  }

  // Try to get the most descriptive sentence (often the longest one with visual details)
  // Sort by length and take the longest one, which likely has more visual details
  const sortedSentences = [...sentences].sort((a, b) => b.length - a.length)

  // Take the longest sentence if it's not too long
  if (sortedSentences[0].length <= maxLength) {
    return sortedSentences[0]
  }

  // Otherwise, take the first sentence and truncate if needed
  return sentences[0].substring(0, maxLength)
}

// Function to generate a scene image prompt based on the story with character budgets
function generateSceneImagePrompt(story: string, creatureDetails: CreatureDetails): string {
  try {
    // Character budgets
    const CREATURE_BUDGET = 150
    const SCENE_BUDGET = 150
    const STYLE_BUDGET = 100
    const HABITAT_BUDGET = 100
    const TOTAL_BUDGET = 500 // Leave 12 chars as buffer

    // Get the creature details for the prompt
    const name = creatureDetails?.name || "Magical Creature"
    const color = creatureDetails?.color || "colorful"
    const bodyPart1 = creatureDetails?.bodyPart1 || "magical features"
    const bodyPart2 = creatureDetails?.bodyPart2 || "special features"
    const ability = creatureDetails?.ability || "do magic"
    const habitat = creatureDetails?.habitat || "magical land"

    // Split the story into paragraphs
    const paragraphs = story.split("\n\n").filter((p) => p.trim() !== "")

    // Use the second paragraph if available, otherwise use the last paragraph
    const sceneText = paragraphs.length > 1 ? paragraphs[1] : paragraphs[paragraphs.length - 1]

    // 1. Essential creature details (within budget)
    const creaturePrompt =
      `${name}, a ${color} creature with ${bodyPart1} and ${bodyPart2}, who can ${ability}`.substring(
        0,
        CREATURE_BUDGET,
      )

    // 2. Extract key scene context
    const sceneContext = extractKeySentences(sceneText, SCENE_BUDGET)

    // 3. Style guidance
    const stylePrompt = "Children's illustration style, whimsical, colorful, fantasy art, magical atmosphere".substring(
      0,
      STYLE_BUDGET,
    )

    // 4. Habitat details
    const habitatPrompt = `in a ${habitat} setting`.substring(0, HABITAT_BUDGET)

    // Combine components in priority order
    let finalPrompt = ""
    let remainingBudget = TOTAL_BUDGET

    // Add components in priority order
    const components = [
      `A magical scene: ${sceneContext}`,
      `The scene features ${creaturePrompt}`,
      habitatPrompt,
      stylePrompt,
    ]

    for (const component of components) {
      if (component.length + 1 <= remainingBudget) {
        // +1 for space
        finalPrompt += (finalPrompt ? " " : "") + component
        remainingBudget -= component.length + 1
      } else if (remainingBudget > 20) {
        // If we have at least 20 chars left, add a truncated version
        const truncated = component.substring(0, remainingBudget - 1)
        finalPrompt += (finalPrompt ? " " : "") + truncated
        break
      } else {
        // Not enough space left for meaningful content
        break
      }
    }

    // Safety check - ensure we're under the limit
    finalPrompt = finalPrompt.substring(0, TOTAL_BUDGET)

    console.log("Scene image prompt:", finalPrompt)
    console.log("Prompt length:", finalPrompt.length)

    return finalPrompt
  } catch (error) {
    console.error("Error generating scene image prompt:", error)
    return "A magical scene from a children's story, whimsical, colorful, fantasy art".substring(0, 500)
  }
}

// Function to generate an image prompt based on creature details with character budget
function generateImagePrompt(details: CreatureDetails): string {
  try {
    const TOTAL_BUDGET = 500 // Leave 12 chars as buffer

    // Ensure all properties have default values to prevent undefined errors
    const name = details?.name || "Magical Creature"
    const color = details?.color || "colorful"
    const bodyPart1 = details?.bodyPart1 || "magical features"
    const bodyPart2 = details?.bodyPart2 || "special features"
    const ability = details?.ability || "do magic"
    const habitat = details?.habitat || "magical land"

    // Create a detailed prompt for image generation with priority components
    const creaturePrompt = `A cute, magical ${color} creature named ${name} with ${bodyPart1} and ${bodyPart2}, who can ${ability}`
    const habitatPrompt = `in a ${habitat} setting`
    const stylePrompt =
      "Children's illustration style, whimsical, colorful, fantasy art, detailed, digital painting, magical atmosphere, kid-friendly"

    // Combine components in priority order
    let finalPrompt = ""
    let remainingBudget = TOTAL_BUDGET

    // Add components in priority order
    const components = [creaturePrompt, habitatPrompt, stylePrompt]

    for (const component of components) {
      if (component.length + 1 <= remainingBudget) {
        // +1 for space
        finalPrompt += (finalPrompt ? " " : "") + component
        remainingBudget -= component.length + 1
      } else if (remainingBudget > 20) {
        // If we have at least 20 chars left, add a truncated version
        const truncated = component.substring(0, remainingBudget - 1)
        finalPrompt += (finalPrompt ? " " : "") + truncated
        break
      } else {
        // Not enough space left for meaningful content
        break
      }
    }

    // Safety check - ensure we're under the limit
    finalPrompt = finalPrompt.substring(0, TOTAL_BUDGET)

    console.log("Creature image prompt:", finalPrompt)
    console.log("Prompt length:", finalPrompt.length)

    return finalPrompt
  } catch (error) {
    console.error("Error generating image prompt:", error)
    return "A magical creature, children's illustration style".substring(0, 500)
  }
}

export async function generateCreatureStory(details: CreatureDetails): Promise<StoryResult> {
  try {
    // Log the incoming details to debug
    console.log("Received details:", JSON.stringify(details))

    // Ensure all properties have default values to prevent undefined errors
    const safeDetails = {
      name: details?.name || "Unnamed",
      color: details?.color || "colorful",
      bodyPart1: details?.bodyPart1 || "magical feature",
      bodyPart2: details?.bodyPart2 || "special feature",
      ability: details?.ability || "magic",
      habitat: details?.habitat || "magical land",
    }

    // Generate an image prompt based on the creature details
    const imagePrompt = generateImagePrompt(safeDetails)

    // Start image generation early so it can process while we generate the story
    const imagePromise = generateCreatureImage(imagePrompt)

    // Check if X.AI API key is available
    const apiKey = process.env.X_AI_API_KEY

    // Story generation result
    let storyText: string

    // If API key is available, use Grok
    if (apiKey) {
      try {
        // Initialize the OpenAI client with X.AI configuration
        const client = new OpenAI({
          apiKey: apiKey,
          baseURL: "https://api.x.ai/v1",
          dangerouslyAllowBrowser: true,
        })

        // Create an improved prompt for Grok that encourages creativity and variety
        const prompt = `
       Write a unique, imaginative story for children ages 5-10 about a magical creature with these traits:

NAME: "${safeDetails.name}" - Use this name throughout and give the creature a personality that shines through its actions and matches the names vibe.

COLOR: "${safeDetails.color}" - Show this color in a vivid, unusual way (e.g., it sparkles under moonlight, shifts with emotions, or leaves a trail). Make it central to the creatures presence.

BODY PARTS: "${safeDetails.bodyPart1}" and "${safeDetails.bodyPart2}" - Describe these parts with flair, showing how they look and function in surprising, essential ways. Make them key to the creatures identity and story.

MAGICAL ABILITY: "${safeDetails.ability}" - Weave this power into the story creatively, using it in unexpected ways to solve problems or spark events.

HABITAT: "${safeDetails.habitat}" - Paint a lively, sensory-rich environment with one striking sound and one unique smell. Show how the creature shapes or is shaped by its home.

GUIDELINES:
1. Craft a playful, wondrous tone that captivates kids, with a clear arc: introduce the creature, show it facing a quirky challenge, and resolve with a surprising outcome.
2. Connect traits thematically—let one trait solve a problem tied to another for a cohesive story.
3. Avoid clichés like "saving a lost friend" or "typical fantasy forests" unless reimagined boldly. Draw from obscure inspirations or blend unexpected genres.
4. Include one surprising element, like a quirky side character, bizarre environmental feature, or twist that flips a traits role.
5. Keep the story 2-3 paragraphs (200-300 words), using vivid, engaging language to spark imagination.

Ensure each story feels fresh by varying structure and dodging formulaic patterns. Make every trait integral, not just mentioned, for a tale that surprises and delights!
        `

        console.log("Sending prompt to Grok:", prompt)

        // Generate the story using Grok
        const completion = await client.chat.completions.create({
          model: "grok-3-beta",
          messages: [
            {
              role: "system",
              content:
                "You are an extraordinarily creative storyteller for children. You create magical, whimsical stories that are highly imaginative, unexpected, and tailored specifically to the details provided. You never follow formulaic patterns and always incorporate the provided elements in meaningful, central ways.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.9, // Increased temperature for more creativity
          max_tokens: 600, // Increased token limit for more detailed stories
        })

        // Log the full API response for debugging
        console.log("Grok API response:", JSON.stringify(completion, null, 2))

        // Safely extract the generated story
        const generatedContent = completion.choices?.[0]?.message?.content
        console.log("Generated content:", generatedContent)

        // If we have content, use it, otherwise fall back to template
        if (generatedContent) {
          storyText = generatedContent
        } else {
          console.log("No content generated by API, falling back to template")
          storyText = generateTemplateStory(safeDetails)
        }
      } catch (apiError) {
        console.error("API error details:", apiError)
        // Fall back to template story if there's an API error
        storyText = generateTemplateStory(safeDetails)
      }
    } else {
      // If no API key, use template-based story generation
      console.log("No API key found, using template story")
      storyText = generateTemplateStory(safeDetails)
    }

    // Wait for the first image to complete
    const imageUrl = await imagePromise

    // Now that we have the story, generate a scene image prompt
    const sceneImagePrompt = generateSceneImagePrompt(storyText, safeDetails)

    // Generate the scene image after we have the story
    const sceneImageUrl = await generateCreatureImage(sceneImagePrompt)

    return {
      story: storyText,
      imagePrompt: imagePrompt,
      imageUrl: imageUrl,
      sceneImagePrompt: sceneImagePrompt,
      sceneImageUrl: sceneImageUrl,
    }
  } catch (error) {
    console.error("Error generating creature story:", error)
    // Return a simple error story instead of throwing
    return {
      story: `Once upon a time, there was a magical creature. The creature had many adventures in a magical land. The end.`,
      imagePrompt: "magical creature in a fantasy land, children's illustration style",
      imageUrl: null,
      sceneImagePrompt: "magical scene in a fantasy land, children's illustration style",
      sceneImageUrl: null,
    }
  }
}

// Fallback function that generates a story without requiring an API
function generateTemplateStory(details: CreatureDetails): string {
  try {
    // Make sure we have safe values
    const name = details?.name || "Unnamed"
    const color = details?.color || "colorful"
    const bodyPart1 = details?.bodyPart1 || "magical feature"
    const bodyPart2 = details?.bodyPart2 || "special feature"
    const ability = details?.ability || "magic"
    const habitat = details?.habitat || "magical land"

    // Create more varied template stories based on the habitat
    // Ensure habitat is a string before calling toLowerCase()
    const safeHabitat = typeof habitat === "string" ? habitat.toLowerCase() : "magical land"

    switch (safeHabitat) {
      case "candy forest":
        return `In the sugary depths of the Candy Forest lived ${name}, a ${color} creature with extraordinary ${bodyPart1} that sparkled like sugar crystals and ${bodyPart2} made of twisted licorice. ${name}'s ${bodyPart1} could detect the ripest candy fruits, while their ${bodyPart2} helped them swing from one candy cane tree to another.

Every morning, ${name} would use their magical ability to ${ability}, turning dewdrops into tiny rainbow sprinkles that covered the forest floor. The other candy forest creatures—gummy bears, chocolate bunnies, and marshmallow birds—would gather around to watch in awe as ${name} performed this sweet transformation.

One stormy day, when sugar rain threatened to melt the chocolate river banks, ${name} discovered their ${bodyPart1} could channel their ${ability} in a new way. With a spectacular display of magic, they created a protective candy shell over the vulnerable chocolate shores. The Candy King was so impressed by ${name}'s quick thinking that he awarded them a special position as the Forest's official Sweetness Guardian.`

      case "cloud castle":
        return `High above the world, where clouds form towers and palaces, ${name} made their home in the magnificent Cloud Castle. With ${bodyPart1} as light as mist and ${bodyPart2} that could shape the very clouds themselves, this ${color} creature was the castle's most beloved resident. ${name}'s ${color} hue would shift with the sunrise and sunset, painting the cloud walls with beautiful colors.

${name}'s most treasured talent was their ability to ${ability}. Each time they used this power, the cloud castle would shimmer and dance, creating spectacular sky shows that could be seen from the ground below. The sky fairies who shared the castle would often request special performances during their celestial celebrations.

During the great Sky Drought, when clouds became scarce and the castle began to fade, ${name} journeyed to the distant Mountain of Storms. Using their ${bodyPart1} to navigate treacherous air currents and their ${bodyPart2} to collect storm essence, they returned just in time. With a magnificent display of their ${ability}, ${name} restored the Cloud Castle to its full glory, saving their home and earning the title of Cloud Savior.`

      case "underwater cave":
        return `Deep in the mysterious Underwater Cave, where bioluminescent algae cast an ethereal glow on crystal formations, lived ${name}. This remarkable ${color} creature had ${bodyPart1} that could sense changes in water pressure and ${bodyPart2} perfectly adapted for navigating the narrowest cave passages. ${name}'s ${color} skin would absorb the cave's light during the day and glow softly at night, creating beautiful patterns on the cave walls.

${name} possessed the extraordinary ability to ${ability}, which they used to communicate with the ancient cave spirits. The cave dwellers—crystal crabs, pearl oysters, and current fish—would gather in the central cavern to hear the messages ${name} would share, full of wisdom from times long past.

When earthquake tremors threatened to collapse the cave system, ${name} used their ${bodyPart1} to detect which passages were most at risk. Combining their knowledge with their magical ${ability}, they reinforced the weakened areas by creating new crystal formations that strengthened the cave structure. The grateful cave creatures celebrated ${name} with a festival of lights, declaring them the official Guardian of the Deep.`

      default:
        // Default varied template
        return `In the heart of the ${habitat}, where magic flows like gentle streams, lived a creature unlike any other. ${name}, with their brilliant ${color} appearance, stood out among all the inhabitants. Their magnificent ${bodyPart1} could sense changes in the magical atmosphere, while their remarkable ${bodyPart2} gave them abilities that others could only dream of. The way ${name}'s ${bodyPart1} caught the light made other creatures stop and stare in wonder.

What truly made ${name} special was their extraordinary ability to ${ability}. They didn't use this power carelessly—only when it could bring joy or help others. The other inhabitants of the ${habitat} would often seek out ${name} when they needed this special magic, knowing that ${name} would never refuse someone in need.

The ${habitat} faced its greatest challenge when a mysterious darkness began spreading, dimming all light and magic. While others fled, ${name} discovered that their ${bodyPart2} could absorb the darkness, while their ${ability} could transform it into pure light. For three days and nights, ${name} worked tirelessly, using their ${bodyPart1} to locate pockets of darkness and their magic to cleanse them. When the ${habitat} was finally restored to its full splendor, the grateful inhabitants honored ${name} by naming the brightest spot in the ${habitat} after their brave savior.`
    }
  } catch (error) {
    console.error("Error in template story generation:", error)
    return `Once upon a time, there was a magical creature. The creature had many adventures in a magical land. The end.`
  }
}

// Helper function to get a random creature for the story
function getRandomCreature(): string {
  const creatures = ["butterfly", "bunny", "fairy", "dragon", "unicorn", "pixie", "kitten", "puppy", "bird", "frog"]
  return creatures[Math.floor(Math.random() * creatures.length)]
}
