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

// Get existing device ID or create a new one
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""

  // Try to get existing device ID
  let deviceId = localStorage.getItem("magical_creature_device_id")

  // If no device ID exists, create one
  if (!deviceId) {
    deviceId = `device_${generateRandomId(12)}`
    localStorage.setItem("magical_creature_device_id", deviceId)
  }

  return deviceId
}

// Check if device ID exists
export function hasDeviceId(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("magical_creature_device_id")
}
