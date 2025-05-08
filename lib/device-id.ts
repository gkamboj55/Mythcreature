/**
 * Device ID utility for identifying users across sessions without login
 */

// Generate a random ID with specified length
function generateRandomId(length = 16): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  const charactersLength = characters.length

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

/**
 * Get existing device ID or create a new one
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    console.error("[CLIENT] Attempted to get device ID on server side")
    return ""
  }

  try {
    // Try to get existing device ID
    let deviceId = localStorage.getItem("magical_creature_device_id")
    console.log("[CLIENT] Retrieved device ID from localStorage:", deviceId)

    // If no device ID exists, create one
    if (!deviceId) {
      deviceId = `device_${generateRandomId(12)}`
      console.log("[CLIENT] Created new device ID:", deviceId)
      localStorage.setItem("magical_creature_device_id", deviceId)
    }

    return deviceId
  } catch (error) {
    console.error("[CLIENT] Error getting or creating device ID:", error)
    // Fallback to a temporary ID if localStorage is not available
    return `temp_${generateRandomId(12)}`
  }
}

/**
 * Check if device ID exists
 */
export function hasDeviceId(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("magical_creature_device_id")
}
