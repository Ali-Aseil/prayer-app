"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Compass, BookOpen, Settings } from "lucide-react"
import { Header } from "@/components/layout/header"
import { PrayerList } from "@/components/prayer/prayer-list"
import { CountdownTimer } from "@/components/prayer/countdown-timer"
import { VerseOfDay } from "@/components/quran/verse-of-day"
import { CitySelector } from "@/components/city-selector"
import { useCity } from "@/hooks/use-city"
import { usePrayerTimes } from "@/hooks/use-prayer-times"
import { useTranslation } from "@/contexts/language-context"
import { Skeleton } from "@/components/ui/skeleton"
import type { PrayerName } from "@/types/prayer"

function getNextPrayerIndex(prayers: { name: PrayerName; time: string }[]): number {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  for (let i = 0; i < prayers.length; i++) {
    const [h, m] = prayers[i].time.split(":").map(Number)
    if (h * 60 + m > currentTime) return i
  }
  return 0
}

export default function HomePage() {
  const { selectedCity, setCity, isLoaded } = useCity()
  const { prayerTimes, isLoading: prayerLoading, error } = usePrayerTimes(selectedCity)
  const { t, language } = useTranslation()

  const isLoading = !isLoaded || (selectedCity && prayerLoading)

  const { nextPrayer, previousPrayer } = useMemo(() => {
    if (!prayerTimes) return { nextPrayer: null, previousPrayer: null }
    const idx = getNextPrayerIndex(prayerTimes.prayers)
    const prevIdx = idx === 0 ? prayerTimes.prayers.length - 1 : idx - 1
    return {
      nextPrayer: prayerTimes.prayers[idx],
      previousPrayer: prayerTimes.prayers[prevIdx],
    }
  }, [prayerTimes])

  const dateLocale = language === "ar" ? "ar-SA" : "en-US"

  return (
    <div className="min-h-screen">
      <Header
        city={selectedCity ? `${selectedCity.city}, ${selectedCity.country}` : undefined}
        hijriDate={prayerTimes?.hijriDate}
      />

      <div className="mx-auto max-w-md px-4 py-6">
        {/* City Selector */}
        <div className="mb-6">
          <CitySelector currentCity={selectedCity} onSelect={setCity} />
        </div>

        {selectedCity && (
          <>
            {/* Hero Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {t("home.title", { city: selectedCity.city })}
              </h1>
              <div className="flex items-baseline gap-2">
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString(dateLocale, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {prayerTimes?.hijriDate && (
                  <p className="text-xs text-muted-foreground" dir="rtl">
                    {prayerTimes.hijriDay} {prayerTimes.hijriMonth} {prayerTimes.hijriYear}
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Countdown Timer */}
            {isLoading && <Skeleton className="mb-6 h-52 w-full rounded-xl" />}
            {!isLoading && nextPrayer && (
              <div className="mb-6">
                <CountdownTimer nextPrayer={nextPrayer} previousPrayer={previousPrayer} />
              </div>
            )}

            {/* Prayer Times Grid */}
            <div className="mb-6">
              <PrayerList prayerTimes={prayerTimes} isLoading={!!isLoading} layout="horizontal" />
            </div>

            {/* Quick Actions */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <Link
                href="/qibla"
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">{t("nav.qibla")}</span>
              </Link>
              <Link
                href="/quran"
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">{t("nav.quran")}</span>
              </Link>
              <Link
                href="/settings"
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">{t("nav.settings")}</span>
              </Link>
            </div>

            {/* Verse of the Day */}
            <VerseOfDay />
          </>
        )}

        {isLoaded && !selectedCity && (
          <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
            {t("home.selectCity")}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}
