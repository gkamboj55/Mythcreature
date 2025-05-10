"use client"

import { useState, useEffect } from "react"

type Orientation = "portrait" | "landscape"

export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(
    typeof window !== "undefined" ? (window.innerWidth > window.innerHeight ? "landscape" : "portrait") : "portrait",
  )

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait")
    }

    window.addEventListener("resize", handleResize)

    // Some mobile browsers also support orientationchange
    window.addEventListener("orientationchange", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  return orientation
}
