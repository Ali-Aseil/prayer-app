"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
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

function convertToArabicNumeral(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('')
}

export default function SurahPage() {
  const params = useParams()
  const router = useRouter()
  const rawSurah = params.surah as string
  const surahNumber = /^\d+$/.test(rawSurah) ? Math.min(Math.max(Number(rawSurah), 1), 114) : 1
  const { language } = useTranslation()

  const [surahData, setSurahData] = useState<SurahData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isReciterModalOpen, setIsReciterModalOpen] = useState(false)
  const [showAudioBar, setShowAudioBar] = useState(true)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Calculate total pages (roughly 10 verses per page for better readability)
  const versesPerPage = 10
  const totalPages = surahData ? Math.ceil(surahData.verses.length / versesPerPage) : 1

  // Get pages of verses
  const pages = useMemo(() => {
    if (!surahData) return []
    const result: Verse[][] = []
    for (let i = 0; i < surahData.verses.length; i += versesPerPage) {
      result.push(surahData.verses.slice(i, i + versesPerPage))
    }
    return result
  }, [surahData])

  // Handle scroll snap to update current page
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const pageWidth = container.clientWidth
    const newPage = Math.round(scrollLeft / pageWidth) + 1
    if (newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Scroll to page when currentPage changes programmatically
  const scrollToPage = (page: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const pageWidth = container.clientWidth
    container.scrollTo({
      left: (page - 1) * pageWidth,
      behavior: 'smooth'
    })
  }

  useEffect(() => {
    const fetchSurah = async () => {
      setIsLoading(true)
      setError(null)
      setCurrentPage(1)

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

  // Reset scroll position when surah changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0 })
    }
  }, [surahNumber])

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

  const surahNameDisplay = surahInfo?.name || surahData?.name || ""
  const reciterDisplayName = selectedReciter
    ? (language === "ar" ? selectedReciter.nameArabic : selectedReciter.name)
    : ""

  return (
    <div className="h-screen flex flex-col bg-[#faf8f3] overflow-hidden">
      {/* Header */}
      <header className="bg-[#1b5e4b] text-white shrink-0">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left - Reciter Button: toggles audio bar or opens reciter selector */}
          <ReciterButton
            recitersCount={reciters.length}
            onClick={() => {
              if (!showAudioBar) {
                setShowAudioBar(true)
              } else {
                setIsReciterModalOpen(true)
              }
            }}
            isLoading={isLoadingReciters}
          />

          {/* Center - Surah Info */}
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-base" dir="rtl" lang="ar">
              {surahNameDisplay}
            </h1>
            <p className="text-xs opacity-80">
              {surahData?.englishName} • {surahData?.numberOfAyahs} verses
            </p>
          </div>

          {/* Right - Back */}
          <Link href="/quran">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        </div>
      )}

      {/* Horizontal Scroll Container */}
      {surahData && !isLoading && (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex h-full" style={{ width: `${totalPages * 100}%` }}>
            {pages.map((pageVerses, pageIndex) => (
              <div
                key={pageIndex}
                className="snap-center shrink-0 w-full h-full overflow-y-auto px-4 py-6"
                style={{ width: `${100 / totalPages}%` }}
              >
                {/* Bismillah on first page */}
                {pageIndex === 0 && surahData.number !== 9 && (
                  <p className="text-center text-2xl mb-6 text-[#1b5e4b] font-amiri" dir="rtl" lang="ar">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                )}

                {/* Verses */}
                <div className="space-y-4 pb-32">
                  {pageVerses.map((verse) => (
                    <div key={verse.number} className="border-b border-[#e8e4d9] pb-4">
                      {/* Arabic Text */}
                      <p
                        className="text-2xl leading-loose text-right font-amiri text-[#2c2c2c]"
                        dir="rtl"
                        lang="ar"
                      >
                        {verse.text}
                        <span className="inline-flex items-center justify-center w-8 h-8 mx-2 text-sm bg-[#1b5e4b] text-white rounded-full">
                          {convertToArabicNumeral(verse.number)}
                        </span>
                      </p>
                    </div>
                  ))}

                  {/* End of page navigation hints */}
                  {pageIndex === pages.length - 1 && (
                    <div className="flex justify-center gap-4 pt-4">
                      {surahNumber > 1 && (
                        <button
                          onClick={goToPrevSurah}
                          className="flex items-center gap-1 text-[#1b5e4b] text-sm"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous Surah
                        </button>
                      )}
                      {surahNumber < 114 && (
                        <button
                          onClick={goToNextSurah}
                          className="flex items-center gap-1 text-[#1b5e4b] text-sm"
                        >
                          Next Surah
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Audio Bar - positioned above navigation */}
      {surahData && !isLoading && showAudioBar && (
        <div className="fixed bottom-20 left-0 right-0 z-40">
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
            onPageChange={(page) => {
              setCurrentPage(page)
              scrollToPage(page)
            }}
            error={audioError}
            onClose={() => setShowAudioBar(false)}
          />
        </div>
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
