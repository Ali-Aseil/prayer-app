"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Reciter, PlaybackState } from "@/types/quran-audio"
import { fetchReciters, fetchSurahAudio } from "@/lib/quran-audio-api"

const STORAGE_KEY = "prayer-app-reciter"

interface UseQuranAudioResult {
  // Reciters
  reciters: Reciter[]
  selectedReciter: Reciter | null
  setSelectedReciter: (reciter: Reciter) => void
  isLoadingReciters: boolean

  // Playback
  isPlaying: boolean
  playbackState: PlaybackState
  currentTime: number
  duration: number

  // Controls
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void

  // Audio
  audioUrl: string | null
  isLoadingAudio: boolean
  error: string | null
}

export function useQuranAudio(surahNumber: number): UseQuranAudioResult {
  // Reciters state
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [selectedReciter, setSelectedReciterState] = useState<Reciter | null>(null)
  const [isLoadingReciters, setIsLoadingReciters] = useState(true)

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current

    const handleLoadStart = () => {
      setPlaybackState("loading")
      setError(null)
    }

    const handleCanPlay = () => {
      if (playbackState === "loading") {
        setPlaybackState("paused")
      }
    }

    const handlePlay = () => setPlaybackState("playing")
    const handlePause = () => setPlaybackState("paused")
    const handleEnded = () => {
      setPlaybackState("paused")
      setCurrentTime(0)
    }

    const handleError = () => {
      let message = "Failed to load audio"
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            message = "Network error. Check your connection."
            break
          case MediaError.MEDIA_ERR_DECODE:
            message = "Audio format not supported."
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = "Audio source not available."
            break
        }
      }
      setError(message)
      setPlaybackState("error")
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)

    return () => {
      audio.pause()
      audio.src = ""
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
    }
  }, [])

  // Fetch reciters on mount
  useEffect(() => {
    const loadReciters = async () => {
      try {
        setIsLoadingReciters(true)
        const data = await fetchReciters()
        setReciters(data)

        // Load saved reciter preference
        const savedReciterId = localStorage.getItem(STORAGE_KEY)
        if (savedReciterId) {
          const savedReciter = data.find((r) => r.id === savedReciterId)
          if (savedReciter) {
            setSelectedReciterState(savedReciter)
            return
          }
        }

        // Default to first reciter
        if (data.length > 0) {
          setSelectedReciterState(data[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reciters")
      } finally {
        setIsLoadingReciters(false)
      }
    }

    loadReciters()
  }, [])

  // Fetch audio URL when surah or reciter changes
  useEffect(() => {
    const loadAudio = async () => {
      if (!selectedReciter) return

      try {
        setIsLoadingAudio(true)
        setError(null)

        const audioData = await fetchSurahAudio(surahNumber)
        const reciterAudio = audioData[selectedReciter.id]

        if (reciterAudio) {
          // Prefer originalUrl as recommended by API
          const url = reciterAudio.originalUrl || reciterAudio.url
          setAudioUrl(url)

          // Update audio element source
          if (audioRef.current) {
            const wasPlaying = playbackState === "playing"
            audioRef.current.src = url
            audioRef.current.load()

            if (wasPlaying) {
              audioRef.current.play().catch(console.error)
            }
          }
        } else {
          setAudioUrl(null)
          setError("Audio not available for this reciter")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audio")
        setAudioUrl(null)
      } finally {
        setIsLoadingAudio(false)
      }
    }

    loadAudio()
  }, [surahNumber, selectedReciter?.id])

  // Set selected reciter and persist
  const setSelectedReciter = useCallback((reciter: Reciter) => {
    setSelectedReciterState(reciter)
    localStorage.setItem(STORAGE_KEY, reciter.id)
  }, [])

  // Playback controls
  const play = useCallback(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch((err) => {
        console.error("Play failed:", err)
        setError("Unable to play audio. Try tapping play again.")
      })
    }
  }, [audioUrl])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (playbackState === "playing") {
      pause()
    } else {
      play()
    }
  }, [playbackState, play, pause])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  return {
    // Reciters
    reciters,
    selectedReciter,
    setSelectedReciter,
    isLoadingReciters,

    // Playback
    isPlaying: playbackState === "playing",
    playbackState,
    currentTime,
    duration,

    // Controls
    play,
    pause,
    toggle,
    seek,

    // Audio
    audioUrl,
    isLoadingAudio,
    error,
  }
}
