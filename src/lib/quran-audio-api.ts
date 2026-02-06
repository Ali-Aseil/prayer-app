import type { Reciter, RecitersResponse, SurahAudioResponse } from "@/types/quran-audio"

const QURAN_AUDIO_BASE_URL = "https://quranapi.pages.dev/api"

// Arabic names for the 5 reciters
const RECITER_ARABIC_NAMES: Record<string, string> = {
  "1": "مشاري راشد العفاسي",
  "2": "أبو بكر الشاطري",
  "3": "ناصر القطامي",
  "4": "ياسر الدوسري",
  "5": "هاني الرفاعي",
}

// Simple in-memory cache for client-side
let recitersCache: Reciter[] | null = null
let audioCache: Map<number, SurahAudioResponse> = new Map()

/**
 * Fetch all available reciters
 * Caches result in memory for the session
 */
export async function fetchReciters(): Promise<Reciter[]> {
  // Return cached if available
  if (recitersCache) {
    return recitersCache
  }

  const response = await fetch(`${QURAN_AUDIO_BASE_URL}/reciters.json`, {
    cache: "force-cache",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.status}`)
  }

  const data: RecitersResponse = await response.json()

  // Map to Reciter objects with Arabic names
  recitersCache = Object.entries(data).map(([id, name]) => ({
    id,
    name,
    nameArabic: RECITER_ARABIC_NAMES[id] || name,
  }))

  return recitersCache
}

/**
 * Fetch audio URLs for a surah (all reciters)
 * Caches result in memory for the session
 */
export async function fetchSurahAudio(surahNumber: number): Promise<SurahAudioResponse> {
  // Return cached if available
  const cached = audioCache.get(surahNumber)
  if (cached) {
    return cached
  }

  const response = await fetch(`${QURAN_AUDIO_BASE_URL}/audio/${surahNumber}.json`, {
    cache: "force-cache",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`)
  }

  const data = await response.json()
  audioCache.set(surahNumber, data)

  return data
}

/**
 * Get audio URL for a specific reciter and surah
 * Prefers originalUrl (mp3quran.net) as recommended by API docs
 */
export async function getAudioUrl(surahNumber: number, reciterId: string): Promise<string | null> {
  try {
    const audioData = await fetchSurahAudio(surahNumber)
    const reciterAudio = audioData[reciterId]

    if (!reciterAudio) {
      return null
    }

    // Prefer originalUrl as recommended
    return reciterAudio.originalUrl || reciterAudio.url
  } catch {
    return null
  }
}
