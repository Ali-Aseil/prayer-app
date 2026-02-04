"use client"

import { useState, useEffect, useCallback } from "react"

interface CountdownResult {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  progress: number // 0-100, percentage elapsed between previous and next prayer
  isExpired: boolean
}

/**
 * Parses a time string in "HH:MM" format to minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Gets the current time as minutes since midnight (with fractional seconds).
 */
function getCurrentTimeSeconds(): number {
  const now = new Date()
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
}

/**
 * useCountdown - counts down to a target time (HH:MM format)
 * @param targetTime - Target time in "HH:MM" format
 * @param previousTime - Previous prayer time in "HH:MM" format (for progress calculation)
 */
export function useCountdown(targetTime: string | null, previousTime: string | null): CountdownResult {
  const calculateCountdown = useCallback((): CountdownResult => {
    if (!targetTime) {
      return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, progress: 0, isExpired: false }
    }

    const nowSeconds = getCurrentTimeSeconds()
    const targetMinutes = parseTimeToMinutes(targetTime)
    const targetSeconds = targetMinutes * 60

    // Calculate seconds remaining until target
    let diffSeconds = targetSeconds - nowSeconds

    // Handle midnight rollover: if target is before now, it's tomorrow
    if (diffSeconds < 0) {
      diffSeconds += 24 * 3600 // add 24 hours
    }

    const isExpired = diffSeconds <= 0

    const hours = Math.floor(diffSeconds / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    const seconds = diffSeconds % 60

    // Calculate progress percentage
    let progress = 0
    if (previousTime) {
      const previousMinutes = parseTimeToMinutes(previousTime)
      const previousSeconds = previousMinutes * 60

      // Total interval between previous prayer and next prayer
      let totalInterval = targetSeconds - previousSeconds
      if (totalInterval <= 0) {
        totalInterval += 24 * 3600 // handle midnight rollover
      }

      // Elapsed time since previous prayer
      let elapsed = nowSeconds - previousSeconds
      if (elapsed < 0) {
        elapsed += 24 * 3600 // handle midnight rollover
      }

      // Clamp progress between 0 and 100
      progress = Math.min(100, Math.max(0, (elapsed / totalInterval) * 100))
    }

    return {
      hours,
      minutes,
      seconds,
      totalSeconds: diffSeconds,
      progress,
      isExpired,
    }
  }, [targetTime, previousTime])

  const [countdown, setCountdown] = useState<CountdownResult>(calculateCountdown)

  useEffect(() => {
    // Recalculate immediately when target/previous changes
    setCountdown(calculateCountdown())

    // Update every second using setInterval
    const interval = setInterval(() => {
      setCountdown(calculateCountdown())
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateCountdown])

  return countdown
}
