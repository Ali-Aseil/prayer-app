"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, type Language } from "@/locales"

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = "prayer-app-language"

function getTranslation(
  lang: Language,
  key: string,
  params?: Record<string, string>
): string {
  const [namespace, ...rest] = key.split(".")
  const translationKey = rest.join(".")

  const value = translations[lang]?.[namespace]?.[translationKey]

  if (!value) {
    // Fallback to English, then to key itself
    const fallback = translations.en?.[namespace]?.[translationKey]
    if (!fallback) return key
    return applyParams(fallback, params)
  }

  return applyParams(value, params)
}

function applyParams(text: string, params?: Record<string, string>): string {
  if (!params) return text
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? "")
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "ar" || stored === "en") {
      setLanguageState(stored)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [language, mounted])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string>) => getTranslation(language, key, params),
    [language]
  )

  const dir = language === "ar" ? "rtl" : "ltr"

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
