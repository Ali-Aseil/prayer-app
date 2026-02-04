"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CALCULATION_METHODS, type CalculationMethodId, type AsrSchool } from "@/types/prayer"
import { useTranslation } from "@/contexts/language-context"

const STORAGE_KEY = "prayer-app-settings"

interface Settings {
  calculationMethod: CalculationMethodId
  school: AsrSchool
  theme: "light" | "dark" | "system"
}

const defaultSettings: Settings = {
  calculationMethod: 3,
  school: 0,
  theme: "system",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const { t, language, setLanguage } = useTranslation()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) })
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", isDark)
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    if (key === "theme") {
      applyTheme(value as "light" | "dark" | "system")
    }
  }

  const themeLabels: Record<string, string> = {
    light: t("settings.themeLight"),
    dark: t("settings.themeDark"),
    system: t("settings.themeSystem"),
  }

  return (
    <div className="min-h-screen">
      <Header city={t("nav.settings")} />

      <div className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>

        {/* Calculation Method */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.calculationMethod")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-1 pr-4">
                {CALCULATION_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="calculationMethod"
                      value={method.id}
                      checked={settings.calculationMethod === method.id}
                      onChange={() => updateSetting("calculationMethod", method.id)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <span className="block text-sm font-medium">{method.label}</span>
                      <span className="text-xs text-muted-foreground">{method.region}</span>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Asr Calculation */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.asrCalculation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button
                onClick={() => updateSetting("school", 0)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  settings.school === 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="block font-medium">{t("settings.shafiStandard")}</span>
                <span className="block text-xs text-muted-foreground">{t("settings.shafiDesc")}</span>
              </button>
              <button
                onClick={() => updateSetting("school", 1)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  settings.school === 1
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="block font-medium">{t("settings.hanafi")}</span>
                <span className="block text-xs text-muted-foreground">{t("settings.hanafiDesc")}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting("theme", theme)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    settings.theme === theme
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {themeLabels[theme]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  language === "en"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  language === "ar"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                العربية
              </button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.about")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">{t("settings.aboutText")}</p>
            <p className="mb-4">{t("settings.version", { version: "1.0.0" })}</p>
            <div className="space-y-1">
              <p>{t("settings.prayerTimesApi")}</p>
              <p>{t("settings.quranApi")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
