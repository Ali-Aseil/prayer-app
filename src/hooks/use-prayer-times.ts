"use client"

import { useState, useEffect } from "react"
import type { PrayerTimesData, CalculationMethodId, AsrSchool } from "@/types/prayer"
import { fetchPrayerTimesByCity } from "@/lib/api"
import type { CitySelection } from "./use-city"

interface UsePrayerTimesResult {
  prayerTimes: PrayerTimesData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function usePrayerTimes(
  city: CitySelection | null,
  method: CalculationMethodId = 3,
  school: AsrSchool = 0
): UsePrayerTimesResult {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrayerTimes = async () => {
    if (!city) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPrayerTimesByCity(
        city.city,
        city.country,
        new Date(),
        method,
        school
      )

      data.city = city.city
      data.country = city.country

      setPrayerTimes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prayer times")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrayerTimes()
  }, [city?.city, city?.country, method, school])

  return {
    prayerTimes,
    isLoading,
    error,
    refetch: fetchPrayerTimes,
  }
}
