"use client"

import { useState, useMemo } from "react"
import { Search, ArrowUpDown } from "lucide-react"
import { Header } from "@/components/layout/header"
import { SurahCard } from "@/components/quran/surah-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SURAHS } from "@/data/surahs"
import { useTranslation } from "@/contexts/language-context"

export default function QuranPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const handleSearchChange = (value: string) => setSearchQuery(value.slice(0, 50))
  const [sortAsc, setSortAsc] = useState(true)
  const [activeTab, setActiveTab] = useState("surah")
  const { t } = useTranslation()

  const filteredSurahs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    let results = SURAHS.filter(
      (surah) =>
        surah.englishName.toLowerCase().includes(query) ||
        surah.englishNameTranslation.toLowerCase().includes(query) ||
        surah.name.includes(searchQuery) ||
        surah.number.toString() === query
    )

    if (activeTab === "revelation") {
      results = results.sort((a, b) => {
        if (a.revelationType !== b.revelationType) {
          return a.revelationType === "Meccan" ? -1 : 1
        }
        return sortAsc ? a.number - b.number : b.number - a.number
      })
    } else {
      results = sortAsc
        ? [...results].sort((a, b) => a.number - b.number)
        : [...results].sort((a, b) => b.number - a.number)
    }

    return results
  }, [searchQuery, sortAsc, activeTab])

  const juzGroups = useMemo(() => {
    const groups: Record<number, typeof SURAHS> = {}
    const juzRanges = [
      [1, 2], [2, 2], [2, 3], [3, 4], [4, 4], [4, 5], [5, 6], [6, 7],
      [7, 8], [8, 9], [9, 11], [11, 12], [12, 14], [15, 16], [17, 18],
      [18, 20], [21, 22], [23, 25], [25, 27], [27, 29], [29, 33],
      [33, 36], [36, 39], [39, 41], [41, 46], [46, 51], [51, 57],
      [58, 66], [67, 77], [78, 114],
    ]
    for (let juz = 1; juz <= 30; juz++) {
      const [start, end] = juzRanges[juz - 1]
      groups[juz] = SURAHS.filter((s) => s.number >= start && s.number <= end)
    }
    return groups
  }, [])

  return (
    <div className="min-h-screen">
      <Header city={t("nav.quran")} />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("quran.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("quran.subtitle")}</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("quran.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            maxLength={50}
            className="pl-10"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="surah">{t("quran.tabSurah")}</TabsTrigger>
              <TabsTrigger value="juz">{t("quran.tabJuz")}</TabsTrigger>
              <TabsTrigger value="revelation">{t("quran.tabRevelation")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortAsc(!sortAsc)}
            className="gap-1 text-xs text-muted-foreground"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortAsc ? t("quran.sortAsc") : t("quran.sortDesc")}
          </Button>
        </div>

        {activeTab === "surah" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSurahs.map((surah) => (
              <SurahCard key={surah.number} surah={surah} />
            ))}
          </div>
        )}

        {activeTab === "juz" && (
          <div className="space-y-6">
            {Object.entries(juzGroups).map(([juz, surahs]) => {
              const filtered = surahs.filter((s) => {
                const query = searchQuery.toLowerCase().trim()
                if (!query) return true
                return (
                  s.englishName.toLowerCase().includes(query) ||
                  s.englishNameTranslation.toLowerCase().includes(query) ||
                  s.name.includes(searchQuery) ||
                  s.number.toString() === query
                )
              })
              if (filtered.length === 0) return null
              return (
                <div key={juz}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {t("quran.tabJuz")} {juz}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((surah) => (
                      <SurahCard key={surah.number} surah={surah} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "revelation" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {t("quran.meccan")} ({filteredSurahs.filter((s) => s.revelationType === "Meccan").length})
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSurahs
                  .filter((s) => s.revelationType === "Meccan")
                  .map((surah) => (
                    <SurahCard key={surah.number} surah={surah} />
                  ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {t("quran.medinan")} ({filteredSurahs.filter((s) => s.revelationType === "Medinan").length})
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSurahs
                  .filter((s) => s.revelationType === "Medinan")
                  .map((surah) => (
                    <SurahCard key={surah.number} surah={surah} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {filteredSurahs.length === 0 && activeTab !== "juz" && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            {t("quran.noResults", { query: searchQuery })}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}
