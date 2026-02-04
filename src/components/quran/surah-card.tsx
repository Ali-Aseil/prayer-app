"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/contexts/language-context"
import type { SurahInfo } from "@/data/surahs"

interface SurahCardProps {
  surah: SurahInfo
}

export function SurahCard({ surah }: SurahCardProps) {
  const { t } = useTranslation()

  return (
    <Link href={`/quran/${surah.number}`}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3",
          "transition-colors hover:bg-muted/50"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-sm font-semibold text-emerald-600">
          {surah.number}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight truncate">
            {surah.englishName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {surah.englishNameTranslation}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg leading-tight" dir="rtl" lang="ar">
            {surah.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {surah.numberOfAyahs} {t("quran.ayahs")}
          </p>
        </div>
      </div>
    </Link>
  )
}
