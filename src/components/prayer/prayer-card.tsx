"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/contexts/language-context"
import type { PrayerName, PrayerTime } from "@/types/prayer"

interface PrayerCardProps {
  prayer: PrayerTime
  isNext?: boolean
  isCurrent?: boolean
  variant?: "default" | "compact"
}

const prayerGradients: Record<PrayerName, string> = {
  fajr: "prayer-fajr",
  sunrise: "prayer-sunrise",
  dhuhr: "prayer-dhuhr",
  asr: "prayer-asr",
  maghrib: "prayer-maghrib",
  isha: "prayer-isha",
}

export function PrayerCard({ prayer, isNext, isCurrent, variant = "default" }: PrayerCardProps) {
  const { t, language } = useTranslation()

  const prayerLabel = language === "ar" ? prayer.nameArabic : prayer.nameEnglish

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all",
          isNext
            ? "border-2 border-primary bg-primary/5 shadow-sm"
            : isCurrent
              ? "border-2 border-accent bg-accent/5"
              : "border bg-card"
        )}
        role="listitem"
        aria-current={isCurrent ? "true" : undefined}
      >
        <span
          className={cn(
            "text-xs font-medium",
            isNext ? "text-primary" : isCurrent ? "text-accent-foreground" : "text-muted-foreground"
          )}
        >
          {prayerLabel}
        </span>
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            isNext ? "text-primary" : "text-foreground"
          )}
          dir="ltr"
        >
          {prayer.time}
        </span>
        {isNext && (
          <span className="text-[0.6rem] font-medium uppercase text-primary">{t("common.next")}</span>
        )}
        {isCurrent && !isNext && (
          <span className="text-[0.6rem] font-medium uppercase text-accent-foreground">{t("common.now")}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-xl p-4 transition-all",
        isNext || isCurrent
          ? cn(prayerGradients[prayer.name], "text-white shadow-lg")
          : "bg-card border"
      )}
      role="listitem"
      aria-current={isCurrent ? "true" : undefined}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "text-lg font-semibold",
            !isNext && !isCurrent && "text-foreground"
          )}
        >
          {prayerLabel}
        </span>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            !isNext && !isCurrent && "text-foreground"
          )}
          dir="ltr"
        >
          {prayer.time}
        </span>
        {(isNext || isCurrent) && (
          <span className="text-xs text-white/80">
            {isCurrent ? t("common.current") : t("common.next")}
          </span>
        )}
      </div>

      {(isNext || isCurrent) && (
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-white" />
      )}
    </div>
  )
}
