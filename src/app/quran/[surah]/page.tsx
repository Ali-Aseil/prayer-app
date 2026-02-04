"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SURAHS } from "@/data/surahs"
import { useTranslation } from "@/contexts/language-context"

type ViewMode = "verse" | "arabic" | "translation"

interface Verse {
  number: number
  text: string
  translation: string
}

interface SurahData {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  revelationType: string
  numberOfAyahs: number
  verses: Verse[]
}

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "verse"
  return (localStorage.getItem("quran-view-mode") as ViewMode) || "verse"
}

export default function SurahPage() {
  const params = useParams()
  const rawSurah = params.surah as string
  const surahNumber = /^\d+$/.test(rawSurah) ? Math.min(Math.max(Number(rawSurah), 1), 114).toString() : "1"
  const { t, language } = useTranslation()

  const [surahData, setSurahData] = useState<SurahData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("verse")

  const surahInfo = SURAHS.find((s) => s.number === Number(surahNumber))

  useEffect(() => {
    setViewMode(getStoredViewMode())
  }, [])

  const handleViewModeChange = (mode: string) => {
    const m = mode as ViewMode
    setViewMode(m)
    localStorage.setItem("quran-view-mode", m)
  }

  useEffect(() => {
    const fetchSurah = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [arabicResponse, translationResponse] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
          fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`),
        ])

        const [arabicData, translationData] = await Promise.all([
          arabicResponse.json(),
          translationResponse.json(),
        ])

        if (arabicData.code !== 200 || translationData.code !== 200) {
          throw new Error("Failed to fetch surah data")
        }

        const surahNum = arabicData.data.number
        const verses: Verse[] = arabicData.data.ayahs.map(
          (ayah: { numberInSurah: number; text: string }, index: number) => {
            let text = ayah.text
            if (ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9) {
              const bismillah = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ".normalize("NFC")
              text = text.normalize("NFC").replace(bismillah, "").trim()
            }
            return {
              number: ayah.numberInSurah,
              text: text.trim(),
              translation: translationData.data.ayahs[index]?.text || "",
            }
          }
        )

        setSurahData({
          number: arabicData.data.number,
          name: arabicData.data.name,
          englishName: arabicData.data.englishName,
          englishNameTranslation: arabicData.data.englishNameTranslation,
          revelationType: arabicData.data.revelationType,
          numberOfAyahs: arabicData.data.numberOfAyahs,
          verses,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load surah")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurah()
  }, [surahNumber])

  const revelationLabel = surahInfo?.revelationType === "Meccan" ? t("quran.meccan") : t("quran.medinan")

  return (
    <div className="quran-page min-h-screen">
      {/* Sticky Header */}
      <header className="quran-header sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/quran">
            <Button variant="ghost" size="icon" aria-label={t("quran.backToQuran")} className="text-inherit hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="font-semibold truncate text-base" dir="rtl" lang="ar">
              {surahInfo?.name || surahData?.name}
            </h1>
            <p className="text-xs opacity-80 truncate">
              {surahInfo?.englishName || surahData?.englishName}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Surah Banner */}
        {(surahInfo || surahData) && (
          <div className="quran-surah-banner mb-6">
            <h2 className="text-2xl font-bold mb-1" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
              {surahInfo?.name || surahData?.name}
            </h2>
            <p className="text-sm opacity-90">
              {surahInfo?.englishName || surahData?.englishName} - {surahInfo?.englishNameTranslation || surahData?.englishNameTranslation}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs">
                {revelationLabel}
              </span>
              <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs">
                {surahInfo?.numberOfAyahs || surahData?.numberOfAyahs} {t("quran.ayahs")}
              </span>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="mb-6 flex justify-center">
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>
            <TabsList>
              <TabsTrigger value="verse" className="gap-1.5">
                <AlignJustify className="h-3.5 w-3.5" />
                {t("quran.viewVerse")}
              </TabsTrigger>
              <TabsTrigger value="arabic" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {t("quran.viewArabic")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="quran-surah-banner p-6 text-center">
              <Skeleton className="mx-auto mb-3 h-10 w-3/4 bg-white/20" />
              <Skeleton className="mx-auto h-4 w-1/2 bg-white/20" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="mx-auto h-8 w-full" />
                <Skeleton className="mx-auto h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {error}
          </div>
        )}

        {/* Surah Content */}
        {surahData && !isLoading && (
          <div className="pb-24">
            {/* Bismillah */}
            {surahData.number !== 9 && (
              <div className="mb-6">
                <p className="quran-bismillah" dir="rtl" lang="ar">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <div className="border-b border-[var(--quran-border,hsl(var(--border)))]" />
              </div>
            )}

            {/* Arabic Only Mode */}
            {viewMode === "arabic" && (
              <div className="quran-arabic-large leading-[3.5]" dir="rtl" lang="ar">
                {surahData.verses.map((verse) => (
                  <span key={verse.number}>
                    {verse.text}{" "}
                    <span className="verse-badge">{verse.number}</span>{" "}
                  </span>
                ))}
              </div>
            )}

            {/* Verse by Verse Mode */}
            {viewMode === "verse" && (
              <div className="space-y-6">
                {surahData.verses.map((verse) => (
                  <div key={verse.number}>
                    <p className="quran-arabic-large" dir="rtl" lang="ar">
                      {verse.text}{" "}
                      <span className="verse-badge">{verse.number}</span>
                    </p>
                    <div className="mt-4 border-b border-[var(--quran-border,hsl(var(--border)))]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
