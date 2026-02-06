export interface Reciter {
  id: string
  name: string
  nameArabic: string
}

export interface SurahAudio {
  reciter: string
  url: string
  originalUrl: string
}

export type RecitersResponse = Record<string, string>

export type SurahAudioResponse = Record<string, SurahAudio>

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error"
