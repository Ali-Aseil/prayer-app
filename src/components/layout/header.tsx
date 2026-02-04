"use client"

import Image from "next/image"
import { useTranslation } from "@/contexts/language-context"

interface HeaderProps {
  city?: string
  hijriDate?: string
}

export function Header({ city, hijriDate }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Prayer App"
            width={28}
            height={28}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">
              {city || t("common.prayerApp")}
            </span>
            {hijriDate && (
              <span className="text-xs text-muted-foreground" dir="rtl">
                {hijriDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
