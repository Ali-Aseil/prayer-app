"use client"

import { useState, useEffect, useMemo, Fragment, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Bookmark, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SURAHS } from "@/data/surahs"
import { useTranslation } from "@/contexts/language-context"
import { useQuranAudio } from "@/hooks/use-quran-audio"
import { ReciterSelector, ReciterButton } from "@/components/quran/reciter-selector"
import { AudioPlayerBar } from "@/components/quran/audio-player-bar"

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

// Words that should be highlighted in pink (Allah's names)
const ALLAH_WORDS = [
  // Allah
  "ٱللَّهِ", "ٱللَّهَ", "ٱللَّهُ", "اللَّهِ", "اللَّهَ", "اللَّهُ", "الله", "لِلَّهِ", "بِاللَّهِ", "بِٱللَّهِ",
  "للَّهِ", "وَٱللَّهُ", "وَاللَّهُ", "فَٱللَّهُ", "خَتَمَ",
  // Names of Allah
  "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ", "الرَّحْمَنِ", "الرَّحِيمِ", "الرحمن", "الرحيم",
  // Rabb
  "رَبِّ", "رَبَّ", "رَبُّ", "رَبِّهِ", "رَبِّهِم", "رَبَّنَا", "رَبُّكَ", "رَبُّكُم", "رَّبِّهِمْ"
]

// Words that should be highlighted in green (special pious/religious terms)
const SPECIAL_WORDS = [
  // Positive religious terms
  "يُنفِقُونَ", "يُؤْمِنُونَ", "ٱلصَّلَوٰةَ", "ٱلْمُفْلِحُونَ", "هُدًى", "ٱلْمُتَّقِينَ", "لِّلْمُتَّقِينَ",
  "يُوقِنُونَ", "مُهْتَدِينَ", "مُصْلِحُونَ", "ءَامَنُوا۟", "ءَامِنُوا۟",
  // Negative/Warning terms (also highlighted in green in traditional Qurans)
  "مُّسْتَهْزِءُونَ", "غِشَـٰوَةٌ", "ٱلسُّفَهَآءُ", "يَعْمَهُونَ", "ٱلضَّلَـٰلَةَ",
  "مُفْسِدُونَ", "خَسِرَتْ", "يَخْدَعُونَ", "مَّرَضٌ", "يُخَـٰدِعُونَ", "مَرَضًا",
  "يَكْذِبُونَ", "لَا يَشْعُرُونَ", "لَا يَعْلَمُونَ", "لَا يُفْسِدُوا۟", "كَـٰفِرِينَ"
]

function highlightWord(word: string): { text: string; type: "normal" | "allah" | "special" } {
  // Check if word contains Allah's names
  for (const allahWord of ALLAH_WORDS) {
    if (word.includes(allahWord)) {
      return { text: word, type: "allah" }
    }
  }
  // Check if word is a special term
  for (const specialWord of SPECIAL_WORDS) {
    if (word.includes(specialWord)) {
      return { text: word, type: "special" }
    }
  }
  return { text: word, type: "normal" }
}

function convertToArabicNumeral(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('')
}

export default function SurahPage() {
  const params = useParams()
  const router = useRouter()
  const rawSurah = params.surah as string
  const surahNumber = /^\d+$/.test(rawSurah) ? Math.min(Math.max(Number(rawSurah), 1), 114) : 1
  const { t, language } = useTranslation()

  const [surahData, setSurahData] = useState<SurahData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isReciterModalOpen, setIsReciterModalOpen] = useState(false)

  // Audio hook
  const {
    reciters,
    selectedReciter,
    setSelectedReciter,
    isLoadingReciters,
    playbackState,
    currentTime,
    duration,
    toggle,
    seek,
    error: audioError,
  } = useQuranAudio(surahNumber)

  const surahInfo = SURAHS.find((s) => s.number === surahNumber)

  // Calculate total pages (roughly 15 verses per page)
  const versesPerPage = 15
  const totalPages = surahData ? Math.ceil(surahData.verses.length / versesPerPage) : 1

  // Touch gesture handling for swipe navigation
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 80

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null // Reset end position
    touchStartX.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    // Only process if we have both start and end positions
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null
      touchEndX.current = null
      return
    }

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    // Reset touch values
    touchStartX.current = null
    touchEndX.current = null

    if (isLeftSwipe) {
      // Swipe left = next page (for RTL content, this goes forward)
      if (currentPage < totalPages) {
        setCurrentPage(p => p + 1)
        window.scrollTo(0, 0)
      } else if (surahNumber < 114) {
        router.push(`/quran/${surahNumber + 1}`)
      }
    } else if (isRightSwipe) {
      // Swipe right = previous page (for RTL content, this goes back)
      if (currentPage > 1) {
        setCurrentPage(p => p - 1)
        window.scrollTo(0, 0)
      } else if (surahNumber > 1) {
        router.push(`/quran/${surahNumber - 1}`)
      }
    }
  }, [currentPage, totalPages, surahNumber, router])

  // Get current page verses
  const currentVerses = useMemo(() => {
    if (!surahData) return []
    const start = (currentPage - 1) * versesPerPage
    const end = start + versesPerPage
    return surahData.verses.slice(start, end)
  }, [surahData, currentPage, versesPerPage])

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
            // Remove Bismillah from first verse (except Al-Fatiha and At-Tawba)
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1)
      window.scrollTo(0, 0)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1)
      window.scrollTo(0, 0)
    }
  }

  const goToNextSurah = () => {
    if (surahNumber < 114) {
      router.push(`/quran/${surahNumber + 1}`)
    }
  }

  const goToPrevSurah = () => {
    if (surahNumber > 1) {
      router.push(`/quran/${surahNumber - 1}`)
    }
  }

  // Render verse text with highlighted words
  const renderVerseText = (text: string) => {
    const words = text.split(/(\s+)/)
    return words.map((word, idx) => {
      if (/^\s+$/.test(word)) return word
      const highlighted = highlightWord(word)
      if (highlighted.type === "allah") {
        return <span key={idx} className="quran-word-allah">{word}</span>
      }
      if (highlighted.type === "special") {
        return <span key={idx} className="quran-word-special">{word}</span>
      }
      return word
    })
  }

  const surahNameDisplay = surahInfo?.name || surahData?.name || ""
  const juzNumber = 1 // Simplified - would need proper juz calculation

  // Get reciter name for display
  const reciterDisplayName = selectedReciter
    ? (language === "ar" ? selectedReciter.nameArabic : selectedReciter.name)
    : ""

  return (
    <div className="quran-page min-h-screen flex flex-col">
      {/* Header */}
      <header className="quran-header sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left side - Bookmark, Search & Reciter */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-inherit hover:bg-white/10">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-inherit hover:bg-white/10">
              <Search className="h-5 w-5" />
            </Button>
            <ReciterButton
              recitersCount={reciters.length}
              onClick={() => setIsReciterModalOpen(true)}
              isLoading={isLoadingReciters}
            />
          </div>

          {/* Center - Surah Name */}
          <div className="flex-1 text-center min-w-0">
            <h1 className="font-semibold text-sm truncate" dir="rtl" lang="ar">
              {surahNameDisplay}، الجزء {convertToArabicNumeral(juzNumber)}
            </h1>
          </div>

          {/* Right side - Back Arrow */}
          <Link href="/quran">
            <Button variant="ghost" size="icon" className="text-inherit hover:bg-white/10">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 quran-content pb-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 p-4">
            <Skeleton className="h-24 w-full bg-[var(--quran-teal)]/20" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-[var(--quran-border)]" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive m-4">
            {error}
          </div>
        )}

        {/* Surah Content */}
        {surahData && !isLoading && (
          <>
            {/* Ornate Surah Banner - Only on first page */}
            {currentPage === 1 && (
              <div className="quran-surah-banner mb-4">
                <div className="quran-surah-banner-inner">
                  <div className="quran-surah-banner-info">
                    <span>آياتها {convertToArabicNumeral(surahData.numberOfAyahs)}</span>
                    <span>{surahData.revelationType === "Meccan" ? "مكية" : "مدنية"}</span>
                  </div>

                  <h2 className="quran-surah-banner-title" dir="rtl" lang="ar">
                    {surahData.name.replace(/سُورَةُ\s*/, "")}
                  </h2>

                  <div className="quran-surah-banner-info">
                    <span>{surahData.englishName}</span>
                    <span>{surahData.englishNameTranslation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bismillah - Only on first page and not for At-Tawba */}
            {currentPage === 1 && surahData.number !== 9 && (
              <p className="quran-bismillah" dir="rtl" lang="ar">
                بِسْمِ <span className="allah-name">اللَّهِ</span> <span className="rahman-name">الرَّحْمَٰنِ</span> <span className="rahman-name">الرَّحِيمِ</span>
              </p>
            )}

            {/* Arabic Text - Continuous Flow */}
            <div className="quran-arabic-flow" dir="rtl" lang="ar">
              {currentVerses.map((verse) => (
                <Fragment key={verse.number}>
                  {renderVerseText(verse.text)}{" "}
                  <span className="verse-badge">
                    <span>{convertToArabicNumeral(verse.number)}</span>
                  </span>{" "}
                </Fragment>
              ))}
            </div>

            {/* Navigation Hints */}
            <div className="flex justify-between items-center px-4 py-6 text-sm opacity-60">
              {currentPage > 1 ? (
                <button onClick={goToPrevPage} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  الصفحة السابقة
                </button>
              ) : surahNumber > 1 ? (
                <button onClick={goToPrevSurah} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  السورة السابقة
                </button>
              ) : (
                <span />
              )}

              {currentPage < totalPages ? (
                <button onClick={goToNextPage} className="flex items-center gap-1">
                  الصفحة التالية
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : surahNumber < 114 ? (
                <button onClick={goToNextSurah} className="flex items-center gap-1">
                  السورة التالية
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <span />
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom Audio Bar */}
      {surahData && !isLoading && (
        <AudioPlayerBar
          playbackState={playbackState}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={toggle}
          onSeek={seek}
          reciterName={reciterDisplayName}
          surahName={surahNameDisplay}
          onReciterClick={() => setIsReciterModalOpen(true)}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          error={audioError}
        />
      )}

      {/* Reciter Selector Modal */}
      <ReciterSelector
        reciters={reciters}
        selectedReciter={selectedReciter}
        onSelect={setSelectedReciter}
        isOpen={isReciterModalOpen}
        onClose={() => setIsReciterModalOpen(false)}
        isLoading={isLoadingReciters}
      />
    </div>
  )
}
