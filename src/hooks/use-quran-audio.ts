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
  const playbackStateRef = useRef<PlaybackState>("idle")

  // Keep ref in sync with state
  useEffect(() => {
    playbackStateRef.current = playbackState
  }, [playbackState])

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current

    // Preload metadata for faster response
    audio.preload = "metadata"
    // Ensure volume is set
    audio.volume = 1.0
    audio.muted = false

    const handleLoadStart = () => {
      console.log("[Audio] Load started")
      setPlaybackState("loading")
      setError(null)
    }

    const handleCanPlay = () => {
      console.log("[Audio] Can play")
      // Use functional update to avoid stale closure - only change from loading to paused
      setPlaybackState(prev => {
        console.log("[Audio] canplay: prev state was", prev)
        return prev === "loading" ? "paused" : prev
      })
    }

    const handlePlay = () => {
      console.log("[Audio] Playing")
      setPlaybackState("playing")
    }

    const handlePause = () => {
      console.log("[Audio] Paused")
      setPlaybackState("paused")
    }

    const handleEnded = () => {
      console.log("[Audio] Ended")
      setPlaybackState("paused")
      setCurrentTime(0)
    }

    const handleError = () => {
      console.error("[Audio] Error:", audio.error)
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
    const handleDurationChange = () => {
      console.log("[Audio] Duration:", audio.duration)
      setDuration(audio.duration || 0)
    }

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
        console.log("[Audio] Loading reciters...")
        const data = await fetchReciters()
        console.log("[Audio] Reciters loaded:", data)
        setReciters(data)

        // Load saved reciter preference
        const savedReciterId = localStorage.getItem(STORAGE_KEY)
        console.log("[Audio] Saved reciter ID:", savedReciterId)
        if (savedReciterId) {
          const savedReciter = data.find((r) => r.id === savedReciterId)
          if (savedReciter) {
            console.log("[Audio] Using saved reciter:", savedReciter.name)
            setSelectedReciterState(savedReciter)
            return
          }
        }

        // Default to first reciter
        if (data.length > 0) {
          console.log("[Audio] Using default reciter:", data[0].name)
          setSelectedReciterState(data[0])
        }
      } catch (err) {
        console.error("[Audio] Error loading reciters:", err)
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
      if (!selectedReciter) {
        console.log("[Audio] No reciter selected")
        return
      }

      try {
        setIsLoadingAudio(true)
        setError(null)

        console.log(`[Audio] Fetching audio for surah ${surahNumber}, reciter ${selectedReciter.id}`)
        const audioData = await fetchSurahAudio(surahNumber)
        console.log("[Audio] Audio data received:", audioData)

        const reciterAudio = audioData[selectedReciter.id]

        if (reciterAudio) {
          // Prefer originalUrl as recommended by API
          const url = reciterAudio.originalUrl || reciterAudio.url
          console.log("[Audio] Audio URL:", url)
          setAudioUrl(url)

          // Update audio element source
          if (audioRef.current) {
            const wasPlaying = playbackStateRef.current === "playing"
            console.log("[Audio] Setting audio src, wasPlaying:", wasPlaying)
            audioRef.current.src = url
            audioRef.current.load()

            if (wasPlaying) {
              audioRef.current.play().catch(console.error)
            }
          }
        } else {
          console.warn("[Audio] No audio found for reciter:", selectedReciter.id)
          setAudioUrl(null)
          setError("Audio not available for this reciter")
        }
      } catch (err) {
        console.error("[Audio] Error loading audio:", err)
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
    const audio = audioRef.current
    console.log("[Audio] Play requested")
    console.log("[Audio] audioUrl:", audioUrl)
    console.log("[Audio] audioRef exists:", !!audio)
    console.log("[Audio] readyState:", audio?.readyState)
    console.log("[Audio] currentSrc:", audio?.src)
    console.log("[Audio] paused:", audio?.paused)
    console.log("[Audio] volume:", audio?.volume)
    console.log("[Audio] muted:", audio?.muted)

    if (!audio || !audioUrl) {
      console.warn("[Audio] Cannot play - missing audioRef or audioUrl")
      return
    }

    // Ensure volume is set
    audio.volume = 1.0
    audio.muted = false

    // Ensure the audio source is set and matches
    const currentSrc = audio.src
    const urlMatches = currentSrc === audioUrl || currentSrc.endsWith(new URL(audioUrl).pathname)

    if (!currentSrc || !urlMatches) {
      console.log("[Audio] Setting audio src before play")
      audio.src = audioUrl
      audio.load()
    }

    // Try to play
    console.log("[Audio] Calling audio.play()...")
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("[Audio] Play started successfully!")
          console.log("[Audio] After play - paused:", audio.paused, "currentTime:", audio.currentTime)
        })
        .catch((err) => {
          console.error("[Audio] Play failed:", err.name, err.message)
          // On mobile, user gesture is required - show helpful message
          if (err.name === "NotAllowedError") {
            console.log("[Audio] User gesture required, will play on next interaction")
          } else {
            setError("Unable to play audio. Try again.")
          }
        })
    }
  }, [audioUrl])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    console.log("[Audio] Toggle, current state:", playbackStateRef.current)
    if (playbackStateRef.current === "playing") {
      pause()
    } else {
      play()
    }
  }, [play, pause])

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
