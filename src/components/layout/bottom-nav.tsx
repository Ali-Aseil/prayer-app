"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, Compass, BookOpen, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/contexts/language-context"

const navItems = [
  { href: "/", icon: Clock, labelKey: "prayerTimes" },
  { href: "/qibla", icon: Compass, labelKey: "qibla" },
  { href: "/quran", icon: BookOpen, labelKey: "quran" },
  { href: "/settings", icon: Settings, labelKey: "settings" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{t(`nav.${item.labelKey}`)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
