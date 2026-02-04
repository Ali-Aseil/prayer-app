/**
 * AlAdhan Prayer Times API Integration
 * API Docs: https://aladhan.com/prayer-times-api
 * Base URL: https://api.aladhan.com/v1
 *
 * Endpoints used:
 *   GET /timings/{date}         - Prayer times by coordinates
 *   GET /timingsByCity/{date}   - Prayer times by city name
 *   GET /calendar/{year}/{month} - Monthly calendar
 *   GET /qibla/{lat}/{lng}      - Qibla direction
 *   GET /methods                 - Available calculation methods
 *
 * Rate limit: 14 requests/second (no API key required)
 */

import type {
  PrayerTimesData,
  CalculationMethodId,
  AsrSchool,
  LatitudeAdjustmentMethod,
} from "@/types/prayer"
import { calculatePrayerTimes } from "./prayer-times"

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1"

// ─── AlAdhan Response Types ─────────────────────────────────────────────────

interface AlAdhanTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
  Firstthird: string
  Lastthird: string
}

interface AlAdhanHijriDate {
  date: string
  format: string
  day: string
  weekday: { en: string; ar: string }
  month: { number: number; en: string; ar: string; days: number }
  year: string
  designation: { abbreviated: string; expanded: string }
  holidays: string[]
}

interface AlAdhanGregorianDate {
  date: string
  format: string
  day: string
  weekday: { en: string }
  month: { number: number; en: string }
  year: string
  designation: { abbreviated: string; expanded: string }
}

interface AlAdhanMeta {
  latitude: number
  longitude: number
  timezone: string
  method: {
    id: number
    name: string
    params: Record<string, number | string>
  }
  latitudeAdjustmentMethod: string
  midnightMode: string
  school: string
  offset: Record<string, number>
}

interface AlAdhanResponse {
  code: number
  status: string
  data: {
    timings: AlAdhanTimings
    date: {
      readable: string
      timestamp: string
      hijri: AlAdhanHijriDate
      gregorian: AlAdhanGregorianDate
    }
    meta: AlAdhanMeta
  }
}

interface AlAdhanCalendarResponse {
  code: number
  status: string
  data: AlAdhanResponse["data"][]
}

interface AlAdhanQiblaResponse {
  code: number
  status: string
  data: {
    latitude: number
    longitude: number
    direction: number
  }
}

// ─── API Parameters ─────────────────────────────────────────────────────────

interface TimingsParams {
  latitude: number
  longitude: number
  method?: CalculationMethodId
  school?: AsrSchool
  tune?: string
  latitudeAdjustmentMethod?: LatitudeAdjustmentMethod
  midnightMode?: 0 | 1 // 0 = Standard, 1 = Jafari
  adjustment?: number // Hijri date adjustment (-2 to +2)
  methodSettings?: string // Custom: FajrAngle,MaghribAngleOrMins,IshaAngleOrMins
  shafaq?: "general" | "ahmer" | "abyad" // Required for method 15
}

// ─── Helper: Build Query String ─────────────────────────────────────────────

function buildQueryParams(params: TimingsParams): string {
  const query = new URLSearchParams()

  query.set("latitude", params.latitude.toString())
  query.set("longitude", params.longitude.toString())

  if (params.method !== undefined) query.set("method", params.method.toString())
  if (params.school !== undefined) query.set("school", params.school.toString())
  if (params.tune) query.set("tune", params.tune)
  if (params.latitudeAdjustmentMethod) query.set("latitudeAdjustmentMethod", params.latitudeAdjustmentMethod)
  if (params.midnightMode !== undefined) query.set("midnightMode", params.midnightMode.toString())
  if (params.adjustment !== undefined) query.set("adjustment", params.adjustment.toString())
  if (params.methodSettings) query.set("methodSettings", params.methodSettings)
  if (params.shafaq) query.set("shafaq", params.shafaq)

  return query.toString()
}

// ─── Helper: Parse AlAdhan Response ─────────────────────────────────────────

function parseTimingsResponse(data: AlAdhanResponse["data"]): PrayerTimesData {
  const { timings, date, meta } = data

  return {
    date: date.gregorian.date,
    hijriDate: `${date.hijri.day} ${date.hijri.month.ar} ${date.hijri.year}`,
    hijriDay: date.hijri.day,
    hijriMonth: date.hijri.month.ar,
    hijriYear: date.hijri.year,
    city: "",
    country: "",
    latitude: meta.latitude,
    longitude: meta.longitude,
    timezone: meta.timezone,
    method: meta.method.name,
    prayers: [
      { name: "fajr", nameArabic: "الفجر", nameEnglish: "Fajr", time: cleanTime(timings.Fajr), timestamp: 0 },
      { name: "sunrise", nameArabic: "الشروق", nameEnglish: "Sunrise", time: cleanTime(timings.Sunrise), timestamp: 0 },
      { name: "dhuhr", nameArabic: "الظهر", nameEnglish: "Dhuhr", time: cleanTime(timings.Dhuhr), timestamp: 0 },
      { name: "asr", nameArabic: "العصر", nameEnglish: "Asr", time: cleanTime(timings.Asr), timestamp: 0 },
      { name: "maghrib", nameArabic: "المغرب", nameEnglish: "Maghrib", time: cleanTime(timings.Maghrib), timestamp: 0 },
      { name: "isha", nameArabic: "العشاء", nameEnglish: "Isha", time: cleanTime(timings.Isha), timestamp: 0 },
    ],
    imsak: cleanTime(timings.Imsak),
    sunset: cleanTime(timings.Sunset),
    midnight: cleanTime(timings.Midnight),
    firstThird: cleanTime(timings.Firstthird),
    lastThird: cleanTime(timings.Lastthird),
  }
}

/**
 * AlAdhan sometimes returns times with timezone suffix like "05:14 (EAT)"
 * This strips everything after the time
 */
function cleanTime(time: string): string {
  return time.replace(/\s*\(.*\)$/, "").trim()
}

// ─── API: Get Prayer Times by Coordinates ───────────────────────────────────

/**
 * GET /v1/timings/{date}
 * Fetch prayer times for a specific date and location
 */
export async function fetchPrayerTimesFromAPI(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: CalculationMethodId = 3,
  school: AsrSchool = 0,
  tune?: string
): Promise<PrayerTimesData> {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const dateStr = `${day}-${month}-${year}`

  const params = buildQueryParams({
    latitude,
    longitude,
    method,
    school,
    tune,
  })

  const url = `${ALADHAN_BASE_URL}/timings/${dateStr}?${params}`

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // ISR: Cache for 24 hours
  })

  if (!response.ok) {
    throw new Error(`AlAdhan API error: ${response.status}`)
  }

  const data: AlAdhanResponse = await response.json()

  if (data.code !== 200) {
    throw new Error(`AlAdhan API error: ${data.status}`)
  }

  return parseTimingsResponse(data.data)
}

// ─── API: Get Prayer Times by City ──────────────────────────────────────────

/**
 * GET /v1/timingsByCity/{date}
 * Fetch prayer times using city and country names (auto-geocoded)
 */
export async function fetchPrayerTimesByCity(
  city: string,
  country: string,
  date: Date = new Date(),
  method: CalculationMethodId = 3,
  school: AsrSchool = 0
): Promise<PrayerTimesData> {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const dateStr = `${day}-${month}-${year}`

  const params = new URLSearchParams({
    city,
    country,
    method: method.toString(),
    school: school.toString(),
  })

  const url = `${ALADHAN_BASE_URL}/timingsByCity/${dateStr}?${params}`

  const response = await fetch(url, {
    next: { revalidate: 86400 },
  })

  if (!response.ok) {
    throw new Error(`AlAdhan API error: ${response.status}`)
  }

  const data: AlAdhanResponse = await response.json()

  if (data.code !== 200) {
    throw new Error(`AlAdhan API error: ${data.status}`)
  }

  const result = parseTimingsResponse(data.data)
  result.city = city
  result.country = country
  return result
}

// ─── API: Get Monthly Calendar ──────────────────────────────────────────────

/**
 * GET /v1/calendar/{year}/{month}
 * Fetch prayer times for an entire month
 */
export async function fetchMonthlyCalendar(
  latitude: number,
  longitude: number,
  year: number,
  month: number,
  method: CalculationMethodId = 3,
  school: AsrSchool = 0
): Promise<PrayerTimesData[]> {
  const params = buildQueryParams({ latitude, longitude, method, school })

  const url = `${ALADHAN_BASE_URL}/calendar/${year}/${month}?${params}`

  const response = await fetch(url, {
    next: { revalidate: 86400 },
  })

  if (!response.ok) {
    throw new Error(`AlAdhan API error: ${response.status}`)
  }

  const data: AlAdhanCalendarResponse = await response.json()

  if (data.code !== 200) {
    throw new Error(`AlAdhan API error: ${data.status}`)
  }

  return data.data.map(parseTimingsResponse)
}

// ─── API: Get Qibla Direction ───────────────────────────────────────────────

/**
 * GET /v1/qibla/{latitude}/{longitude}
 * Get Qibla direction from AlAdhan API
 */
export async function fetchQiblaDirection(
  latitude: number,
  longitude: number
): Promise<number> {
  const url = `${ALADHAN_BASE_URL}/qibla/${latitude}/${longitude}`

  const response = await fetch(url, {
    next: { revalidate: 604800 }, // Cache for 7 days (Qibla doesn't change)
  })

  if (!response.ok) {
    throw new Error(`AlAdhan Qibla API error: ${response.status}`)
  }

  const data: AlAdhanQiblaResponse = await response.json()

  if (data.code !== 200) {
    throw new Error(`AlAdhan Qibla API error: ${data.status}`)
  }

  return data.data.direction
}

// ─── Fallback: Get Prayer Times with Offline Calculation ────────────────────

/**
 * Get prayer times with fallback to client-side calculation
 * Tries AlAdhan API first, falls back to PrayTimes.js offline engine
 */
export async function getPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: CalculationMethodId = 3,
  school: AsrSchool = 0
): Promise<PrayerTimesData> {
  try {
    return await fetchPrayerTimesFromAPI(latitude, longitude, date, method, school)
  } catch (error) {
    console.warn("AlAdhan API failed, using client-side calculation:", error)

    // Map method ID back to offline calculation method name
    const methodName = METHOD_ID_TO_OFFLINE.get(method) ?? "MWL"
    const timezoneOffset = -date.getTimezoneOffset() / 60

    return calculatePrayerTimes(date, latitude, longitude, timezoneOffset, methodName)
  }
}

// Map API method IDs to offline calculation method names
const METHOD_ID_TO_OFFLINE = new Map<number, string>([
  [0, "Jafari"],
  [1, "Karachi"],
  [2, "ISNA"],
  [3, "MWL"],
  [4, "Makkah"],
  [5, "Egypt"],
  [7, "Tehran"],
])

// ─── Geocoding ──────────────────────────────────────────────────────────────

/**
 * Reverse geocode coordinates to city/country name
 * Uses OpenStreetMap Nominatim (free, no API key)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          "User-Agent": "PrayerApp/1.0",
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    return {
      city: data.address?.city || data.address?.town || data.address?.village || "",
      country: data.address?.country || "",
    }
  } catch {
    return null
  }
}
