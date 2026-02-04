"use client"

import { useState, useEffect, useCallback } from "react"
import type { Location } from "@/types/prayer"
import { reverseGeocode } from "@/lib/api"

interface UseLocationResult {
  location: Location | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

const STORAGE_KEY = "prayer-app-location"

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Location
        setLocation(parsed)
        setIsLoading(false)
        return
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    // Request geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Get city name
        const geo = await reverseGeocode(latitude, longitude)

        const newLocation: Location = {
          latitude,
          longitude,
          city: geo?.city || undefined,
          country: geo?.country || undefined,
        }

        setLocation(newLocation)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation))
        setIsLoading(false)
      },
      (err) => {
        let errorMessage = "Unable to get your location"

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access."
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case err.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        setError(errorMessage)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }, [])

  const refresh = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    fetchLocation()
  }, [fetchLocation])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  return { location, isLoading, error, refresh }
}
