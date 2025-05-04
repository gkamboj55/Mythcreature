"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Trash2, ExternalLink, RefreshCw, BrushIcon as Broom } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type Creature = {
  id: number
  short_id: string
  created_at: string
  expires_at: string
  creature_data: {
    creatureDetails: {
      name: string
      color: string
      bodyPart1: string
      bodyPart2: string
      ability: string
      habitat: string
    }
    storyResult: {
      story: string
      imageUrl: string | null
    }
  }
}

export default function AdminPage() {
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [isCleaning, setIsCleaning] = useState(false)

  // Fetch creatures on component mount
  useEffect(() => {
    fetchCreatures()
  }, [])

  // Function to fetch creatures from the API
  const fetchCreatures = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/creatures")
      if (!response.ok) {
        throw new Error("Failed to fetch creatures")
      }
      const data = await response.json()
      setCreatures(data.creatures || [])
    } catch (error) {
      console.error("Error fetching creatures:", error)
      toast({
        title: "Error",
        description: "Failed to fetch creatures",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to delete a creature
  const deleteCreature = async (shortId: string) => {
    setIsDeleting((prev) => ({ ...prev, [shortId]: true }))
    try {
      const response = await fetch(`/api/admin/creatures/${shortId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete creature")
      }

      // Remove the deleted creature from the state
      setCreatures((prev) => prev.filter((creature) => creature.short_id !== shortId))

      toast({
        title: "Success",
        description: "Creature deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting creature:", error)
      toast({
        title: "Error",
        description: "Failed to delete creature",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [shortId]: false }))
    }
  }

  // Function to clean up expired creatures
  const cleanupExpiredCreatures = async () => {
    setIsCleaning(true)
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to clean up expired creatures")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `Cleaned up ${data.count} expired creatures`,
      })

      // Refresh the creatures list
      fetchCreatures()
    } catch (error) {
      console.error("Error cleaning up expired creatures:", error)
      toast({
        title: "Error",
        description: "Failed to clean up expired creatures",
        variant: "destructive",
      })
    } finally {
      setIsCleaning(false)
    }
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700">Creature Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={cleanupExpiredCreatures}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isCleaning}
          >
            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Broom className="h-4 w-4" />}
            Clean Expired
          </Button>
          <Button onClick={fetchCreatures} variant="outline" className="flex items-center gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="ml-2 text-lg text-purple-700">Loading creatures...</span>
        </div>
      ) : creatures.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium text-gray-600">No creatures found</h2>
          <p className="text-gray-500 mt-2">Creatures will appear here when users create them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatures.map((creature) => (
            <Card key={creature.short_id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="truncate">{creature.creature_data.creatureDetails.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">ID:</span> {creature.id}
                  </p>
                  <p>
                    <span className="font-medium">Short ID:</span> {creature.short_id}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span> {formatDate(creature.created_at)}
                  </p>
                  <p>
                    <span className="font-medium">Expires:</span> {formatDate(creature.expires_at)}
                  </p>
                  <p className="truncate">
                    <span className="font-medium">Color:</span> {creature.creature_data.creatureDetails.color}
                  </p>
                  <p className="truncate">
                    <span className="font-medium">Habitat:</span> {creature.creature_data.creatureDetails.habitat}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/?id=${creature.short_id}`, "_blank")}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCreature(creature.short_id)}
                  disabled={isDeleting[creature.short_id]}
                  className="flex items-center gap-1"
                >
                  {isDeleting[creature.short_id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
