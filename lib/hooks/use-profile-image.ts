"use client"

import { useState, useEffect } from "react"

const imageCache: Record<string, string> = {}

/*
const CACHE_VERSION = "v2"
const CACHE_KEY = `profile-image-cache-${CACHE_VERSION}`

if (typeof window !== "undefined") {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      Object.assign(imageCache, JSON.parse(cached))
    } catch (e) {
      console.error("[v0] Failed to load image cache:", e)
    }
  }
}
*/

function saveCache() {
  // if (typeof window !== "undefined") {
  //   localStorage.setItem(CACHE_KEY, JSON.stringify(imageCache))
  // }
}

export function clearProfileImageCache() {
  if (typeof window !== "undefined") {
    // localStorage.removeItem(CACHE_KEY)
    Object.keys(imageCache).forEach((key) => delete imageCache[key])
  }
}

export function useProfileImage(name: string, company: string, linkedinUrl?: string) {
  const cacheKey = `${name}-${company}`
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    /*
    if (imageCache[cacheKey]) {
      setImageUrl(imageCache[cacheKey])
      return
    }
    */

    const fetchImage = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          name,
          company,
        })
        if (linkedinUrl) {
          params.append("linkedin", linkedinUrl)
        }

        params.append("t", Date.now().toString())

        const response = await fetch(`/api/scout/profile-image?${params}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        const data = await response.json()

        if (data.imageUrl) {
          imageCache[cacheKey] = data.imageUrl
          saveCache()
          setImageUrl(data.imageUrl)
        } else {
          console.log("[v0] No image URL returned for", name, "- fallback will be used")
          setImageUrl(undefined)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch profile image:", error)
        setImageUrl(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImage()
  }, [name, company, linkedinUrl, cacheKey])

  return { imageUrl, isLoading }
}
