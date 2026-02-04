/**
 * PrayTimes.js - Offline Prayer Times Calculator
 * Based on the algorithms from praytimes.org
 *
 * This provides a client-side fallback when the AlAdhan API is unavailable
 */

import type { PrayerTime, PrayerTimesData } from "@/types/prayer"

/** Offline calculation method names (subset used as fallback) */
type OfflineMethod = "MWL" | "ISNA" | "Egypt" | "Makkah" | "Karachi" | "Tehran" | "Jafari"

// Calculation methods configuration
const METHODS: Record<OfflineMethod, { fajrAngle: number; ishaAngle: number; maghribMinutes: number }> = {
  MWL: { fajrAngle: 18, ishaAngle: 17, maghribMinutes: 0 },
  ISNA: { fajrAngle: 15, ishaAngle: 15, maghribMinutes: 0 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5, maghribMinutes: 0 },
  Makkah: { fajrAngle: 18.5, ishaAngle: 0, maghribMinutes: 90 }, // Isha is 90 mins after Maghrib
  Karachi: { fajrAngle: 18, ishaAngle: 18, maghribMinutes: 0 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribMinutes: 0 },
  Jafari: { fajrAngle: 16, ishaAngle: 14, maghribMinutes: 0 },
}

// Helper functions
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

function fixHour(hour: number): number {
  return ((hour % 24) + 24) % 24
}

function sunDeclination(julianDate: number): number {
  const T = (julianDate - 2451545) / 36525
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T

  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRadians(M)) +
            (0.019993 - 0.000101 * T) * Math.sin(toRadians(2 * M)) +
            0.000289 * Math.sin(toRadians(3 * M))

  const sunLong = L0 + C
  const omega = 125.04 - 1934.136 * T
  const lambda = sunLong - 0.00569 - 0.00478 * Math.sin(toRadians(omega))
  const obliquity = 23.439 - 0.00000036 * (julianDate - 2451545)

  return toDegrees(Math.asin(Math.sin(toRadians(obliquity)) * Math.sin(toRadians(lambda))))
}

function equationOfTime(julianDate: number): number {
  const T = (julianDate - 2451545) / 36525
  const L0 = 280.46646 + 36000.76983 * T
  const M = 357.52911 + 35999.05029 * T
  const e = 0.016708634 - 0.000042037 * T

  const y = Math.tan(toRadians(23.439 - 0.00000036 * (julianDate - 2451545)) / 2) ** 2

  const eqTime = y * Math.sin(toRadians(2 * L0)) -
                 2 * e * Math.sin(toRadians(M)) +
                 4 * e * y * Math.sin(toRadians(M)) * Math.cos(toRadians(2 * L0)) -
                 0.5 * y * y * Math.sin(toRadians(4 * L0)) -
                 1.25 * e * e * Math.sin(toRadians(2 * M))

  return toDegrees(eqTime) * 4 // Convert to minutes
}

function sunAngleTime(angle: number, time: number, latitude: number, declination: number, direction: "ccw" | "cw"): number {
  const D = declination
  const T = (1 / 15) * toDegrees(Math.acos(
    (-Math.sin(toRadians(angle)) - Math.sin(toRadians(latitude)) * Math.sin(toRadians(D))) /
    (Math.cos(toRadians(latitude)) * Math.cos(toRadians(D)))
  ))

  return time + (direction === "ccw" ? -T : T)
}

function midDay(time: number, eqTime: number, longitude: number, timezone: number): number {
  return fixHour(12 - eqTime / 60 - longitude / 15 + timezone)
}

function asrTime(factor: number, time: number, latitude: number, declination: number): number {
  const D = declination
  const A = toDegrees(Math.atan(1 / (factor + Math.tan(toRadians(Math.abs(latitude - D))))))
  return sunAngleTime(A, time, latitude, declination, "cw")
}

function dateToJulian(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)

  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
}

function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/**
 * Calculate prayer times for a given date and location
 */
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number,
  method: string = "MWL"
): PrayerTimesData {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const jd = dateToJulian(year, month, day)
  const config = METHODS[method as OfflineMethod] || METHODS.MWL

  const declination = sunDeclination(jd)
  const eqTime = equationOfTime(jd)

  // Calculate prayer times
  const noon = midDay(12, eqTime, longitude, timezone)
  const fajr = sunAngleTime(config.fajrAngle, noon, latitude, declination, "ccw")
  const sunrise = sunAngleTime(0.833, noon, latitude, declination, "ccw") // 0.833 accounts for refraction and sun radius
  const dhuhr = noon + 0.0167 // Add 1 minute for safety margin
  const asr = asrTime(1, noon, latitude, declination) // Standard Asr (shadow = object length)
  const maghrib = sunAngleTime(0.833, noon, latitude, declination, "cw")

  let isha: number
  if (config.maghribMinutes > 0) {
    isha = maghrib + config.maghribMinutes / 60
  } else {
    isha = sunAngleTime(config.ishaAngle, noon, latitude, declination, "cw")
  }

  const prayers: PrayerTime[] = [
    { name: "fajr", nameArabic: "الفجر", nameEnglish: "Fajr", time: formatTime(fajr), timestamp: fajr },
    { name: "sunrise", nameArabic: "الشروق", nameEnglish: "Sunrise", time: formatTime(sunrise), timestamp: sunrise },
    { name: "dhuhr", nameArabic: "الظهر", nameEnglish: "Dhuhr", time: formatTime(dhuhr), timestamp: dhuhr },
    { name: "asr", nameArabic: "العصر", nameEnglish: "Asr", time: formatTime(asr), timestamp: asr },
    { name: "maghrib", nameArabic: "المغرب", nameEnglish: "Maghrib", time: formatTime(maghrib), timestamp: maghrib },
    { name: "isha", nameArabic: "العشاء", nameEnglish: "Isha", time: formatTime(isha), timestamp: isha },
  ]

  return {
    date: date.toISOString().split("T")[0],
    hijriDate: "",
    hijriDay: "",
    hijriMonth: "",
    hijriYear: "",
    city: "",
    country: "",
    latitude,
    longitude,
    timezone: `UTC${timezone >= 0 ? "+" : ""}${timezone}`,
    method,
    prayers,
  }
}

/**
 * Calculate Qibla direction from a given location
 * Returns bearing in degrees from North (clockwise)
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const meccaLat = 21.4225
  const meccaLng = 39.8262

  const latRad = toRadians(latitude)
  const lngRad = toRadians(longitude)
  const meccaLatRad = toRadians(meccaLat)
  const meccaLngRad = toRadians(meccaLng)

  const y = Math.sin(meccaLngRad - lngRad)
  const x = Math.cos(latRad) * Math.tan(meccaLatRad) - Math.sin(latRad) * Math.cos(meccaLngRad - lngRad)

  let qibla = toDegrees(Math.atan2(y, x))

  // Normalize to 0-360
  qibla = ((qibla % 360) + 360) % 360

  return qibla
}

/**
 * Calculate distance to Mecca in kilometers
 */
export function calculateDistanceToMecca(latitude: number, longitude: number): number {
  const meccaLat = 21.4225
  const meccaLng = 39.8262
  const R = 6371 // Earth's radius in km

  const dLat = toRadians(meccaLat - latitude)
  const dLng = toRadians(meccaLng - longitude)

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(latitude)) * Math.cos(toRadians(meccaLat)) *
            Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
