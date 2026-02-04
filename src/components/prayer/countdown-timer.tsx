"use client"

import { useCountdown } from "@/hooks/use-countdown"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import type { PrayerTime } from "@/types/prayer"

interface CountdownTimerProps {
  nextPrayer: PrayerTime
  previousPrayer: PrayerTime | null
}

function padZero(n: number): string {
  return n.toString().padStart(2, "0")
}

export function CountdownTimer({ nextPrayer, previousPrayer }: CountdownTimerProps) {
  const { hours, minutes, seconds, progress } = useCountdown(
    nextPrayer.time,
    previousPrayer?.time ?? null
  )
  const { t, language } = useTranslation()

  const prayerLabel = language === "ar" ? nextPrayer.nameArabic : nextPrayer.nameEnglish

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6",
        "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
        "text-white shadow-lg"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_50%)]" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <Badge
          variant="secondary"
          className="bg-white/10 text-white/90 hover:bg-white/20 border-white/20"
        >
          {t("common.upcoming")}
        </Badge>

        <div className="text-center">
          <h2 className="text-2xl font-semibold">{prayerLabel}</h2>
        </div>

        <div className="text-5xl font-bold tabular-nums tracking-wider" dir="ltr">
          {padZero(hours)}:{padZero(minutes)}:{padZero(seconds)}
        </div>

        <div className="w-full max-w-xs">
          <Progress
            value={progress}
            className="h-2 bg-white/20 [&>[data-slot=progress-indicator]]:bg-white/80"
          />
        </div>

        <p className="text-sm text-white/60">
          {t("home.prayerTime", { time: nextPrayer.time })}
        </p>
      </div>
    </div>
  )
}
