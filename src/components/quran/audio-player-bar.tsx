"use client"

import { Play, Pause, Loader2, Volume2, AlertCircle, X } from "lucide-react"
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
  onClose?: () => void
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
  error,
  onClose,
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
    <div className="bg-[#1b5e4b] text-white p-3 mx-4 mb-4 rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 shrink-0"
          onClick={() => {
            console.log("[AudioBar] Play button clicked!")
            onPlayPause()
          }}
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

        {/* Center Section: Progress and Info */}
        <div className="flex-1 min-w-0">
          {hasError ? (
            <div className="text-xs text-red-300 truncate text-center">
              {error || t("quran.audioError")}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Progress Bar */}
              <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-white/70 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  disabled={!duration}
                />
              </div>

              {/* Time and Reciter */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button
                  onClick={onReciterClick}
                  className="flex items-center gap-1 text-white/90 hover:text-white transition-colors truncate max-w-[100px]"
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

        {/* Page Number */}
        <div className="bg-white/20 px-2 py-1 rounded-lg text-sm font-medium shrink-0">
          {convertToArabicNumeral(currentPage)}
        </div>

        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            onClick={onClose}
            aria-label="Close audio player"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
