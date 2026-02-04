"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/contexts/language-context"
import type { CitySelection } from "@/hooks/use-city"

interface CitySelectorProps {
  currentCity: CitySelection | null
  onSelect: (city: CitySelection) => void
}

const POPULAR_CITIES: CitySelection[] = [
  { city: "Makkah", country: "Saudi Arabia" },
  { city: "Madinah", country: "Saudi Arabia" },
  { city: "Riyadh", country: "Saudi Arabia" },
  { city: "Dubai", country: "UAE" },
  { city: "Cairo", country: "Egypt" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Karachi", country: "Pakistan" },
  { city: "Jakarta", country: "Indonesia" },
  { city: "Kuala Lumpur", country: "Malaysia" },
  { city: "London", country: "UK" },
  { city: "New York", country: "USA" },
  { city: "Toronto", country: "Canada" },
]

export function CitySelector({ currentCity, onSelect }: CitySelectorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(!currentCity)
  const [city, setCity] = useState(currentCity?.city ?? "")
  const [country, setCountry] = useState(currentCity?.country ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (city.trim() && country.trim()) {
      onSelect({ city: city.trim(), country: country.trim() })
      setIsOpen(false)
    }
  }

  const handleQuickSelect = (selection: CitySelection) => {
    setCity(selection.city)
    setCountry(selection.country)
    onSelect(selection)
    setIsOpen(false)
  }

  if (!isOpen && currentCity) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/50"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-tight">
            {currentCity.city}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {currentCity.country}
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("city.selectYourCity")}</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input
          placeholder={t("city.cityPlaceholder")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder={t("city.countryPlaceholder")}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!city.trim() || !country.trim()}>
          {t("common.set")}
        </Button>
      </form>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("city.popularCities")}</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_CITIES.map((c) => (
            <button
              key={`${c.city}-${c.country}`}
              onClick={() => handleQuickSelect(c)}
              className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
            >
              {c.city}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
