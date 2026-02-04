"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/contexts/language-context"
import { SURAHS } from "@/data/surahs"

interface VerseData {
  arabic: string
  translation: string
  surahNumber: number
  surahName: string
  surahEnglishName: string
  ayahNumber: number
}

function getTodayKey(): string {
  const now = new Date()
  return `verse-of-day-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function getRandomAyah(): { surah: number; ayah: number } {
  const surahIndex = Math.floor(Math.random() * 114)
  const surah = SURAHS[surahIndex]
  const ayah = Math.floor(Math.random() * surah.numberOfAyahs) + 1
  return { surah: surah.number, ayah }
}

export function VerseOfDay() {
  const [verse, setVerse] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const todayKey = getTodayKey()

    const cached = localStorage.getItem(todayKey)
    if (cached) {
      try {
        setVerse(JSON.parse(cached))
        setLoading(false)
        return
      } catch {
        localStorage.removeItem(todayKey)
      }
    }

    async function fetchVerse() {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { surah, ayah } = getRandomAyah()
          const response = await fetch(
            `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-simple,en.asad`
          )

          if (!response.ok) continue

          const data = await response.json()

          if (data.code !== 200 || !data.data || data.data.length < 2) continue

          const arabicEdition = data.data[0]
          const englishEdition = data.data[1]
          const surahInfo = SURAHS.find((s) => s.number === surah)

          const verseData: VerseData = {
            arabic: arabicEdition.text,
            translation: englishEdition.text,
            surahNumber: surah,
            surahName: surahInfo?.name ?? arabicEdition.surah.name,
            surahEnglishName: surahInfo?.englishName ?? arabicEdition.surah.englishName,
            ayahNumber: ayah,
          }

          localStorage.setItem(todayKey, JSON.stringify(verseData))
          setVerse(verseData)
          setLoading(false)
          return
        } catch {
          continue
        }
      }

      setError(t("quran.unableToLoadVerse"))
      setLoading(false)
    }

    fetchVerse()
  }, [t])

  if (loading) {
    return (
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">{t("quran.verseOfDay")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !verse) {
    return (
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">{t("quran.verseOfDay")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {error ?? t("quran.unableToLoadVerse")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">{t("quran.verseOfDay")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="quran-arabic text-center text-xl leading-loose" dir="rtl" lang="ar">
          {verse.arabic}
        </p>

        <p className="quran-translation text-center text-sm text-muted-foreground leading-relaxed">
          {verse.translation}
        </p>

        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <span>{verse.surahEnglishName}</span>
          <span>-</span>
          <span>{t("quran.ayah", { number: String(verse.ayahNumber) })}</span>
        </div>

        <Link
          href={`/quran/${verse.surahNumber}`}
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          {t("quran.readFullSurah")}
        </Link>
      </CardContent>
    </Card>
  )
}
