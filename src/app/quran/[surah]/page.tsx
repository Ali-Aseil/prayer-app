"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const surahNumber = params.surah as string
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
            // Strip Bismillah from verse 1 for surahs other than 1 (Al-Fatiha) and 9 (At-Tawba)
            // The API includes Bismillah as part of verse 1 text, but we display it separately
            // Use NFC normalization to handle diacritics ordering differences
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
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/quran">
            <Button variant="ghost" size="icon" aria-label={t("quran.backToQuran")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">
              {surahInfo?.englishName || surahData?.englishName || t("common.loading")}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {surahInfo
                ? `${surahInfo.englishNameTranslation} - ${surahInfo.numberOfAyahs} ${t("quran.ayahs")}`
                : ""}
            </p>
          </div>
          <span className="text-xl shrink-0" dir="rtl" lang="ar">
            {surahInfo?.name || surahData?.name}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Surah Title Card */}
        {(surahInfo || surahData) && (
          <div className="mb-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 p-6 text-center">
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 text-lg font-bold text-primary">
              {surahInfo?.number || surahData?.number}
            </div>
            <h2 className="quran-arabic-large mb-1" dir="rtl" lang="ar">
              {surahInfo?.name || surahData?.name}
            </h2>
            <p className="text-sm font-medium">
              {surahInfo?.englishName || surahData?.englishName}
            </p>
            <p className="text-xs text-muted-foreground">
              {surahInfo?.englishNameTranslation || surahData?.englishNameTranslation}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {revelationLabel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {surahInfo?.numberOfAyahs || surahData?.numberOfAyahs} {t("quran.ayahs")}
              </Badge>
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
            <div className="rounded-xl bg-primary/5 p-6 text-center">
              <Skeleton className="mx-auto mb-3 h-10 w-3/4" />
              <Skeleton className="mx-auto h-4 w-1/2" />
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
              <>
                <div className="mb-2 text-center">
                  <p className="quran-arabic-large" dir="rtl" lang="ar">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Arabic Only Mode */}
            {viewMode === "arabic" && (
              <div className="quran-arabic-large text-center" dir="rtl" lang="ar">
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
              <div className="space-y-8">
                {surahData.verses.map((verse) => (
                  <div key={verse.number}>
                    <p className="quran-arabic-large text-center" dir="rtl" lang="ar">
                      {verse.text}{" "}
                      <span className="verse-badge">{verse.number}</span>
                    </p>
                    <Separator className="mt-6" />
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
