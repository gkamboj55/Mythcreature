"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { generateCreatureStory, generateSuggestions, type StoryResult, type SuggestionResult } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wand2, Sparkles, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Form validation schema for step 1
const step1Schema = z.object({
  name: z.string().min(1, { message: "Please give your creature a name" }),
  color: z.string().min(1, { message: "Please select a color" }),
  ability: z.string().min(1, { message: "Please describe a magical ability" }),
})

// Complete form validation schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Please give your creature a name" }),
  color: z.string().min(1, { message: "Please select a color" }),
  bodyPart1: z.string().min(1, { message: "Please select a body part" }),
  bodyPart2: z.string().min(1, { message: "Please select another body part" }),
  ability: z.string().min(1, { message: "Please describe a magical ability" }),
  habitat: z.string().min(1, { message: "Please select a habitat" }),
})

// Form data types
type Step1Data = z.infer<typeof step1Schema>
type FormData = z.infer<typeof formSchema>

// Fixed colors list - prioritizing basic colors first
const colors = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "Brown",
  "White",
  "Black",
  "Gray",
  "Teal",
  "Gold",
  "Silver",
  "Rainbow",
  "Sparkly",
]

// Default options for dropdowns in case API fails
const defaultOptions = {
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

export default function CreatureForm({
  onStoryGenerated,
  onGenerating,
}: {
  onStoryGenerated: (details: FormData, result: StoryResult) => void
  onGenerating: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [suggestions, setSuggestions] = useState<SuggestionResult>({
    bodyParts: defaultOptions.bodyParts,
    habitats: defaultOptions.habitats,
  })

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      color: "blue",
      ability: "",
    },
  })

  // Complete form
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "blue",
      bodyPart1: "",
      bodyPart2: "",
      ability: "",
      habitat: "",
    },
  })

  // Fetch suggestions when component mounts
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setIsLoadingSuggestions(true)
        const result = await generateSuggestions()
        setSuggestions(result)
      } catch (error) {
        console.error("Failed to fetch suggestions:", error)
        // Keep using default options if fetch fails
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [])

  // Handle step 1 submission
  const onStep1Submit = (data: Step1Data) => {
    // Transfer data from step 1 to the complete form
    setValue("name", data.name)
    setValue("color", data.color)
    setValue("ability", data.ability)

    // Set default values for step 2 fields
    if (suggestions.bodyParts.length > 0) {
      setValue("bodyPart1", suggestions.bodyParts[0].toLowerCase())
    }
    if (suggestions.bodyParts.length > 1) {
      setValue("bodyPart2", suggestions.bodyParts[1].toLowerCase())
    }
    if (suggestions.habitats.length > 0) {
      setValue("habitat", suggestions.habitats[0].toLowerCase())
    }

    // Move to step 2
    setCurrentStep(2)
  }

  // Form submission handler for the complete form
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setFormError(null)
    onGenerating()

    try {
      // Ensure all form values are strings before submitting
      const safeData = {
        name: data.name || "Unnamed Creature",
        color: data.color || "blue",
        bodyPart1: data.bodyPart1 || "wings",
        bodyPart2: data.bodyPart2 || "tail",
        ability: data.ability || "magic powers",
        habitat: data.habitat || "candy forest",
      }

      console.log("Submitting data:", safeData)
      const result = await generateCreatureStory(safeData)
      console.log("Received story result:", result)
      onStoryGenerated(safeData, result)
    } catch (error) {
      console.error("Failed to generate story:", error)
      setFormError("Something went wrong creating your creature. Please try again!")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-purple-700 font-medium block">
                    Creature Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Fluffel, Sparkles, etc."
                    className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    {...step1Form.register("name")}
                  />
                  {step1Form.formState.errors.name && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Color Select */}
                <div className="space-y-2">
                  <label htmlFor="color" className="text-purple-700 font-medium block">
                    Color
                  </label>
                  <Controller
                    name="color"
                    control={step1Form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          console.log("Color selected:", value)
                          field.onChange(value)
                        }}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((color) => (
                            <SelectItem key={color} value={color.toLowerCase()}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {step1Form.formState.errors.color && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.color.message}</p>
                  )}
                </div>

                {/* Magical Ability Input */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="ability" className="text-purple-700 font-medium block">
                    Magical Ability
                  </label>
                  <Input
                    id="ability"
                    placeholder="Singing rainbows, growing flowers, etc."
                    className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    {...step1Form.register("ability")}
                  />
                  {step1Form.formState.errors.ability && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.ability.message}</p>
                  )}
                </div>
              </div>

              {/* Next Button */}
              <div className="text-center pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg text-base sm:text-lg"
                >
                  <span className="whitespace-normal">Next</span>
                  <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isLoadingSuggestions ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center px-4 py-2 font-medium text-purple-700 rounded-full bg-purple-100">
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse text-yellow-500" />
                    <span>Generating magical options...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Body Part 1 Select */}
                  <div className="space-y-2">
                    <label htmlFor="bodyPart1" className="text-purple-700 font-medium block">
                      First Body Part
                    </label>
                    <Controller
                      name="bodyPart1"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            console.log("Body part 1 selected:", value)
                            field.onChange(value)
                          }}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                            <SelectValue placeholder="Select a body part" />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestions.bodyParts.map((part) => (
                              <SelectItem key={part} value={part.toLowerCase()}>
                                {part}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.bodyPart1 && <p className="text-red-500 text-sm">{errors.bodyPart1.message}</p>}
                  </div>

                  {/* Body Part 2 Select */}
                  <div className="space-y-2">
                    <label htmlFor="bodyPart2" className="text-purple-700 font-medium block">
                      Second Body Part
                    </label>
                    <Controller
                      name="bodyPart2"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            console.log("Body part 2 selected:", value)
                            field.onChange(value)
                          }}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                            <SelectValue placeholder="Select another body part" />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestions.bodyParts.map((part) => (
                              <SelectItem key={part} value={part.toLowerCase()}>
                                {part}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.bodyPart2 && <p className="text-red-500 text-sm">{errors.bodyPart2.message}</p>}
                  </div>

                  {/* Habitat Select */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="habitat" className="text-purple-700 font-medium block">
                      Habitat
                    </label>
                    <Controller
                      name="habitat"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            console.log("Habitat selected:", value)
                            field.onChange(value)
                          }}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                            <SelectValue placeholder="Select a habitat" />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestions.habitats.map((habitat) => (
                              <SelectItem key={habitat} value={habitat.toLowerCase()}>
                                {habitat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.habitat && <p className="text-red-500 text-sm">{errors.habitat.message}</p>}
                  </div>
                </div>
              )}

              {/* Form Error Message */}
              {formError && <div className="text-red-500 text-center">{formError}</div>}

              {/* Submit Button */}
              <div className="text-center pt-4">
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-full border-purple-200 hover:bg-purple-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoadingSuggestions}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg text-base sm:text-lg"
                  >
                    <Wand2 className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-normal">Create Your Magical Creature</span>
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
