"use client"

import { Play, Pause, Loader2, Volume2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PlaybackState } from "@/types/quran-audio"
import { useTranslation } from "@/contexts/language-context"

interface AudioPlayerBarProps {
  playbackState: PlaybackState
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  reciterName: string
  surahName: string
  onReciterClick: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  error?: string | null
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function convertToArabicNumeral(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("")
}

export function AudioPlayerBar({
  playbackState,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  reciterName,
  onReciterClick,
  currentPage,
  totalPages,
  onPageChange,
  error,
}: AudioPlayerBarProps) {
  const { t, language } = useTranslation()

  const isLoading = playbackState === "loading"
  const isPlaying = playbackState === "playing"
  const hasError = playbackState === "error" || !!error

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    onSeek(time)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="quran-audio-bar">
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 shrink-0"
        onClick={onPlayPause}
        disabled={isLoading || hasError}
        aria-label={isPlaying ? t("quran.pauseAudio") : t("quran.playAudio")}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : hasError ? (
          <AlertCircle className="h-6 w-6 text-red-400" />
        ) : isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 fill-current" />
        )}
      </Button>

      {/* Center Section: Progress or Reciter Info */}
      <div className="flex-1 mx-3 min-w-0">
        {hasError ? (
          <div className="text-xs text-red-400 truncate text-center">
            {error || t("quran.audioError")}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Progress Bar */}
            <div className="relative">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="quran-audio-progress w-full"
                disabled={!duration}
              />
              <div
                className="absolute top-1/2 left-0 h-1 bg-white/50 rounded-full -translate-y-1/2 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Time and Reciter */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                onClick={onReciterClick}
                className="flex items-center gap-1 text-white/90 hover:text-white transition-colors truncate max-w-[120px]"
              >
                <Volume2 className="h-3 w-3 shrink-0" />
                <span className="truncate" dir={language === "ar" ? "rtl" : "ltr"}>
                  {reciterName}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page Indicator */}
      <div className="quran-page-number shrink-0">
        {convertToArabicNumeral(currentPage)}
      </div>
    </div>
  )
}
