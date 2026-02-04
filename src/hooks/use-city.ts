"use client"

import { useState, useEffect, useCallback } from "react"

export interface CitySelection {
  city: string
  country: string
}

interface UseCityResult {
  selectedCity: CitySelection | null
  setCity: (city: CitySelection) => void
  clearCity: () => void
  isLoaded: boolean
}

const STORAGE_KEY = "prayer-app-city"
const DEFAULT_CITY: CitySelection = { city: "Jaipur", country: "India" }

export function useCity(): UseCityResult {
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSelectedCity(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        setSelectedCity(DEFAULT_CITY)
      }
    } else {
      setSelectedCity(DEFAULT_CITY)
    }
    setIsLoaded(true)
  }, [])

  const setCity = useCallback((city: CitySelection) => {
    setSelectedCity(city)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city))
  }, [])

  const clearCity = useCallback(() => {
    setSelectedCity(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { selectedCity, setCity, clearCity, isLoaded }
}
