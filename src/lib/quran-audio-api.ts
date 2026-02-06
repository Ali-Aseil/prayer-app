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

/**
 * Fetch all available reciters
 * Cache for 24 hours (reciters list rarely changes)
 */
export async function fetchReciters(): Promise<Reciter[]> {
  const response = await fetch(`${QURAN_AUDIO_BASE_URL}/reciters.json`, {
    next: { revalidate: 86400 }, // 24 hours ISR
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.status}`)
  }

  const data: RecitersResponse = await response.json()

  // Map to Reciter objects with Arabic names
  return Object.entries(data).map(([id, name]) => ({
    id,
    name,
    nameArabic: RECITER_ARABIC_NAMES[id] || name,
  }))
}

/**
 * Fetch audio URLs for a surah (all reciters)
 * Cache for 24 hours
 */
export async function fetchSurahAudio(surahNumber: number): Promise<SurahAudioResponse> {
  const response = await fetch(`${QURAN_AUDIO_BASE_URL}/audio/${surahNumber}.json`, {
    next: { revalidate: 86400 }, // 24 hours ISR
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`)
  }

  return response.json()
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
