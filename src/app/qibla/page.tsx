"use client"

import { Header } from "@/components/layout/header"
import { QiblaCompass } from "@/components/qibla/compass"
import { useLocation } from "@/hooks/use-location"
import { useTranslation } from "@/contexts/language-context"

export default function QiblaPage() {
  const { location, isLoading, error } = useLocation()
  const { t } = useTranslation()

  const cityDisplay = location?.city
    ? `${location.city}${location.country ? `, ${location.country}` : ""}`
    : t("nav.qibla")

  return (
    <div className="min-h-screen">
      <Header city={cityDisplay} />

      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{t("qibla.title")}</h1>
          <p className="text-muted-foreground">{t("qibla.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex h-72 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!isLoading && <QiblaCompass location={location} />}

        <div className="mt-8 rounded-lg bg-muted p-4">
          <h2 className="mb-2 font-medium">{t("qibla.howToUse")}</h2>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>{t("qibla.instruction1")}</li>
            <li>{t("qibla.instruction2")}</li>
            <li>{t("qibla.instruction3")}</li>
            <li>{t("qibla.instruction4")}</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
