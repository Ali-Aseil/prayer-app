"use client"

import { Check, Volume2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { Reciter } from "@/types/quran-audio"
import { useTranslation } from "@/contexts/language-context"

interface ReciterSelectorProps {
  reciters: Reciter[]
  selectedReciter: Reciter | null
  onSelect: (reciter: Reciter) => void
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

export function ReciterSelector({
  reciters,
  selectedReciter,
  onSelect,
  isOpen,
  onClose,
  isLoading = false,
}: ReciterSelectorProps) {
  const { t, language } = useTranslation()

  const handleSelect = (reciter: Reciter) => {
    onSelect(reciter)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Volume2 className="h-5 w-5" />
            {t("quran.selectReciter")}
          </SheetTitle>
          <SheetDescription>
            {t("quran.recitersCount", { count: String(reciters.length) })}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {reciters.map((reciter) => {
              const isSelected = selectedReciter?.id === reciter.id
              return (
                <Button
                  key={reciter.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => handleSelect(reciter)}
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {language === "ar" ? reciter.nameArabic : reciter.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {language === "ar" ? reciter.name : reciter.nameArabic}
                    </div>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </Button>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

interface ReciterButtonProps {
  recitersCount: number
  onClick: () => void
  isLoading?: boolean
}

export function ReciterButton({ recitersCount, onClick, isLoading }: ReciterButtonProps) {
  const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-inherit hover:bg-white/10 gap-1.5 text-xs px-2"
      onClick={onClick}
      disabled={isLoading}
    >
      <Volume2 className="h-4 w-4" />
      {isLoading ? (
        <span className="animate-pulse">...</span>
      ) : (
        <span>{recitersCount} {t("quran.reciters")}</span>
      )}
    </Button>
  )
}
