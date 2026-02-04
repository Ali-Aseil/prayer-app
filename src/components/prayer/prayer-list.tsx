"use client"

import { useMemo } from "react"
import { PrayerCard } from "./prayer-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/contexts/language-context"
import type { PrayerTimesData, PrayerName } from "@/types/prayer"
import { cn } from "@/lib/utils"

interface PrayerListProps {
  prayerTimes: PrayerTimesData | null
  isLoading?: boolean
  layout?: "vertical" | "horizontal"
}

function getNextPrayer(prayers: PrayerTimesData["prayers"]): PrayerName | null {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(":").map(Number)
    if (hours * 60 + minutes > currentTime) return prayer.name
  }
  return "fajr"
}

function getCurrentPrayer(prayers: PrayerTimesData["prayers"]): PrayerName | null {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  let currentPrayer: PrayerName | null = null

  for (const prayer of prayers) {
    if (prayer.name === "sunrise") continue
    const [hours, minutes] = prayer.time.split(":").map(Number)
    if (hours * 60 + minutes <= currentTime) currentPrayer = prayer.name
  }
  return currentPrayer
}

export function PrayerList({ prayerTimes, isLoading, layout = "vertical" }: PrayerListProps) {
  const { t } = useTranslation()

  const { nextPrayer, currentPrayer } = useMemo(() => {
    if (!prayerTimes) return { nextPrayer: null, currentPrayer: null }
    return {
      nextPrayer: getNextPrayer(prayerTimes.prayers),
      currentPrayer: getCurrentPrayer(prayerTimes.prayers),
    }
  }, [prayerTimes])

  const isHorizontal = layout === "horizontal"
  const variant = isHorizontal ? "compact" : "default"

  if (isLoading) {
    return (
      <div
        className={cn(isHorizontal ? "grid grid-cols-3 gap-2 sm:grid-cols-6" : "space-y-3")}
        role="list"
        aria-busy="true"
        aria-label={t("prayers.loadingTimes")}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!prayerTimes) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t("prayers.unableToLoad")}
      </div>
    )
  }

  return (
    <div
      className={cn(isHorizontal ? "grid grid-cols-3 gap-2 sm:grid-cols-6" : "space-y-3")}
      role="list"
      aria-label={t("nav.prayerTimes")}
    >
      {prayerTimes.prayers.map((prayer) => (
        <PrayerCard
          key={prayer.name}
          prayer={prayer}
          isNext={prayer.name === nextPrayer}
          isCurrent={prayer.name === currentPrayer && prayer.name !== nextPrayer}
          variant={variant}
        />
      ))}
    </div>
  )
}
